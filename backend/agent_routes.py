"""
SOMI Mentor Agent — Backend Routes
────────────────────────────────────
Handles: intent detection, KG lookup, hierarchical context,
         LLM fallback with MAMA persona, session tracking.

Usage in main.py:
    from agent_routes import router as agent_router
    app.include_router(agent_router)
"""

from fastapi import APIRouter, Request
from datetime import datetime, timezone
import json
import re
import time

router = APIRouter(prefix="/agent", tags=["agent"])

# These get injected from main.py via init_agent()
_supabase = None
_claude = None


def init_agent(supabase_client, claude_client):
    """Call from main.py after creating clients."""
    global _supabase, _claude
    _supabase = supabase_client
    _claude = claude_client


# ═══════════════════════════════════════════════════════════════════════════
# INTENT DETECTION (rule-based, no ML)
# ═══════════════════════════════════════════════════════════════════════════

INTENT_PATTERNS = {
    "explain": [
        r"\bexplain\b", r"\bwhat\s+is\b", r"\bwhat\s+are\b", r"\bdefine\b",
        r"\bmeaning\b", r"\bcheppu\b", r"\bartham\b", r"\benti\b",
        r"\bexplain\s+simply\b", r"\bsimple\s+ga\b",
    ],
    "why": [
        r"\bwhy\b", r"\breason\b", r"\bendhuku\b", r"\benduku\b",
        r"\byenduku\b", r"\bhow\s+come\b", r"\bkaabatti\b",
        r"\bwhy\s+is\s+this\s+important\b",
    ],
    "example": [
        r"\bexample\b", r"\bgive\s+example\b", r"\breal\s+life\b",
        r"\bpractical\b", r"\budaharana\b", r"\bshow\s+me\b",
    ],
    "test": [
        r"\btest\s+me\b", r"\bquiz\b", r"\bquestion\b", r"\bpractice\b",
        r"\bmcq\b", r"\bcheck\b", r"\btest\b",
    ],
    "next": [
        r"\bnext\b", r"\bcontinue\b", r"\bnext\s+concept\b",
        r"\bmundhuku\b", r"\bgo\s+ahead\b",
    ],
    "previous": [
        r"\bprevious\b", r"\bback\b", r"\bbefore\b",
        r"\bvenakki\b", r"\bgo\s+back\b",
    ],
    "repeat": [
        r"\brepeat\b", r"\bagain\b", r"\bone\s+more\s+time\b",
        r"\bmalli\b", r"\bsay\s+again\b",
    ],
    "related": [
        r"\brelated\b", r"\bsimilar\b", r"\bconnected\b",
        r"\blike\s+this\b", r"\balso\b",
    ],
    "summarize": [
        r"\bsummar\b", r"\bbrief\b", r"\bshort\b", r"\boverview\b",
        r"\bquick\s+revision\b", r"\brevise\b",
    ],
    "doubt": [
        r"\bartham\s+kaaledu\b", r"\bdon.?t\s+understand\b",
        r"\bconfused\b", r"\bunclear\b", r"\bdoubt\b",
        r"\bnot\s+getting\b", r"\bdifficult\b",
    ],
    "progress": [
        r"\bprogress\b", r"\bhow\s+am\s+i\b", r"\bweak\b",
        r"\bperformance\b", r"\bstatus\b",
    ],
}

# Navigation intents — handled without server call ideally,
# but we support them here for the global agent mode
NAVIGATION_INTENTS = {"next", "previous", "repeat", "related"}
CONTENT_INTENTS = {"explain", "why", "example", "test", "summarize", "doubt"}


def detect_intent(message: str) -> str:
    """Rule-based intent detection. Returns intent string."""
    lower = message.lower().strip()

    # Check each intent pattern
    for intent, patterns in INTENT_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, lower):
                return intent

    # Default: treat as general question → explain intent
    return "general"


# ═══════════════════════════════════════════════════════════════════════════
# MAMA SYSTEM PROMPT
# ═══════════════════════════════════════════════════════════════════════════

