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

## Removed AQL functions

- `V8()`: There is no longer a V8 JavaScript engine on the server-side to
  enforce for query expressions.

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

### Metrics removed

The following V8-related metrics have been removed:

- `arangodb_v8_context_alive`
- `arangodb_v8_context_busy`
- `arangodb_v8_context_dirty`
- `arangodb_v8_context_free`
- `arangodb_v8_context_max`
- `arangodb_v8_context_min`

## JavaScript API

### Foxx and UDF modules removed

The `@arangodb/foxx` module and the related `@arangodb/locals` modules have been
removed due to the removal of Foxx.

The `@arangodb/aql/functions` module has been removed due to the removal of
user-defined AQL functions.

## Startup options

### Startup options related to server-side JavaScript removed

The following startup options are now obsolete for _arangod_ due to the removal
of Foxx, user-defined AQL functions (UDFs), and all other server-side
JavaScript contexts:

- `--foxx.allow-install-from-remote`
- `--foxx.api`
- `--foxx.enable`
- `--foxx.force-update-on-startup`
- `--foxx.queues-poll-interval`
- `--foxx.queues`
- `--foxx.store`
- `--javascript.allow-admin-execute`
- `--javascript.allow-external-process-control`
- `--javascript.allow-port-testing`
- `--javascript.app-path`
- `--javascript.copy-installation`
- `--javascript.enabled`
- `--javascript.endpoints-allowlist`
- `--javascript.endpoints-denylist`
- `--javascript.environment-variables-allowlist`
- `--javascript.environment-variables-denylist`
- `--javascript.files-allowlist`
- `--javascript.gc-frequency`
- `--javascript.gc-interval`
- `--javascript.harden`
- `--javascript.module-directory`
- `--javascript.script-parameter`
- `--javascript.script`
- `--javascript.startup-directory`
- `--javascript.startup-options-allowlist`
- `--javascript.startup-options-denylist`
- `--javascript.tasks`
- `--javascript.transactions`
- `--javascript.user-defined-functions`
- `--javascript.v8-contexts-max-age`
- `--javascript.v8-contexts-max-invocations`
- `--javascript.v8-contexts-minimum`
- `--javascript.v8-contexts`
- `--javascript.v8-max-heap`
- `--javascript.v8-options`
- `--server.authentication-system-only`

You can still specify these startup options without causing a fatal error during
startup. They are recognized, but they don't have any effect anymore.

### Log topic changes and removals

The only remaining use of the `security` log topic was for the log message with
ID `2cafe`, dumping information about the JavaScript hardening (allow/denylists).
It has been changed to the `v8` log topic.

The `security` log topic has been removed.
Attempts to set the log level for this topic log a warning, for example, using
a startup option like `--log.level security=debug`.

## Client tools

### arangobench

#### Batch size option removed

<small>Removed in: v3.12.3</small>

The `--batch-size` startup option is now ignored by arangobench and no longer
has an effect. It allowed you to specify the number of operations to issue in
one batch but the batch request API has been removed on the server-side.
