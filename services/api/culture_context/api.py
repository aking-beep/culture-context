from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .models import BriefResponse, TravelerProfile
from .service import BriefService

app = FastAPI(title="Culture Context API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3010", "http://127.0.0.1:3010", "http://localhost:3011", "http://127.0.0.1:3011"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["content-type"],
)
service = BriefService()

@app.get("/health")
def health():
    return {"ok": True, "service": "culture-context", "version": "0.1.0"}

@app.post("/v1/brief", response_model=BriefResponse)
async def brief(profile: TravelerProfile):
    return await service.build(profile)