def build_mama_prompt(
    mode: str,
    concept: str = "",
    chapter: str = "",
    subject: str = "",
    context_text: str = "",
    intent: str = "general",
) -> str:
    """Build the MAMA persona system prompt with hierarchical context."""

    context_section = ""
    if context_text:
        context_section = f"""
REFERENCE CONTENT (from verified ICMAI material):
{context_text}

Use this content as your primary source. Cite Section/Article numbers when available.
"""

    scope_instruction = ""
    if mode == "concept":
        scope_instruction = f"""
CURRENT CONTEXT:
- Concept: {concept}
- Chapter: {chapter}
- Subject: {subject}
Focus your answer on this specific concept first.
If the question goes beyond this concept, you may reference the broader chapter/subject.
"""
    else:
        scope_instruction = f"""
MODE: Global (course-level)
The student may ask about any subject or concept.
Help them navigate their studies and find the right topic.
"""

    return f"""You are MAMA (Mentor And Motivational Advisor) — a warm, knowledgeable uncle
who explains CMA/CA concepts to students in Andhra Pradesh and Telangana.

PERSONALITY:
- Speak in Tenglish (Telugu-English mix) naturally
- Use: idi, adi, chala, ayindi, kaabatti, okay va, chuddam, orey, baaga
- NEVER use: beta, da, ra, or any Hinglish terms
- Be encouraging but direct — students respect honesty
- Use real Indian examples (₹, Indian companies, daily life scenarios)

FORMAT:
- Keep responses under 200 words (concise is better)
- Use **bold** for key terms and formulas
- Use bullet points for lists
- Use tables (markdown) for comparisons and numerical data
- End with a practical exam tip when relevant

{scope_instruction}
{context_section}

INTENT: The student's intent is "{intent}".
{"Generate a practice MCQ with 4 options, mark the correct answer, and give a brief explanation." if intent == "test" else ""}
{"The student didn't understand. Explain differently — use a simpler analogy or break it into smaller steps." if intent == "doubt" else ""}
{"Give a brief 3-4 line summary only." if intent == "summarize" else ""}
{"Provide a concrete real-world example from Indian context." if intent == "example" else ""}
"""


# ═══════════════════════════════════════════════════════════════════════════
# KG LOOKUP — Search mama_lines for relevant content
# ═══════════════════════════════════════════════════════════════════════════

def search_kg(namespace: str, chapter: str, concept: str, query: str) -> dict:
    """
    Search lesson_content mama_lines for content matching the query.
    Returns: { found: bool, text: str, source: str, concept_title: str }
    """
    if not _supabase:
        return {"found": False, "text": "", "source": "", "concept_title": ""}

    try:
        # Get all verified content for this chapter
        r = _supabase.table("lesson_content")\
            .select("concept, mama_lines, book_page")\
            .eq("chapter", chapter)\
            .eq("is_verified", True)\
            .order("book_page")\
            .execute()

        if not r.data:
            return {"found": False, "text": "", "source": "", "concept_title": ""}

        query_lower = query.lower()
        best_match = None
        best_score = 0

        for row in r.data:
            lines = row.get("mama_lines", [])
            if isinstance(lines, str):
                try:
                    lines = json.loads(lines)
                except:
                    continue

            for line in (lines or []):
                score = 0
                # Check concept_title match
                title = (line.get("concept_title") or "").lower()
                text = (line.get("text") or "").lower()
                tenglish = (line.get("tenglish") or "").lower()

                # Score based on keyword overlap
                query_words = set(query_lower.split())
                title_words = set(title.split())
                text_words = set(text.split())

                # Title match (highest weight)
                title_overlap = len(query_words & title_words)
                score += title_overlap * 3

                # Text match
                text_overlap = len(query_words & text_words)
                score += text_overlap * 1

                # Exact substring match in title (bonus)
                for qw in query_words:
                    if len(qw) > 3 and qw in title:
                        score += 5

                # Current concept bonus (if query is about what they're studying)
                if concept and concept.lower() in title:
                    score += 2

                if score > best_score:
                    best_score = score
                    best_match = {
                        "found": True,
                        "text": line.get("tenglish") or line.get("text") or "",
                        "source": f"Chapter {chapter}, Page {row.get('book_page', '?')}",
                        "concept_title": line.get("concept_title") or row.get("concept", ""),
                        "variation_2": line.get("tenglish_variation_2") or "",
                        "variation_3": line.get("tenglish_variation_3") or "",
                        "mamas_tip": line.get("mamas_tip") or "",
                        "check_question": line.get("check_question") or "",
                        "score": score,
                    }

        # Threshold: need at least score 3 to consider it a KG hit
        if best_match and best_score >= 3:
            return best_match

        return {"found": False, "text": "", "source": "", "concept_title": ""}

    except Exception as e:
        print(f"KG search error: {e}")
        return {"found": False, "text": "", "source": "", "concept_title": ""}


