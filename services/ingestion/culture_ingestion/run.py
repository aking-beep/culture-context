from __future__ import annotations
import asyncio, hashlib, json, os
from datetime import datetime, timezone
from pathlib import Path
import httpx
from .models import Snapshot

BASE = "https://www.gov.uk/api/content/foreign-travel-advice"

def stable_text(payload: object) -> str:
    return json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))

async def fetch_govuk(slug: str) -> Snapshot:
    async with httpx.AsyncClient(timeout=8.0, follow_redirects=True, headers={"user-agent":"CultureContextIngestion/0.1"}) as client:
        response = await client.get(f"{BASE}/{slug}")
        response.raise_for_status()
        text = stable_text(response.json())
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    return Snapshot(source_id=f"govuk:{slug}", url=f"https://www.gov.uk/foreign-travel-advice/{slug}", retrieved_at=datetime.now(timezone.utc).isoformat(), content_hash=digest, normalized_text=text)

async def main() -> None:
    slug = os.getenv("CULTURE_INGEST_SLUG", "japan")
    snapshot = await fetch_govuk(slug)
    target = Path("snapshots") / f"govuk-{slug}.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(snapshot.model_dump_json(indent=2), encoding="utf-8")
    print(target)

if __name__ == "__main__": asyncio.run(main())
