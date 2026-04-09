from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from supabase import create_client
from anthropic import Anthropic
from dotenv import load_dotenv
from quiz import generate_mcq, evaluate_answer
from backup import run_backup
from session_engine import process_message
from parent_routes import router as parent_router
import chromadb
import httpx
import os
import json
import random
from datetime import date, datetime, timedelta

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000",
                   "https://somi-two.vercel.app", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(parent_router)

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)
claude = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
chroma = chromadb.PersistentClient(path="./chromadb_data")


# ── AUTH: Send OTP ─────────────────────────────────────────────────────────────
@app.post("/auth/send-otp")
async def send_otp(request: Request):
    body = await request.json()
    email = body.get("email", "").strip().lower()
    if not email:
        return JSONResponse({"error": "Email required"}, status_code=400)

    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{SUPABASE_URL}/auth/v1/otp",
            headers={
                "apikey": SUPABASE_KEY,
                "Content-Type": "application/json",
            },
            json={
                "email": email,
                "create_user": True,
                "options": {
                    "should_create_user": True,
                },
            },
        )

    if res.status_code == 200:
        return {"success": True, "message": "OTP sent"}
    return JSONResponse(
        {"error": "Failed to send OTP", "detail": res.text},
        status_code=400,
    )


# ── AUTH: Verify OTP ─────────────────────────────────────────────────────────
@app.post("/auth/verify-otp")
async def verify_otp(request: Request):
    body = await request.json()
    email = body.get("email", "").strip().lower()
    token = body.get("token", "").strip()

    if not email or not token:
        return JSONResponse({"error": "Email and token required"}, status_code=400)

    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{SUPABASE_URL}/auth/v1/verify",
            headers={
                "apikey": SUPABASE_KEY,
                "Content-Type": "application/json",
            },
            json={"email": email, "token": token, "type": "email"},
        )

    if res.status_code == 200:
        data = res.json()
        user = data.get("user", {})
        access_token = data.get("access_token", "")

        sb_res = (
            supabase.table("students")
            .select("*")
            .eq("auth_id", user.get("id"))
            .execute()
        )

        is_new = len(sb_res.data) == 0
        student = sb_res.data[0] if not is_new else None

        return {
            "success": True,
            "access_token": access_token,
            "user_id": user.get("id"),
            "email": user.get("email"),
            "is_new": is_new,
            "student": student,
        }
    return JSONResponse(
        {"error": "Invalid OTP", "detail": res.text},
        status_code=400,
    )


# ── AUTH: Save Profile ───────────────────────────────────────────────────────
@app.post("/auth/profile")
async def save_profile(request: Request):
    body = await request.json()
    auth_id = body.get("auth_id")
    email = body.get("email", "").strip().lower()
    name = body.get("name", "").strip()
    state = body.get("state", "")
    gender = body.get("gender", "")
    exam_level = body.get("exam_level", "")
    language_pref = body.get("language_pref", "tenglish")

    if not auth_id or not name:
        return JSONResponse({"error": "auth_id and name required"}, status_code=400)

    existing = (
        supabase.table("students").select("id").eq("auth_id", auth_id).execute()
    )

    base = {
        "auth_id": auth_id,
        "email": email,
        "name": name,
        "state": state,
        "gender": gender,
        "exam_level": exam_level,
        "language_pref": language_pref,
    }

    if existing.data:
        supabase.table("students").update(base).eq("auth_id", auth_id).execute()
    else:
        insert_payload = {**base, "created_at": datetime.utcnow().isoformat()}
        supabase.table("students").insert(insert_payload).execute()

    return {"success": True, "name": name}


# ── HEALTH CHECK ──

@app.get("/")
def root():
    return {"message": "Study Buddy is alive"}

@app.get("/test-db")
def test_db():
    return {"status": "Supabase connected"}


# ── STUDENT ──

@app.post("/student/register")
def register(name: str, stream: str, exam_date: str, city: str):
    r = supabase.table("students").insert({
        "name": name, "stream": stream,
        "exam_date": exam_date, "city": city
    }).execute()
    return {"message": f"Welcome {name}!", "student": r.data}


# ── ASK MAMA ──

@app.get("/ask")
def ask(question: str,
        namespace: str = "cma_f_law_ch1_s1",
        student_name: str = "Student"):
    rag_context    = ""
    source_display = ""
    verified       = False
    try:
        col = chroma.get_collection(name=namespace)
        res = col.query(query_texts=[question], n_results=2)
        if res and res["documents"][0]:
            rag_context    = res["documents"][0][0]
            m              = res["metadatas"][0][0]
            source_display = m.get("source", "ICAI Study Material")
            if m.get("chapter"):   source_display += f" — Chapter {m['chapter']}"
            if m.get("page"):      source_display += f", Page {m['page']}"
            if m.get("paragraph"): source_display += f", Para {m['paragraph']}"
            verified = True
    except Exception as e:
        print(f"RAG error: {e}")

    prompt = f"""You are SOMI — AI mentor for CA/CMA students.
{f"Use this official ICAI content: {rag_context}" if rag_context else "Use ICAI/ICMAI official material only."}
Answer in maximum 3 sentences. Be direct. No preamble.
Student: {student_name}
Question: {question}"""

    r = claude.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}]
    )
    return {
        "question": question,
        "answer":   r.content[0].text,
        "verified_from_textbook": verified,
        "source":   source_display if verified else "AI generated",
        "badge":    "Verified from ICAI textbook" if verified else "AI generated",
        "student":  student_name
    }


