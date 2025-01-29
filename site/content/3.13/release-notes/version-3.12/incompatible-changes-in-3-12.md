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

- You either use ArangoDB version 3.11.10 (non-hotfix) or 3.12.0, or you use a
  3.11 version from 3.11.10-1 onward respectively 3.12.1 or any later version
  with the `--honor-nsswitch` startup option enabled.
- You use an ArangoDB package on bare metal (not a Docker container)
- Your operating system uses glibc (like Ubuntu, Debian, RedHat, Centos, or
  most other Linux distributions, but not Alpine for instance)
- The glibc version of your system is different than the one used by ArangoDB,
  in particular if the system glibc is older than version 2.35
- The `libnss-*` dynamic libraries are installed
- The `/etc/nsswitch.conf` configuration file contains settings other than for
  `files` and `dns` in the `hosts:` line, or the `passwd:` and `group:` lines
  contain something other than `files`

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
startup option. The default value remains 128 MiB (up to v3.12.3) but configuring
a lower limit can cause previously working Stream Transactions to fail.
From v3.12.4 onward, the default value is 512 MiB.

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

## Short-circuiting subquery evaluation

<small>Introduced in: v3.12.1</small>

Subqueries you use in ternary expressions are no longer executed unconditionally
before the condition is evaluated. Only the subquery of the branch that is taken
effectively executes.

Similarly, when you use subqueries as sub-expressions that are combined with
logical `AND` or `OR`, the subqueries are now evaluated lazily.

If you rely on the previous behavior of v3.12.0 or older, you need to rewrite
affected AQL queries so that the subqueries are executed first.

For example, the following query with a subquery in the false branch of a ternary
operator only creates a new document if the condition evaluates to false from
v3.12.1 onward:

```aql
RETURN RAND() > 0.5 ? "yes" : (INSERT {} INTO coll RETURN "no")[0]
```

To restore the behavior of v3.12.0 and older where the subquery is always executed,
pull the subquery out of the ternary operator expression and save the result to
a variable, then use this variable where the subquery used to be:

```aql
LET tmp = (INSERT {} INTO coll RETURN "no")[0]
RETURN RAND() > 0.5 ? "yes" : tmp
```

This also applies to expressions that are combined with logical `AND` or `OR`.
A subquery to the right-hand side of an `AND` is effectively only executed if
the expression to the left-hand side is truthy, and with an `OR`, the
right-hand side is effectively only executed if the left-hand side is falsy
from v3.12.1 onward.

```aql
RETURN RAND() > 0.5 && (INSERT {} INTO coll RETURN 42)[0]
```

To execute the subquery regardless of the left-hand side expression, execute
the subquery first:

```aql
LET tmp = (INSERT {} INTO coll RETURN 42)[0]
RETURN RAND() > 0.5 && tmp
```

