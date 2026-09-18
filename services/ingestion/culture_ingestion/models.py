from pydantic import BaseModel, HttpUrl
class Snapshot(BaseModel):
    source_id: str
    url: HttpUrl
    retrieved_at: str
    content_hash: str
    normalized_text: str
    status: str = "ok"
