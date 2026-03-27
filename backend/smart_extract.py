"""
SOMI Smart Extract — Reads ICMAI PDF, sends page pairs to Claude Vision,
extracts structured lesson content with Tenglish explanations,
stores in lesson_content table.

Requires: pip install PyMuPDF anthropic supabase python-dotenv
System dependency: poppler (brew install poppler) — only needed if using pdf2image.
This script uses PyMuPDF (fitz) instead, so no poppler needed.
"""

import argparse
import base64
import fitz  # PyMuPDF
import json
import os
import re
import time
from datetime import datetime
from dotenv import load_dotenv
from anthropic import Anthropic
from supabase import create_client

load_dotenv()

SYSTEM_PROMPT = (
    "You are the Lead Content Architect for SOMI, a premium EdTech "
    "app for Indian CMA Foundation students."
)

USER_PROMPT = """Extract ALL concepts from these consecutive textbook pages and return structured JSON.

RULES:
1. Extract EVERY concept — do not skip any
2. Bridge concepts that span the page break seamlessly
3. IGNORE these page artifacts completely:
   - "Fundamentals of Business Laws and Business Communication"
   - "The Institute of Cost Accountants of India"
   - Page numbers
   - Running headers/footers
4. For official_full_text: copy the EXACT textbook text word for word
5. For core_definition: write 1-2 lines summarizing the concept
6. For somi_business_logic: explain in Tenglish (Telugu + English mix) as Mama speaking to student named Kitty
   - Use real Indian companies: Tata, Zomato, SBI, Amul, Infosys, Swiggy
   - NEVER say "beta", "da", "ra"
   - Natural Telugu: idi, adi, chala, ayindi, meeru, kadha, ante, kaabatti, chesaru, okay va, chuddam
7. For mamas_tip: one specific exam shortcut with Article/Section number
8. For variations: 2 alternative business story explanations

Return ONLY valid JSON array — no preamble no markdown fences:
[
  {
    "concept_title": "exact heading from textbook",
    "section_label": "1.1" or "1.1.1" etc,
    "page_reference": "{page_ref}",
    "core_definition": "1-2 line summary of concept",
    "somi_business_logic": "Tenglish explanation with Indian company example",
    "mamas_tip": "Exam shortcut mentioning Article/Section number",
    "official_full_text": "exact word-for-word textbook text",
    "variations": [
      {"type": "backup_1", "story": "alternate Indian company story"},
      {"type": "backup_2", "story": "another alternate story"}
    ]
  }
]"""


def get_sb():
    return create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))


def get_claude():
    return Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def page_to_base64(doc, page_idx, dpi=150):
    """Render PDF page to base64 PNG."""
    page = doc[page_idx]
    mat = fitz.Matrix(dpi / 72, dpi / 72)
    pix = page.get_pixmap(matrix=mat)
    return base64.b64encode(pix.tobytes("png")).decode("utf-8")


def extract_page_pair(claude, images_b64, page_ref):
    """Send 1 or 2 page images to Claude Vision, return parsed concepts."""
    content = []
    for img in images_b64:
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": "image/png", "data": img},
        })

    prompt = USER_PROMPT.replace("{page_ref}", page_ref)
    content.append({"type": "text", "text": prompt})

    response = claude.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=8000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": content}],
    )

    text = response.content[0].text.strip()
    cost = (response.usage.input_tokens * 3 / 1_000_000) + \
           (response.usage.output_tokens * 15 / 1_000_000)

    # Check for truncation
    if response.stop_reason == "max_tokens":
        print(f"⚠️ Response truncated — increase max_tokens further", flush=True)

    # Strip markdown fences if present
    if "```" in text:
        for part in text.split("```"):
            part = part.strip()
            if part.startswith("json"):
                part = part[4:]
            part = part.strip()
            if part.startswith("["):
                text = part
                break

    # Try parsing JSON — with fallback cleaning
    try:
        concepts = json.loads(text)
    except json.JSONDecodeError:
        # Remove control characters that break JSON
        cleaned = re.sub(r'[\x00-\x1f\x7f-\x9f]', ' ', text)
        try:
            concepts = json.loads(cleaned)
        except json.JSONDecodeError:
            # Last resort: truncate to last complete object
            last_close = cleaned.rfind("}")
            if last_close > 0:
                truncated = cleaned[:last_close + 1]
                if not truncated.rstrip().endswith("]"):
                    truncated = truncated.rstrip().rstrip(",") + "]"
                try:
                    concepts = json.loads(truncated)
                    print(f"⚠️ Recovered {len(concepts)} concepts from truncated response", flush=True)
                except json.JSONDecodeError:
                    print(f"❌ Raw response start: {text[:80]}...", flush=True)
                    raise
            else:
                print(f"❌ Raw response start: {text[:80]}...", flush=True)
                raise

    return concepts, round(cost, 4)


