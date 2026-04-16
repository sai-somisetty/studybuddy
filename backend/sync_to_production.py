import os
import json
from supabase import create_client
from dotenv import load_dotenv
import argparse

load_dotenv()

# Production DB (somi-two student app)
PROD_URL = os.getenv("SUPABASE_URL")
PROD_KEY = os.getenv("SUPABASE_KEY")

# Admin/Content DB (somi-admin)
ADMIN_URL = "https://raatrrgldhxtabaottrv.supabase.co"
ADMIN_KEY = "sb_publishable_5O55piF38qaxILk-nowz6Q_xVSkg5Tp"

prod_sb = create_client(PROD_URL, PROD_KEY)
admin_sb = create_client(ADMIN_URL, ADMIN_KEY)

PDF_OFFSET = 8


def clean_v3(text: str) -> str:
    """Strip accidental JSON wrapper from Deep Dive text (e.g. {\"explanation\": \"...\"})."""
    if not text or not str(text).strip():
        return text or ""
    stripped = str(text).strip()
    try:
        parsed = json.loads(stripped)
        if isinstance(parsed, dict) and parsed.get("explanation"):
            text = str(parsed["explanation"])
    except (json.JSONDecodeError, TypeError, ValueError):
        pass
    # Fix double-escaped newlines
    text = text.replace("\\n", "\n")
    return text


def get_subject(paper: int) -> str:
    mapping = {
        1: "law",
        2: "acc",
        3: "maths",
        4: "eco",
        5: "law",
        6: "acc",
        7: "tax",
        8: "cost",
    }
    return mapping.get(paper, "unknown")


def sync_chapter(course: str, paper: int, chapter: int, dry_run: bool = False):
    """
    Sync all verified concepts for a chapter from
    admin DB to production lesson_content table.

    Maps admin concepts → mama_lines format
    Groups by book_page → one row per page
    """

    print(f"\n📖 Syncing Chapter {chapter} (Paper {paper})...")

    # Fetch verified concepts from admin DB
    r = admin_sb.table("concepts")\
        .select("*")\
        .eq("course_id", course)\
        .eq("paper_number", paper)\
        .eq("chapter_number", chapter)\
        .eq("is_verified", True)\
        .order("book_page")\
        .order("order_index")\
        .execute()

    concepts = r.data or []

    if not concepts:
        print(f"  ⚠️  No verified concepts found for Ch{chapter}")
        return 0

    print(f"  Found {len(concepts)} verified concepts")

    # Group concepts by book_page
    pages = {}
    for c in concepts:
        bp = c["book_page"]
        if bp not in pages:
            pages[bp] = []
        pages[bp].append(c)

    synced = 0

    for book_page, page_concepts in pages.items():
        pdf_page = book_page + PDF_OFFSET

        # Build mama_lines array from concepts
        mama_lines = []
        for c in page_concepts:
            mama_lines.append({
                "text": c.get("text") or "",
                "image_url": c.get("image_url") or "",
                "heading": c.get("heading") or "",
                "is_key_concept": c.get("is_key_concept", False),
                "tenglish": c.get("tenglish") or "",
                "tenglish_variation_2": c.get("tenglish_variation_2") or "",
                "tenglish_variation_3": clean_v3(c.get("tenglish_variation_3") or ""),
                "kitty_question": c.get("kitty_question") or "",
                "mama_kitty_answer": c.get("mama_kitty_answer") or "",
                "check_question": c.get("check_question") or "",
                "check_options": c.get("check_options") or [],
                "check_answer": c.get("check_answer", 0),
                "check_explanation": c.get("check_explanation") or "",
                "mama_response_correct": c.get("mama_response_correct") or "",
                "mama_response_wrong": c.get("mama_response_wrong") or "",
                "mamas_tip": c.get("mamas_tip") or "",
                "exam_rubric": c.get("exam_rubric") or None,
                "content_type": c.get("content_type") or "text",
                "concept_title": c.get("concept_title") or "",
                "order_index": c.get("order_index", 1),
                "is_verified": True,
                "source": c.get("source") or "admin_verified",
            })

        # Get namespace for this chapter
        namespace = f"cma_f_{get_subject(paper)}_ch{chapter}_s1"

        if dry_run:
            print(f"  [DRY RUN] Would sync page {book_page} "
                  f"({len(mama_lines)} concepts)")
            synced += 1
            continue

        # Check if row exists in production
        existing = prod_sb.table("lesson_content")\
            .select("id")\
            .eq("chapter", str(chapter))\
            .eq("book_page", book_page)\
            .eq("course", course)\
            .execute()

        row_data = {
            "namespace": namespace,
            "concept": f"Page {book_page}",
            "course": course,
            "paper": paper,
            "chapter": chapter,
            "book_page": book_page,
            "pdf_page": pdf_page,
            "mama_lines": json.dumps(mama_lines),
            "is_verified": True,
            "needs_work": False,
        }

        if existing.data:
            # Update existing row
            prod_sb.table("lesson_content")\
                .update(row_data)\
                .eq("id", existing.data[0]["id"])\
                .execute()
            print(f"  ✅ Updated page {book_page} "
                  f"({len(mama_lines)} concepts)")
        else:
            # Insert new row
            prod_sb.table("lesson_content")\
                .insert(row_data)\
                .execute()
            print(f"  ✅ Inserted page {book_page} "
                  f"({len(mama_lines)} concepts)")

        synced += 1

    print(f"  🎉 Synced {synced} pages for Chapter {chapter}")
    return synced


def main():
    parser = argparse.ArgumentParser(
        description="Sync verified admin content to production"
    )
    parser.add_argument("--course", default="cma")
    parser.add_argument("--paper", type=int, default=1)
    parser.add_argument("--chapter", type=int, default=None,
        help="Specific chapter to sync. If not provided syncs all.")
    parser.add_argument("--dry-run", action="store_true",
        help="Preview without writing to production")
    args = parser.parse_args()

    print("🔄 SOMI Content Sync")
    print(f"   Course: {args.course} | Paper: {args.paper}")
    print(f"   Dry run: {args.dry_run}\n")

    if args.chapter:
        # Sync specific chapter
        total = sync_chapter(
            args.course,
            args.paper,
            args.chapter,
            args.dry_run
        )
    else:
        # Sync all chapters for this paper
        r = admin_sb.table("chapters")\
            .select("chapter_number")\
            .eq("course_id", args.course)\
            .eq("paper_number", args.paper)\
            .order("chapter_number")\
            .execute()

        chapters = [c["chapter_number"] for c in (r.data or [])]

        if not chapters:
            print("❌ No chapters found in admin DB")
            return

        print(f"Found {len(chapters)} chapters: {chapters}\n")

        total = 0
        for ch in chapters:
            total += sync_chapter(
                args.course,
                args.paper,
                ch,
                args.dry_run
            )

        print(f"\n🎉 Total synced: {total} pages")

        if not args.dry_run:
            print("\n✅ Production DB updated!")
            print("   Students will see verified content immediately.")


if __name__ == "__main__":
    main()
