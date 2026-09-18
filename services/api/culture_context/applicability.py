from .models import BriefItem, RuleRecord, TravelerProfile

def relevance(rule: RuleRecord, traveler: TravelerProfile) -> list[str] | None:
    """Return deterministic relevance reasons, or None when the record does not apply."""
    if rule.jurisdiction.upper() not in {traveler.destination_country.upper(), "GLOBAL"}:
        return None

    reasons: list[str] = []
    activities = {x.lower() for x in traveler.activities}

    if rule.activity_tags:
        hits = activities.intersection(x.lower() for x in rule.activity_tags)
        if not hits:
            return None
        reasons.extend(f"activity:{x}" for x in sorted(hits))

    if rule.purpose_tags:
        if traveler.purpose not in rule.purpose_tags:
            return None
        reasons.append(f"purpose:{traveler.purpose}")

    if rule.nationality_tags:
        if traveler.nationality.upper() not in {x.upper() for x in rule.nationality_tags}:
            return None
        reasons.append(f"nationality:{traveler.nationality.upper()}")

    if not reasons:
        reasons.append("destination")
    return reasons

def to_brief_item(rule: RuleRecord, traveler: TravelerProfile) -> BriefItem | None:
    reasons = relevance(rule, traveler)
    if reasons is None:
        return None
    return BriefItem(
        id=rule.id,
        category=rule.category,
        kind=rule.kind,
        title=rule.title,
        summary=rule.summary,
        relevance=reasons,
        sources=rule.sources,
    )
