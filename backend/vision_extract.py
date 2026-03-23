"""
SOMI Vision Extract — Reads ICMAI PDF page by page,
sends each page image to Claude Vision API,
saves raw responses to JSON file.

Source of truth file. Reusable forever. ₹0 to restructure later.
Saves after every page so it can resume if interrupted.
"""

import argparse
import base64
import fitz  # PyMuPDF
import json
import os
from datetime import datetime
from dotenv import load_dotenv
from anthropic import Anthropic

load_dotenv()

VISION_PROMPT = """You are an ICMAI textbook parser. Extract ALL content from this page exactly.

Return ONLY valid JSON with this structure:
{
  "page_type": "content" | "toc" | "title" | "blank" | "index",
  "chapter_number": null or integer,
  "section_label": null or string like "1.1" or "2.3.1",
  "section_title": null or string,
  "headings": [
    {"level": 1, "text": "heading text", "section_label": "1.1"}
  ],
  "paragraphs": [
    {"text": "exact paragraph text from page", "type": "definition" | "explanation" | "example" | "case_law" | "section_reference" | "normal"}
  ],
  "lists": [
    {"items": ["item 1", "item 2"], "type": "numbered" | "bulleted"}
  ],
  "tables": [
    {"headers": ["col1", "col2"], "rows": [["val1", "val2"]]}
  ],
  "key_terms": ["term1", "term2"],
  "section_references": ["Section 2(h)", "Article 141"],
  "page_footer": "footer text if any"
}

Rules:
- Extract EVERY word from the page. Do not summarize.
- Detect section numbers like 1.1, 1.2, 2.1, 2.3.1 etc.
- Identify if this is a new section/chapter start.
- Preserve exact legal quotes and section references.
- key_terms = bold or important terms on the page.
- If page is blank or has only images, set page_type to "blank".
"""


def load_existing(output_path):
    """Load existing extraction file for resume support."""
    if os.path.exists(output_path):
        with open(output_path) as f:
            return json.load(f)
    return {"pages": [], "metadata": {}}


def get_processed_pages(data):
    """Get set of already processed page numbers."""
    return {p["page_number"] for p in data["pages"] if p.get("processed")}


def save_data(output_path, data):
    """Save after every page — never lose progress."""
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def page_to_base64(doc, page_num, dpi=200):
    """Render PDF page to base64 PNG image."""
    page = doc[page_num]
    mat = fitz.Matrix(dpi / 72, dpi / 72)
    pix = page.get_pixmap(matrix=mat)
    return base64.b64encode(pix.tobytes("png")).decode("utf-8")


def extract_page(claude, page_b64, page_num):
    """Send page image to Claude Vision and get structured response."""
    response = claude.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4000,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": page_b64,
                    },
                },
                {
                    "type": "text",
                    "text": VISION_PROMPT,
                },
            ],
        }],
    )

    text = response.content[0].text.strip()

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

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        parsed = {"raw_text": text, "parse_error": True}

    # Estimate cost (rough: ~0.003 per page for sonnet vision)
    input_tokens = response.usage.input_tokens
    output_tokens = response.usage.output_tokens
    cost = (input_tokens * 3 / 1_000_000) + (output_tokens * 15 / 1_000_000)

    return {
        "page_number": page_num + 1,  # 1-indexed
        "claude_response": parsed,
        "processed": True,
        "cost_estimate": round(cost, 4),
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "extracted_at": datetime.now().isoformat(),
    }


def main():
    parser = argparse.ArgumentParser(description="SOMI Vision Extract")
    parser.add_argument("--pdf", required=True, help="Path to ICMAI PDF")
    parser.add_argument("--start-page", type=int, default=1, help="Start page (1-indexed)")
    parser.add_argument("--end-page", type=int, default=None, help="End page (1-indexed)")
    parser.add_argument("--output", default="vision_raw.json", help="Output JSON file")
    parser.add_argument("--dpi", type=int, default=200, help="Render DPI")

    args = parser.parse_args()

    print(f"\n📖 SOMI Vision Extract")
    print(f"   PDF: {args.pdf}")
    print(f"   Output: {args.output}")
    print(f"   DPI: {args.dpi}")

    # Open PDF
    doc = fitz.open(args.pdf)
    total_pages = doc.page_count
    start = max(args.start_page - 1, 0)  # convert to 0-indexed
    end = min(args.end_page or total_pages, total_pages)

    print(f"   Pages: {start + 1} to {end} (of {total_pages})")

    # Load existing / resume
    data = load_existing(args.output)
    if not data.get("metadata"):
        data["metadata"] = {
            "pdf": args.pdf,
            "total_pages": total_pages,
            "started_at": datetime.now().isoformat(),
        }
    processed = get_processed_pages(data)
    print(f"   Already processed: {len(processed)} pages")
    print()

    # Claude client
    claude = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    total_cost = sum(p.get("cost_estimate", 0) for p in data["pages"])

    for page_idx in range(start, end):
        page_num_display = page_idx + 1

        if page_num_display in processed:
            continue

        print(f"  📄 Page {page_num_display}/{end}...", end=" ", flush=True)

        try:
            # Render page to image
            page_b64 = page_to_base64(doc, page_idx, args.dpi)

            # Send to Claude Vision
            result = extract_page(claude, page_b64, page_idx)
            data["pages"].append(result)

            total_cost += result["cost_estimate"]
            sec = result["claude_response"].get("section_label", "-")
            ptype = result["claude_response"].get("page_type", "?")

            print(f"✅ type={ptype} sec={sec} cost=${result['cost_estimate']:.4f}")

        except Exception as e:
            print(f"❌ Error: {e}")
            data["pages"].append({
                "page_number": page_num_display,
                "processed": False,
                "error": str(e),
                "extracted_at": datetime.now().isoformat(),
            })

        # Save after EVERY page
        save_data(args.output, data)

        # Progress every 10 pages
        if page_num_display % 10 == 0:
            print(f"  💰 Running cost: ${total_cost:.4f}")

    doc.close()

    data["metadata"]["completed_at"] = datetime.now().isoformat()
    data["metadata"]["total_cost"] = round(total_cost, 4)
    save_data(args.output, data)

    print(f"\n🎉 Complete!")
    print(f"   Pages processed: {len([p for p in data['pages'] if p.get('processed')])}")
    print(f"   Total cost: ${total_cost:.4f}")
    print(f"   Saved to: {args.output}")


if __name__ == "__main__":
    main()
