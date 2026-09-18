from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json

import httpx

from ..destinations import iso_row
from ..models import RuleKind, RuleRecord, SourceClass, SourceRef, TravelerProfile
from ..text import compact

WORLD_BANK = "https://api.worldbank.org/v2/country/{code}"
ISO_URL = "https://www.iso.org/iso-3166-country-codes.html"


class CountryMetadata:
    """ISO reference table plus optional World Bank country metadata. Never law."""

    authority = "ISO 3166 / ISO 4217 reference table"
    source_id = "iso-reference"

    def __init__(self, client: httpx.AsyncClient | None = None):
        self.client = client

    async def fetch(self, traveler: TravelerProfile) -> tuple[list[RuleRecord], dict]:
        dest = iso_row(traveler.destination_country)
        if not dest:
            raise ValueError("no local ISO reference for destination")
        home_code = traveler.residence_country or traveler.nationality
        home = iso_row(home_code) if home_code and home_code.upper() != traveler.destination_country.upper() else None
        retrieved = datetime.now(timezone.utc)
        wb_dest = await self._worldbank(traveler.destination_country)
        payload = {"destination": dest, "home": home, "worldbank": wb_dest}
        raw = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"), default=str)
        content_hash = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        iso_source = SourceRef(
            id=f"iso:{traveler.destination_country}:{content_hash[:12]}",
            authority=self.authority,
            url=ISO_URL,
            jurisdiction=traveler.destination_country,
            source_class=SourceClass.REFERENCE_DATA,
            retrieved_at=retrieved,
            content_hash=content_hash,
        )
        sources = [iso_source]
        if wb_dest:
            sources.append(
                SourceRef(
                    id=f"worldbank:{traveler.destination_country}:{content_hash[:12]}",
                    authority="World Bank country API",
                    url=WORLD_BANK.format(code=traveler.destination_country.lower()),
                    jurisdiction=traveler.destination_country,
                    source_class=SourceClass.REFERENCE_DATA,
                    retrieved_at=retrieved,
                    content_hash=content_hash,
                )
            )
        summary = _summarize(dest, wb_dest)
        rules = [
            RuleRecord(
                id=f"iso:{traveler.destination_country}:context:{content_hash[:10]}",
                jurisdiction=traveler.destination_country,
                category="context",
                kind=RuleKind.CONTEXT,
                title=f"Country reference: {dest['name']}",
                summary=summary,
                sources=sources,
            )
        ]
        if home:
            rules.append(
                RuleRecord(
                    id=f"iso:compare:{home_code}:{traveler.destination_country}:{content_hash[:10]}",
                    jurisdiction=traveler.destination_country,
                    category="context",
                    kind=RuleKind.CONTEXT,
                    title=f"Home vs destination: {home['name']} and {dest['name']}",
                    summary=_compare(home, dest),
                    sources=[iso_source],
                )
            )
        meta = {
            "source_id": "iso-reference",
            "url": ISO_URL,
            "normalized_text": raw,
            "content_hash": content_hash,
            "retrieved_at": retrieved,
            "authority": self.authority,
            "destination": dest,
            "home": home,
        }
        return rules, meta

    async def _worldbank(self, iso2: str) -> dict | None:
        own = self.client is None
        client = self.client or httpx.AsyncClient(
            timeout=6.0,
            follow_redirects=True,
            headers={"user-agent": "CultureContext/0.1"},
        )
        try:
            response = await client.get(WORLD_BANK.format(code=iso2.lower()), params={"format": "json"})
            response.raise_for_status()
            payload = response.json()
        except Exception:
            return None
        finally:
            if own:
                await client.aclose()
        rows = payload[1] if isinstance(payload, list) and len(payload) > 1 else None
        if not isinstance(rows, list) or not rows or not isinstance(rows[0], dict):
            return None
        return rows[0]


def _summarize(row: dict, worldbank: dict | None) -> str:
    languages = ", ".join(row.get("languages") or []) or "not listed"
    bits = [
        "Reference data only, not law.",
        f"Common name: {row.get('name')}.",
        f"Capital: {row.get('capital')}.",
        f"Languages: {languages}.",
        f"Currency: {row.get('currency_name')} ({row.get('currency')}).",
        f"Driving side: {row.get('driving')}.",
    ]
    if worldbank:
        region = ((worldbank.get("region") or {}).get("value")) if isinstance(worldbank.get("region"), dict) else None
        wb_capital = worldbank.get("capitalCity")
        if region:
            bits.append(f"World Bank region: {region}.")
        if wb_capital:
            bits.append(f"World Bank capital: {wb_capital}.")
    return compact(" ".join(bits))


def _compare(home: dict, dest: dict) -> str:
    return compact(
        "This comparison uses ISO country/currency reference data only and does not describe culture or law. "
        f"Currency: {home.get('currency')} at home vs {dest.get('currency')} at destination. "
        f"Listed languages: {', '.join(home.get('languages') or [])} vs {', '.join(dest.get('languages') or [])}. "
        f"Driving side: {home.get('driving')} vs {dest.get('driving')}."
    )
