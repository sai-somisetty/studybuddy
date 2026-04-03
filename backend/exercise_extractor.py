import fitz
import re
import json
import argparse
from supabase import create_client
from dotenv import load_dotenv
import os
import random

load_dotenv()
sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
PDF_OFFSET = 8


def extract_text(pdf_path, start_bp, end_bp):
    doc = fitz.open(pdf_path)
    full_text = ""
    for bp in range(start_bp, end_bp + 1):
        pdf_idx = bp - 1 + PDF_OFFSET
        if 0 <= pdf_idx < len(doc):
            full_text += doc[pdf_idx].get_text() + "\n"
    doc.close()
    return full_text


def get_section(text, start_header, end_headers):
    """Extract text between start_header and any of end_headers"""
    start_idx = text.find(start_header)
    if start_idx == -1:
        return ""
    start_idx += len(start_header)

    end_idx = len(text)
    for eh in end_headers:
        idx = text.find(eh, start_idx)
        if idx != -1 and idx < end_idx:
            end_idx = idx

    return text[start_idx:end_idx].strip()


def parse_mcq(section_text):
    questions = []
    blocks = re.split(r'\n(?=\d+\.)', section_text)

    for block in blocks:
        block = block.strip()
        if not block:
            continue

        num_match = re.match(r'^(\d+)\.\s*', block)
        if not num_match:
            continue
        num = int(num_match.group(1))
        rest = block[num_match.end():]

        opt_split = re.split(r'\n?\s*\(a\)', rest, maxsplit=1)
        if len(opt_split) < 2:
            continue

        q_text = opt_split[0].strip()
        opts_text = "(a)" + opt_split[1]

        opt_a = re.search(r'\(a\)\s*(.+?)(?=\(b\)|\Z)', opts_text, re.DOTALL)
        opt_b = re.search(r'\(b\)\s*(.+?)(?=\(c\)|\Z)', opts_text, re.DOTALL)
        opt_c = re.search(r'\(c\)\s*(.+?)(?=\(d\)|\Z)', opts_text, re.DOTALL)
        opt_d = re.search(r'\(d\)\s*(.+?)(?=\Z)', opts_text, re.DOTALL)

        questions.append({
            "number": num,
            "question": q_text.replace('\n', ' ').strip(),
            "option_a": opt_a.group(1).strip().replace('\n', ' ') if opt_a else "",
            "option_b": opt_b.group(1).strip().replace('\n', ' ') if opt_b else "",
            "option_c": opt_c.group(1).strip().replace('\n', ' ') if opt_c else "",
            "option_d": opt_d.group(1).strip().replace('\n', ' ') if opt_d else "",
            "answer": ""
        })

    return questions


def parse_true_false(section_text):
    questions = []
    blocks = re.split(r'\n(?=\d+\.)', section_text)

    for block in blocks:
        block = block.strip()
        if not block:
            continue
        num_match = re.match(r'^(\d+)\.\s*(.+)', block, re.DOTALL)
        if not num_match:
            continue
        questions.append({
            "number": int(num_match.group(1)),
            "question": num_match.group(2).strip().replace('\n', ' '),
            "answer": ""
        })

    return questions


def parse_fill_blank(section_text):
    questions = []
    blocks = re.split(r'\n(?=\d+\.)', section_text)

    for block in blocks:
        block = block.strip()
        if not block:
            continue
        num_match = re.match(r'^(\d+)\.\s*(.+)', block, re.DOTALL)
        if not num_match:
            continue
        questions.append({
            "number": int(num_match.group(1)),
            "question": num_match.group(2).strip().replace('\n', ' '),
            "answer": ""
        })

    return questions


def parse_short(section_text):
    questions = []
    blocks = re.split(r'\n(?=\d+\.)', section_text)
    last_num = 0

    for block in blocks:
        block = block.strip()
        if not block:
            continue
        num_match = re.match(r'^(\d+)\.\s*(.+)', block, re.DOTALL)
        if not num_match:
            continue

        num = int(num_match.group(1))

        # Skip if number is not sequential (sub-points like 1. 2. inside an answer)
        if num <= last_num and num < 5:
            continue
        if num > last_num + 5:
            # Too big a jump — likely sub-point numbering
            continue

        last_num = num
        content = num_match.group(2).strip()

        ans_split = re.split(
            r'\n?\s*Ans\s*:\s*',
            content,
            maxsplit=1,
            flags=re.IGNORECASE
        )
        q_text = ans_split[0].strip().replace('\n', ' ')
        ans_text = ans_split[1].strip().replace('\n', ' ') \
            if len(ans_split) > 1 else ""

        questions.append({
            "number": num,
            "question": q_text,
            "answer": ans_text
        })

    return questions