# ── QUIZ ──

@app.get("/quiz/generate")
def get_quiz(namespace: str = "cma_f_law_ch1_s1",
             concept: str = "Definition of Contract",
             n_questions: int = 5):
    quiz = generate_mcq(namespace=namespace,
                        concept=concept,
                        n_questions=n_questions)
    return quiz if quiz else {"error": "Could not generate"}

@app.post("/quiz/answer")
def check_answer(question: str, student_answer: str,
                 correct_answer: str, explanation: str):
    return evaluate_answer(question, student_answer,
                           correct_answer, explanation)

@app.post("/evaluate")
async def evaluate_typed(request: dict):
    q     = request.get("question", "")
    a     = request.get("answer", "")
    m     = request.get("model_answer", "")
    marks = request.get("marks", 5)
    prompt = f"""You are SOMI — CA/CMA exam evaluator.
Question: {q}
Total marks: {marks}
Model answer: {m}
Student answer: {a}
Return ONLY valid JSON no preamble:
{{
  "content_score": <0-{marks}>,
  "total_marks": {marks},
  "what_correct": ["point 1"],
  "what_missing": ["missing 1"],
  "mama_feedback": "one encouraging sentence",
  "model_answer": "{m}"
}}"""
    r = claude.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}]
    )
    return json.loads(r.content[0].text.strip())


# ── STREAK ──

@app.post("/streak/update")
async def update_streak(request: dict):
    student_id = request.get("student_id")
    today      = date.today().isoformat()

    result = supabase.table("streaks")\
        .select("*").eq("student_id", student_id).execute()

    if not result.data:
        supabase.table("streaks").insert({
            "student_id":     student_id,
            "current_streak": 1,
            "longest_streak": 1,
            "last_login":     today,
            "total_days":     1,
        }).execute()
        return {"current_streak": 1, "message": "streak_started"}

    streak  = result.data[0]
    last    = streak.get("last_login", "")
    current = streak.get("current_streak", 0)
    longest = streak.get("longest_streak", 0)
    total   = streak.get("total_days", 0)

    if last == today:
        return {"current_streak": current, "message": "already_counted"}

    yesterday = (date.today() - timedelta(days=1)).isoformat()

    if last == yesterday:
        new_streak  = current + 1
        new_longest = max(new_streak, longest)
        message     = "streak_extended"
    else:
        new_streak  = 1
        new_longest = longest
        message     = "streak_broken"

    supabase.table("streaks").update({
        "current_streak": new_streak,
        "longest_streak": new_longest,
        "last_login":     today,
        "total_days":     total + 1,
    }).eq("student_id", student_id).execute()

    return {
        "current_streak": new_streak,
        "longest_streak": new_longest,
        "total_days":     total + 1,
        "message":        message,
    }

@app.get("/streak/{student_id}")
def get_streak(student_id: str):
    r = supabase.table("streaks")\
        .select("*").eq("student_id", student_id).execute()
    if not r.data:
        return {"current_streak": 0, "longest_streak": 0, "total_days": 0}
    return r.data[0]


# ── CONCEPT PROGRESS ──

@app.post("/concept-progress/update")
async def update_concept_progress(request: dict):
    student_id = request.get("student_id")
    namespace  = request.get("namespace")
    mode       = request.get("mode")
    field_map  = {
        "previous": "previous_done",
        "textbook": "textbook_done",
        "tweaked":  "tweaked_done",
        "ai":       "ai_done",
    }
    field = field_map.get(mode)
    if not field:
        return {"error": "Invalid mode"}

    existing = supabase.table("concept_progress")\
        .select("*")\
        .eq("student_id", student_id)\
        .eq("namespace",  namespace).execute()

    if not existing.data:
        supabase.table("concept_progress").insert({
            "student_id": student_id,
            "namespace":  namespace,
            "concept":    request.get("concept", ""),
            field:        True,
        }).execute()
    else:
        supabase.table("concept_progress")\
            .update({field: True})\
            .eq("student_id", student_id)\
            .eq("namespace",  namespace).execute()

    return {"status": "updated", "mode": mode}

@app.get("/concept-progress/{student_id}/{namespace}")
def get_concept_progress(student_id: str, namespace: str):
    r = supabase.table("concept_progress")\
        .select("*")\
        .eq("student_id", student_id)\
        .eq("namespace",  namespace).execute()
    if not r.data:
        return {
            "previous_done": False,
            "textbook_done": False,
            "tweaked_done":  False,
            "ai_done":       False,
        }
    return r.data[0]


