"""
SOMI Question Parser — Reads Exercise sections from textbook_structure,
parses MCQ questions (Pattern 1: all-in-one, Pattern 2: split nodes),
gets correct answers from Claude Haiku, stores in questions table.
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


# ── Step 1: Find Exercise headings ──

def find_exercise_headings(sb, course, paper):
    """Find all Exercise heading nodes."""
    r = sb.table("textbook_structure")\
        .select("reading_order, page_number, book_page_number, section_label")\
        .eq("course", course).eq("paper_number", paper)\
        .ilike("content", "Exercise")\
        .eq("node_type", "heading")\
        .order("reading_order")\
        .execute()
    return r.data


# ── Step 2: Get nodes after each Exercise ──

def get_exercise_nodes(sb, course, paper, start_order, max_nodes=200):
    """Get all nodes after an Exercise heading until we hit enough."""
    r = sb.table("textbook_structure")\
        .select("reading_order, node_type, content, page_number, book_page_number, section_label")\
        .eq("course", course).eq("paper_number", paper)\
        .gt("reading_order", start_order)\
        .order("reading_order")\
        .limit(max_nodes)\
        .execute()
    return r.data


# ── Step 3: Parse questions from nodes ──

def parse_questions_from_nodes(nodes):
    """Parse MCQ questions handling both Pattern 1 and Pattern 2."""
    questions = []
    i = 0

    while i < len(nodes):
        node = nodes[i]
        content = (node.get("content") or "").strip()

        # Skip non-question nodes (headings like "Multiple Choice Questions")
        if node["node_type"] == "heading":
            i += 1
            continue

        # Detect question start: number + period or "Q."
        q_match = re.match(r'^(\d+|Q)\.\s*(.+)', content, re.DOTALL)
        if not q_match:
            i += 1
            continue

        q_text_raw = content
        page = node.get("page_number")
        book_page = node.get("book_page_number")
        section = node.get("section_label", "")

        # Try Pattern 1: all options in same node
        opts = extract_options_from_text(q_text_raw)

        if opts and len(opts) >= 4:
            # Pattern 1 — all in one node
            q_text = extract_question_text(q_text_raw)
            questions.append({
                "question_text": q_text,
                "option_a": opts[0],
                "option_b": opts[1],
                "option_c": opts[2],
                "option_d": opts[3],
                "page_number": page,
                "book_page_number": book_page,
                "section_label": section,
            })
            i += 1
        else:
            # Pattern 2 — options in next nodes
            q_text = extract_question_text(q_text_raw)
            collected_opts = []
            j = i + 1

            while j < len(nodes) and len(collected_opts) < 4:
                next_content = (nodes[j].get("content") or "").strip()
                opt_match = re.match(r'^\(([a-d])\)\s*(.*)', next_content, re.DOTALL)
                if opt_match:
                    collected_opts.append(opt_match.group(2).strip())
                    j += 1
                else:
                    break

            if len(collected_opts) >= 4:
                questions.append({
                    "question_text": q_text,
                    "option_a": collected_opts[0],
                    "option_b": collected_opts[1],
                    "option_c": collected_opts[2],
                    "option_d": collected_opts[3],
                    "page_number": page,
                    "book_page_number": book_page,
                    "section_label": section,
                })
                i = j  # skip past consumed option nodes
            else:
                # Could not parse — skip
                i += 1

    return questions


def extract_options_from_text(text):
    """Extract options (a)(b)(c)(d) from a single text block."""
    # Match (a) ... (b) ... (c) ... (d) ...
    pattern = r'\(a\)\s*(.+?)\s*\(b\)\s*(.+?)\s*\(c\)\s*(.+?)\s*\(d\)\s*(.+)'
    match = re.search(pattern, text, re.DOTALL)
    if match:
        return [m.strip() for m in match.groups()]
    return []


def extract_question_text(text):
    """Extract just the question part, before options."""
    # Remove leading number
    text = re.sub(r'^\d+\.\s*', '', text).strip()
    text = re.sub(r'^Q\.\s*', '', text).strip()
    # Cut before first (a)
    idx = text.find('(a)')
    if idx > 0:
        text = text[:idx].strip()
    return text


# ── Step 4: Get correct answer from Claude ──

def get_correct_answer(claude, question):
    """Ask Claude Haiku for the correct answer."""
    prompt = f"""This is an ICMAI CMA Foundation Multiple Choice Question.

Question: {question['question_text']}
Options:
A: {question['option_a']}
B: {question['option_b']}
C: {question['option_c']}
D: {question['option_d']}

