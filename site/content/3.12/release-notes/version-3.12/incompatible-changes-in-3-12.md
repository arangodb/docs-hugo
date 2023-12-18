---
title: Incompatible changes in ArangoDB 3.12
menuTitle: Incompatible changes in 3.12
weight: 15
description: >-
  Check the following list of potential breaking changes **before** upgrading to
  this ArangoDB version and adjust any client applications if necessary
archetype: default
---
## Active Failover deployment mode

Running a single server with asynchronous replication to one or more passive
single servers for automatic failover is no longer supported from v3.12 onward.

You can use [cluster deployments](../../deploy/cluster/_index.md) instead, which
offer better resilience and synchronous replication. Also see the
[OneShard](../../deploy/oneshard.md) feature.

See [Single instance vs. Cluster deployments](../../deploy/single-instance-vs-cluster.md)
for details about how a cluster deployment differs and how to migrate to it.

## Little-endian on-disk key format for the RocksDB storage engine

ArangoDB 3.12 does not support the little-endian on-disk key for the RocksDB
storage engine anymore.

The little-endian on-disk key format was used for deployments that were created
with either ArangoDB 3.2 or 3.3 when using the RocksDB storage engine.
Since ArangoDB 3.4, a big-endian on-disk key format is used for the RocksDB
storage engine, which is more performant than the little-endian format.

Deployments that were set up with the RocksDB storage engine using ArangoDB 3.2
or 3.3 and that have been upgraded since then still use the old format.
This should not affect many users because the default storage engine in ArangoDB
3.2 and 3.3 was the MMFiles storage engine.
Furthermore, deployments that have been recreated from a dump using arangodump
since ArangoDB 3.4 are not affected because restoring a dump into a fresh
deployment also makes ArangoDB use the big-endian on-disk format.

ArangoDB 3.11 logs a warning message during startup when the little-endian
on-disk format is in use, but it still supports using the little-endian key format
for almost all operations, with the following exceptions:
- Parallel index creation is disabled when the little-endian key format is used.
  Indexes are always created using a single thread.
- The experimental version of arangodump (invocable via the `--use-experimental-dump` 
  startup option) does not work. You can still use the traditional
  arangodump version, which is the default anyway.

ArangoDB 3.12 and later refuse to start when detecting that the little-endian
on-disk is in use, so users that still use this format
**must migrate to the big-endian on-disk key format before upgrading to 3.12**.

The migration can be performed as follows:

1. Create a full logical backup of the database using [arangodump](../../components/tools/arangodump/_index.md)
2. Stop the database servers in the deployment
3. Wipe the existing database directories
4. Restart the servers in the deployment
5. Restore the logical dump into the deployment using arangodump

It is not sufficient to take a hot backup of a little-endian deployment and
restore it because when restoring a hot backup, the original database format is
restored as it was at time of the backup.

## In-memory cache subsystem

By default, the in-memory cache subsystem uses up to 95% of its configured
memory limit value (as configured by the `--cache.size` startup option).

Previous versions of ArangoDB effectively used only 56% of the configured memory
limit value for the cache subsystem. The 56% value was hard-coded in ArangoDB
versions before 3.11.3, and has been configurable since then via the 
`--cache.high-water-multiplier` startup option. To make things compatible, the 
default value for the high water multiplier was set to 56% in 3.11.

ArangoDB 3.12 now adjusts this default value to 95%, i.e. the cache subsystem
uses up to 95% of the configured memory. Although this is a behavior
change, it seems more sensible to use up to 95% of the configured limit value 
rather than just 56%.
The change can lead to the cache subsystem effectively using more memory than
before. In case a deployment's memory usage is already close to the maximum,
the change can lead to out-of-memory (OOM) kills. To avoid this, you have
two options:

1. Decrease the value of `--cache.high-water-multiplier` to 0.56, which should
   mimic the old behavior.
2. Leave the high water multiplier untouched, but decrease the value of the 
   `--cache.size` startup option to about half of its current value.

The second option is the recommended one, as it signals the intent more clearly,
and makes the cache behave "as expected", i.e. use up to the configured
memory limit and not just 56% of it.

## Higher reported memory usage for AQL queries

