"""
Gupshup WhatsApp Business API (India-friendly).
Env: GUPSHUP_API_KEY, GUPSHUP_APP_NAME, GUPSHUP_SOURCE_NUMBER
"""
from __future__ import annotations

import json
import os
from typing import Any, Optional

import httpx

GUPSHUP_URL = "https://api.gupshup.io/wa/api/v1/msg"


def send_whatsapp(
    phone_number: str,
    template_name: str,
    template_params: Optional[list[str]] = None,
) -> dict[str, Any]:
    """
    Send a WhatsApp template message. Template must be approved on Gupshup dashboard.
    phone_number: E.164 without + or with + depending on Gupshup account config.
    """
    api_key = os.getenv("GUPSHUP_API_KEY")
    app_name = os.getenv("GUPSHUP_APP_NAME")
    src = os.getenv("GUPSHUP_SOURCE_NUMBER")
    if not api_key or not app_name or not src:
        return {"ok": False, "error": "Gupshup env not configured"}

    params = template_params or []
    payload = {
        "channel": "whatsapp",
        "source": src,
        "destination": phone_number.lstrip("+"),
        "src.name": app_name,
        "template": json.dumps(
            {"id": template_name, "params": params},
            ensure_ascii=False,
        ),
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            res = client.post(
                GUPSHUP_URL,
                headers={"apikey": api_key, "Content-Type": "application/x-www-form-urlencoded"},
                data=payload,
            )
        out: dict[str, Any] = {"ok": res.status_code == 200, "status": res.status_code}
        try:
            out["body"] = res.json()
        except Exception:  # noqa: BLE001
            out["text"] = res.text[:500]
        return out
    except Exception as e:  # noqa: BLE001
        return {"ok": False, "error": str(e)}
