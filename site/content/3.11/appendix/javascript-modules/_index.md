---
title: JavaScript Modules
weight: 10
description: >-
  ArangoDB uses a Node.js compatible module system. You can use require() in order to load a module or library.
archetype: chapter
---
ArangoDB uses a Node.js compatible module system. You can use the function
`require()` in order to load a module or library. It returns the exported
variables and functions of the module.

The following global variables are available throughout ArangoDB and Foxx:

- `global`
- `process`
- `console`
- `Buffer`
- `__filename`
- `__dirname`

## Node compatibility modules

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
- `crypto` (but see `@arangodb/crypto` below)
- `dgram`
- `dns`
- `domain`
- `http` (but see `@arangodb/request` below)
- `https`
- `os`
- `sys`
- `tls`
- `v8`
- `zlib`

## ArangoDB-specific modules

There are a large number of ArangoDB-specific modules using the `@arangodb`
namespace, mostly for internal use by ArangoDB itself. The following modules
noteworthy however and intended to be used by the user:

- [**@arangodb**](arangodb.md)
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

  - [**@arangodb/aql/functions**](../../aql/user-functions/registering-functions.md)
    provides an interface to (un-)register user-defined AQL functions.

- [**@arangodb/crypto**](crypto.md)
  provides various cryptography functions including hashing algorithms.

- [**@arangodb/foxx**](../../advanced-topics/foxx-microservices/_index.md)
  is the namespace providing the various building blocks of the Foxx
  microservice framework.

  - [**@arangodb/locals**](../../advanced-topics/foxx-microservices/reference/related-modules/_index.md#the-arangodblocals-module)
    is a helper module to use Foxx together with Webpack.

- Graph related modules:

  - [**@arangodb/general-graph**](../../core-topics/graphs/general-graphs/_index.md)
    implements a graph management interface for named graphs.

  - [**@arangodb/smart-graph**](../../core-topics/graphs/smartgraphs/smartgraph-management.md)
    provides management features for SmartGraphs

  - [**@arangodb/graph-examples/example-graph.js**](../../core-topics/graphs/_index.md#example-graphs)
    can load example graphs (creates collections, populates them with documents
    and creates named graphs)

- [**@arangodb/request**](request.md)
  provides the functionality for making synchronous HTTP/HTTPS requests.

- [**@arangodb/tasks**](tasks.md)
  implements task management methods

- [**@arangodb/users**](../../operations/administration/user-management/in-arangosh.md)
  provides an interface for user management.

- [**@arangodb/pregel**](../../core-topics/data-science/pregel/_index.md#javascript-api)
  provides an interface for Pregel management.