# ═══════════════════════════════════════════════════════════════════════════
# SESSION MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════

def get_or_create_session(student_id: str, mode: str, namespace: str = "",
                          concept: str = "", chapter: str = "") -> dict:
    """Get existing session or create new one."""
    if not student_id or student_id == "anonymous":
        return {"id": "local", "total_interactions": 0}
    if not _supabase:
        return {"id": "local", "total_interactions": 0}

    try:
        # Look for recent session (within last 2 hours)
        r = _supabase.table("agent_sessions")\
            .select("*")\
            .eq("student_id", student_id)\
            .eq("mode", mode)\
            .gte("last_active", (datetime.now(timezone.utc).replace(
                hour=datetime.now(timezone.utc).hour - 2
            )).isoformat())\
            .order("last_active", desc=True)\
            .limit(1)\
            .execute()

        if r.data:
            session = r.data[0]
            # Update context if changed
            _supabase.table("agent_sessions")\
                .update({
                    "current_concept": concept,
                    "current_chapter": chapter,
                    "current_namespace": namespace,
                    "last_active": datetime.now(timezone.utc).isoformat(),
                })\
                .eq("id", session["id"])\
                .execute()
            return session

        # Create new session
        new_session = {
            "student_id": student_id,
            "mode": mode,
            "current_concept": concept,
            "current_chapter": chapter,
            "current_namespace": namespace,
        }
        r = _supabase.table("agent_sessions")\
            .insert(new_session)\
            .execute()
        return r.data[0] if r.data else {"id": "local", "total_interactions": 0}

    except Exception as e:
        print(f"Session error: {e}")
        return {"id": "local", "total_interactions": 0}


def log_message(
    student_id: str, session_id: str, mode: str,
    namespace: str, concept: str, chapter: str,
    intent: str, message: str, reply: str,
    source: str, response_ms: int,
):
    """Log agent message to DB for analytics."""
    if not _supabase or session_id == "local":
        return

    try:
        _supabase.table("agent_messages").insert({
            "student_id": student_id,
            "session_id": session_id,
            "mode": mode,
            "namespace": namespace,
            "concept": concept,
            "chapter": chapter,
            "intent": intent,
            "message": message,
            "reply": reply,
            "source": source,
            "response_ms": response_ms,
        }).execute()

        # Update session stats
        _supabase.table("agent_sessions")\
            .update({
                "total_interactions": session_id and _supabase.table("agent_sessions")
                    .select("total_interactions")
                    .eq("id", session_id)
                    .execute().data[0]["total_interactions"] + 1
                    if session_id != "local" else 1,
                "last_active": datetime.now(timezone.utc).isoformat(),
            })\
            .eq("id", session_id)\
            .execute()

    except Exception as e:
        print(f"Log message error: {e}")


def queue_fallback_review(
    message_id: str, question: str, response: str,
    namespace: str, concept: str, chapter: str,
):
    """Add LLM fallback to review queue for potential KG inclusion."""
    if not _supabase:
        return

    try:
        # Check if similar question already queued
        existing = _supabase.table("agent_fallback_queue")\
            .select("id, times_asked")\
            .eq("student_question", question)\
            .eq("namespace", namespace or "")\
            .limit(1)\
            .execute()

        if existing.data:
            # Increment counter
            _supabase.table("agent_fallback_queue")\
                .update({"times_asked": existing.data[0]["times_asked"] + 1})\
                .eq("id", existing.data[0]["id"])\
                .execute()
        else:
            _supabase.table("agent_fallback_queue").insert({
                "message_id": message_id,
                "student_question": question,
                "llm_response": response,
                "namespace": namespace,
                "concept": concept,
                "chapter": chapter,
            }).execute()

    except Exception as e:
        print(f"Fallback queue error: {e}")


