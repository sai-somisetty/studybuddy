"""
SOMI Connect — parent app API routes.
Uses Supabase (same env as main) for data and auth OTP; bcrypt for PIN.
"""
from __future__ import annotations

import json
import os
import secrets
import uuid
from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Any, Optional

import bcrypt
import httpx
from anthropic import Anthropic
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse
from supabase import create_client

from health_parser import extract_from_pdf_or_image
from nudge_engine import run_nudge_engine

load_dotenv()

router = APIRouter(prefix="/parent", tags=["parent"])

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY"),
)


def _supabase_url_key() -> tuple[str, str]:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    return url, key


async def _auth_user_from_token(token: str) -> dict[str, Any]:
    url, key = _supabase_url_key()
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{url}/auth/v1/user",
            headers={"Authorization": f"Bearer {token}", "apikey": key},
        )
    if res.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    data = res.json()
    user = data.get("user") if isinstance(data.get("user"), dict) else data
    uid = user.get("id")
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid session")
    return user


async def require_parent_auth(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization")
    token = authorization[7:].strip()
    user = await _auth_user_from_token(token)
    return user["id"]


def _get_parent_by_auth(auth_id: str) -> Optional[dict[str, Any]]:
    r = supabase.table("parents").select("*").eq("auth_id", auth_id).execute()
    return r.data[0] if r.data else None


def _require_parent_row(auth_id: str) -> dict[str, Any]:
    row = _get_parent_by_auth(auth_id)
    if not row:
        raise HTTPException(status_code=404, detail="Parent profile not found")
    return row


def _ensure_linked(parent_internal_id: str, student_id: str) -> None:
    r = (
        supabase.table("parent_student_links")
        .select("id")
        .eq("parent_id", parent_internal_id)
        .eq("student_id", student_id)
        .execute()
    )
    if not r.data:
        raise HTTPException(
            status_code=403, detail="Student is not linked to this parent"
        )


def _parse_json_field(raw: Any) -> Any:
    if raw is None:
        return None
    if isinstance(raw, (list, dict)):
        return raw
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return raw
    return raw


def _college_subject_from_daily_log_row(row: dict[str, Any]) -> dict[str, Any]:
    """Map `college_daily_logs` row to API subject shape."""
    topics_raw = row.get("topics_covered")
    if isinstance(topics_raw, list):
        topics = [str(t) for t in topics_raw]
    elif isinstance(topics_raw, str):
        topics = [topics_raw]
    else:
        topics = []
    return {
        "subject_name": str(row.get("subject") or "Subject"),
        "topics": topics,
        "homework": row.get("homework"),
        "teacher_name": row.get("teacher_name"),
    }


def _max_iso_timestamp(rows: list[dict[str, Any]]) -> Any:
    best: Any = None
    for row in rows:
        ts = row.get("created_at")
        if ts is None:
            continue
        if best is None or str(ts) > str(best):
            best = ts
    return best


# ── Auth OTP (same Supabase Auth as student app) ─────────────────────────────


@router.post("/auth/send-otp")
async def parent_send_otp(request: Request):
    body = await request.json()
    email = (body.get("email") or "").strip().lower()
    if not email:
        return JSONResponse({"error": "Email required"}, status_code=400)

    url, key = _supabase_url_key()
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{url}/auth/v1/otp",
            headers={"apikey": key, "Content-Type": "application/json"},
            json={
                "email": email,
                "create_user": True,
                "options": {"should_create_user": True},
            },
        )

    if res.status_code == 200:
        return {"success": True, "message": "OTP sent"}
    return JSONResponse(
        {"error": "Failed to send OTP", "detail": res.text},
        status_code=400,
    )


@router.post("/auth/verify-otp")
async def parent_verify_otp(request: Request):
    body = await request.json()
    email = (body.get("email") or "").strip().lower()
    token = (body.get("token") or "").strip()
    if not email or not token:
        return JSONResponse({"error": "Email and token required"}, status_code=400)

    url, key = _supabase_url_key()
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{url}/auth/v1/verify",
            headers={"apikey": key, "Content-Type": "application/json"},
            json={"email": email, "token": token, "type": "email"},
        )

    if res.status_code != 200:
        return JSONResponse(
            {"error": "Invalid OTP", "detail": res.text},
            status_code=400,
        )

    data = res.json()
    user = data.get("user") or {}
    access_token = data.get("access_token", "")
    auth_id = user.get("id")

    existing = (
        supabase.table("parents").select("*").eq("auth_id", auth_id).execute()
    )
    is_new = len(existing.data) == 0
    parent = existing.data[0] if not is_new else None

    return {
        "success": True,
        "access_token": access_token,
        "user_id": auth_id,
        "email": user.get("email"),
        "is_new": is_new,
        "parent": parent,
    }


