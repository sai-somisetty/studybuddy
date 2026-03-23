"""
SOMI Docling Seeder — Reads ICMAI PDF via Docling,
builds hierarchical tree in Supabase textbook_structure table.
No ChromaDB. No explanation generation during seeding.
"""

import argparse
import json
import os
import re
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()


# ── Supabase ──

def get_supabase():
    return create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))


# ── Create table ──

def create_tables():
    sb = get_supabase()
    print("Creating textbook_structure table via Supabase...")
    # We can't run raw SQL easily via supabase-py,
    # so we test if table exists by selecting from it.
    try:
        sb.table("textbook_structure").select("id").limit(1).execute()
        print("✅ textbook_structure table already exists")
    except Exception:
        print("⚠️  Table does not exist. Run this SQL in Supabase dashboard:\n")
        print(TABLE_SQL)
    return


TABLE_SQL = """
create table textbook_structure (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  page_number int,
  section_label text,
  node_type text,
  parent_id uuid references textbook_structure(id),
  reading_order serial,
  metadata jsonb,
  course text,
  level_name text,
  paper_number int,
  subject text,
  created_at timestamp default now()
);

alter table textbook_structure disable row level security;

create index on textbook_structure (section_label);
create index on textbook_structure (page_number);
create index on textbook_structure (reading_order);
create index on textbook_structure (parent_id);
"""


# ── Detect section label from text ──

def detect_section_label(text):
    """Extract section number like 1.1, 2.5.3 from start of text."""
    match = re.match(r'^\s*(\d+(?:\.\d+)+)\s', text)
    if match:
        return match.group(1)
    return None


def is_standalone_section_number(text):
    """Check if text is ONLY a section number like '2.1' or '1.3.2' with nothing else."""
    return bool(re.match(r'^\s*\d+(?:\.\d+)+\s*$', text))


# ── Map docling label to node_type ──

def map_node_type(label):
    if label == "section_header":
        return "heading"
    elif label == "text":
        return "paragraph"
    elif label == "table":
        return "table"
    elif label == "list_item":
        return "list_item"
    elif label == "picture":
        return "picture"
    else:
        return "paragraph"


# ── Progress file ──

def progress_path(course, level, subject, paper):
    return f"progress_docling_{course}_{level}_{subject}_p{paper}.json"


def load_progress(path):
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return {"last_index": -1, "total_stored": 0}


