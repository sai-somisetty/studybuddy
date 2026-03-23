"""
SOMI Vision to Supabase — Reads vision_raw JSON file,
structures data into textbook_structure table.
No Claude API calls. ₹0 cost. Can be rerun any time.
"""

import argparse
import json
import os
import re
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()


def get_supabase():
    return create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))


def main():
    parser = argparse.ArgumentParser(description="SOMI Vision to Supabase")
    parser.add_argument("--input", required=True, help="Path to vision_raw JSON")
    parser.add_argument("--course", default="cma")
    parser.add_argument("--level", default="foundation")
    parser.add_argument("--paper", default="1")
    parser.add_argument("--subject", default="law")
    parser.add_argument("--dry-run", action="store_true", help="Preview without inserting")
    parser.add_argument("--clear", action="store_true", help="Delete existing rows first")

    args = parser.parse_args()

    print(f"\n📖 SOMI Vision → Supabase")
    print(f"   Input: {args.input}")
    print(f"   {args.course.upper()} {args.level} Paper {args.paper} — {args.subject}")
    print(f"   Dry run: {args.dry_run}")
    print()

    # Load vision data
    with open(args.input) as f:
        data = json.load(f)

    pages = [p for p in data["pages"] if p.get("processed") and not p.get("error")]
    pages.sort(key=lambda p: p["page_number"])
    print(f"   Pages to process: {len(pages)}")

    sb = None
    if not args.dry_run:
        sb = get_supabase()

        if args.clear:
            r = sb.table("textbook_structure")\
                .delete()\
                .eq("course", args.course)\
                .eq("paper_number", int(args.paper))\
                .execute()
            print(f"   Cleared {len(r.data)} existing rows")

    total_nodes = 0
    last_heading_id = None
    current_section = None
    current_chapter = None

    for page_data in pages:
        page_num = page_data["page_number"]
        resp = page_data.get("claude_response", {})

        if resp.get("page_type") in ("blank", "title", "index"):
            continue

        # Track section from page-level detection
        page_section = resp.get("section_label")
        if page_section:
            new_ch = page_section.split(".")[0]
            if current_chapter and new_ch != current_chapter:
                print(f"  📚 Chapter boundary: {current_section} → {page_section} at page {page_num}")
            current_chapter = new_ch
            current_section = page_section

        # Process headings
        for h in resp.get("headings", []):
            h_text = h.get("text", "").strip()
            h_sec = h.get("section_label") or current_section
            if h_sec:
                current_section = h_sec
                current_chapter = h_sec.split(".")[0]

            if not h_text or len(h_text) < 3:
                continue

            row = {
                "content":       h_text,
                "page_number":   page_num,
                "section_label": current_section or "",
                "node_type":     "heading",
                "parent_id":     None,
                "metadata":      json.dumps({"heading_level": h.get("level", 1), "source": "vision"}),
                "course":        args.course,
                "level_name":    args.level,
                "paper_number":  int(args.paper),
                "subject":       args.subject,
            }

            if args.dry_run:
                total_nodes += 1
                if total_nodes <= 20:
                    print(f"  {total_nodes:3d} | pg {page_num:3d} | heading      | sec={current_section or '-':8s} | {h_text[:70]}")
            else:
                result = sb.table("textbook_structure").insert(row).execute()
                inserted_id = result.data[0]["id"] if result.data else None
                if inserted_id:
                    last_heading_id = inserted_id
                total_nodes += 1

        # Process paragraphs
        for p in resp.get("paragraphs", []):
            p_text = p.get("text", "").strip()
            if not p_text or len(p_text) < 5:
                continue

            row = {
                "content":       p_text,
                "page_number":   page_num,
                "section_label": current_section or "",
                "node_type":     "paragraph",
                "parent_id":     last_heading_id,
                "metadata":      json.dumps({"para_type": p.get("type", "normal"), "source": "vision"}),
                "course":        args.course,
                "level_name":    args.level,
                "paper_number":  int(args.paper),
                "subject":       args.subject,
            }

            if args.dry_run:
                total_nodes += 1
                if total_nodes <= 20:
                    print(f"  {total_nodes:3d} | pg {page_num:3d} | paragraph    | sec={current_section or '-':8s} | {p_text[:70]}")
            else:
                sb.table("textbook_structure").insert(row).execute()
                total_nodes += 1

        # Process lists
        for lst in resp.get("lists", []):
            for item_text in lst.get("items", []):
                item_text = item_text.strip()
                if not item_text or len(item_text) < 5:
                    continue

                row = {
                    "content":       item_text,
                    "page_number":   page_num,
                    "section_label": current_section or "",
                    "node_type":     "list_item",
                    "parent_id":     last_heading_id,
                    "metadata":      json.dumps({"list_type": lst.get("type", "bulleted"), "source": "vision"}),
                    "course":        args.course,
                    "level_name":    args.level,
                    "paper_number":  int(args.paper),
                    "subject":       args.subject,
                }

                if args.dry_run:
                    total_nodes += 1
                    if total_nodes <= 20:
                        print(f"  {total_nodes:3d} | pg {page_num:3d} | list_item    | sec={current_section or '-':8s} | {item_text[:70]}")
                else:
                    sb.table("textbook_structure").insert(row).execute()
                    total_nodes += 1

        # Process tables
        for tbl in resp.get("tables", []):
            headers = tbl.get("headers", [])
            rows = tbl.get("rows", [])
            table_md = " | ".join(headers) + "\n"
            for r in rows:
                table_md += " | ".join(str(c) for c in r) + "\n"

            if len(table_md.strip()) < 10:
                continue

            row = {
                "content":       table_md.strip(),
                "page_number":   page_num,
                "section_label": current_section or "",
                "node_type":     "table",
                "parent_id":     last_heading_id,
                "metadata":      json.dumps({"source": "vision"}),
                "course":        args.course,
                "level_name":    args.level,
                "paper_number":  int(args.paper),
                "subject":       args.subject,
            }

            if args.dry_run:
                total_nodes += 1
                if total_nodes <= 20:
                    print(f"  {total_nodes:3d} | pg {page_num:3d} | table        | sec={current_section or '-':8s} | [TABLE {len(rows)} rows]")
            else:
                sb.table("textbook_structure").insert(row).execute()
                total_nodes += 1

        # Progress
        if page_num % 10 == 0 and not args.dry_run:
            print(f"  ⏳ Page {page_num} — {total_nodes} nodes stored")

    print(f"\n🎉 {'Dry run complete!' if args.dry_run else 'Insert complete!'}")
    print(f"   Total nodes: {total_nodes}")


if __name__ == "__main__":
    main()
