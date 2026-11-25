from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path

from .change import Snapshot, changed
from .models import ChangeRecord


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def snapshot_dir() -> Path:
    raw = os.getenv("CULTURE_SNAPSHOT_DIR")
    path = Path(raw) if raw else _repo_root() / "data" / "snapshots"
    path.mkdir(parents=True, exist_ok=True)
    return path


def change_dir() -> Path:
    raw = os.getenv("CULTURE_CHANGE_DIR")
    path = Path(raw) if raw else _repo_root() / "data" / "changes"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _safe_id(source_id: str) -> str:
    return "".join(ch if ch.isalnum() or ch in "-_." else "_" for ch in source_id)


def load_latest(source_id: str) -> Snapshot | None:
    latest = snapshot_dir() / _safe_id(source_id) / "latest.json"
    if not latest.exists():
        return None
    payload = json.loads(latest.read_text(encoding="utf-8"))
    return Snapshot(
        source_id=payload["source_id"],
        normalized_text=payload.get("normalized_text", ""),
        content_hash=payload["content_hash"],
    )


def persist_snapshot(
    source_id: str,
    url: str,
    normalized_text: str,
    content_hash: str,
    status: str = "ok",
) -> ChangeRecord | None:
    """Write a snapshot. If the hash changed, open an unreviewed change candidate."""
    folder = snapshot_dir() / _safe_id(source_id)
    folder.mkdir(parents=True, exist_ok=True)
    retrieved = datetime.now(timezone.utc)
    payload = {
        "source_id": source_id,
        "url": url,
        "retrieved_at": retrieved.isoformat(),
        "content_hash": content_hash,
        "normalized_text": normalized_text,
        "status": status,
    }
    previous = load_latest(source_id)
    current = Snapshot(source_id=source_id, normalized_text=normalized_text, content_hash=content_hash)
    (folder / f"{retrieved.strftime('%Y%m%dT%H%M%SZ')}-{content_hash[:12]}.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (folder / "latest.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    if previous is None or not changed(previous, current):
        return None

    record = ChangeRecord(
        id=f"{source_id}:{content_hash[:12]}",
        source_id=source_id,
        previous_hash=previous.content_hash,
        current_hash=content_hash,
        detected_at=retrieved,
        materiality="unreviewed",
        url=url,
    )
    change_path = change_dir() / f"{_safe_id(record.id)}.json"
    change_path.write_text(record.model_dump_json(indent=2), encoding="utf-8")
    return record


def list_changes() -> list[ChangeRecord]:
    items: list[ChangeRecord] = []
    folder = change_dir()
    if not folder.exists():
        return items
    for path in sorted(folder.glob("*.json"), reverse=True):
        try:
            items.append(ChangeRecord.model_validate_json(path.read_text(encoding="utf-8")))
        except Exception:
            continue
    return items