# ── QUESTIONS ──

@app.get("/questions/textbook")
def get_textbook_questions(
    course: str = "cma",
    paper: int = 1,
    chapter: str = None,
    concept: str = None,
    namespace: str = None,
    q_type: str = None,
    limit: int = 999
):
    query = supabase.table("questions")\
        .select("*")\
        .eq("course", course)\
        .eq("approved", True)

    # Filter by q_type
    if q_type and q_type != "all":
        query = query.like("q_type", f"textbook_{q_type}%")
    else:
        query = query.like("q_type", "textbook_%")

    r = query.limit(9999).execute()
    questions = r.data if r.data else []

    # Filter by chapter — handle both int and string
    if chapter:
        questions = [q for q in questions
                     if str(q.get("chapter", "")) == str(chapter)]

    # Filter by namespace — handle both formats:
    # "cma_f_law_ch1_s1" and "cma_f_law"
    if namespace:
        # Extract base namespace: cma_f_law_ch1_s1 → cma_f_law
        base_ns = namespace.split("_ch")[0] if "_ch" in namespace else namespace
        # Extract chapter from namespace if not provided
        if not chapter and "_ch" in namespace:
            ch_part = namespace.split("_ch")[1].split("_")[0]
            questions = [q for q in questions
                        if str(q.get("chapter", "")) == str(ch_part)]
        questions = [q for q in questions
                    if (q.get("namespace") or "").startswith(base_ns)
                    or q.get("namespace") == namespace]

    # Filter by concept/section
    if concept:
        # concept can be "1.1 Sources of Law" or "1.1"
        concept_prefix = concept.split(" ")[0] if " " in concept else concept
        questions = [q for q in questions
                    if str(q.get("concept", "")).startswith(concept_prefix)
                    or concept_prefix in str(q.get("concept", ""))]

    random.shuffle(questions)
    return {
        "has_questions": len(questions) > 0,
        "questions": questions[:limit],
        "total_found": len(questions),
        "returned": min(len(questions), limit)
    }


@app.get("/questions/{q_type}/{namespace}")
def get_questions(q_type: str, namespace: str,
                  limit: int = 10, chapter: str = None):

    # Extract chapter from namespace if not in params
    if not chapter and "_ch" in namespace:
        chapter = namespace.split("_ch")[1].split("_")[0]

    # Extract base namespace
    base_ns = namespace.split("_ch")[0] if "_ch" in namespace else namespace

    if q_type == "previous_paper":
        r = supabase.table("previous_papers")\
            .select("*").eq("namespace", namespace).execute()
        questions = r.data if r.data else []
    elif q_type.startswith("textbook"):
        # Use textbook questions table
        r = supabase.table("questions")\
            .select("*")\
            .eq("course", "cma")\
            .eq("approved", True)\
            .like("q_type", "textbook_%")\
            .limit(9999).execute()
        questions = r.data if r.data else []
        # Filter by chapter
        if chapter:
            questions = [q for q in questions
                        if str(q.get("chapter", "")) == str(chapter)]
        # Filter by namespace
        questions = [q for q in questions
                    if (q.get("namespace") or "").startswith(base_ns)
                    or not q.get("namespace")]
    else:
        r = supabase.table("questions")\
            .select("*")\
            .eq("namespace", namespace)\
            .eq("q_type", q_type)\
            .eq("approved", True).execute()
        questions = r.data if r.data else []

    random.shuffle(questions)
    return {
        "has_questions": len(questions) > 0,
        "questions": questions[:limit],
        "total_found": len(questions),
        "returned": min(len(questions), limit)
    }