# ═══════════════════════════════════════════════════════════════════════════
# EXTRACT CHAPTER FROM NAMESPACE
# ═══════════════════════════════════════════════════════════════════════════

def extract_chapter(namespace: str) -> str:
    """Extract chapter number from namespace like 'cma_f_law_ch1_s1' → '1'."""
    if not namespace:
        return ""
    parts = namespace.split("_")
    for part in parts:
        if part.startswith("ch"):
            return part.replace("ch", "")
    return ""


# ═══════════════════════════════════════════════════════════════════════════
# MAIN CHAT ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════

@router.post("/chat")
async def agent_chat(request: Request):
    """
    Main agent endpoint.

    Body:
    {
        "student_id": "uuid",
        "student_name": "Ravi",
        "message": "explain marginal cost",
        "mode": "concept" | "global",
        "namespace": "cma_f_cost_ch3_s1",
        "concept": "Marginal Cost",
        "subject": "Cost Accounting",
        "chapter": "Chapter 3"
    }
    """
    start_time = time.time()
    body = await request.json()

    student_id   = body.get("student_id", "anonymous")
    student_name = body.get("student_name", "Student")
    message      = body.get("message", "").strip()
    mode         = body.get("mode", "concept")
    namespace    = body.get("namespace", "")
    concept      = body.get("concept", "")
    subject      = body.get("subject", "")
    chapter_raw  = body.get("chapter", "")

    # Extract clean chapter number
    chapter = extract_chapter(namespace) or chapter_raw.replace("Chapter ", "")

    if not message:
        return {"error": "Message is required"}

    # ── Step 1: Detect intent ──
    intent = detect_intent(message)

    # ── Step 2: Get/create session ──
    session = get_or_create_session(
        student_id, mode, namespace, concept, chapter
    )
    session_id = session.get("id", "local")

    # ── Step 3: Try KG lookup (concept mode) ──
    kg_result = {"found": False}
    source = "llm_fallback"

    if mode == "concept" and chapter and intent in CONTENT_INTENTS | {"general"}:
        kg_result = search_kg(namespace, chapter, concept, message)

    # ── Step 4: Build response ──
    reply = ""
    suggested_actions = []

    if kg_result.get("found") and intent != "test":
        # ── KG HIT: serve precomputed content ──
        source = "kg"

        if intent == "doubt":
            # Student didn't understand — serve variation_2 (different explanation)
            reply = kg_result.get("variation_2") or kg_result.get("text")
            if not reply or reply == kg_result.get("text"):
                # No variation available, fall through to LLM
                source = "llm_fallback"
            else:
                suggested_actions = ["Still confused? Ask differently", "Test me", "Next concept"]
        elif intent == "summarize":
            # Quick summary — serve the tip or first few lines
            tip = kg_result.get("mamas_tip", "")
            text = kg_result.get("text", "")
            reply = tip if tip else (text[:300] + "..." if len(text) > 300 else text)
            suggested_actions = ["Explain in detail", "Test me", "Next concept"]
        elif intent == "example":
            # Serve variation_3 (master/deep dive with examples)
            reply = kg_result.get("variation_3") or kg_result.get("text")
            suggested_actions = ["Explain the basics", "Test me", "Related topics"]
        else:
            # Default: serve main tenglish explanation
            reply = kg_result.get("text", "")
            if kg_result.get("mamas_tip"):
                reply += f"\n\n💡 **Mama's Tip:** {kg_result['mamas_tip']}"
            suggested_actions = ["Give example", "Test me", "Why is this important?"]

    if source == "llm_fallback" or intent == "test":
        # ── LLM FALLBACK ──
        source = "llm_fallback"

        # Build context from KG if available
        context_text = ""
        if kg_result.get("found"):
            context_text = kg_result.get("text", "")

        system_prompt = build_mama_prompt(
            mode=mode,
            concept=concept,
            chapter=chapter_raw,
            subject=subject,
            context_text=context_text,
            intent=intent,
        )

        try:
            r = _claude.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=400,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": f"{student_name} asks: {message}"}
                ],
            )
            reply = r.content[0].text

            if intent == "test":
                suggested_actions = ["Show answer", "Different question", "Explain this topic"]
            else:
                suggested_actions = ["Tell me more", "Test me", "Next concept"]

        except Exception as e:
            print(f"LLM error: {e}")
            reply = f"Sorry {student_name}, technical issue vachindi. Malli try cheyyi! 🙏"
            suggested_actions = ["Try again"]

    # ── Step 5: Calculate response time ──
    response_ms = int((time.time() - start_time) * 1000)

    # ── Step 6: Log message (async-safe) ──
    try:
        log_message(
            student_id=student_id,
            session_id=session_id,
            mode=mode,
            namespace=namespace,
            concept=concept,
            chapter=chapter,
            intent=intent,
            message=message,
            reply=reply,
            source=source,
            response_ms=response_ms,
        )

        # Queue fallback responses for review
        if source == "llm_fallback" and intent != "test":
            queue_fallback_review(
                message_id="",
                question=message,
                response=reply,
                namespace=namespace,
                concept=concept,
                chapter=chapter,
            )
    except Exception as e:
        print(f"Logging error (non-fatal): {e}")

    # ── Step 7: Return response ──
    return {
        "reply": reply,
        "source": source,
        "intent": intent,
        "suggested_actions": suggested_actions,
        "session_id": session_id,
        "response_ms": response_ms,
        "concept_title": kg_result.get("concept_title", concept),
    }


