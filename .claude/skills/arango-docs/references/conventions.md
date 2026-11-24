# Syntax, terms, links, and remarks

Condensed from the repository README (Syntax Guidelines, Permission wording,
Add links, Version/Environment/Edition/Experimental remarks). If this file and
the README disagree, the README wins. Update this file to match.

## Markdown syntax

- Wrap prose at 80 characters. Pre-wrap lines where needed.
- Keep a Markdown link on one line, even if the line goes past 80 characters.
- Don't break lines in code blocks or where Markdown doesn't allow it (table
  rows; use `<br>` only if necessary).
- `-` for bullets, not `*`.
- No `#` or `===` headings. The page `<h1>` comes from the `title` front matter.
- `##` for level 2 headings, not `---` underlines.
- A blank line above and below headings and fenced code blocks (except directly
  after the front matter).
- Avoid bold and italic in headings. If needed, use `**bold**` and `*italic*`,
  not underscores: underscores stay in anchor IDs, asterisks are removed.
- Inline code in headings is fine for code values, and required for startup
  options, because `--` otherwise becomes a dash.
- Code block languages: lowercase, no spaces, and use `cfg` (not `conf`/`ini`),
  `py` (not `python`), `yaml` (not `yml`), `sh` (not `shell`), `js` (not
  `javascript`), and no language (not `plain`/`text`).
- No TODOs in content and no `<!-- HTML comments -->`. Use
  `{{< comment >}}...{{< /comment >}}`.
- Raw HTML blocks in Markdown: no HTML comments and no blank lines inside the
  block. Goldmark ends the block there and renders the rest as `<pre><code>`.

## Executable names

- Write program names in italics with underscores: _arangod_, _arangosh_,
  _oasisctl_. In headings, use asterisks: `*arangod*`.
- Never capitalize them: _arangosh_, not _Arangosh_.
- No italics in: `menuTitle`, a link whose whole label is the name, a heading
  that is only the name, inside code.
- Use inline code only when it's a command to run or a file name:
  `` The server executable is named `arangod` ``.

## Terms

Use these spellings exactly:

| Write | Not |
|:------|:----|
| _EnterpriseGraphs_, _SmartGraphs_, _Disjoint SmartGraphs_, _SmartJoins_, _OneShard_ | other spellings |
| _SmartGraphs using SatelliteCollection_ | Hybrid SmartGraphs |
| _Community Edition_, _Enterprise Edition_ | |
| _DB-Server_ (unless a code value) | dbserver, db-server, DBserver |
| _Coordinator_, _Agent_, _Agency_ (capitalized) | |
| _Arango Managed Platform (AMP)_, then _AMP_ | Oasis, ArangoDB Cloud, ArangoGraph (Insights Platform) |
| _Arango Contextual Data Platform_, then _data platform_ | platform, Data Platform, Arango Data Platform, Arango AI Data Platform |
| _Arango Platform Suite_, _Arango Agentic AI Suite_ | AI Services, GenAI Suite, AI Suite |
| _Arango Control Plane_ | GenAI Service, AI Orchestrator |
| _deployment mode_ | deployment type |
| _object storage_ | blob storage |
| _HTTP API_ | REST API, RESTful API |
| _AutoRAG_; inside the AutoRAG chapter, _AutoRAG service_ for a deployed instance | Retriever (except in older release notes), "retriever" for an instance |
| _AutoGraph_, _AutoRAG_, _GraphML_, _Graph Analytics_ (product names) | Importer, Retriever, AutoGraph Loader (service names) |
| _GraphRAG_ only for the general technique | GraphRAG as a product name |

AutoRAG rename: don't rename API identifiers and UI labels. Keep
`graphragretriever`, `/graphrag/retriever/...`, `/v1/retriever-runs`,
`retrieverServiceId`, `project_type: "graphrag"`, `GRAPHRAG_*` variables,
_Custom Retriever_ (a search method), FullGraphRAG and VectorRAG, and the
AutoGraph Studio labels ("Retrievers" panel, "Retriever services").

## Permission wording

Use this wording everywhere, especially in HTTP API descriptions, `401`/`403`
responses, and release notes.

- Access levels as inline code: `rw`, `ro`, `none`. Not Administrate, Read
  Only, Write, No access, read access, write access.