@app.post("/questions/ai-generate")
async def ai_generate_questions(request: dict):
    namespace = request.get("namespace", "cma_f_law_ch1_s1")
    concept   = request.get("concept",   "Definition of Contract")
    count     = request.get("count", 5)
    seed      = request.get("seed", 1)
    mode      = request.get("mode", "ai")  # "ai" or "tweaked"
    q_type    = request.get("type", None)   # "mcq","true_false","fill_blank","short","long"

    cache_mode = f"{mode}_{q_type}" if q_type and q_type != "all" else mode
    effective_type = q_type or "mcq"

    # ── STEP 1: Check Supabase cache ──
    try:
        if mode == "ai" and effective_type == "all":
            # For "all" type, check if 3+ of each type cached
            cached_all = supabase.table("questions")\
                .select("*").eq("namespace", namespace).eq("concept", concept)\
                .like("q_type", "ai_%").eq("approved", True).limit(50).execute()
            if cached_all.data and len(cached_all.data) >= 10:
                random.shuffle(cached_all.data)
                return {"questions": cached_all.data, "concept": concept,
                        "generated": len(cached_all.data), "source": "cached"}
        else:
            existing = supabase.table("questions")\
                .select("*").eq("namespace", namespace).eq("concept", concept)\
                .eq("q_type", cache_mode).eq("approved", True).limit(20).execute()
            if existing.data and len(existing.data) >= 3:
                random.shuffle(existing.data)
                return {"questions": existing.data, "concept": concept,
                        "generated": len(existing.data), "source": "cached"}
    except Exception as e:
        print(f"DB check error: {e}")

    # ── STEP 2: Get RAG context + textbook questions for tweaked ──
    rag_context = ""
    try:
        col = chroma.get_collection(name=namespace)
        res = col.query(query_texts=[concept], n_results=3)
        if res and res["documents"][0]:
            rag_context = "\n".join(res["documents"][0])
    except Exception as e:
        print(f"RAG error: {e}")

    rag = rag_context or "Use standard ICAI/ICMAI knowledge"
    textbook_sample = "[]"

    if mode == "tweaked":
        # Fetch textbook questions to mirror
        try:
            tb = supabase.table("questions")\
                .select("question_text,option_a,option_b,option_c,option_d,correct_option,q_type")\
                .eq("namespace", namespace).eq("approved", True)\
                .like("q_type", "textbook_%").limit(50).execute()
            tb_data = tb.data or []
            if effective_type != "all":
                tb_data = [q for q in tb_data if effective_type in q.get("q_type", "")]
            count = len(tb_data) if tb_data else count
            textbook_sample = json.dumps(tb_data[:10], ensure_ascii=False)
        except Exception as e:
            print(f"Textbook fetch error: {e}")

    # ── STEP 3: Build prompt ──
    if mode == "tweaked":
        prompt = f"""You are a CA/CMA exam question creator. Create TWEAKED versions of these textbook questions.

Concept: {concept}
ICAI Content: {rag}
Seed: {seed}

Original textbook questions for reference:
{textbook_sample}

Generate EXACTLY {count} tweaked questions. Rules:
- Keep same question structure and type as originals
- Change numbers, names, amounts, percentages, dates to DIFFERENT values
- Change option wording slightly — same concept tested differently
- Vary format (e.g. "which is correct" → "which is NOT correct")
- Use different Indian companies (if Tata used, use Infosys, Amul, Zomato etc)
- Same difficulty level as originals
- For each question include q_type matching original (mcq/true_false/fill_blank/short/long)

Return ONLY valid JSON array — no preamble no markdown:
[{{"question_text":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","correct_option":"A/B/C/D","explanation":"...","q_type":"mcq","concept":"{concept}"}}]"""

    elif mode == "ai" and effective_type == "all":
        prompt = f"""You are a CA/CMA exam question creator. Generate challenging questions testing DEEP understanding.

Concept: {concept}
ICAI Content: {rag}
Seed: {seed}

Generate ALL of these question types in ONE response:
- 3 MCQ questions (4 options, trap options, application-based)
- 3 True/False statements (tricky edge cases)
- 3 Fill-in-the-blank questions (test key terms)
- {random.randint(1,3)} Short answer questions (2-3 sentence answers, marks:5)
- {random.randint(1,3)} Long answer questions (200-300 word answers, marks:10)

Rules:
- NOT simple recall — require understanding, analysis, edge cases
- Use real Indian scenarios — Infosys, Tata, Amul, SBI, Zomato
- Include trap options for MCQ
- Based on ICMAI content but test deeper thinking

Return ONLY valid JSON array with ALL types combined:
[
  {{"question_text":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","correct_option":"A","explanation":"...","q_type":"mcq","concept":"{concept}"}},
  {{"question_text":"statement","option_a":"True","option_b":"False","option_c":"Partly True","option_d":"Cannot be determined","correct_option":"A","explanation":"...","q_type":"true_false","concept":"{concept}"}},
  {{"question_text":"The ______ Act...","option_a":"correct","option_b":"","option_c":"","option_d":"","correct_option":"A","explanation":"...","q_type":"fill_blank","concept":"{concept}"}},
  {{"question_text":"...","model_answer":"...","explanation":"...","marks":5,"q_type":"short","concept":"{concept}"}},
  {{"question_text":"...","model_answer":"detailed answer","explanation":"...","marks":10,"q_type":"long","concept":"{concept}"}}
]
No preamble no markdown."""

    else:
        # AI mode with specific type
        type_counts = {"mcq": 3, "true_false": 3, "fill_blank": 3,
                       "short": random.randint(1, 3), "long": random.randint(1, 3)}
        gen_count = type_counts.get(effective_type, 3)

        TYPE_TEMPLATES = {
            "mcq": f'{gen_count} challenging MCQ questions (4 options with trap options, application-based, NOT simple recall).\nReturn JSON: [{{"question_text":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","correct_option":"A/B/C/D","explanation":"...","q_type":"mcq","concept":"{concept}"}}]',
            "true_false": f'{gen_count} tricky True/False statements testing edge cases.\nReturn JSON: [{{"question_text":"statement","option_a":"True","option_b":"False","option_c":"Partly True","option_d":"Cannot be determined","correct_option":"A or B","explanation":"...","q_type":"true_false","concept":"{concept}"}}]',
            "fill_blank": f'{gen_count} Fill-in-the-blank questions testing key terms (use ______).\nReturn JSON: [{{"question_text":"The ______ Act...","option_a":"correct answer","option_b":"","option_c":"","option_d":"","correct_option":"A","explanation":"...","q_type":"fill_blank","concept":"{concept}"}}]',
            "short": f'{gen_count} short answer questions requiring 2-3 sentence analysis.\nReturn JSON: [{{"question_text":"...","model_answer":"...","explanation":"...","marks":5,"q_type":"short","concept":"{concept}"}}]',
            "long": f'{gen_count} long answer questions requiring 200-300 word detailed answers.\nReturn JSON: [{{"question_text":"...","model_answer":"detailed answer with headings","explanation":"...","marks":10,"q_type":"long","concept":"{concept}"}}]',
        }

        prompt = f"""You are a CA/CMA exam question creator. Generate questions testing DEEP UNDERSTANDING.

Concept: {concept}
ICAI Content: {rag}
Seed: {seed}

Generate {TYPE_TEMPLATES.get(effective_type, TYPE_TEMPLATES['mcq'])}

Rules:
- Complex and challenging — application, analysis, edge cases
- NOT simple recall — require understanding
- Use real Indian scenarios — Infosys, Tata, Amul, SBI, Zomato
- Based on ICMAI content but test deeper thinking

No preamble no markdown — JSON array only."""

    # ── STEP 4: Call Claude ──
    try:
        response = claude.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=3000,
            messages=[{"role": "user", "content": prompt}]
        )
        text = response.content[0].text.strip()
        if "```" in text:
            parts = text.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:]
                part = part.strip()
                if part.startswith("["):
                    text = part
                    break
        questions = json.loads(text.strip())
    except Exception as e:
        print(f"Claude error: {e}")
        return {"questions": [], "error": str(e), "generated": 0}

    # ── STEP 5: Store in Supabase for future use ──
    ns_parts = namespace.split("_")
    stored   = 0
    for q in questions:
        try:
            supabase.table("questions").insert({
                "course":         ns_parts[0] if len(ns_parts) > 0 else "cma",
                "level_name":     "foundation",
                "subject":        ns_parts[2] if len(ns_parts) > 2 else "law",
                "namespace":      namespace,
                "concept":        concept,
                "q_type":         cache_mode,
                "question_text":  q.get("question_text", ""),
                "option_a":       q.get("option_a") or "",
                "option_b":       q.get("option_b") or "",
                "option_c":       q.get("option_c") or "",
                "option_d":       q.get("option_d") or "",
                "correct_option": q.get("correct_option") or None,
                "explanation":    q.get("explanation", ""),
                "model_answer":   q.get("model_answer") or None,
                "marks":          q.get("marks") or None,
                "icai_reference": q.get("icai_reference", ""),
                "importance":     "tier2",
                "approved":       True,
            }).execute()
            stored += 1
        except Exception as e:
            print(f"Store error: {e}")

    print(f"✅ Generated and stored {stored} {mode} questions for {concept}")

    return {
        "questions": questions,
        "concept":   concept,
        "generated": len(questions),
        "stored":    stored,
        "source":    "generated",
    }


