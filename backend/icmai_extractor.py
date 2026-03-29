import fitz
import re
import json
import argparse
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()
sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
PDF_OFFSET = 8

SUBJECT_MAP = {
    "law":   {"namespace": "cma_f_law",   "paper": 1},
    "acc":   {"namespace": "cma_f_acc",   "paper": 2},
    "maths": {"namespace": "cma_f_maths", "paper": 3},
    "eco":   {"namespace": "cma_f_eco",   "paper": 4},
}

SECTION_HEADERS = [
    "Multiple Choice Questions (MCQ)",
    "State True or False",
    "Fill in the Blanks",
    "Short Essay Type Questions",
    "Answers",
]


def extract_text(pdf_path: str, start_bp: int, end_bp: int) -> str:
    doc = fitz.open(pdf_path)
    full_text = ""
    for bp in range(start_bp, end_bp + 1):
        pdf_idx = bp - 1 + PDF_OFFSET
        if 0 <= pdf_idx < len(doc):
            full_text += doc[pdf_idx].get_text() + "\n"
        else:
            print(f"  ⚠️  Book page {bp} out of range, skipping")
    doc.close()
    return full_text


def get_section(text: str, start_header: str, end_headers: list) -> str:
    start_idx = text.find(start_header)
    if start_idx == -1:
        lower = text.lower()
        start_idx = lower.find(start_header.lower())
        if start_idx == -1:
            return ""
    start_idx += len(start_header)

    end_idx = len(text)
    for eh in end_headers:
        idx = text.find(eh, start_idx)
        if idx == -1:
            idx = text.lower().find(eh.lower(), start_idx)
        if idx != -1 and idx < end_idx:
            end_idx = idx

    return text[start_idx:end_idx].strip()


def is_main_question(num: int, last_main: int) -> bool:
    """
    Determine if a number is a main question or a sub-point.

    Rules:
    1. num == last_main + 1 → definitely main question
    2. num == 1 and last_main == 0 → first question
    3. num <= last_main → sub-point (going backwards)
    4. num == 1 and last_main > 0 → sub-point reset
    5. num > last_main + 1 and num <= last_main + 3 →
       allow small gaps (some chapters skip numbers)
    6. num > last_main + 3 → sub-point that jumped ahead
    """
    if last_main == 0 and num == 1:
        return True
    if num == last_main + 1:
        return True
    if num <= last_main:
        return False
    if num == 1 and last_main > 0:
        return False
    if last_main < num <= last_main + 3:
        return True
    return False


def split_questions(section_text: str) -> list:
    """
    Split section text into question blocks.
    Handles sub-points correctly using is_main_question().
    Returns list of (num, text) tuples for main questions only.
    """
    raw_blocks = re.split(r'\n(?=\s*\d+[\.\)])', section_text)

    main_questions = []
    last_main = 0
    current_main_text = ""
    current_main_num = 0

    for block in raw_blocks:
        block = block.strip()
        if not block:
            continue

        num_match = re.match(r'^(\d+)[\.\)]\s*', block)
        if not num_match:
            if current_main_num > 0:
                current_main_text += " " + block
            continue

        num = int(num_match.group(1))

        if is_main_question(num, last_main):
            if current_main_num > 0:
                main_questions.append(
                    (current_main_num, current_main_text.strip())
                )
            current_main_num = num
            current_main_text = block[num_match.end():]
            last_main = num
        else:
            if current_main_num > 0:
                current_main_text += "\n" + block

    if current_main_num > 0:
        main_questions.append(
            (current_main_num, current_main_text.strip())
        )

    return main_questions


def parse_mcq(section_text: str) -> list:
    questions = []
    blocks = split_questions(section_text)

    for num, text in blocks:
        opt_split = re.split(r'\n?\s*\(a\)\s*', text, maxsplit=1)
        if len(opt_split) < 2:
            continue

        q_text = opt_split[0].strip().replace('\n', ' ')
        opts = "(a) " + opt_split[1]

        opt_a = re.search(r'\(a\)\s*(.+?)(?=\s*\(b\)|\Z)', opts, re.DOTALL)
        opt_b = re.search(r'\(b\)\s*(.+?)(?=\s*\(c\)|\Z)', opts, re.DOTALL)
        opt_c = re.search(r'\(c\)\s*(.+?)(?=\s*\(d\)|\Z)', opts, re.DOTALL)
        opt_d = re.search(r'\(d\)\s*(.+?)(?=\Z)', opts, re.DOTALL)

        questions.append({
            "number":   num,
            "question": q_text,
            "option_a": opt_a.group(1).strip().replace('\n', ' ') if opt_a else "",
            "option_b": opt_b.group(1).strip().replace('\n', ' ') if opt_b else "",
            "option_c": opt_c.group(1).strip().replace('\n', ' ') if opt_c else "",
            "option_d": opt_d.group(1).strip().replace('\n', ' ') if opt_d else "",
            "answer":   ""
        })

    return questions


def parse_true_false(section_text: str) -> list:
    questions = []
    blocks = split_questions(section_text)

    for num, text in blocks:
        questions.append({
            "number":   num,
            "question": text.strip().replace('\n', ' '),
            "answer":   ""
        })

    return questions


