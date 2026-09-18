from html.parser import HTMLParser
import html
import re

class _Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts: list[str] = []
    def handle_data(self, data: str):
        if data.strip(): self.parts.append(data.strip())

def html_to_text(value: str) -> str:
    parser = _Text(); parser.feed(value or "")
    text = html.unescape(" ".join(parser.parts))
    return re.sub(r"\s+", " ", text).strip()

def compact(value: str, limit: int = 900) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    return value if len(value) <= limit else value[:limit - 1].rstrip() + "…"