# ═══════════════════════════════════════════════════════════════════════════
# SESSION STATS ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/session/{student_id}")
async def get_session(student_id: str):
    """Get agent session stats for a student."""
    if not _supabase:
        return {"sessions": [], "total_interactions": 0}

    try:
        r = _supabase.table("agent_sessions")\
            .select("*")\
            .eq("student_id", student_id)\
            .order("last_active", desc=True)\
            .limit(5)\
            .execute()

        total = sum(s.get("total_interactions", 0) for s in (r.data or []))
        kg = sum(s.get("kg_hits", 0) for s in (r.data or []))
        llm = sum(s.get("llm_hits", 0) for s in (r.data or []))

        return {
            "sessions": r.data or [],
            "total_interactions": total,
            "kg_hits": kg,
            "llm_hits": llm,
            "kg_ratio": round(kg / max(total, 1), 2),
        }
    except Exception as e:
        return {"error": str(e)}


# ═══════════════════════════════════════════════════════════════════════════
# FALLBACK REVIEW ENDPOINTS (for admin)
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/fallback-queue")
async def get_fallback_queue(status: str = "pending", limit: int = 20):
    """Get pending fallback responses for review."""
    if not _supabase:
        return {"queue": []}

    try:
        r = _supabase.table("agent_fallback_queue")\
            .select("*")\
            .eq("status", status)\
            .order("times_asked", desc=True)\
            .limit(limit)\
            .execute()
        return {"queue": r.data or []}
    except Exception as e:
        return {"error": str(e)}


@router.post("/fallback-queue/{item_id}/review")
async def review_fallback(item_id: str, request: Request):
    """Mark a fallback response as approved/rejected."""
    if not _supabase:
        return {"error": "DB not available"}

    body = await request.json()
    status = body.get("status", "approved")
    reviewer = body.get("reviewed_by", "admin")

    try:
        _supabase.table("agent_fallback_queue")\
            .update({
                "status": status,
                "reviewed_by": reviewer,
                "reviewed_at": datetime.now(timezone.utc).isoformat(),
            })\
            .eq("id", item_id)\
            .execute()
        return {"success": True, "status": status}
    except Exception as e:
        return {"error": str(e)}
