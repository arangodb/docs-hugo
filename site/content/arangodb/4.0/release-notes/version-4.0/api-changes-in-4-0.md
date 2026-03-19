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

#### Log API

The `bench` log topic has been removed.
The `/_admin/log/level` endpoints no longer include this log topic in responses
and attempts to set the log level for this topic are ignored.

### Privilege changes



### Endpoint return value changes



### Endpoints added



### Endpoints augmented



### Endpoints moved



### Endpoints deprecated



### Endpoints removed

#### Batch request API

<small>Removed in: v3.12.3</small>

The `/_api/batch` endpoints that let you send multiple operations in a single
HTTP request was deprecated in v3.8.0 and has now been removed.

To send multiple documents at once to an ArangoDB instance, please use the
[HTTP interface for documents](../../develop/http-api/documents.md#multiple-document-operations)
that can insert, update, replace, or remove arrays of documents.

## JavaScript API


