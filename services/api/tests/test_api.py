from fastapi.testclient import TestClient
from culture_context.api import app

client = TestClient(app)

def test_health():
    payload = client.get("/health").json()
    assert payload["ok"] is True
    assert payload["explain_enabled"] is False

def test_destinations_are_five_launch_countries():
    payload = client.get("/v1/destinations").json()
    slugs = {item["slug"] for item in payload["destinations"]}
    assert slugs == {"japan", "mexico", "france", "thailand", "morocco"}

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
