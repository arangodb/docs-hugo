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

### Batch request endpoint removed

<small>Removed in: v3.12.3</small>

The `/_api/batch` endpoints that let you send multiple operations in a single
HTTP request was deprecated in v3.8.0 and has now been removed.

To send multiple documents at once to an ArangoDB instance, please use the
[HTTP interface for documents](../../develop/http-api/documents.md#multiple-document-operations)
that can insert, update, replace, or remove arrays of documents.

## JavaScript API

### Removed collection methods

The following methods have been removed from
[_collection_ objects](../../develop/javascript-api/@arangodb/collection-object.md)
as they are either obsolete or didn't provide much value and better alternatives exist:

- `closedRange()`
- `documents()`
- `ensureFulltextIndex()`
- `ensureGeoConstraint()`
- `ensureGeoIndex()`
- `ensureHashIndex()`
- `ensureSkiplist()`
- `ensureUniqueConstraint()`
- `ensureUniqueSkiplist()`
- `fulltext()`
- `geo()`
- `iterate()`
- `load()`
- `lookupByKeys()`
- `near()`
- `removeByKeys()`
- `unload()`
- `within()`
- `withinRectangle()`

See [API Changes in ArangoDB 4.0](api-changes-in-4-0.md#removed-collection-methods)
for details like how you can replace this functionality.

## Startup options



## Client tools

### arangobench

#### Batch size option removed

<small>Removed in: v3.12.3</small>

The `--batch-size` startup option is now ignored by arangobench and no longer
has an effect. It allowed you to specify the number of operations to issue in
one batch but the batch request API has been removed on the server-side.
