"""
SOMI Question Parser — Reads Exercise sections from textbook_structure,
parses MCQ, True/False, and Fill-in-the-blank questions,
uses ICMAI answer keys when available, Claude Haiku for explanations.
"""

import argparse
import json
import os
import re
from dotenv import load_dotenv
from anthropic import Anthropic
from supabase import create_client

load_dotenv()


def get_sb():
    return create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))


def get_claude():
    return Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


OPTION_MAP = {0: "A", 1: "B", 2: "C", 3: "D"}
LETTER_TO_IDX = {"a": 0, "b": 1, "c": 2, "d": 3, "A": 0, "B": 1, "C": 2, "D": 3}


# ── Answer key parsing ──

def parse_mcq_answer_key(table_content):
    """Parse MCQ answer key table like '1 | 2 | 3\\nb | c | a\\n...'
    Returns dict: {1: 'b', 2: 'c', 3: 'a', ...}"""
    answers = {}
    lines = [l.strip() for l in table_content.split("\n") if l.strip()]
    # Skip header line containing "Multiple Choice"
    data_lines = [l for l in lines if not any(kw in l.lower() for kw in ["multiple", "choice", "mcq"])]

    i = 0
    while i + 1 < len(data_lines):
        nums = [x.strip() for x in data_lines[i].split("|")]
        vals = [x.strip() for x in data_lines[i + 1].split("|")]
        for n, v in zip(nums, vals):
            try:
                num = int(n)
                if v.lower() in LETTER_TO_IDX:
                    answers[num] = v.lower()
            except ValueError:
                pass
        i += 2
    return answers


def parse_tf_answer_key(table_content):
    """Parse True/False answer key like '1 | 2 | 3\\nF | T | F\\n...'
    Returns dict: {1: 'F', 2: 'T', ...}"""
    answers = {}
    lines = [l.strip() for l in table_content.split("\n") if l.strip()]
    data_lines = [l for l in lines if not any(kw in l.lower() for kw in ["true", "false", "state"])]

    i = 0
    while i + 1 < len(data_lines):
        nums = [x.strip() for x in data_lines[i].split("|")]
        vals = [x.strip() for x in data_lines[i + 1].split("|")]
        for n, v in zip(nums, vals):
            try:
                num = int(n)
                if v.upper() in ("T", "F", "TRUE", "FALSE"):
                    answers[num] = v.upper()[0]  # T or F
            except ValueError:
                pass
        i += 2
    return answers


def parse_fill_answer_key(table_content):
    """Parse fill-in-blanks answer key like 'Number | Answer | Number | Answer\\n1 | Set | 2 | Regulation'
    Returns dict: {1: 'Set', 2: 'Regulation', ...}"""
    answers = {}
    lines = [l.strip() for l in table_content.split("\n") if l.strip()]
    for line in lines:
        if "number" in line.lower() and "answer" in line.lower():
            continue  # skip header
        parts = [x.strip() for x in line.split("|")]
        i = 0
        while i + 1 < len(parts):
            try:
                num = int(parts[i])
                answers[num] = parts[i + 1]
                i += 2
            except ValueError:
                i += 1
    return answers


# ── Find exercise sections and answer keys ──

def find_exercise_headings(sb, course, paper):
    r = sb.table("textbook_structure")\
        .select("reading_order, page_number, book_page_number, section_label")\
        .eq("course", course).eq("paper_number", paper)\
        .ilike("content", "Exercise")\
        .eq("node_type", "heading")\
        .order("reading_order")\
        .execute()
    return r.data


def get_exercise_nodes(sb, course, paper, start_order, max_nodes=300):
    r = sb.table("textbook_structure")\
        .select("reading_order, node_type, content, page_number, book_page_number, section_label")\
        .eq("course", course).eq("paper_number", paper)\
        .gt("reading_order", start_order)\
        .order("reading_order")\
        .limit(max_nodes)\
        .execute()
    return r.data


# ── Parse different question types from exercise nodes ──

