"""
FCM push notifications via firebase-admin. Service account JSON in FIREBASE_SERVICE_ACCOUNT.
"""
from __future__ import annotations

import json
import os
from typing import Any, Optional

_firebase_ready = False


def init_firebase() -> bool:
    global _firebase_ready
    if _firebase_ready:
        return True
    raw = os.getenv("FIREBASE_SERVICE_ACCOUNT")
    if not raw:
        return False
    try:
        import firebase_admin
        from firebase_admin import credentials

        if firebase_admin._apps:
            _firebase_ready = True
            return True
        cred = credentials.Certificate(json.loads(raw))
        firebase_admin.initialize_app(cred)
        _firebase_ready = True
        return True
    except Exception:  # noqa: BLE001
        return False


def send_push(
    device_token: str,
    title: str,
    body: str,
    data: Optional[dict[str, Any]] = None,
) -> bool:
    if not device_token or not init_firebase():
        return False
    try:
        from firebase_admin import messaging

        messaging.send(
            messaging.Message(
                token=device_token,
                notification=messaging.Notification(title=title, body=body),
                data={k: str(v) for k, v in (data or {}).items()},
            )
        )
        return True
    except Exception as e:  # noqa: BLE001
        print(f"FCM send error: {e}")
        return False


def send_push_to_parent(client: Any, parent_id: str, title: str, body: str, data=None) -> bool:
    r = client.table("parents").select("device_token").eq("id", parent_id).execute()
    if not r.data:
        return False
    token = r.data[0].get("device_token")
    if not token:
        return False
    return send_push(str(token), title, body, data)
