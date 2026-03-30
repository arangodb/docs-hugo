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

#### Foxx master removed from server status

The `GET /_admin/status` endpoint no longer includes the sub-attributes
`foxxmaster` and `isFoxxmaster` under `coordinator` due to the removal of Foxx.
As the `coordinator` object doesn't have any other attributes, it is removed
as well.

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

#### Foxx API removed

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

#### Upload API removed

The `POST /_api/upload` endpoint has been removed due to the removal Foxx.
It was used for service bundle and file uploads.

#### Routing reload API removed

The `POST /_admin/routing/reload` endpoint has been removed due to the removal
of the Action and Foxx features. It was used to reload the routing information
from the `_routing` system collection and make Foxx rebuild its local routing
table on the next request.

#### Echo API removed

The `/_admin/echo` endpoints supporting the `HEAD`, `GET`, `POST`, `PATCH`,
`PUT`, `DELETE`, and `OPTIONS` HTTP methods have been removed. They returned
an object with the servers request information, the HTTP request headers, or
both and were used for debugging purposes.

## JavaScript API

### Foxx-related removals

The `@arangodb/foxx` module and the related `@arangodb/locals` module have been
removed from the JavaScript API.

Furthermore, the `global.fm` object has been removed. It provided various
methods for managing Foxx services.
