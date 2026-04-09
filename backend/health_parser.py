"""
Claude-based lab report extraction (images; PDF via pdf2image when available).
"""
from __future__ import annotations

import base64
import json
from typing import Any, Optional

from anthropic import Anthropic


EXTRACTION_PROMPT = """Extract all medical test values from this lab report. Return a JSON object with these fields (use null if not found):
{
  "patient_name": string,
  "report_date": string (YYYY-MM-DD),
  "lab_name": string,
  "hemoglobin": number (g/dL),
  "wbc_count": number (cells/µL),
  "platelet_count": number (cells/µL),
  "rbc_count": number (million cells/µL),
  "vitamin_b12": number (pg/mL),
  "vitamin_d3": number (ng/mL),
  "iron_level": number (µg/dL),
  "ferritin": number (ng/mL),
  "fasting_glucose": number (mg/dL),
  "thyroid_tsh": number (mIU/L),
  "calcium": number (mg/dL),
  "all_values": [{"test_name": string, "value": number, "unit": string, "reference_range": string, "status": string}]
}
Only extract values that are clearly present. Return ONLY JSON, no markdown."""


def _strip_json(text: str) -> str:
    t = text.strip()
    if "```" in t:
        for part in t.split("```"):
            p = part.strip()
            if p.startswith("json"):
                p = p[4:].strip()
            if p.startswith("{"):
                return p
    return t


def extract_from_image(claude: Anthropic, image_bytes: bytes, media_type: str) -> dict[str, Any]:
    b64 = base64.standard_b64encode(image_bytes).decode("ascii")
    msg = claude.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": b64,
                        },
                    },
                    {"type": "text", "text": EXTRACTION_PROMPT},
                ],
            }
        ],
    )
    text = msg.content[0].text
    return json.loads(_strip_json(text))


def pdf_bytes_to_images(pdf_bytes: bytes) -> list[tuple[bytes, str]]:
    try:
        from pdf2image import convert_from_bytes

        images = convert_from_bytes(pdf_bytes, dpi=150)
        out: list[tuple[bytes, str]] = []
        for im in images[:5]:
            from io import BytesIO

            buf = BytesIO()
            im.save(buf, format="PNG")
            out.append((buf.getvalue(), "image/png"))
        return out
    except Exception:  # noqa: BLE001
        return []


def extract_from_pdf_or_image(claude: Anthropic, data: bytes, filename: str) -> dict[str, Any]:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        pages = pdf_bytes_to_images(data)
        if not pages:
            raise ValueError("PDF could not be converted (install poppler / pdf2image)")
        merged: dict[str, Any] = {}
        for img_bytes, mime in pages:
            part = extract_from_image(claude, img_bytes, mime)
            for k, v in part.items():
                if v is not None and merged.get(k) in (None, [], {}):
                    merged[k] = v
        return merged
    mime = "image/jpeg" if lower.endswith((".jpg", ".jpeg")) else "image/png"
    return extract_from_image(claude, data, mime)
