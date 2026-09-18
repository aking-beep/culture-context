from __future__ import annotations

from datetime import date, datetime, timezone
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl, field_validator, model_validator


class SourceClass(StrEnum):
    PRIMARY_LAW = "primary_law"
    REGULATOR_GUIDANCE = "regulator_guidance"
    GOVERNMENT_ADVISORY = "government_advisory"
    INTERGOVERNMENTAL_ALERT = "intergovernmental_alert"
    REFERENCE_DATA = "reference_data"
    COMMUNITY_CONTEXT = "community_context"


class RuleKind(StrEnum):
    LAW = "law"
    RESTRICTION = "restriction"
    ADVISORY = "advisory"
    CULTURAL_NORM = "cultural_norm"
    LOCAL_IMPACT = "local_impact"
    CONTEXT = "context"


class TravelerProfile(BaseModel):
    nationality: str = Field(min_length=2, max_length=2)
    residence_country: str | None = Field(default=None, min_length=2, max_length=2)
    destination_country: str = Field(min_length=2, max_length=2)
    destination_slug: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9-]+$")
    city: str | None = Field(default=None, max_length=120)
    start_date: date | None = None
    end_date: date | None = None
    purpose: Literal["tourism", "remote_work", "business", "study", "other"] = "tourism"
    activities: list[str] = Field(default_factory=list, max_length=30)

    @field_validator("nationality", "residence_country", "destination_country")
    @classmethod
    def upper_iso(cls, value: str | None):
        return value.upper() if value else value

    @field_validator("activities")
    @classmethod
    def normalize_activities(cls, value: list[str]) -> list[str]:
        seen: set[str] = set()
        out: list[str] = []
        for item in value:
            key = item.strip().lower()
            if key and key not in seen:
                seen.add(key)
                out.append(key)
        return out

    @model_validator(mode="after")
    def dates_in_order(self):
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class SourceRef(BaseModel):
    id: str
    authority: str
    url: HttpUrl
    jurisdiction: str
    source_class: SourceClass
    retrieved_at: datetime
    published_at: datetime | None = None
    updated_at: datetime | None = None
    content_hash: str | None = None


class SourceStatus(BaseModel):
    id: str
    authority: str
    source_class: SourceClass
    status: Literal["ok", "unavailable"]
    retrieved_at: datetime | None = None
    detail: str | None = None


class RuleRecord(BaseModel):
    id: str
    jurisdiction: str
    category: str
    kind: RuleKind
    title: str
    summary: str
    full_text: str | None = None
    activity_tags: list[str] = Field(default_factory=list)
    purpose_tags: list[str] = Field(default_factory=list)
    nationality_tags: list[str] = Field(default_factory=list)
    effective_from: date | None = None
    effective_to: date | None = None
    verification_status: Literal["unverified", "verified", "stale"] = "unverified"
    sources: list[SourceRef] = Field(min_length=1)


class BriefItem(BaseModel):
    id: str
    category: str
    kind: RuleKind
    title: str
    summary: str
    relevance: list[str]
    sources: list[SourceRef]


class BriefResponse(BaseModel):
    destination: str
    destination_name: str | None = None
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    coverage: Literal["partial", "expanded"] = "partial"
    warnings: list[str] = Field(default_factory=list)
    source_statuses: list[SourceStatus] = Field(default_factory=list)
    explain_enabled: bool = False
    disclaimer: str = (
        "Sourced travel information, not legal advice and not a visa or admission decision. "
        "Open the cited authority for high-consequence actions."
    )
    items: list[BriefItem] = Field(default_factory=list)


class Destination(BaseModel):
    iso2: str
    iso3: str
    slug: str
    name: str
    city_hint: str
    govuk_slug: str


class ChangeRecord(BaseModel):
    id: str
    source_id: str
    previous_hash: str | None = None
    current_hash: str
    detected_at: datetime
    materiality: Literal["unreviewed", "material", "not_material", "needs_source"] = "unreviewed"
    affected_rule_ids: list[str] = Field(default_factory=list)
    reviewed_at: datetime | None = None
    reviewed_by: str | None = None
    url: str | None = None


class ExplainRequest(BaseModel):
    items: list[BriefItem] = Field(min_length=1, max_length=20)


class Explanation(BaseModel):
    item_id: str
    label: Literal["explanation"] = "explanation"
    text: str
    based_on_source_ids: list[str]


class ExplainResponse(BaseModel):
    enabled: bool = True
    disclaimer: str = "Explanations restate supplied source records. They are not an additional authority."
    explanations: list[Explanation]
