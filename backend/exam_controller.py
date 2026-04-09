"""
Kiosk-oriented exam session API (student app). Uses exam_sessions, exam_answers, anomaly_logs.
"""
from __future__ import annotations

import os
import secrets
from datetime import datetime, timedelta
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Header, HTTPException, Request
from supabase import create_client

load_dotenv()

router = APIRouter(tags=["exam-kiosk"])

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY"),
)


def _sb() -> Any:
    return supabase


def _session_from_token(token: str) -> dict[str, Any]:
    r = (
        _sb()
        .table("exam_sessions")
        .select("*")
        .eq("session_token", token)
        .limit(1)
        .execute()
    )
    if not r.data:
        raise HTTPException(401, "Invalid session token")
    return r.data[0]


def _log_anomaly(
    student_id: str,
    exam_session_id: str,
    anomaly_type: str,
    severity: str,
    details: str,
) -> None:
    _sb().table("anomaly_logs").insert(
        {
            "student_id": student_id,
            "exam_session_id": exam_session_id,
            "anomaly_type": anomaly_type,
            "severity": severity,
            "details": details,
            "created_at": datetime.utcnow().isoformat(),
        }
    ).execute()


@router.post("/exam/start")
async def exam_start(request: Request):
    body = await request.json()
    student_id = body.get("student_id")
    exam_type = body.get("exam_type", "practice")
    time_limit = int(body.get("time_limit_minutes") or 60)
    total_q = int(body.get("total_questions") or 30)
    device_id = body.get("device_id") or ""
    source_paper_id = body.get("source_paper_id")

    if not student_id:
        raise HTTPException(400, "student_id required")

    token = secrets.token_urlsafe(32)
    now = datetime.utcnow().isoformat()
    row = {
        "student_id": student_id,
        "session_token": token,
        "status": "locked",
        "kiosk_locked": True,
        "exam_type": exam_type,
        "time_limit_minutes": time_limit,
        "total_questions": total_q,
        "answered_count": 0,
        "device_id": device_id,
        "source_paper_id": source_paper_id,
        "started_at": now,
        "created_at": now,
    }
    ins = _sb().table("exam_sessions").insert(row).execute()
    sid = ins.data[0]["id"] if ins.data else None
    return {"session_id": sid, "session_token": token, "status": "locked"}


@router.post("/exam/answer")
async def exam_answer(
    request: Request,
    x_session_token: Optional[str] = Header(None, alias="X-Session-Token"),
):
    body = await request.json()
    token = x_session_token or body.get("session_token")
    if not token:
        raise HTTPException(400, "X-Session-Token required")
    sess = _session_from_token(token)
    eid = str(sess["id"])
    student_id = str(sess["student_id"])
    qid = str(body.get("question_id") or "")
    selected = body.get("selected_option")
    spent = int(body.get("time_spent_seconds") or 0)

    _sb().table("exam_answers").insert(
        {
            "exam_session_id": eid,
            "question_id": qid,
            "selected_option": selected,
            "time_spent_seconds": spent,
            "created_at": datetime.utcnow().isoformat(),
        }
    ).execute()

    ac = int(sess.get("answered_count") or 0) + 1
    _sb().table("exam_sessions").update(
        {"answered_count": ac, "status": "in_progress"}
    ).eq("id", eid).execute()

    anomalies: list[dict[str, Any]] = []
    if spent < 3:
        _log_anomaly(student_id, eid, "impossible_speed", "high", f"{spent}s on question")
        anomalies.append({"type": "impossible_speed", "severity": "high"})

    return {"saved": True, "anomalies": anomalies}


@router.post("/exam/complete")
async def exam_complete(
    request: Request,
    x_session_token: Optional[str] = Header(None, alias="X-Session-Token"),
):
    body = await request.json()
    token = x_session_token or body.get("session_token")
    if not token:
        raise HTTPException(400, "X-Session-Token required")
    sess = _session_from_token(token)
    eid = str(sess["id"])
    _sb().table("exam_sessions").update(
        {"status": "awaiting_pin", "completed_at": datetime.utcnow().isoformat()}
    ).eq("id", eid).execute()

    try:
        from notification_service import send_push_to_parent

        links = (
            _sb()
            .table("parent_student_links")
            .select("parent_id")
            .eq("student_id", sess["student_id"])
            .eq("status", "active")
            .execute()
        )
        for link in links.data or []:
            pid = link.get("parent_id")
            if pid:
                send_push_to_parent(
                    _sb(),
                    str(pid),
                    "Exam complete",
                    "PIN enter cheyandi",
                    {"route": "/dashboard/exam"},
                )
    except Exception as e:  # noqa: BLE001
        print(f"notify parent exam complete: {e}")

    return {"status": "awaiting_pin"}


@router.get("/exam/status/{session_id}")
async def exam_status(session_id: str):
    r = _sb().table("exam_sessions").select("*").eq("id", session_id).execute()
    if not r.data:
        raise HTTPException(404, "session not found")
    row = r.data[0]
    tl = int(row.get("time_limit_minutes") or 0) * 60
    started = row.get("started_at")
    remaining = None
    if started:
        try:
            st = datetime.fromisoformat(str(started).replace("Z", "+00:00"))
            elapsed = (datetime.utcnow() - st.replace(tzinfo=None)).total_seconds()
            remaining = max(0, tl - int(elapsed))
        except Exception:  # noqa: BLE001
            remaining = tl
    an = (
        _sb()
        .table("anomaly_logs")
        .select("id")
        .eq("exam_session_id", session_id)
        .execute()
    )
    acount = len(an.data or [])
    return {
        "status": row.get("status"),
        "answered_count": row.get("answered_count"),
        "time_remaining_seconds": remaining,
        "anomaly_count": acount,
    }


@router.get("/exam/results/{session_id}")
async def exam_results(session_id: str):
    r = _sb().table("exam_sessions").select("*").eq("id", session_id).execute()
    if not r.data:
        raise HTTPException(404, "session not found")
    sess = r.data[0]
    ans = (
        _sb()
        .table("exam_answers")
        .select("*")
        .eq("exam_session_id", session_id)
        .execute()
    )
    anom = (
        _sb()
        .table("anomaly_logs")
        .select("*")
        .eq("exam_session_id", session_id)
        .execute()
    )
    return {
        "session": sess,
        "answers": ans.data or [],
        "anomalies": anom.data or [],
    }
