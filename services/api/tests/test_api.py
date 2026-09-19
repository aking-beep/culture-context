from fastapi.testclient import TestClient
from culture_context.api import app

client = TestClient(app)

def test_health():
    payload = client.get("/health").json()
    assert payload["ok"] is True
    assert payload["explain_enabled"] is False

def test_destinations_cover_the_world():
    payload = client.get("/v1/destinations").json()
    slugs = {item["slug"] for item in payload["destinations"]}
    iso2 = {item["iso2"] for item in payload["destinations"]}
    assert len(payload["destinations"]) >= 180
    assert {"japan", "nigeria", "brazil", "italy", "usa", "india"} <= slugs
    assert {"JP", "NG", "BR", "IT", "US", "IN", "GB", "CN"} <= iso2
    featured = {item["iso2"] for item in payload["featured"]}
    assert "JP" in featured

def test_explain_disabled_is_unavailable():
    item = {
        "id": "x",
        "category": "entry",
        "kind": "advisory",
        "title": "t",
        "summary": "s",
        "relevance": ["destination"],
        "sources": [{
            "id": "s",
            "authority": "A",
            "url": "https://example.com",
            "jurisdiction": "JP",
            "source_class": "government_advisory",
            "retrieved_at": "2026-01-01T00:00:00Z",
        }],
    }
    response = client.post("/v1/explain", json={"items": [item]})
    assert response.status_code == 404
