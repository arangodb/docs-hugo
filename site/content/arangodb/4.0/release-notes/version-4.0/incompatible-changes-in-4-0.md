---
title: Incompatible changes in ArangoDB 4.0
menuTitle: Incompatible changes in 4.0
weight: 15
description: >-
  Check the following list of potential breaking changes **before** upgrading to
  this ArangoDB version and adjust any client applications if necessary
---
## Statistics features removed

Server and cluster statistics are superseded by the
[Metrics API](../../develop/http-api/monitoring/metrics.md). Therefore, the
startup options and HTTP API endpoints related to the statistics features have
been removed and no `_statistics*` system collections are used by _arangod_
anymore.

When upgrading to v4.0, the `_statistics`, `_statistics15`, and `_statisticsRaw`
system collections are actively removed.

The following startup options are now obsolete:
- `--server.statistics`
- `--server.statistics-history`
- `--server.statistics-all-databases`

The following endpoints have been removed:

- `/_admin/statistics`
- `/_admin/statistics-description`
- `/_admin/cluster/nodeStatistics`
- `/_admin/cluster/statistics`

You can get more detailed information for monitoring ArangoDB via the
[`/_admin/metrics` endpoint](../../develop/http-api/monitoring/metrics.md)
in Prometheus format.

## Emergency console mode removed

The ArangoDB server process could be started in an interactive command-line
mode (JavaScript REPL) with the `--console` option. This was primarily used
for debugging purposes in the development of _arangod_.
This feature has been removed and the `--console` startup option is obsolete now.

## HTTP RESTful API

### Sub-attribute removed from the version API

The `GET /_api/version` endpoint no longer includes the `mode` sub-attribute
under `details` when requesting the detailed version information. This is
due to the removal of the emergency console (`arangod --console`) and the
V8 JavaScript engine in general from the server-side.

### Attributes removed from the status API

The `GET /_admin/status` endpoint no longer includes the following attributes
due to the removal of Foxx microservices, the emergency console
(`arangod --console`) and the V8 JavaScript engine in general from the
server-side:

- `mode`
- `operationMode`
- `foxxApi`

### Batch request endpoint removed

<small>Removed in: v3.12.3</small>

The `/_api/batch` endpoints that let you send multiple operations in a single
HTTP request was deprecated in v3.8.0 and has now been removed.

To send multiple documents at once to an ArangoDB instance, please use the
[HTTP interface for documents](../../develop/http-api/documents.md#multiple-document-operations)
that can insert, update, replace, or remove arrays of documents.

### Metrics API v2 endpoint removed

Since ArangoDB v3.10.0, the `/_admin/metrics` and `/_admin/metrics/v2` endpoints
returned the same metrics. The redundant `/_admin/metrics/v2` endpoint has now
been removed.

## JavaScript API



## Startup options

### `--console` obsolete

The `--console` startup option no longer has an effect but it is still
recognized to avoid causing a fatal error on startup if you specify it.

## Client tools

### arangobench

#### Batch size option removed

<small>Removed in: v3.12.3</small>

The `--batch-size` startup option is now ignored by arangobench and no longer
has an effect. It allowed you to specify the number of operations to issue in
one batch but the batch request API has been removed on the server-side.
