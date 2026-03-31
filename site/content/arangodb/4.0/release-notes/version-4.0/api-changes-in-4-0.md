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

#### Unsupported HTTP methods disallowed

The following endpoints could previously be called using any HTTP method of
`HEAD`, `GET`, `POST`, `PATCH`, `PUT`, `DELETE`:

 - `/_api/version`
 - `/_admin/time`
 - `/_admin/status`
 - `/_admin/support-info`
 
 The HTTP method is now checked and only `GET` requests are allowed for these
 endpoints. Only the `GET` variants were documented.

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

#### Metrics API v2

Since ArangoDB v3.10.0, the `/_admin/metrics` and `/_admin/metrics/v2` endpoints
returned the same metrics. The redundant `/_admin/metrics/v2` endpoint has now
been removed.

#### Legacy log API

The long-deprecated `GET /_admin/log` endpoint and the associated
`DELETE /_admin/log` endpoint have been removed.

The structure of this legacy log was parallel lists that required you to pick
the elements with the same index from each array of the returned object to
determine what belongs together for a given log entry.

A more intuitive log format where each log entry is an object is available
with the `GET /_admin/log/entries` endpoint. See
[HTTP interface for server logs](../../develop/http-api/monitoring/logs.md#get-the-global-server-logs)
for details.

#### Database target version API

The `GET /_admin/database/target-version` endpoint has been removed in favor of
the more general version API with the endpoint `GET /_api/version`.
The endpoint was deprecated since v3.11.3.

#### Obsolete replication APIs

The following endpoints related to replication functionality that is no longer
used have been removed:

- `GET /_api/replication/logger-follow`
- `GET /_api/replication/logger-first-tick`
- `GET /_api/replication/logger-tick-ranges`
- `GET /_api/wal/open-transactions`
- `GET /_admin/wal/transactions`
- `GET /_admin/wal/properties`
- `PUT /_admin/wal/properties`

#### Endpoint API

The long-deprecated `GET /_api/endpoint` for retrieving all configured endpoints
the server is listening on has been removed. For cluster deployments, you can
use `GET /_api/cluster/endpoints` to find all current Coordinator endpoints.
See [HTTP interface for clusters](../../develop/http-api/cluster.md#endpoints).

#### Batch request API

<small>Removed in: v3.12.3</small>

The `/_api/batch` endpoints that let you send multiple operations in a single
HTTP request was deprecated in v3.8.0 and has now been removed.

To send multiple documents at once to an ArangoDB instance, please use the
[HTTP interface for documents](../../develop/http-api/documents.md#multiple-document-operations)
that can insert, update, replace, or remove arrays of documents.

#### Deprecated `PUT` cursor endpoint removed

The deprecated `PUT /_api/cursor/{cursor-identifier}` endpoint to
read the next batch from a cursor has been removed.

Use `POST /_api/cursor/{cursor-identifier}` instead.

#### Endpoints to load and unload collections removed

The deprecated `PUT /_api/collection/load` and `PUT /_api/collection/unload`
endpoints to load and unload collections have been removed. There is no
concept of loading status anymore and the endpoints didn't have any effect for
a while.

## JavaScript API


