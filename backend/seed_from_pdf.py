# seed_from_pdf.py
# Seeds CMA/CA content from ICAI PDFs into ChromaDB
# Retry on rate limit — no data lost
# Run: python seed_from_pdf.py --pdf "paper1.pdf" --course cma --level foundation --subject law --paper 1

import anthropic
import chromadb
import argparse
import json
import os
import sys
import time
import fitz  # pymupdf
from dotenv import load_dotenv

load_dotenv()

claude = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
chroma = chromadb.PersistentClient(path="./chromadb_data")


# ── RETRY WRAPPER ──

def call_claude_with_retry(prompt: str, max_tokens: int, retries: int = 5) -> str:
    for attempt in range(retries):
        try:
            response = claude.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=max_tokens,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text.strip()
        except Exception as e:
            error_str = str(e)
            if "rate_limit" in error_str or "429" in error_str or "529" in error_str:
                wait = (attempt + 1) * 20
                print(f"    ⏳ Rate limit. Waiting {wait}s... (retry {attempt+1}/{retries})")
                time.sleep(wait)
                continue
            elif "overloaded" in error_str.lower():
                print(f"    ⏳ Claude overloaded. Waiting 30s...")
                time.sleep(30)
                continue
            else:
                print(f"    ❌ Error: {e}")
                raise e
    raise Exception(f"Failed after {retries} retries")


# ── SAFE JSON PARSER ──

def parse_json(text: str) -> any:
    text = text.strip()
    if "```" in text:
        parts = text.split("```")
        for part in parts:
            part = part.strip()
            if part.startswith("json"):
                part = part[4:]
            part = part.strip()
            if part.startswith("[") or part.startswith("{"):
                text = part
                break
    try:
        return json.loads(text)
    except Exception:
        start = text.find("[")
        end   = text.rfind("]") + 1
        if start != -1 and end > start:
            try:
                return json.loads(text[start:end])
            except Exception:
                pass
        start = text.find("{")
        end   = text.rfind("}") + 1
        if start != -1 and end > start:
            return json.loads(text[start:end])
        raise


# ── STEP 1: Extract pages from PDF ──

def extract_pages(pdf_path: str) -> list:
    print(f"📖 Reading PDF: {pdf_path}")
    doc   = fitz.open(pdf_path)
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text()
        if text.strip():
            pages.append({
                "page_number": i + 1,
                "text":        text.strip()
            })
    print(f"✅ Extracted {len(pages)} pages with text")
    return pages


# ── STEP 2: Find chapter structure ──

def find_chapters(pages: list, course: str, subject: str, paper: int) -> list:
    print("\n📚 Finding chapter structure...")

    sample_text = ""
    for p in pages[:20]:
        sample_text += f"\n--- Page {p['page_number']} ---\n{p['text'][:600]}\n"

    prompt = f"""This is from an ICMAI {course.upper()} Foundation Paper {paper} study material for {subject}.

First 20 pages:
{sample_text}

Identify the complete chapter structure.
Return ONLY valid JSON array:
[
  {{
    "chapter_number": 1,
    "chapter_title": "Full chapter title",
    "start_page": 5,
    "end_page": 25,
    "key_concepts": ["Concept 1", "Concept 2", "Concept 3"]
  }}
]

List ALL chapters. Include accurate page ranges."""

    time.sleep(3)
    text     = call_claude_with_retry(prompt, max_tokens=2000)
    chapters = parse_json(text)
    print(f"✅ Found {len(chapters)} chapters:")
    for c in chapters:
        print(f"   Ch {c['chapter_number']}: {c['chapter_title']} (pg {c.get('start_page','?')}-{c.get('end_page','?')})")
    return chapters


# ── STEP 3: Extract concepts from one chapter ──

