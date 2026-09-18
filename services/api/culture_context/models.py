from __future__ import annotations
from datetime import datetime, timezone
from enum import StrEnum
from typing import Literal
from pydantic import BaseModel, Field, HttpUrl, field_validator

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
    purpose: Literal["tourism", "remote_work", "business", "study", "other"] = "tourism"
    activities: list[str] = Field(default_factory=list, max_length=30)

    @field_validator("nationality", "residence_country", "destination_country")
    @classmethod
    def upper_iso(cls, value: str | None):
        return value.upper() if value else value

class SourceRef(BaseModel):
    id: str
    authority: str
    url: HttpUrl
    jurisdiction: str
    source_class: SourceClass
    retrieved_at: datetime
    content_hash: str | None = None

class RuleRecord(BaseModel):
    id: str
    jurisdiction: str
    category: str
    kind: RuleKind
    title: str
    summary: str
    activity_tags: list[str] = Field(default_factory=list)
    purpose_tags: list[str] = Field(default_factory=list)
    nationality_tags: list[str] = Field(default_factory=list)
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
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    coverage: Literal["partial", "expanded"] = "partial"
    warnings: list[str] = Field(default_factory=list)
    items: list[BriefItem] = Field(default_factory=list)
