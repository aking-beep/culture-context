import json
from datetime import datetime, timezone

import httpx
import pytest

from culture_context.models import RuleKind, SourceClass, TravelerProfile
from culture_context.service import BriefService
from culture_context.sources.govuk import GovUkTravelAdvice
from culture_context.text import html_to_text

FIXTURE = {
    "title": "Fixture destination travel advice",
    "public_updated_at": "2026-01-01T00:00:00Z",
    "details": {
        "parts": [
            {
                "title": "Entry requirements",
                "body": "<p>Fixture entry section. Passport validity is discussed. This is not a real rule.</p>",
            },
            {
                "title": "Safety and security",
                "body": "<h2>Public behaviour</h2><p>Fixture cultural note about reserved public behaviour.</p><h2>Illegal drugs</h2><p>Fixture mention of illegal drugs and drone restrictions for tests.</p>",
            },
            {
                "title": "Health",
                "body": "<p>Fixture health section mentions medication and prescription checks.</p>",
            },
        ]
    },
}


def _profile(**overrides):
    data = dict(
        nationality="US",
        destination_country="JP",
        destination_slug="japan",
        purpose="tourism",
        activities=["drone", "medication"],
    )
    data.update(overrides)
    return TravelerProfile(**data)


def _client_for(payload, status_code=200):
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code, json=payload if status_code < 400 else {"error": "no"})
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


@pytest.mark.asyncio
async def test_govuk_records_remain_advisory(tmp_path, monkeypatch):
    monkeypatch.setenv("CULTURE_SNAPSHOT_DIR", str(tmp_path / "snap"))
    monkeypatch.setenv("CULTURE_CHANGE_DIR", str(tmp_path / "chg"))
    monkeypatch.setenv("CULTURE_DISRUPTIONS_ENABLED", "false")
    govuk = GovUkTravelAdvice(client=_client_for(FIXTURE))
    service = BriefService(govuk=govuk, persist=False)

    async def boom(*_a, **_k):
        raise RuntimeError("skip")

    service.countries.fetch = boom  # type: ignore[method-assign]
    brief = await service.build(_profile())
    govuk_items = [i for i in brief.items if i.sources and i.sources[0].authority.startswith("UK Foreign")]
    assert govuk_items
    assert all(item.kind in {RuleKind.ADVISORY, RuleKind.CULTURAL_NORM} for item in govuk_items)
    assert all(
        source.source_class == SourceClass.GOVERNMENT_ADVISORY
        for item in govuk_items
        for source in item.sources
    )
    assert all(item.kind != RuleKind.LAW for item in govuk_items)


@pytest.mark.asyncio
async def test_unavailable_source_does_not_invent_facts(tmp_path, monkeypatch):
    monkeypatch.setenv("CULTURE_DISRUPTIONS_ENABLED", "false")
    failing = httpx.AsyncClient(
        transport=httpx.MockTransport(lambda r: httpx.Response(503, json={"error": "down"}))
    )
    service = BriefService(
        govuk=GovUkTravelAdvice(client=failing),
        persist=False,
    )

    async def boom(*_a, **_k):
        raise RuntimeError("skip")

    service.countries.fetch = boom  # type: ignore[method-assign]
    service.frankfurter.fetch = boom  # type: ignore[method-assign]
    brief = await service.build(_profile())
    assert brief.items == []
    assert any(status.status == "unavailable" for status in brief.source_statuses)
    assert any("unavailable" in warning.lower() for warning in brief.warnings)
    blob = json.dumps(brief.model_dump(mode="json")).lower()
    for banned in ("fine", "penalty", "illegal", "required"):
        assert banned not in blob


@pytest.mark.asyncio
async def test_every_item_has_a_source():
    govuk = GovUkTravelAdvice(client=_client_for(FIXTURE))
    service = BriefService(govuk=govuk, persist=False)

    async def boom(*_a, **_k):
        raise RuntimeError("skip")

    service.countries.fetch = boom  # type: ignore[method-assign]
    brief = await service.build(_profile())
    assert brief.items
    assert all(item.sources for item in brief.items)


def test_html_strips_scripts():
    text = html_to_text("<p>Safe</p><script>document.cookie</script><style>x{}</style>")
    assert "Safe" in text
    assert "cookie" not in text


@pytest.mark.asyncio
async def test_iso_reference_survives_worldbank_failure():
    from culture_context.sources.restcountries import CountryMetadata
    failing = httpx.AsyncClient(transport=httpx.MockTransport(lambda r: httpx.Response(503)))
    rules, _meta = await CountryMetadata(client=failing).fetch(_profile())
    assert rules
    assert all(rule.kind == RuleKind.CONTEXT for rule in rules)
    assert all(source.source_class == SourceClass.REFERENCE_DATA for rule in rules for source in rule.sources)
    assert "Japanese yen" in rules[0].summary


def test_end_date_cannot_precede_start_date():
    with pytest.raises(Exception):
        TravelerProfile(
            nationality="US",
            destination_country="JP",
            destination_slug="japan",
            start_date="2026-09-20",
            end_date="2026-09-01",
        )
