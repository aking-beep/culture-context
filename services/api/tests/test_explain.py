import pytest
from culture_context.explain import explain_items
from culture_context.models import BriefItem, RuleKind, SourceClass, SourceRef
from culture_context.service import BriefService
from datetime import datetime, timezone

def _item():
    return BriefItem(
        id="i1",
        category="entry",
        kind=RuleKind.ADVISORY,
        title="Fixture",
        summary="Fixture summary from a source.",
        relevance=["destination"],
        sources=[
            SourceRef(
                id="s1",
                authority="Test authority",
                url="https://example.com/source",
                jurisdiction="JP",
                source_class=SourceClass.GOVERNMENT_ADVISORY,
                retrieved_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
            )
        ],
    )

def test_template_explanation_restates_source_only():
    result = explain_items([_item()])
    text = result.explanations[0].text
    assert "Test authority" in text
    assert "government_advisory" in text
    assert "https://example.com/source" in text
    assert result.explanations[0].label == "explanation"

def test_explain_disabled_by_default(monkeypatch):
    monkeypatch.delenv("CULTURE_EXPLAIN_ENABLED", raising=False)
    service = BriefService(persist=False)
    with pytest.raises(PermissionError):
        service.explain([_item()])
