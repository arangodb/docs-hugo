---
title: ArangoDB JavaScript driver
menuTitle: JavaScript driver
weight: 25
description: >-
  arangojs is the JavaScript driver to access ArangoDB from outside the
  database system, primarily with Node.js
aliases:
  - ../../arangodb/3.11/develop/drivers/javascript
  - ../../arangodb/3.12/develop/drivers/javascript
  - ../../arangodb/stable/develop/drivers/javascript
  - ../../arangodb/4.x/develop/drivers/javascript
  - ../../arangodb/devel/develop/drivers/javascript
---
The official ArangoDB low-level JavaScript client.

- Repository: <https://github.com/arangodb/arangojs>
- Reference: <http://arangodb.github.io/arangojs/>
- [Changelog](https://github.com/arangodb/arangojs/blob/main/CHANGELOG.md)

{{< info >}}
If you are looking for the ArangoDB JavaScript API used in the _arangosh_ interactive
shell (and up to ArangoDB v3.12 also in Foxx), please refer to the documentation about the
[`@arangodb` module](../../arangodb/3.12/develop/javascript-api/@arangodb/_index.md) instead.

The JavaScript driver is **only** meant to be used when accessing ArangoDB from
**outside** the database.
{{< /info >}}

## Compatibility

The arangojs driver is compatible with the latest stable version of ArangoDB
available at the time of the driver release and remains compatible with the two
most recent Node.js LTS versions in accordance with the official
[Node.js long-term support schedule](https://github.com/nodejs/LTS).
Versions of ArangoDB that have reached their [end of life](https://arango.ai/arangodb-product-support-end-of-life-announcements/)
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
      "arangojs": "https://cdn.jsdelivr.net/npm/arangojs@10.6.0/esm/index.js?+esm"
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

## Stream Transactions

[Stream Transactions](../../arangodb/3.12/develop/transactions/stream-transactions.md)
let you run multiple document operations or AQL queries in one transaction.
Declare the collections you want to write to when you begin the transaction with
`db.beginTransaction()`, then call `trx.commit()` or `trx.abort()` when the
operations finish.

The [`stepAsync`](https://arangodb.github.io/arangojs/latest/classes/transactions.Transaction.html#stepAsync)
and [`withTransactionAsync`](https://arangodb.github.io/arangojs/latest/classes/databases.Database.html#withTransactionAsync)
methods are available starting with arangojs **10.6.0**.
The existing `step` and `withTransaction` methods retain their
behavior. Upgrading the driver does not automatically opt existing calls into
the new behavior.

The examples below use `db` and `Pokemons` from the basic usage example and run
inside an async function. The `my-pokemons` collection must already exist.

### Existing APIs and asynchronous callbacks

With `trx.step()`, the callback should start one arangojs operation immediately
and return its Promise. For an open transaction named `trx`, run each operation
in a separate step:

```js
await trx.step(() => Pokemons.save({ name: "Pikachu", type: "electric" }));
await trx.step(() => Pokemons.save({ name: "Raichu", type: "electric" }));
```

The `db.withTransaction()` helper begins a transaction and passes a `step`
function to its callback. It commits when the callback succeeds and attempts to
abort if the callback fails. The supplied `step` function has the same scope
limitations as `trx.step()`.

Database calls started after an `await` in a `step` callback, or in a later
`.then()` continuation, run outside that step's transaction scope. Awaiting the
`step` call waits for the callback's Promise but does not extend the scope.
For example, the following code does **not** put both writes in the transaction:

```js
const trx = await db.beginTransaction({ write: [Pokemons] });

await trx.step(async () => {
  await Pokemons.save({ name: "Pikachu", type: "electric" });
  // This write runs outside the transaction.
  await Pokemons.save({ name: "Raichu", type: "electric" });
});

await trx.abort();
// The Pikachu write is rolled back; the Raichu write remains.
```

Aborting a transaction only rolls back operations that participated in it.
Automatic cleanup with `withTransaction()` cannot roll back writes that ran
outside the transaction either.

### Asynchronous transaction steps

Starting with arangojs 10.6.0, use `trx.stepAsync()` when a step needs to perform
asynchronous work before a database operation or make multiple sequential
database calls. Operations on the transaction's connection remain part of the
transaction across `await` and Promise continuations. The callback must return
a Promise, and `stepAsync()` returns its resolved value.

```js
const trx = await db.beginTransaction({ write: [Pokemons] });

try {
  const pokemon = await trx.stepAsync(async () => {
    const saved = await Pokemons.save({ name: "Pikachu", type: "electric" });
    await Pokemons.update(saved, { nickname: "Sparky" });
    return saved;
  });

  await trx.commit();
  console.log(pokemon._key);
} catch (err) {
  // Preserve the original error if abort also fails.
  await trx.abort().catch(() => undefined);
  throw err;
}
```

Both the save and the update are part of the transaction. If a step fails,
`stepAsync()` rejects but does not automatically abort the transaction. End
every manually created transaction by committing or aborting it.

### Automatic commit and abort

The `db.withTransactionAsync()` helper, also available starting with arangojs
10.6.0, begins a transaction and supplies a `stepAsync` function. It commits
after the callback resolves and returns the callback's result. If the callback
or commit fails, it attempts to abort and rethrows the original error:

```js
const pokemon = await db.withTransactionAsync(
  { write: [Pokemons] },
  async (stepAsync) => {
    return stepAsync(async () => {
      const saved = await Pokemons.save({ name: "Pikachu", type: "electric" });
      await Pokemons.update(saved, { nickname: "Sparky" });
      return saved;
    });
  },
);

console.log(pokemon._key);
```

Wrap database operations in the supplied `stepAsync` function. The outer
callback alone does not make operations transactional.

To opt in, change `step` to `stepAsync`, or use `withTransactionAsync` and its
supplied `stepAsync` function. Existing code using one immediately started
operation per `step` can continue using `step` and `withTransaction`.

### Usage notes

- Await or return all asynchronous work inside a step, and await the step itself.
  Do not start background work that continues after the callback finishes.
- Run operations and steps of one transaction sequentially. Do not use
  `Promise.all` for requests in the same transaction.
- Keep transactions short because server locks and idle timeouts still apply.
  Where possible, finish slow external work before beginning the transaction.
  Side effects in external services are not rolled back by ArangoDB.
- On Node.js, different transactions using the new APIs can run concurrently on
  one `Database`. Do not overlap them with existing `step` or `withTransaction`
  calls on the same connection.
- In browsers, only one asynchronous step may be active per connection;
  overlapping steps are rejected. Keep unrelated database requests off that
  connection while a step is active. For concurrent workflows, use independently
  constructed `Database` instances. Handles derived from another `Database`
  can share its connection.

For further examples, migration guidance, and troubleshooting, see the
[arangojs Stream Transactions guide](https://github.com/arangodb/arangojs/blob/main/docs/stream-transactions.md).
For server behavior and limitations, see the
[Stream Transactions documentation](../../arangodb/3.12/develop/transactions/stream-transactions.md).

## Error responses

If the server returns an ArangoDB error response, arangojs throws an `ArangoError`
with an `errorNum` property indicating the
[ArangoDB error code](../../arangodb/3.12/develop/error-codes.md) and expose the response body
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
