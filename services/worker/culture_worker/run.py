from __future__ import annotations

import argparse
import json
from pathlib import Path

from culture_worker.change import materially_changed


def scan(snapshot_root: Path) -> list[dict]:
    """Compare latest snapshots against previous files. Hash change is detection only."""
    found: list[dict] = []
    if not snapshot_root.exists():
        return found
    for latest in snapshot_root.glob("*/latest.json"):
        files = sorted(p for p in latest.parent.glob("*.json") if p.name != "latest.json")
        if len(files) < 2:
            continue
        previous = json.loads(files[-2].read_text(encoding="utf-8"))
        current = json.loads(files[-1].read_text(encoding="utf-8"))
        if materially_changed(previous["content_hash"], current["content_hash"]):
            found.append(
                {
                    "source_id": current["source_id"],
                    "previous_hash": previous["content_hash"],
                    "current_hash": current["content_hash"],
                    "materiality": "unreviewed",
                    "note": "Hash change is not a published legal change.",
                }
            )
    return found


def main() -> None:
    parser = argparse.ArgumentParser(description="Detect source snapshot hash changes")
    parser.add_argument("--snapshots", default="data/snapshots")
    args = parser.parse_args()
    changes = scan(Path(args.snapshots))
    print(json.dumps(changes, indent=2))


if __name__ == "__main__":
    main()
