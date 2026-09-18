from __future__ import annotations
from .applicability import to_brief_item
from .models import BriefResponse, TravelerProfile
from .sources import GovUkTravelAdvice

class BriefService:
    def __init__(self, govuk: GovUkTravelAdvice | None = None):
        self.govuk = govuk or GovUkTravelAdvice()

    async def build(self, traveler: TravelerProfile) -> BriefResponse:
        warnings = [
            "Coverage is intentionally partial in the MVP; absence of a card does not mean absence of a rule.",
            "Government travel advice is labeled as advisory and is not presented as the destination's primary law.",
        ]
        rules = []
        try:
            rules.extend(await self.govuk.fetch(traveler.destination_slug, traveler.destination_country))
        except Exception as exc:
            # Failure degrades to an explicit unavailable state; never synthesize replacement facts.
            warnings.append(f"GOV.UK source unavailable: {type(exc).__name__}.")

        items = []
        for rule in rules:
            item = to_brief_item(rule, traveler)
            if item is not None:
                items.append(item)

        order = {"entry": 0, "laws-customs": 1, "safety": 2}
        items.sort(key=lambda x: (order.get(x.category, 99), x.title.lower()))
        return BriefResponse(
            destination=traveler.destination_country,
            warnings=warnings,
            items=items,
        )
