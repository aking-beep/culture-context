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