def parse_answer_key(text):
    mcq_answers = {}
    tf_answers = {}

    ans_idx = text.lower().find("answers")
    if ans_idx == -1:
        return mcq_answers, tf_answers

    ans_text = text[ans_idx:]

    # Find MCQ section in answers
    mcq_idx = ans_text.lower().find("multiple choice")
    tf_idx = ans_text.lower().find("state true or false")

    if mcq_idx != -1:
        mcq_end = tf_idx if tf_idx > mcq_idx else len(ans_text)
        mcq_ans_text = ans_text[mcq_idx:mcq_end]

        # Extract all tokens (numbers and letters)
        tokens = re.findall(r'\b(\d+|[a-dA-D])\b', mcq_ans_text)

        # Pair up: find blocks of numbers followed by letters
        i = 0
        while i < len(tokens):
            # Collect consecutive numbers
            row_nums = []
            while i < len(tokens) and tokens[i].isdigit():
                row_nums.append(int(tokens[i]))
                i += 1
            # Collect consecutive letters
            row_letters = []
            while i < len(tokens) and not tokens[i].isdigit():
                row_letters.append(tokens[i].lower())
                i += 1
            # Match them up
            for j, n in enumerate(row_nums):
                if j < len(row_letters):
                    mcq_answers[n] = row_letters[j]

    if tf_idx != -1:
        tf_ans_text = ans_text[tf_idx:]
        tokens = re.findall(r'\b(\d+|[TF])\b', tf_ans_text)
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


def store_mcq(q, chapter, course):
    try:
        sb.table("questions").insert({
            "course": course,
            "level_name": "foundation",
            "subject": "law",
            "chapter": int(chapter),
            "namespace": "cma_f_law",
            "q_type": "textbook_mcq",
            "question_text": q["question"],
            "option_a": q["option_a"],
            "option_b": q["option_b"],
            "option_c": q["option_c"],
            "option_d": q["option_d"],
            "correct_option": q["answer"].upper() if q["answer"] else None,
            "explanation": f"ICMAI Chapter {chapter} Exercise MCQ Q{q['number']}",
            "icai_reference": f"ICMAI Paper 1, Ch{chapter}, MCQ Q{q['number']}",
            "marks": 2,
            "approved": True,
            "importance": "tier1"
        }).execute()
        print(f"  ✅ MCQ Q{q['number']}: {q['question'][:50]}...")
    except Exception as e:
        print(f"  ❌ MCQ Q{q['number']} failed: {e}")


def store_tf(q, chapter, course):
    try:
        sb.table("questions").insert({
            "course": course,
            "level_name": "foundation",
            "subject": "law",
            "chapter": int(chapter),
            "namespace": "cma_f_law",
            "q_type": "textbook_true_false",
            "question_text": q["question"],
            "option_a": "True",
            "option_b": "False",
            "option_c": None,
            "option_d": None,
            "correct_option": "A" if q["answer"] == "T" else "B",
            "explanation": f"Answer: {q['answer']}",
            "icai_reference": f"ICMAI Paper 1, Ch{chapter}, T/F Q{q['number']}",
            "marks": 1,
            "approved": True,
            "importance": "tier1"
        }).execute()
        print(f"  ✅ T/F Q{q['number']}: {q['question'][:50]}...")
    except Exception as e:
        print(f"  ❌ T/F Q{q['number']} failed: {e}")


def store_fill(q, chapter, course):
    try:
        sb.table("questions").insert({
            "course": course,
            "level_name": "foundation",
            "subject": "law",
            "chapter": int(chapter),
            "namespace": "cma_f_law",
            "q_type": "textbook_fill_blank",
            "question_text": q["question"],
            "option_a": q["answer"] if q["answer"] else "See textbook",
            "option_b": "None of these",
            "option_c": "Cannot be determined",
            "option_d": "Not applicable",
            "correct_option": "A",
            "explanation": f"Answer: {q['answer']}",
            "icai_reference": f"ICMAI Paper 1, Ch{chapter}, Fill Q{q['number']}",
            "marks": 1,
            "approved": True,
            "importance": "tier1"
        }).execute()
        print(f"  ✅ Fill Q{q['number']}: {q['question'][:50]}...")
    except Exception as e:
        print(f"  ❌ Fill Q{q['number']} failed: {e}")


