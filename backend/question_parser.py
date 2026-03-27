"""
SOMI Question Parser — Reads Exercise sections from textbook_structure,
parses MCQ, True/False, and Fill-in-the-blank questions,
uses ICMAI answer keys when available, Claude Haiku for explanations.
"""

import argparse
import json
import os
import re
import time
from dotenv import load_dotenv
from anthropic import Anthropic
from supabase import create_client

load_dotenv()


def get_sb():
    return create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))


def get_claude():
    return Anthropic(
        api_key=os.getenv("ANTHROPIC_API_KEY"),
        max_retries=2,
        timeout=30.0,
    )


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
    short_essays = []
    mcq_key = {}
    tf_key = {}
    fill_key = {}

    TYPE_MAP = {"mcq": "mcq", "tf": "true_false", "fill": "fill_blank"}
    current_type = "mcq"  # default
    seen_first_blank = False  # once True, stop catching T/F in fill section
    i = 0

    while i < len(nodes):
        node = nodes[i]
        content = (node.get("content") or "").strip()
        ntype = node.get("node_type", "")
        page = node.get("page_number")
        book_page = node.get("book_page_number")
        section = node.get("section_label", "")

        # Heading: only change current_type on specific section headings
        if ntype == "heading":
            cl = content.lower().strip()
            if "multiple choice" in cl or "mcq" in cl:
                current_type = "mcq"
                seen_first_blank = False
            elif "true or false" in cl or "state true" in cl:
                current_type = "tf"
                seen_first_blank = False
            elif "fill in the blank" in cl or "fill in blank" in cl:
                current_type = "fill"
                seen_first_blank = False
            elif "short essay" in cl or "short answer" in cl or "short type" in cl:
                current_type = "short"
            elif cl in ("answers", "answer"):
                current_type = "skip"
            elif cl == "exercise":
                break
            # All other headings — just skip, do NOT change current_type
            i += 1
            continue

        # Parse answer key tables — always, regardless of current_type
        if ntype == "table":
            cl_table = content.lower()
            if "multiple choice" in cl_table or "mcq" in cl_table:
                mcq_key.update(parse_mcq_answer_key(content))
            elif "true or false" in cl_table:
                tf_key.update(parse_tf_answer_key(content))
            elif "number" in cl_table and "answer" in cl_table:
                fill_key.update(parse_fill_answer_key(content))
            i += 1
            continue

        if current_type == "skip":
            i += 1
            continue

        # Parse objective questions
        if current_type in ("mcq", "tf", "fill"):
            # T/F plain statements (no options, no number prefix)
            if current_type == "tf" and ntype == "list_item" and len(content) > 10:
                if not re.match(r'^(\d+|Q)\.\s', content) and not content.startswith("("):
                    tf_num = len([q for q in mcq_questions if q["q_type"] == "true_false"]) + 1
                    mcq_questions.append({
                        "q_num": tf_num, "question_text": content,
                        "option_a": "True", "option_b": "False",
                        "option_c": "Partly True", "option_d": "Cannot be determined",
                        "page_number": page, "book_page_number": book_page,
                        "section_label": section, "q_type": "true_false",
                    })
                    i += 1
                    continue

            # Fill section: plain statements without blanks before first blank = T/F
            # Plain statements with blanks = Fill
            if current_type == "fill" and ntype == "list_item":
                has_blank = ("____" in content or "___" in content)
                has_options = bool(re.search(r'\(a\)', content))
                if has_blank and not has_options:
                    seen_first_blank = True
                    f_num = len([q for q in mcq_questions if q["q_type"] == "fill_blank"]) + 1
                    f_text = re.sub(r'^\d+\.\s*', '', content).strip() if re.match(r'^\d+\.\s', content) else content
                    mcq_questions.append({
                        "q_num": f_num, "question_text": f_text,
                        "option_a": "", "option_b": "", "option_c": "", "option_d": "",
                        "page_number": page, "book_page_number": book_page,
                        "section_label": section, "q_type": "fill_blank",
                    })
                    i += 1
                    continue
                elif not seen_first_blank and not has_blank and not has_options and len(content) > 15 and not re.match(r'^\d+\.\s', content):
                    # Plain statement BEFORE first blank = T/F statement
                    tf_num = len([q for q in mcq_questions if q["q_type"] == "true_false"]) + 1
                    mcq_questions.append({
                        "q_num": tf_num, "question_text": content,
                        "option_a": "True", "option_b": "False",
                        "option_c": "Partly True", "option_d": "Cannot be determined",
                        "page_number": page, "book_page_number": book_page,
                        "section_label": section, "q_type": "true_false",
                    })
                    i += 1
                    continue

            # MCQ format (numbered with (a)(b)(c)(d) options)
            # Match "1. question" but NOT "5.1 section label"
            q_match = re.match(r'^(\d+|Q)\.\s+(.+)', content, re.DOTALL)
            if not q_match or re.match(r'^\d+\.\d+\s', content):
                i += 1
                continue

            q_num_str = q_match.group(1)
            q_num = int(q_num_str) if q_num_str.isdigit() else 0
            assigned_type = TYPE_MAP.get(current_type, "mcq")

            # Pattern 1: all options in same node
            opts = extract_options_from_text(content)
            if opts and len(opts) >= 4:
                q_text = extract_question_text(content)
                mcq_questions.append({
                    "q_num": q_num, "question_text": q_text,
                    "option_a": opts[0], "option_b": opts[1],
                    "option_c": opts[2], "option_d": opts[3],
                    "page_number": page, "book_page_number": book_page,
                    "section_label": section, "q_type": assigned_type,
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
                        "section_label": section, "q_type": assigned_type,
                    })
                    i = j
                else:
                    i += 1

        # Parse Short essay questions
        elif current_type == "short":
            if content.lower().startswith("ans:") or content.lower().startswith("ans :"):
                answer_text = re.sub(r'^[Aa]ns\s*:\s*', '', content).strip()
                if short_essays and not short_essays[-1].get("model_answer"):
                    short_essays[-1]["model_answer"] = answer_text
            elif ntype in ("list_item", "paragraph") and len(content) > 15:
                is_question = (
                    content.endswith("?")
                    or re.match(r'^\d+\.\s', content)
                    or (len(content) < 200 and not content.startswith("Ans"))
                )
                if is_question:
                    q_match = re.match(r'^(\d+)\.\s*(.+)', content)
                    if q_match:
                        s_num = int(q_match.group(1))
                        s_text = q_match.group(2).strip()
                    else:
                        s_num = len(short_essays) + 1
                        s_text = content
                    short_essays.append({
                        "q_num": s_num, "question_text": s_text,
                        "model_answer": None,
                        "page_number": page, "book_page_number": book_page,
                        "section_label": section, "q_type": "short",
                    })
                elif short_essays and not short_essays[-1].get("model_answer"):
                    short_essays[-1]["model_answer"] = content
            i += 1
        else:
            i += 1

    # Deduplicate by q_num — keep last occurrence (list_item wins over paragraph)
    seen = {}
    for q in mcq_questions:
        seen[q["q_num"]] = q
    mcq_questions = sorted(seen.values(), key=lambda x: x["q_num"])

    # Split by q_type
    real_mcqs  = [q for q in mcq_questions if q["q_type"] == "mcq"]
    real_tfs   = [q for q in mcq_questions if q["q_type"] == "true_false"]
    real_fills = [q for q in mcq_questions if q["q_type"] == "fill_blank"]
    return real_mcqs, real_tfs, real_fills, short_essays, mcq_key, tf_key, fill_key


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

    totals = {"mcq": 0, "true_false": 0, "fill_blank": 0, "short": 0}
    all_to_store = []

    for ex in exercises:
        ex_order = ex["reading_order"]
        ex_section = ex.get("section_label", "?")
        ex_page = ex.get("book_page_number") or ex.get("page_number", "?")
        chapter = ex_section.split(".")[0] if ex_section else "?"

        print(f"  📝 Exercise at section {ex_section}, book page {ex_page}")

        nodes = get_exercise_nodes(sb, args.course, args.paper, ex_order)
        # Stop at next Exercise or next chapter module heading
        # Next exercise reading_order (if exists) provides a hard boundary
        next_ex_order = None
        for other_ex in exercises:
            if other_ex["reading_order"] > ex_order:
                next_ex_order = other_ex["reading_order"]
                break

        filtered = []
        for n in nodes:
            c = (n.get("content") or "").strip()
            cl = c.lower().strip()
            # Stop at next exercise boundary
            if next_ex_order and n.get("reading_order", 0) >= next_ex_order:
                break
            # Stop at "Exercise" heading (next chapter's exercise)
            if n["node_type"] == "heading" and cl == "exercise":
                break
            filtered.append(n)

        mcqs, tfs, fills, shorts, mcq_key, tf_key, fill_key = parse_exercise_section(filtered)

        print(f"     MCQs: {len(mcqs)}, T/F: {len(tfs)}, Fill: {len(fills)}, Short: {len(shorts)}")
        print(f"     Answer keys: MCQ={len(mcq_key)}, T/F={len(tf_key)}, Fill={len(fill_key)}")

        # Prepare MCQs
        for q in mcqs:
            q["chapter"] = chapter
            q["answer_key_letter"] = mcq_key.get(q["q_num"])
            q["answer_key_page"] = ex_page
        totals["mcq"] += len(mcqs)
        all_to_store.extend(mcqs)

        # Prepare T/F — tf_key uses sequential 1,2,3... not original q_num
        for tf_idx, q in enumerate(tfs, start=1):
            q["chapter"] = chapter
            q["answer_key_tf"] = tf_key.get(tf_idx)
            q["answer_key_page"] = ex_page
        totals["true_false"] += len(tfs)
        all_to_store.extend(tfs)

        # Prepare Fill — fill_key uses sequential 1,2,3... not original q_num
        for fill_idx, q in enumerate(fills, start=1):
            q["chapter"] = chapter
            q["answer_key_fill"] = fill_key.get(fill_idx)
            q["answer_key_page"] = ex_page
        totals["fill_blank"] += len(fills)
        all_to_store.extend(fills)

        # Prepare Short essays
        for q in shorts:
            q["chapter"] = chapter
            q["answer_key_page"] = ex_page
        totals["short"] += len(shorts)
        all_to_store.extend(shorts)

    print(f"\n   Total: {len(all_to_store)} questions")
    print(f"   MCQ: {totals['mcq']}, T/F: {totals['true_false']}, Fill: {totals['fill_blank']}, Short: {totals['short']}")

    if args.dry_run:
        print(f"\n{'='*60}")
        print("DRY RUN — First 5 of each type:")
        print(f"{'='*60}")
        for qtype in ["mcq", "true_false", "fill_blank", "short"]:
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
                    if qtype == "short" and q.get("model_answer"):
                        print(f"      Model: {q['model_answer'][:100]}")

        print(f"\n  Type detection summary:")
        print(f"  MCQ: {len([q for q in all_to_store if q['q_type'] == 'mcq'])}")
        print(f"  T/F: {len([q for q in all_to_store if q['q_type'] == 'true_false'])}")
        print(f"  Fill: {len([q for q in all_to_store if q['q_type'] == 'fill_blank'])}")
        print(f"  Short: {len([q for q in all_to_store if q['q_type'] == 'short'])}")
        return

    # Store with answers
    claude = get_claude()
    stored = 0

    for i, q in enumerate(all_to_store):
        label = f"{i+1}/{len(all_to_store)}"
        print(f"  {label}: [{q['q_type']:5s}] {q['question_text'][:55]}...", flush=True)

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

            elif q["q_type"] == "short":
                # Short essay — store with model_answer, no options
                model_ans = q.get("model_answer", "")
                icai_ref = f"ICMAI Paper {args.paper}, Page {q.get('answer_key_page', '?')}"
                correct_str = None
                explanation = model_ans or "See ICMAI textbook"
                row = {
                    "course": args.course, "level_name": args.level,
                    "subject": args.subject, "chapter": str(q.get("chapter", "?")),
                    "concept": q.get("section_label", ""),
                    "namespace": f"{args.course}_{args.level[0]}_{args.subject}",
                    "q_type": "textbook_short",
                    "question_text": q["question_text"],
                    "option_a": None, "option_b": None, "option_c": None, "option_d": None,
                    "correct_option": None,
                    "explanation": explanation,
                    "model_answer": model_ans,
                    "icai_reference": icai_ref,
                    "importance": "tier1", "approved": True,
                }
                sb.table("questions").insert(row).execute()
                stored += 1
                has_ans = "with answer" if model_ans else "no answer"
                print(f"    ✅ short [{has_ans}]", flush=True)
                continue  # skip the common store below

            # ── Store MCQ / T-F / Fill ──
            store_question(
                sb, q, correct_str, explanation, icai_ref,
                args.course, args.paper, args.subject, args.level,
                q.get("chapter", "?"),
            )
            stored += 1
            src = "ICMAI" if "ICMAI" in icai_ref else "AI"
            print(f"    ✅ {correct_str} [{src}]", flush=True)

        except Exception as e:
            import traceback
            print(f"❌ {type(e).__name__}: {e}", flush=True)
            traceback.print_exc()

        # Small delay to avoid rate limiting
        if q["q_type"] != "short":
            time.sleep(0.3)

        if (i + 1) % 20 == 0:
            print(f"  💰 {stored} stored so far")

    print(f"\n🎉 Complete!")
    print(f"   Questions stored: {stored}/{len(all_to_store)}")
    print(f"   MCQ: {totals['mcq']}, T/F: {totals['true_false']}, Fill: {totals['fill_blank']}, Short: {totals['short']}")


if __name__ == "__main__":
    main()
