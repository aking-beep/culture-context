from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json

import httpx

from ..models import RuleKind, RuleRecord, SourceClass, SourceRef
from ..text import compact, html_to_text

GDACS_URL = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH"
RELIEFWEB_URL = "https://api.reliefweb.int/v2/disasters"


class Gdacs:
    authority = "Global Disaster Alert and Coordination System"
    source_id = "gdacs"

    def __init__(self, client: httpx.AsyncClient | None = None):
        self.client = client

    async def fetch(self, country_name: str, iso2: str) -> tuple[list[RuleRecord], dict]:
        own = self.client is None
        client = self.client or httpx.AsyncClient(
            timeout=6.0,
            follow_redirects=True,
            headers={"user-agent": "CultureContext/0.1"},
        )
        try:
            response = await client.get(GDACS_URL, params={"eventlist": "EQ,TC,FL,VO,DR", "country": country_name})
            response.raise_for_status()
            payload = response.json()
        finally:
            if own:
                await client.aclose()

        retrieved = datetime.now(timezone.utc)
        raw = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"), default=str)
        content_hash = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        source = SourceRef(
            id=f"gdacs:{iso2}:{content_hash[:12]}",
            authority=self.authority,
            url="https://www.gdacs.org",
            jurisdiction=iso2,
            source_class=SourceClass.INTERGOVERNMENTAL_ALERT,
            retrieved_at=retrieved,
            content_hash=content_hash,
        )
        features = payload.get("features") if isinstance(payload, dict) else None
        events = features if isinstance(features, list) else payload if isinstance(payload, list) else []
        rules: list[RuleRecord] = []
        for event in events[:8]:
            props = event.get("properties") if isinstance(event, dict) else {}
            if not isinstance(props, dict):
                props = event if isinstance(event, dict) else {}
            title = str(props.get("name") or props.get("eventtype") or props.get("title") or "GDACS alert")
            description = str(props.get("description") or props.get("htmldescription") or title)
            where = " ".join(
                str(props.get(key) or "")
                for key in ("country", "iso3", "iso2", "affectedcountries", "fromcountry", "tocountry")
            )
            haystack = f"{title} {description} {where}".lower()
            if country_name.lower() not in haystack and iso2.lower() not in haystack:
                continue
            event_id = str(props.get("eventid") or props.get("eventid", "event"))
            rules.append(
                RuleRecord(
                    id=f"gdacs:{iso2}:{event_id}:{content_hash[:10]}",
                    jurisdiction=iso2,
                    category="disruption",
                    kind=RuleKind.LOCAL_IMPACT,
                    title=f"Alert: {html_to_text(title)}",
                    summary=compact(
                        "Intergovernmental disaster alert, not destination law. " + html_to_text(description)
                    ),
                    sources=[source],
                )
            )
            if len(rules) >= 2:
                break
        meta = {
            "source_id": "gdacs",
            "url": "https://www.gdacs.org",
            "normalized_text": raw,
            "content_hash": content_hash,
            "retrieved_at": retrieved,
            "authority": self.authority,
        }
        return rules, meta


class ReliefWeb:
    authority = "UN OCHA ReliefWeb"
    source_id = "reliefweb"

    def __init__(self, client: httpx.AsyncClient | None = None):
        self.client = client

    async def fetch(self, iso3: str, iso2: str) -> tuple[list[RuleRecord], dict]:
        own = self.client is None
        client = self.client or httpx.AsyncClient(
            timeout=6.0,
            follow_redirects=True,
            headers={"user-agent": "CultureContext/0.1"},
        )
        body = {
            "appname": "culture-context",
            "profile": "list",
            "limit": 2,
            "filter": {"field": "country.iso3", "value": iso3},
            "fields": {"include": ["name", "status", "url", "homepage", "description", "date"]},
        }
        try:
            response = await client.post(RELIEFWEB_URL, json=body)
            response.raise_for_status()
            payload = response.json()
        finally:
            if own:
                await client.aclose()

        retrieved = datetime.now(timezone.utc)
        raw = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"), default=str)
        content_hash = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        source = SourceRef(
            id=f"reliefweb:{iso2}:{content_hash[:12]}",
            authority=self.authority,
            url="https://reliefweb.int",
            jurisdiction=iso2,
            source_class=SourceClass.INTERGOVERNMENTAL_ALERT,
            retrieved_at=retrieved,
            content_hash=content_hash,
        )
        rules: list[RuleRecord] = []
        for entry in (payload.get("data") or [])[:2]:
            fields = (entry or {}).get("fields") or {}
            title = str(fields.get("name") or "ReliefWeb disaster")
            status = str(fields.get("status") or "unknown")
            url = fields.get("url") or fields.get("homepage") or "https://reliefweb.int"
            if isinstance(url, dict):
                url = url.get("html") or "https://reliefweb.int"
            item_source = source.model_copy(update={"url": str(url)})
            rules.append(
                RuleRecord(
                    id=f"reliefweb:{iso2}:{entry.get('id', content_hash[:8])}",
                    jurisdiction=iso2,
                    category="disruption",
                    kind=RuleKind.LOCAL_IMPACT,
                    title=f"Humanitarian context: {title}",
                    summary=compact(
                        f"ReliefWeb lists this as status '{status}'. "
                        "This is intergovernmental humanitarian context, not destination law."
                    ),
                    sources=[item_source],
                )
            )
        meta = {
            "source_id": "reliefweb",
            "url": "https://reliefweb.int",
            "normalized_text": raw,
            "content_hash": content_hash,
            "retrieved_at": retrieved,
            "authority": self.authority,
        }
        return rules, meta
