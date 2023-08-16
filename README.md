# ArangoDB Documentation

This repository contains the source files of the ArangoDB documentation as
published on [docs.arangodb.com](https://docs.arangodb.com/).

## Contribute

To suggest a concrete change to the documentation, you may
[edit files directly on GitHub](https://docs.github.com/en/repositories/working-with-files/managing-files/editing-files).
It will fork the repository automatically if necessary. Commit the changes to a
new branch, give it a succinct name, and open a pull request (PR).

To add more changes to a PR, click on the branch name below the headline
of the PR (the latter link of "&lt;User&gt; wants to merge &lt;n&gt; commits
into `main` from `branch-name`"). Then locate and edit the next file.
Commit the changes directly to your PR branch.

For general suggestions, feel free to
[create an issue](https://github.com/arangodb/docs/issues/new).

### Automatic Previews

In every pull request, the _arangodb-docs-automation_ bot comments with a deploy
preview link. Whenever you push a change to the PR branch, a preview is built.
If it succeeded, then you can view the preview hosted on Netlify by following
the link.

### Contributor License Agreement

To accept external contributions, we need you to fill out and sign our
Contributor License Agreement (CLA). We use an Apache 2 CLA for ArangoDB,
which can be found here: <https://www.arangodb.com/documents/cla.pdf>
You can scan and email the CLA PDF file to <cla@arangodb.com> or send it via
fax to +49-221-2722999-88.

## Build the Documentation

The following section describes how you can build the documentation locally.
This is not strictly necessary when contributing. You can also rely on
[automatic previews](#automatic-previews).

### The toolchain

The documentation toolchain is containerized and uses Docker Compose to
orchestrate builds.

At the core, docs are generated with the static site generator
[Hugo](https://gohugo.io/). The `hugo` build command generates static HTML
content from the Markdown files.

- `docs_arangoproxy` - arangoproxy, arangosh
- `docs_site` - hugo, (start_hugo.sh)
- `toolchain` - toolchain.sh (generators)
- `docs_server_<version>` - ArangoDB single server
- `docs_server_<version>_cluster` - ArangoDB cluster

### Render hooks

For headlines, links, images, and fenced
code blocks in Markdown, Hugo can run template files that are called
_Render Hooks_ to trigger special processing. This is used to extract and
execute examples against actual ArangoDB servers and place the output into the
rendered documentation, for example.

#### Link render hook

Defined in `layouts/_default/_markup/render-link.html`.

Scans all the hrefs in a file and tries to retrieve the page from that link.
If the page is not found, the build fails because of a broken link.

#### Image render hook

Defined in `layouts/_default/_markup/render-image.html`.

Transforms the style attributes defined in the image link as
`{path.png?{attribute1=value1&attribute2=value2&..}}` in a style attribute
inside the `img` HTML tag.

#### Codeblock render hook

Defined in `layouts/_default/_markup/render-codeblock-*.html`.

Triggers a remote call to the _arangoproxy_ web server for examples generation
if the code starts with a front matter block surrounded by `---`.

The following codeblocks are supported:

- `` ```js ``
- `` ```aql ``
- `` ```openapi ``
- `` ```curl ``

## Examples generation

### JS/AQL/HTTP Examples

Triggered by the `render-codeblock-js.html`, `render-codeblock-aql.html` and
`render-codeblock-curl.html` hooks.

The content inside the codeblock is comprised of two parts:

- YAML front matter to set options
- The example code

The YAML front matter defines all the metadata regarding the example, like the
example name, version, bind variables, datasets, and more.

Example:

````yaml
```js
---
name: analyzerByName
version: 3.10
render: input/output
---
var analyzers = require("@arangodb/analyzers");
analyzers.analyzer("text_en");
```
````

#### Flow

The hook triggers a `POST` call to the dedicated _arangoproxy_ endpoint
(`/js`, `/aql`, `/curl`) with the entire codeblock as request body.

The _arangoproxy_ endpoint parses the request, checks if the examples is cached,
otherwise executes the code against the ArangoDB instance with the version
defined in the YAML front matter and saves the example output in the cache.

The input/output (as defined in the YAML render option) is returned as JSON to
Hugo in the render hook, which generates HTML replacing the codeblock in the
file with the input/output of the example.

### OpenAPI

Used to describe an HTTP REST API endpoint using the
[OpenAPI Specification](https://spec.openapis.org/oas/latest.html) standard in
version 3.x.

Triggered by the `render-codeblock-openapi.html` hook.

The content inside the codeblock is a standard OpenAPI endpoint description in
YAML format.

Example:

````yaml
```openapi
paths:
  /_api/foxx/readme:
    get:
      description: |
        Fetches the service's README or README.md file's contents if any.
      parameters:
        - name: mount
          schema:
            type: string
          required: true
          description: |
            Mount path of the installed service.
          in: query
      responses:
        '200':
          description: Returned if the request was successful.
        '204':
          description: Returned if no README file was found.
      tags:
        - Foxx
```
````

#### Flow

The hook triggers a `POST` call to the `/openapi` _arangoproxy_ endpoint with
the entire codeblock as request body.

The _arangoproxy_ endpoint parses the request and converts the YAML text to JSON.

The output JSON is written to _arangoproxy_'s `api-docs.json` file. This file is
needed by the web interface team for _Swagger UI_. The JSON is also returned to
Hugo in the render hook, which generates a _rapi-doc_ HTML element with the
specification inside. This becomes an interactive widget in a browser.

## Documentation structure

In the `site/content` directory, the directories `3.10`, `3.11` etc. represent
the individual ArangoDB versions and their documentation. There is only one
maintained version of the documentation for every minor and major version (3.12,
4.0, etc.) but not for every patch release (e.g. 3.12.1).

Having a folder per version has the advantage that all versions can be built at
once, but the drawback of Git cherry-picking not being available and therefore
requiring to manually apply changes to different versions as necessary.

- `site` - Folder with all files that Hugo needs to generate the site
  - `config` - Folder with all files that Hugo needs to generate the site
  - `content` - The Markdown source files in version folders as well as a shared folder for images
  - `data` - Contains JSON and YAML files for the documentation versions, startup options, etc.
  - `public` - Default output directory for the generated site (not committed)
  - `resources` - ?
  - `themes` - Folder for Hugo themes
- `toolchain` - Folder for the docs tools and scripts
  - `arangoproxy`
  - `docker`
  - `scripts`

## Working with the documentation content

### Markup overview

The documentation is written in the light-weight markup language
[Markdown](https://daringfireball.net/projects/markdown/), using the GitHub
flavor, and further extended by Hugo shortcodes for advanced templating needs.

### Content Guidelines

- Use American English spelling, e.g. _behavior_ instead of _behaviour_.

- Use inclusive language, e.g. _work-hours_ instead of _man-hours_.

- Get to point quickly on every page. [Add a Lead Paragraph](#adding-a-lead-paragraph)
  that summarizes what the page is about.

- Target end-users and focus on the outcome. It should be about solutions, not
  features.

- Do not use jargon or technical abbreviations in headlines or the navigation.
  Define the meaning if you use it in the content.

- Do not add too many admonitions or everything ends up being a callout.

### Syntax Guidelines

- Wrap text at 80 characters where possible. This helps tremendously in version
  control. Pre-wrap lines if necessary.

- Put Markdown links on a single line `[link label](target.html#hash)`,
  even if it violates the guideline of 80 characters per line.

- Avoid breaking lines of code blocks and where Markdown does not allow line
  breaks, e.g. in Markdown table rows (you can use `<br>` if really necessary).

- Avoid using `here` as link label. Describe what the link points to instead.

- Avoid overly long link labels, such as entire sentences.

- Use relative links for cross-references to other documentation pages, e.g.
  `../drivers/js/_index.md` instead of `/3.12/drivers/js/_index.md` or
  `https://docs.arangodb.com/3.12/drivers/js/`.

- Avoid `**bold**` and `_italic_` markup in headlines. Inline `` `code` `` is
  acceptable for code values, nonetheless.

- `-` is preferred for bullet points in unordered lists over `*`

- Don't use `#` or `===` for level 1 headlines. Every page should only have
  a single `<h1>` headline, and this is automatically generated from the
  `title` front matter parameter.

- Use `##` for level 2 headlines for new content over `---` underlines.

- There should be a blank line above and below fenced code blocks and headlines
  (except if it is at the top of the document, right after the end of the
  frontmatter `---`).

- Use all lowercase languages in fenced code blocks without whitespace before
  or after the language, and use the following languages in favor of the ones in
  parentheses for consistency:

  - `` ```py `` (instead of `` ```python ``)
  - `` ```yaml `` (instead of `` ```yml ``)
  - `` ```sh `` (instead of `` ```shell ``)
  - `` ```js `` (instead of `` ```javascript ``)
  - `` ``` `` (instead of `` ```plain `` or `` ```text ``)

- Use the exact spelling of Enterprise Edition and its features, as well as for
  all other terms coined by ArangoDB:
  - _EnterpriseGraphs_
  - _SmartGraphs_, _Disjoint SmartGraphs_
  - _SmartGraphs using SatelliteCollection_, not ~~Hybrid SmartGraphs~~
  - _SmartJoins_
  - _OneShard_
  - _Community Edition_
  - _Enterprise Edition_
  - _DB-Server_, not ~~dbserver~~, ~~db-server~~, ~~DBserver~~ (unless it is a code value)
  - _Coordinator_ (uppercase C)
  - _Agent_, _Agency_ (uppercase A)
  - _Active Failover_
  - _Datacenter-to-Datacenter Replication_ (note the hyphens), _DC2DC_
  - _ArangoGraph Insights Platform_ and _ArangoGraph_ for short, but not
    ~~Oasis~~, ~~ArangoDB Oasis~~, or ~~ArangoDB Cloud~~

- Never capitalize the names of executables or code values, e.g. write
  _arangosh_ instead of _Arangosh_.

- Do not write TODOs right into the content and avoid using
  `<!-- HTML comments -->`. Use `{{< comment >}}...{{< /comment >}}` instead.