# ── EXAM ENGINE ──

@app.post("/exam/generate")
async def generate_exam(request: dict):
    exam_type = request.get("exam_type")
    subject   = request.get("subject")
    chapters  = request.get("chapters", [])
    paper_num = request.get("paper_number", 1)

    config = {
        "chapter":  {"total": 20, "prev": 5,  "text": 5,  "tweak": 5,  "ai": 5},
        "combined": {"total": 30, "prev": 8,  "text": 8,  "tweak": 7,  "ai": 7},
        "half":     {"total": 40, "prev": 10, "text": 10, "tweak": 10, "ai": 10},
        "full":     {"total": 60, "prev": 15, "text": 15, "tweak": 15, "ai": 15},
    }.get(exam_type, {"total": 20, "prev": 5, "text": 5, "tweak": 5, "ai": 5})

    all_questions = []

    for chapter in chapters:
        namespace = f"cma_f_law_ch{chapter}_s1"
        per       = max(1, len(chapters))

        # Previous papers
        r = supabase.table("previous_papers")\
            .select("*").eq("namespace", namespace).execute()
        if r.data:
            n      = max(1, config["prev"] // per)
            sample = random.sample(r.data, min(n, len(r.data)))
            for q in sample: q["source_type"] = "previous_paper"
            all_questions.extend(sample)

        # Textbook exact
        r = supabase.table("questions").select("*")\
            .eq("namespace", namespace)\
            .eq("q_type",    "textbook_exact")\
            .eq("approved",  True).execute()
        if r.data:
            n      = max(1, config["text"] // per)
            sample = random.sample(r.data, min(n, len(r.data)))
            for q in sample: q["source_type"] = "textbook_exact"
            all_questions.extend(sample)

        # Tweaked
        r = supabase.table("questions").select("*")\
            .eq("namespace", namespace)\
            .eq("q_type",    "tweaked")\
            .eq("approved",  True).execute()
        if r.data:
            n      = max(1, config["tweak"] // per)
            sample = random.sample(r.data, min(n, len(r.data)))
            for q in sample: q["source_type"] = "tweaked"
            all_questions.extend(sample)

    # AI generated to fill remaining
    ai_needed = config["total"] - len(all_questions)
    if ai_needed > 0 and chapters:
        ai_r = await ai_generate_questions({
            "namespace": f"cma_f_law_ch{chapters[0]}_s1",
            "concept":   subject,
            "count":     ai_needed,
            "seed":      paper_num,
            "mode":      "ai",
        })
        for q in ai_r.get("questions", []):
            q["source_type"] = "ai_generated"
        all_questions.extend(ai_r.get("questions", []))

    random.shuffle(all_questions)
    return {
        "exam_type": exam_type,
        "subject":   subject,
        "chapters":  chapters,
        "total":     len(all_questions),
        "questions": all_questions,
        "time_limit": {
            "chapter": 1800, "combined": 2400,
            "half":    3600, "full":     5400,
        }.get(exam_type, 1800),
    }

@app.post("/exam/submit")
async def submit_exam(request: dict):
    student_id = request.get("student_id")
    exam_type  = request.get("exam_type")
    subject    = request.get("subject")
    chapters   = request.get("chapters", [])
    answers    = request.get("answers", {})
    questions  = request.get("questions", [])
    time_taken = request.get("time_taken", 0)

    score = 0
    weak  = []
    for q in questions:
        qid     = str(q.get("id", ""))
        correct = q.get("correct_option", "")
        student = answers.get(qid, "")
        if student == correct:
            score += 1
        else:
            weak.append({
                "concept":  q.get("concept", ""),
                "question": q.get("question_text", "")[:80],
                "correct":  correct,
                "student":  student,
            })

    total      = len(questions)
    percentage = round((score / total) * 100) if total > 0 else 0

    supabase.table("exam_attempts").insert({
        "student_id":    student_id,
        "exam_type":     exam_type,
        "subject":       subject,
        "chapters":      json.dumps(chapters),
        "score":         score,
        "total":         total,
        "percentage":    percentage,
        "time_taken":    time_taken,
        "answers":       json.dumps(answers),
        "weak_concepts": json.dumps(weak[:10]),
    }).execute()

    return {
        "score":         score,
        "total":         total,
        "percentage":    percentage,
        "weak_concepts": weak[:10],
        "passed":        percentage >= 40,
        "mama_message": (
            "Excellent! You are exam ready! 🎉" if percentage >= 80
            else "Good attempt! Review weak areas." if percentage >= 60
            else "Passing attempt! Keep practising." if percentage >= 40
            else "Do not worry. Let us study together."
        ),
    }


# ── PREVIOUS PAPERS ──

@app.get("/previous-papers/{course}/{level}/{subject}")
def get_previous_papers(course: str, level: str, subject: str):
    r = supabase.table("previous_papers")\
        .select("attempt_name, attempt_year, attempt_month")\
        .eq("course",     course)\
        .eq("level_name", level)\
        .eq("subject",    subject).execute()

    if not r.data:
        return {"attempts": []}

    seen     = set()
    attempts = []
    for row in r.data:
        key = row["attempt_name"]
        if key not in seen:
            seen.add(key)
            attempts.append(row)

    attempts.sort(
        key=lambda x: (x.get("attempt_year", 0),
                       x.get("attempt_month", "")),
        reverse=True
    )
    return {"attempts": attempts[:6]}

@app.get("/previous-papers/{course}/{level}/{subject}/{attempt}")
def get_paper_questions(course: str, level: str,
                        subject: str, attempt: str):
    r = supabase.table("previous_papers")\
        .select("*")\
        .eq("course",       course)\
        .eq("level_name",   level)\
        .eq("subject",      subject)\
        .eq("attempt_name", attempt)\
        .order("chapter")\
        .order("question_number").execute()

    if not r.data:
        return {"questions": [], "by_chapter": {}, "total": 0}

    by_chapter = {}
    for q in r.data:
        ch = str(q.get("chapter", "0"))
        if ch not in by_chapter:
            by_chapter[ch] = []
        by_chapter[ch].append(q)

    return {
        "attempt":    attempt,
        "questions":  r.data,
        "by_chapter": by_chapter,
        "total":      len(r.data),
    }


# ── BUG REPORTS ──

@app.post("/bug-report")
async def submit_bug_report(request: dict):
    supabase.table("bug_reports").insert({
        "student_id":    request.get("student_id"),
        "report_type":   request.get("report_type"),
        "screen":        request.get("screen"),
        "concept":       request.get("concept", ""),
        "namespace":     request.get("namespace", ""),
        "question_text": request.get("question_text", ""),
        "mama_answer":   request.get("mama_answer", ""),
        "description":   request.get("description", ""),
        "status":        "open",
    }).execute()
    return {
        "status":  "received",
        "message": "Thank you! Mama will fix this within 24 hours."
    }

@app.get("/bug-reports/open")
def get_open_bugs():
    r = supabase.table("bug_reports")\
        .select("*").eq("status", "open")\
        .order("created_at", desc=True).execute()
    return {"reports": r.data, "total": len(r.data)}

@app.patch("/bug-report/{report_id}/fix")
async def mark_fixed(report_id: str, request: dict):
    supabase.table("bug_reports").update({
        "status":   "fixed",
        "fixed_by": request.get("fixed_by", "Somisetty"),
        "fixed_at": datetime.now().isoformat(),
    }).eq("id", report_id).execute()
    return {"status": "fixed"}


# ── LESSON CONTENT ──

@app.post("/lesson/content")
async def lesson_content(request: dict):
    namespace = request.get("namespace", "cma_f_law_ch1_s1")
    concept   = request.get("concept",   "Definition of Contract")

    # ── STEP 1: Check Supabase cache ──
    try:
        cached = supabase.table("lesson_content")\
            .select("*")\
            .eq("namespace", namespace)\
            .eq("concept",   concept)\
            .limit(1).execute()

        if cached.data and len(cached.data) > 0:
            print(f"✅ Serving cached lesson for {concept}")
            return {
                "sections": json.loads(cached.data[0].get("sections", "[]")),
                "concept":  concept,
                "source":   "cached",
            }
    except Exception as e:
        print(f"Lesson cache check error: {e}")

    # ── STEP 2: Get RAG context from ChromaDB ──
    rag_context = ""
    try:
        col = chroma.get_collection(name=namespace)
        res = col.query(query_texts=[concept], n_results=5)
        if res and res["documents"][0]:
            rag_context = "\n\n".join(res["documents"][0])
    except Exception as e:
        print(f"Lesson RAG error: {e}")

    # ── STEP 3: Call Claude ──
    prompt = f"""You are SOMI lesson creator for CMA Foundation students.
Concept: {concept}
ICMAI Content:
{rag_context or "Use standard ICMAI/ICMAI official material for this concept."}

Create 3-5 lesson sections for this concept.
Each section covers one key point.

Rules:
- icmai_quote must be EXACT text from ICMAI content provided
- mama_explain must use real Indian companies: Infosys, Tata, Amul, SBI, Zomato, Wipro, Maruti etc
- kitty_ask must be in Tenglish mixing Telugu and English naturally
- check_question must test understanding of that specific section
- exam_tip must mention marks and what examiner looks for
- check_answer is the index (0-3) of the correct option in check_options

Return ONLY valid JSON with this structure — no preamble no markdown:
{{
  "sections": [
    {{
      "id": "s1",
      "title": "section title",
      "icmai_quote": "exact text from ICMAI book",
      "icmai_ref": "Chapter X, Page Y",
      "mama_explain": "explanation with real Indian company example",
      "real_example": "specific company name and scenario",
      "exam_tip": "what examiner expects and marks",
      "kitty_ask": "confused student question in Tenglish",
      "check_question": "MCQ question text",
      "check_options": ["option A", "option B", "option C", "option D"],
      "check_answer": 0,
      "check_explanation": "why correct answer is right"
    }}
  ]
}}"""

    try:
        response = claude.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}]
        )
        text = response.content[0].text.strip()

        # Strip markdown fences if present
        if "```" in text:
            for part in text.split("```"):
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:]
                part = part.strip()
                if part.startswith("{"):
                    text = part
                    break

        data = json.loads(text)
        sections = data.get("sections", [])
    except Exception as e:
        print(f"Lesson Claude error: {e}")
        return {"sections": [], "error": str(e), "source": "error"}

    # ── STEP 4: Cache in Supabase ──
    try:
        supabase.table("lesson_content").insert({
            "namespace": namespace,
            "concept":   concept,
            "sections":  json.dumps(sections),
        }).execute()
        print(f"✅ Cached lesson for {concept} ({len(sections)} sections)")
    except Exception as e:
        print(f"Lesson cache store error: {e}")

    return {
        "sections": sections,
        "concept":  concept,
        "source":   "generated",
    }


