"""
SOMI Paragraph Seeder — Reads ICMAI PDF page by page,
splits into paragraphs, stores every paragraph in Supabase.
Supports resume via progress JSON file.
"""

import argparse
import fitz  # PyMuPDF
import json
import os
import re
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# ── Supabase setup ──

def get_supabase():
    return create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))


# ── Create session_state table (run once) ──

def create_session_state_table():
    sb = get_supabase()
    sql = """
    create table if not exists session_state (
      id uuid default gen_random_uuid() primary key,
      student_id text not null,
      namespace text not null,
      concept text not null,
      current_state text not null,
      current_page integer,
      current_paragraph integer,
      current_section text,
      session_history jsonb default '[]',
      created_at timestamp default now(),
      updated_at timestamp default now()
    );
    """
    try:
        sb.rpc("exec_sql", {"query": sql}).execute()
        print("✅ session_state table created (or already exists)")
    except Exception as e:
        print(f"⚠️  Could not create session_state via RPC: {e}")
        print("   Run the SQL manually in Supabase dashboard if needed.")


# ── Detect chapter number from page text ──

def detect_chapter(text, current_chapter):
    """Look for module/chapter headings like 'Module 2' or standalone section like '2.1'"""
    # Match section numbers like 1.1, 2.3, 4.5
    section_match = re.search(r'(?:^|\n)\s*(\d+)\.(\d+)\s*(?:\n|$)', text)
    if section_match:
        return int(section_match.group(1))
    return current_chapter


# ── Detect section number from text ──

def detect_section(text):
    """Find section number like 1.1, 2.5, 3.12 in text"""
    match = re.search(r'(?:^|\n)\s*(\d+\.\d+)\s', text)
    if match:
        return match.group(1)
    # Also check if it starts with a section number
    match = re.match(r'\s*(\d+\.\d+)\s', text)
    if match:
        return match.group(1)
    return None


# ── Split page text into paragraphs ──

def split_into_paragraphs(text):
    """Split text into paragraphs by double newline or groups of 3-5 sentences."""
    # First try splitting by double newline
    raw_parts = re.split(r'\n\s*\n', text)
    paragraphs = []

    for part in raw_parts:
        cleaned = part.strip()
        cleaned = re.sub(r'\s+', ' ', cleaned)  # collapse whitespace
        if len(cleaned) < 20:
            continue

        # If paragraph is very long (>500 chars), split by sentences
        if len(cleaned) > 500:
            sentences = re.split(r'(?<=[.!?])\s+', cleaned)
            group = []
            for sent in sentences:
                group.append(sent)
                if len(group) >= 4:
                    paragraphs.append(' '.join(group))
                    group = []
            if group:
                joined = ' '.join(group)
                if len(joined) >= 20:
                    paragraphs.append(joined)
        else:
            paragraphs.append(cleaned)

    return paragraphs


# ── Progress file ──

def get_progress_path(pdf_path, course, level, subject, paper):
    base = os.path.splitext(os.path.basename(pdf_path))[0]
    return f"progress_{course}_{level}_{subject}_p{paper}.json"


def load_progress(path):
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return {"last_page": -1, "total_stored": 0, "paragraph_count": 0}