def parse_exercise_section(nodes):
    """Parse all question types from exercise nodes. Returns categorized questions."""
    mcq_questions = []
    tf_statements = []
    fill_blanks = []
    mcq_key = {}
    tf_key = {}
    fill_key = {}

    current_type = "mcq"  # default
    i = 0

    while i < len(nodes):
        node = nodes[i]
        content = (node.get("content") or "").strip()
        ntype = node.get("node_type", "")
        page = node.get("page_number")
        book_page = node.get("book_page_number")
        section = node.get("section_label", "")

        # Detect section type changes
        if ntype == "heading":
            cl = content.lower()
            if "true or false" in cl:
                current_type = "tf"
                i += 1
                continue
            elif "fill in the blank" in cl:
                current_type = "fill"
                i += 1
                continue
            elif "multiple choice" in cl or "mcq" in cl:
                current_type = "mcq"
                i += 1
                continue
            elif "short essay" in cl or "answers" in cl.lower():
                current_type = "skip"
                i += 1
                continue
            elif cl == "exercise":
                break  # next chapter exercise
            else:
                i += 1
                continue

        # Parse answer key tables
        if ntype == "table":
            if "multiple choice" in content.lower() or "mcq" in content.lower():
                mcq_key.update(parse_mcq_answer_key(content))
            elif "true or false" in content.lower():
                tf_key.update(parse_tf_answer_key(content))
            elif "number" in content.lower() and "answer" in content.lower():
                fill_key.update(parse_fill_answer_key(content))
            i += 1
            continue

        if current_type == "skip":
            i += 1
            continue

        # Parse MCQ questions
        if current_type == "mcq":
            q_match = re.match(r'^(\d+|Q)\.\s*(.+)', content, re.DOTALL)
            if not q_match:
                i += 1
                continue

            q_num_str = q_match.group(1)
            q_num = int(q_num_str) if q_num_str.isdigit() else 0

            # Pattern 1: all options in same node
            opts = extract_options_from_text(content)
            if opts and len(opts) >= 4:
                q_text = extract_question_text(content)
                mcq_questions.append({
                    "q_num": q_num, "question_text": q_text,
                    "option_a": opts[0], "option_b": opts[1],
                    "option_c": opts[2], "option_d": opts[3],
                    "page_number": page, "book_page_number": book_page,
                    "section_label": section, "q_type": "mcq",
                })
                i += 1
            else:
                # Pattern 2: split nodes
                q_text = extract_question_text(content)
                collected = []
                j = i + 1
                while j < len(nodes) and len(collected) < 4:
                    nc = (nodes[j].get("content") or "").strip()
                    opt_match = re.match(r'^\(([a-d])\)\s*(.*)', nc, re.DOTALL)
                    if opt_match:
                        collected.append(opt_match.group(2).strip())
                        j += 1
                    else:
                        break
                if len(collected) >= 4:
                    mcq_questions.append({
                        "q_num": q_num, "question_text": q_text,
                        "option_a": collected[0], "option_b": collected[1],
                        "option_c": collected[2], "option_d": collected[3],
                        "page_number": page, "book_page_number": book_page,
                        "section_label": section, "q_type": "mcq",
                    })
                    i = j
                else:
                    i += 1

        # Parse True/False statements
        elif current_type == "tf":
            if ntype == "list_item" and len(content) > 10:
                # Extract question number if present
                tf_match = re.match(r'^(\d+)\.\s*(.+)', content)
                if tf_match:
                    tf_num = int(tf_match.group(1))
                    tf_text = tf_match.group(2).strip()
                else:
                    tf_num = len(tf_statements) + 1
                    tf_text = content
                tf_statements.append({
                    "q_num": tf_num, "question_text": tf_text,
                    "option_a": "True", "option_b": "False",
                    "option_c": "Partly True", "option_d": "Cannot be determined",
                    "page_number": page, "book_page_number": book_page,
                    "section_label": section, "q_type": "true_false",
                })
            i += 1

        # Parse Fill in the blanks
        elif current_type == "fill":
            if ntype == "list_item" and ("____" in content or "……" in content or "........" in content or "___" in content):
                fill_match = re.match(r'^(\d+)\.\s*(.+)', content)
                if fill_match:
                    f_num = int(fill_match.group(1))
                    f_text = fill_match.group(2).strip()
                else:
                    f_num = len(fill_blanks) + 1
                    f_text = content
                fill_blanks.append({
                    "q_num": f_num, "question_text": f_text,
                    "page_number": page, "book_page_number": book_page,
                    "section_label": section, "q_type": "fill_blank",
                })
            i += 1
        else:
            i += 1

    return mcq_questions, tf_statements, fill_blanks, mcq_key, tf_key, fill_key


def extract_options_from_text(text):
    pattern = r'\(a\)\s*(.+?)\s*\(b\)\s*(.+?)\s*\(c\)\s*(.+?)\s*\(d\)\s*(.+)'
    match = re.search(pattern, text, re.DOTALL)
    if match:
        return [m.strip() for m in match.groups()]
    return []


def extract_question_text(text):
    text = re.sub(r'^\d+\.\s*', '', text).strip()
    text = re.sub(r'^Q\.\s*', '', text).strip()
    idx = text.find('(a)')
    if idx > 0:
        text = text[:idx].strip()
    return text


# ── Claude for explanations ──

