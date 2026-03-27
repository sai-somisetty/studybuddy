"""
SOMI Smart Extract v2 — Per-page extraction with Mama-Kitty conversation flow.
Sends page N + page N+1 to Claude Vision, extracts teaching content for page N only.
Page N+1 is for bridging paragraphs that span page breaks.
"""

import argparse
import base64
import fitz  # PyMuPDF
import json
import os
import re
import time
from dotenv import load_dotenv
from anthropic import Anthropic
from supabase import create_client

load_dotenv()

SYSTEM_PROMPT = "You are Mama — a warm Telugu CMA mentor teaching ICMAI textbook to student Kitty line by line."

USER_PROMPT = """These are 2 consecutive ICMAI CMA Foundation textbook pages.
Extract teaching content for PAGE 1 ONLY.
Page 2 is provided ONLY to complete paragraphs that start on Page 1 but continue onto Page 2.

Process each paragraph in EXACT textbook order.

RULES:
1. Extract EVERY paragraph from Page 1 in order
2. IGNORE these artifacts: "Fundamentals of Business Laws and Business Communication", "The Institute of Cost Accountants of India", page numbers, running headers/footers
3. Tenglish rules:
   - NEVER say "beta", "da", "ra"
   - Natural Telugu: idi, adi, chala, ayindi, meeru, kadha, ante, kaabatti, chesaru, okay va, chuddam
   - Always address student as Kitty
   - Real Indian companies: Tata, Zomato, SBI, Amul, Infosys, Swiggy, Wipro, Maruti
4. is_key_concept=true when paragraph contains Article/Section number, legal definition, frequently tested concept, real-world business application, or confusion-prone content
5. Only generate kitty_question and mama_kitty_answer when is_key_concept=true, else set both to null
6. mama_response_correct and mama_response_wrong must feel personal — Mama talking directly to Kitty

Return ONLY valid JSON — no preamble no markdown fences:
{
  "book_page": PAGE_NUM,
  "paragraphs": [
    {
      "text": "exact complete textbook paragraph text",
      "heading": "heading this paragraph belongs to or null",
      "is_key_concept": true,
      "is_continued_to_next": false,
      "tenglish": "Mama explains to Kitty in Tenglish with Indian company example — 3-4 sentences",
      "kitty_question": "Kitty's confused question in Tenglish — only if is_key_concept, else null",
      "mama_kitty_answer": "Mama's answer to Kitty with different Indian company example — only if is_key_concept, else null",
      "check_question": "MCQ question testing this paragraph",
      "check_options": ["option A", "option B", "option C", "option D"],
      "check_answer": 0,
      "check_explanation": "why this answer is correct",
      "mama_response_correct": "Mama's encouraging response in Tenglish when correct",
      "mama_response_wrong": "Mama's reassuring response in Tenglish when wrong — re-explains key point"
    }
  ]
}"""


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


def extract_page(claude, images_b64, pdf_page):
    """Send page pair to Claude Vision, return parsed page data."""
    content = []
    for img in images_b64:
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": "image/png", "data": img},
        })

    prompt = USER_PROMPT.replace("PAGE_NUM", str(pdf_page))
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

    if response.stop_reason == "max_tokens":
        print(f"⚠️ Truncated", end=" ", flush=True)

    # Strip markdown fences
    if "```" in text:
        for part in text.split("```"):
            part = part.strip()
            if part.startswith("json"):
                part = part[4:]
            part = part.strip()
            if part.startswith("{"):
                text = part
                break

    # Parse JSON with fallback
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        cleaned = re.sub(r'[\x00-\x1f\x7f-\x9f]', ' ', text)
        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            last_close = cleaned.rfind("}")
            if last_close > 0:
                truncated = cleaned[:last_close + 1]
                try:
                    data = json.loads(truncated)
                    print(f"⚠️ Recovered", end=" ", flush=True)
                except json.JSONDecodeError:
                    raise
            else:
                raise

    return data, round(cost, 4)