def save_progress(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


# ── Main seeder ──

def seed_paragraphs(pdf_path, course, level, paper, subject, dry_run=False):
    print(f"\n📖 SOMI Paragraph Seeder")
    print(f"   PDF: {pdf_path}")
    print(f"   {course.upper()} {level} Paper {paper} — {subject}")
    print(f"   Dry run: {dry_run}\n")

    # Open PDF
    doc = fitz.open(pdf_path)
    total_pages = doc.page_count
    print(f"📄 Total pages: {total_pages}\n")

    # Progress
    progress_path = get_progress_path(pdf_path, course, level, subject, paper)
    progress = load_progress(progress_path)
    start_page = progress["last_page"] + 1
    total_stored = progress["total_stored"]
    para_counter = progress["paragraph_count"]

    if start_page > 0:
        print(f"📌 Resuming from page {start_page + 1} (already stored {total_stored} paragraphs)\n")

    # Supabase
    sb = None
    if not dry_run:
        sb = get_supabase()

    current_chapter = 1
    current_section = "1.1"
    skipped = 0

    for page_num in range(start_page, total_pages):
        page = doc[page_num]
        text = page.get_text()

        # Skip blank/image pages
        if len(text.strip()) < 50:
            skipped += 1
            continue

        # Detect chapter from content
        detected_ch = detect_chapter(text, current_chapter)
        if detected_ch != current_chapter:
            current_chapter = detected_ch
            print(f"  📚 Detected Chapter {current_chapter} at page {page_num + 1}")

        # Detect section
        sec = detect_section(text)
        if sec:
            current_section = sec

        # Split into paragraphs
        paragraphs = split_into_paragraphs(text)

        for p_idx, para_text in enumerate(paragraphs):
            para_counter += 1
            word_count = len(para_text.split())

            # Detect section within paragraph
            para_sec = detect_section(para_text) or current_section

            row = {
                "course":           course,
                "level_name":       level,
                "paper_number":     int(paper),
                "subject":          subject,
                "chapter_number":   current_chapter,
                "section_number":   para_sec,
                "page_number":      page_num + 1,
                "paragraph_number": para_counter,
                "exact_text":       para_text,
                "word_count":       word_count,
            }

            if dry_run:
                if para_counter <= 5:
                    print(f"\n{'='*60}")
                    print(f"  Para #{para_counter} | Page {page_num+1} | Ch {current_chapter} | Sec {para_sec}")
                    print(f"  Words: {word_count}")
                    print(f"  Text: {para_text[:200]}...")
                if para_counter == 5:
                    print(f"\n{'='*60}")
                    print(f"\n✅ Dry run — showing first 5 paragraphs only.")
                    print(f"   Total pages scanned so far: {page_num + 1}")
                    print(f"   Paragraphs found so far: {para_counter}")
                    doc.close()
                    return
            else:
                try:
                    sb.table("paragraphs").insert(row).execute()
                    total_stored += 1
                except Exception as e:
                    print(f"  ❌ Store error page {page_num+1} para {p_idx+1}: {e}")

        # Save progress
        progress["last_page"] = page_num
        progress["total_stored"] = total_stored
        progress["paragraph_count"] = para_counter
        save_progress(progress_path, progress)

        # Progress log every 10 pages
        if (page_num + 1) % 10 == 0:
            print(f"  ⏳ Page {page_num+1}/{total_pages} — {total_stored} paragraphs stored")

    doc.close()

    print(f"\n🎉 Complete!")
    print(f"   Total pages: {total_pages}")
    print(f"   Skipped pages: {skipped}")
    print(f"   Total paragraphs stored: {total_stored}")
    print(f"   Progress saved to: {progress_path}")


# ── CLI ──

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SOMI Paragraph Seeder")
    parser.add_argument("--pdf",     required=True, help="Path to ICMAI PDF")
    parser.add_argument("--course",  default="cma", help="Course: cma or ca")
    parser.add_argument("--level",   default="foundation", help="Level: foundation, inter, final")
    parser.add_argument("--paper",   default="1", help="Paper number")
    parser.add_argument("--subject", default="law", help="Subject short name")
    parser.add_argument("--dry-run", action="store_true", help="Preview first 5 paragraphs without inserting")
    parser.add_argument("--create-tables", action="store_true", help="Create session_state table in Supabase")

    args = parser.parse_args()

    if args.create_tables:
        create_session_state_table()

    seed_paragraphs(
        pdf_path=args.pdf,
        course=args.course,
        level=args.level,
        paper=args.paper,
        subject=args.subject,
        dry_run=args.dry_run,
    )
