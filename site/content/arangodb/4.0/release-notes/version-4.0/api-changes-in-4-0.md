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

#### Version API

The `GET /_api/version` endpoint no longer includes the `mode` sub-attribute
under `details` when requesting the detailed version information. This is
due to the removal of the emergency console (`arangod --console`) and the
V8 JavaScript engine in general from the server-side.

#### Status API

The `GET /_admin/status` endpoint no longer includes the following attributes
due to the removal of Foxx microservices, the emergency console
(`arangod --console`), and the V8 JavaScript engine in general from the
server-side:

- `mode`
- `operationMode`
- `foxxApi`

### Privilege changes



### Endpoint return value changes



### Endpoints added



### Endpoints augmented



### Endpoints moved



### Endpoints deprecated



### Endpoints removed

#### Metrics API v2

Since ArangoDB v3.10.0, the `/_admin/metrics` and `/_admin/metrics/v2` endpoints
returned the same metrics. The redundant `/_admin/metrics/v2` endpoint has now
been removed.

#### Batch request API

<small>Removed in: v3.12.3</small>

The `/_api/batch` endpoints that let you send multiple operations in a single
HTTP request was deprecated in v3.8.0 and has now been removed.

To send multiple documents at once to an ArangoDB instance, please use the
[HTTP interface for documents](../../develop/http-api/documents.md#multiple-document-operations)
that can insert, update, replace, or remove arrays of documents.

## JavaScript API


