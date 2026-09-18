def materially_changed(previous_hash: str, current_hash: str) -> bool:
    if not previous_hash or not current_hash:
        raise ValueError("hashes are required")
    return previous_hash != current_hash
