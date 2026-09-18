import pytest
from culture_context.change import Snapshot, changed

def test_snapshot_change_is_deterministic():
    a = Snapshot.from_text("gov:jp", "one")
    b = Snapshot.from_text("gov:jp", "one")
    c = Snapshot.from_text("gov:jp", "two")
    assert changed(a, b) is False
    assert changed(a, c) is True

def test_snapshot_comparison_requires_same_source():
    with pytest.raises(ValueError):
        changed(Snapshot.from_text("a", "x"), Snapshot.from_text("b", "x"))
