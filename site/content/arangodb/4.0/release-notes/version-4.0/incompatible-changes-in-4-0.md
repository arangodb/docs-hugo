---
title: Incompatible changes in ArangoDB 4.0
menuTitle: Incompatible changes in 4.0
weight: 15
description: >-
  Check the following list of potential breaking changes **before** upgrading to
  this ArangoDB version and adjust any client applications if necessary
---
## New CPU requirements

The minimum requirements to run ArangoDB were previously met by processors
using the Intel Sandy Bridge (2011), AMD Bulldozer (2011), or better
microarchitectures, as well as 64-bit CPUs based on ARMv8 with NEON.

ArangoDB 4.0 now requires newer microarchitectures/designs and can utilize
their instruction set extensions for improved performance:

- **x86-64**: Intel Haswell (2013) or better, AMD Excavator (2015) or better, etc.
- **ARM**: CPUs like AWS Graviton2 with ARM Neoverse N1 cores.

For more details about the necessary CPU features, see
[Supported platforms and architectures](../../operations/installation/_index.md#supported-platforms-and-architectures).

## Emergency console mode removed

The ArangoDB server process could be started in an interactive command-line
mode (JavaScript REPL) with the `--console` option. This was primarily used
for debugging purposes in the development of _arangod_.
This feature has been removed and the `--console` startup option is obsolete now.

## HTTP RESTful API

### Simple Queries endpoints removed

The server-side Simple Queries functionality was deprecated since v3.4.0,
removed from the documentation in v3.8.0, and the `/_api/simple/*` endpoints
have now been removed from the code as well. The same functionality is available
in the AQL query language, where it can be used with more flexibility, better
performance, and lower resource consumption.

The client-side Simple Queries functionality found in _arangosh_ in the form
of methods like `collection.byExample()` is still available but has been
re-implemented to use AQL instead of relying on the server-side Simple Queries
interface (which already used AQL internally).

For a detailed list of the removed endpoints, see
[API Changes in ArangoDB 4.0](api-changes-in-4-0.md#simple-queries-endpoints-removed).

### Unsupported HTTP methods disallowed

The following endpoints could previously be called using any HTTP method of
`HEAD`, `GET`, `POST`, `PATCH`, `PUT`, `DELETE`:

 - `/_api/version`
 - `/_admin/time`
 - `/_admin/status`
 - `/_admin/support-info`
 
 The HTTP method is now checked and only `GET` requests are allowed for these
 endpoints. Only the `GET` variants were documented.

### Endpoint API removed

The long-deprecated `GET /_api/endpoint` for retrieving all configured endpoints
the server is listening on has been removed. For cluster deployments, you can
use `GET /_api/cluster/endpoints` to find all current Coordinator endpoints.
See [HTTP interface for clusters](../../develop/http-api/cluster.md#endpoints).

### Batch request endpoint removed

<small>Removed in: v3.12.3</small>

The `/_api/batch` endpoints that let you send multiple operations in a single
HTTP request was deprecated in v3.8.0 and has now been removed.

To send multiple documents at once to an ArangoDB instance, please use the
[HTTP interface for documents](../../develop/http-api/documents.md#multiple-document-operations)
that can insert, update, replace, or remove arrays of documents.

### Deprecated `PUT` cursor endpoint removed

The deprecated `PUT /_api/cursor/{cursor-identifier}` endpoint to
read the next batch from a cursor has been removed.

Use `POST /_api/cursor/{cursor-identifier}` instead.

### Endpoints to load and unload collections removed

The deprecated `PUT /_api/collection/load` and `PUT /_api/collection/unload`
endpoints to load and unload collections have been removed. There is no
concept of loading status anymore and the endpoints didn't have any effect for
a while.

### Metrics API v2 endpoint removed

Since ArangoDB v3.10.0, the `/_admin/metrics` and `/_admin/metrics/v2` endpoints
returned the same metrics. The redundant `/_admin/metrics/v2` endpoint has now
been removed.

### Legacy log API removed

The long-deprecated `GET /_admin/log` endpoint and the associated
`DELETE /_admin/log` endpoint have been removed.

The structure of this legacy log was parallel lists that required you to pick
the elements with the same index from each array of the returned object to
determine what belongs together for a given log entry.

A more intuitive log format where each log entry is an object is available
with the `GET /_admin/log/entries` endpoint. See
[HTTP interface for server logs](../../develop/http-api/monitoring/logs.md#get-the-global-server-logs)
for details.

## JavaScript API



## Startup options

### Vector index enabled by default

The `vector` index type is now enabled by default and the `--vector-index`
startup option is obsolete. You can still specify the option without causing an
error about an unknown option at startup but it no longer has any effect.

### `--console` obsolete

The `--console` startup option no longer has an effect but it is still
recognized to avoid causing a fatal error on startup if you specify it.

## Client tools

### arangoimp removed

The _arangoimport_ client tool used to be called _arangoimp_ and was still
shipped (at least as a symlink) under the old name in packages and container
images for backward compatibility. This is no longer the case and there is only
the _arangoimport_ executable now.

### arangobench

#### Batch size option removed

<small>Removed in: v3.12.3</small>

The `--batch-size` startup option is now ignored by arangobench and no longer
has an effect. It allowed you to specify the number of operations to issue in
one batch but the batch request API has been removed on the server-side.