# ── SMART LESSON ──

@app.get("/lesson/smart")
def get_smart_lesson(namespace: str, concept: str = ""):
    # Extract chapter from namespace (cma_f_law_ch1_s1 → "1")
    parts = namespace.split("_")
    chapter = None
    for part in parts:
        if part.startswith("ch"):
            chapter = part.replace("ch", "")
            break

    if not chapter:
        return {"pages": [], "has_content": False, "total_pages": 0}

    r = supabase.table("lesson_content")\
        .select("*")\
        .eq("chapter", chapter)\
        .eq("is_verified", True)\
        .order("book_page")\
        .execute()

    pages = []
    for row in (r.data or []):
        lines = row.get("mama_lines")
        if isinstance(lines, str):
            try:
                lines = json.loads(lines)
            except json.JSONDecodeError:
                lines = []
        elif lines is None:
            lines = []
        row["mama_lines"] = lines
        pages.append(row)

    return {
        "pages": pages,
        "has_content": len(pages) > 0,
        "total_pages": len(pages),
    }


# ── CHECK QUESTIONS FROM MAMA LINES ──

@app.get("/lesson/check-questions")
def get_check_questions(
    namespace: str,
    chapter: str = None,
    limit: int = 10
):
    if not chapter and "_ch" in namespace:
        chapter = namespace.split("_ch")[1].split("_")[0]

    r = supabase.table("lesson_content")\
        .select("mama_lines, book_page, pdf_page")\
        .eq("chapter", chapter)\
        .not_.is_("mama_lines", "null")\
        .eq("is_verified", True)\
        .order("pdf_page")\
        .execute()

    questions = []
    for page in (r.data or []):
        lines = page.get("mama_lines", [])
        if isinstance(lines, str):
            try:
                lines = json.loads(lines)
            except Exception:
                continue

        for para in (lines or []):
            if not para.get("check_question"):
                continue
            if not para.get("check_options"):
                continue
            if para.get("check_answer") is None:
                continue

            opts = para["check_options"]
            questions.append({
                "question_text":  para["check_question"],
                "option_a":       opts[0] if len(opts) > 0 else "",
                "option_b":       opts[1] if len(opts) > 1 else "",
                "option_c":       opts[2] if len(opts) > 2 else "",
                "option_d":       opts[3] if len(opts) > 3 else "",
                "correct_option": ["A", "B", "C", "D"][para["check_answer"]],
                "explanation":    para.get("check_explanation", ""),
                "q_type":         "concept_check",
                "source":         "mama_lines",
                "book_page":      page.get("book_page"),
            })

    random.shuffle(questions)
    return {
        "questions":   questions[:limit],
        "total_found": len(questions),
        "source":      "mama_lines",
    }