def parse_fill_blank(section_text: str) -> list:
    questions = []
    blocks = split_questions(section_text)

    for num, text in blocks:
        questions.append({
            "number":   num,
            "question": text.strip().replace('\n', ' '),
            "answer":   ""
        })

    return questions


def parse_short(section_text: str) -> list:
    questions = []
    blocks = split_questions(section_text)

    for num, text in blocks:
        lines = text.strip().split('\n')

        q_lines = []
        ans_lines = []
        found_ans = False

        for line in lines:
            line = line.strip()
            if not line:
                if q_lines:
                    found_ans = True
                continue

            if found_ans:
                ans_lines.append(line)
            elif re.match(r'^Ans\s*[:\-]', line, re.IGNORECASE):
                ans_lines.append(
                    re.sub(r'^Ans\s*[:\-]\s*', '', line,
                           flags=re.IGNORECASE)
                )
                found_ans = True
            else:
                q_lines.append(line)

        q_text = ' '.join(q_lines).strip()
        ans_text = ' '.join(ans_lines).strip()

        questions.append({
            "number":   num,
            "question": q_text,
            "answer":   ans_text
        })

    return questions


def parse_answer_key(text: str) -> tuple:
    mcq_answers = {}
    tf_answers = {}

    ans_idx = text.lower().find("answers")
    if ans_idx == -1:
        return mcq_answers, tf_answers

    ans_text = text[ans_idx:]
    mcq_idx = ans_text.lower().find("multiple choice")
    tf_idx  = ans_text.lower().find("state true or false")

    if mcq_idx != -1:
        mcq_end = tf_idx if tf_idx > mcq_idx else len(ans_text)
        mcq_ans = ans_text[mcq_idx:mcq_end]
        tokens = re.findall(r'\b(\d+|[a-dA-D])\b', mcq_ans)

        i = 0
        while i < len(tokens):
            row_nums = []
            while i < len(tokens) and tokens[i].isdigit():
                row_nums.append(int(tokens[i]))
                i += 1
            row_letters = []
            while i < len(tokens) and not tokens[i].isdigit():
                row_letters.append(tokens[i].lower())
                i += 1
            for j, n in enumerate(row_nums):
                if j < len(row_letters):
                    mcq_answers[n] = row_letters[j]

    if tf_idx != -1:
        tf_ans = ans_text[tf_idx:]
        tokens = re.findall(r'\b(\d+|[TF])\b', tf_ans)

        i = 0
        while i < len(tokens):
            row_nums = []
            while i < len(tokens) and tokens[i].isdigit():
                row_nums.append(int(tokens[i]))
                i += 1
            row_vals = []
            while i < len(tokens) and tokens[i] in ['T', 'F']:
                row_vals.append(tokens[i])
                i += 1
            for j, n in enumerate(row_nums):
                if j < len(row_vals):
                    tf_answers[n] = row_vals[j]

    return mcq_answers, tf_answers


