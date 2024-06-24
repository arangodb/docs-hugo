---
title: Incompatible changes in ArangoDB 3.12
menuTitle: Incompatible changes in 3.12
weight: 15
description: >-
  Check the following list of potential breaking changes **before** upgrading to
  this ArangoDB version and adjust any client applications if necessary
---
## License change

ArangoDB changes the licensing model for the ArangoDB source code and the
Community Edition, starting with version 3.12.

The Apache 2.0 license is replaced by the source-available
Business Source License 1.1 (BUSL-1.1). The full license text is available on
GitHub: <https://github.com/arangodb/arangodb/blob/devel/LICENSE>

The official, prepackaged ArangoDB Community Edition binaries are now governed
by a new ArangoDB Community License, which limits the use for commercial purposes
to a 100 GB limit on dataset size in production within a single cluster and a
maximum of three clusters.

For details, see the
[Evolving ArangoDB's Licensing Model for a Sustainable Future](https://arangodb.com/2024/02/update-evolving-arangodbs-licensing-model-for-a-sustainable-future/)
blog post.

## Native Windows and macOS support removed

The native platform support for the Windows and macOS operating systems has been
removed and ArangoDB packages for Windows (installers, ZIP archives) and macOS
(_DMG_ packages, _tar.gz_ archives) are not provided anymore.

You can use the official [Docker images](https://hub.docker.com/_/arangodb/)
instead, to run ArangoDB in Linux containers, with
[Docker Desktop](https://www.docker.com/products/docker-desktop/), for instance.

The following Windows-specific startup options have been removed from _arangod_:

- `--start-service`
- `--install-service`
- `--uninstall-service`
- `--servicectl-start`
- `--servicectl-start-wait`
- `--servicectl-stop`
- `--servicectl-stop-wait`

Furthermore, the following _arangosh_ startup option has been removed:

- `--console.code-page`

The deprecated setting `5` (WinCrypt) for the `--random.generator` startup option
in the server and client tools has now been removed.

## Active Failover deployment mode removed

Running a single server with asynchronous replication to one or more passive
single servers for automatic failover is no longer supported from v3.12 onward.

You can use [cluster deployments](../../deploy/cluster/_index.md) instead, which
offer better resilience and synchronous replication. Also see the
[OneShard](../../deploy/oneshard.md) feature.

See [Single instance vs. Cluster deployments](../../deploy/single-instance-vs-cluster.md)
for details about how a cluster deployment differs and how to migrate to it.

## Datacenter-to-Datacenter Replication (DC2DC) removed

The _Datacenter-to-Datacenter Replication_ (DC2DC) for clusters including the
_arangosync_ tool is no longer supported from v3.12 onward.

## Pregel removed

The distributed iterative graph processing (Pregel) system is no longer supported
from v3.12 onward.

In detail, the following functionalities have been removed:
- All Pregel graph algorithms
- The `PREGEL_RESULT()` AQL function
- The `@arangodb/pregel` JavaScript API module
- The Pregel HTTP API (`/_api/control_pregel/*`)
- All `arangodb_pregel_*` metrics
- The `pregel` log topic
- The `--pregel.max-parallelism`, `--pregel.min-parallelism`, and
  `--pregel.parallelism` startup options

## LDAP authentication support removed

Support for ArangoDB user authentication with an LDAP server in the
Enterprise Edition has been removed.

- All `--ldap.*` and `--ldap2.*` startup options have been removed
- The `--server.local-authentication` startup option has been obsoleted and
  will be fully removed in a future version
- The `--server.authentication-timeout` startup option that mainly controlled
  the caching for LDAP authentication now only controls the cluster-internal
  authentication caching and shouldn't be touched
- The `ldap` log topic is no longer available and specifying it in the
  `--log.level` startup option raises a warning
- The `ERROR_LDAP_*` error codes with the numbers in the range from `1800`
  through `1820` have been removed

## Little-endian on-disk key format for the RocksDB storage engine unsupported

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

## VelocyStream protocol removed

ArangoDB's own bi-directional asynchronous binary protocol VelocyStream is no
longer supported.

The server immediately closes the connection if you attempt to use the
VelocyStream protocol. If you specify any scheme starting with `vst` in the
`--server.endpoint` startup option of a client tool, the HTTP protocol is used
instead.

The following metrics related to VelocyStream have been removed:
- `arangodb_request_body_size_vst`
- `arangodb_vst_connections_total`

VelocyPack remains as ArangoDB's binary storage format and you can continue to
use it in transport over the HTTP protocol, as well as use JSON over the
HTTP protocol.

## Incompatibilities due to switch to glibc

From version 3.11.10 onward, ArangoDB uses the glibc C standard library
implementation instead of libmusl. Even though glibc is statically linked into
the ArangoDB server and client tool executables, it may load additional modules
at runtime that are installed on your system. Under rare circumstances, it is
possible that ArangoDB crashes when performing host name or address lookups.
This is only the case if all of the following conditions are true:

- You use an ArangoDB package on bare metal (not a Docker container)
- Your operating system uses glibc (like Ubuntu, Debian, RedHat, Centos, or
  most other Linux distributions, but not Alpine for instance)
- The glibc version of your system is different than the one used by ArangoDB,
  in particular if the system glibc is older than version 2.35
- The `libnss-*` dynamic libraries are installed
- The `/etc/nsswitch.conf` configuration file contains settings other than for
  `files` and `dns` in the `hosts:` line

If you are affected, consider using Docker containers, `chroot`, or change
`nsswitch.conf`.

## JavaScript Transactions deprecated

Server-side transactions written in JavaScript and executed via the
`db._executeTransaction()` method of the JavaScript API or the
`POST /_api/transaction` endpoint of the HTTP API are deprecated from v3.12.0
onward and will be removed in a future version.

You can use [Stream Transactions](../../develop/transactions/stream-transactions.md)
instead in most cases, and in some cases AQL can be sufficient.

## Default server language changed

ArangoDB initializes its storage (the so called database directory) when running
for the first time, typically when creating a new deployment. You can specify
a locale for the initialization with the `--icu-language` startup option (or with
the deprecated `--default-language` startup option). The server language that
you set this way affects the sorting and comparison behavior for text globally,
with a few exceptions like the [`collation` Analyzer](../../index-and-search/analyzers.md#collation).

If you don't specify a language using a startup option, the `LANG` environment
variable is checked. If it's not set or has an invalid value, the effective
fallback locale used to be `en_US` in ArangoDB v3.11 and older versions.
From v3.12.0 onward, the default is `en_US_POSIX` (also known as the C locale).
It has a slightly different sorting behavior compared to `en_US`.

When upgrading existing deployments to v3.12, the database directory is already
initialized and has the server language locked in. If the locale is `en_US`
before the upgrade, it is also `en_US` after the upgrade. Therefore, the sorting
behavior remains unchanged. However, new deployments use the `en_US_POSIX` locale
by default. If you, for instance, restore a v3.11 dump into a new v3.12 instance,
the sorting behavior may change. You may want to set a server language explicitly
when initializing the v3.12 instance to retain a specific sorting behavior.

## Incompatibilities with Unicode text between core and JavaScript

ArangoDB 3.12 uses the ICU library for Unicode handling in version 64 for its core
(ArangoSearch, AQL, RocksDB) but version 73 in [JavaScript contexts](../../develop/javascript-api/_index.md).
If you compare or sort string values with JavaScript and with the core, the values
may not match between the two or have a different order. This is due to changes
in the Unicode standard and the binary representation of strings for comparisons.

You can be affected if you use JavaScript-based features like Foxx microservices
or user-defined AQL functions (UDFs), compare or sort strings in them, and
Unicode characters for which the standard has changed between the two ICU versions
are involved.

## Stricter option validation when creating collections

Some invalid attributes and values that you can specify in the HTTP API when
creating collections are no longer allowed. Previous versions ignored these
invalid options. See [API Changes in ArangoDB 3.12](api-changes-in-3-12.md#collection-api)
for details.

## Control character escaping in audit log

The audit log feature of the Enterprise Edition previously logged query strings
verbatim. Control characters, in particular line breaks, can cause issues with
parsing the audit log. They are now escaped for query strings which often contain
line breaks.

## Higher reported memory usage for AQL queries

Due to the [improved memory accounting in v3.12](whats-new-in-3-12.md#improved-memory-accounting-and-usage),
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

## Exit code adjustments

<small>Introduced in: v3.10.13, v3.11.7</small>

For some fatal errors like a required database upgrade or a failed version check,
_arangod_ set the generic exit code of `1`. It now returns a different, more
specific exit code in these cases.

## Validation of `smartGraphAttribute` in SmartGraphs

<small>Introduced in: v3.10.13, v3.11.7</small>

The attribute defined by the `smartGraphAttribute` graph property is not allowed to be
changed in the documents of SmartGraph vertex collections. This is now strictly enforced.
See [API Changes in ArangoDB 3.12](api-changes-in-3-12.md#validation-of-smartgraphattribute-in-smartgraphs)
for details and instructions on how to repair affected attributes.

## Dropping graph collections disallowed

Dropping a collection now strictly enforces that graph definitions remain intact.
Previously, it was allowed to drop collections that were part of an existing graph.
Trying to do so now results in the error `ERROR_GRAPH_MUST_NOT_DROP_COLLECTION`
with the number `1942`.

This may require changes in the client application code that drops individual
collections from graphs for clean-up purposes. You can drop an entire graph
and its collections along with it, as long as they aren't used in another graph.
To remove individual collections, update or remove edge definitions first to not
include the desired collections anymore. In case of vertex collections, they
become orphan collections that you need to remove from the graph definition as
well to drop the collections.

## HTTP RESTful API

### JavaScript-based traversal using `/_api/traversal` removed

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

### Graph API (Gharial) behavior

- The `PATCH /_api/gharial/{graph}/edge/{collection}/{edge}` endpoint to update
  edges in named graphs now validates the referenced vertex when modifying either
  the `_from` or `_to` edge attribute. Previously, the validation only occurred if
  both were set in the request.

- A new error code `1949` with the name `TRI_ERROR_GRAPH_VERTEX_COLLECTION_NOT_USED`
  has been added is now returned instead of `TRI_ERROR_GRAPH_REFERENCED_VERTEX_COLLECTION_NOT_USED`
  with the code `1947` if you attempt to read from or write to a vertex collection
  through the graph API but the collection is not part of the graph definition.

- The error code `1947` with the name `TRI_ERROR_GRAPH_REFERENCED_VERTEX_COLLECTION_NOT_USED`
  has been renamed to `ERROR_GRAPH_REFERENCED_VERTEX_COLLECTION_NOT_PART_OF_THE_GRAPH`.
  This error is (now only) raised if you attempt to reference a document in the
  `_from` or `_to` attribute of an edge but the document's collection is not
  part of the graph definition.

## JavaScript API

### `@arangodb/graph/traversal` module removed

The long-deprecated JavaScript-based traversal functionality has been removed in
v3.12.0, including the bundled `@arangodb/graph/traversal` JavaScript module.

The functionality provided by this traversal module was deprecated and
unmaintained since v3.4.0. JavaScript-based traversals have been replaced with
AQL traversals in v2.8.0. Additionally, the JavaScript-based traversals could
not handle larger amounts of data and were thus very limited.

Users of the JavaScript-based traversal API should use
[AQL traversal queries](../../aql/graphs/traversals.md) instead.

### Graph compatibility functions removed

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

### Changed TTL index removal default

The default value of the `--ttl.max-collection-removes` startup option has been
lowered from 1 million to 100,000. The background thread for time-to-live indexes
now removes fewer documents from a collection in each iteration to give other
collections a chance of being cleaned up as well.

### Increased RocksDB block cache usage

The following startup options are now enabled by default:

  - `--rocksdb.reserve-table-builder-memory`
  - `--rocksdb.reserve-table-reader-memory`
  - `--rocksdb.reserve-file-metadata-memory`

This makes the memory accounting for RocksDB more accurate and helps to not
allocate more memory than is configured by tracking the memory use for
table building, tabling reading, file metadata, flushes and compactions and
including it in the existing `rocksdb_block_cache_usage` metric.

This slightly decreases performance due to using the block cache for additional
things, and you may need to allow ArangoDB to use more memory for the RocksDB
block cache than before with the `--rocksdb.block-cache-size` startup option.

## Client tools

### arangodump

This following startup options of arangodump are obsolete from ArangoDB 3.12 on:

#### Obsolete envelope and tick startup options

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

### arangoimport

#### Maximum number of import errors

The new `--max-errors` startup option limits the amount of errors displayed by
_arangoimport_, and the import is stopped when this value is reached.
The default value is `20`.

Previously, the import would continue even when there were many errors. To
achieve a similar behavior with the new version, set the value of `--max-errors`
to a high value.

#### Automatic file format detection

*arangoimport* now automatically detects the type of the import file based on
the file extension. The default value of the `--type` startup option has been
changed from `json` to `auto`. You might need to explicitly specify the `--type`
in exceptional cases now whereas it was not necessary to do so previously.

### jslint feature in arangosh removed

The `--jslint` startup option and all of the underlying functionality has been
removed from arangosh. The feature was mainly for internal purposes.
