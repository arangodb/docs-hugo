---
name: arango-docs
description: Write, edit, and review Arango documentation in this repository (Hugo Markdown under site/content) following the Arango writing style and docs conventions. Covers tone and wording, banned words and AI tells, terminology (DB-Server, AMP, Contextual Data Platform), permission wording, 80-column wrapping, links, front matter and lead paragraphs, version remarks and tags, shortcodes (admonitions, tabs, steps, cards, embed-svg, mermaid), generated examples (aql, js, curl), renaming or moving pages, and visual design for docs (SVG diagram colors, fonts, arrows, contrast, screenshots, logo, theme CSS). Use for any docs page, diagram, HTTP API description, release note, or README change, and when asked to style-check, tighten, or review docs text or diagrams.
---

# Arango docs

Rules for anything written in this repository. Read the reference that matches
the task before you write:

| Task | Read |
|:-----|:-----|
| Any prose (always) | [references/writing.md](references/writing.md) |
| Reviewing or polishing prose | [references/claudisms.md](references/claudisms.md), completely |
| Syntax, terms, permissions, links, version remarks, tags | [references/conventions.md](references/conventions.md) |
| Shortcodes, images, SVG and Mermaid diagrams | [references/markup.md](references/markup.md) |
| New, renamed, or moved pages, front matter, version folders | [references/pages.md](references/pages.md) |
| `aql`, `js`, or `curl` example blocks | [references/examples.md](references/examples.md) |
| SVG diagrams, colors, screenshots, logo, theme CSS | [references/design.md](references/design.md) |
| Release notes, breaking changes, service versions | [references/release-notes.md](references/release-notes.md) |
| Checking facts against source code, local build, link check | [references/verify-and-build.md](references/verify-and-build.md) |

The docs references are condensed from `README.md`. If they disagree, the
README wins; fix the reference. `design.md` is adapted from the Arango design
system; for building UI (apps, prototypes, dashboards), use the
`arango-design` skill.

## Rules that apply everywhere

1. Less text. Cut anything that restates a heading or announces what follows.
2. No emoji. No em dashes or en dashes: ranges are "10 to 20".
3. Say "you", not "the user". American English.
4. Sentence case for new headings, but match the surrounding page before
   renaming a heading: headings are anchors.
5. No banned words (leverage, utilize, seamless, robust, powerful, delve, ...)
   and no Claudisms ("worth noting", "not X, it's Y", "load-bearing").
6. Wrap prose at 80 columns; keep each link on one line.
7. Internal links are relative paths to `.md` files.
8. Use the exact product terms from `conventions.md` (_DB-Server_, _AMP_,
   _Arango Contextual Data Platform_, _HTTP API_, `rw`/`ro`/`none`).
9. New pages need a `description` (lead paragraph): no period, no links.
10. Changes that apply to several versions go into each version folder by hand
    (3.11, 3.12, 4.x). Leave 3.10 alone unless asked.
11. Diagrams use only the palette in `design.md`: green, never blue or purple;
    lime only as a fill; Inter; no text under 13px.
12. Verify facts (defaults, fields, versions, image tags) in the source repos
    or with the owning team. Don't guess; leave a `{{< comment >}}` instead.
13. Commit messages and PR descriptions are plain and team-authored: no
    AI attribution lines (`Co-Authored-By: Claude`, "Generated with").

## Writing or editing a page

1. Read the page and its siblings first. Match their structure, heading case,
   and level of detail.
2. Read the references for the task (table above).
3. Write. Keep every technical fact, value, and API name exact. Don't invent
   behavior, versions, or defaults; ask or mark it with
   `{{< comment >}}` if unsure.
4. Run the checker on the lines you added and fix the hits:
   `python3 .claude/skills/arango-docs/scripts/check.py --diff`
5. Check the result against the review checklist below.

## Reviewing docs

1. Scope: for a branch, review the lines it adds (`git diff main...HEAD`) and
   the pages it creates. Leave untouched text alone unless asked.
2. Run `python3 .claude/skills/arango-docs/scripts/check.py --diff [BASE]`
   (default base `main`; add paths to narrow it). It checks only the lines
   added since the base, including uncommitted and untracked files. In
   Markdown it flags emoji, dashes, banned words, common Claudisms, and fake
   placeholder data, and skips code blocks, front matter (except title and
   description), inline code, and URLs. In SVGs it also checks label text,
   off-palette colors, text under 13px, fonts, and gradients. Pass file paths
   without `--diff` to check whole files. Quoted UI text may need
   `arango-check: ignore` on the line.
3. Check by hand on added lines: "the user", usually-empty words (just,
   simply, easily), wrong terms, lines over 80 columns, links to folders or
   absolute URLs, `<!-- -->` comments, wrong code block languages (`python`,
   `yml`, `shell`, `javascript`).
4. Read for the patterns in `writing.md` and `claudisms.md`. The checker
   catches only literal phrases.
5. Check structure: lead paragraph, version remark and tag placement, front
   matter, admonition count, alt text on images.
6. For changed SVGs: palette, font, text size, contrast, arrow geometry,
   labels, and link order per `design.md` and `markup.md`.
7. If a heading or file changed: are aliases and all links to it updated, in
   every version folder?
8. Report one line per issue: `file:line`, before, after. List the hits you
   kept on purpose with the reason. Fix only when asked.
