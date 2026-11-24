#!/usr/bin/env python3
"""Lint docs text, diagrams, and theme code against the Arango writing and design rules.

Usage:
  python3 check.py <files or folders> [...]   check whole files
  python3 check.py --diff [BASE] [paths ...]  check only lines added since BASE
                                              (default: main), including
                                              uncommitted and untracked files

Markdown: front matter (except title, menuTitle, description), fenced code
blocks (except ```openapi), comment shortcodes, inline code, URLs, link
targets, and src/link attributes are skipped.
SVG: the text of <text>, <tspan>, <title>, <desc>, and aria-label is checked as
prose; colors are checked against the docs diagram palette.

Exit code 1 if anything is found. Add `arango-check: ignore` to a line to skip it.
Adapted from the arango-design skill's check.py.
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

PROSE_EXTENSIONS = {".md", ".mdx", ".txt"}
CODE_EXTENSIONS = {".html", ".htm", ".css", ".scss", ".js", ".jsx", ".ts", ".tsx", ".vue", ".svelte"}
EXTENSIONS = PROSE_EXTENSIONS | CODE_EXTENSIONS | {".svg"}
SKIP_DIRS = {"node_modules", ".git", "dist", "build", ".next", ".turbo", "coverage", ".venv", "public", "resources"}
TOKEN_FILES = {"tokens.css", "shadcn-theme.css"}
# Files that quote the banned words on purpose, logos, and single-color icons.
SKIP_PATH = re.compile(r"(^|/)\.claude/skills/|(^|/)images/icons/|(^|/)avo-[^/]*\.svg$")

EMOJI = re.compile(
    "[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U0001F000-\U0001F2FF"
    "\U00002B00-\U00002BFF\U0000FE0F\U0001F900-\U0001F9FF]"
)
DASH = re.compile("[—–]")

BANNED = [
    "delve", "delves", "foster", "fosters", "leverage", "leverages", "leveraged", "leveraging",
    "utilize", "utilizes", "utilized", "utilizing", "utilization", "facilitate", "facilitates",
    "empower", "empowers", "streamline", "streamlines", "streamlined", "robust", "seamless",
    "seamlessly", "unlocks", "unleashes", "harnesses", "elevates", "cutting-edge",
    "state-of-the-art", "game changer", "game-changing", "paradigm", "tapestry", "realm",
    "beacon", "multifaceted", "meticulous", "intricate", "paramount", "transformative",
    "elevate", "embark", "supercharge", "unlock", "unleash", "harness", "ever-evolving",
    "effortless", "effortlessly", "powerful", "comprehensive", "holistic", "synergy",
    "next-level", "best-in-class", "world-class", "it's worth noting",
    "it's important to note", "in today's world", "at its core", "let's dive in",
]
CLAUDISMS = [
    "worth noting", "worth a look", "worth sitting with", "worth talking about", "worth exploring",
    "worth considering", "sit with", "load-bearing", "double-click on", "lean into", "throughline",
    "lessons learned", "paradigm shift", "the whole game", "the only thing that matters",
    "underscores the", "underscoring", "shed light on", "pave the way", "pivotal", "groundbreaking",
    "testament to", "dive into", "let's break it down", "great question", "cannot be overstated",
    "at the end of the day", "north star", "pressure-test", "right-size", "key takeaways", "honestly",
    "here's where it gets interesting", "keep coming back to", "where i landed", "this is where",
    "the real problem", "the real issue", "the right way", "this matters", "because it matters",
]
CLAUDISM_RE = re.compile(r"\b(" + "|".join(re.escape(w) for w in CLAUDISMS) + r")\b", re.I)
NEG_PARALLEL = re.compile(r"\b(?:it's|it is|this is|that's|this isn't|it isn't) not (?:just |only |about )?[^.!?]{1,60}[,;.]\s*(?:it's|it is)\b|\bnot only\b[^.!?]{1,80}\bbut\b", re.I)
BANNED_RE = re.compile(r"\b(" + "|".join(re.escape(w) for w in BANNED) + r")\b", re.I)
PLACEHOLDER = re.compile(r"\b(lorem ipsum|john doe|jane doe|acme( corp)?|foo ?bar)\b", re.I)
# Phrases that explain what the reader can already see. "allows you to" and
# "in this section" are left out: they are normal in docs prose.
OVER_EXPLAIN = re.compile(
    r"\b(this (?:page|screen|view|dashboard|form|panel|tool|card) "
    r"(?:shows|lets|displays|contains|gives|is where)"
    r"|here you can|here you'll|use this (?:page|screen|form|button|panel|view) to"
    r"|click (?:the|this) [\w ]{0,25}(?:button|link) (?:below |above )?to"
    r"|below,? you(?:'ll| will) find|welcome to)\b",
    re.I,
)

# Code checks (theme templates, CSS, JS).
HEX = re.compile(r"(?<![\w&])(?<!=')(?<!=\")#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b")
TOKEN_DEF = re.compile(r"^\s*--[\w-]+\s*:")
PALETTE_CLASS = re.compile(
    r"\b(?:bg|text|border|ring|fill|stroke|from|via|to|outline|divide|decoration|accent|caret)-"
    r"(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|"
    r"sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b"
)
ARBITRARY_COLOR = re.compile(r"\b(?:bg|text|border|ring|fill|stroke|from|via|to)-\[#")
GRADIENT = re.compile(r"linear-gradient|radial-gradient|conic-gradient|bg-gradient-to|bg-linear-to|bg-clip-text|<linearGradient|<radialGradient")
GLASS = re.compile(r"backdrop-blur|backdrop-filter")
FONT_SIZE = re.compile(
    r"font-size\s*:\s*([\d.]+)(px|rem|em)\b"
    r"|\btext-\[([\d.]+)(px|rem|em)\]"
    r"|\bfontSize\s*[:=]\s*\{?\s*['\"]?([\d.]+)(px|rem|em)?['\"]?"
    r"|\bfont-size=\"([\d.]+)(px)?\"",
    re.I,
)
MIN_PX = 13
FONT_DECL = re.compile(r"font-family\s*[:=]\s*\"?([^;\"}]+)", re.I)
FONT_TW = re.compile(r"font-\[['\"]?([^\]'\"]+)")
GFONT = re.compile(r"fonts\.googleapis\.com/css2?\?([^\"'\s>]+)")
ALLOWED_FONTS = {
    "inter", "geist mono", "ui-sans-serif", "system-ui", "sans-serif", "ui-monospace",
    "sfmono-regular", "monospace", "inherit", "-apple-system", "blinkmacsystemfont",
    # Fallbacks in the docs diagram font stacks.
    "segoe ui", "helvetica", "arial", "menlo", "consolas",
}

# Docs diagram palette (references/design.md).
SVG_PALETTE = {
    "014654", "012D3A", "00576E", "06838A", "90A1B9", "62748E", "BEFE99", "EEFBD5",
    "E3EEF0", "1D293D", "314158", "45556C", "CAD5E2", "E2E8F0", "F1F5F9", "FFFFFF",
    "F8FAFC", "008236", "002E3B", "BB4D00", "FEF9C2",
}
SVG_COLOR = re.compile(r"(?<![\w&])#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b")
SVG_TEXT = re.compile(r"<(?:text|tspan|title|desc)\b[^>]*>([^<]+)|aria-label=\"([^\"]+)\"")

# Markdown handling.
FRONT_MATTER_KEY = re.compile(r"^([A-Za-z_][\w-]*)\s*:")
FRONT_MATTER_PROSE = {"title", "menuTitle", "description"}
FENCE = re.compile(r"^\s*(`{3,}|~{3,})\s*([\w-]*)")
INLINE_CODE = re.compile(r"(`+)(?:(?!\1).)+?\1")
LINK_TARGET = re.compile(r"\]\([^)]*\)")
URL = re.compile(r"<?https?://[^\s>)\"']+>?")
ATTR_PATH = re.compile(r"\b(?:src|link|href|id|icon|xlink:href)=\"[^\"]*\"")
HTML_COMMENT = re.compile(r"<!--.*?-->")
COMMENT_OPEN = re.compile(r"\{\{[<%]\s*comment\s*[>%]\}\}")
COMMENT_CLOSE = re.compile(r"\{\{[<%]\s*/comment\s*[>%]\}\}")


def markdown_prose(text: str):
    """Yield (line number, prose text) for the lines of a Markdown file that are rendered as prose."""
    lines = text.splitlines()
    i = 0
    if lines and lines[0].strip() == "---":
        # Front matter: only title, menuTitle, and description are rendered as text.
        i = 1
        in_prose_key = False
        while i < len(lines) and lines[i].strip() != "---":
            line = lines[i]
            key = FRONT_MATTER_KEY.match(line)
            if key:
                in_prose_key = key.group(1) in FRONT_MATTER_PROSE
                if in_prose_key:
                    yield i + 1, line[key.end():]
            elif in_prose_key and line.startswith((" ", "\t")):
                yield i + 1, line
            else:
                in_prose_key = False
            i += 1
        i += 1
    fence = None  # (char, length, check_inside)
    in_comment = False
    for n in range(i, len(lines)):
        line = lines[n]
        m = FENCE.match(line)
        if fence:
            if m and m.group(1)[0] == fence[0] and len(m.group(1)) >= fence[1] and not m.group(2):
                fence = None
            elif fence[2]:
                yield n + 1, line
            continue
        if m:
            fence = (m.group(1)[0], len(m.group(1)), m.group(2) == "openapi")
            continue
        if in_comment:
            if COMMENT_CLOSE.search(line):
                in_comment = False
            continue
        if COMMENT_OPEN.search(line):
            in_comment = not COMMENT_CLOSE.search(line)
            continue
        for pattern in (HTML_COMMENT, INLINE_CODE, LINK_TARGET, URL, ATTR_PATH):
            line = pattern.sub(" ", line)
        yield n + 1, line


def svg_prose(line: str) -> str:
    return " ".join(a or b for a, b in SVG_TEXT.findall(line))


def prose_issues(line: str) -> list[tuple[str, str]]:
    issues = []
    if EMOJI.search(line):
        issues.append(("emoji", "remove the emoji"))
    if DASH.search(line):
        issues.append(("dash", "replace em/en dash with a period, comma, colon or parentheses; ranges: \"10 to 20\""))
    for m in BANNED_RE.finditer(line):
        issues.append(("banned-word", f'"{m.group(0)}"'))
    for m in CLAUDISM_RE.finditer(line):
        issues.append(("claudism", f'"{m.group(0)}" (see references/claudisms.md)'))
    if NEG_PARALLEL.search(line):
        issues.append(("claudism", '"not X, it\'s Y" construction; state Y directly'))
    for m in OVER_EXPLAIN.finditer(line):
        issues.append(("too-much-text", f'"{m.group(0)}": cut text that explains what is visible'))
    if PLACEHOLDER.search(line):
        issues.append(("fake-data", "use plausible ArangoDB data instead"))
    return issues


def check_fonts(line: str) -> list[str]:
    bad = []
    for m in FONT_DECL.finditer(line):
        for fam in m.group(1).split(","):
            fam = fam.strip().strip("'\"").lower()
            if fam and not fam.startswith("var(") and fam not in ALLOWED_FONTS:
                bad.append(fam)
    for m in FONT_TW.finditer(line):
        fam = m.group(1).replace("_", " ").split(",")[0].strip().lower()
        if fam not in ALLOWED_FONTS:
            bad.append(fam)
    for m in GFONT.finditer(line):
        for fam in re.findall(r"family=([^:&]+)", m.group(1)):
            fam = fam.replace("+", " ").lower()
            if fam not in ALLOWED_FONTS:
                bad.append(fam)
    return bad


def small_text(line: str) -> list[str]:
    bad = []
    for m in FONT_SIZE.finditer(line):
        groups = m.groups()
        num, unit = next(((groups[i], groups[i + 1]) for i in (0, 2, 4, 6) if groups[i]), (None, None))
        if num is None:
            continue
        px = float(num) * (16 if (unit or "px").lower() in ("rem", "em") else 1)
        if px < MIN_PX:
            bad.append(m.group(0).strip())
    return bad


def code_issues(line: str, is_tokens: bool) -> list[tuple[str, str]]:
    issues = []
    if is_tokens:
        return issues
    if HEX.search(line) and not TOKEN_DEF.match(line):
        issues.append(("raw-color", "use a CSS variable instead of hex"))
    for m in PALETTE_CLASS.finditer(line):
        issues.append(("palette-class", f'"{m.group(0)}" bypasses the theme; use a semantic class'))
    if ARBITRARY_COLOR.search(line):
        issues.append(("raw-color", "arbitrary hex class; use a semantic class"))
    if GRADIENT.search(line):
        issues.append(("gradient", "no gradients"))
    if GLASS.search(line):
        issues.append(("glass", "no backdrop blur / glassmorphism"))
    for size in small_text(line):
        issues.append(("small-text", f'"{size}" is under 13px'))
    for fam in check_fonts(line):
        issues.append(("font", f'"{fam}" is not Inter or Geist Mono'))
    return issues


def svg_issues(line: str) -> list[tuple[str, str]]:
    issues = prose_issues(svg_prose(line))
    for m in SVG_COLOR.finditer(line):
        hex_ = m.group(1).upper()
        if len(hex_) == 3:
            hex_ = "".join(c * 2 for c in hex_)
        if hex_ not in SVG_PALETTE:
            issues.append(("off-palette", f'"{m.group(0)}" is not in the diagram palette (references/design.md)'))
    if GRADIENT.search(line):
        issues.append(("gradient", "no gradients in diagrams"))
    for size in small_text(line):
        issues.append(("small-text", f'"{size}" is under 13px'))
    for fam in check_fonts(line):
        issues.append(("font", f'"{fam}" is not Inter'))
    return issues


def check_file(path: Path, only_lines: set[int] | None = None) -> list[tuple[int, str, str]]:
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return []
    if path.suffix in PROSE_EXTENSIONS:
        lines = markdown_prose(text)
        check = prose_issues
    elif path.suffix == ".svg":
        lines = enumerate(text.splitlines(), 1)
        check = svg_issues
    else:
        is_tokens = path.name in TOKEN_FILES
        lines = enumerate(text.splitlines(), 1)
        check = lambda l: prose_issues(l) + code_issues(l, is_tokens)  # noqa: E731
    issues = []
    for n, line in lines:
        if only_lines is not None and n not in only_lines:
            continue
        if "arango-check: ignore" in line:
            continue
        issues.extend((n, rule, msg) for rule, msg in check(line))
    return issues


def wanted(path: Path) -> bool:
    return (path.suffix in EXTENSIONS and not SKIP_DIRS & set(path.parts)
            and not SKIP_PATH.search(path.as_posix()))


def iter_files(paths: list[str]):
    for p in map(Path, paths):
        if p.is_file():
            yield p
        elif p.is_dir():
            for f in sorted(p.rglob("*")):
                if f.is_file() and wanted(f):
                    yield f


def git(*args: str) -> str:
    return subprocess.run(["git", *args], capture_output=True, text=True, check=True).stdout


def diff_targets(base: str, paths: list[str]) -> list[tuple[Path, set[int] | None]]:
    """Files changed since base (committed, uncommitted, or untracked) with their added line numbers."""
    root = Path(git("rev-parse", "--show-toplevel").strip())
    spec = ["--", *paths] if paths else []
    changed = git("diff", "--name-only", "--diff-filter=AMR", base, *spec).split()
    untracked = git("ls-files", "--others", "--exclude-standard", *spec).split()
    targets = []
    for name in changed:
        path = root / name
        if not path.is_file() or not wanted(Path(name)):
            continue
        added: set[int] = set()
        for m in re.finditer(r"^@@ [^+]*\+(\d+)(?:,(\d+))? @@", git("diff", "-U0", "--no-color", base, "--", str(path)), re.M):
            start, count = int(m.group(1)), int(m.group(2) or 1)
            added.update(range(start, start + count))
        targets.append((path, added))
    cwd = Path.cwd()
    for name in untracked:
        path = cwd / name
        if path.is_file() and wanted(Path(name)):
            targets.append((path, None))
    return targets


def main(argv: list[str]) -> int:
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__.strip())
        return 2
    if argv[0] == "--diff":
        rest = argv[1:]
        base = "main"
        if rest and not Path(rest[0]).exists():
            base, rest = rest[0], rest[1:]
        try:
            targets = diff_targets(base, rest)
        except subprocess.CalledProcessError as e:
            print(f"git failed: {e.stderr.strip()}", file=sys.stderr)
            return 2
    else:
        targets = [(f, None) for f in iter_files(argv)]

    total = 0
    counts: dict[str, int] = {}
    for f, only_lines in targets:
        for n, rule, msg in check_file(f, only_lines):
            print(f"{f}:{n}: [{rule}] {msg}")
            counts[rule] = counts.get(rule, 0) + 1
            total += 1
    if total:
        summary = ", ".join(f"{k} {v}" for k, v in sorted(counts.items()))
        print(f"\n{total} issue(s): {summary}")
        return 1
    print("No issues found.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