def store_concept(sb, concept, chapter, course, paper):
    """Store a single concept to lesson_content table."""
    namespace = f"{course}_f_law_ch{chapter}_s1"
    page_ref_str = concept.get("page_reference", "")
    page_num = None
    if page_ref_str:
        m = re.search(r'(\d+)', str(page_ref_str))
        if m:
            page_num = int(m.group(1))

    row = {
        "namespace":          namespace,
        "concept":            concept.get("concept_title", ""),
        "sections":           json.dumps([concept], ensure_ascii=False),
        "concept_title":      concept.get("concept_title", ""),
        "section_label":      concept.get("section_label", ""),
        "page_ref":           page_num,
        "core_definition":    concept.get("core_definition", ""),
        "somi_business_logic": concept.get("somi_business_logic", ""),
        "mamas_tip":          concept.get("mamas_tip", ""),
        "official_full_text": concept.get("official_full_text", ""),
        "tenglish_ai":        concept.get("somi_business_logic", ""),
        "variations":         json.dumps(concept.get("variations", []), ensure_ascii=False),
        "is_verified":        False,
        "course":             course,
        "paper":              paper,
        "chapter":            chapter,
    }
    sb.table("lesson_content").insert(row).execute()


def main():
    parser = argparse.ArgumentParser(description="SOMI Smart Extract")
    parser.add_argument("--pdf", required=True, help="Path to ICMAI PDF")
    parser.add_argument("--start-page", type=int, default=1, help="Start PDF page (1-indexed)")
    parser.add_argument("--end-page", type=int, default=None, help="End PDF page (1-indexed)")
    parser.add_argument("--chapter", required=True, help="Chapter number e.g. '1'")
    parser.add_argument("--course", default="cma")
    parser.add_argument("--paper", type=int, default=1)
    parser.add_argument("--dry-run", action="store_true", help="Print JSON without storing")
    parser.add_argument("--clear-chapter", action="store_true",
                        help="Delete existing lesson_content for this chapter first")
    parser.add_argument("--dpi", type=int, default=150, help="Render DPI")

    args = parser.parse_args()

    print(f"\n📖 SOMI Smart Extract")
    print(f"   PDF: {args.pdf}")
    print(f"   Chapter: {args.chapter}")
    print(f"   {args.course.upper()} Paper {args.paper}")
    print(f"   DPI: {args.dpi}")
    print(f"   Dry run: {args.dry_run}")
    print()

    # Open PDF
    doc = fitz.open(args.pdf)
    total_pages = doc.page_count
    start = max(args.start_page - 1, 0)
    end = min(args.end_page or total_pages, total_pages)
    print(f"   PDF pages: {start + 1} to {end} (of {total_pages})")

    # Supabase
    sb = None
    if not args.dry_run:
        sb = get_sb()
        if args.clear_chapter:
            namespace = f"{args.course}_f_law_ch{args.chapter}_s1"
            r = sb.table("lesson_content")\
                .delete()\
                .eq("course", args.course)\
                .eq("chapter", args.chapter)\
                .execute()
            print(f"   Cleared {len(r.data)} existing rows for chapter {args.chapter}")

    # Claude
    claude = get_claude()

    total_concepts = 0
    total_cost = 0.0
    all_concepts = []

    # Process pages in overlapping pairs: (1,2), (2,3), (3,4), ...
    # This ensures concepts spanning page breaks are never missed
    pairs = [(i, i + 1) for i in range(start, end)]
    # Last pair may go beyond end — clamp second page
    pairs = [(a, min(b, end - 1)) for a, b in pairs if a < end]

    for pair_idx, (p1, p2) in enumerate(pairs):
        images = [page_to_base64(doc, p1, args.dpi)]
        page_nums = [p1 + 1]  # 1-indexed for display

        if p2 != p1 and p2 < doc.page_count:
            images.append(page_to_base64(doc, p2, args.dpi))
            page_nums.append(p2 + 1)

        page_ref = f"{page_nums[0]}" if len(page_nums) == 1 else f"{page_nums[0]}-{page_nums[1]}"
        print(f"  📄 Pages {page_ref} [{pair_idx+1}/{len(pairs)}]...", end=" ", flush=True)

        try:
            concepts, cost = extract_page_pair(claude, images, page_ref)
            total_cost += cost

            if not concepts:
                print(f"⚪ empty (${cost})")
                time.sleep(1)
                continue

            print(f"✅ {len(concepts)} concepts (${cost})")

            for c in concepts:
                title = c.get("concept_title", "?")
                sec = c.get("section_label", "?")

                if args.dry_run:
                    print(f"    📝 {sec}: {title}")
                    all_concepts.append(c)
                else:
                    # Check for duplicate before inserting
                    try:
                        existing = sb.table("lesson_content")\
                            .select("id")\
                            .eq("chapter", args.chapter)\
                            .eq("concept_title", title)\
                            .execute()
                        if existing.data:
                            print(f"    ⏭ Skipping duplicate: {title}")
                            continue
                    except Exception:
                        pass  # if check fails, try inserting anyway

                    try:
                        store_concept(sb, c, args.chapter, args.course, args.paper)
                        print(f"    ✅ Stored: {title} (section {sec})")
                    except Exception as e:
                        print(f"    ❌ Store error: {e}")

                total_concepts += 1

        except json.JSONDecodeError as e:
            print(f"❌ JSON parse error: {e}")
        except Exception as e:
            print(f"❌ Error: {e}")
        time.sleep(1)

    doc.close()

    if args.dry_run and all_concepts:
        print(f"\n{'='*60}")
        print("DRY RUN — Full JSON output:")
        print(f"{'='*60}")
        print(json.dumps(all_concepts, indent=2, ensure_ascii=False))

    print(f"\n🎉 Complete!")
    print(f"   Pages processed: {start + 1} to {end}")
    print(f"   Total concepts: {total_concepts}")
    print(f"   Total cost: ${total_cost:.4f}")


if __name__ == "__main__":
    main()
