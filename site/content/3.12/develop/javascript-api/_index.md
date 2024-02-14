---
title: JavaScript API
menuTitle: JavaScript API
weight: 270
description: >-
  You can use ArangoDB's JavaScript interface on the server-side as well as in
  ArangoDB's shell to interact with the server using the JavaScript language
archetype: chapter
---
The JavaScript API is available on the server-side in the following contexts:

- [Foxx microservices](../foxx-microservices/_index.md)
- [User-defined AQL functions](../../aql/user-defined-functions.md)
- [JavaScript Transactions](../transactions/javascript-transactions.md)
- [Emergency console](../../operations/troubleshooting/emergency-console.md) (`arangod --console`)

Running on the server-side means that the code runs directly inside of the
_arangod_ process, bypassing the HTTP API. In cluster deployments, the code
is executed on a Coordinator.

The JavaScript API is also available in the ArangoDB Shell client tool:

- [arangosh](../../components/tools/arangodb-shell/_index.md)

It communicates with the server via the HTTP API.
<!-- TODO (DOC-139): There are some differences to the server-side API. -->

{{< tip >}}
The JavaScript API cannot be used in browsers, Node.js, or other JavaScript
environments. You can use the [arangojs driver](../drivers/nodejs.md) instead.
Note that it has a different interface.
{{< /tip >}}

## Usage example

The key element for using the JavaScript API is the
[`db` object](@arangodb/db-object.md), which is available by default
in _arangosh_ and can be imported in server-side JavaScript code from the
`@arangodb` module.

```js
// Import the db object (only in server-side contexts)
let db = require("@arangodb").db;
```

The `db` object lets you access and manage databases, for example:

```js
// Create a new database
db._createDatabase("myDB");

// Make it the current database
db._useDatabase("myDB");
print(`Database context: ${ db._name() }`);
```

You can also work with collections and Views using the `db` object.
Accessing a collection returns a [_collection_ object](@arangodb/collection-object.md)
and accessing a View returns a [_view_ object](@arangodb/view-object.md).

```js
// Create a new collection. Returns a collection object
let coll = db._create("collection");

// Create a new arangosearch View. Returns a view object
let view = db._createView("view", "arangosearch", { links: { collection: { includeAllFields: true } } });
```

To obtain a reference to a collection or View again, you can use multiple ways:

```js
coll = db._collection("collection");
view = db._view("view");
// or
coll = db.collection;
view = db.view;
```

You can create documents via a _collection_ object. You can use arbitrary
JavaScript code to generate data.

```js
// Create single documents using both available methods.
// Returns an object with the document metadata (the _id, _key, and _rev attributes)
coll.save({ value: "foo" });
coll.insert({ value: "bar" });

// Create an array of objects and create multiple documents at once
let arr = [];
for (let i = 1; i < 100; i++) {
  arr.push({ value: i });
}
coll.save(arr);
```

Indexes can also be created via a _collection_ object.

```js
// Create an index for the collection
coll.ensureIndex({ type: "persistent", fields: ["value"] });
```

To query the data in the current database, use the `db` object. Executing an
AQL query returns a [_cursor_ object](@arangodb/cursor-object.md).

```js
// Run an AQL query. Returns a cursor object
let cursor = db._query(`FOR doc IN collection FILTER doc.value >= "bar" RETURN doc`);
cursor.toArray();

// Import the aql query helper (only in server-side contexts)
const aql = require("@arangodb").aql;

// Run an AQL query using the query helper to use variables as bind parameters
let limit = 5;
db._query(aql`FOR doc IN ${ coll } LIMIT ${ limit } RETURN doc`).toArray();
```

See the full reference documentation for the common objects returned by the
[`@arangodb` module](@arangodb/_index.md) for details:
- [`db` object](@arangodb/db-object.md)
- [_collection_ object](@arangodb/collection-object.md)
- [_view_ object](@arangodb/view-object.md)
- [_cursor_ object](@arangodb/cursor-object.md)

## JavaScript Modules

ArangoDB uses a Node.js-compatible module system. You can use the function
`require()` in order to load a module or library. It returns the exported
variables and functions of the module.

The following global variables are available in _arangosh_ and all server-side
JavaScript contexts in ArangoDB:

- `global`
- `process`
- `console`
- `Buffer`
- `__filename`
- `__dirname`

### ArangoDB-specific modules

There is a large number of ArangoDB-specific modules using the `@arangodb`
namespace. Some of these modules are for internal use by ArangoDB itself.
You can use the following modules as an end-user:

- [**@arangodb**](@arangodb/_index.md)
  provides direct access to the database and its collections.

- [**@arangodb/analyzers**](analyzers.md)
  provides an interface to manage ArangoSearch Analyzers.

