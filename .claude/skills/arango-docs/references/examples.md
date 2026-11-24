# Generated examples

Condensed from the repository README (Add a new arangosh/AQL/cURL example). If
this file and the README disagree, the README wins. Update this file to match.

The toolchain runs these code blocks against a live server and renders the
output. They need the front matter shown here.

## Common rules

- `name` is unique across the docs. Examples in a group share a name prefix.
- `description` holds what the example shows. For new examples, put the
  description here instead of in prose around the block, so the renderer can
  group description, input, and output. Existing blocks often have
  `description: ''`; don't backfill unless asked.
- `type: cluster` runs the example against a cluster instead of a single server.
- `render: input` or `render: output` shows only one side.
- Use plausible ArangoDB data: collections like `customers`, `orders`,
  `follows`. Not foo/bar or John Doe.

## arangosh (`js`)

````markdown
```js
---
name: ensureUniquePersistentSingle
description: Create a unique persistent index on a single document attribute
---
~db._create("ids");
db.ids.ensureIndex({ type: "persistent", fields: [ "myId" ], unique: true });
db.ids.save({ "myId": 123 }); // xpError(ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED)
```
````

- `~` hides a line from the output (setup and teardown).
- `// xpError(ERROR_NAME)` marks an expected error. Unexpected errors fail the
  build.
- The toolchain removes created collections, Views, graphs, Analyzers, users,
  databases, and tasks after each example. Indexes on existing collections and
  server settings are not reset, so undo them.
- To reuse a resource in later examples on the same page:
  `~addIgnoreCollection("name")` (also `addIgnoreView`, `addIgnoreGraph`, and so
  on), ended with `~removeIgnoreCollection("name")`.
- Use `~assert(...)` when the effect isn't visible in the output.
- Create test data in batches with AQL, not one insert per document.
- Escape every backslash in a query string once more: `\\t` for a tab, `\\\\s`
  for a regex `\s`. Not needed in bind variables.

## AQL (`aql`)

````markdown
```aql
---
name: joinTuples
description: ''
bindVars: { "friend": "friend" }
dataset: joinSampleDataset
explain: true
---
FOR u IN users
  RETURN u
```
````

- `dataset` loads data from
  `toolchain/arangoproxy/internal/utils/datasets.json` first.
- `explain: true` renders the execution plan instead of the result.
- Escape backslashes by AQL rules only (`\\d` for a regex `\d`), the way you'd
  type it in the web interface's query editor.

## HTTP (`curl`)

````markdown
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

- Output is explicit: `logCurlRequest(method, url, body)` for the request,
  `logJsonResponse(response)` (or `logRawResponse`, `logPlainResponse`,
  `logJsonLResponse`, `logHtmlResponse`) for the reply.
- Use `/_db/_system/...` in the URL when the endpoint needs the `_system`
  database.
- `assert(...)` the status code.
