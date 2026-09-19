from culture_context.text import compact, excerpt_around


def test_excerpt_starts_at_a_full_sentence():
    text = (
        "port risks Road travel If you’re planning to drive in Japan, see information on driving abroad. "
        "You’ll need the 1949 version of the international driving permit (IDP) plus your UK driving licence."
    )
    excerpt = excerpt_around(text, ("driving", "licence", "road travel"))
    assert excerpt
    assert excerpt.startswith("If you’re planning to drive in Japan")
    assert "international driving permit" in excerpt


def test_excerpt_does_not_cut_the_first_word_of_a_match():
    text = (
        "Custody disputes Japanese family law is different from UK law. "
        "It is illegal to possess or use some common prescription and over-the-counter medicines "
        "under Japan’s strictly enforced law on anti-stimulant drugs. Ignorance of the law does not count as a defence."
    )
    excerpt = excerpt_around(text, ("medicine", "medication", "prescription"))
    assert excerpt
    assert excerpt.startswith("It is illegal to possess")
    assert "…" not in excerpt[:12]


def test_compact_prefers_a_sentence_ending():
    long = ("This is one complete sentence. " * 20) + "This trailing fragment is cut"
    out = compact(long, 90)
    assert out.endswith(".")
    assert not out.endswith("…")