# ── Profile & linking ─────────────────────────────────────────────────────────


@router.post("/profile")
async def parent_save_profile(request: Request, auth_id: str = Depends(require_parent_auth)):
    body = await request.json()
    email = (body.get("email") or "").strip().lower()
    name = (body.get("name") or "").strip()
    phone = (body.get("phone") or "").strip() or None

    if not name:
        return JSONResponse({"error": "name required"}, status_code=400)

    existing = supabase.table("parents").select("id").eq("auth_id", auth_id).execute()

    now = datetime.utcnow().isoformat()
    base: dict[str, Any] = {
        "auth_id": auth_id,
        "email": email,
        "name": name,
        "phone": phone,
        "updated_at": now,
    }

    if existing.data:
        supabase.table("parents").update(base).eq("auth_id", auth_id).execute()
    else:
        supabase.table("parents").insert({**base, "created_at": now}).execute()

    return {"success": True, "name": name}


@router.post("/link-student")
async def parent_link_student(request: Request, auth_id: str = Depends(require_parent_auth)):
    body = await request.json()
    student_id = body.get("student_id")
    if not student_id:
        return JSONResponse({"error": "student_id required"}, status_code=400)

    parent = _require_parent_row(auth_id)

    st = supabase.table("students").select("id").eq("id", student_id).execute()
    if not st.data:
        return JSONResponse({"error": "Student not found"}, status_code=404)

    status = body.get("status") or "active"
    dup = (
        supabase.table("parent_student_links")
        .select("id")
        .eq("parent_id", parent["id"])
        .eq("student_id", student_id)
        .execute()
    )
    if dup.data:
        return {"success": True, "message": "Already linked", "link_id": dup.data[0]["id"]}

    ins = (
        supabase.table("parent_student_links")
        .insert(
            {
                "parent_id": parent["id"],
                "student_id": student_id,
                "status": status,
                "created_at": datetime.utcnow().isoformat(),
            }
        )
        .execute()
    )
    link_id = ins.data[0]["id"] if ins.data else None
    return {"success": True, "link_id": link_id}


@router.get("/linked-students")
async def parent_linked_students(auth_id: str = Depends(require_parent_auth)):
    parent = _require_parent_row(auth_id)
    links = (
        supabase.table("parent_student_links")
        .select("id, student_id, status, created_at")
        .eq("parent_id", parent["id"])
        .execute()
    )
    rows = links.data or []
    out = []
    for link in rows:
        sid = link.get("student_id")
        student = None
        if sid:
            sr = supabase.table("students").select("*").eq("id", sid).execute()
            student = sr.data[0] if sr.data else None
        out.append({**link, "student": student})
    return {"links": out, "total": len(out)}


