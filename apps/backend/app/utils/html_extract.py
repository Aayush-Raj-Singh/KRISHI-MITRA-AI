from __future__ import annotations

import html
import re
from dataclasses import dataclass, field
from html.parser import HTMLParser
from typing import List, Optional
from urllib.parse import urljoin, urlparse


def normalize_space(value: str) -> str:
    return " ".join(str(value or "").split())


@dataclass
class ExtractedLink:
    href: str
    text: str


@dataclass
class HtmlSnapshot:
    title: Optional[str] = None
    description: Optional[str] = None
    links: List[ExtractedLink] = field(default_factory=list)
    lines: List[str] = field(default_factory=list)


class _HtmlSnapshotParser(HTMLParser):
    _BLOCK_TAGS = {
        "br",
        "div",
        "p",
        "section",
        "article",
        "li",
        "tr",
        "td",
        "th",
        "ul",
        "ol",
        "table",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
    }

    def __init__(self, base_url: str) -> None:
        super().__init__(convert_charrefs=True)
        self._base_url = base_url
        self._title_parts: List[str] = []
        self._line_parts: List[str] = []
        self._lines: List[str] = []
        self._in_title = False
        self._in_anchor = False
        self._current_href: Optional[str] = None
        self._anchor_parts: List[str] = []
        self.description: Optional[str] = None
        self.links: List[ExtractedLink] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        attrs_map = {str(key).lower(): str(value) for key, value in attrs}
        normalized_tag = tag.lower()
        if normalized_tag in self._BLOCK_TAGS:
            self._flush_line()
        if normalized_tag == "title":
            self._in_title = True
        elif normalized_tag == "meta":
            name = attrs_map.get("name", "").strip().lower()
            prop = attrs_map.get("property", "").strip().lower()
            if self.description is None and (name == "description" or prop == "og:description"):
                content = normalize_space(html.unescape(attrs_map.get("content", "")))
                if content:
                    self.description = content
        elif normalized_tag == "a":
            href = attrs_map.get("href", "").strip()
            if href:
                self._in_anchor = True
                self._current_href = urljoin(self._base_url, href)
                self._anchor_parts = []

    def handle_endtag(self, tag: str) -> None:
        normalized_tag = tag.lower()
        if normalized_tag == "title":
            self._in_title = False
        elif normalized_tag == "a":
            href = self._current_href
            text = normalize_space("".join(self._anchor_parts))
            if href:
                self.links.append(ExtractedLink(href=href, text=text))
            self._in_anchor = False
            self._current_href = None
            self._anchor_parts = []
        elif normalized_tag in self._BLOCK_TAGS:
            self._flush_line()

    def handle_data(self, data: str) -> None:
        text = html.unescape(data or "")
        if self._in_title:
            self._title_parts.append(text)
        normalized = normalize_space(text)
        if not normalized:
            return
        self._line_parts.append(normalized)
        if self._in_anchor:
            self._anchor_parts.append(normalized)

    def _flush_line(self) -> None:
        text = normalize_space(" ".join(self._line_parts))
        if text:
            self._lines.append(text)
        self._line_parts = []

    def snapshot(self) -> HtmlSnapshot:
        self._flush_line()
        title = normalize_space("".join(self._title_parts)) or None
        lines: List[str] = []
        seen = set()
        for item in self._lines:
            if item and item not in seen:
                lines.append(item)
                seen.add(item)
        return HtmlSnapshot(
            title=title,
            description=self.description,
            links=self.links,
            lines=lines,
        )


def extract_html_snapshot(html_body: str, *, base_url: str) -> HtmlSnapshot:
    parser = _HtmlSnapshotParser(base_url)
    parser.feed(html_body or "")
    return parser.snapshot()


def same_domain(url: str, candidate: str) -> bool:
    origin_host = (urlparse(url).hostname or "").lower()
    candidate_host = (urlparse(candidate).hostname or "").lower()
    if not origin_host or not candidate_host:
        return False
    return candidate_host == origin_host or candidate_host.endswith(f".{origin_host}")


def slugify_token(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", str(value or "").strip().lower())
    return normalized.strip("-")
