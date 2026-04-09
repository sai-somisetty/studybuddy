"""
College Mirror — teacher portal, paper upload/parse, mirror tests, gap analysis.
Requires Supabase tables: colleges, college_papers, mirror_tests (and optional college_teachers).
"""
from __future__ import annotations

import json
import os
import uuid
from datetime import datetime
from typing import Any, Optional

import httpx
from anthropic import Anthropic
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Request, UploadFile
from supabase import create_client

load_dotenv()

router = APIRouter(tags=["college", "mirror"])

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
claude = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def _sb() -> Any:
    return supabase


def _claude_json_array(prompt: str, max_tokens: int = 8000) -> list | dict:
    r = claude.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    text = r.content[0].text.strip()
    if "```" in text:
        for part in text.split("```"):
            p = part.strip()
            if p.startswith("json"):
                p = p[4:].strip()
            if p.startswith("[") or p.startswith("{"):
                text = p
                break
    return json.loads(text)


async def _teacher_from_token(authorization: Optional[str] = Header(None)) -> dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization")
    token = authorization[7:].strip()
    url, key = os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY")
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{url}/auth/v1/user",
            headers={"Authorization": f"Bearer {token}", "apikey": key},
        )
    if res.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = res.json().get("user") or res.json()
    return user


# ── 1. College registration ───────────────────────────────────────────────────


@router.post("/college/register")
async def college_register(request: Request):
    body = await request.json()
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(400, "name required")
    row = {
        "name": name,
        "city": body.get("city"),
        "state": body.get("state"),
        "contact_email": body.get("contact_email"),
        "contact_phone": body.get("contact_phone"),
        "affiliated_to": body.get("affiliated_to"),
        "created_at": datetime.utcnow().isoformat(),
    }
    ins = _sb().table("colleges").insert(row).execute()
    cid = ins.data[0]["id"] if ins.data else None
    return {"college_id": cid, "success": True}


# ── 2. Teacher OTP (same pattern as parent) ──────────────────────────────────


@router.post("/college/auth/send-otp")
async def college_send_otp(request: Request):
    body = await request.json()
    email = (body.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(400, "email required")
    url, key = os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY")
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{url}/auth/v1/otp",
            headers={"apikey": key, "Content-Type": "application/json"},
            json={"email": email, "create_user": True, "options": {"should_create_user": True}},
        )
    if res.status_code != 200:
        raise HTTPException(400, res.text)
    return {"success": True}


@router.post("/college/auth/verify-otp")
async def college_verify_otp(request: Request):
    body = await request.json()
    email = (body.get("email") or "").strip().lower()
    token = (body.get("token") or "").strip()
    url, key = os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY")
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{url}/auth/v1/verify",
            headers={"apikey": key, "Content-Type": "application/json"},
            json={"email": email, "token": token, "type": "email"},
        )
    if res.status_code != 200:
        raise HTTPException(400, "Invalid OTP")
    data = res.json()
    return {
        "success": True,
        "access_token": data.get("access_token"),
        "user": data.get("user"),
    }


# ── 3–4. Upload & parse paper ────────────────────────────────────────────────


@router.post("/college/upload-paper")
async def college_upload_paper(
    file: UploadFile = File(...),
    paper_title: str = Form(...),
    exam_type: str = Form(""),
    subject: str = Form(""),
    semester: str = Form(""),
    academic_year: str = Form(""),
    total_marks: int = Form(100),
    college_id: str = Form(...),
    user: dict = Depends(_teacher_from_token),
):
    _ = user
    raw = await file.read()
    ext = (file.filename or "paper.pdf").split(".")[-1]
    path = f"{college_id}/{uuid.uuid4()}.{ext}"
    try:
        _sb().storage.from_("college-papers").upload(
            path,
            raw,
            file_options={"content-type": file.content_type or "application/pdf"},
        )
    except Exception as e:  # noqa: BLE001
        raise HTTPException(500, f"Storage upload failed: {e}") from e

    base = (os.getenv("SUPABASE_URL") or "").rstrip("/")
    pub = f"{base}/storage/v1/object/public/college-papers/{path}"
    ins = (
        _sb()
        .table("college_papers")
        .insert(
            {
                "college_id": college_id,
                "paper_title": paper_title,
                "exam_type": exam_type,
                "subject": subject,
                "semester": semester,
                "academic_year": academic_year,
                "total_marks": total_marks,
                "storage_path": path,
                "public_url": pub,
                "is_parsed": False,
                "created_at": datetime.utcnow().isoformat(),
            }
        )
        .execute()
    )
    pid = ins.data[0]["id"] if ins.data else None
    return {"paper_id": pid, "path": path, "success": True}