def extract_concepts(
    pages: list,
    chapter: dict,
    course: str,
    subject: str,
    paper: int,
) -> list:
    ch_num   = chapter["chapter_number"]
    ch_title = chapter["chapter_title"]
    start    = chapter.get("start_page", 1)
    end      = chapter.get("end_page", start + 20)

    print(f"\n  📖 Ch {ch_num}: {ch_title} (pg {start}-{end})")

    chapter_pages = [p for p in pages if start <= p["page_number"] <= end]
    chapter_text  = ""
    for p in chapter_pages[:15]:
        chapter_text += f"\n[Page {p['page_number']}]\n{p['text'][:800]}\n"

    if not chapter_text.strip():
        print(f"  ⚠️  No text found — skipping")
        return []

    prompt = f"""This is Chapter {ch_num}: {ch_title}
From ICMAI {course.upper()} Foundation Paper {paper} — {subject}

Content:
{chapter_text[:4000]}

Extract ALL key concepts from this chapter.
Return ONLY valid JSON array:
[
  {{
    "concept_name": "Full concept name",
    "page_number": 5,
    "icai_definition": "Exact definition word for word from the text",
    "key_points": ["point 1", "point 2", "point 3"],
    "importance": "tier1"
  }}
]

importance: tier1=always in exam, tier2=often, tier3=sometimes
Extract 3-10 concepts. Use EXACT wording for icai_definition."""

    time.sleep(4)
    text     = call_claude_with_retry(prompt, max_tokens=3000)
    concepts = parse_json(text)
    print(f"  ✅ Found {len(concepts)} concepts")
    return concepts


# ── STEP 4: Generate 12 chunk types per concept ──

def generate_chunks(
    concept: dict,
    course: str,
    level: str,
    subject: str,
    chapter_num: int,
    chapter_title: str,
    paper: int,
) -> dict:
    concept_name = concept["concept_name"]
    print(f"    🧠 {concept_name}")

    prompt = f"""You are an expert CMA/CA educator creating study content for students.

Concept: {concept_name}
Course: {course.upper()} {level.capitalize()} Paper {paper} — {subject}
Chapter {chapter_num}: {chapter_title}
ICAI Definition: {concept['icai_definition']}
Key Points: {json.dumps(concept.get('key_points', []))}

Generate all content types. Return ONLY valid JSON:
{{
  "simple_explanation":  "Class 6 level explanation, zero jargon, 2-3 sentences",
  "medium_explanation":  "Student level understanding, 3-4 sentences with context",
  "deep_explanation":    "Full exam depth, complete understanding, 5-6 sentences",
  "telugu_analogy":      "Telugu/Indian family analogy in warm Tenglish, 2-3 sentences",
  "real_life_example":   "Indian everyday life — shop/farm/kitchen example, 2-3 sentences",
  "misconception_1":     "Most common wrong understanding students have, then correct it",
  "misconception_2":     "Second most common confusion, then correct it",
  "mcq_pattern":         "How this concept appears in MCQ exams, trap options to watch for",
  "model_answer":        "Examiner-expected theory answer format, 100 words, proper headings",
  "topper_answer":       "What toppers write extra that average students miss, 80 words",
  "related_concepts":    "Links to 2-3 other related concepts or chapters",
  "kitty_question":      "Kitty asks a confused funny question about this in Tenglish",
  "mama_explanation":    "Mama explains warmly using Appa flour mill or Indian analogy in Tenglish",
  "exam_trap":           "The examiner trap question for this concept, what students get wrong",
  "instagram_caption":   "Punchy 2-line Instagram caption for SOMI_CMA post about this"
}}"""

    time.sleep(5)
    text   = call_claude_with_retry(prompt, max_tokens=2500)
    chunks = parse_json(text)
    chunks["official_definition"] = concept["icai_definition"]
    return chunks


# ── STEP 5: Seed into ChromaDB ──

def seed_to_chroma(
    namespace: str,
    concept_name: str,
    chunks: dict,
    metadata_base: dict,
) -> int:
    try:
        collection = chroma.get_collection(name=namespace)
    except Exception:
        collection = chroma.create_collection(name=namespace)

    seeded       = 0
    safe_concept = concept_name\
        .replace(" ","_")\
        .replace("/","_")\
        .replace("\\","_")\
        .replace("(","_")\
        .replace(")","_")[:50]

    for chunk_type, content in chunks.items():
        if not content or not isinstance(content, str):
            continue
        chunk_id = f"{namespace}_{safe_concept}_{chunk_type}"[:200]
        try:
            collection.upsert(
                documents=[content],
                metadatas=[{
                    **metadata_base,
                    "chunk_type": chunk_type,
                    "concept":    concept_name,
                }],
                ids=[chunk_id]
            )
            seeded += 1
        except Exception as e:
            print(f"      ⚠️  {chunk_type}: {e}")
    return seeded


# ── STEP 6: Save progress to JSON (resume if interrupted) ──

