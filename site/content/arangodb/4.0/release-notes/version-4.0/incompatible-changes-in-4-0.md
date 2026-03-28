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

### Batch request endpoint removed

<small>Removed in: v3.12.3</small>

The `/_api/batch` endpoints that let you send multiple operations in a single
HTTP request was deprecated in v3.8.0 and has now been removed.

To send multiple documents at once to an ArangoDB instance, please use the
[HTTP interface for documents](../../develop/http-api/documents.md#multiple-document-operations)
that can insert, update, replace, or remove arrays of documents.

## JavaScript API



## Startup options

### Vector index enabled by default

The `vector` index type is now enabled by default and the `--vector-index`
startup option is obsolete. You can still specify the option without causing an
error about an unknown option at startup but it no longer has any effect.

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
