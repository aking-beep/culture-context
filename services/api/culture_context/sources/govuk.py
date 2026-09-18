from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json

import httpx

from ..models import RuleKind, RuleRecord, SourceClass, SourceRef
from ..text import compact, excerpt_around, html_to_text, split_headings

BASE = "https://www.gov.uk/api/content/foreign-travel-advice"
PUBLIC = "https://www.gov.uk/foreign-travel-advice"

ACTIVITY_SYNONYMS: dict[str, tuple[str, ...]] = {
    "driving": ("driving", "licence", "license", "road travel", "international driving"),
    "medication": ("medicine", "medication", "prescription", "pseudoephedrine", "codeine"),
    "drone": ("drone", "unmanned aircraft"),
    "filming": ("film", "photograph", "camera", "photography"),
    "nightlife": ("alcohol", "drink spiking", "nightclub", "bar bills", "entertainment district"),
    "hiking": ("hiking", "trek", "mountain", "bear sightings", "wildlife"),
    "climbing": ("climb", "mountain"),
    "surfing": ("surf", "sea", "beach"),
    "camping": ("camp", "wild camping"),
}

CULTURE_NEEDLES = (
    "public behaviour",
    "public behavior",
    "tattoos",
    "lgbt",
    "cultural differences",
    "local customs",
    "showing affection",
    "etiquette",
)

LAWS_NEEDLES = (
    "illegal drugs",
    "medication bans",
    "personal id",
    "carry your passport",
    "alcohol bans",
    "smoking is illegal",
    "zero tolerance",
)


class GovUkTravelAdvice:
    authority = "UK Foreign, Commonwealth & Development Office"
    source_id = "govuk"

    def __init__(self, client: httpx.AsyncClient | None = None):
        self.client = client

    async def fetch(self, slug: str, destination_iso2: str) -> tuple[list[RuleRecord], dict]:
        own = self.client is None
        client = self.client or httpx.AsyncClient(
            timeout=7.0,
            follow_redirects=True,
            headers={"user-agent": "CultureContext/0.1"},
        )
        try:
            response = await client.get(f"{BASE}/{slug}")
            response.raise_for_status()
            payload = response.json()
        finally:
            if own:
                await client.aclose()

        retrieved = datetime.now(timezone.utc)
        raw = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
        content_hash = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        published = _parse_dt(payload.get("public_updated_at") or payload.get("updated_at"))
        source = SourceRef(
            id=f"govuk:{slug}:{content_hash[:12]}",
            authority=self.authority,
            url=f"{PUBLIC}/{slug}",
            jurisdiction=destination_iso2.upper(),
            source_class=SourceClass.GOVERNMENT_ADVISORY,
            retrieved_at=retrieved,
            published_at=published,
            updated_at=published,
            content_hash=content_hash,
        )

        parts = _parts(payload)
        rules: list[RuleRecord] = []
        for title, body_html in parts:
            category = _category_for(title)
            text = html_to_text(body_html)
            if not text:
                continue
            rules.append(
                RuleRecord(
                    id=f"govuk:{slug}:{category}:{_slugify(title)}:{content_hash[:10]}",
                    jurisdiction=destination_iso2.upper(),
                    category=category,
                    kind=RuleKind.ADVISORY,
                    title=title,
                    summary=compact(text),
                    full_text=compact(text, 4000),
                    sources=[source],
                )
            )
            rules.extend(
                _derived_cards(slug, destination_iso2, source, content_hash, title, body_html, text)
            )

        meta = {
            "source_id": f"govuk:{slug}",
            "url": f"{PUBLIC}/{slug}",
            "normalized_text": raw,
            "content_hash": content_hash,
            "retrieved_at": retrieved,
            "authority": self.authority,
        }
        return rules, meta


def _parts(payload: dict) -> list[tuple[str, str]]:
    details = payload.get("details") or {}
    parts = details.get("parts") or []
    out: list[tuple[str, str]] = []
    if isinstance(parts, list):
        for part in parts:
            if not isinstance(part, dict):
                continue
            title = part.get("title")
            body = part.get("body")
            if isinstance(title, str) and isinstance(body, str) and title.strip() and body.strip():
                out.append((title.strip(), body))
    if out:
        return out
    # Fallback for flatter test fixtures
    title = payload.get("title")
    body = payload.get("body")
    if isinstance(title, str) and isinstance(body, str):
        return [(title, body)]
    return []


def _category_for(title: str) -> str:
    lower = title.lower()
    if any(n in lower for n in ("entry", "visa", "passport")):
        return "entry"
    if any(n in lower for n in ("local law", "laws and customs", "customs")):
        return "laws-customs"
    if any(n in lower for n in ("health", "medication")):
        return "safety"
    if any(n in lower for n in ("getting help", "money", "insurance")):
        return "context" if "help" in lower else "safety"
    if any(n in lower for n in ("safety", "security", "warning", "regional", "terror")):
        return "safety"
    if any(n in lower for n in ("culture", "custom", "behaviour", "behavior", "tattoo")):
        return "culture"
    return "context"


def _derived_cards(
    slug: str,
    iso2: str,
    source: SourceRef,
    content_hash: str,
    part_title: str,
    body_html: str,
    text: str,
) -> list[RuleRecord]:
    extra: list[RuleRecord] = []
    culture = excerpt_around(text, CULTURE_NEEDLES)
    if culture:
        extra.append(
            RuleRecord(
                id=f"govuk:{slug}:culture:{content_hash[:10]}",
                jurisdiction=iso2.upper(),
                category="culture",
                kind=RuleKind.CULTURAL_NORM,
                title=f"Cultural context from {part_title}",
                summary=culture,
                sources=[source],
            )
        )
    laws = excerpt_around(text, LAWS_NEEDLES)
    if laws:
        extra.append(
            RuleRecord(
                id=f"govuk:{slug}:laws-excerpt:{content_hash[:10]}",
                jurisdiction=iso2.upper(),
                category="laws-customs",
                kind=RuleKind.ADVISORY,
                title=f"Laws and restrictions noted in {part_title}",
                summary=laws,
                sources=[source],
            )
        )
    for tag, needles in ACTIVITY_SYNONYMS.items():
        excerpt = excerpt_around(text, needles)
        if not excerpt:
            continue
        extra.append(
            RuleRecord(
                id=f"govuk:{slug}:activity:{tag}:{content_hash[:10]}",
                jurisdiction=iso2.upper(),
                category="laws-customs" if tag in {"driving", "medication", "drone", "filming"} else "safety",
                kind=RuleKind.ADVISORY,
                title=f"{tag.replace('_', ' ').title()} notes from {part_title}",
                summary=excerpt,
                activity_tags=[tag],
                sources=[source],
            )
        )
    # Heading-level culture/law slices when GOV.UK uses h2/h3
    for heading, body in split_headings(body_html):
        lower = heading.lower()
        if any(n in lower for n in CULTURE_NEEDLES):
            extra.append(
                RuleRecord(
                    id=f"govuk:{slug}:heading:{_slugify(heading)}:{content_hash[:10]}",
                    jurisdiction=iso2.upper(),
                    category="culture",
                    kind=RuleKind.CULTURAL_NORM,
                    title=heading,
                    summary=compact(body),
                    sources=[source],
                )
            )
    return extra


def _slugify(value: str) -> str:
    return "".join(ch.lower() if ch.isalnum() else "-" for ch in value).strip("-")[:40] or "section"


def _parse_dt(value: object) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError:
        return None
