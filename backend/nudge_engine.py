"""
Automatic behavioral nudges for SOMI Connect parents.
Uses Supabase tables: parent_student_links, students, streaks, exam_attempts,
concept_progress, health_records, nudges.
"""
from __future__ import annotations

import json
import os
import re
from datetime import date, datetime, timedelta
from typing import Any, Optional

from fastapi import Header, HTTPException

# —— Admin auth ——


def verify_admin_key(x_admin_key: str | None) -> None:
    expected = os.getenv("ADMIN_NUDGE_KEY") or os.getenv("X_ADMIN_KEY") or os.getenv(
        "ADMIN_API_KEY"
    )
    if not expected:
        raise HTTPException(
            status_code=500, detail="ADMIN_NUDGE_KEY (or ADMIN_API_KEY) not configured"
        )
    if not x_admin_key or x_admin_key != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")


def _parse_dt(val: Any) -> Optional[datetime]:
    if not val:
        return None
    if isinstance(val, datetime):
        return val
    try:
        return datetime.fromisoformat(str(val).replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return None


def _metrics_blob(row: dict[str, Any]) -> dict[str, Any]:
    m = row.get("metrics") or row.get("payload")
    if m is None:
        return {}
    if isinstance(m, dict):
        return m
    if isinstance(m, str):
        try:
            return json.loads(m)
        except json.JSONDecodeError:
            return {}
    return {}


def _num_from_metrics(m: dict[str, Any], *keys: str) -> Optional[float]:
    for k in keys:
        v = m.get(k)
        if v is None:
            continue
        try:
            return float(v)
        except (TypeError, ValueError):
            continue
    return None


def _concept_progress_percent(row: dict[str, Any]) -> int:
    keys = ("previous_done", "textbook_done", "tweaked_done", "ai_done")
    done = sum(1 for k in keys if row.get(k) is True)
    return min(100, done * 25)


def _concept_last_touch(row: dict[str, Any]) -> Optional[datetime]:
    for k in ("updated_at", "created_at"):
        t = _parse_dt(row.get(k))
        if t:
            return t
    return None


def _recent_nudge_exists(
    client: Any, parent_id: str, student_id: str, nudge_type: str, hours: int = 48
) -> bool:
    since = (datetime.utcnow() - timedelta(hours=hours)).isoformat()
    r = (
        client.table("nudges")
        .select("id")
        .eq("parent_id", parent_id)
        .eq("student_id", student_id)
        .eq("nudge_type", nudge_type)
        .gte("created_at", since)
        .limit(1)
        .execute()
    )
    return bool(r.data)


def _insert_nudge(
    client: Any,
    parent_id: str,
    student_id: str,
    nudge_type: str,
    title: str,
    body: str,
    priority: str = "normal",
) -> bool:
    if _recent_nudge_exists(client, parent_id, student_id, nudge_type):
        return False
    now = datetime.utcnow().isoformat()
    client.table("nudges").insert(
        {
            "parent_id": parent_id,
            "student_id": student_id,
            "nudge_type": nudge_type,
            "title": title[:200],
            "body": body[:2000],
            "priority": priority,
            "is_read": False,
            "created_at": now,
            "updated_at": now,
        }
    ).execute()
    try:
        from notification_service import send_push_to_parent

        send_push_to_parent(
            client,
            parent_id,
            title[:120],
            body[:240],
            {"route": "/nudges"},
        )
    except Exception:  # noqa: BLE001
        pass
    if priority == "urgent":
        try:
            from whatsapp_service import send_whatsapp

            pr = (
                client.table("parents")
                .select("whatsapp_number, whatsapp_opt_in")
                .eq("id", parent_id)
                .execute()
            )
            if pr.data:
                prow = pr.data[0]
                phone = prow.get("whatsapp_number")
                if prow.get("whatsapp_opt_in") and phone:
                    send_whatsapp(
                        str(phone),
                        "streak_broken",
                        [body[:180]],
                    )
        except Exception:  # noqa: BLE001
            pass
    return True


def _student_name(client: Any, student_id: str) -> str:
    r = client.table("students").select("name").eq("id", student_id).execute()
    if r.data:
        return str(r.data[0].get("name") or "Student")
    return "Student"


def _parents_for_student(client: Any, student_id: str) -> list[str]:
    r = (
        client.table("parent_student_links")
        .select("parent_id")
        .eq("student_id", student_id)
        .eq("status", "active")
        .execute()
    )
    out: list[str] = []
    for row in r.data or []:
        pid = row.get("parent_id")
        if pid:
            out.append(str(pid))
    return out


def _exam_attempts_in_range(
    client: Any, student_id: str, start: datetime, end: datetime
) -> list[dict[str, Any]]:
    r = (
        client.table("exam_attempts")
        .select("percentage,score,total,time_taken,created_at,subject,chapters")
        .eq("student_id", student_id)
        .gte("created_at", start.isoformat())
        .lt("created_at", end.isoformat())
        .execute()
    )
    return list(r.data or [])


def _avg_percentage(attempts: list[dict[str, Any]]) -> Optional[float]:
    pcts: list[float] = []
    for a in attempts:
        p = a.get("percentage")
        if p is not None:
            try:
                pcts.append(float(p))
            except (TypeError, ValueError):
                pass
        else:
            sc, tot = a.get("score"), a.get("total")
            try:
                if tot and float(tot) > 0 and sc is not None:
                    pcts.append((float(sc) / float(tot)) * 100)
            except (TypeError, ValueError):
                pass
    if not pcts:
        return None
    return sum(pcts) / len(pcts)


def _avg_exam_minutes_per_day(
    client: Any, student_id: str, days: int = 7
) -> float:
    """Proxy: distribute each attempt's time_taken (seconds) across its day."""
    end = datetime.utcnow()
    start = end - timedelta(days=days)
    attempts = _exam_attempts_in_range(client, student_id, start, end)
    by_day: dict[str, float] = {}
    for a in attempts:
        ct = _parse_dt(a.get("created_at"))
        if not ct:
            continue
        dkey = ct.date().isoformat()
        tt = a.get("time_taken") or 0
        try:
            sec = float(tt)
        except (TypeError, ValueError):
            sec = 0
        by_day[dkey] = by_day.get(dkey, 0) + sec
    if not by_day:
        return 0.0
    total_min = sum(v for v in by_day.values()) / 60.0
    return total_min / max(len(by_day), 1)


def _three_day_low_study_streak(
    client: Any, student_id: str, threshold_min: float = 30.0
) -> bool:
    """True if last 3 calendar days each have < threshold_min exam-time proxy."""
    today = date.today()
    for i in range(3):
        d = today - timedelta(days=i)
        start = datetime(d.year, d.month, d.day)
        end = start + timedelta(days=1)
        ats = _exam_attempts_in_range(client, student_id, start, end)
        minutes = 0.0
        for a in ats:
            tt = a.get("time_taken") or 0
            try:
                minutes += float(tt) / 60.0
            except (TypeError, ValueError):
                pass
        if minutes >= threshold_min:
            return False
    return True


async def run_nudge_engine(client: Any, student_id: Optional[str] = None) -> dict[str, Any]:
    """
    Evaluate rules and insert nudges. If student_id is None, all linked students.
    """
    created = 0
    errors: list[str] = []
    processed = 0

    if student_id:
        student_ids = [student_id]
    else:
        try:
            r = (
                client.table("parent_student_links")
                .select("student_id")
                .eq("status", "active")
                .execute()
            )
            student_ids = list(
                {str(row["student_id"]) for row in (r.data or []) if row.get("student_id")}
            )
        except Exception as e:  # noqa: BLE001
            return {"created": 0, "errors": [str(e)], "students_processed": 0}

    for sid in student_ids:
        processed += 1
        parent_ids = _parents_for_student(client, sid)
        if not parent_ids:
            continue
        name = _student_name(client, sid)

        try:
            streak_r = client.table("streaks").select("*").eq("student_id", sid).execute()
            streak = streak_r.data[0] if streak_r.data else {}
            cur = int(streak.get("current_streak") or 0)
            longest = int(streak.get("longest_streak") or 0)
        except Exception as e:  # noqa: BLE001
            errors.append(f"streak {sid}: {e}")
            streak, cur, longest = {}, 0, 0

        now = datetime.utcnow()
        last7_start = now - timedelta(days=7)
        prev7_start = now - timedelta(days=14)
        prev7_end = now - timedelta(days=7)

        last7 = _exam_attempts_in_range(client, sid, last7_start, now)
        prev7 = _exam_attempts_in_range(client, sid, prev7_start, prev7_end)
        avg7 = _avg_percentage(last7)
        avg_prev = _avg_percentage(prev7)

        exam_min_proxy = _avg_exam_minutes_per_day(client, sid, 7)

        for parent_id in parent_ids:
            try:
                # —— Reward: high average ——
                if avg7 is not None and avg7 > 80:
                    nt = "reward_movie"
                    title = "🎬 Movie reward time!"
                    body = (
                        f"Mee pillalu {avg7:.0f}% average score chesaru (last 7 days)! "
                        "Weekend treat ivvandi"
                    )
                    if _insert_nudge(client, parent_id, sid, nt, title, body, "normal"):
                        created += 1

                # —— Reward: long streak ——
                if cur > 14:
                    nt = "reward_streak_milestone"
                    title = "🏆 Streak celebration"
                    body = f"{cur} days streak! Celebration deserve chesaru — special treat ivvandi"
                    if _insert_nudge(client, parent_id, sid, nt, title, body, "normal"):
                        created += 1

                # —— Reward: strong latest exam (chapter proxy) ——
                if last7:
                    best = max(
                        last7,
                        key=lambda a: float(a.get("percentage") or 0),
                    )
                    pct = float(best.get("percentage") or 0)
                    tot = int(best.get("total") or 0)
                    if pct >= 88 and tot >= 5:
                        ch = best.get("subject") or "Chapter"
                        nt = "reward_chapter_complete"
                        title = "📚 Chapter milestone"
                        body = f"{ch} complete chesaru! Encourage cheyandi — {pct:.0f}%"
                        if _insert_nudge(client, parent_id, sid, nt, title, body, "normal"):
                            created += 1

                # —— Environment: score dip ——
                if (
                    avg7 is not None
                    and avg7 < 50
                    and avg_prev is not None
                    and avg_prev > 60
                ):
                    nt = "env_scores_dip"
                    title = "📚 Study environment check"
                    body = (
                        "Scores dip ayyaayi. Study environment check cheyandi — "
                        "quiet hours (7-9 PM) try cheyandi"
                    )
                    if _insert_nudge(client, parent_id, sid, nt, title, body, "normal"):
                        created += 1

                # —— Environment: low exam activity proxy ——
                if _three_day_low_study_streak(client, sid, 30.0):
                    nt = "env_low_study_time"
                    title = "⏰ Study routine"
                    body = (
                        "Study time takkuva undi (recent activity). Routine set cheyamani help cheyandi"
                    )
                    if _insert_nudge(client, parent_id, sid, nt, title, body, "normal"):
                        created += 1

                # —— Streak broken ——
                if cur == 0 and longest > 7:
                    nt = "streak_broken_encourage"
                    title = "🔥 Streak break"
                    body = (
                        f"{longest} days streak break ayyindi! Gentle ga remind cheyandi, "
                        "pressure kaadu encouragement"
                    )
                    if _insert_nudge(
                        client, parent_id, sid, nt, title, body, "urgent"
                    ):
                        created += 1

                # —— Streak rebuilding ——
                if cur == 3:
                    nt = "streak_building"
                    title = "💪 Streak building"
                    body = "Streak building back! 3 days continuous — encourage cheyandi"
                    if _insert_nudge(client, parent_id, sid, nt, title, body, "normal"):
                        created += 1

                # —— Revision: weak concept ——
                try:
                    cp_r = (
                        client.table("concept_progress")
                        .select("*")
                        .eq("student_id", sid)
                        .execute()
                    )
                    for row in cp_r.data or []:
                        pct = _concept_progress_percent(row)
                        touched = _concept_last_touch(row)
                        if pct >= 30:
                            continue
                        if not touched or (now - touched).days <= 7:
                            continue
                        concept = row.get("concept") or row.get("namespace") or "Topic"
                        slug = re.sub(r"[^a-z0-9]+", "_", str(concept).lower())[:40]
                        nt = f"revision:{slug}"
                        title = "📝 Revision needed"
                        body = (
                            f"{concept} lo {pct}% progress — revision needed. Remind cheyandi"
                        )
                        if _insert_nudge(
                            client, parent_id, sid, nt, title, body, "normal"
                        ):
                            created += 1
                except Exception as e:  # noqa: BLE001
                    errors.append(f"concept_progress {sid}: {e}")

                # —— Health ——
                try:
                    hr = (
                        client.table("health_records")
                        .select("*")
                        .eq("student_id", sid)
                        .order("recorded_at", desc=True)
                        .limit(1)
                        .execute()
                    )
                    latest = hr.data[0] if hr.data else None
                    if latest:
                        rec_at = _parse_dt(latest.get("recorded_at")) or _parse_dt(
                            latest.get("created_at")
                        )
                        if rec_at and (now - rec_at).days > 180:
                            nt = "health_checkup_due"
                            title = "🩺 Checkup reminder"
                            body = (
                                "6 months ayyindi last checkup ki. DoctorC lo ~₹1,000 ki "
                                "full panel available"
                            )
                            if _insert_nudge(
                                client, parent_id, sid, nt, title, body, "normal"
                            ):
                                created += 1

                        m = _metrics_blob(latest)
                        b12 = _num_from_metrics(m, "vitamin_b12", "b12", "Vitamin B12")
                        d3 = _num_from_metrics(m, "vitamin_d3", "d3", "Vitamin D3")

                        if b12 is not None and b12 < 200 and exam_min_proxy < 60:
                            nt = "health_b12_focus"
                            title = "🧠 B12 & focus"
                            body = (
                                "B12 takkuva + focus takkuva. Doctor consult cheyandi"
                            )
                            if _insert_nudge(
                                client, parent_id, sid, nt, title, body, "urgent"
                            ):
                                created += 1

                        if d3 is not None and d3 < 20:
                            nt = "health_d3_low"
                            title = "☀️ Vitamin D3"
                            body = (
                                f"D3 takkuva undi ({d3} ng/mL). Sunlight + supplements recommend"
                            )
                            if _insert_nudge(
                                client, parent_id, sid, nt, title, body, "normal"
                            ):
                                created += 1
                except Exception as e:  # noqa: BLE001
                    errors.append(f"health {sid}: {e}")

            except Exception as e:  # noqa: BLE001
                errors.append(f"parent {parent_id} student {sid}: {e}")

    return {
        "created": created,
        "errors": errors,
        "students_processed": processed,
    }
