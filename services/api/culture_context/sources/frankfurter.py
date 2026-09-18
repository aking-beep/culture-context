from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json

import httpx

from ..models import RuleKind, RuleRecord, SourceClass, SourceRef
from ..text import compact

URL = "https://api.frankfurter.dev/v1/latest"


class Frankfurter:
    authority = "Frankfurter FX"
    source_id = "frankfurter"

    def __init__(self, client: httpx.AsyncClient | None = None):
        self.client = client

    async def fetch(self, home_currency: str, dest_currency: str, jurisdiction: str) -> tuple[list[RuleRecord], dict]:
        if not home_currency or not dest_currency or home_currency.upper() == dest_currency.upper():
            return [], {}
        own = self.client is None
        client = self.client or httpx.AsyncClient(
            timeout=6.0,
            follow_redirects=True,
            headers={"user-agent": "CultureContext/0.1"},
        )
        try:
            response = await client.get(URL, params={"base": home_currency.upper(), "symbols": dest_currency.upper()})
            response.raise_for_status()
            payload = response.json()
        finally:
            if own:
                await client.aclose()

        rate = (payload.get("rates") or {}).get(dest_currency.upper())
        if rate is None:
            raise ValueError("missing FX rate")
        retrieved = datetime.now(timezone.utc)
        raw = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
        content_hash = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        source = SourceRef(
            id=f"frankfurter:{home_currency}:{dest_currency}:{content_hash[:12]}",
            authority=self.authority,
            url="https://api.frankfurter.dev",
            jurisdiction=jurisdiction,
            source_class=SourceClass.REFERENCE_DATA,
            retrieved_at=retrieved,
            content_hash=content_hash,
        )
        date_label = payload.get("date") or retrieved.date().isoformat()
        rule = RuleRecord(
            id=f"frankfurter:{home_currency}:{dest_currency}:{content_hash[:10]}",
            jurisdiction=jurisdiction,
            category="context",
            kind=RuleKind.CONTEXT,
            title=f"Reference FX: {home_currency.upper()} to {dest_currency.upper()}",
            summary=compact(
                f"Reference rate on {date_label}: 1 {home_currency.upper()} = {rate} {dest_currency.upper()}. "
                "This is market reference data, not a quote, fee schedule, or legal requirement."
            ),
            sources=[source],
        )
        meta = {
            "source_id": "frankfurter",
            "url": "https://api.frankfurter.dev",
            "normalized_text": raw,
            "content_hash": content_hash,
            "retrieved_at": retrieved,
            "authority": self.authority,
        }
        return [rule], meta
