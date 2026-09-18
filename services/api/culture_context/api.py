import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .destinations import ACTIVITIES, LAUNCH_DESTINATIONS
from .models import BriefResponse, ExplainRequest, ExplainResponse, TravelerProfile
from .service import BriefService, explain_enabled
from .source_registry import SOURCES
from .store import list_changes

DEFAULT_ORIGINS = [
    "http://localhost:3010",
    "http://127.0.0.1:3010",
    "http://localhost:3011",
    "http://127.0.0.1:3011",
]


def _cors_origins() -> list[str]:
    raw = os.getenv("CULTURE_CORS_ORIGINS")
    if not raw:
        return DEFAULT_ORIGINS
    return [item.strip() for item in raw.split(",") if item.strip()]


app = FastAPI(title="Culture Context API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["content-type"],
)
service = BriefService()


@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "culture-context",
        "version": "0.1.0",
        "explain_enabled": explain_enabled(),
    }


@app.get("/v1/destinations")
def destinations():
    return {
        "destinations": [item.model_dump() for item in LAUNCH_DESTINATIONS],
        "activities": ACTIVITIES,
        "purposes": ["tourism", "remote_work", "business", "study", "other"],
    }


@app.get("/v1/sources")
def sources():
    return {"sources": list(SOURCES.values())}


@app.get("/v1/changes")
def changes():
    return {"changes": [item.model_dump(mode="json") for item in list_changes()]}


@app.post("/v1/brief", response_model=BriefResponse)
async def brief(profile: TravelerProfile):
    return await service.build(profile)


@app.post("/v1/explain", response_model=ExplainResponse)
async def explain(payload: ExplainRequest):
    if not explain_enabled():
        raise HTTPException(status_code=404, detail="Explanation is disabled")
    try:
        return service.explain(payload.items)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
