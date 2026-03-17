---
title: Incompatible changes in ArangoDB 4.0
menuTitle: Incompatible changes in 4.0
weight: 15
description: >-
  Check the following list of potential breaking changes **before** upgrading to
  this ArangoDB version and adjust any client applications if necessary
---
## Foxx removed

The Foxx microservice framework including tasks/queues, the related
startup options, JavaScript modules, and HTTP API endpoints have been removed.
The `foxx-cli` tool has been discontinued as well.

Running JavaScript code on the server-side enabled interesting customization
abilities, but usability and scalability issues limited the field of application.
It lacked proper debugging capabilities, only implemented a subset of the Node.js
API, and did not support async code, which made many libraries incompatible.
The conversion of data types between native code and JavaScript could be slow
and the possibility of out-of-memory crashes forced Foxx onto Coordinators in
cluster deployments in order to not put the DB-Servers with your valuable data
at risk.

You may use Node.js together with the [arangojs driver](../../../../ecosystem/drivers/javascript.md)
to work with ArangoDB from the outside using JavaScript as your language.

<!-- TODO: BYOC with node-foxx compatibility layer -->

## User-defined AQL functions removed

The ability to register custom functions for the AQL query language written
in JavaScript has been removed.

The AQL optimizer had no insight into such user-defined functions (UDFs) and
they had to be executed on Coordinators where all server-side JavaScript code
was run. This caused them to perform poorly when a lot of data was involved
that had to be transferred between cluster nodes.

<!-- TODO: Hygenic macros for some use cases (once supported) -->

## HTTP RESTful API

### Batch request endpoint removed

<small>Removed in: v3.12.3</small>

The `/_api/batch` endpoints that let you send multiple operations in a single
HTTP request was deprecated in v3.8.0 and has now been removed.

To send multiple documents at once to an ArangoDB instance, please use the
[HTTP interface for documents](../../develop/http-api/documents.md#multiple-document-operations)
that can insert, update, replace, or remove arrays of documents.

### Foxx API removed

All `/_api/foxx*` endpoints have been removed due to the removal of Foxx.
See [API Changes in ArangoDB 4.0](api-changes-in-4-0.md#foxx-api-removed)
for a detailed list.

## JavaScript API

### Foxx and UDF modules removed

The `@arangodb/foxx` module and the related `@arangodb/locals` modules have been
removed due to the removal of Foxx.

The `@arangodb/aql/functions` module has been removed due to the removal of
user-defined AQL functions.

## Startup options

### Startup options related to server-side JavaScript removed

The following startup options are now obsolete due to the removal of Foxx and
user-defined AQL functions (UDFs):

- `--server.authentication-system-only`
- `--foxx.allow-install-from-remote`
- `--foxx.api`
- `--foxx.enable`
- `--foxx.force-update-on-startup`
- `--foxx.queues`
- `--foxx.queues-poll-interval`
- `--foxx.store`
- `--javascript.user-defined-functions`

You can still specify these startup options without causing a fatal error during
startup. They are recognized, but they don't have any effect anymore.

## Client tools

### arangobench

#### Batch size option removed

<small>Removed in: v3.12.3</small>

The `--batch-size` startup option is now ignored by arangobench and no longer
has an effect. It allowed you to specify the number of operations to issue in
one batch but the batch request API has been removed on the server-side.