def get_explanation(claude, question, correct_answer):
    """Ask Claude Haiku WHY the correct answer is correct."""
    q = question["question_text"]
    prompt = f"""This is an ICMAI CMA Foundation question.
Question: {q}
Correct Answer: {correct_answer}

Explain in 1-2 sentences WHY this answer is correct, citing the relevant ICMAI/Indian law source.
Return ONLY the explanation text, no JSON."""

    r = claude.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}],
    )
    return r.content[0].text.strip()


def get_mcq_answer_from_claude(claude, question):
    """Fallback: ask Claude for correct MCQ answer when no answer key."""
    prompt = f"""This is an ICMAI CMA Foundation MCQ.
Question: {question['question_text']}
A: {question['option_a']}
B: {question['option_b']}
C: {question['option_c']}
D: {question['option_d']}

Return ONLY valid JSON:
{{"correct_option": 0, "explanation": "why correct"}}
correct_option: 0=A, 1=B, 2=C, 3=D"""

    r = claude.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )
    text = r.content[0].text.strip()
    if "```" in text:
        for part in text.split("```"):
            part = part.strip()
            if part.startswith("json"):
                part = part[4:]
            part = part.strip()
            if part.startswith("{"):
                text = part
                break
    try:
        data = json.loads(text)
        return data.get("correct_option", 0), data.get("explanation", "")
    except json.JSONDecodeError:
        return 0, "Could not determine answer"


# ── Store ──

def store_question(sb, q, correct_option_str, explanation, icai_ref, course, paper, subject, level, chapter):
    row = {
        "course":          course,
        "level_name":      level,
        "subject":         subject,
        "chapter":         str(chapter),
        "concept":         q.get("section_label", ""),
        "namespace":       f"{course}_{level[0]}_{subject}",
        "q_type":          f"textbook_{q['q_type']}",
        "question_text":   q["question_text"],
        "option_a":        q.get("option_a", ""),
        "option_b":        q.get("option_b", ""),
        "option_c":        q.get("option_c", ""),
        "option_d":        q.get("option_d", ""),
        "correct_option":  correct_option_str,
        "explanation":     explanation,
        "icai_reference":  icai_ref,
        "importance":      "tier1",
        "approved":        True,
    }
    sb.table("questions").insert(row).execute()


# ── Main ──

