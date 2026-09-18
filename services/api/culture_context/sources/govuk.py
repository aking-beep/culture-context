from __future__ import annotations
from datetime import datetime, timezone
import hashlib
import json
import re
import httpx
from ..models import RuleKind, RuleRecord, SourceClass, SourceRef
from ..text import html_to_text, compact

BASE = "https://www.gov.uk/api/content/foreign-travel-advice"
PUBLIC = "https://www.gov.uk/foreign-travel-advice"

class GovUkTravelAdvice:
    authority = "UK Foreign, Commonwealth & Development Office"

    def __init__(self, client: httpx.AsyncClient | None = None):
        self.client = client

    async def fetch(self, slug: str, destination_iso2: str) -> list[RuleRecord]:
        own = self.client is None
        client = self.client or httpx.AsyncClient(timeout=7.0, follow_redirects=True, headers={"user-agent":"CultureContext/0.1"})
        try:
            response = await client.get(f"{BASE}/{slug}")
            response.raise_for_status()
            payload = response.json()
        finally:
            if own: await client.aclose()

        retrieved = datetime.now(timezone.utc)
        raw = json.dumps(payload, sort_keys=True, ensure_ascii=False)
        content_hash = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        source = SourceRef(
            id=f"govuk:{slug}:{content_hash[:12]}",
            authority=self.authority,
            url=f"{PUBLIC}/{slug}",
            jurisdiction=destination_iso2.upper(),
            source_class=SourceClass.GOVERNMENT_ADVISORY,
            retrieved_at=retrieved,
            content_hash=content_hash,
        )

        parts = list(self._walk_parts(payload))
        rules: list[RuleRecord] = []
        selectors = [
            ("entry", ("entry requirements",), []),
            ("laws-customs", ("local laws", "laws and customs"), ["driving","medication","drone","filming","nightlife","hiking","climbing","surfing","camping"]),
            ("safety", ("safety and security", "safety"), []),
        ]
        for category, needles, tags in selectors:
            selected = [p for p in parts if any(n in p[0].lower() for n in needles)]
            if not selected: continue
            title, body = selected[0]
            text = compact(body)
            if not text: continue
            # FCDO advice is official government advice, but it is not primary destination law.
            rules.append(RuleRecord(
                id=f"govuk:{slug}:{category}:{content_hash[:10]}",
                jurisdiction=destination_iso2.upper(),
                category=category,
                kind=RuleKind.ADVISORY,
                title=title,
                summary=text,
                activity_tags=self._keyword_tags(text, tags),
                sources=[source],
            ))
        return rules

    def _walk_parts(self, node):
        if isinstance(node, dict):
            title = node.get("title") or node.get("heading")
            body = node.get("body") or node.get("content")
            if isinstance(title, str) and isinstance(body, str):
                yield title.strip(), html_to_text(body)
            for value in node.values():
                yield from self._walk_parts(value)
        elif isinstance(node, list):
            for value in node:
                yield from self._walk_parts(value)

    def _keyword_tags(self, text: str, allowed: list[str]) -> list[str]:
        lower = text.lower()
        synonyms = {
            "driving": ("driv", "licen", "road"),
            "medication": ("medicine", "medication", "prescription", "drug"),
            "drone": ("drone", "unmanned aircraft"),
            "filming": ("film", "photograph", "camera"),
            "nightlife": ("alcohol", "drink", "nightclub", "bar"),
            "hiking": ("hiking", "trek", "mountain"),
            "climbing": ("climb", "mountain"),
            "surfing": ("surf", "sea", "beach"),
            "camping": ("camp", "wild camping"),
        }
        return [tag for tag in allowed if any(token in lower for token in synonyms.get(tag, (tag,)))]