Due to the [improved memory accounting in v3.12](whats-new-in-3-12.md#improved-memory-accounting),
certain AQL queries may now get aborted because they exceed the defined
memory limit but didn't get killed in previous versions. This is because of the
more accurate memory tracking that reports a higher (actual) usage now. It allows
ArangoDB to more reliably detect and kill queries that go over the per-query and
global query memory limit, potentially preventing out-of-memory crashes of
_arangod_ processes.

In particular, AQL queries that perform write operations now report a
significantly higher `peakMemoryUsage` than before. This is also
reflected in the `arangodb_aql_global_memory_usage` metric. Memory used for
ArangoSearch `SEARCH` operations is now also accounted for in the metric.

You may need to adjust affected queries to use less memory or increase the
per-query limit with the [`memoryLimit` query option](../../aql/how-to-invoke-aql/with-arangosh.md#memorylimit)
or its default using the `--query.memory-limit` startup option. You can adjust
the global limit with the `--query.global-memory-limit` startup option.

## Adjustable Stream Transaction size

[Stream Transactions](../../develop/transactions/stream-transactions.md) may
now be limited to smaller transaction sizes because the maximum transaction size
can now be configured with the `--transaction.streaming-max-transaction-size`
startup option. The default value remains 128 MiB but configuring a lower limit
can cause previously working Stream Transactions to fail.

## Client tools

### jslint feature in arangosh

The `--jslint` startup option and all of the underlying functionality has been
removed from arangosh. The feature was mainly for internal purposes.

## HTTP RESTful API

### JavaScript-based traversal using `/_api/traversal`

The long-deprecated JavaScript-based traversal functionality has been removed
in v3.12.0, including the REST API endpoint `/_api/traversal`.

The functionality provided by this API was deprecated and unmaintained since
v3.4.0. JavaScript-based traversals have been replaced with AQL traversals in
v2.8.0. Additionally, the JavaScript-based traversal REST API could not handle
larger amounts of data and was thus very limited.

Users of the `/_api/traversal` REST API should use
[AQL traversal queries](../../aql/graphs/traversals.md) instead.

### HTTP server behavior

The following long-deprecated features have been removed from ArangoDB's HTTP
server:

- overriding the HTTP method by setting one of the HTTP headers:
  - `x-http-method`
  - `x-http-method-override`
  - `x-method-override`
 
   This functionality posed a potential security risk and was thus removed.
   Previously, it was only enabled when explicitly starting the 
   server with the `--http.allow-method-override` startup option.
   The functionality has now been removed and setting the startup option does
   nothing.

- optionally hiding ArangoDB's `server` response header. This functionality
  could optionally be enabled by starting the server with the startup option
  `--http.hide-product-header`.
  The functionality has now been removed and setting the startup option does
  nothing.

## JavaScript API

### `@arangodb/graph/traversal` module

The long-deprecated JavaScript-based traversal functionality has been removed in
v3.12.0, including the bundled `@arangodb/graph/traversal` JavaScript module.

The functionality provided by this traversal module was deprecated and
unmaintained since v3.4.0. JavaScript-based traversals have been replaced with
AQL traversals in v2.8.0. Additionally, the JavaScript-based traversals could
not handle larger amounts of data and were thus very limited.

Users of the JavaScript-based traversal API should use
[AQL traversal queries](../../aql/graphs/traversals.md) instead.

### Graph compatibility functions

The following long-deprecated compatibility graph functions have been removed
in ArangoDB 3.12. These functions were implemented as JavaScript user-defined 
AQL functions since ArangoDB 3.0:
  - `arangodb::GRAPH_EDGES(...)`
  - `arangodb::GRAPH_VERTICES(...)`
  - `arangodb::GRAPH_NEIGHBORS(...)`
  - `arangodb::GRAPH_COMMON_NEIGHBORS(...)`
  - `arangodb::GRAPH_COMMON_PROPERTIES(...)`
  - `arangodb::GRAPH_PATHS(...)`
  - `arangodb::GRAPH_SHORTEST_PATH(...)`
  - `arangodb::GRAPH_DISTANCE_TO(...)`
  - `arangodb::GRAPH_ABSOLUTE_ECCENTRICTIY(...)`
  - `arangodb::GRAPH_ECCENTRICTIY(...)`
  - `arangodb::GRAPH_ABSOLUTE_CLOSENESS(...)`
  - `arangodb::GRAPH_CLOSENESS(...)`
  - `arangodb::GRAPH_ABSOLUTE_BETWEENNESS(...)`
  - `arangodb::GRAPH_BETWEENNESS(...)`
  - `arangodb::GRAPH_RADIUS(...)`
  - `arangodb::GRAPH_DIAMETER(...)`

These functions were only available previously after explicitly calling the
`_registerCompatibilityFunctions()` function from any of the JavaScript graph
modules.
The `_registerCompatibilityFunctions()` exports have also been removed from
the JavaScript graph modules.

## Startup options

### `--database.extended-names` enabled by default

The `--database.extended-names` startup option is now enabled by default.
This allows you to use Unicode characters inside database names, collection names,
view names and index names by default, unless you explicitly turn off the
functionality.

Note that once a server in your deployment has been started with the flag set to
`true`, it stores this setting permanently. Switching the startup option back to
`false` raises a warning about the option change at startup, but it is not
blockig the startup.

Existing databases, collections, views and indexes with extended names can still
be used even with the option set back to `false`, but no new database objects
with extended names can be created with the option disabled. This state is only
meant to facilitate downgrading or reverting the option change. When the option
is set to `false`, all database objects with extended names that were created
in the meantime should be removed manually.

## Client tools

### arangodump

This following startup options of arangodump are obsolete from ArangoDB 3.12 on:

- `--envelope`: setting this option to `true` previously wrapped every dumped 
  document into a `{data, type}` envelope. 
  This was useful for the MMFiles storage engine, where dumps could also include 
  document removals. With the RocksDB storage engine, the envelope only caused 
  overhead and increased the size of the dumps. The default value of `--envelope`
  was changed to false in ArangoDB 3.9 already, so by default all arangodump 
  invocations since then created non-envelope dumps. With the option being removed 
  now, all arangodump invocations will unconditionally create non-envelope dumps.
- `--tick-start`: setting this option allowed to restrict the dumped data to some 
  time range with the MMFiles storage engine. It had no effect for the RocksDB 
  storage engine and so it is removed now.
- `--tick-end`: setting this option allowed to restrict the dumped data to some 
  time range with the MMFiles storage engine. It had no effect for the RocksDB 
  storage engine and so it is removed now.

### arangorestore

#### Maximum value for import errors

The new `--max-errors` option has been introduced to limit the amount of errors
displayed by _arangoimport_. The default value is `20`. When this value is reached,
the import will stop.

Previously, the import would continue even when there were many errors. To
achieve the same behavior with the new version, the value of `--max-errors` can
be set to a higher value.