- AQL related modules:

  - [**@arangodb/aql/queries**](aql-queries.md)
    offers methods to track and kill AQL queries.

  - [**@arangodb/aql/cache**](../../aql/execution-and-performance/caching-query-results.md)
    allows to control the AQL query caching feature.

  - [**@arangodb/aql/explainer**](../../aql/execution-and-performance/explaining-queries.md)
    provides methods to debug, explain and profile AQL queries.

  - [**@arangodb/aql/functions**](../../aql/user-defined-functions.md#registering-and-unregistering-user-functions)
    provides an interface to (un-)register user-defined AQL functions.

- [**@arangodb/crypto**](crypto.md)
  provides various cryptography functions including hashing algorithms.

- [**@arangodb/foxx**](../foxx-microservices/_index.md)
  is the namespace providing the various building blocks of the Foxx
  microservice framework.

  - [**@arangodb/locals**](../foxx-microservices/reference/related-modules/_index.md#the-arangodblocals-module)
    is a helper module to use Foxx together with Webpack.

- Graph-related modules:

  - [**@arangodb/general-graph**](../../graphs/general-graphs/_index.md)
    implements a graph management interface for named graphs.

  - [**@arangodb/smart-graph**](../../graphs/smartgraphs/management.md)
    provides management features for SmartGraphs

  - [**@arangodb/satellite-graph**](../../graphs/satellitegraphs/management.md)
    provides management features for SatelliteGraphs

  - [**@arangodb/enterprise-graph**](../../graphs/enterprisegraphs/management.md)
    provides management features for EnterpriseGraphs

  - [**@arangodb/graph-examples/example-graph**](../../graphs/_index.md#example-graphs)
    can load example graphs (creates collections, populates them with documents
    and creates named graphs)

- [**@arangodb/request**](request.md)
  provides the functionality for making synchronous HTTP/HTTPS requests.

- [**@arangodb/tasks**](tasks.md)
  implements task management methods

- [**@arangodb/users**](../../operations/administration/user-management/in-arangosh.md)
  provides an interface for user management.

### Node-compatibility modules

ArangoDB supports a number of modules for compatibility with Node.js, including:

- [**assert**](http://nodejs.org/api/assert.html)
  implements basic assertion and testing functions.

- [**buffer**](http://nodejs.org/api/buffer.html)
  implements a binary data type for JavaScript.

- [**console**](console.md)
  is a well known logging facility to all the JavaScript developers.
  ArangoDB implements most of the [Console API](http://wiki.commonjs.org/wiki/Console),
  with the exceptions of *profile* and *count*.

- [**events**](http://nodejs.org/api/events.html)
  implements an event emitter.

- [**fs**](fs.md)
  provides a file system API for the manipulation of paths, directories, files,
  links, and the construction of file streams. ArangoDB implements most
  [Filesystem/A](http://wiki.commonjs.org/wiki/Filesystem/A)
  functions.

- [**module**](http://nodejs.org/api/modules.html)
  provides direct access to the module system.

- [**path**](http://nodejs.org/api/path.html)
  implements functions dealing with filenames and paths.

- [**punycode**](http://nodejs.org/api/punycode.html)
  implements conversion functions for
  [**punycode**](http://en.wikipedia.org/wiki/Punycode) encoding.

- [**querystring**](http://nodejs.org/api/querystring.html)
  provides utilities for dealing with query strings.

- [**stream**](http://nodejs.org/api/stream.html)
  provides a streaming interface.

- [**string_decoder**](https://nodejs.org/api/string_decoder.html)
  implements logic for decoding buffers into strings.

- [**url**](http://nodejs.org/api/url.html)
  provides utilities for URL resolution and parsing.

- [**util**](http://nodejs.org/api/util.html)
  provides general utility functions like `format` and `inspect`.

Additionally ArangoDB provides partial implementations for the following modules:

- `net`:
  only `isIP`, `isIPv4` and `isIPv6`.

- `process`:
  only `env` and `cwd`;
  stubs for `argv`, `stdout.isTTY`, `stdout.write`, `nextTick`.

- `timers`:
  stubs for `setImmediate`, `setTimeout`, `setInterval`, `clearImmediate`,
  `clearTimeout`, `clearInterval` and `ref`.

- `tty`:
  only `isatty` (always returns `false`).

- `vm`:
  only `runInThisContext`.

The following Node.js modules are not available at all:

- `child_process`
- `cluster`
- `constants`
- `crypto` (but see [`@arangodb/crypto`](crypto.md))
- `dgram`
- `dns`
- `domain`
- `http` (but see [`@arangodb/request`](request.md))
- `https`
- `os`
- `sys`
- `tls`
- `v8`
- `zlib`
