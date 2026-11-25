from culture_context.destinations import WORLD_COUNTRIES, iso_row, resolve_destination


def test_world_catalog_covers_home_and_destination_countries():
    codes = {row["iso2"] for row in WORLD_COUNTRIES}
    for code in ("US", "NG", "BR", "IN", "CN", "PH", "JP", "IT", "AE", "GB", "MX", "KE"):
        assert code in codes
    assert len(WORLD_COUNTRIES) >= 180


def test_usa_uses_govuk_usa_slug():
    dest = resolve_destination("US", "united-states")
    assert dest is not None
    assert dest.name == "United States"
    assert dest.govuk_slug == "usa"
    assert dest.slug == "usa"


def test_nigeria_and_brazil_have_reference_facts():
    nigeria = resolve_destination("NG", "nigeria")
    brazil = resolve_destination("BR", "brazil")
    assert nigeria is not None and nigeria.name == "Nigeria"
    assert brazil is not None and brazil.name == "Brazil"
    assert iso_row("NG")["currency"] == "NGN"
    assert iso_row("BR")["currency"] == "BRL"
    assert iso_row("IN")["driving"] == "left"
    assert iso_row("US")["driving"] == "right"
