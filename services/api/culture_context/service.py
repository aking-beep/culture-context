from __future__ import annotations

import os
from datetime import datetime, timezone

from .applicability import to_brief_item
from .destinations import currency_for, resolve_destination
from .explain import explain_items
from .models import (
    BriefItem,
    BriefResponse,
    ExplainResponse,
    SourceClass,
    SourceStatus,
    TravelerProfile,
)
from .sources import CountryMetadata, Frankfurter, Gdacs, GovUkTravelAdvice, ReliefWeb
from .store import persist_snapshot


def explain_enabled() -> bool:
    return os.getenv("CULTURE_EXPLAIN_ENABLED", "false").lower() in {"1", "true", "yes"}


def disruptions_enabled() -> bool:
    return os.getenv("CULTURE_DISRUPTIONS_ENABLED", "true").lower() in {"1", "true", "yes"}


class BriefService:
    def __init__(
        self,
        govuk: GovUkTravelAdvice | None = None,
        countries: CountryMetadata | None = None,
        frankfurter: Frankfurter | None = None,
        gdacs: Gdacs | None = None,
        reliefweb: ReliefWeb | None = None,
        persist: bool = True,
    ):
        self.govuk = govuk or GovUkTravelAdvice()
        self.countries = countries or CountryMetadata()
        self.frankfurter = frankfurter or Frankfurter()
        self.gdacs = gdacs or Gdacs()
        self.reliefweb = reliefweb or ReliefWeb()
        self.persist = persist

    async def build(self, traveler: TravelerProfile) -> BriefResponse:
        destination = resolve_destination(traveler.destination_country, traveler.destination_slug)
        warnings = [
            "Coverage is intentionally partial; absence of a card does not mean absence of a rule.",
            "Government travel advice is labeled as advisory and is not presented as the destination's primary law.",
            "This product does not approve visas or decide whether you can enter.",
        ]
        statuses: list[SourceStatus] = []
        rules = []

        govuk_rules, govuk_meta = await self._safe_fetch(
            "govuk",
            self.govuk.authority,
            SourceClass.GOVERNMENT_ADVISORY,
            lambda: self.govuk.fetch(traveler.destination_slug, traveler.destination_country),
            statuses,
            warnings,
        )
        rules.extend(govuk_rules)
        self._persist(govuk_meta)

        country_rules, country_meta = await self._safe_fetch(
            "iso-reference",
            self.countries.authority,
            SourceClass.REFERENCE_DATA,
            lambda: self.countries.fetch(traveler),
            statuses,
            warnings,
        )
        rules.extend(country_rules)
        self._persist(country_meta)

        home_cur = currency_for(traveler.residence_country or traveler.nationality)
        dest_cur = currency_for(traveler.destination_country)
        if home_cur and dest_cur and home_cur != dest_cur:
            fx_rules, fx_meta = await self._safe_fetch(
                "frankfurter",
                self.frankfurter.authority,
                SourceClass.REFERENCE_DATA,
                lambda: self.frankfurter.fetch(home_cur, dest_cur, traveler.destination_country),
                statuses,
                warnings,
            )
            rules.extend(fx_rules)
            self._persist(fx_meta)

        if disruptions_enabled():
            country_name = (destination.name if destination else traveler.destination_slug).title()
            iso3 = destination.iso3 if destination else traveler.destination_country
            gdacs_rules, gdacs_meta = await self._safe_fetch(
                "gdacs",
                self.gdacs.authority,
                SourceClass.INTERGOVERNMENTAL_ALERT,
                lambda: self.gdacs.fetch(country_name, traveler.destination_country),
                statuses,
                warnings,
            )
            rules.extend(gdacs_rules)
            self._persist(gdacs_meta)

            rw_rules, rw_meta = await self._safe_fetch(
                "reliefweb",
                self.reliefweb.authority,
                SourceClass.INTERGOVERNMENTAL_ALERT,
                lambda: self.reliefweb.fetch(iso3, traveler.destination_country),
                statuses,
                warnings,
            )
            rules.extend(rw_rules)
            self._persist(rw_meta)

        items: list[BriefItem] = []
        seen: set[str] = set()
        for rule in rules:
            item = to_brief_item(rule, traveler)
            if item is None or item.id in seen:
                continue
            seen.add(item.id)
            items.append(item)

        order = {"entry": 0, "laws-customs": 1, "safety": 2, "culture": 3, "disruption": 4, "context": 5}

        def rank(item: BriefItem) -> tuple:
            activity = 0 if any(r.startswith("activity:") for r in item.relevance) else 1
            return (order.get(item.category, 99), activity, item.title.lower())

        items.sort(key=rank)
        return BriefResponse(
            destination=traveler.destination_country,
            destination_name=destination.name if destination else None,
            warnings=warnings,
            source_statuses=statuses,
            explain_enabled=explain_enabled(),
            items=items,
        )

    def explain(self, items: list[BriefItem]) -> ExplainResponse:
        if not explain_enabled():
            raise PermissionError("Explanation is disabled")
        for item in items:
            if not item.sources:
                raise ValueError("every explained item must include a source")
        return explain_items(items)

    async def _safe_fetch(
        self,
        source_id: str,
        authority: str,
        source_class: SourceClass,
        fn,
        statuses: list[SourceStatus],
        warnings: list[str],
    ):
        try:
            rules, meta = await fn()
            statuses.append(
                SourceStatus(
                    id=source_id,
                    authority=authority,
                    source_class=source_class,
                    status="ok",
                    retrieved_at=meta.get("retrieved_at") or datetime.now(timezone.utc),
                )
            )
            return rules, meta
        except Exception as exc:
            statuses.append(
                SourceStatus(
                    id=source_id,
                    authority=authority,
                    source_class=source_class,
                    status="unavailable",
                    detail=type(exc).__name__,
                )
            )
            warnings.append(f"{authority} unavailable ({type(exc).__name__}). No replacement facts were invented.")
            return [], {}

    def _persist(self, meta: dict) -> None:
        if not self.persist or not meta:
            return
        try:
            persist_snapshot(
                source_id=str(meta["source_id"]),
                url=str(meta["url"]),
                normalized_text=str(meta.get("normalized_text") or ""),
                content_hash=str(meta["content_hash"]),
            )
        except Exception:
            # Snapshot persistence must not block a brief.
            return
