from .models import Destination

LAUNCH_DESTINATIONS: list[Destination] = [
    Destination(iso2="JP", iso3="JPN", slug="japan", name="Japan", city_hint="Tokyo", govuk_slug="japan"),
    Destination(iso2="MX", iso3="MEX", slug="mexico", name="Mexico", city_hint="Mexico City", govuk_slug="mexico"),
    Destination(iso2="FR", iso3="FRA", slug="france", name="France", city_hint="Paris", govuk_slug="france"),
    Destination(iso2="TH", iso3="THA", slug="thailand", name="Thailand", city_hint="Bangkok", govuk_slug="thailand"),
    Destination(iso2="MA", iso3="MAR", slug="morocco", name="Morocco", city_hint="Marrakesh", govuk_slug="morocco"),
]

BY_ISO2 = {d.iso2: d for d in LAUNCH_DESTINATIONS}
BY_SLUG = {d.slug: d for d in LAUNCH_DESTINATIONS}

# Compact ISO 3166 / ISO 4217 / driving-side reference. Not law and not culture.
ISO_REFERENCE: dict[str, dict[str, str | list[str]]] = {
    "JP": {"name": "Japan", "capital": "Tokyo", "currency": "JPY", "currency_name": "Japanese yen", "languages": ["Japanese"], "driving": "left"},
    "MX": {"name": "Mexico", "capital": "Mexico City", "currency": "MXN", "currency_name": "Mexican peso", "languages": ["Spanish"], "driving": "right"},
    "FR": {"name": "France", "capital": "Paris", "currency": "EUR", "currency_name": "Euro", "languages": ["French"], "driving": "right"},
    "TH": {"name": "Thailand", "capital": "Bangkok", "currency": "THB", "currency_name": "Thai baht", "languages": ["Thai"], "driving": "left"},
    "MA": {"name": "Morocco", "capital": "Rabat", "currency": "MAD", "currency_name": "Moroccan dirham", "languages": ["Arabic", "Berber"], "driving": "right"},
    "US": {"name": "United States", "capital": "Washington, D.C.", "currency": "USD", "currency_name": "United States dollar", "languages": ["English"], "driving": "right"},
    "GB": {"name": "United Kingdom", "capital": "London", "currency": "GBP", "currency_name": "Pound sterling", "languages": ["English"], "driving": "left"},
    "CA": {"name": "Canada", "capital": "Ottawa", "currency": "CAD", "currency_name": "Canadian dollar", "languages": ["English", "French"], "driving": "right"},
    "AU": {"name": "Australia", "capital": "Canberra", "currency": "AUD", "currency_name": "Australian dollar", "languages": ["English"], "driving": "left"},
    "DE": {"name": "Germany", "capital": "Berlin", "currency": "EUR", "currency_name": "Euro", "languages": ["German"], "driving": "right"},
    "IN": {"name": "India", "capital": "New Delhi", "currency": "INR", "currency_name": "Indian rupee", "languages": ["Hindi", "English"], "driving": "left"},
}

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


def resolve_destination(iso2: str, slug: str) -> Destination | None:
    named = BY_SLUG.get(slug)
    if named and named.iso2 == iso2.upper():
        return named
    return BY_ISO2.get(iso2.upper())


def iso_row(iso2: str | None) -> dict[str, str | list[str]] | None:
    if not iso2:
        return None
    return ISO_REFERENCE.get(iso2.upper())


def currency_for(iso2: str | None) -> str | None:
    row = iso_row(iso2)
    value = row.get("currency") if row else None
    return str(value) if value else None
