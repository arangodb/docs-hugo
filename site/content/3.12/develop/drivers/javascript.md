---
title: ArangoDB JavaScript driver
menuTitle: JavaScript driver
weight: 25
description: >-
  arangojs is the JavaScript driver to access ArangoDB from outside the
  database system, primarily with Node.js
aliases:
  - nodejs # 3.12 -> 3.12
---
The official ArangoDB low-level JavaScript client.

- Repository: <https://github.com/arangodb/arangojs>
- Reference: <http://arangodb.github.io/arangojs/>
- [Changelog](https://github.com/arangodb/arangojs/blob/main/CHANGELOG.md)

{{< info >}}
If you are looking for the ArangoDB JavaScript API in
[Foxx](https://www.arangodb.com/community-server/foxx/) or the `arangosh`
interactive shell, please refer to the documentation about the
[`@arangodb` module](../javascript-api/@arangodb/_index.md) instead.

The JavaScript driver is **only** meant to be used when accessing ArangoDB from
**outside** the database.
{{< /info >}}

## Compatibility

The arangojs driver is compatible with the latest stable version of ArangoDB
available at the time of the driver release and remains compatible with the two
most recent Node.js LTS versions in accordance with the official
[Node.js long-term support schedule](https://github.com/nodejs/LTS).
Versions of ArangoDB that have reached their [end of life](https://arangodb.com/subscriptions/end-of-life-notice/)
by the time of a driver release are explicitly not supported.

The [_arangoVersion_ option](https://arangodb.github.io/arangojs/latest/types/configuration.ConfigOptions.html)
can be used to tell arangojs to target a specific
ArangoDB version. Depending on the version this will enable or disable certain
methods and change behavior to maintain compatibility with the given version.
The oldest version of ArangoDB supported by arangojs when using this option
is 2.8.0 (using `arangoVersion: 20800`).

## Versions

The version number of this driver does not indicate supported ArangoDB versions!

This driver uses semantic versioning:

- A change in the bugfix version (e.g. X.Y.0 -> X.Y.1) indicates internal
  changes and should always be safe to upgrade.
- A change in the minor version (e.g. X.1.Z -> X.2.0) indicates additions and
  backwards-compatible changes that should not affect your code.
- A change in the major version (e.g. 1.Y.Z -> 2.0.0) indicates _breaking_
  changes that require changes in your code to upgrade.

If you are getting weird errors or functions seem to be missing, make sure you
are using the latest version of the driver and following documentation written
for a compatible version. If you are following a tutorial written for an older
version of arangojs, you can install that version using the `<name>@<version>`
syntax:

```sh
# for version 9.x.x
yarn add arangojs@9
# - or -
npm install --save arangojs@9
```

You can find the documentation for each version by clicking on the corresponding
date on the left in
[the list of version tags](https://github.com/arangodb/arangojs/tags).

## Install

{{< tabs "js-install" >}}

{{< tab "Yarn" >}}
```sh
yarn add arangojs
```
{{< /tab >}}

{{< tab "NPM" >}}
```sh
npm install --save arangojs
```
{{< /tab >}}

{{< tab "From source" >}}
```bash
git clone https://github.com/arangodb/arangojs.git
cd arangojs
npm install
npm run build
```

Building natively on Windows is not supported but you can use a virtual Linux
or Linux container.
{{< /tab >}}

{{< tab "For browsers" >}}
When using modern JavaScript tooling with a bundler and compiler (e.g. Babel),
arangojs can be installed using NPM or Yarn like any other dependency.

You can also use [jsDelivr CDN](https://www.jsdelivr.com/) during development:

```js
<script type="importmap">
  {
    "imports": {
      "arangojs": "https://cdn.jsdelivr.net/npm/arangojs@10.1.0/esm/index.js?+esm"
    }
  }
</script>
<script type="module">
  import { Database } from "arangojs";
  const db = new Database();
  // ...
</script>
```
{{< /tab >}}

{{< /tabs >}}

## Basic usage example

Modern JavaScript/TypeScript with async/await and ES Modules:

```js
import { Database, aql } from "arangojs";

const db = new Database();
const Pokemons = db.collection("my-pokemons");

async function main() {
  try {
    const pokemons = await db.query(aql`
      FOR pokemon IN ${Pokemons}
      FILTER pokemon.type == "fire"
      RETURN pokemon
    `);
    console.log("My pokemans, let me show you them:");
    for await (const pokemon of pokemons) {
      console.log(pokemon.name);
    }
  } catch (err) {
    console.error(err.message);
  }
}

main();
```

Using a different database:

```js
const db = new Database({
  url: "http://127.0.0.1:8529",
  databaseName: "pancakes",
  auth: { username: "root", password: "hunter2" },
});

// The credentials can be swapped at any time
db.useBasicAuth("admin", "maplesyrup");
```

Old-school JavaScript with promises and CommonJS:

```js
var arangojs = require("arangojs");
var Database = arangojs.Database;

var db = new Database();
var pokemons = db.collection("pokemons");

db.query({
  query: "FOR p IN @@c FILTER p.type == 'fire' RETURN p",
  bindVars: { "@c": "pokemons" },
})
  .then(function (cursor) {
    console.log("My pokemons, let me show you them:");
    return cursor.forEach(function (pokemon) {
      console.log(pokemon.name);
    });
  })
  .catch(function (err) {
    console.error(err.message);
  });
```

For AQL, please check out the
[aql template tag](https://arangodb.github.io/arangojs/latest/functions/aql.aql.html)
for writing parametrized AQL queries without making your code vulnerable to
injection attacks.

## Error responses

If the server returns an ArangoDB error response, arangojs throws an `ArangoError`
with an `errorNum` property indicating the
[ArangoDB error code](../error-codes-and-meanings.md) and expose the response body
as the response property of the error object.

For all other errors during the request/response cycle arangojs throws a
`NetworkError` or a more specific subclass thereof and expose the originating
request object as the `request` property of the error object.

If the server responded with a non-2xx status code, this `NetworkError` is an
`HttpError` with a code property indicating the HTTP status code of the response
and a response property containing the `response` object itself.

If the error is caused by an exception, the originating exception is available
as the `cause` property of the error object thrown by arangojs.
For network errors, this is often a `TypeError`.

**Example**

```js
try {
  const info = await db.createDatabase("mydb");
  // database created
} catch (err) {
  console.error(err.stack);
}
```
