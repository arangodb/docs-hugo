# ArangoDB Docs Toolchain

## How it works

The `hugo` build command generates static HTML content from the Markdown files.

The resulting static HTML is then deployed to Netlify.

While in the Hugo build phase, some special files called _Render Hooks_ trigger
special functions when certain kinds of content is found in a file.
These are divided into link, image, and codeblock render hooks.

### Link Render Hook

Defined in `layouts/_default/_markup/render-link.html`.

Scans all the hrefs in a file and tries to retrieve the page from that link.
If the page is not found, the build fails because of a broken link.

### Image Render Hook

Defined in `layouts/_default/_markup/render-image.html`.

Transforms the style attributes defined in the image link as
`{path.png?{attribute1=value1&attribute2=value2&..}}` in a style attribute
inside the `img` HTML tag.

### Codeblock Render Hook

Defined in `layouts/_default/_markup/render-codeblock-*.html`.

Triggers a remote call to the _arangoproxy_ web server for examples generation.

The following codeblocks are supported:

- `` ```js ``
- `` ```aql ``
- `` ```openapi ``
- `` ```http-example ``

## Examples generation

### JS/AQL/HTTP Examples

Triggered by the `render-codeblock-js.html`, `render-codeblock-aql.html` and
`render-codeblock-http-example.html` hooks.

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
(`/js`, `/aql`, `/http-example`) with the entire codeblock as request body.

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
      description: |+
        Fetches the service's README or README.md file's contents if any.
      parameters:
      - name: mount
        schema:
          type: string
        required: true
        description: |2+
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
