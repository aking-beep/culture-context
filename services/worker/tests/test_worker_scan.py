from culture_worker.change import materially_changed
from culture_worker.run import scan

def test_scan_requires_two_versions(tmp_path):
    folder = tmp_path / "govuk-japan"
    folder.mkdir()
    (folder / "20260101T000000Z-aaa.json").write_text(
        '{"source_id":"govuk:japan","content_hash":"aaa"}', encoding="utf-8"
    )
    (folder / "latest.json").write_text(
        '{"source_id":"govuk:japan","content_hash":"aaa"}', encoding="utf-8"
    )
    assert scan(tmp_path) == []
    (folder / "20260102T000000Z-bbb.json").write_text(
        '{"source_id":"govuk:japan","content_hash":"bbb"}', encoding="utf-8"
    )
    (folder / "latest.json").write_text(
        '{"source_id":"govuk:japan","content_hash":"bbb"}', encoding="utf-8"
    )
    assert scan(tmp_path)[0]["materiality"] == "unreviewed"
    assert materially_changed("aaa", "bbb") is True