def store_page(sb, page_data, pdf_page, chapter, course, paper):
    """Store one page's data to lesson_content."""
    namespace = f"{course}_f_law_ch{chapter}_s1"
    book_page = page_data.get("book_page", pdf_page)
    paragraphs = page_data.get("paragraphs", [])

    row = {
        "namespace":    namespace,
        "concept":      f"Page {book_page}",
        "sections":     json.dumps(paragraphs, ensure_ascii=False),
        "chapter":      chapter,
        "course":       course,
        "paper":        paper,
        "page_ref":     book_page,
        "is_verified":  False,
    }
    sb.table("lesson_content").insert(row).execute()


def main():
    parser = argparse.ArgumentParser(description="SOMI Smart Extract v2")
    parser.add_argument("--pdf", required=True, help="Path to ICMAI PDF")
    parser.add_argument("--start-page", type=int, default=1, help="Start PDF page (1-indexed)")
    parser.add_argument("--end-page", type=int, default=None, help="End PDF page (1-indexed)")
    parser.add_argument("--chapter", required=True, help="Chapter number")
    parser.add_argument("--course", default="cma")
    parser.add_argument("--paper", type=int, default=1)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--clear-chapter", action="store_true")
    parser.add_argument("--dpi", type=int, default=150)

    args = parser.parse_args()

    print(f"\n📖 SOMI Smart Extract v2 — Per Page")
    print(f"   PDF: {args.pdf}")
    print(f"   Chapter: {args.chapter}")
    print(f"   {args.course.upper()} Paper {args.paper}")
    print(f"   Dry run: {args.dry_run}")
    print()

    doc = fitz.open(args.pdf)
    total_pages = doc.page_count
    start = max(args.start_page - 1, 0)
    end = min(args.end_page or total_pages, total_pages)
    print(f"   PDF pages: {start + 1} to {end} (of {total_pages})")

    sb = None
    if not args.dry_run:
        sb = get_sb()
        if args.clear_chapter:
            r = sb.table("lesson_content")\
                .delete()\
                .eq("course", args.course)\
                .eq("chapter", args.chapter)\
                .execute()
            print(f"   Cleared {len(r.data)} existing rows")

    claude = get_claude()
    total_paras = 0
    total_cost = 0.0
    all_pages = []

    for page_idx in range(start, end):
        pdf_page = page_idx + 1  # 1-indexed
        images = [page_to_base64(doc, page_idx, args.dpi)]

        # Add next page for bridging (if available)
        if page_idx + 1 < total_pages:
            images.append(page_to_base64(doc, page_idx + 1, args.dpi))

        print(f"  📄 Page {pdf_page} [{page_idx - start + 1}/{end - start}]...", end=" ", flush=True)

        try:
            page_data, cost = extract_page(claude, images, pdf_page)
            total_cost += cost
            paras = page_data.get("paragraphs", [])
            book_page = page_data.get("book_page", pdf_page)
            key_count = sum(1 for p in paras if p.get("is_key_concept"))

            print(f"✅ {len(paras)} paras ({key_count} key) book_pg={book_page} ${cost}", flush=True)
            total_paras += len(paras)

            if args.dry_run:
                all_pages.append(page_data)
            else:
                # Dedup by pdf_page
                try:
                    existing = sb.table("lesson_content")\
                        .select("id")\
                        .eq("chapter", args.chapter)\
                        .eq("concept", f"Page {book_page}")\
                        .execute()
                    if existing.data:
                        print(f"    ⏭ Skipping duplicate page {book_page}", flush=True)
                    else:
                        store_page(sb, page_data, pdf_page, args.chapter, args.course, args.paper)
                        print(f"    ✅ Stored page {book_page}", flush=True)
                except Exception as e:
                    print(f"    ❌ Store error: {e}", flush=True)

        except json.JSONDecodeError as e:
            print(f"❌ JSON error: {e}", flush=True)
        except Exception as e:
            print(f"❌ Error: {e}", flush=True)

        time.sleep(1)

    doc.close()

    if args.dry_run and all_pages:
        print(f"\n{'='*60}")
        print(f"DRY RUN — Page {all_pages[0].get('book_page', '?')} sample:")
        print(f"{'='*60}")
        print(json.dumps(all_pages[0], indent=2, ensure_ascii=False)[:3000])

    print(f"\n🎉 Complete!")
    print(f"   Pages: {start + 1} to {end}")
    print(f"   Total paragraphs: {total_paras}")
    print(f"   Total cost: ${total_cost:.4f}")


if __name__ == "__main__":
    main()
