from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from anthropic import Anthropic
from dotenv import load_dotenv
from quiz import generate_mcq, evaluate_answer
import chromadb
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

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)
claude = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
chroma = chromadb.PersistentClient(path="./chromadb_data")


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
        namespace: str = "ca_f_acc_ch1_s2",
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

    prompt = f"""You are Study Buddy — AI companion for CA/CMA students.
{f"Use this official content: {rag_context}" if rag_context else "Use ICAI material only."}
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
def get_quiz(namespace: str = "ca_f_acc_ch1_s2",
             concept: str = "Going Concern",
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

@app.get("/questions/{q_type}/{namespace}")
def get_questions(q_type: str, namespace: str, limit: int = 10):
    if q_type == "previous_paper":
        r = supabase.table("previous_papers")\
            .select("*").eq("namespace", namespace).execute()
    else:
        r = supabase.table("questions")\
            .select("*")\
            .eq("namespace", namespace)\
            .eq("q_type",    q_type)\
            .eq("approved",  True).execute()

    questions = r.data if r.data else []
    random.shuffle(questions)
    return {
        "questions":     questions[:limit],
        "total_found":   len(questions),
        "has_questions": len(questions) > 0,
    }

@app.post("/questions/ai-generate")
async def ai_generate_questions(request: dict):
    namespace = request.get("namespace", "ca_f_acc_ch1_s2")
    concept   = request.get("concept",   "Going Concern")
    count     = request.get("count", 5)
    seed      = request.get("seed", 1)

    rag_context = ""
    try:
        col = chroma.get_collection(name=namespace)
        res = col.query(query_texts=[concept], n_results=2)
        if res and res["documents"][0]:
            rag_context = res["documents"][0][0]
    except Exception as e:
        print(f"RAG error: {e}")

    prompt = f"""Generate {count} unique MCQ questions for CA/CMA exam.
Concept: {concept}
Seed: {seed}
ICAI content: {rag_context if rag_context else "Use standard ICAI knowledge"}
Rules:
- ICAI official content only
- 4 options each, one correct
- Include one trap option
- Cite ICAI source in explanation
Return ONLY valid JSON array:
[{{
  "question_text": "...",
  "option_a": "...",
  "option_b": "...",
  "option_c": "...",
  "option_d": "...",
  "correct_option": "A/B/C/D",
  "explanation": "...",
  "icai_reference": "Ch X · Page Y",
  "importance": "tier1/tier2/tier3"
}}]"""

    r = claude.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )
    questions = json.loads(r.content[0].text.strip())
    return {
        "questions": questions,
        "concept":   concept,
        "generated": len(questions),
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
        namespace = f"ca_f_acc_ch{chapter}_s1"
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
            "namespace": f"ca_f_acc_ch{chapters[0]}_s1",
            "concept":   subject,
            "count":     ai_needed,
            "seed":      paper_num,
        })
        for q in ai_r["questions"]:
            q["source_type"] = "ai_generated"
        all_questions.extend(ai_r["questions"])

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