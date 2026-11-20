# Pages, front matter, and versions

Condensed from the repository README (Documentation structure, Add lead
paragraphs, Add a page or section, Rename or move a page, Navigation group
labels, Disable or limit the table of contents). If this file and the README
disagree, the README wins. Update this file to match.

## Where content lives

- `site/content/arangodb/<version>/`: one folder per ArangoDB release series
  (`3.10`, `3.11`, `3.12`, `4.x`). Check `site/data/versions.yaml` for which are
  current, stable, and deprecated.
- `site/content/contextual-data-platform/`, `amp/`, `ecosystem/`,
  `get-started/`: unversioned sections.
- `site/content/images/`: shared images and SVGs.

There is no cherry-picking between version folders. When a change applies to
several versions, edit each folder by hand. Apply cross-version changes to
3.11, 3.12, and 4.x. Leave `3.10` alone unless asked: it is deprecated.

## New page

File name: lowercase, hyphens instead of spaces, short, following the names
around it. It becomes part of the URL (`arangodb/3.12/aql/examples.md` becomes
`/arangodb/3.12/aql/examples/`).

```yaml
---
title: The level 1 heading
menuTitle: Short navigation title
weight: 42
description: >-
  You can do this and that with X, and it is ideal to solve problem Y
---
```

- `weight` sets the position in the section, low to high. Look at sibling pages
  and pick a value between them.
- `description` is the lead paragraph. Required for new pages. It states what
  the page covers so readers can decide whether to read on. No period at the
  end, no links. Bold, italic, and inline code are OK.
- A section is a folder with an `_index.md`. Turning `topic.md` into
  `topic/_index.md` keeps the URL, so it needs no redirect.

Optional front matter:

- `group: Overview`: a sidebar label. Within a section, either every page sets
  `group` or none does, and each group's pages must be adjacent by weight (use
  weight bands like 100 to 199). The build fails otherwise.
- `pageToc: { maxHeadlineLevel: 3 }`: limit the "On this page" list.
- `aliases`: redirects, see below.

## Rename or move a page

1. Rename or move the file.
2. Add `aliases` to the front matter of the new file for the old URL:
   - Renamed in the same folder: `- old-name`
   - Moved to another folder: `- ../old/file`
   - Renamed folder, in `new/_index.md`: `- old` (relative to the parent
     folder), and `- ../old/other` in every other file in it.
3. Add aliases in the other direction in older version folders if needed, so
   the version selector doesn't lead to a 404.
4. Adjust `weight` if needed.
5. Update every link to the old path (search all version folders).

Use Hugo aliases for versioned content. Use Netlify redirects in
`site/_redirects` for unversioned content and for pages removed from every
version (`/old/ /new/ 302` until tested, then `301`). Don't add manual
redirects for URLs that are already aliases.

## Headings and anchors

Every heading is a link anchor. If you change a heading, search for links to
its anchor in all version folders and update them.
