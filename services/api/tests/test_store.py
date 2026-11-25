from datetime import datetime, timezone
from culture_context.models import SourceClass, SourceRef
from culture_context.store import persist_snapshot, list_changes, load_latest

def test_hash_change_opens_unreviewed_job(tmp_path, monkeypatch):
    monkeypatch.setenv("CULTURE_SNAPSHOT_DIR", str(tmp_path / "snap"))
    monkeypatch.setenv("CULTURE_CHANGE_DIR", str(tmp_path / "chg"))
    first = persist_snapshot("govuk:japan", "https://www.gov.uk/foreign-travel-advice/japan", "one", "aaa")
    assert first is None
    second = persist_snapshot("govuk:japan", "https://www.gov.uk/foreign-travel-advice/japan", "two", "bbb")
    assert second is not None
    assert second.materiality == "unreviewed"
    assert second.previous_hash == "aaa"
    assert load_latest("govuk:japan").content_hash == "bbb"
    assert list_changes()[0].id == second.id
