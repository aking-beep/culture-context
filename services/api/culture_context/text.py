from html.parser import HTMLParser
import html
import re


class _Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts: list[str] = []
        self._skip = 0

    def handle_starttag(self, tag: str, attrs):
        if tag in {"script", "style", "noscript"}:
            self._skip += 1

    def handle_endtag(self, tag: str):
        if tag in {"script", "style", "noscript"} and self._skip:
            self._skip -= 1

    def handle_data(self, data: str):
        if self._skip:
            return
        if data.strip():
            self.parts.append(data.strip())


def html_to_text(value: str) -> str:
    parser = _Text()
    parser.feed(value or "")
    text = html.unescape(" ".join(parser.parts))
    return re.sub(r"\s+", " ", text).strip()


def compact(value: str, limit: int = 900) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    if len(value) <= limit:
        return value
    cut = value[: limit - 1].rstrip()
    period = max(cut.rfind(". "), cut.rfind("? "), cut.rfind("! "))
    if period >= int(limit * 0.45):
        return cut[: period + 1].strip()
    return cut + "…"


def split_headings(html_body: str) -> list[tuple[str, str]]:
    """Split GOV.UK HTML on h2/h3 headings. Untrusted HTML is reduced to text."""
    pattern = re.compile(r"<h[23][^>]*>(.*?)</h[23]>", re.I | re.S)
    matches = list(pattern.finditer(html_body or ""))
    if not matches:
        text = html_to_text(html_body)
        return [("body", text)] if text else []

    sections: list[tuple[str, str]] = []
    preface = html_to_text(html_body[: matches[0].start()])
    if preface:
        sections.append(("Overview", preface))
    for index, match in enumerate(matches):
        title = html_to_text(match.group(1)) or "Section"
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(html_body)
        body = html_to_text(html_body[start:end])
        if body:
            sections.append((title, body))
    return sections


def excerpt_around(text: str, needles: tuple[str, ...], limit: int = 420) -> str | None:
    """Return a readable excerpt that starts on a sentence, never mid-word."""
    lower = text.lower()
    hit = next((n for n in needles if n in lower), None)
    if not hit:
        return None
    idx = lower.find(hit)
    boundary = max(text.rfind(". ", 0, idx), text.rfind("? ", 0, idx), text.rfind("! ", 0, idx))
    start = 0 if boundary == -1 else boundary + 2
    if idx - start > 240:
        start = idx
        while start > 0 and text[start - 1].isalnum():
            start -= 1
    return compact(text[start:].lstrip(), limit)
