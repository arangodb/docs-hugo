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

#### Metrics API

The following V8-related metrics have been removed:

- `arangodb_v8_context_alive`
- `arangodb_v8_context_busy`
- `arangodb_v8_context_dirty`
- `arangodb_v8_context_free`
- `arangodb_v8_context_max`
- `arangodb_v8_context_min`

#### Log API

The `security` log topic has been removed.
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

### Foxx API removed

The following `/_api/foxx` endpoints have been removed due to the removal of Foxx:

- `GET /_db/{database-name}/_api/foxx`
- `POST /_db/{database-name}/_api/foxx`
- `GET /_db/{database-name}/_api/foxx/service`
- `PATCH /_db/{database-name}/_api/foxx/service`
- `PUT /_db/{database-name}/_api/foxx/service`
- `DELETE /_db/{database-name}/_api/foxx/service`
- `GET /_db/{database-name}/_api/foxx/configuration`
- `PATCH /_db/{database-name}/_api/foxx/configuration`
- `PUT /_db/{database-name}/_api/foxx/configuration`
- `GET /_db/{database-name}/_api/foxx/dependencies`
- `PATCH /_db/{database-name}/_api/foxx/dependencies`
- `PUT /_db/{database-name}/_api/foxx/dependencies`
- `GET /_db/{database-name}/_api/foxx/scripts`
- `POST /_db/{database-name}/_api/foxx/scripts/{name}`
- `POST /_db/{database-name}/_api/foxx/tests`
- `POST /_db/{database-name}/_api/foxx/development`
- `DELETE /_db/{database-name}/_api/foxx/development`
- `GET /_db/{database-name}/_api/foxx/readme`
- `GET /_db/{database-name}/_api/foxx/swagger`
- `POST /_db/{database-name}/_api/foxx/download`
- `POST /_db/{database-name}/_api/foxx/commit`

## JavaScript API


