#!/usr/bin/env python3
"""Assemble the build report (report.md, posted as GitHub check in CI) from the
errors and warnings (report-issues.tsv, see report-lib.sh) and the details that
the toolchain, arangoproxy, and Hugo write to summary.md during the build.

The files are in REPORT_DIR (default: /home, the repository root in the
containers). DOCS_COMMIT (optional) is used to link the source files on GitHub.
Exits with 1 if there are errors."""

import os
import re
import sys

DIR = os.environ.get("REPORT_DIR", "/home")
ISSUES = os.path.join(DIR, "report-issues.tsv")
SUMMARY = os.path.join(DIR, "summary.md")
REPORT = os.path.join(DIR, "report.md")
# GitHub limits the text of a check to 65535 characters
MAX_LENGTH = 65000


def unescape(field):
    return re.sub(r"\\(\\|t|n)", lambda m: {"\\": "\\", "t": "\t", "n": "\n"}[m.group(1)], field)


def read_issues():
    issues = []
    if not os.path.exists(ISSUES):
        return issues
    with open(ISSUES, encoding="utf-8", errors="replace") as f:
        for line in f:
            fields = [unescape(x) for x in line.rstrip("\n").split("\t")]
            fields += [""] * (6 - len(fields))
            kind, section, version, title, location, message = fields[:6]
            issues.append(dict(kind=kind, section=section, version=version,
                               title=title, location=location, message=message.strip()))
    return issues


def location_link(location):
    """site/content/...md:123:1 as text, linked to GitHub if the commit is known"""
    m = re.match(r"^(?:/home/)?(site/content/.+?\.md)(?::(\d+))?", location)
    if not m:
        return f"`{location}`" if location else ""
    path, line = m.group(1), m.group(2)
    text = f"{path}:{line}" if line else path
    commit = os.environ.get("DOCS_COMMIT")
    if commit:
        anchor = f"#L{line}" if line else ""
        return f"[{text}](https://github.com/arangodb/docs-hugo/blob/{commit}/{path}{anchor})"
    return f"`{text}`"


def format_issue(issue):
    parts = [f"**{issue['title']}**" if issue["title"] else ""]
    link = location_link(issue["location"])
    if link:
        parts.append(f"({link})")
    out = "- " + " ".join(p for p in parts if p).strip()
    if issue["message"]:
        if out == "- ":
            out = "- " + issue["message"].splitlines()[0]
            rest = "\n".join(issue["message"].splitlines()[1:])
        else:
            rest = issue["message"]
        if rest:
            out += "\n\n  ```\n" + "\n".join("  " + l for l in rest.splitlines()) + "\n  ```"
    return out


def format_section(title, issues):
    out = [f"## {title}"]
    groups = {}
    for issue in issues:
        key = f"{issue['section']} {issue['version']}".strip() or "General"
        groups.setdefault(key, []).append(issue)
    for key, items in groups.items():
        out.append(f"\n### {key} ({len(items)})\n")
        out.extend(format_issue(i) for i in items)
    return "\n".join(out)


def main():
    issues = read_issues()
    errors = [i for i in issues if i["kind"] == "error"]
    warnings = [i for i in issues if i["kind"] != "error"]
    details = ""
    if os.path.exists(SUMMARY):
        with open(SUMMARY, encoding="utf-8", errors="replace") as f:
            details = f.read().strip()

    if errors:
        result = f"**❌ {len(errors)} error(s), {len(warnings)} warning(s)**"
    elif warnings:
        result = f"**⚠️ No errors, {len(warnings)} warning(s)**"
    else:
        result = "**✅ No errors or warnings**"
    head = [result]
    if errors:
        head.append(format_section("Errors", errors))
    if warnings:
        head.append(format_section("Warnings", warnings))
    head = "\n\n".join(head)

    # Shorten the details first, then the errors and warnings
    room = MAX_LENGTH - len(head) - 200
    if len(details) > room:
        details = details[:max(room, 0)] + "\n\n_(Details cut off)_"
    report = head
    if details:
        report += "\n\n<details><summary>Details</summary>\n\n" + details + "\n\n</details>"
    if len(report) > MAX_LENGTH:
        report = report[:MAX_LENGTH] + "\n\n_(Report cut off)_"

    with open(REPORT, "w", encoding="utf-8") as f:
        f.write(report + "\n")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
