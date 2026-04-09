"""
Daily College Log — topics covered per day (student app + parent read-only).
Table: college_daily_logs (see sql/college_daily_logs.sql).
"""
from __future__ import annotations

import os
import re
from collections import OrderedDict
from datetime import date
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from supabase import create_client

from parent_routes import _ensure_linked, _require_parent_row, require_parent_auth

load_dotenv()

router = APIRouter(tags=["college-daily-log"])

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY"),
)


def _opt_str(v: Any) -> Optional[str]:
    if v is None:
        return None
    s = str(v).strip()
    return s or None


def _normalize_topics(raw: Any) -> list[str]:
    if not isinstance(raw, list):
        return []
    out: list[str] = []
    for t in raw:
        if t is None:
            continue
        s = str(t).strip()
        if s:
            out.append(s)
    return out


def _parse_log_date(s: Optional[str]) -> date:
    if not s or not isinstance(s, str):
        return date.today()
    s = s.strip()
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", s):
        raise HTTPException(status_code=400, detail="date must be YYYY-MM-DD")
    try:
        return date.fromisoformat(s)
    except ValueError as e:
        raise HTTPException(status_code=400, detail="invalid date") from e


def _student_exists(student_id: str) -> bool:
    r = supabase.table("students").select("id").eq("id", student_id).limit(1).execute()
    return bool(r.data)


# ── Student ──────────────────────────────────────────────────────────────────


@router.post("/student/college-log")
async def student_college_log_create(request: Request):
    body = await request.json()
    student_id = body.get("student_id")
    subject = (body.get("subject") or "").strip()
    topics = _normalize_topics(body.get("topics_covered"))

    if not student_id:
        return JSONResponse({"error": "student_id required"}, status_code=400)
    if not subject:
        return JSONResponse({"error": "subject required"}, status_code=400)
    if not topics:
        return JSONResponse(
            {"error": "topics_covered required (non-empty array of strings)"},
            status_code=400,
        )

    if not _student_exists(str(student_id)):
        return JSONResponse({"error": "Student not found"}, status_code=404)

    log_date = _parse_log_date(body.get("log_date"))
    log_date_str = log_date.isoformat()

    row: dict[str, Any] = {
        "student_id": str(student_id),
        "log_date": log_date_str,
        "subject": subject,
        "topics_covered": topics,
        "teacher_name": _opt_str(body.get("teacher_name")),
        "homework": _opt_str(body.get("homework")),
        "notes": _opt_str(body.get("notes")),
    }

    try:
        res = (
            supabase.table("college_daily_logs")
            .upsert(row, on_conflict="student_id,log_date,subject")
            .execute()
        )
    except Exception as e:  # noqa: BLE001
        return JSONResponse(
            {"error": "Failed to save log", "detail": str(e)},
            status_code=500,
        )

    saved = res.data[0] if res.data else row
    return {"success": True, "log": saved}


@router.get("/student/college-log")
async def student_college_log_list(
    student_id: str,
    log_date_param: str = Query(..., alias="date", description="YYYY-MM-DD"),
):
    if not student_id:
        return JSONResponse({"error": "student_id required"}, status_code=400)
    log_date = _parse_log_date(log_date_param)
    log_date_str = log_date.isoformat()

    if not _student_exists(student_id):
        return JSONResponse({"error": "Student not found"}, status_code=404)

    r = (
        supabase.table("college_daily_logs")
        .select("*")
        .eq("student_id", student_id)
        .eq("log_date", log_date_str)
        .execute()
    )
    return {"date": log_date_str, "logs": r.data or [], "total": len(r.data or [])}


# ── Parent (linked student only) ─────────────────────────────────────────────


@router.get("/parent/college-log/{student_id}/today")
async def parent_college_log_today(
    student_id: str,
    auth_id: str = Depends(require_parent_auth),
):
    parent = _require_parent_row(auth_id)
    _ensure_linked(parent["id"], student_id)

    today = date.today().isoformat()
    r = (
        supabase.table("college_daily_logs")
        .select("*")
        .eq("student_id", student_id)
        .eq("log_date", today)
        .execute()
    )
    return {"date": today, "logs": r.data or [], "total": len(r.data or [])}


@router.get("/parent/college-log/{student_id}")
async def parent_college_log_range(
    student_id: str,
    auth_id: str = Depends(require_parent_auth),
    days: int = 7,
):
    parent = _require_parent_row(auth_id)
    _ensure_linked(parent["id"], student_id)

    if days < 1 or days > 90:
        raise HTTPException(status_code=400, detail="days must be between 1 and 90")

    end = date.today()
    start = date.fromordinal(end.toordinal() - (days - 1))

    r = (
        supabase.table("college_daily_logs")
        .select("*")
        .eq("student_id", student_id)
        .gte("log_date", start.isoformat())
        .lte("log_date", end.isoformat())
        .order("log_date", desc=True)
        .execute()
    )
    rows = r.data or []

    by_date: "OrderedDict[str, list[dict[str, Any]]]" = OrderedDict()
    for row in rows:
        dkey = str(row.get("log_date", ""))[:10]
        if dkey not in by_date:
            by_date[dkey] = []
        by_date[dkey].append(row)

    return {
        "student_id": student_id,
        "days": days,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "by_date": dict(by_date),
        "total_entries": len(rows),
    }