@router.post("/set-pin")
async def parent_set_pin(request: Request, auth_id: str = Depends(require_parent_auth)):
    body = await request.json()
    pin = body.get("pin")
    if not pin or not isinstance(pin, str) or len(pin) < 4:
        return JSONResponse(
            {"error": "PIN required (string, min 4 characters)"},
            status_code=400,
        )

    parent = _require_parent_row(auth_id)
    pin_hash = bcrypt.hashpw(pin.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    now = datetime.utcnow().isoformat()
    supabase.table("parents").update({"pin_hash": pin_hash, "updated_at": now}).eq(
        "id", parent["id"]
    ).execute()
    return {"success": True}


# ── Student-scoped insights (requires active link) ─────────────────────────────


@router.get("/dashboard/{student_id}")
async def parent_dashboard(
    student_id: str,
    auth_id: str = Depends(require_parent_auth),
):
    parent = _require_parent_row(auth_id)
    _ensure_linked(parent["id"], student_id)

    streak_r = (
        supabase.table("streaks").select("*").eq("student_id", student_id).execute()
    )
    streak = (
        streak_r.data[0]
        if streak_r.data
        else {"current_streak": 0, "longest_streak": 0, "total_days": 0}
    )

    exams = (
        supabase.table("exam_attempts")
        .select("id, exam_type, subject, score, total, percentage, created_at")
        .eq("student_id", student_id)
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    exam_rows = exams.data or []

    progress = (
        supabase.table("concept_progress")
        .select("id")
        .eq("student_id", student_id)
        .execute()
    )
    concepts_done = len(progress.data or [])

    nudge_q = (
        supabase.table("nudges")
        .select("id")
        .eq("parent_id", parent["id"])
        .is_("dismissed_at", "null")
        .execute()
    )
    pending_nudges = len(nudge_q.data or [])

    st = supabase.table("students").select("*").eq("id", student_id).execute()
    student = st.data[0] if st.data else None

    return {
        "student": student,
        "streak": streak,
        "recent_exam_attempts": exam_rows,
        "concept_progress_rows": concepts_done,
        "pending_nudges": pending_nudges,
    }


@router.get("/activity/{student_id}")
async def parent_activity(
    student_id: str,
    auth_id: str = Depends(require_parent_auth),
    limit: int = 50,
):
    parent = _require_parent_row(auth_id)
    _ensure_linked(parent["id"], student_id)

    exams = (
        supabase.table("exam_attempts")
        .select("*")
        .eq("student_id", student_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )

    progress = (
        supabase.table("concept_progress")
        .select("*")
        .eq("student_id", student_id)
        .limit(limit)
        .execute()
    )

    return {
        "exam_attempts": exams.data or [],
        "concept_progress_recent": progress.data or [],
    }


@router.get("/college-log/{student_id}/today")
async def parent_college_log_today(
    student_id: str,
    auth_id: str = Depends(require_parent_auth),
):
    """Today's college log (`college_daily_logs`: one row per subject per day)."""
    parent = _require_parent_row(auth_id)
    _ensure_linked(parent["id"], student_id)
    today_str = date.today().isoformat()
    try:
        r = (
            supabase.table("college_daily_logs")
            .select("*")
            .eq("student_id", student_id)
            .eq("log_date", today_str)
            .execute()
        )
    except Exception:
        return {"date": today_str, "updated_at": None, "subjects": []}

    rows = [x for x in (r.data or []) if isinstance(x, dict)]
    if not rows:
        return {"date": today_str, "updated_at": None, "subjects": []}
    subjects = [_college_subject_from_daily_log_row(row) for row in rows]
    return {
        "date": today_str,
        "updated_at": _max_iso_timestamp(rows),
        "subjects": subjects,
    }


@router.get("/college-log/{student_id}")
async def parent_college_log_range(
    student_id: str,
    auth_id: str = Depends(require_parent_auth),
    days: int = 7,
):
    """Recent college log days (newest first). Query: days=1..31 (default 7)."""
    parent = _require_parent_row(auth_id)
    _ensure_linked(parent["id"], student_id)
    days = max(1, min(int(days), 31))
    start = (date.today() - timedelta(days=days - 1)).isoformat()
    try:
        r = (
            supabase.table("college_daily_logs")
            .select("*")
            .eq("student_id", student_id)
            .gte("log_date", start)
            .execute()
        )
    except Exception:
        return {"days": []}

    by_date: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in r.data or []:
        if not isinstance(row, dict):
            continue
        ld = row.get("log_date")
        if ld is None:
            continue
        key = str(ld)[:10]
        by_date[key].append(row)

    out: list[dict[str, Any]] = []
    for log_date in sorted(by_date.keys(), reverse=True):
        day_rows = by_date[log_date]
        subjects = [_college_subject_from_daily_log_row(x) for x in day_rows]
        out.append(
            {
                "log_date": log_date,
                "updated_at": _max_iso_timestamp(day_rows),
                "subjects": subjects,
            }
        )
    return {"days": out}


@router.get("/scores/{student_id}")
async def parent_scores(
    student_id: str,
    auth_id: str = Depends(require_parent_auth),
    limit: int = 30,
):
    parent = _require_parent_row(auth_id)
    _ensure_linked(parent["id"], student_id)

    r = (
        supabase.table("exam_attempts")
        .select("id, exam_type, subject, score, total, percentage, time_taken, created_at")
        .eq("student_id", student_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return {"scores": r.data or [], "total": len(r.data or [])}


@router.get("/weak-concepts/{student_id}")
async def parent_weak_concepts(
    student_id: str,
    auth_id: str = Depends(require_parent_auth),
    limit_attempts: int = 20,
):
    parent = _require_parent_row(auth_id)
    _ensure_linked(parent["id"], student_id)

    r = (
        supabase.table("exam_attempts")
        .select("weak_concepts, created_at")
        .eq("student_id", student_id)
        .order("created_at", desc=True)
        .limit(limit_attempts)
        .execute()
    )

    aggregated: list[dict[str, Any]] = []
    seen_keys: set[str] = set()
    for row in r.data or []:
        wc = _parse_json_field(row.get("weak_concepts"))
        if not isinstance(wc, list):
            continue
        for item in wc:
            if not isinstance(item, dict):
                continue
            key = json.dumps(item, sort_keys=True, default=str)[:200]
            if key in seen_keys:
                continue
            seen_keys.add(key)
            aggregated.append({**item, "source_attempt_at": row.get("created_at")})

    return {"weak_concepts": aggregated, "total": len(aggregated)}


@router.get("/streaks/{student_id}")
async def parent_streaks(student_id: str, auth_id: str = Depends(require_parent_auth)):
    parent = _require_parent_row(auth_id)
    _ensure_linked(parent["id"], student_id)

    r = supabase.table("streaks").select("*").eq("student_id", student_id).execute()
    if not r.data:
        return {"current_streak": 0, "longest_streak": 0, "total_days": 0}
    return r.data[0]


@router.get("/anomalies/{student_id}")
async def parent_anomalies(
    student_id: str,
    auth_id: str = Depends(require_parent_auth),
    limit: int = 50,
):
    parent = _require_parent_row(auth_id)
    _ensure_linked(parent["id"], student_id)

    r = (
        supabase.table("anomaly_logs")
        .select("*")
        .eq("student_id", student_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return {"anomalies": r.data or [], "total": len(r.data or [])}


# ── Nudges ────────────────────────────────────────────────────────────────────


@router.get("/nudges")
async def parent_list_nudges(
    auth_id: str = Depends(require_parent_auth),
    include_dismissed: bool = False,
    limit: int = 100,
):
    parent = _require_parent_row(auth_id)
    q = (
        supabase.table("nudges")
        .select("*")
        .eq("parent_id", parent["id"])
        .order("created_at", desc=True)
        .limit(limit)
    )
    r = q.execute()
    rows = r.data or []
    if not include_dismissed:
        rows = [n for n in rows if not n.get("dismissed_at")]
    return {"nudges": rows, "total": len(rows)}


@router.post("/nudges/{nudge_id}/read")
async def parent_nudge_read(
    nudge_id: str,
    auth_id: str = Depends(require_parent_auth),
):
    parent = _require_parent_row(auth_id)
    now = datetime.utcnow().isoformat()
    supabase.table("nudges").update({"read_at": now}).eq("id", nudge_id).eq(
        "parent_id", parent["id"]
    ).execute()
    return {"success": True, "read_at": now}


@router.post("/nudges/{nudge_id}/dismiss")
async def parent_nudge_dismiss(
    nudge_id: str,
    auth_id: str = Depends(require_parent_auth),
):
    parent = _require_parent_row(auth_id)
    now = datetime.utcnow().isoformat()
    supabase.table("nudges").update({"dismissed_at": now}).eq("id", nudge_id).eq(
        "parent_id", parent["id"]
    ).execute()
    return {"success": True, "dismissed_at": now}


# ── Exam PIN session ───────────────────────────────────────────────────────────


@router.post("/exam/verify-pin")
async def parent_exam_verify_pin(request: Request, auth_id: str = Depends(require_parent_auth)):
    body = await request.json()
    student_id = body.get("student_id")
    pin = body.get("pin") or ""
    if not student_id:
        return JSONResponse({"error": "student_id required"}, status_code=400)

    parent = _require_parent_row(auth_id)
    _ensure_linked(parent["id"], student_id)

    ph = parent.get("pin_hash")
    if not ph or not isinstance(pin, str):
        raise HTTPException(status_code=403, detail="PIN not set or invalid")

    try:
        ok = bcrypt.checkpw(pin.encode("utf-8"), ph.encode("utf-8"))
    except ValueError:
        ok = False
    if not ok:
        raise HTTPException(status_code=403, detail="Invalid PIN")

    session_token = secrets.token_urlsafe(32)
    expires_at = (datetime.utcnow() + timedelta(hours=2)).isoformat()
    payload = {
        "parent_id": parent["id"],
        "student_id": student_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.utcnow().isoformat(),
    }
    ins = supabase.table("exam_sessions").insert(payload).execute()
    row = ins.data[0] if ins.data else {}
    return {
        "verified": True,
        "session_token": session_token,
        "expires_at": expires_at,
        "session_id": row.get("id"),
    }


# ── Health ─────────────────────────────────────────────────────────────────────


@router.post("/health/record")
async def parent_health_record(request: Request, auth_id: str = Depends(require_parent_auth)):
    body = await request.json()
    student_id = body.get("student_id")
    if not student_id:
        return JSONResponse({"error": "student_id required"}, status_code=400)

    parent = _require_parent_row(auth_id)
    _ensure_linked(parent["id"], student_id)

    record = {
        "parent_id": parent["id"],
        "student_id": student_id,
        "recorded_at": body.get("recorded_at") or datetime.utcnow().isoformat(),
        "metrics": body.get("metrics") or body.get("payload") or {},
        "notes": body.get("notes"),
        "source": body.get("source", "parent_app"),
        "created_at": datetime.utcnow().isoformat(),
    }
    ins = supabase.table("health_records").insert(record).execute()
    rid = ins.data[0]["id"] if ins.data else None
    try:
        await run_nudge_engine(supabase, str(student_id))
    except Exception:  # noqa: BLE001
        pass
    return {"success": True, "id": rid}


@router.post("/trigger-nudges/{student_id}")
async def parent_trigger_nudges(
    student_id: str,
    auth_id: str = Depends(require_parent_auth),
):
    """Run nudge engine for one linked student (e.g. after manual refresh)."""
    parent = _require_parent_row(auth_id)
    _ensure_linked(parent["id"], student_id)
    result = await run_nudge_engine(supabase, student_id)
    return {"success": True, **result}


@router.get("/health/records/{student_id}")
async def parent_health_records(
    student_id: str,
    auth_id: str = Depends(require_parent_auth),
    limit: int = 100,
):
    parent = _require_parent_row(auth_id)
    _ensure_linked(parent["id"], student_id)

    r = (
        supabase.table("health_records")
        .select("*")
        .eq("student_id", student_id)
        .eq("parent_id", parent["id"])
        .order("recorded_at", desc=True)
        .limit(limit)
        .execute()
    )
    return {"records": r.data or [], "total": len(r.data or [])}


# ── Sync ────────────────────────────────────────────────────────────────────────


def _parse_since(body: dict[str, Any]) -> Optional[datetime]:
    s = body.get("since") or body.get("updated_after")
    if not s:
        return None
    if isinstance(s, (int, float)):
        return datetime.utcfromtimestamp(s)
    try:
        return datetime.fromisoformat(str(s).replace("Z", "+00:00"))
    except ValueError:
        return None


@router.post("/sync/pull")
async def parent_sync_pull(request: Request, auth_id: str = Depends(require_parent_auth)):
    try:
        body = await request.json()
    except Exception:
        body = {}
    if not isinstance(body, dict):
        body = {}
    parent = _require_parent_row(auth_id)
    since_dt = _parse_since(body)

    def after_since(row: dict[str, Any], keys: tuple[str, ...]) -> bool:
        if since_dt is None:
            return True
        for k in keys:
            v = row.get(k)
            if not v:
                continue
            try:
                t = datetime.fromisoformat(str(v).replace("Z", "+00:00"))
                if t.tzinfo is not None:
                    t = t.replace(tzinfo=None)
                if t >= since_dt.replace(tzinfo=None) if since_dt.tzinfo else t >= since_dt:
                    return True
            except ValueError:
                continue
        return since_dt is None

    nudges_r = (
        supabase.table("nudges")
        .select("*")
        .eq("parent_id", parent["id"])
        .order("created_at", desc=True)
        .limit(500)
        .execute()
    )
    nudges = [n for n in (nudges_r.data or []) if after_since(n, ("updated_at", "created_at"))]

    links_r = (
        supabase.table("parent_student_links")
        .select("*")
        .eq("parent_id", parent["id"])
        .execute()
    )
    links = [x for x in (links_r.data or []) if after_since(x, ("updated_at", "created_at"))]

    health_r = (
        supabase.table("health_records")
        .select("*")
        .eq("parent_id", parent["id"])
        .order("recorded_at", desc=True)
        .limit(500)
        .execute()
    )
    health = [h for h in (health_r.data or []) if after_since(h, ("updated_at", "recorded_at", "created_at"))]

    parent_row = _get_parent_by_auth(auth_id)
    profile = (
        parent_row
        if (since_dt is None or (parent_row and after_since(parent_row, ("updated_at", "created_at"))))
        else None
    )

    return {
        "server_time": datetime.utcnow().isoformat(),
        "parent_profile": profile,
        "nudges": nudges,
        "parent_student_links": links,
        "health_records": health,
    }


@router.post("/sync/push")
async def parent_sync_push(request: Request, auth_id: str = Depends(require_parent_auth)):
    body = await request.json()
    if not isinstance(body, dict):
        return JSONResponse({"error": "JSON body required"}, status_code=400)

    parent = _require_parent_row(auth_id)
    results: dict[str, Any] = {"health_inserted": 0, "errors": []}

    for rec in body.get("health_records") or []:
        if not isinstance(rec, dict):
            continue
        sid = rec.get("student_id")
        if not sid:
            results["errors"].append({"health": "missing student_id"})
            continue
        try:
            _ensure_linked(parent["id"], sid)
        except HTTPException:
            results["errors"].append({"health": sid, "error": "not linked"})
            continue
        try:
            supabase.table("health_records").insert(
                {
                    "parent_id": parent["id"],
                    "student_id": sid,
                    "recorded_at": rec.get("recorded_at")
                    or datetime.utcnow().isoformat(),
                    "metrics": rec.get("metrics") or rec.get("payload") or {},
                    "notes": rec.get("notes"),
                    "source": rec.get("source", "parent_app_sync"),
                    "created_at": datetime.utcnow().isoformat(),
                }
            ).execute()
            results["health_inserted"] += 1
        except Exception as e:  # noqa: BLE001
            results["errors"].append({"health": sid, "error": str(e)})

    if body.get("nudge_ack"):
        for ack in body["nudge_ack"]:
            if not isinstance(ack, dict):
                continue
            nid = ack.get("id")
            if not nid:
                continue
            if ack.get("read"):
                supabase.table("nudges").update(
                    {"read_at": datetime.utcnow().isoformat()}
                ).eq("id", nid).eq("parent_id", parent["id"]).execute()
            if ack.get("dismissed"):
                supabase.table("nudges").update(
                    {"dismissed_at": datetime.utcnow().isoformat()}
                ).eq("id", nid).eq("parent_id", parent["id"]).execute()

    supabase.table("parents").update({"updated_at": datetime.utcnow().isoformat()}).eq(
        "id", parent["id"]
    ).execute()

    return {"success": True, **results}


# ── Device token (FCM) ───────────────────────────────────────────────────────


@router.post("/device-token")
async def parent_device_token(request: Request, auth_id: str = Depends(require_parent_auth)):
    body = await request.json()
    token = body.get("device_token")
    platform = (body.get("platform") or "android").strip()
    parent = _require_parent_row(auth_id)
    supabase.table("parents").update(
        {
            "device_token": token,
            "device_platform": platform,
            "updated_at": datetime.utcnow().isoformat(),
        }
    ).eq("id", parent["id"]).execute()
    return {"success": True}


# ── WhatsApp opt-in ────────────────────────────────────────────────────────────


@router.post("/whatsapp/opt-in")
async def whatsapp_opt_in(request: Request, auth_id: str = Depends(require_parent_auth)):
    body = await request.json()
    phone = (body.get("phone_number") or body.get("whatsapp_number") or "").strip()
    if not phone:
        return JSONResponse({"error": "phone_number required"}, status_code=400)
    parent = _require_parent_row(auth_id)
    supabase.table("parents").update(
        {
            "whatsapp_number": phone,
            "whatsapp_opt_in": True,
            "updated_at": datetime.utcnow().isoformat(),
        }
    ).eq("id", parent["id"]).execute()
    return {"success": True}


@router.post("/whatsapp/opt-out")
async def whatsapp_opt_out(auth_id: str = Depends(require_parent_auth)):
    parent = _require_parent_row(auth_id)
    supabase.table("parents").update(
        {
            "whatsapp_opt_in": False,
            "updated_at": datetime.utcnow().isoformat(),
        }
    ).eq("id", parent["id"]).execute()
    return {"success": True}


@router.get("/whatsapp/status")
async def whatsapp_status(auth_id: str = Depends(require_parent_auth)):
    parent = _require_parent_row(auth_id)
    return {
        "opt_in": bool(parent.get("whatsapp_opt_in")),
        "phone": parent.get("whatsapp_number"),
    }


# ── Health report upload (Claude) ──────────────────────────────────────────────


def _metrics_from_parsed(parsed: dict[str, Any]) -> dict[str, Any]:
    keys = (
        "hemoglobin",
        "wbc_count",
        "platelet_count",
        "rbc_count",
        "vitamin_b12",
        "vitamin_d3",
        "iron_level",
        "ferritin",
        "fasting_glucose",
        "thyroid_tsh",
        "calcium",
    )
    m: dict[str, Any] = {}
    for k in keys:
        v = parsed.get(k)
        if v is not None:
            m[k] = v
    return m


@router.post("/health/upload-report")
async def parent_health_upload_report(
    file: UploadFile = File(...),
    student_id: str = Form(...),
    source: str = Form("other"),
    auth_id: str = Depends(require_parent_auth),
):
    parent = _require_parent_row(auth_id)
    _ensure_linked(parent["id"], student_id)
    raw = await file.read()
    fname = file.filename or "report.pdf"
    path = f"{student_id}/{uuid.uuid4()}_{fname}"

    try:
        supabase.storage.from_("health-reports").upload(
            path,
            raw,
            file_options={"content-type": file.content_type or "application/octet-stream"},
        )
    except Exception as e:  # noqa: BLE001
        return JSONResponse({"error": f"upload failed: {e}"}, status_code=500)

    try:
        pub = supabase.storage.from_("health-reports").get_public_url(path)
    except Exception:  # noqa: BLE001
        pub = path

    key = os.getenv("ANTHROPIC_API_KEY")
    if not key:
        return JSONResponse({"error": "ANTHROPIC_API_KEY not set"}, status_code=500)
    claude = Anthropic(api_key=key)
    try:
        parsed = extract_from_pdf_or_image(claude, raw, fname)
    except Exception as e:  # noqa: BLE001
        return JSONResponse(
            {"error": "parse_failed", "detail": str(e), "raw_report_url": pub},
            status_code=422,
        )

    metrics = _metrics_from_parsed(parsed)
    recorded = parsed.get("report_date") or datetime.utcnow().date().isoformat()
    ins = (
        supabase.table("health_records")
        .insert(
            {
                "parent_id": parent["id"],
                "student_id": student_id,
                "recorded_at": recorded,
                "metrics": metrics,
                "notes": json.dumps({"parsed_full": parsed}, ensure_ascii=False)[:8000],
                "source": source,
                "raw_report_url": str(pub),
                "parsed_data": parsed,
                "record_type": "lab_report",
                "created_at": datetime.utcnow().isoformat(),
            }
        )
        .execute()
    )
    rid = ins.data[0]["id"] if ins.data else None
    try:
        await run_nudge_engine(supabase, str(student_id))
    except Exception:  # noqa: BLE001
        pass
    return {
        "success": True,
        "health_record_id": rid,
        "parsed": parsed,
        "metrics": metrics,
        "raw_report_url": pub,
    }


@router.post("/health/confirm-parsed")
async def parent_health_confirm_parsed(
    request: Request, auth_id: str = Depends(require_parent_auth)
):
    body = await request.json()
    hid = body.get("health_record_id")
    corrections = body.get("corrections") or {}
    if not hid:
        return JSONResponse({"error": "health_record_id required"}, status_code=400)
    parent = _require_parent_row(auth_id)
    r = (
        supabase.table("health_records")
        .select("*")
        .eq("id", hid)
        .eq("parent_id", parent["id"])
        .execute()
    )
    if not r.data:
        raise HTTPException(404, "record not found")
    row = r.data[0]
    metrics = row.get("metrics") or {}
    if isinstance(metrics, str):
        try:
            metrics = json.loads(metrics)
        except json.JSONDecodeError:
            metrics = {}
    for k, v in corrections.items():
        metrics[k] = v
    pd = row.get("parsed_data") or {}
    if isinstance(pd, str):
        try:
            pd = json.loads(pd)
        except json.JSONDecodeError:
            pd = {}
    if isinstance(pd, dict):
        pd = {**pd, **corrections}
    supabase.table("health_records").update(
        {
            "metrics": metrics,
            "parsed_data": pd,
            "updated_at": datetime.utcnow().isoformat(),
        }
    ).eq("id", hid).execute()
    sid = str(row.get("student_id") or "")
    if sid:
        try:
            await run_nudge_engine(supabase, sid)
        except Exception:  # noqa: BLE001
            pass
    return {"success": True}
