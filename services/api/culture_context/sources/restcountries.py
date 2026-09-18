from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json

import httpx

from ..models import RuleKind, RuleRecord, SourceClass, SourceRef, TravelerProfile
from ..text import compact

URL = "https://restcountries.com/v3.1/alpha/{code}"


class RestCountries:
    authority = "REST Countries"
    source_id = "restcountries"

    def __init__(self, client: httpx.AsyncClient | None = None):
        self.client = client

    async def fetch(self, traveler: TravelerProfile) -> tuple[list[RuleRecord], dict]:
        dest = await self._country(traveler.destination_country)
        home_code = traveler.residence_country or traveler.nationality
        home = None
        if home_code and home_code.upper() != traveler.destination_country.upper():
            home = await self._country(home_code)

        retrieved = datetime.now(timezone.utc)
        payload = {"destination": dest, "home": home}
        raw = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
        content_hash = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        source = SourceRef(
            id=f"restcountries:{traveler.destination_country}:{content_hash[:12]}",
            authority=self.authority,
            url="https://restcountries.com",
            jurisdiction=traveler.destination_country,
            source_class=SourceClass.REFERENCE_DATA,
            retrieved_at=retrieved,
            content_hash=content_hash,
        )
        dest_summary = _summarize(dest)
        rules = [
            RuleRecord(
                id=f"restcountries:{traveler.destination_country}:context:{content_hash[:10]}",
                jurisdiction=traveler.destination_country,
                category="context",
                kind=RuleKind.CONTEXT,
                title=f"Country reference: {_name(dest)}",
                summary=dest_summary,
                sources=[source],
            )
        ]
        if home:
            rules.append(
                RuleRecord(
                    id=f"restcountries:compare:{home_code}:{traveler.destination_country}:{content_hash[:10]}",
                    jurisdiction=traveler.destination_country,
                    category="context",
                    kind=RuleKind.CONTEXT,
                    title=f"Home vs destination: {_name(home)} and {_name(dest)}",
                    summary=_compare(home, dest),
                    sources=[source],
                )
            )
        meta = {
            "source_id": "restcountries",
            "url": "https://restcountries.com",
            "normalized_text": raw,
            "content_hash": content_hash,
            "retrieved_at": retrieved,
            "authority": self.authority,
            "destination": dest,
            "home": home,
        }
        return rules, meta

    async def _country(self, iso2: str) -> dict:
        own = self.client is None
        client = self.client or httpx.AsyncClient(
            timeout=6.0,
            follow_redirects=True,
            headers={"user-agent": "CultureContext/0.1"},
        )
        try:
            response = await client.get(
                URL.format(code=iso2.lower()),
                params={"fields": "name,cca2,cca3,currencies,languages,region,subregion,capital,idd,car"},
            )
            response.raise_for_status()
            payload = response.json()
        finally:
            if own:
                await client.aclose()
        if isinstance(payload, list):
            payload = payload[0]
        if not isinstance(payload, dict):
            raise ValueError("unexpected REST Countries payload")
        return payload


def _name(country: dict) -> str:
    name = country.get("name") or {}
    if isinstance(name, dict):
        return str(name.get("common") or name.get("official") or "Unknown")
    return str(name)


def _summarize(country: dict) -> str:
    languages = ", ".join((country.get("languages") or {}).values()) or "not listed"
    currencies = country.get("currencies") or {}
    currency = ", ".join(
        f"{meta.get('name', code)} ({code})" for code, meta in currencies.items()
    ) or "not listed"
    capital = ", ".join(country.get("capital") or []) or "not listed"
    region = " / ".join(x for x in [country.get("region"), country.get("subregion")] if x) or "not listed"
    side = ((country.get("car") or {}).get("side")) or "not listed"
    return compact(
        f"Reference data only. Common name: {_name(country)}. Capital: {capital}. "
        f"Region: {region}. Languages: {languages}. Currency: {currency}. "
        f"Driving side: {side}."
    )


def _compare(home: dict, dest: dict) -> str:
    home_cur = ", ".join((home.get("currencies") or {}).keys()) or "not listed"
    dest_cur = ", ".join((dest.get("currencies") or {}).keys()) or "not listed"
    home_lang = ", ".join((home.get("languages") or {}).values()) or "not listed"
    dest_lang = ", ".join((dest.get("languages") or {}).values()) or "not listed"
    home_side = (home.get("car") or {}).get("side") or "not listed"
    dest_side = (dest.get("car") or {}).get("side") or "not listed"
    bits = [
        f"This comparison uses public country reference data only and does not describe culture or law.",
        f"Currency: {home_cur} at home vs {dest_cur} at destination.",
        f"Listed languages: {home_lang} vs {dest_lang}.",
        f"Driving side: {home_side} vs {dest_side}.",
    ]
    return compact(" ".join(bits))
