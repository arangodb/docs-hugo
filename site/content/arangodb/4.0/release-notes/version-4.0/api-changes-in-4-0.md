---
title: API Changes in ArangoDB 4.0
menuTitle: API changes in 4.0
weight: 20
description: >-
  A summary of the changes to the HTTP API and other interfaces that are relevant
  for developers, like maintainers of drivers and integrations for ArangoDB
---
## HTTP RESTful API

### Behavior changes



### Privilege changes



### Endpoint return value changes



### Endpoints added



### Endpoints augmented



### Endpoints moved



### Endpoints deprecated



### Endpoints removed

#### Simple Queries endpoints removed

The following endpoints that were deprecated since v3.4.0 have now been removed:

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

You can use AQL queries instead.

#### Batch request API

<small>Removed in: v3.12.3</small>

The `/_api/batch` endpoints that let you send multiple operations in a single
HTTP request was deprecated in v3.8.0 and has now been removed.

To send multiple documents at once to an ArangoDB instance, please use the
[HTTP interface for documents](../../develop/http-api/documents.md#multiple-document-operations)
that can insert, update, replace, or remove arrays of documents.

## JavaScript API


