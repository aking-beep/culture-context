from dataclasses import dataclass
import hashlib


@dataclass(frozen=True)
class Snapshot:
    source_id: str
    normalized_text: str
    content_hash: str

    @classmethod
    def from_text(cls, source_id: str, normalized_text: str):
        digest = hashlib.sha256(normalized_text.encode("utf-8")).hexdigest()
        return cls(source_id=source_id, normalized_text=normalized_text, content_hash=digest)


def changed(previous: Snapshot, current: Snapshot) -> bool:
    if previous.source_id != current.source_id:
        raise ValueError("cannot compare snapshots from different sources")
    return previous.content_hash != current.content_hash