def load_progress(progress_file: str) -> set:
    if os.path.exists(progress_file):
        with open(progress_file, "r") as f:
            done = json.load(f)
        print(f"📋 Resuming — {len(done)} concepts already seeded")
        return set(done)
    return set()

def save_progress(progress_file: str, done: set):
    with open(progress_file, "w") as f:
        json.dump(list(done), f)


# ── MAIN ──

def main():
    parser = argparse.ArgumentParser(description="SOMI PDF Seeder")
    parser.add_argument("--pdf",      required=True,  help="Path to PDF")
    parser.add_argument("--course",   required=True,  help="ca or cma")
    parser.add_argument("--level",    required=True,  help="foundation, inter, final")
    parser.add_argument("--subject",  required=True,  help="law, acc, maths, eco")
    parser.add_argument("--paper",    required=True,  type=int)
    parser.add_argument("--chapters", default="all",  help="all or 1,2,3")
    args = parser.parse_args()

    print(f"\n🚀 SOMI PDF Seeder — With Retry + Resume")
    print(f"   {args.course.upper()} {args.level} Paper {args.paper} — {args.subject}")
    print(f"   PDF: {args.pdf}\n")

    # Progress file — lets you resume if interrupted
    progress_file = f"progress_{args.course}_{args.level}_{args.subject}_p{args.paper}.json"
    done_concepts = load_progress(progress_file)

    # Extract pages
    pages = extract_pages(args.pdf)

    # Find chapters
    chapters = find_chapters(pages, args.course, args.subject, args.paper)

    # Filter chapters
    if args.chapters != "all":
        nums     = [int(c) for c in args.chapters.split(",")]
        chapters = [c for c in chapters if c["chapter_number"] in nums]
        print(f"\n📌 Processing chapters: {nums}")

    all_seeded     = []
    total_concepts = 0
    total_chunks   = 0

    for chapter in chapters:
        ch_num   = chapter["chapter_number"]
        ch_title = chapter["chapter_title"]

        concepts = extract_concepts(
            pages, chapter, args.course, args.subject, args.paper
        )

        for concept in concepts:
            concept_name = concept["concept_name"]

            # Skip already done concepts
            concept_key = f"ch{ch_num}_{concept_name}"
            if concept_key in done_concepts:
                print(f"    ⏭️  Skipping (already done): {concept_name}")
                continue

            namespace = (
                f"{args.course}_{args.level[0]}"
                f"_{args.subject}_ch{ch_num}_s1"
            )

            metadata_base = {
                "course":     args.course,
                "level":      args.level,
                "subject":    args.subject,
                "chapter":    str(ch_num),
                "page":       str(concept.get("page_number", 0)),
                "source":     f"ICMAI Study Material Paper {args.paper}",
                "namespace":  namespace,
                "importance": concept.get("importance", "tier2"),
            }

            try:
                chunks = generate_chunks(
                    concept,
                    args.course,
                    args.level,
                    args.subject,
                    ch_num,
                    ch_title,
                    args.paper,
                )

                seeded = seed_to_chroma(
                    namespace,
                    concept_name,
                    chunks,
                    metadata_base,
                )

                total_concepts += 1
                total_chunks   += seeded

                all_seeded.append({
                    "namespace": namespace,
                    "concept":   concept_name,
                    "chapter":   ch_num,
                    "chunks":    seeded,
                })

                # Mark as done and save progress
                done_concepts.add(concept_key)
                save_progress(progress_file, done_concepts)

                print(f"    ✅ {concept_name} — {seeded} chunks seeded")

            except Exception as e:
                print(f"    ❌ Failed: {concept_name} — {e}")
                print(f"    💾 Progress saved. Re-run same command to resume.")
                time.sleep(15)
                continue

    # Save full backup
    backup = f"seeded_{args.course}_{args.level}_{args.subject}_p{args.paper}.json"
    with open(backup, "w", encoding="utf-8") as f:
        json.dump(all_seeded, f, indent=2, ensure_ascii=False)

    print(f"\n🎉 Complete!")
    print(f"   Concepts seeded: {total_concepts}")
    print(f"   Chunks seeded:   {total_chunks}")
    print(f"   Backup saved:    {backup}")
    print(f"\n   Students can now ask about all {total_concepts} concepts at ₹0!")


if __name__ == "__main__":
    main()