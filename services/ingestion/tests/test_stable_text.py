from culture_ingestion.run import stable_text

def test_stable_text_is_key_order_independent():
    assert stable_text({"b":2,"a":1}) == stable_text({"a":1,"b":2})
