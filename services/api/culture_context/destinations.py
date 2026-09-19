from __future__ import annotations

import json
from pathlib import Path

from .models import Destination

ACTIVITIES = [
    "driving",
    "medication",
    "drone",
    "filming",
    "nightlife",
    "hiking",
    "climbing",
    "surfing",
    "camping",
]

FEATURED_ISO2 = ("JP", "IT", "ES", "MX", "TH", "US", "FR", "AE")


def _catalog_path() -> Path:
    here = Path(__file__).resolve()
    candidates = [
        here.parents[3] / "data" / "world-countries.json",
        here.parent / "data" / "world-countries.json",
        Path.cwd() / "data" / "world-countries.json",
    ]
    for path in candidates:
        if path.is_file():
            return path
    raise FileNotFoundError("world-countries.json is missing")


def _load() -> list[dict]:
    return json.loads(_catalog_path().read_text(encoding="utf-8"))


WORLD_COUNTRIES: list[dict] = _load()
BY_ISO2 = {row["iso2"].upper(): row for row in WORLD_COUNTRIES}
BY_SLUG = {row["slug"]: row for row in WORLD_COUNTRIES if row.get("slug")}


def _to_destination(row: dict) -> Destination:
    return Destination(
        iso2=row["iso2"],
        iso3=row.get("iso3") or row["iso2"],
        slug=row["slug"],
        name=row["name"],
        city_hint=row.get("capital") or row["name"],
        govuk_slug=row.get("govuk_slug") or "",
    )


ALL_DESTINATIONS: list[Destination] = [_to_destination(row) for row in WORLD_COUNTRIES]
LAUNCH_DESTINATIONS: list[Destination] = [
    dest for code in FEATURED_ISO2 if (dest := next((item for item in ALL_DESTINATIONS if item.iso2 == code), None))
]


def resolve_destination(iso2: str, slug: str) -> Destination | None:
    row = BY_ISO2.get((iso2 or "").upper()) or BY_SLUG.get(slug)
    return _to_destination(row) if row else None


def iso_row(iso2: str | None) -> dict[str, str | list[str]] | None:
    if not iso2:
        return None
    row = BY_ISO2.get(iso2.upper())
    if not row:
        return None
    return {
        "name": row.get("name") or iso2,
        "capital": row.get("capital") or "",
        "currency": row.get("currency") or "",
        "currency_name": row.get("currency_name") or "",
        "languages": row.get("languages") or [],
        "driving": row.get("driving") or "right",
    }


def currency_for(iso2: str | None) -> str | None:
    row = iso_row(iso2)
    value = row.get("currency") if row else None
    if not value:
        return None
    return str(value)