def store_question(q: dict, q_type: str, chapter: str,
                   course: str, subject: str):
    cfg = SUBJECT_MAP.get(subject, SUBJECT_MAP["law"])

    base = {
        "course":      course,
        "level_name":  "foundation",
        "subject":     subject,
        "chapter":     int(chapter),
        "namespace":   cfg["namespace"],
        "q_type":      q_type,
        "approved":    True,
        "importance":  "tier1",
    }

    if q_type == "textbook_mcq":
        base.update({
            "question_text":  q["question"],
            "option_a":       q["option_a"],
            "option_b":       q["option_b"],
            "option_c":       q["option_c"],
            "option_d":       q["option_d"],
            "correct_option": q["answer"].upper() if q["answer"] else None,
            "explanation": (
                f"Answer: {q['answer'].upper()}. "
                f"ICMAI Ch{chapter} MCQ Q{q['number']}"
            ) if q["answer"] else "",
            "icai_reference": (
                f"ICMAI Paper {cfg['paper']}, "
                f"Ch{chapter}, MCQ Q{q['number']}"
            ),
            "marks": 2,
        })

    elif q_type == "textbook_true_false":
        base.update({
            "question_text":  q["question"],
            "option_a":       "True",
            "option_b":       "False",
            "option_c":       None,
            "option_d":       None,
            "correct_option": (
                "A" if q["answer"] == "T" else "B"
            ) if q["answer"] else None,
            "explanation":    f"Answer: {q['answer']}",
            "icai_reference": (
                f"ICMAI Paper {cfg['paper']}, "
                f"Ch{chapter}, T/F Q{q['number']}"
            ),
            "marks": 1,
        })

    elif q_type == "textbook_fill_blank":
        base.update({
            "question_text":  q["question"],
            "option_a":       q.get("answer") or "See textbook",
            "option_b":       "None of these",
            "option_c":       "Cannot be determined",
            "option_d":       "Not applicable",
            "correct_option": "A",
            "explanation":    f"Answer: {q.get('answer', '')}",
            "icai_reference": (
                f"ICMAI Paper {cfg['paper']}, "
                f"Ch{chapter}, Fill Q{q['number']}"
            ),
            "marks": 1,
        })

    elif q_type == "textbook_short":
        base.update({
            "question_text":  q["question"],
            "option_a":       None,
            "option_b":       None,
            "option_c":       None,
            "option_d":       None,
            "correct_option": None,
            "model_answer":   q.get("answer", ""),
            "explanation":    q.get("answer", ""),
            "icai_reference": (
                f"ICMAI Paper {cfg['paper']}, "
                f"Ch{chapter}, Short Q{q['number']}"
            ),
            "marks": 2,
        })

    try:
        sb.table("questions").insert(base).execute()
        label = {
            "textbook_mcq":        "MCQ",
            "textbook_true_false": "T/F",
            "textbook_fill_blank": "Fill",
            "textbook_short":      "Short",
        }.get(q_type, q_type)
        print(f"  ✅ {label} Q{q['number']}: {q['question'][:50]}...")
    except Exception as e:
        print(f"  ❌ {q_type} Q{q['number']} failed: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="ICMAI Exercise Extractor — works for all CMA Foundation subjects"
    )
    parser.add_argument("--pdf",             required=True)
    parser.add_argument("--chapter",         required=True)
    parser.add_argument("--subject",         default="law",
        choices=["law", "acc", "maths", "eco"],
        help="Subject code")
    parser.add_argument("--start-book-page", type=int, required=True)
    parser.add_argument("--end-book-page",   type=int, required=True)
    parser.add_argument("--course",          default="cma")
    parser.add_argument("--dry-run",         action="store_true")
    parser.add_argument("--debug",           action="store_true",
        help="Print raw extracted text")
    args = parser.parse_args()

    print(f"📖 ICMAI Exercise Extractor")
    print(f"   Subject: {args.subject} | "
          f"Chapter: {args.chapter} | "
          f"Pages: {args.start_book_page}–{args.end_book_page}")
    print(f"   Dry run: {args.dry_run}\n")

    full_text = extract_text(args.pdf, args.start_book_page, args.end_book_page)

    if args.debug:
        print("=== RAW TEXT (first 500 chars) ===")
        print(full_text[:500])
        print("===\n")

    mcq_text = get_section(full_text,
        "Multiple Choice Questions (MCQ)",
        ["State True or False", "Fill in the Blanks", "Short Essay", "Answers"])

    tf_text = get_section(full_text,
        "State True or False",
        ["Fill in the Blanks", "Short Essay", "Answers"])

    fill_text = get_section(full_text,
        "Fill in the Blanks",
        ["Short Essay", "Answers"])

    short_text = get_section(full_text,
        "Short Essay Type Questions",
        ["Answers"])

    mcqs   = parse_mcq(mcq_text)         if mcq_text   else []
    tfs    = parse_true_false(tf_text)   if tf_text    else []
    fills  = parse_fill_blank(fill_text) if fill_text  else []
    shorts = parse_short(short_text)     if short_text else []

    mcq_ans, tf_ans = parse_answer_key(full_text)

    for q in mcqs:
        q["answer"] = mcq_ans.get(q["number"], "")
    for q in tfs:
        q["answer"] = tf_ans.get(q["number"], "")

    total = len(mcqs) + len(tfs) + len(fills) + len(shorts)
    print(f"✅ MCQ:   {len(mcqs)}")
    print(f"✅ T/F:   {len(tfs)}")
    print(f"✅ Fill:  {len(fills)}")
    print(f"✅ Short: {len(shorts)}")
    print(f"📊 Total: {total}\n")

    print("--- MCQ (first 3) ---")
    for q in mcqs[:3]:
        print(f"  Q{q['number']}: {q['question'][:55]}")
        print(f"    (a) {q['option_a'][:35]}")
        print(f"    Ans: {q['answer']}")

    print("--- T/F (first 3) ---")
    for q in tfs[:3]:
        print(f"  Q{q['number']}: {q['question'][:55]} → {q['answer']}")

    print("--- Fill (first 3) ---")
    for q in fills[:3]:
        print(f"  Q{q['number']}: {q['question'][:55]}")

    print("--- Short (Q1–Q10) ---")
    for q in shorts[:10]:
        print(f"  Q{q['number']}: {q['question'][:70]}")
        if q['answer']:
            print(f"    Ans: {q['answer'][:100]}")

    if not args.dry_run:
        print(f"\n💾 Storing {total} questions to DB...")
        for q in mcqs:
            store_question(q, "textbook_mcq",
                           args.chapter, args.course, args.subject)
        for q in tfs:
            store_question(q, "textbook_true_false",
                           args.chapter, args.course, args.subject)
        for q in fills:
            store_question(q, "textbook_fill_blank",
                           args.chapter, args.course, args.subject)
        for q in shorts:
            store_question(q, "textbook_short",
                           args.chapter, args.course, args.subject)
        print(f"\n🎉 Complete: {total} questions stored!")
    else:
        print("\n[Dry run — nothing stored]")


if __name__ == "__main__":
    main()
