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

## HTTP RESTful API

### Batch request endpoint removed

<small>Removed in: v3.12.3</small>

The `/_api/batch` endpoints that let you send multiple operations in a single
HTTP request was deprecated in v3.8.0 and has now been removed.

To send multiple documents at once to an ArangoDB instance, please use the
[HTTP interface for documents](../../develop/http-api/documents.md#multiple-document-operations)
that can insert, update, replace, or remove arrays of documents.

## JavaScript API



## Startup options



## Client tools

### arangobench

#### Batch size option removed

<small>Removed in: v3.12.3</small>

The `--batch-size` startup option is now ignored by arangobench and no longer
has an effect. It allowed you to specify the number of operations to issue in
one batch but the batch request API has been removed on the server-side.
