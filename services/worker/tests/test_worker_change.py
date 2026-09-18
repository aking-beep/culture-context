from culture_worker.change import materially_changed

def test_hash_change_is_detected():
    assert materially_changed("a", "b") is True
    assert materially_changed("a", "a") is False
