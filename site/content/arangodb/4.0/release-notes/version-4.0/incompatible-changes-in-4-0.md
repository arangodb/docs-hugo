---
title: Incompatible changes in ArangoDB 4.0
menuTitle: Incompatible changes in 4.0
weight: 15
description: >-
  Check the following list of potential breaking changes **before** upgrading to
  this ArangoDB version and adjust any client applications if necessary
---
## 



## HTTP RESTful API

### Simple Queries endpoints removed

The server-side Simple Queries functionality was deprecated since v3.4.0,
removed from the documentation in v3.8.0, and the endpoints have now been
removed from the code as well. The same functionality is available in the
AQL query language, where it can be used with more flexibility, better
performance, and lower resource consumption.

The client-side Simple Queries functionality found in _arangosh_ in the form
of methods like `collection.byExample()` is still available but has been
re-implemented to use AQL instead of relying on the server-side Simple Queries
interface.

The removed endpoints are the following:

- `PUT /_api/simple/lookup-by-keys`: Find documents by their keys
- `PUT /_api/simple/remove-by-keys`: Remove documents by their keys
- `PUT /_api/simple/all`: Return all documents
- `PUT /_api/simple/all-keys`: Read all document keys
- `PUT /_api/simple/any`: Return a random document
- `PUT /_api/simple/by-example`: Simple query by-example
- `PUT /_api/simple/first-example`: Find documents matching an example
- `PUT /_api/simple/fulltext`: Fulltext index query
- `PUT /_api/simple/near`: Return documents near coordinates
- `PUT /_api/simple/range`: Simple range query
- `PUT /_api/simple/remove-by-example`: Remove documents by example
- `PUT /_api/simple/replace-by-example`: Replace documents by example
- `PUT /_api/simple/update-by-example`: Update documents by example
- `PUT /_api/simple/within`: Find documents within a radius around coordinates
- `PUT /_api/simple/within-rectangle`: Find documents within a rectangular area

### Batch request endpoint removed

<small>Removed in: v3.12.3</small>

The `/_api/batch` endpoints that let you send multiple operations in a single
HTTP request was deprecated in v3.8.0 and has now been removed.

To send multiple documents at once to an ArangoDB instance, please use the
[HTTP interface for documents](../../develop/http-api/documents.md#multiple-document-operations)
that can insert, update, replace, or remove arrays of documents.

## JavaScript API



## Startup options

### Vector index enabled by default

The `vector` index type is now enabled by default and the `--vector-index`
startup option is obsolete, meaning you can still specify the option without
causing an error about an unknown startup option but no longer has any effect.

## Client tools

### arangobench

#### Batch size option removed

<small>Removed in: v3.12.3</small>

The `--batch-size` startup option is now ignored by arangobench and no longer
has an effect. It allowed you to specify the number of operations to issue in
one batch but the batch request API has been removed on the server-side.
