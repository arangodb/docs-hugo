# ArangoDB Documentation

This repository contains the source files of the ArangoDB documentation as
published on [docs.arangodb.com](https://docs.arangodb.com/).

The ArangoDB documentation is licensed under Apache-2.0.
See [LICENSE](LICENSE) for details.

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
[create an issue](https://github.com/arangodb/docs-hugo/issues/new).

### Automatic Previews

In every pull request, the _arangodb-docs-automation_ bot comments with a deploy
preview link. Whenever you push a change to the PR branch, a preview is built.
If it succeeds, then you can view the preview hosted on Netlify by following
the link.

Note that the automatic previews run [plain builds](#plain-build), which means
that [generated content](#generated-content) is not updated. The ArangoDB
documentation team takes of regenerating this content if necessary.

### Contributor License Agreement

To accept external contributions, we need you to fill out and sign our
Contributor License Agreement (CLA). We use an Apache 2 CLA for ArangoDB,
which can be found here: <https://www.arangodb.com/documents/cla.pdf>
You can scan and email the CLA PDF file to <cla@arangodb.com> or send it via
fax to +49-221-2722999-88.

## Build the documentation

The following section describes how you can build the documentation locally.
This is not strictly necessary when contributing. You can also rely on
[automatic previews](#automatic-previews) for basic changes.

### The toolchain

At the core, docs are generated with the static site generator
[Hugo](https://gohugo.io/). The `hugo` build command generates static HTML
content from the Markdown, data, and theme files.

The documentation toolchain is containerized and uses Docker Compose to
orchestrate builds. The following containers are created:

- `toolchain` - contains the code for controlling the toolchain and the
  generated content, spawning the other containers
- `docs_arangoproxy` - contains the arangoproxy web server written in Go that
  handles generated content using arangosh to run examples against a server and
  assemble the OpenAPI descriptions
- `docs_site` - contains Hugo and the logic to start it
- `docs_server_<version>` - an ArangoDB single server
- `docs_server_<version>_cluster` - an ArangoDB cluster

### Render hooks

For headlines, links, images, and fenced code blocks in Markdown, Hugo can run
template files that are called _Render Hooks_ to trigger special processing.
This is used to extract and execute examples against actual ArangoDB servers and
place the output into the rendered documentation, for example.

- **Heading render hook**

  Defined in `site/themes/arangodb-docs-theme/layouts/_default/_markup/render-heading.html`

  Checks that there is no level 1 `# Headline` in the content, as this is
  reserved for the `title` defined in the front matter. Also injects the widget
  to copy anchor links to the clipboard.

- **Link render hook**

  Defined in `site/themes/arangodb-docs-theme/layouts/_default/_markup/render-link.html`

  Scans all the hrefs in a file and tries to retrieve the page from that link.
  If the page is not found, the build fails because of a broken link.

- **Image render hook**

  Defined in `site/themes/arangodb-docs-theme/layouts/_default/_markup/render-image.html`

  Transforms the style attributes defined in the image link as
  `{path.png?{attribute1=value1&attribute2=value2&..}}` in a style attribute
  inside the `img` HTML tag.

- **Codeblock render hook**

  Defined in `site/themes/arangodb-docs-theme/layouts/_default/_markup/render-codeblock-*.html`

  Triggers a remote call to the _arangoproxy_ web server for assembling the
  OpenAPI descriptions as well as to run the example generation if the code
  starts with a front matter block surrounded by `---`, like this:

  ````markdown
  ```aql
  ---
  name: the_answer
  description: AQL block with front matter
  ---
  RETURN 42
  ```
  ````

  The following codeblocks are supported:

  - `` ```js `` for arangosh / JavaScript API examples
  - `` ```aql `` for AQL query examples
  - `` ```openapi `` for REST HTTP API descriptions
  - `` ```curl `` for REST HTTP API examples

The hooks trigger a `POST` call to the dedicated _arangoproxy_ endpoint
(`/js`, `/aql`, `/curl`, `openapi`) with the entire codeblock as request body.

The _arangoproxy_ endpoint parses the request, checks if the examples is cached,
otherwise executes the code against the ArangoDB instance with the version as
determined from the version folder name and saves the example output in the cache.

The input/output (as defined in the YAML render option) is returned as JSON to
Hugo in the render hook, which generates HTML replacing the codeblock in the
file with the input/output of the example.

### Build workflows

The following build workflows exist:

- **Plain build workflow**

  Build docs without re-generating examples (using a committed cache file).

  Includes the assembly of the REST HTTP API descriptions (OpenAPI) with
  validation at each run. `` ```curl `` examples require a different workflow.

  You may need to specify upstream branches.

- **Scheduled workflow**

  The following generated content is re-generated periodically using CircleCI:
  - Metrics
  - Error codes and meanings
  - AQL optimizer rules
  - Startup options
  - oasisctl documentation

- **Example generation workflow**

  Build docs including re-generating examples for AQL, arangosh (JavaScript API),
  and cURL (HTTP API).

  Specifying upstream branches is required for all versions in which you modified
  example code and thus require a re-generation. These can be a Docker Hub images
  or GitHub pull request links.

#### Plain build

Go to the `toolchain/docker/<architecture>` folder, with `<architecture>` being
either `amd64` for x86-64 CPUs and `arm64` for 64-bit ARM CPUs (including
Apple silicon like M1).

Run the `docker compose` services using the `docker-compose.pain-build.yml` file.

```shell
docs-hugo/toolchain/docker/amd64> docker compose -f docker-compose.plain-build.yml up
```

The site will be available at `http://localhost:1313`.

#### Scheduled and example generation build

**Configuration**

The toolchain container needs to be set up via config file in `toolchain/docker/config.yaml`:

```yaml
generators:   # Generators to trigger - empty string defaults to all generators
servers:      # Array to define arangodb servers to be used by the toolchain
  - image:    # arangodb docker image to be used, can be arangodb/enterprise-preview:... or a branch name
    version:  # docs branch to put the generated content into
  - ...       # Additional images and versions as needed
```

**Available generators**

- `examples`
- `metrics`
- `error-codes`
- `optimizer`
- `options`
- `oasisctl`

The generators entry is a space-separated string.

If `metrics` or `error-codes` is in the `generators` string, the following
environment variable has to be exported:

```shell
export ARANGODB_SRC_{VERSION}=path/to/arangodb/source
```

Substitute `{VERSION}` with a version number like `3_11`.

On Windows using PowerShell, use a Unix-like path:

```powershell
$Env:ARANGODB_SRC_3_11 = "/Drive/path/to/arangodb"
```

**Configuration example**

```yaml
generators: examples oasisctl options optimizer
servers:
  - image: arangodb/enterprise-preview:3.11-nightly
    version: "3.11"
  - image: arangodb/enterprise-preview:devel-nightly
    version: "3.12"
```

**Run the toolchain**

Go to the `toolchain/docker/<architecture>` folder, with `<architecture>` being
either `amd64` for x86-64 CPUs and `arm64` for 64-bit ARM CPUs (including
Apple silicon like M1).

Run the `docker compose` services without specifying a file:

```shell
docs-hugo/toolchain/docker/arm64> docker compose up
```

The site will be available at `http://localhost:1313`

## Work with the documentation content

### Documentation structure

In the `site/content` directory, the directories `3.10`, `3.11` etc. represent
the individual ArangoDB versions and their documentation. There is only one
maintained version of the documentation for every minor and major version (3.12,
4.0, etc.) but not for every patch release (e.g. 3.12.1).

Having a folder per version has the advantage that all versions can be built at
once, but the drawback of Git cherry-picking not being available and therefore
requiring to manually apply changes to different versions as necessary.

- `site/` - Folder with all files that Hugo needs to generate the site
  - `config/` - The base Hugo configuration in `_default/` as well as additional
    configurations for different build workflows
  - `content/` - The Markdown source files in version folders as well as a
    shared folder for images
  - `data/` - Contains JSON and YAML files for the documentation versions,
    the OpenAPI tag list, the example cache, etc.
  - `public/` - Default output directory for the generated site (not committed)
  - `resources/` - Holds the various cached resources that are generated by Hugo
    when using `hugo serve`
  - `themes/` - Folder for Hugo themes, containing the customized ArangoDB docs theme
- `toolchain/` - Folder for the docs toolchain tools and scripts
  - `arangoproxy/` - Source code of the arangoproxy web server
  - `docker/` - The Docker container and compose files, with two sets of
    configurations for the `amd64` and `arm64` architectures that are needed for
    the scheduled and example generation build workflows
  - `scripts/` - The toolchain scripts

### Markup overview

The documentation is written in the light-weight markup language
[Markdown](https://daringfireball.net/projects/markdown/), using the GitHub
flavor, and further extended by Hugo _shortcodes_ for advanced templating needs.

For an overview over the basic markup, see the [CommonMark help](https://commonmark.org/help/).

The following extensions are available:

#### Admonitions

You can use admonitions for hints and callouts that render in a colored box with
an icon, highlighting useful or important information.

```markdown
{{< danger >}}
Critical information to prevent data loss or similarly impactful events.
{{< /danger >}}
```

```markdown
{{< warning >}}
Be careful and mind restrictions to avoid issues.
{{< /warning >}}
```

```markdown
{{< security >}}
Mind this information to keep the system and your data safe.
{{< /security >}}
```

```markdown
{{< info >}}
Helpful information to have.
{{< /info >}}
```

```markdown
{{< tip >}}
Follow best practices and utilize features to set yourself up for success.
{{< /tip >}}
```

Admonitions can also be used in `description` fields inside of `` ```openapi ``
code blocks but the syntax then needs to be like this:

````yaml
```openapi
paths:
  /_api/endpoint:
    post:
      description: |
        {{</* warning */>}}
        Admonition inside of REST HTTP API description.
        {{</* /warning */>}}
        ...
```
````

Admonitions inside of other shortcodes need to use the special syntax, too:

```markdown
{{< expand title="Outer shortcode" >}}

{{</* tip */>}}
Inner shortcode
{{</* /tip */>}}

{{< /expand >}}
```

#### Tags

Tags let you display badges, usually below a headline.

This is mainly used for pointing out if a feature is only available in the
Enterprise Edition of ArangoDB, the ArangoGraph Insights Platform, or both.
See [Edition remarks](#edition-remarks) for details.

#### Tabs

Display content with a tabbed interface, like information for different
operating systems or code examples using different languages.

```markdown
{{< tabs groupid="os" >}}

{{< tab name="Linux" >}}
Run `./script.sh`.
{{< /tab >}}

{{< tab name="Windows" >}}
Run `.\script.ps1`.
{{< /tab >}}

{{< /tabs >}}
```

#### Figures

If you want to add an image with a caption, use this shortcode instead of the
native Markdown syntax `![alt](/images/file.png)`:

```markdown
{{< image src="../images/file.png" alt="Description of image content, used as caption" >}}
```

Available attributes:

- `src`: location of the image file
- `class`: CSS class to apply
- `style`: CSS inline styles to apply
- `size`: image width, can be numeric or one of `small`, `medium`, `large`
- `alt`: image description for accessibility

#### Icons

Display an image with special styling.

```markdown
{{< icon src="../images/file.png" alt="Description of image content, used by screen readers" >}}
```

Available attributes:

- `src`: location of the image file
- `class`: CSS class to apply
- `style`: CSS inline styles to apply
- `size`: image width, can be numeric or one of `small`, `medium`, `large`
- `alt`: image description for accessibility

#### Cards

To prominently link to other content, you may use cards:

```markdown
{{< cards >}}

{{% card title="Graphs" link="graphs/" icon="/images/file.png" %}}
Learn everything about graphs.
{{% /card %}}

{{% card title="Data science" link="data-science/" icon="/images/file.png" %}}
Read about ArangoDB's features for analytics.
{{% /card %}}

{{< /cards >}}
```

#### Comments

If you want to place a remark in the source files that should not end up in the
generated output, you can use a comment as follows:

```markdown
{{% comment %}}
Content or reminder that should not be rendered.
{{% /comment %}}
```

#### Special shortcodes

The following shortcodes also exist but are rarely used:

- ```markdown
  {{< expand title="A short description" >}}
  Content that is collapsed by default but can be expanded.
  {{< /expand >}}
  ```

- `{{< youtube id="dQw4w9WgXcQ" >}}` can be used to embed a single YouTube video,
  and `{{< youtube-playlist id="PL0tn-TSss6NV45d1HnLA57VJFH6h1SeH7" >}}`
  for a YouTube playlist.

- `{{% optimizer-rules %}}` is used once to render the list of AQL optimizer
  rules from a JSON source file.

- `{{% program-options name="arangod" %}}` renders the startup options of a
  component like the ArangoDB server (`arangod`) or shell (`arangosh`).

- `{{% error-codes %}}` renders the ArangoDB server error codes and their meaning.

- `{{% metrics %}}` renders the list of ArangoDB server metrics.

### Content Guidelines

- Use American English spelling, e.g. _behavior_ instead of _behaviour_.

- Use inclusive language, e.g. _work-hours_ instead of _man-hours_.

- Get to point quickly on every page. [Add lead paragraphs](#add-lead-paragraphs)
  that summarizes what the page is about.

- Target end-users and focus on the outcome. It should be about solutions, not
  features.

- Do not use jargon or technical abbreviations in headlines or the navigation.
  Define the meaning if you use it in the content.

- Do not add too many admonitions or everything ends up being a callout.

### Syntax Guidelines

- Wrap text at 80 characters where possible. This helps tremendously in version
  control. Pre-wrap lines if necessary.

- Put Markdown links on a single line `[link label](target.md#hash)`,
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

- Use `##` for level 2 headlines, not `---` underlines.

- There should be a blank line above and below fenced code blocks and headlines
  (except if it is at the top of the document, right after the end of the
  front matter `---`).

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

### Add links

For external links, use standard Markdown. Clicking these links automatically
opens them in a new tab:

```markdown
[ArangoGraph Insights Platform](https://cloud.arangodb.com)
```

For internal links, use relative paths to the Markdown files. Always link to
files, not folders (e.g. `../graphs/_index.md` instead of `../graphs/`).
This way, links can be followed in tools like Visual Studio Code and on GitHub.

```markdown
[Graphs](../graphs/_index.md)
```

For anchor links, append `#fragment-identifier` to the path if the content is
in a different file, or use the fragment ID only to link to a headline in the
same file:

```markdown
See [Named Graphs](#named-graphs)
```

### Version Remarks

The main page about a new feature should indicate the version the feature was
added in, as shown below:

```markdown
---
title: New feature
...
---
<small>Introduced in: v3.12.0</small>

...
```

Similarly, the remark should be added if only a section is added to an existing
page, as shown below:

```markdown
## Existing feature

...

### New feature section

<small>Introduced in: v3.12.0</small>

...
```

The value `v3.12.0` implies that all later versions also have this feature
(3.12.1, 3.12.2, etc., as well as 4.0.0 and later). If this is not the case,
then also mention the other relevant versions. For example, if a feature is
added to 3.11.5 and 3.12.2, then write the following in the 3.12 documentation:

```markdown
<small>Introduced in: v3.11.5, v3.12.2</small>
```

All later documentation versions should use a copy of the content, as thus the
4.0 documentation would contain the same.

In the 3.11 documentation, only mention versions up to this documentation version
(excluding 3.12 and later in this example), pretending no later version exists
to be consistent with the rest of the 3.11 documentation and to avoid additional
maintenance burdens:

```markdown
<small>Introduced in: v3.11.5</small>
```

New options in the JavaScript and HTTP APIs are covered by the release notes,
but if new options are added mid-release (not in the `x.x.0` release but a later
bugfix version), then this should be pointed out as follows:

```markdown
- `existingOption` (number, _optional_): ...
- `newOption` (string, _optional_): ... (introduced in v3.11.5, v3.12.2).
```

You may also add a remark if an existing feature or option is significantly
extended by a new (sub-)option in a `x.x.0` release.

While version remarks are mostly `Introduced in: ...`, you can also mark
deprecated features in the same manner with `Deprecated in: ...`.

### Edition Remarks

Pages and sections about Enterprise Edition features should indicate that the
Enterprise Edition is required using a hint box. Use the following include in
the general case:

```markdown
{{< tag "ArangoDB Enterprise Edition" "ArangoGraph" >}}
```

This shortcode should be placed immediately after a headline, before any version
remarks (`<small>Introduced in: ...</small>`).

To tag options in lists, place the shortcode as follows:

```markdown
- **optionName** (data type):

  {{< tag "ArangoDB Enterprise Edition" "ArangoGraph" >}}

  Version remarks and description of the option
```

Most Enterprise Edition features are also available in ArangoGraph, but some
features are not or in a different form (e.g. DC2DC, Hot Backup). If a feature
is not available in ArangoGraph, use the following include instead:

```markdown
{{< tag "ArangoDB Enterprise Enterprise" >}}
```

In the release notes, add the following at the end of a section about a new
Enterprise Edition feature:

```markdown
This feature is only available in the Enterprise Edition.
```

HTTP API options, that is options described in an `` ```openapi `` code block,
should have a remark as follows if they are only available in the Enterprise Edition:

```markdown
- `enterpriseOption` (boolean, _optional_): ...
  (Enterprise Edition only).
```

If there are both a version remark and an Enterprise Edition remark, use:

```markdown
- `enterpriseOption` (boolean, _optional_): ...
  (introduced in v3.11.5 and v3.12.2, Enterprise Edition only).
```

### Add lead paragraphs

A lead paragraph is the opening paragraph of a written work that summarizes its
main ideas. Only few pages have one so far, but new content should be written
with such a brief description. It is supposed to clarify the scope of the
article so that the reader can quickly assess whether the following information
is of relevance, but also acts as an introduction.

You can set the lead paragraph via the `description` parameter in the
front matter of a page:

```markdown
---
title: Feature X
description: >-
  You can do this and that with X, and it is ideal to solve problem Y
---
...
```

The lead paragraph text should end without a period, contain no links, and
usually avoid other markup as well. However, **bold**, _italic_, and
`inline code` are acceptable.

### Add a page or section

Start off by finding a file name. It should be:

- All lower-case
- Use hyphen-minus `-` instead of spaces
- Be very short but descriptive
- Follow the patterns of existing files

Note that the file name is independent of what will show in the navigation or
what will be used as headline for that page. The file name will be used as
part of the final URL, however. For example, `3.12/aql/examples.md` will become
`http://docs.arangodb.com/3.12/aql/examples/`.

Create a new file with the file name and a `.md` file extension. Open the file
in a text editor (Visual Studio Code is recommended). Add the following
front matter:

```yaml
---
archetype: default # or 'chapter' if it is a _index.md section file
title: The level 1 headline
description: >-
  A meaningful description of the page
menuTitle: Short navigation menu title
weight: 42 # controls navigation position within the current section (low to high)
---
```

Add the actual content formatted in Markdown syntax below the front matter.

### Rename a page or section

Netlify supports server-side redirects configured with a text file
([documentation](https://docs.netlify.com/routing/redirects/#syntax-for-the-redirects-file)).
This is helpful when renaming folders with many subfolders and files because
there is support for splatting and placeholders (but not regular expressions). See
[Redirect options](https://docs.netlify.com/routing/redirects/redirect-options/)
for details. The configuration file is `site/content/_redirects`.

Otherwise, the following steps are necessary for moving content:
1. Rename file or folder
2. Set up `aliases` via the front matter as needed
3. Adjust `weight` of pages in the front matter if necessary
4. Update cross-references in all of the content to use the new file path

The URL of a page is derived from the file name and the parent folders, with
special handling for sections (folders with a `_index.md` file).
For example, `3.12/aql/operators.md` becomes the URL path `/3.12/aql/operators/`,
and `3.12/aql/functions/_index.md` becomes `/3.12/aql/functions/`.

If you rename a file, from `section/old-name.md` to `section/new-name.md` for
instance, make sure to add a redirect for the old URL by adding the following to
the front matter of `section/new-name.md`:

```yaml
aliases:
  - old-name
```

Don't forget to update any references to the old file in the content to the new
path.

If you move a file from one folder to another, from `old/file.md` to `new/file.md`
for instance, use a relative path as shown below:

```yaml
aliases:
  - ../old/file
```

If you rename a folder, from `old/` to `new/` for instance, add the following
front matter to `new/_index.md`:

```yaml
aliases:
  - old
```

For aliases in `_index.md` files, think of the folder they are in as a file.
In the above example, the folder is `new/`. Treating it like the file that
defines the page means that the alias `old` is relative to its parent folder
(here: the root folder of the content, `site/content/`). Therefore, the alias
needs to be `old`, not `../old`.

Note that you need to set up aliases for all files in `new/` so that every URL
which includes the old folder name redirects to the corresponding new URL.
For example, for a file `new/other.md` (previously `old/other.md`), add the
following:

```yaml
aliases:
  - ../old/other
```

Aliases create HTML files with client-side redirects before any content is
rendered to HTML, which means that aliases can get overwritten by content files.
If this is not a mistake, the affected aliases should be removed.

### Disable or limit the table of contents

The table of contents (ToC) or "On this page" on the right-hand side at the top
of a page lists the headlines if there are at least two headlines on the page
(excluding the title).

The ToC can be restricted to a maximum headline level to omit the deeper nested
headlines for less clutter:

```yaml
---
...
pageToc:
  maxHeadlineLevel: 3
---
```

A setting of `3` means that `<h1>`, `<h2>`, and `<h3>` headlines will be listed
in the ToC, whereas `<h4>`, `<h5>`, and `<h6>` will be ignored.

### Deprecate a version

When an ArangoDB version reaches [End-of-Life](https://www.arangodb.com/subscriptions/end-of-life-notice/),
its documentation needs to be marked as such. For the respective version, set
the `deprecated` attribute to `true` in the `site/data/versions.yaml` file:

```diff
 - name: '3.10'
   version: '3.10.9'
   alias: ""
-  deprecated: false
+  deprecated: true
```

It makes a warning show at the top of every page for that version.

<!--
### Add a new version

TODO: Pending CircleCI dynamic config
-->

### Add a new arangosh example

A complete example:

````markdown
```js
---
name: ensureUniquePersistentSingle
description: Create a unique persistent index on a single document attribute
---
~db._create("ids");
db.ids.ensureIndex({ type: "persistent", fields: [ "myId" ], unique: true });
db.ids.save({ "myId": 123 });
db.ids.save({ 
  "myId": 123
}); // xpError(ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED)
~db._drop("ids");
```
````

Groups of examples should have the same name prefix.

If an example needs to be run against an ArangoDB cluster instead of a
single server (default), then add the following front matter option:

```yaml
type: cluster
```

To not render the transcript comprised of input and output but only the input
or output, set the `render` front matter option:

```yaml
render: input # or 'output', default 'input/output'
```

After the front matter, you can write the JavaScript code for arangosh:

```js
db._create("collection");
db.collection.save({ _key: "foo", value: 123 });
db._query(`FOR doc IN collection RETURN doc.value`).toArray();
db._drop("collection");
```

Statements can span multiple lines:

```js
db.collection.save([
  { multiple: true },
  { lines: true }
]);
```

The statements as well as the results will be visible in the example transcript.
To hide certain statements from the output, e.g. for setup/teardown that is not
relevant for the example, you can use a leading tilde `~` to suppress individual
lines:

```js
~db._create("collection");
db.collection.save({ _key: "foo" });
~db._drop("collection");
```

Examples need to remove the collections and Views they create. Not dropping them
will raise an error unless they are specifically exempt:

```js
~db._create("collection");
~db._createView("view", "arangosearch", {...});
db.collection.save({...});
~addIgnoreView("view");
~addIgnoreCollection("collection");
```

This is helpful for creating collections and Views once, using them in multiple
examples, and finally dropping them instead of having to create and drop them
in each example.

<!-- TODO: Does Hugo guarantee to invoke the render hooks one after another,
top to bottom of a page, and do this serially?

You need to choose the names for the examples so that they are alphabetically
sortable to have them execute in the correct order.
-->

The last example of the series should undo the ignore to catch unintended leftovers:

```js
~removeIgnoreCollection("collection");
~removeIgnoreView("view");
~db._dropView("view");
~db._drop("collection");
```

Note that a series of examples needs to be contained within a single file.

If a statement is expected to fail (e.g. to demonstrate the error case), then
this has to be indicated with a special JavaScript comment:

```js
db._document("collection/does_not_exist"); // xpError(ERROR_ARANGO_DOCUMENT_NOT_FOUND)
```

This will make the example generation continue despite the error. See
[Error codes and meanings](https://docs.arangodb.com/3.12/develop/error-codes-and-meanings/)
for a list of all error codes and their names. If a unexpected error is raised,
then the example generation will abort with an error.

Every backslash in a query needs to be escaped with another backslash, i.e.
JSON escape sequences require two backslashes, and literal backslashes four:

```js
db._query(`RETURN REGEX_SPLIT("foo\\t bar\\r baz\\n foob", "\\\\s+|(?:b\\\\b)")`).toArray();
```

This does not apply to backslashes in bind variables:

```js
db._query(`RETURN REGEX_SPLIT(@t, @r)`, {t: "foo\t bar\r baz\n foob", r: "\\s+|(?:b\\b)"}).toArray();
```

### Add a new AQL example

Complete example:

````yaml
```aql
---
name: joinTuples
description:
bindVars: {
  friend: "friend"
}
dataset: joinSampleDataset
explain: true
---
FOR u IN users
  FILTER u.active == true
  LIMIT 0, 4
  FOR f IN relations
    FILTER f.type == @friend && f.friendOf == u.userId
    RETURN {
      "user" : u.name,
      "friendId" : f.thisUser
    }
```
````

An example can optionally specify a `dataset` in the front matter that will be
loaded before the query is run:

```yaml
dataset: name_of_dataset
```

See [datasets.json](toolchain/arangoproxy/internal/utils/)
for the available datasets.

To get the query explain output including the execution plan instead of the
actual query result, you can optionally specify the `explain` option in the
front matter:

```yaml
explain: true
```

Then the actual AQL query follows, e.g.

```
FOR i IN 1..3
  RETURN i
```

The query can optionally use bind parameters that can be set via the `bindVars`
option in the front matter:

```yaml
---
...
bindVars:
  '@coll': products
  attr:
    - title
    - de
# or using JSON notation:
#bindVars: { "@coll": "products", "attr": ["title", "de"] }
---
FOR doc IN @@coll
  RETURN doc.@attr
```

### Add a new OpenAPI endpoint description

Used to describe an HTTP REST API endpoint using the
[OpenAPI Specification](https://spec.openapis.org/oas/latest.html) standard in
version 3.1.0.

The content inside the codeblock is a standard OpenAPI endpoint description in
YAML format for a single ArangoDB endpoint. The headline above the code block is
also used as the endpoint summary automatically:

````yaml
### Get the service README

```openapi
paths:
  /_api/foxx/readme:
    get:
      operationId: getFoxxReadme
      description: |
        Fetches the service's README or README.md file's contents if any.
      parameters:
        - name: mount
          in: query
          required: true
          description: |
            Mount path of the installed service.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returned if the request was successful.
        '204':
          description: |
            Returned if no README file was found.
      tags:
        - Foxx
```
````

Only define a single tag in `tags` as this is used to categorize the endpoints.
See the [`openapi_tags.yaml`](site/data/openapi_tags.yaml) file for the available
categories, or add new ones if necessary.

The REST HTTP API endpoint descriptions are rendered in the documentation, but
_arangoproxy_ also converts the YAML to JSON and assembles a single `api-docs.json`
file. This file is needed by the web interface for _Swagger UI_.

### Add a new cURL example

Complete example:

````
```curl
---
name: HttpAqlToBase64
description: Encode example credentials using the HTTP API
---
var url = "/_api/cursor";
var body = { query: `RETURN TO_BASE64("user:pass")` };
var response = logCurlRequest('POST', url, body);
assert(response.code === 201);
logJsonResponse(response);
```
````

Unlike arangosh examples (`` ```js ``), requests and responses
need to be output explicitly by calling one of the following functions:

- `logCurlRequest(method, url, body) → response`: make and output an HTTP request
- `logCurlRequestRaw(method, url, body) → response`: make and output an HTTP
  request without code highlighting
- `logCurlRequestPlain(method, url, body) → response`: make and output an HTTP
  request, with the payload decoded (new lines instead of `\r\n` etc.). Useful
  for formatting complex requests.
- `logJsonResponse(response)`: output a JSON server reply (fails on invalid JSON)
- `logJsonLResponse(response)`: output a JSONL server reply (fails on invalid JSON)
- `logRawResponse(response)`: output plaintext response (do not use for JSON replies)
- `logPlainResponse(response)`: output decoded response (new lines instead of
  `\r\n` etc.). Useful for formatting complex responses, like from batch requests.
- `logHtmlResponse(response)`: output HTML
- `logErrorResponse(response)`: dump reply to error log for testing
  (makes example generation fail)

To test whether requests and replies are as expected, you can add
`assert(expression)` calls. Expressions that evaluate to false will make the
example generation fail. You can inspect the CircleCI logs for details.