Also see [What's New in 3.12](whats-new-in-3-12.md#short-circuiting-subquery-evaluation)
and [Evaluation of subqueries](../../aql/fundamentals/subqueries.md#evaluation-of-subqueries)
for more information.

## Corrected sorting order for VelocyPack indexes

<small>Introduced in: v3.11.11, v3.12.2</small>

If you store very large numeric values in ArangoDB – greater than/equal to
2<sup>53</sup> (9,007,199,254,740,992) or less than/equal to
-(2<sup>53</sup>) (-9,007,199,254,740,992) – and index them with an affected
index type, the values may not be in the correct order. This is due to how the
comparison is executed in versions before v3.11.11 and v3.12.2. If the numbers
are represented using different VelocyPack types internally, they are converted
to doubles and then compared. This conversion is lossy for very large (unsigned)
integer values, resulting in an incorrect ordering of the values.

The possibly affected index types are the following that allow storing
VelocyPack data in them:
- `persistent` (including vertex-centric indexes)
- `mdi-prefixed` (but not `mdi` indexes; only available from v3.12.0 onward)
- `hash` (legacy alias for persistent indexes)
- `skiplist` (legacy alias for persistent indexes)

{{< warning >}}
The incorrect sort order in an index can lead to the RocksDB storage engine
discovering out-of-order keys and then refusing further write operations with
errors and warnings.
{{< /warning >}}

To prevent ArangoDB deployments from entering a read-only mode due to this issue,
please follow the below procedures to check if your deployment is affected and
how to correct it if necessary.

**Check if you are affected**

The following procedure is recommended for every deployment unless it has been
created with v3.11.11, v3.12.2, or any later version.

1. Call the `GET /_admin/cluster/vpackSortMigration/check` endpoint to let
   ArangoDB check all indexes. As it can take a while for large deployments,
   it is recommended to run this operation as an asynchronous job
   (`x-arango-async: store` header) so that you can check the result later.

   The endpoint is available for all deployment modes, not only in clusters.
   In case of a cluster, send the request to one of the Coordinators.
   Example with ArangoDB running locally on the default port:

   ```shell
   curl --dump-header -H "x-arango-async: store" http://localhost:8529/_admin/cluster/vpackSortMigration/check
   ```

2. Inspect the response to find the job ID in the `X-Arango-Async-Id` HTTP header.
   The job ID is `12345` in the following example:

   ```
   HTTP/1.1 202 Accepted
   X-Arango-Queue-Time-Seconds: 0.000000
   Strict-Transport-Security: max-age=31536000 ; includeSubDomains
   Expires: 0
   Pragma: no-cache
   Cache-Control: no-cache, no-store, must-revalidate, pre-check=0, post-check=0, max-age=0, s-maxage=0
   Content-Security-Policy: frame-ancestors 'self'; form-action 'self';
   X-Content-Type-Options: nosniff
   X-Arango-Async-Id: 12345
   Server: ArangoDB
   Connection: Keep-Alive
   Content-Type: text/plain; charset=utf-8
   Content-Length: 0
   ```

3. Call the `PUT /_api/job/12345` endpoint, substituting `12345` with your
   actual job ID. It returns nothing if the job is still ongoing. You can repeat
   this call every once in a while to check again.

   ```shell
   curl -XPUT http://localhost:8529/_api/job/12345
   ```

4. If there are no issues with your deployment, the check result reports an
   empty list of affected indexes and an according message.
   
   ```json
   {
     "error": false,
     "code": 200,
     "result": {
       "affected": [],
       "error": false,
       "errorCode": 0,
       "errorMessage": "all good with sorting order"
     }
   }
   ```

   If this is the case, continue with the following procedure for unaffected
   deployments. Otherwise, follow the procedure for affected deployments below.

**If the deployment is NOT affected**

1. Make sure that no problematic values are written to or removed from an index
   between checking for affected indexes and completing the procedure.
   To be safe, you may want to stop all writes to the database system.

2. You can perform a regular in-place upgrade and mark the deployment as correct
   using a special HTTP API endpoint in the next step.

   That is, create a backup and upgrade your deployment to the
   latest bugfix version with the same major and minor version (e.g. from 3.11.x
   to at least 3.11.11 or from 3.12.x to at least 3.12.2).
   
3. Call the `PUT /_admin/cluster/vpackSortMigration/migrate` endpoint to mark
   the deployment as having the correct sorting order. This requires
   [superuser permissions](../../develop/http-api/authentication.md#jwt-superuser-tokens)
   unless authentication is disabled.

   ```shell
   curl -H "Authorization: bearer <superuser-token>" -XPUT http://localhost:8529/_admin/cluster/vpackSortMigration/migrate
   ```

   ```json
   {
     "error": false,
     "code": 200,
     "result": {
       "error": false,
       "errorCode": 0,
       "errorMessage": "VPack sorting migration done."
     }
   }
   ```

4. Complete the procedure by resuming writes to the database systems.

**If the deployment is affected**

1. If affected indexes are found, the check result looks similar to this:

   ```json
   {
     "error": false,
     "code": 200,
     "result": {
       "affected": [
         {
           "database": "_system",
           "collection": "coll",
           "indexId": 195,
           "indexName": "idx_1806192152446763008"
         }
       ],
       "error": true,
       "errorCode": 1242,
       "errorMessage": "some indexes have legacy sorted keys"
     }
   }
   ```

2. If you are a customer, please contact the ArangoDB support to assist you with
   the following steps.

3. This step depends on the deployment mode:

   - **Single server**: Create a full dump with [arangodump](../../components/tools/arangodump/_index.md),
     using the `--all-databases` and `--include-system-collections` startup options
     and a user account with administrate access to the `_system` database and
     at least read access to all other databases to ensure all data including
     the `_users` system collection are dumped.
     
     Restore the dump to a new single server using at least v3.11.11 or v3.12.2.
     You need to use a new database directory.

   - **Cluster**: Replace the DB-Server nodes until they all run at least
     v3.11.11 or v3.12.2 (rolling upgrade). Syncing new nodes writes the data in
     the correct order. This deployment mode and approach avoids downtimes.

     For each DB-Server, add a new DB-Server node to the cluster. Wait until all
     new DB-Servers are in sync, then clean out the old DB-Server nodes.

4. New instances using the fixed versions initialize the database directory
   with the sorting order marked as correct and also restore data from dumps
   correctly.

   If you revert to an older state with affected indexes by restoring a
   Hot Backup, you need to repeat the procedure.

## Changed JSON serialization and VelocyPack format for replication

<small>Introduced in: v3.12.3</small>

While there is only one number type in JSON, the VelocyPack format that ArangoDB
uses supports different numeric data types. When converting between VelocyPack
and JSON, it was previously possible for precision loss to occur in edge cases.
This also affected creating and restoring dumps with arangodump and arangorestore.

A double (64-bit floating-point) value `1152921504606846976.0` (2<sup>60</sup>)
used to be serialized to `1152921504606847000` in JSON, which deserializes back
to `1152921504606846976` when using a double. However, the serialized value got
parsed as an unsigned integer, resulting in an incorrect value of
`1152921504606847000`.

Numbers with an absolute value greater or equal to 2<sup>53</sup> and less than
2<sup>64</sup> (which always represents an integer) are now serialized faithfully
to JSON using an integer conversion routine and then `.0` is appended (e.g.
`1152921504606846976.0`) to ensure that they get parsed back to the exact same
double value. All other values are serialized as before, e.g. small integral
values don't get `.0` appended, and they get parsed back to integers with the
same numerical value.

Moreover, replication-related APIs such as the `/_api/wal/tail` endpoint now
support the VelocyPack format. The cluster replication has been changed to use
VelocyPack instead of JSON to avoid unnecessary conversions and avoiding any
risk of deviations due to the serialization.

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

### Batch request endpoint removed

<small>Removed in: v3.12.3</small>

The `/_api/batch` endpoints that let you send multiple operations in a single
HTTP request was deprecated in v3.8.0 and has now been removed.

To send multiple documents at once to an ArangoDB instance, please use the
[HTTP interface for documents](../../develop/http-api/documents.md#multiple-document-operations)
that can insert, update, replace, or remove arrays of documents.

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

#### `mmap` log topic removed

<small>Introduced in: v3.12.1</small>

The `mmap` log topic for logging information related to memory mapping has been
unused since v3.12.0 and has now been removed. Attempts to set the log level for
this topic logs a warning, for example, using a startup option like
`--log.level mmap=trace`.

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

#### Decreased default batch size

<small>Introduced in: v3.12.4</small>

The default value of the `--batch-size` startup option has been lowered from
8 MiB to 4 MiB to avoid potential resource limits, in particular when importing
to smart edge collections.

### jslint feature in arangosh removed

The `--jslint` startup option and all of the underlying functionality has been
removed from arangosh. The feature was mainly for internal purposes.

### arangobench

#### Batch size option removed

<small>Removed in: v3.12.3</small>

The `--batch-size` startup option is now ignored by arangobench and no longer
has an effect. It allowed you to specify the number of operations to issue in
one batch but the batch request API has been removed on the server-side.