- _at least `ro` access_ when `rw` also works.
- Name the database or collection: _`rw` access to the `_system` database_.
  Admin rights are `rw` access to the `_system` database.
- The user account is the subject: _The user account you authenticate with
  needs ..._; in errors, _... has `none` access to ..._ or _... lacks `rw`
  access to ..._.
- _superuser JWT_, not superuser token/rights/privileges or "the superuser".
  Link it once per description:
  `[superuser JWT](../authentication.md#jwt-superuser-tokens)` (relative path).
  Exceptions: _unless you authenticate with a superuser JWT_.

## Links

- Internal links: relative paths to the `.md` file, never to folders or URLs:
  `[Graphs](../graphs/_index.md)`, not `../graphs/` or `/arangodb/...`.
- Same-page anchors: `[Named graphs](#named-graphs)`.
- External links: plain Markdown with the full URL. They open in a new tab
  automatically.
- No "here" as a label. Describe the target. No whole sentences as labels.
- In SVG diagrams, internal links are absolute paths
  (`/arangodb/4.x/deploy/cluster/`). See `markup.md`.

## Version remarks

Use when a feature is added, deprecated, or removed in the middle of a release
series. Not needed for the first release of a series (x.y.0), except for
deprecations, which always get one.

- `v3.12.1` implies all later versions. If that's not true, list each:
  `<small>Introduced in: v3.11.5, v3.12.2</small>`.
- In an older version folder, only mention versions up to that folder's
  version (3.11 docs: `Introduced in: v3.11.5`).
- Types: `Introduced in:`, `Deprecated in:`, `Removed in:` (block form) and
  `(introduced in ...)` etc. (inline form).

Placement:

- Page: first line after the front matter, `<small>Introduced in: v3.12.1</small>`.
- Section: on its own line directly under the heading.
- Option/attribute in an OpenAPI or option description: first paragraph of the
  `description: |` if it applies to the whole option; inline
  `(introduced in v3.11.5 and v3.12.2)` for a single enum value or sentence.
  Repeat it in every schema copy of the same attribute on a page.
- Sub-attributes of a new object inherit the remark; don't repeat it.
- For big behavior changes, describe before and after in prose instead:
  _In versions up to v3.12.5, ... From version 3.12.6 onward, ..._

When removing an old version folder, remove remarks that only mention removed
versions. Keep a remark if any version it names is still in the docs.

## Tags (environment, edition, experimental)

Put tags directly after the heading, before any version remark.

- `{{< tag "Contextual Data Platform" >}}`, `{{< tag "Platform Suite" >}}`,
  `{{< tag "Agentic AI Suite" >}}`: in the Contextual Data Platform docs, tag
  pages of services that need one of the suite licenses.
- `{{< tag "AMP" >}}`: AMP only.
- `{{< tag "arangosh" >}}`: ArangoDB Shell only, not server-side JavaScript.
- `{{< tag "Experimental" >}}`: may change or be removed; not for production.
- `"Beta"`: in beta until GA. Add it to the existing tag of the page or
  section, for example `{{< tag "Agentic AI Suite" "Beta" >}}`. For a whole
  feature, tag every page of the feature directly after the front matter; for
  part of a page, under the section heading. Ada, AQLizer (natural language to
  AQL), and the Reasoner are beta as a whole. Remove the tags at GA.
- `{{< tag "Air-gapped system" >}}` and `{{< tag "Internet-connected system" >}}`:
  for steps that only apply to one kind of installation.
- `{{< tag "Limited Release" >}}`: only available to selected customers.

Combine several tags in one shortcode: `{{< tag "ArangoDB Enterprise Edition" "AMP" >}}`.
The tooltips come from the dictionary at the top of
`site/themes/arangodb-docs-theme/layouts/shortcodes/tag.html`. A new tag value
needs an entry there.
- Edition tags only in content before v3.12.5:
  `{{< tag "ArangoDB Enterprise Edition" "AMP" >}}`. From v3.12.5 onward, all
  Enterprise features are in the Community Edition, so don't add edition
  remarks.

Features that live in their own docs section (Contextual Data Platform, AMP,
ArangoDB) generally don't need a tag.
