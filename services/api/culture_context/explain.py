from .models import BriefItem, Explanation, ExplainResponse


def explain_items(items: list[BriefItem]) -> ExplainResponse:
    """Deterministic restatement of supplied records. Does not add facts."""
    explanations: list[Explanation] = []
    for item in items:
        source = item.sources[0]
        retrieved = source.retrieved_at.strftime("%Y-%m-%d %H:%M UTC")
        text = (
            f"This is an explanation of a sourced {item.kind.value} card, not a new rule. "
            f"{source.authority} is classified as {source.source_class.value} for {source.jurisdiction}. "
            f"Retrieved {retrieved}. Canonical source: {source.url}. "
            f"Recorded summary: {item.summary}"
        )
        explanations.append(
            Explanation(
                item_id=item.id,
                text=text,
                based_on_source_ids=[s.id for s in item.sources],
            )
        )
    return ExplainResponse(explanations=explanations)