def store_short(q, chapter, course):
    try:
        sb.table("questions").insert({
            "course": course,
            "level_name": "foundation",
            "subject": "law",
            "chapter": int(chapter),
            "namespace": "cma_f_law",
            "q_type": "textbook_short",
            "question_text": q["question"],
            "option_a": None,
            "option_b": None,
            "option_c": None,
            "option_d": None,
            "correct_option": None,
            "model_answer": q["answer"],
            "explanation": q["answer"],
            "icai_reference": f"ICMAI Paper 1, Ch{chapter}, Short Q{q['number']}",
            "marks": 2,
            "approved": True,
            "importance": "tier1"
        }).execute()
        print(f"  ✅ Short Q{q['number']}: {q['question'][:50]}...")
    except Exception as e:
        print(f"  ❌ Short Q{q['number']} failed: {e}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True)
    parser.add_argument("--chapter", required=True)
    parser.add_argument("--start-book-page", type=int, required=True)
    parser.add_argument("--end-book-page", type=int, required=True)
    parser.add_argument("--course", default="cma")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    print(f"📖 Extracting Chapter {args.chapter} Exercise")
    print(f"   Pages: {args.start_book_page} to {args.end_book_page}")
    print(f"   Dry run: {args.dry_run}\n")

    full_text = extract_text(args.pdf, args.start_book_page, args.end_book_page)

    print("📄 Raw text preview:")
    print(full_text[:300])
    print("...\n")

    mcq_text = get_section(full_text,
        "Multiple Choice Questions (MCQ)",
        ["State True or False", "Answers"])

    tf_text = get_section(full_text,
        "State True or False",
        ["Fill in the Blanks", "Answers"])

    fill_text = get_section(full_text,
        "Fill in the Blanks",
        ["Short Essay Type Questions", "Answers"])

    short_text = get_section(full_text,
        "Short Essay Type Questions",
        ["Answers"])

    mcqs   = parse_mcq(mcq_text)
    tfs    = parse_true_false(tf_text)
    fills  = parse_fill_blank(fill_text)
    shorts = parse_short(short_text)

    mcq_answers, tf_answers = parse_answer_key(full_text)

    for q in mcqs:
        q["answer"] = mcq_answers.get(q["number"], "")
    for q in tfs:
        q["answer"] = tf_answers.get(q["number"], "")

    print(f"✅ MCQ:   {len(mcqs)} questions")
    print(f"✅ T/F:   {len(tfs)} questions")
    print(f"✅ Fill:  {len(fills)} questions")
    print(f"✅ Short: {len(shorts)} questions")
    print(f"📊 Total: {len(mcqs)+len(tfs)+len(fills)+len(shorts)}")
    print()

    print("--- MCQ Sample ---")
    for q in mcqs[:3]:
        print(f"  Q{q['number']}: {q['question'][:60]}")
        print(f"    (a) {q['option_a'][:40]}")
        print(f"    Answer: {q['answer']}")

    print("--- T/F Sample ---")
    for q in tfs[:3]:
        print(f"  Q{q['number']}: {q['question'][:60]} → {q['answer']}")

    print("--- Fill Sample ---")
    for q in fills[:3]:
        print(f"  Q{q['number']}: {q['question'][:60]}")

    print("--- Short Sample ---")
    for q in shorts[:3]:
        print(f"  Q{q['number']}: {q['question'][:60]}")

    if not args.dry_run:
        print("\n💾 Storing to DB...")
        for q in mcqs:
            store_mcq(q, args.chapter, args.course)
        for q in tfs:
            store_tf(q, args.chapter, args.course)
        for q in fills:
            store_fill(q, args.chapter, args.course)
        for q in shorts:
            store_short(q, args.chapter, args.course)
        total = len(mcqs) + len(tfs) + len(fills) + len(shorts)
        print(f"\n🎉 Complete: {total} questions stored!")
    else:
        print("\n[Dry run — nothing stored]")


if __name__ == "__main__":
    main()
