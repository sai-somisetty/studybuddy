"""
SOMI Session Engine — Mama teaches line by line from textbook_structure.
State machine: INTRO → KITTY → OPEN_BOOK → LINE_BY_LINE → CHECK → COMPLETE
"""

import json
import os
from datetime import datetime
from dotenv import load_dotenv
from anthropic import Anthropic
from supabase import create_client

load_dotenv()

# ── Clients ──

_sb = None
_claude = None


def get_sb():
    global _sb
    if not _sb:
        _sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
    return _sb


def get_claude():
    global _claude
    if not _claude:
        _claude = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    return _claude


# ── Models ──

HAIKU = "claude-haiku-4-5-20251001"
SONNET = "claude-sonnet-4-20250514"


# ── Kitty Tenglish questions ──

KITTY_QUESTIONS = [
    "Mama — idi real life lo ela work avthundi? Naku ardam kaale...",
    "Mama wait — idi exam lo direct ga vastunda? Entha marks?",
    "Mama — oka example cheppu na, Indian company tho!",
    "Mama — idi chaala confusing ga undi, simple ga cheppu please!",
    "Mama — previous question ki idi connect avthunda?",
    "Mama — idi definition exact ga remember cheyaala?",
    "Mama — oka case study cheppu na idi use chesi!",
    "Mama — nenu wrong ga answer chesthe examiner minus marks esthaada?",
]


def get_kitty_question(idx):
    return KITTY_QUESTIONS[idx % len(KITTY_QUESTIONS)]


# ── DB Queries ──

def get_first_node(course, level, paper, subject, section_label):
    """Get first node of a section ordered by reading_order."""
    sb = get_sb()
    r = sb.table("textbook_structure")\
        .select("*")\
        .eq("course", course)\
        .eq("level_name", level)\
        .eq("paper_number", paper)\
        .eq("subject", subject)\
        .eq("section_label", section_label)\
        .order("reading_order")\
        .limit(1)\
        .execute()
    return r.data[0] if r.data else None


def get_node_by_order(course, level, paper, subject, reading_order):
    """Get node at exact reading_order."""
    sb = get_sb()
    r = sb.table("textbook_structure")\
        .select("*")\
        .eq("course", course)\
        .eq("level_name", level)\
        .eq("paper_number", paper)\
        .eq("subject", subject)\
        .eq("reading_order", reading_order)\
        .limit(1)\
        .execute()
    return r.data[0] if r.data else None


def get_next_node(course, level, paper, subject, section_label, reading_order):
    """Get next node after current reading_order in same section."""
    sb = get_sb()
    r = sb.table("textbook_structure")\
        .select("*")\
        .eq("course", course)\
        .eq("level_name", level)\
        .eq("paper_number", paper)\
        .eq("subject", subject)\
        .eq("section_label", section_label)\
        .gt("reading_order", reading_order)\
        .order("reading_order")\
        .limit(1)\
        .execute()
    return r.data[0] if r.data else None


def save_session(student_id, namespace, concept, state, page, paragraph, section, history):
    """Save session state after every message."""
    sb = get_sb()
    existing = sb.table("session_state")\
        .select("id")\
        .eq("student_id", student_id)\
        .eq("namespace", namespace)\
        .eq("concept", concept)\
        .limit(1)\
        .execute()

    row = {
        "student_id": student_id,
        "namespace": namespace,
        "concept": concept,
        "current_state": state,
        "current_page": page,
        "current_paragraph": paragraph,
        "current_section": section,
        "session_history": json.dumps(history[-20:]),  # keep last 20
        "updated_at": datetime.now().isoformat(),
    }

    if existing.data:
        sb.table("session_state")\
            .update(row)\
            .eq("id", existing.data[0]["id"])\
            .execute()
    else:
        sb.table("session_state").insert(row).execute()


# ── Claude call ──