@router.post("/college/parse-paper/{paper_id}")
async def college_parse_paper(paper_id: str, user: dict = Depends(_teacher_from_token)):
    _ = user
    r = _sb().table("college_papers").select("*").eq("id", paper_id).execute()
    if not r.data:
        raise HTTPException(404, "paper not found")
    row = r.data[0]
    text_hint = row.get("paper_title", "") + " " + str(row.get("subject", ""))
    prompt = f"""Extract all questions from this exam paper context (metadata below).
For each question return: question_text, question_type (mcq/short/long/numerical), marks,
options (if mcq), correct_answer (if known).
Return ONLY a JSON array.

Paper metadata:
{text_hint}
"""
    try:
        questions = _claude_json_array(prompt)
        if not isinstance(questions, list):
            questions = [questions]
    except Exception as e:  # noqa: BLE001
        raise HTTPException(500, f"Parse failed: {e}") from e

    _sb().table("college_papers").update(
        {
            "parsed_questions": questions,
            "is_parsed": True,
            "updated_at": datetime.utcnow().isoformat(),
        }
    ).eq("id", paper_id).execute()
    return {"paper_id": paper_id, "count": len(questions), "success": True}


# ── 5. Mirror generation ─────────────────────────────────────────────────────


@router.post("/mirror/generate/{paper_id}")
async def mirror_generate(paper_id: str, user: dict = Depends(_teacher_from_token)):
    _ = user
    r = _sb().table("college_papers").select("*").eq("id", paper_id).execute()
    if not r.data:
        raise HTTPException(404, "paper not found")
    pq = r.data[0].get("parsed_questions") or []
    if isinstance(pq, str):
        try:
            pq = json.loads(pq)
        except json.JSONDecodeError:
            pq = []
    prompt = f"""For each question below, create a mirror version: same concept, different numbers/options/order.
Difficulty identical. Input: {json.dumps(pq, ensure_ascii=False)[:120000]}
Return ONLY JSON array of mirrored questions with same shape as input plus mirror_id."""
    try:
        mirrored = _claude_json_array(prompt)
        if not isinstance(mirrored, list):
            mirrored = [mirrored]
    except Exception as e:  # noqa: BLE001
        raise HTTPException(500, f"Mirror gen failed: {e}") from e

    _sb().table("college_papers").update(
        {
            "mirror_questions": mirrored,
            "updated_at": datetime.utcnow().isoformat(),
        }
    ).eq("id", paper_id).execute()
    # Students take mirror tied to this paper_id; results row created on submit-scores.
    return {"test_id": paper_id, "paper_id": paper_id, "success": True}


# ── 6. Submit scores / gap ─────────────────────────────────────────────────────


@router.post("/mirror/submit-scores")
async def mirror_submit_scores(request: Request):
    body = await request.json()
    student_id = body.get("student_id")
    college_paper_id = body.get("college_paper_id")
    college_score = float(body.get("college_score") or 0)
    mirror_score = float(body.get("mirror_score") or 0)
    exam_session_id = body.get("exam_session_id")
    if not student_id or not college_paper_id:
        raise HTTPException(400, "student_id and college_paper_id required")

    gap = abs(college_score - mirror_score)
    rote = gap > 30

    st = _sb().table("students").select("name").eq("id", student_id).execute()
    sname = st.data[0].get("name", "Student") if st.data else "Student"

    ins = (
        _sb()
        .table("mirror_tests")
        .insert(
            {
                "student_id": student_id,
                "college_paper_id": college_paper_id,
                "college_score": college_score,
                "mirror_score": mirror_score,
                "gap_percentage": gap,
                "rote_learning_flag": rote,
                "exam_session_id": exam_session_id,
                "created_at": datetime.utcnow().isoformat(),
            }
        )
        .execute()
    )
    mid = ins.data[0]["id"] if ins.data else None

    if rote:
        links = (
            _sb()
            .table("parent_student_links")
            .select("parent_id")
            .eq("student_id", student_id)
            .eq("status", "active")
            .execute()
        )
        for link in links.data or []:
            pid = link.get("parent_id")
            if not pid:
                continue
            _sb().table("nudges").insert(
                {
                    "parent_id": pid,
                    "student_id": student_id,
                    "nudge_type": "mirror_rote_warning",
                    "title": "⚠️ Mirror test gap",
                    "body": (
                        f"{sname} college lo {college_score:.0f}% score chesaru kaani mirror test lo "
                        f"{mirror_score:.0f}%. Rote learning signs kanipistunnaayi — conceptual understanding improve cheyali"
                    ),
                    "priority": "urgent",
                    "is_read": False,
                    "created_at": datetime.utcnow().isoformat(),
                }
            ).execute()

    return {"mirror_test_id": mid, "gap_percentage": gap, "rote_learning": rote}


# ── 7. Results ────────────────────────────────────────────────────────────────


@router.get("/mirror/results/{student_id}")
async def mirror_results(student_id: str):
    r = (
        _sb()
        .table("mirror_tests")
        .select("*")
        .eq("student_id", student_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"results": r.data or [], "total": len(r.data or [])}


@router.get("/mirror/results/{student_id}/{paper_id}")
async def mirror_results_paper(student_id: str, paper_id: str):
    r = (
        _sb()
        .table("mirror_tests")
        .select("*")
        .eq("student_id", student_id)
        .eq("college_paper_id", paper_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"results": r.data or [], "total": len(r.data or [])}
