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

The following startup options are now obsolete due to the removal of Foxx:

- `--server.authentication-system-only`
- `--foxx.allow-install-from-remote`
- `--foxx.api`
- `--foxx.enable`
- `--foxx.force-update-on-startup`
- `--foxx.queues`
- `--foxx.queues-poll-interval`
- `--foxx.store`

You can still specify these startup options without causing a fatal error during
startup. They are recognized, but they don't have any effect anymore.

The Foxx management HTTP API (`/_api/foxx*`) has been removed. For a detailed list
of endpoints, see [API Changes in ArangoDB 4.0](api-changes-in-4-0.md#foxx-api-removed).

The `GET /_admin/status` no longer includes a `coordinator` object with the
attributes `foxxmaster` and `isFoxxmaster`.

The `@arangodb/foxx` module and the related `@arangodb/locals` modules have been
removed from the JavaScript API.

The `30xx` error codes used by Foxx have been removed.

For new deployments, the following Foxx-related system collections are not
created anymore:

- `_appbundles`
- `_apps`
- `_jobs`
- `_modules`
- `_queues`
- `_routing`

When upgrading existing deployments, these collections are not actively removed
in case they contain any data that is still relevant to you.

**Alternatives and migration**

You may use Node.js together with the [arangojs driver](../../../../ecosystem/drivers/javascript.md)
to work with ArangoDB from the outside using JavaScript as your language.

If you upgrade to the [Arango Contextual Data Platform](../../../../contextual-data-platform/_index.md),
you can run custom services in the data platform with the
[Container Manager](../../../../platform-suite/container-manager/_index.md)
You can think of it as a more powerful incarnation of Foxx because it is a
microservice architecture but with a clear separation of the core database system
and the surrounding services. It is also not limited to (synchronous) JavaScript
but you may use a standard Node.js runtime with its entire ecosystem including
async libraries, or use different programming languages altogether. Moreover, a
compatibility layer to run existing Foxx services on top of Node.js is available
to ease the migration to the data platform.

<!-- TODO: See node-foxx docs... -->

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