# ── EVALUATE STUDENT ANSWER ──

@app.post("/questions/evaluate")
async def evaluate_student_answer(request: dict):
    question      = request.get("question", "")
    student_answer = request.get("student_answer", "")
    model_answer   = request.get("model_answer", "")
    q_type         = request.get("q_type", "short")
    marks          = request.get("marks", 5)

    is_long = "long" in q_type
    model = "claude-sonnet-4-20250514" if is_long else "claude-haiku-4-5-20251001"
    max_tok = 1200 if is_long else 500

    if is_long:
        prompt = f"""You are evaluating a CMA Foundation student's LONG answer ({marks} marks).

Question: {question}
Model Answer: {model_answer}
Student Answer: {student_answer}
Word count: {len(student_answer.split())} words

Evaluate thoroughly and return ONLY valid JSON:
{{
  "score": "{marks}/{marks}",
  "percentage": 70,
  "content_score": 5,
  "structure_score": 3,
  "terminology_score": 2,
  "total_marks": {marks},
  "good_points": ["point 1", "point 2"],
  "missing_points": ["missed this"],
  "icmai_terms_used": ["term 1", "term 2"],
  "icmai_terms_missing": ["should have used this"],
  "structure_feedback": "Did student use headings, examples, sections?",
  "word_count_feedback": "Adequate/Too short/Too long",
  "feedback": "overall detailed feedback",
  "grade": "Excellent/Good/Average/Needs Improvement"
}}"""
    else:
        prompt = f"""You are evaluating a CMA Foundation student answer.

Question: {question}
Model Answer: {model_answer}
Student Answer: {student_answer}

Evaluate and return ONLY valid JSON:
{{
  "score": "7/10",
  "percentage": 70,
  "good_points": ["point 1", "point 2"],
  "missing_points": ["missed this", "missed that"],
  "feedback": "overall feedback in 2 lines",
  "grade": "Good/Average/Needs Improvement"
}}"""

    try:
        r = claude.messages.create(
            model=model,
            max_tokens=max_tok,
            messages=[{"role": "user", "content": prompt}],
        )
        text = r.content[0].text.strip()
        if "```" in text:
            for part in text.split("```"):
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:]
                part = part.strip()
                if part.startswith("{"):
                    text = part
                    break
        return json.loads(text)
    except Exception as e:
        return {"score": "?", "percentage": 0, "feedback": str(e), "grade": "Error"}


# ── SESSION ENGINE ──

@app.post("/session/message")
async def session_message(request: dict):
    return process_message(request)


# ── BACKUP ──

@app.get("/backup/run")
def backup_tables():
    files = run_backup()
    return {"status": "complete", "files": files, "total": len(files)}