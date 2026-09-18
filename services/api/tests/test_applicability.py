from datetime import datetime, timezone
from culture_context.applicability import relevance
from culture_context.models import RuleKind, RuleRecord, SourceClass, SourceRef, TravelerProfile

def source():
    return SourceRef(
        id="s1", authority="Test authority", url="https://example.com/rule", jurisdiction="JP",
        source_class=SourceClass.REGULATOR_GUIDANCE, retrieved_at=datetime.now(timezone.utc)
    )

def test_activity_specific_rule_requires_matching_activity():
    rule = RuleRecord(id="r1", jurisdiction="JP", category="activity", kind=RuleKind.RESTRICTION,
                      title="Drone rule", summary="test", activity_tags=["drone"], sources=[source()])
    traveler = TravelerProfile(nationality="US", destination_country="JP", destination_slug="japan", activities=["driving"])
    assert relevance(rule, traveler) is None
    traveler.activities.append("drone")
    assert "activity:drone" in relevance(rule, traveler)

def test_wrong_jurisdiction_never_applies():
    rule = RuleRecord(id="r2", jurisdiction="MX", category="entry", kind=RuleKind.ADVISORY,
                      title="Mexico", summary="test", sources=[source()])
    traveler = TravelerProfile(nationality="US", destination_country="JP", destination_slug="japan")
    assert relevance(rule, traveler) is None

def test_untagged_destination_rule_applies_without_activities():
    rule = RuleRecord(id="r3", jurisdiction="JP", category="entry", kind=RuleKind.ADVISORY,
                      title="Entry", summary="fixture", sources=[source()])
    traveler = TravelerProfile(nationality="US", destination_country="JP", destination_slug="japan")
    assert relevance(rule, traveler)[0] == "destination"
