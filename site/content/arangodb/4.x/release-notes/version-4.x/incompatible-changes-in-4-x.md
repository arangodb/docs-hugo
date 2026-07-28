---
title: Incompatible changes in ArangoDB 4.x
menuTitle: Incompatible changes in 4.x
weight: 15
description: >-
  Check the following list of potential breaking changes **before** upgrading to
  this ArangoDB version and adjust any client applications if necessary
---
## New CPU requirements

The minimum requirements to run ArangoDB were previously met by processors
using the Intel Sandy Bridge (2011), AMD Bulldozer (2011), or better
microarchitectures, as well as 64-bit CPUs based on ARMv8 with NEON.

ArangoDB 4.x now requires newer microarchitectures/designs and can utilize
their instruction set extensions for improved performance:

- **x86-64**: Intel Haswell (2013) or better, AMD Excavator (2015) or better, etc.
- **ARM**: CPUs like AWS Graviton2 with ARM Neoverse N1 cores.

For more details about the necessary CPU features, see
[Supported platforms and architectures](../../operations/installation/_index.md#supported-platforms-and-architectures).

## Built-in web interface removed

The web interface served by the ArangoDB server (_arangod_), also known as
_Aardvark_, has been removed. The server executable no longer offers a
built-in web interface.

- If you use the Arango Contextual Data Platform, there is a new, integrated
  web interface also known as the platform UI.
- If you use ArangoDB standalone, there is a new web interface you can run
  alongside the server also known as the core UI.

The following startup options related to the old web interface have been removed:

- `--http.permanently-redirect-root`
- `--http.redirect-root-to`
- `--web-interface.proxy-request-check`
- `--web-interface.trusted-proxy`
- `--web-interface.version-check`

## JavaScript Transactions removed

Submitting single-request transactions that leverage ArangoDB's JavaScript API
to run complex operations is no longer supported.
The feature was deprecated in v3.12.0.

This removes the `db._executeTransaction()` function from the JavaScript API
and the `POST /_api/transaction` endpoint from the HTTP API.

For rather simple transactions, you might be able to use [AQL queries](../../aql/_index.md)
instead. Subqueries and the ternary operator are useful tools for this.
You can read from multiple collections as well as write to multiple collections,
but you cannot perform reads after writes for a given collection.

To port more complex transactions, you may use
[Stream Transactions](../../develop/transactions/stream-transactions.md).
The main operations they support are document CRUD and AQL queries. Unlike
with JavaScript Transactions, you can start a Stream Transaction, then issue
individual operations, and eventually decide whether to abort or commit the
transaction with all its operations. You can therefore put logic on the
client-side if it's too complex to port to AQL.

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
of endpoints, see [API Changes in ArangoDB 4.x](api-changes-in-4-x.md#foxx-api-removed).

The `GET /_admin/status` no longer includes a `coordinator` object with the
attributes `foxxmaster` and `isFoxxmaster`.

The `@arangodb/foxx` module and the related `@arangodb/locals` module as well as
`global.fm` have been removed from the JavaScript API.

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
async libraries, or use different programming languages altogether.

Any existing Foxx services you still require need to be rewritten for the
data platform. You may consider using AI tools for this. You can use Node.js or
other environments respectively programming languages. You can run the
replacements inside the data platform in containers as user-defined services,
using your preferred technology.

## User-defined AQL functions removed

The ability to register custom functions for the AQL query language written
in JavaScript has been removed.

The AQL optimizer had no insight into such user-defined functions (UDFs) and
they had to be executed on Coordinators where all server-side JavaScript code
was run. This caused them to perform poorly when a lot of data was involved
that had to be transferred between cluster nodes.

<!-- TODO: Hygenic macros for some use cases (once supported) -->

The following startup option is now obsolete:

- `--javascript.user-defined-functions`

You can still specify this startup option without causing a fatal error during
startup. It is recognized, but it doesn't have any effect anymore.

The `/_api/aqlfunction*` endpoints have been removed from the HTTP API.

The `@arangodb/aql/functions` module has been removed from the JavaScript API.

## Legacy `geo1` and `geo2` indexes are dropped

In ArangoDB v3.3 and older, there were two geo-spatial index types for either
indexing a single attribute with a coordinate pair (`geo1`) or two separate
attributes with the latitude and longitude (`geo2`). The upgrade to ArangoDB v3.4
rewrote these locally to a new on-disk format for the RocksDB storage engine.

- On single servers, this also changed the types to the unified `geo` index type.
- In cluster deployments, the original `geo1` and `geo2` types were preserved
  as-is in the Agency.

Any geo-spatial indexes created in v3.4 or later have the `geo` type.
Old cluster deployments may still have legacy geo-spatial indexes, however.

When upgrading to ArangoDB v4.0, any `geo1` and `geo2` are dropped automatically.
Create matching `geo` indexes manually if necessary.

## Legacy `fulltext` index type removed

The old index type for full-text has been removed in ArangoDB v4.0. It was
deprecated in v3.10.0. It offered basic search capabilities for full words
and word prefixes in conjunction with the `FULLTEXT()` AQL function, which has
been removed, too.

The `replace-function-with-index` AQL optimizer rule has been removed as well,
because it was only needed for the `FULLTEXT()` function.

Furthermore, the error code `ERROR_QUERY_FULLTEXT_INDEX_MISSING` with number
`1571` has been removed.

When you upgrade to v4.0.0 or later, existing `fulltext` indexes are
**automatically dropped**. You can use the more powerful but eventually consistent
[ArangoSearch](../../indexes-and-search/arangosearch/_index.md) instead.
It provides sophisticated search capabilities for full-text and other data.
You need to manually create `inverted` indexes, Views, or both and rewrite
AQL queries to use them.

## `hash` and `skiplist` index type aliases removed

ArangoDB never supported true `hash` and `skiplist` indexes with the RocksDB
storage engine. It merely allowed these index types to be used as aliases for
the `persistent` index type. These aliases have now been removed.

Existing `hash` and `skiplist` indexes are automatically changed to `persistent`
indexes when upgrading. The suffix `_migrated` is appended to their name.
When restoring dumps with _arangorestore_, the former aliases are replaced with
the `persistent` index type.

## Removed AQL functions

- `FULLTEXT()`: Removed because the legacy `fulltext` index type is gone.
  thus this function served no purpose either.

- `V8()`: There is no longer a V8 JavaScript engine on the server-side to
  enforce for query expressions.

- `IS_IN_POLYGON()`: Long deprecated and removed in favor of the
  [`GEO_CONTAINS()` AQL function](../../aql/functions/geo.md#geo_contains),
  which works with [GeoJSON](https://tools.ietf.org/html/rfc7946) Polygons and
  MultiPolygons. Note that these use geodesic lines from version 3.10.0 onward
  (see [GeoJSON interpretation](../../aql/functions/geo.md#geojson-interpretation)).

- `NEAR()`: Long deprecated and now removed. Use [`DISTANCE()`](../../aql/functions/geo.md#distance)
  in a query like this instead:

  ```aql
  FOR doc IN coll
    SORT DISTANCE(doc.latitude, doc.longitude, paramLatitude, paramLongitude) ASC
    RETURN doc
  ```

  Assuming there exists a geo-type index on `latitude` and `longitude`, the
  optimizer recognizes it and accelerates the query.

- `WITHIN()`: Long deprecated and now removed. Use [`DISTANCE()`](../../aql/functions/geo.md#distance)
  in a query like this instead:

  ```aql
  FOR doc IN coll
    LET d = DISTANCE(doc.latitude, doc.longitude, paramLatitude, paramLongitude)
    FILTER d <= radius
    SORT d ASC
    RETURN doc
  ```

  Assuming there exists a geo-type index on `latitude` and `longitude`, the
  optimizer recognizes it and accelerates the query.

- `WITHIN_RECTANGLE()`: Long deprecated and now removed. Use
  [`GEO_CONTAINS()`](../../aql/functions/geo.md#geo_contains)
  and a GeoJSON polygon instead - but note that this uses geodesic lines from
  version 3.10.0 onward (see [GeoJSON interpretation](../../aql/functions/geo.md#geojson-interpretation)):

  ```aql
  LET rect = GEO_POLYGON([ [
    [longitude1, latitude1], // bottom-left
    [longitude2, latitude1], // bottom-right
    [longitude2, latitude2], // top-right
    [longitude1, latitude2], // top-left
    [longitude1, latitude1], // bottom-left
  ] ])
  FOR doc IN coll
    FILTER GEO_CONTAINS(rect, [doc.longitude, doc.latitude])
    RETURN doc
  ```

  Assuming there exists a geo-type index on `latitude` and `longitude`, the
  optimizer recognizes it and accelerates the query.

## Deprecated AQL options removed

In AQL graph traversals, you can no longer specify the `bfs` attribute in the
`OPTIONS` object. To enable breadth-first search, use `order: "bfs"` instead of
`bfs: true`.

The `INSERT` operation no longer supports the `overwrite` attribute in the
`OPTIONS` object to replace a document if there is already one with the same
document key. To specify the behavior for how to resolve collisions, use
`overwriteMode` instead. A setting of `overwriteMode: "replace"` is the same
as the former `overwrite: true`.

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

The follow metrics about the statistics feature itself have been removed:
- `arangodb_request_statistics_memory_usage`
- `arangodb_connection_statistics_memory_usage`

You can get more detailed information for monitoring ArangoDB via the
[`/_admin/metrics` endpoint](../../develop/http-api/monitoring/metrics.md)
in Prometheus format.

## AQL

### Duplicate attribute names in object literals

If an object literal contains the same attribute name more than once, the
**last occurrence** now wins and determines the value of the attribute. In
previous versions, the **first occurrence** determined the value.

```aql
RETURN { foo: 1, foo: 2 }
```

The query now returns `{ "foo": 2 }`, whereas it returned `{ "foo": 1 }` in
v3.12 and older.

This change of behavior comes with the introduction of the
[spread syntax](../../aql/operators.md#object-spread-syntax) `...` for object
literals, which follows the same last-one-wins semantics, consistent with
object spreading in JavaScript.

### AQL `+` operator overloaded for string concatenation

The behavior of the `+` operator in AQL has changed. It is now overloaded so that
it performs string concatenation if at least one of its two operands is a string.
It only performs arithmetic addition if **both** operands are non-string values.
This makes it behave similarly to the `+` operator in JavaScript.

In previous versions, the `+` operator always performed arithmetic addition. It
cast any string operands to numbers using the
[`TO_NUMBER()`](../../aql/functions/type-check-and-cast.md#to_number) rules, so
non-numeric strings became `0` and numeric strings became their numeric value.

The following table shows how the result of `+` changes when at least one operand
is a string:

| Expression      | Result before v4.0 | Result from v4.0 onward |
|:----------------|:-------------------|:------------------------|
| `"foo" + "bar"` | `0`                | `"foobar"`              |
| `"foo" + 123`   | `123`              | `"foo123"`              |
| `"123" + 200`   | `323`              | `"123200"`              |
| `1 + "99"`      | `100`              | `"199"`                 |
{.fixed}

Expressions where both operands are non-string values are not affected and still
perform arithmetic addition, for example, `1 + 2` still evaluates to `3`.

This is a potentially breaking change because queries that relied on the previous
implicit string-to-number casting of the `+` operator now return strings instead
of numbers. Review your queries and use the
[`TO_NUMBER()`](../../aql/functions/type-check-and-cast.md#to_number) function to
explicitly cast string operands to numbers where you want arithmetic addition.
For string concatenation, you can rely on the new `+` operator behavior or use
the [`CONCAT()`](../../aql/functions/string.md#concat) function.

For more information, see [String operators](../../aql/operators.md#string-operators).

## Rclone upgrades possibly requiring configuration changes

<small>Introduced in: v3.12.9-2</small>

Rclone is used by ArangoDB for uploading and downloading Hot Backups to and from
object storage, often using cloud provider services like AWS's S3 or S3-compatible
offerings.

To transfer Hot Backups this way, rclone requires a configuration file to
specify the provider, region, and so on. The configuration is typically
backwards compatible, but behavioral changes on the provider side or of
technical nature may require that you modify the configuration.

The version of the bundled rclone has been updated in the ArangoDB hotfix releases
3.12.9-2 and 3.12.9-4. These and later versions may therefore require action
regarding the rclone configuration:

| ArangoDB version | Rclone version    |
|:-----------------|:------------------|
| v3.12.9          | v1.65.2           |
| v3.12.9-1        | v1.65.2           |
| v3.12.9-2        | v1.73.5 (updated) |
| v3.12.9-3        | v1.73.5           |
| v3.12.9-4        | v1.74.3 (updated) |

You should check for the following things in particular:

- If you use AWS S3 and a region other than `us-east-1`, you need to either specify the
  region in the `location_constraint` (e.g. `"location_constraint": "eu-central-1"`),
  set `"no_check_bucket": "true"`, or both.

  Otherwise, rclone makes a check with an unspecified location constraint which
  AWS rejects (IllegalLocationConstraintException). This is caused by an upgrade
  to the AWS SDK v2 in rclone v1.68.0.

- If you use an S3-compatible provider like GCS, Ceph, MinIO, Wasabi, or older
  gateways, uploads may fail unless you set `"use_data_integrity_protections": "false"`.

  The upgrade to the AWS SDK v2 in rclone v1.68.0 changed the default algorithm
  for data integrity checksums to CRC32/CRC64. While this is supported by AWS,
  other S3-compatible providers may still expect MD5 and therefore fail. Later
  rclone versions may automatically account for this quirk for certain providers.

- If you use an S3-compatible provider, there may be quirks that rclone should
  automatically handle for known providers. For example, `use_x_id` is disabled
  for GCS. Other options that are auto-set per provider are `sign_accept_encoding`
  and `use_multipart_uploads`.

  You might need to force specific settings in case your provider is not known
  to rclone and therefore doesn't handle specific quirks on its own.

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
[API Changes in ArangoDB 4.x](api-changes-in-4-x.md#simple-queries-endpoints-removed).

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

### `overwrite` option removed from document API

The `POST /_api/document/{collection}` endpoint for creating a single document
or multiple documents no longer supports the `overwrite` query parameter.
If you want to replace existing documents that have the same document keys,
specify how to resolve collisions with the `overwriteMode` query parameter.
You can set `overwriteMode` to `"replace"` to achieve the same as formerly
setting `overwrite` to `true`.

### `minReplicationFactor` removed from collections

The deprecated alias for `writeConcern` has been removed. You can no longer set
the write concern using `minReplicationFactor` for collections and
collections also don't report this attribute anymore. Use `writeConcern` instead.

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

Moreover, the following deprecated sub-attribute has been removed from the endpoint:
- `serverInfo.writeOpsEnabled`

### Upload API removed

The `POST /_api/upload` endpoint has been removed due to the removal of Foxx.
It was used for service bundle and file uploads.

### Routing reload API removed

The `POST /_admin/routing/reload` endpoint has been removed due to the removal
of the Action and Foxx features. It was used to reload the routing information
from the `_routing` system collection and make Foxx rebuild its local routing
table on the next request.

### Echo API removed

The `/_admin/echo` endpoints supporting the `HEAD`, `GET`, `POST`, `PATCH`,
`PUT`, `DELETE`, and `OPTIONS` HTTP methods have been removed. They returned
an object with the servers request information, the HTTP request headers, or
both and were used for debugging purposes.

### Metrics API v2 endpoint removed

Since ArangoDB v3.10.0, the `/_admin/metrics` and `/_admin/metrics/v2` endpoints
returned the same metrics. The redundant `/_admin/metrics/v2` endpoint has now
been removed.

### Batch request endpoint removed

<small>Removed in: v3.12.3</small>

The `/_api/batch` endpoints that let you send multiple operations in a single
HTTP request was deprecated in v3.8.0 and has now been removed.

To send multiple documents at once to an ArangoDB instance, please use the
[HTTP interface for documents](../../develop/http-api/documents.md#multiple-document-operations)
that can insert, update, replace, or remove arrays of documents.

### Foxx API removed

All `/_api/foxx*` endpoints have been removed due to the removal of Foxx.
See [API Changes in ArangoDB 4.x](api-changes-in-4-x.md#foxx-api-removed)
for a detailed list.

### Deprecated `PUT` cursor endpoint removed

The deprecated `PUT /_api/cursor/{cursor-identifier}` endpoint to
read the next batch from a cursor has been removed.

Use `POST /_api/cursor/{cursor-identifier}` instead.

### Endpoints to load and unload collections removed

The deprecated `PUT /_api/collection/{collection-name}/load` and
`PUT /_api/collection/{collection-name}/unload` endpoints to load and unload
collections have been removed. There is no concept of loading status anymore and
the endpoints didn't have any effect for a while.

### Metrics removed

The following V8-related metrics have been removed from the
`GET /_admin/metrics` endpoint:

- `arangodb_v8_context_alive`
- `arangodb_v8_context_busy`
- `arangodb_v8_context_dirty`
- `arangodb_v8_context_free`
- `arangodb_v8_context_max`
- `arangodb_v8_context_min`

### Collection statuses removed

Collections used to have different states like being loaded or unloaded.
This was relevant for the MMFiles storage engine that held the data in memory.
RocksDB doesn't have or need such statuses and the endpoints to load or unload
collections have no effect on it.

The `status` and `statusString` attributes have now been removed from responses
of the collections API (`/_api/collection*` endpoints).

### Timestamp removed from cluster health API

The `GET /_admin/cluster/health` endpoint no longer includes the previously
deprecated `Timestamp` sub-attribute of the last heartbeat received under
`Health.<nodeID>` for Coordinators.

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

### Obsolete replication APIs removed

Various endpoints related to replication functionality that is no longer
used have been removed.

This includes endpoints related to asynchronous replication like the
global applier that provided the low-level mechanisms for the user-managed
Leader/Follower Replication and the Agency-managed Active Failover
deployment modes, both for single servers.

A few obsolete endpoints related to the write-ahead log have been removed, too.

- `GET /_api/replication/applier-config`
- `PUT /_api/replication/applier-config`
- `PUT /_api/replication/applier-start`
- `PUT /_api/replication/applier-stop`
- `GET /_api/replication/applier-state`
- `GET /_api/replication/applier-state-all`
- `PUT /_api/replication/make-follower`
- `GET /_api/replication/logger-follow`
- `GET /_api/replication/logger-first-tick`
- `GET /_api/replication/logger-tick-ranges`
- `GET /_api/wal/open-transactions`
- `GET /_admin/wal/transactions`
- `GET /_admin/wal/properties`
- `PUT /_admin/wal/properties`

#### Job and version admin APIs removed

The `/_admin/job*` endpoints as well as the `/_admin/version` endpoint have
been removed. The identical functionality is now only available using the
corresponding `/_api/job*` and `/_api/version` endpoints.

#### Database `path` removed

The `GET /_api/database/current` endpoint no longer includes a `path` attribute
in responses. It always returned `"none"`.

## JavaScript API

### Removed modules and globals

The following things have been removed:

- `@arangodb/foxx` module
- `@arangodb/locals` module
- `global.fm` object
- `@arangodb/aql/functions` module

For more details, see [API changes in ArangoDB 4.x](api-changes-in-4-x.md#javascript-api).

### Removed database method

The `db` object no longer has a `_path` method. It always returned `"none"`.

### Removed collection methods

The following methods have been removed from
[_collection_ objects](../../develop/javascript-api/@arangodb/collection-object.md)
as they are either obsolete or didn't provide much value and better alternatives exist:

- `closedRange()`
- `documents()`
- `ensureFulltextIndex()`
- `ensureGeoConstraint()`
- `ensureGeoIndex()`
- `ensureHashIndex()`
- `ensureSkiplist()`
- `ensureUniqueConstraint()`
- `ensureUniqueSkiplist()`
- `ensureVertexCentricIndex()`
- `fulltext()`
- `geo()`
- `iterate()`
- `load()`
- `lookupByKeys()`
- `near()`
- `range()`
- `removeByKeys()`
- `status()`
- `unload()`
- `within()`
- `withinRectangle()`

See [API Changes in ArangoDB 4.x](api-changes-in-4-x.md#removed-collection-methods)
for details like how you can replace this functionality.

### Reimplemented collection methods

Some collection methods of the JavaScript API relied on the server-side
Simple Queries interface. The methods of a
[_collection_ object](../../develop/javascript-api/@arangodb/collection-object.md)
that are still available in version 4.0 have been re-implemented to use AQL on
the client-side.

Some of the methods now return a
[_cursor_ object](../../develop/javascript-api/@arangodb/cursor-object.md)
and therefore the methods you can call on it differ. If you need the
functionality that was previously provided using the `limit()` and `skip()`
methods, use AQL queries with the [`LIMIT` operation](../../aql/high-level-operations/limit.md).
To set a batch size, use the `batchSize` query option instead of `execute(<batchSize>)`.

- `all()` (returns a _cursor_ object)
- `any()`
- `byExample()` (returns a _cursor_ object)
- `firstExample()`
- `removeByExample()`
- `replaceByExample()`
- `updateByExample()`

## Startup options

### RocksDB format version 6

The default format used by the RocksDB storage engine for its SST files has been
changed from version 5 to version 6 (`--rocksdb.format-version` startup option).
New SST files are written in the newer format with this setting, while existing
files remain unchanged.

### `--server.jwt-secret` removed

ArangoDB supported a `--server.jwt-secret` startup option to pass the secret
directly (without a file). However, this is discouraged for security reasons.
This option has now been removed. It is no longer recognized and throws an error
if set.

You can use `--server.jwt-secret-keyfile` to specify the path to a file that
contains the JWT secret instead.

### SSL encryption options removed and renamed

The following outdated SSL protocol settings for the in-flight encryption
have been removed from the `--ssl.protocol` startup option:

- `1`: SSLv2
- `2`: SSLv2 or SSLv3 (negotiated)
- `3`: SSLv3

Moreover, all `--ssl.*` startup options have been renamed to `--tls.*` because
the remaining encryption settings are all TLS versions. You can still use the
old startup options names.

| Old name                         | New name                         |
|:---------------------------------|:---------------------------------|
| `--ssl.cafile`                   | `--tls.cafile`                   |
| `--ssl.cipher-list`              | `--tls.cipher-list`              |
| `--ssl.ecdh-curve`               | `--tls.ecdh-curve`               |
| `--ssl.keyfile`                  | `--tls.keyfile`                  |
| `--ssl.options`                  | `--tls.options`                  |
| `--ssl.prefer-http1-in-alpn`     | `--tls.prefer-http1-in-alpn`     |
| `--ssl.protocol`                 | `--tls.protocol`                 |
| `--ssl.require-peer-certificate` | `--tls.require-peer-certificate` |
| `--ssl.server-name-indication`   | `--tls.server-name-indication`   |
| `--ssl.session-cache`            | `--tls.session-cache`            |

### Active Failover options removed

Active Failover for single server deployments is unsupported since v3.12.0 and
two related leftover startup options are now obsolete:

- `--replication.active-failover`
- `--replication.automatic-failover`

You can still specify the options without causing errors about unknown options
at startup but they don't have any effect.

### Vector index enabled by default

The `vector` index type is now enabled by default and the `--vector-index`
startup option is obsolete. You can still specify the option without causing an
error about an unknown option at startup but it no longer has any effect.

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

- The `security` log topic has been removed.

  Attempts to set the log level for this topic log a warning, for example, using
  a startup option like `--log.level security=debug`.

  The only remaining use of the `security` log topic was for the log message with
  ID `2cafe`, dumping information about the JavaScript hardening (allow/denylists).
  It has been changed to the `v8` log topic.

- The `bench` log topic has been removed.

  Attempting to set the log level for this topic logs a warning, for example,
  when using a startup option like `--log.level bench=debug`.

  The only remaining use of the `bench` log topic (due to the removal of
  _arangobench_) was for the log message with ID `bafc2`, used by _arangoexport_
  to report a JSON format error related to the `--custom-query-bindvars`
  startup option. It has been changed to the `config` log topic.

### `--server.allow-use-database` removed

The `--server.allow-use-database` startup option related to the long-deprecated
and now removed Action feature has been removed. It was only used internally.

### Emergency `--console` mode removed

The ArangoDB server process could be started in an interactive command-line
mode (JavaScript REPL) with the `--console` option. This was primarily used
for debugging purposes in the development of _arangod_.

This feature has been removed and the `--console` startup option is obsolete now.
It no longer has an effect but it is still recognized to avoid causing a fatal
error on startup if you specify it.

### Obsolete startup options

The following startup options are now obsolete. They no longer have an effect
but they are still recognized to avoid causing a fatal error on startup if you
specify them:

- `--server.storage-engine`: ArangoDB supports RocksDB as the only storage engine
  since v3.7.0 and therefore this option is not useful.
- `--server.rest-server`: Can no longer be disabled, respectively Coordinators
  with `--database.auto-upgrade` enabled now disable the HTTP listener stack
  automatically.

### Deprecated startup options removed

The following startup options have been removed. They are no longer recognized
and throw errors if set:

- `--agency.pool-size`
- `--arangosearch.threads`
- `--arangosearch.threads-limit`
- `--log.performance`
- `--log.use-local-time`
- `--log.use-microtime`
- `--network.protocol`
- `--query.allow-collections-in-expressions`
- `--rocksdb.exclusive-writes`

## Client tools

### arangoimp removed

The _arangoimport_ client tool used to be called _arangoimp_ and was still
shipped (at least as a symlink) under the old name in packages and container
images for backward compatibility. This is no longer the case and there is only
the _arangoimport_ executable now.

### arangobench removed

The benchmark and test tool _arangobench_ has been removed.

It was originally used internally in the development of ArangoDB for performance
and server function testing, but lost its relevance over time and became
unmaintained.