def ask_claude(prompt, model=HAIKU, max_tokens=500):
    """Call Claude with given prompt. Defaults to Haiku for cost."""
    claude = get_claude()
    r = claude.messages.create(
        model=model,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    return r.content[0].text.strip()


# ── State handlers ──

def handle_intro(req, first_node):
    """INTRO state — Mama greets student and introduces the section."""
    content = first_node["content"][:300]
    section = req["section_label"]
    name = req["student_name"]

    prompt = f"""You are Mama — warm CMA mentor who teaches like a loving Indian mother.
Student name: {name}
Section: {section}
First line of this section: {content}

Greet student by name.
Tell them what section we study today.
Give ONE real world example using Indian company — Infosys, Tata, Amul, SBI, Zomato, Wipro, or Maruti.
Even a child can understand it.
Keep it under 4 sentences.
End with: Ready to open the book?"""

    mama = ask_claude(prompt)
    kitty_msg = get_kitty_question(0)

    return {
        "mama_response": mama,
        "kitty_message": kitty_msg,
        "show_kitty": True,
        "next_state": "KITTY",
        "next_reading_order": first_node["reading_order"],
        "current_node": node_summary(first_node),
        "page_to_open": first_node.get("page_number"),
        "show_check_question": False,
        "check_question": None,
        "check_options": None,
        "check_answer": None,
        "session_complete": False,
    }


def handle_kitty(req, first_node):
    """KITTY state — Mama answers Kitty's question simply."""
    name = req["student_name"]
    section = req["section_label"]
    kitty_q = get_kitty_question(0)

    prompt = f"""You are Mama — warm CMA mentor.
Kitty (a confused Telugu student) asked: "{kitty_q}"
Topic: Section {section}
Content context: {first_node['content'][:200]}

Answer Kitty's confused question simply. Under 2 sentences.
Then ask {name}: Got the basic idea? Ready to open your ICMAI book?"""

    mama = ask_claude(prompt)

    return {
        "mama_response": mama,
        "kitty_message": None,
        "show_kitty": False,
        "next_state": "OPEN_BOOK",
        "next_reading_order": first_node["reading_order"],
        "current_node": node_summary(first_node),
        "page_to_open": first_node.get("page_number"),
        "show_check_question": False,
        "check_question": None,
        "check_options": None,
        "check_answer": None,
        "session_complete": False,
    }


def handle_open_book(req, first_node):
    """OPEN_BOOK state — tell student exact page to open."""
    page = first_node.get("page_number", "?")
    section = req["section_label"]

    mama = (
        f"Open your ICMAI book to page {page}. "
        f"Find section {section}. "
        f"Tell me when you are ready — I will teach you line by line!"
    )

    return {
        "mama_response": mama,
        "kitty_message": None,
        "show_kitty": False,
        "next_state": "LINE_BY_LINE",
        "next_reading_order": first_node["reading_order"],
        "current_node": node_summary(first_node),
        "page_to_open": page,
        "show_check_question": False,
        "check_question": None,
        "check_options": None,
        "check_answer": None,
        "session_complete": False,
    }


def handle_line_by_line(req, node, node_count):
    """LINE_BY_LINE state — teach current node, advance to next."""
    name = req["student_name"]
    content = node["content"]
    page = node.get("page_number", "?")
    section = node.get("section_label", "?")
    ntype = node.get("node_type", "paragraph")
    history = req.get("session_history", [])
    student_msg = req.get("student_message", "").lower().strip()

    # Check if student is confused — use Sonnet if 3+ times confused
    confused_keywords = ["not clear", "confused", "explain again", "don't understand", "samajh nahi", "ardam kaale"]
    is_confused = any(kw in student_msg for kw in confused_keywords)

    # Count confusion streak
    confusion_count = 0
    for h in reversed(history[-6:]):
        if h.get("role") == "student" and any(kw in h.get("text", "").lower() for kw in confused_keywords):
            confusion_count += 1
        else:
            break

    model = SONNET if confusion_count >= 3 else HAIKU

    if is_confused:
        # Re-explain same node with different example
        prompt = f"""You are Mama — warm CMA mentor.
Student {name} said they are confused about this content.
Use a DIFFERENT Indian company example this time.
If you used Tata before, use Amul or Zomato now.

Content they are confused about:
[Page {page}, Section {section}]
'{content}'

Re-explain in simpler words. Max 3 sentences.
End with: Clear now {name}? Type YES to continue."""

        mama = ask_claude(prompt, model=model)

        return {
            "mama_response": mama,
            "kitty_message": None,
            "show_kitty": False,
            "next_state": "LINE_BY_LINE",
            "next_reading_order": node["reading_order"],  # same node
            "current_node": node_summary(node),
            "page_to_open": page,
            "show_check_question": False,
            "check_question": None,
            "check_options": None,
            "check_answer": None,
            "session_complete": False,
        }

    # Normal flow — explain current node and advance
    last_3 = ""
    for h in history[-3:]:
        last_3 += f"{h.get('role','')}: {h.get('text','')[:100]}\n"

    prompt = f"""You are Mama teaching CMA student.

IRON RULES:
- Show EXACT text first always
- Format: [Page {page}, {section}]
  '{content}'
- Then explain in simple words
- Use real Indian company example — Infosys, Tata, Amul, SBI, Zomato, Wipro, Maruti
- Keep explanation under 3 sentences
- End with: Clear {name}? Type YES to continue or tell me what is confusing.

Current node:
Page: {page}
Section: {section}
Type: {ntype}
Content: {content}

Student name: {name}
Previous context: {last_3}"""

    mama = ask_claude(prompt)

    # Get next node
    next_node = get_next_node(
        req["course"], req["level_name"], req["paper_number"],
        req["subject"], req["section_label"], node["reading_order"],
    )

    # Show kitty every 3rd node
    show_kitty = (node_count % 3 == 0) and node_count > 0
    kitty_msg = get_kitty_question(node_count) if show_kitty else None

    # Show check question every 5th node
    show_check = (node_count % 5 == 0) and node_count > 0
    check_q = None
    check_opts = None
    check_ans = None

    if show_check:
        check_prompt = f"""Create ONE MCQ question testing understanding of this content:
'{content}'

Return ONLY valid JSON:
{{"question": "...", "options": ["A", "B", "C", "D"], "answer": 0, "explanation": "..."}}
answer is index 0-3 of correct option."""

        try:
            check_raw = ask_claude(check_prompt, model=HAIKU, max_tokens=300)
            if "```" in check_raw:
                for part in check_raw.split("```"):
                    part = part.strip()
                    if part.startswith("json"):
                        part = part[4:]
                    part = part.strip()
                    if part.startswith("{"):
                        check_raw = part
                        break
            check_data = json.loads(check_raw)
            check_q = check_data.get("question")
            check_opts = check_data.get("options")
            check_ans = check_data.get("answer")
        except Exception:
            show_check = False

    if not next_node:
        # Section complete
        return {
            "mama_response": mama,
            "kitty_message": kitty_msg,
            "show_kitty": show_kitty,
            "next_state": "COMPLETE",
            "next_reading_order": node["reading_order"],
            "current_node": node_summary(node),
            "page_to_open": page,
            "show_check_question": show_check,
            "check_question": check_q,
            "check_options": check_opts,
            "check_answer": check_ans,
            "session_complete": True,
        }

    next_state = "CHECK" if show_check else "LINE_BY_LINE"

    return {
        "mama_response": mama,
        "kitty_message": kitty_msg,
        "show_kitty": show_kitty,
        "next_state": next_state,
        "next_reading_order": next_node["reading_order"],
        "current_node": node_summary(node),
        "page_to_open": page,
        "show_check_question": show_check,
        "check_question": check_q,
        "check_options": check_opts,
        "check_answer": check_ans,
        "session_complete": False,
    }


def handle_check(req, node):
    """CHECK state — evaluate student's MCQ answer."""
    name = req["student_name"]
    student_msg = req.get("student_message", "").strip().upper()

    # Simple check — student sends A/B/C/D or 0/1/2/3
    correct_idx = req.get("check_answer", 0)
    correct_letter = chr(65 + correct_idx) if isinstance(correct_idx, int) else "A"

    is_correct = student_msg in [correct_letter, str(correct_idx)]

    if is_correct:
        mama = f"Excellent {name}! That's correct! Let's continue to the next part."
        next_state = "LINE_BY_LINE"
        next_order = node["reading_order"]
        # Advance to next node
        next_node = get_next_node(
            req["course"], req["level_name"], req["paper_number"],
            req["subject"], req["section_label"], node["reading_order"],
        )
        if next_node:
            next_order = next_node["reading_order"]
        else:
            next_state = "COMPLETE"
    else:
        mama = (
            f"Not quite right {name}, but don't worry! "
            f"Let me explain this part again. Read the content carefully."
        )
        next_state = "LINE_BY_LINE"
        next_order = node["reading_order"]  # same node

    return {
        "mama_response": mama,
        "kitty_message": None,
        "show_kitty": False,
        "next_state": next_state,
        "next_reading_order": next_order,
        "current_node": node_summary(node),
        "page_to_open": node.get("page_number"),
        "show_check_question": False,
        "check_question": None,
        "check_options": None,
        "check_answer": None,
        "session_complete": next_state == "COMPLETE",
    }


def handle_complete(req, node):
    """COMPLETE state — section finished."""
    name = req["student_name"]
    section = req["section_label"]

    mama = (
        f"Congratulations {name}! You have completed Section {section}! "
        f"You read every line from the ICMAI book and understood it all. "
        f"Mama is so proud of you! Ready to test yourself with a quiz?"
    )

    return {
        "mama_response": mama,
        "kitty_message": f"Mama — {name} ki congratulations cheppu! Section complete ayyindi!",
        "show_kitty": True,
        "next_state": "COMPLETE",
        "next_reading_order": node["reading_order"] if node else 0,
        "current_node": node_summary(node) if node else None,
        "page_to_open": None,
        "show_check_question": False,
        "check_question": None,
        "check_options": None,
        "check_answer": None,
        "session_complete": True,
    }


# ── Helpers ──

def node_summary(node):
    """Return minimal node info for response."""
    if not node:
        return None
    return {
        "content": node.get("content", ""),
        "page_number": node.get("page_number"),
        "section_label": node.get("section_label", ""),
        "node_type": node.get("node_type", ""),
    }


# ── Main router ──

def process_message(req: dict) -> dict:
    """Route request to correct state handler."""
    state = req.get("current_state", "INTRO")
    course = req["course"]
    level = req["level_name"]
    paper = req["paper_number"]
    subject = req["subject"]
    section = req["section_label"]
    reading_order = req.get("current_reading_order", 0)
    student_id = req.get("student_id", "anonymous")
    history = req.get("session_history", [])

    # Add student message to history
    student_msg = req.get("student_message", "")
    if student_msg:
        history.append({"role": "student", "text": student_msg, "ts": datetime.now().isoformat()})

    # Count nodes seen (for kitty/check frequency)
    node_count = len([h for h in history if h.get("role") == "mama"])

    # Fetch nodes
    first_node = get_first_node(course, level, paper, subject, section)
    if not first_node:
        return {
            "mama_response": f"Sorry — Mama cannot find Section {section} in the textbook yet. Try another section.",
            "kitty_message": None, "show_kitty": False,
            "next_state": "INTRO", "next_reading_order": 0,
            "current_node": None, "page_to_open": None,
            "show_check_question": False, "check_question": None,
            "check_options": None, "check_answer": None,
            "session_complete": False,
        }

    current_node = None
    if reading_order > 0:
        current_node = get_node_by_order(course, level, paper, subject, reading_order)
    if not current_node:
        current_node = first_node

    # Route to state handler
    if state == "INTRO":
        result = handle_intro(req, first_node)
    elif state == "KITTY":
        result = handle_kitty(req, first_node)
    elif state == "OPEN_BOOK":
        result = handle_open_book(req, first_node)
    elif state == "LINE_BY_LINE":
        result = handle_line_by_line(req, current_node, node_count)
    elif state == "CHECK":
        result = handle_check(req, current_node)
    elif state == "COMPLETE":
        result = handle_complete(req, current_node)
    else:
        result = handle_intro(req, first_node)

    # Add mama response to history
    history.append({"role": "mama", "text": result["mama_response"][:200], "ts": datetime.now().isoformat()})

    # Save session state
    namespace = f"{course}_{level[:1]}_{subject}"
    try:
        save_session(
            student_id=student_id,
            namespace=namespace,
            concept=section,
            state=result["next_state"],
            page=result.get("page_to_open"),
            paragraph=result["next_reading_order"],
            section=section,
            history=history,
        )
    except Exception as e:
        print(f"Session save error: {e}")

    # Attach updated history
    result["session_history"] = history

    return result