def save_progress(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


# ── Main seeder ──

def seed(pdf_path, course, level, paper, subject, dry_run=False, max_page=None):
    print(f"\n📖 SOMI Docling Seeder")
    print(f"   PDF: {pdf_path}")
    print(f"   {course.upper()} {level} Paper {paper} — {subject}")
    print(f"   Dry run: {dry_run}")
    if max_page:
        print(f"   Max page: {max_page}")
    print()

    # ── Step 1: Convert PDF with Docling ──
    print("🔄 Converting PDF with Docling (this may take a few minutes)...")
    from docling.document_converter import DocumentConverter

    converter = DocumentConverter()
    result = converter.convert(pdf_path)
    doc = result.document
    items = list(doc.iterate_items())
    print(f"✅ Docling extracted {len(items)} items\n")

    # ── Step 2: Load progress ──
    prog_path = progress_path(course, level, subject, paper)
    prog = load_progress(prog_path)
    start_idx = prog["last_index"] + 1
    total_stored = prog["total_stored"]

    if start_idx > 0:
        print(f"📌 Resuming from item {start_idx} ({total_stored} already stored)\n")

    # Supabase
    sb = None
    if not dry_run:
        sb = get_supabase()

    # ── Step 3: Iterate items and build tree ──
    last_heading_id = None
    last_heading_label = None
    current_section = None
    last_page_logged = 0
    dry_count = 0

    for idx in range(start_idx, len(items)):
        item, item_level = items[idx]

        # Get page number
        page = 0
        if hasattr(item, "prov") and item.prov:
            page = item.prov[0].page_no

        # Skip if beyond max_page
        if max_page and page > max_page:
            break

        # Get label and text
        label = item.label if hasattr(item, "label") else "text"
        node_type = map_node_type(label)

        text = ""
        if hasattr(item, "text") and item.text:
            text = item.text.strip()
        elif label == "table" and hasattr(item, "export_to_markdown"):
            text = item.export_to_markdown().strip()

        # Skip empty or tiny items
        if len(text) < 5:
            continue

        # Detect section label from:
        # 1. Heading nodes that START with a section number (e.g. "1.1.1 Sources of Law")
        # 2. Standalone text nodes that contain ONLY a section number (e.g. "2.1")
        # NOT from list items like "1.1 Sources of Law" (those are TOC entries)
        sec = None
        if node_type == "heading":
            sec = detect_section_label(text)
        elif node_type == "paragraph" and is_standalone_section_number(text):
            sec = detect_section_label(text + " ")  # add space for regex match

        if sec:
            old_ch = int(current_section.split(".")[0]) if current_section else 0
            new_ch = int(sec.split(".")[0])
            if new_ch != old_ch and old_ch > 0:
                print(f"  📚 Chapter boundary: {current_section} → {sec} at page {page}")
            current_section = sec

        # Determine parent
        parent_id = None
        if node_type == "heading":
            parent_id = None  # headings are top-level
        else:
            parent_id = last_heading_id  # paragraphs, tables, list items are children

        # Build row
        metadata = {
            "docling_label": label,
            "docling_level": item_level,
        }

        row = {
            "content":       text,
            "page_number":   page,
            "section_label": current_section or "",
            "node_type":     node_type,
            "parent_id":     parent_id,
            "metadata":      json.dumps(metadata),
            "course":        course,
            "level_name":    level,
            "paper_number":  int(paper),
            "subject":       subject,
        }

        if dry_run:
            dry_count += 1
            if dry_count <= 10:
                parent_str = last_heading_label[:40] if parent_id and last_heading_label else "ROOT"
                print(f"  Node {dry_count:2d} | pg {page:3d} | {node_type:12s} | sec={current_section or '-':8s} | parent={parent_str}")
                print(f"           {text[:90]}")
                print()
            if dry_count == 10:
                print(f"  ... showing first 10 nodes only (dry run)\n")
        else:
            try:
                result = sb.table("textbook_structure").insert(row).execute()
                inserted_id = result.data[0]["id"] if result.data else None
                total_stored += 1

                # Track heading for parent assignment
                if node_type == "heading" and inserted_id:
                    last_heading_id = inserted_id
                    last_heading_label = text
            except Exception as e:
                print(f"  ❌ Insert error item {idx}: {e}")

        # For dry run, still track headings
        if dry_run and node_type == "heading":
            last_heading_id = f"fake-{idx}"
            last_heading_label = text

        # Progress log every 10 pages
        if not dry_run and page > 0 and page != last_page_logged and page % 10 == 0:
            last_page_logged = page
            print(f"  ⏳ Page {page} — {total_stored} nodes stored")

        # Save progress periodically
        if not dry_run and idx % 50 == 0:
            prog["last_index"] = idx
            prog["total_stored"] = total_stored
            save_progress(prog_path, prog)

    # Final save
    if not dry_run:
        prog["last_index"] = len(items) - 1
        prog["total_stored"] = total_stored
        save_progress(prog_path, prog)

    print(f"\n🎉 {'Dry run complete!' if dry_run else 'Seeding complete!'}")
    print(f"   Total items from Docling: {len(items)}")
    if dry_run:
        print(f"   Nodes previewed: {min(dry_count, 10)}")
    else:
        print(f"   Total nodes stored: {total_stored}")
        print(f"   Progress saved to: {prog_path}")


# ── Lazy explanation generator (called per-node when student reaches it) ──

def generate_explanation(node_id):
    """
    Called when a student reaches a specific node.
    Fetches the node content, generates Mama explanation via Claude,
    and stores in lesson_content table.
    Not called during seeding.
    """
    from anthropic import Anthropic

    sb = get_supabase()
    claude = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    # Fetch node
    result = sb.table("textbook_structure").select("*").eq("id", node_id).execute()
    if not result.data:
        return {"error": "Node not found"}

    node = result.data[0]
    content = node["content"]
    section = node.get("section_label", "")

    # Check if explanation already exists
    existing = sb.table("lesson_content")\
        .select("*")\
        .eq("namespace", f"{node['course']}_{node['level_name'][:1]}_{node['subject']}")\
        .eq("concept", section)\
        .limit(1).execute()

    if existing.data:
        return {"explanation": json.loads(existing.data[0]["sections"]), "source": "cached"}

    # Generate
    prompt = f"""You are SOMI — AI tutor for CMA Foundation students.

ICMAI Content:
{content}

Generate a brief explanation for this content:
1. mama_explain: Explain using real Indian company example (Tata, Infosys, Amul, SBI, Zomato)
2. exam_tip: What examiner looks for, how many marks
3. kitty_ask: A confused student question in Tenglish (Telugu + English mix)

Return ONLY valid JSON:
{{"mama_explain": "...", "exam_tip": "...", "kitty_ask": "..."}}"""

    response = claude.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )

    text = response.content[0].text.strip()
    explanation = json.loads(text)

    # Store
    sb.table("lesson_content").insert({
        "namespace": f"{node['course']}_{node['level_name'][:1]}_{node['subject']}",
        "concept":   section,
        "sections":  json.dumps([explanation]),
    }).execute()

    return {"explanation": explanation, "source": "generated"}


# ── CLI ──

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SOMI Docling Seeder")
    parser.add_argument("--pdf",     required=True, help="Path to ICMAI PDF")
    parser.add_argument("--course",  default="cma", help="Course: cma or ca")
    parser.add_argument("--level",   default="foundation", help="Level")
    parser.add_argument("--paper",   default="1", help="Paper number")
    parser.add_argument("--subject", default="law", help="Subject short name")
    parser.add_argument("--dry-run", action="store_true", help="Preview without inserting")
    parser.add_argument("--max-page", type=int, default=None, help="Only process up to this page")
    parser.add_argument("--create-tables", action="store_true", help="Check/create tables")

    args = parser.parse_args()

    if args.create_tables:
        create_tables()
        print()

    seed(
        pdf_path=args.pdf,
        course=args.course,
        level=args.level,
        paper=args.paper,
        subject=args.subject,
        dry_run=args.dry_run,
        max_page=args.max_page,
    )