Which option is correct?
Return ONLY valid JSON:
{{"correct_option": 0, "explanation": "why this is correct citing ICMAI source"}}
correct_option is 0 for A, 1 for B, 2 for C, 3 for D"""

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
        return 0, "Could not parse answer"


# ── Step 5: Store in questions table ──

OPTION_MAP = {0: "A", 1: "B", 2: "C", 3: "D"}


def store_question(sb, q, correct_idx, explanation, course, paper, subject, level, chapter):
    """Insert parsed question into questions table."""
    row = {
        "course":          course,
        "level_name":      level,
        "subject":         subject,
        "chapter":         str(chapter),
        "concept":         q.get("section_label", ""),
        "namespace":       f"{course}_{level[0]}_{subject}",
        "q_type":          "textbook_exercise",
        "question_text":   q["question_text"],
        "option_a":        q["option_a"],
        "option_b":        q["option_b"],
        "option_c":        q["option_c"],
        "option_d":        q["option_d"],
        "correct_option":  OPTION_MAP.get(correct_idx, "A"),
        "explanation":     explanation,
        "icai_reference":  f"ICMAI Paper {paper}, Page {q.get('book_page_number') or q.get('page_number', '?')}",
        "importance":      "tier1",
        "approved":        True,
    }
    sb.table("questions").insert(row).execute()


# ── Main ──

def main():
    parser = argparse.ArgumentParser(description="SOMI Question Parser")
    parser.add_argument("--course", default="cma")
    parser.add_argument("--level", default="foundation")
    parser.add_argument("--paper", type=int, default=1)
    parser.add_argument("--subject", default="law")
    parser.add_argument("--dry-run", action="store_true", help="Parse and show without inserting or calling Claude")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of questions to process")

    args = parser.parse_args()

    print(f"\n📖 SOMI Question Parser")
    print(f"   {args.course.upper()} {args.level} Paper {args.paper} — {args.subject}")
    print(f"   Dry run: {args.dry_run}")
    print()

    sb = get_sb()

    # Step 1: Find Exercise headings
    exercises = find_exercise_headings(sb, args.course, args.paper)
    print(f"   Found {len(exercises)} Exercise sections")

    all_questions = []

    for ex in exercises:
        ex_order = ex["reading_order"]
        ex_section = ex.get("section_label", "?")
        ex_page = ex.get("book_page_number") or ex.get("page_number", "?")

        print(f"\n  📝 Exercise at section {ex_section}, book page {ex_page} (order {ex_order})")

        # Step 2: Get nodes after Exercise
        nodes = get_exercise_nodes(sb, args.course, args.paper, ex_order)

        # Stop at next Exercise or chapter boundary
        filtered = []
        for n in nodes:
            c = (n.get("content") or "").strip()
            # Stop if we hit another Exercise heading
            if n["node_type"] == "heading" and c.lower() == "exercise":
                break
            filtered.append(n)

        # Step 3: Parse questions
        questions = parse_questions_from_nodes(filtered)
        print(f"     Parsed {len(questions)} questions")

        # Attach chapter info
        chapter_num = ex_section.split(".")[0] if ex_section else "?"
        for q in questions:
            q["chapter"] = chapter_num

        all_questions.extend(questions)

    print(f"\n   Total questions parsed: {len(all_questions)}")

    if args.limit:
        all_questions = all_questions[:args.limit]
        print(f"   Limited to: {args.limit}")

    if args.dry_run:
        print(f"\n{'='*60}")
        print("DRY RUN — First 5 questions:")
        print(f"{'='*60}")
        for i, q in enumerate(all_questions[:5]):
            print(f"\n  Q{i+1}: {q['question_text'][:120]}")
            print(f"    A: {q['option_a'][:80]}")
            print(f"    B: {q['option_b'][:80]}")
            print(f"    C: {q['option_c'][:80]}")
            print(f"    D: {q['option_d'][:80]}")
            print(f"    [Chapter {q.get('chapter','?')}, Section {q.get('section_label','?')}, Book Page {q.get('book_page_number','-')}]")
        return

    # Step 4 & 5: Get answers from Claude and store
    claude = get_claude()
    stored = 0

    for i, q in enumerate(all_questions):
        print(f"  {i+1}/{len(all_questions)}: {q['question_text'][:60]}...", end=" ", flush=True)

        try:
            correct_idx, explanation = get_correct_answer(claude, q)
            store_question(
                sb, q, correct_idx, explanation,
                args.course, args.paper, args.subject, args.level,
                q.get("chapter", "?"),
            )
            stored += 1
            print(f"✅ Answer: {OPTION_MAP.get(correct_idx, '?')}")
        except Exception as e:
            print(f"❌ {e}")

        if (i + 1) % 10 == 0:
            print(f"  💰 {stored} stored so far")

    print(f"\n🎉 Complete!")
    print(f"   Questions stored: {stored}/{len(all_questions)}")


if __name__ == "__main__":
    main()