def main():
    parser = argparse.ArgumentParser(description="SOMI Question Parser v2")
    parser.add_argument("--course", default="cma")
    parser.add_argument("--level", default="foundation")
    parser.add_argument("--paper", type=int, default=1)
    parser.add_argument("--subject", default="law")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--clear-old", action="store_true", help="Delete old textbook_exercise questions first")

    args = parser.parse_args()

    print(f"\n📖 SOMI Question Parser v2")
    print(f"   {args.course.upper()} {args.level} Paper {args.paper} — {args.subject}")
    print(f"   Dry run: {args.dry_run}")
    print()

    sb = get_sb()

    if args.clear_old and not args.dry_run:
        r = sb.table("questions")\
            .delete()\
            .eq("course", args.course)\
            .ilike("q_type", "textbook_%")\
            .execute()
        print(f"   Cleared {len(r.data)} old textbook questions")

    exercises = find_exercise_headings(sb, args.course, args.paper)
    print(f"   Found {len(exercises)} Exercise sections\n")

    totals = {"mcq": 0, "true_false": 0, "fill_blank": 0}
    all_to_store = []

    for ex in exercises:
        ex_order = ex["reading_order"]
        ex_section = ex.get("section_label", "?")
        ex_page = ex.get("book_page_number") or ex.get("page_number", "?")
        chapter = ex_section.split(".")[0] if ex_section else "?"

        print(f"  📝 Exercise at section {ex_section}, book page {ex_page}")

        nodes = get_exercise_nodes(sb, args.course, args.paper, ex_order)
        # Stop at next Exercise
        filtered = []
        for n in nodes:
            c = (n.get("content") or "").strip()
            if n["node_type"] == "heading" and c.lower() == "exercise":
                break
            filtered.append(n)

        mcqs, tfs, fills, mcq_key, tf_key, fill_key = parse_exercise_section(filtered)

        print(f"     MCQs: {len(mcqs)}, T/F: {len(tfs)}, Fill: {len(fills)}")
        print(f"     Answer keys: MCQ={len(mcq_key)}, T/F={len(tf_key)}, Fill={len(fill_key)}")

        # Prepare MCQs
        for q in mcqs:
            q["chapter"] = chapter
            q["answer_key_letter"] = mcq_key.get(q["q_num"])
            q["answer_key_page"] = ex_page
        totals["mcq"] += len(mcqs)
        all_to_store.extend(mcqs)

        # Prepare T/F
        for q in tfs:
            q["chapter"] = chapter
            q["answer_key_tf"] = tf_key.get(q["q_num"])
            q["answer_key_page"] = ex_page
        totals["true_false"] += len(tfs)
        all_to_store.extend(tfs)

        # Prepare Fill
        for q in fills:
            q["chapter"] = chapter
            q["answer_key_fill"] = fill_key.get(q["q_num"])
            q["answer_key_page"] = ex_page
        totals["fill_blank"] += len(fills)
        all_to_store.extend(fills)

    print(f"\n   Total: {len(all_to_store)} questions")
    print(f"   MCQ: {totals['mcq']}, True/False: {totals['true_false']}, Fill: {totals['fill_blank']}")

    if args.dry_run:
        print(f"\n{'='*60}")
        print("DRY RUN — First 5 of each type:")
        print(f"{'='*60}")
        for qtype in ["mcq", "true_false", "fill_blank"]:
            items = [q for q in all_to_store if q["q_type"] == qtype][:5]
            if items:
                print(f"\n  --- {qtype.upper()} ---")
                for q in items:
                    key_info = ""
                    if qtype == "mcq":
                        key_info = f" [ICMAI key: {q.get('answer_key_letter', 'none')}]"
                    elif qtype == "true_false":
                        key_info = f" [ICMAI key: {q.get('answer_key_tf', 'none')}]"
                    elif qtype == "fill_blank":
                        key_info = f" [ICMAI key: {q.get('answer_key_fill', 'none')}]"
                    print(f"    Q{q['q_num']}: {q['question_text'][:100]}{key_info}")
                    if qtype == "mcq":
                        print(f"      A: {q['option_a'][:60]}")
                        print(f"      B: {q['option_b'][:60]}")
                        print(f"      C: {q['option_c'][:60]}")
                        print(f"      D: {q['option_d'][:60]}")
        return

    # Store with answers
    claude = get_claude()
    stored = 0

    for i, q in enumerate(all_to_store):
        label = f"{i+1}/{len(all_to_store)}"
        print(f"  {label}: [{q['q_type']:5s}] {q['question_text'][:55]}...", end=" ", flush=True)

        try:
            if q["q_type"] == "mcq":
                key_letter = q.get("answer_key_letter")
                if key_letter:
                    correct_idx = LETTER_TO_IDX[key_letter]
                    correct_str = key_letter.upper()
                    explanation = get_explanation(claude, q, f"Option {correct_str}: {q[f'option_{key_letter}']}")
                    icai_ref = f"ICMAI Answer Key, Paper {args.paper}, Page {q.get('answer_key_page', '?')}"
                else:
                    correct_idx, explanation = get_mcq_answer_from_claude(claude, q)
                    correct_str = OPTION_MAP.get(correct_idx, "A")
                    icai_ref = "AI verified"

            elif q["q_type"] == "true_false":
                key_tf = q.get("answer_key_tf")
                if key_tf:
                    correct_str = "A" if key_tf == "T" else "B"
                    answer_word = "True" if key_tf == "T" else "False"
                    explanation = get_explanation(claude, q, answer_word)
                    icai_ref = f"ICMAI Answer Key, Paper {args.paper}, Page {q.get('answer_key_page', '?')}"
                else:
                    correct_idx, explanation = get_mcq_answer_from_claude(claude, q)
                    correct_str = OPTION_MAP.get(correct_idx, "A")
                    icai_ref = "AI verified"

            elif q["q_type"] == "fill_blank":
                key_fill = q.get("answer_key_fill")
                if key_fill:
                    q["option_a"] = key_fill
                    q["option_b"] = "None of these"
                    q["option_c"] = "Cannot be determined"
                    q["option_d"] = "Not applicable"
                    correct_str = "A"
                    explanation = get_explanation(claude, q, key_fill)
                    icai_ref = f"ICMAI Answer Key, Paper {args.paper}, Page {q.get('answer_key_page', '?')}"
                else:
                    q["option_a"] = "See explanation"
                    q["option_b"] = ""
                    q["option_c"] = ""
                    q["option_d"] = ""
                    correct_str = "A"
                    explanation = get_explanation(claude, q, "the correct answer")
                    icai_ref = "AI verified"

            store_question(
                sb, q, correct_str, explanation, icai_ref,
                args.course, args.paper, args.subject, args.level,
                q.get("chapter", "?"),
            )
            stored += 1
            src = "ICMAI" if "ICMAI" in icai_ref else "AI"
            print(f"✅ {correct_str} [{src}]")

        except Exception as e:
            print(f"❌ {e}")

        if (i + 1) % 20 == 0:
            print(f"  💰 {stored} stored so far")

    print(f"\n🎉 Complete!")
    print(f"   Questions stored: {stored}/{len(all_to_store)}")
    print(f"   MCQ: {totals['mcq']}, T/F: {totals['true_false']}, Fill: {totals['fill_blank']}")


if __name__ == "__main__":
    main()
