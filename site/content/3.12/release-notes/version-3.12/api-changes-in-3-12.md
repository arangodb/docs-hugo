---
title: API Changes in ArangoDB 3.12
menuTitle: API changes in 3.12
weight: 20
description: >-
  A summary of the changes to the HTTP API and other interfaces that are relevant
  for developers, like maintainers of drivers and integrations for ArangoDB
---
## HTTP RESTful API

### Behavior changes

#### VelocyStream protocol removed

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

#### HTTP headers

The following long-deprecated features have been removed from ArangoDB's HTTP
server:

- Overriding the HTTP method by setting one of the HTTP headers:
  - `x-http-method`
  - `x-http-method-override`
  - `x-method-override`

   This functionality posed a potential security risk and was thus removed.
   Previously, it was only enabled when explicitly starting the 
   server with the `--http.allow-method-override` startup option.
   The functionality has now been removed and setting the startup option does
   nothing.

- Optionally hiding ArangoDB's `server` response header. This functionality
  could optionally be enabled by starting the server with the startup option
  `--http.hide-product-header`.
  The functionality has now been removed and setting the startup option does
  nothing.

#### `--database.extended-names` enabled by default

The `--database.extended-names` startup option is now enabled by default.
The names of databases, collections, Views, and indexes may contain Unicode
characters using the default settings.

#### Collection API

When creating a collection using the `POST /_api/collection` endpoint, the
server log now displays a `deprecation` message if illegal combinations and
unknown attributes and values are detected in the request body.

Note that all invalid elements and value combinations will be rejected in future
versions. The following options are already validated more strictly in v3.12
and incorrect use can lead to errors:

- `keyOptions`: The `increment` and `offset` sub-attributes are only allowed if
  the `type` sub-attribute is `"autoincrement"`. The `lastValue` sub-attribute
  is only allowed if the `type` sub-attribute is `"traditional"`, `"autoincrement"`,
  or `"padded"`.
- `shardKeys`: Each array element needs to be a string.

#### Index API

##### Stored values can contain the `_id` attribute

The usage of the `_id` system attribute was previously disallowed for
`persistent` indexes inside of `storedValues`. This is now allowed in v3.12.

Note that it is still forbidden to use `_id` as a top-level attribute or
sub-attribute in `fields` of persistent indexes. On the other hand, inverted
indexes have been allowing to index and store the `_id` system attribute.

#### Optimizer rule changes

Due to the [improved joins](whats-new-in-3-12.md#improved-joins) in AQL, there
is a new `join-index-nodes` optimizer rule and a `JoinNode` that may appear in
execution plans.

The `remove-unnecessary-projections` AQL optimizer rule has been renamed to
`optimize-projections` and now includes an additional optimization.

Moreover, a `remove-unnecessary-calculations-4` and `batch-materialize-documents`
rule have been added.

A `push-limit-into-index` rule has been added in v3.12.2.

A `replace-entries-with-object-iteration` rule has been added in v3.12.3.

A `use-index-for-collect` and a `use-vector-index` rule have been added in v3.12.4.

The affected endpoints are `POST /_api/cursor`, `POST /_api/explain`, and
`GET /_api/query/rules`.

#### Gharial API

The `PATCH /_api/gharial/{graph}/edge/{collection}/{edge}` endpoint to update
edges in named graphs now validates the referenced vertex when modifying either
the `_from` or `_to` edge attribute. Previously, the validation only occurred if
both were set in the request.

#### Validation of `smartGraphAttribute` in SmartGraphs

<small>Introduced in: v3.10.13, v3.11.7</small>

The attribute defined by the `smartGraphAttribute` graph property is not allowed to be
changed in the documents of SmartGraph vertex collections. This is now strictly enforced.
You must set the attribute when creating a document. Any attempt to modify or remove
the attribute afterward by update or replace operations now throws an error. Previously,
the `smartGraphAttribute` value was checked only when inserting documents into a
SmartGraph vertex collection, but not for update or replace operations.

The missing checks on update and replace operations allowed to retroactively
modify the value of the `smartGraphAttribute` for existing documents, which
could have led to problems when the data of such a SmartGraph vertex collection was
replicated to a new follower shard. On the new follower shard, the documents
went through the full validation and led to documents with modified
`smartGraphAttribute` values being rejected on the follower. This could have
led to follower shards not getting in sync.

Now, the value of the `smartGraphAttribute` is fully validated with every
insert, update, or replace operation, and every attempt to modify the value of
the `smartGraphAttribute` retroactively fails with the `4003` error,
`ERROR_KEY_MUST_BE_PREFIXED_WITH_SMART_GRAPH_ATTRIBUTE`.
Additionally, if upon insertion the `smartGraphAttribute` is missing for a
SmartGraph vertex, the error code is error `4001`, `ERROR_NO_SMART_GRAPH_ATTRIBUTE`.

To retroactively repair the data in any of the affected collections, it is
possible to update every (affected) document with the correct value of the
`smartGraphAttribute` via an AQL query as follows:

```
FOR doc IN @@collection
  LET expected = SUBSTRING(doc._key, 0, FIND_FIRST(doc._key, ':'))
  LET actual = doc.@attr
  FILTER expected != actual
  UPDATE doc WITH {@attr: expected} IN @@collection
  COLLECT WITH COUNT INTO updated
  RETURN updated
```  

This updates all documents with the correct (expected) value of the
`smartGraphAttribute` if it deviates from the expected value. The query
returns the number of updated documents as well.

The bind parameters necessary to run this query are:
- `@@collection`: name of a SmartGraph vertex collection to be updated
- `@attr`: attribute name of the `smartGraphAttribute` of the collection

#### Limit to the number of databases in a deployment

<small>Introduced in: v3.10.10, v3.11.2</small>

The new `--database.max-databases` startup option can cap the number of databases
and creating databases using the `POST /_api/database` endpoint can thus now fail
for this reason if your deployment is at or above the configured maximum. Example:

```json
{
  "code": 400,
  "error": true,
  "errorMessage": "unable to create additional database because it would exceed the configured maximum number of databases (2)",
  "errorNum": 32
}
```

#### Adjustable Stream Transaction size

The [Stream Transactions HTTP API](../../develop/http-api/transactions/stream-transactions.md)
may now allow larger transactions or be limited to smaller transactions because
the maximum transaction size can now be configured with the
`--transaction.streaming-max-transaction-size` startup option.
The default value remains 128 MiB up to v3.12.3.
From v3.12.4 onward, the default value is 512 MiB.

#### Analyzer API

The [`/_api/analyzer` endpoints](../../develop/http-api/analyzers.md) supports
a new `multi_delimiter` Analyzer that accepts an array of strings in a
`delimiters` attribute of the `properties` object.

#### Adjustable `writeConcern` for collections with `distributeShardsLike`

Collections that are sharded like another collection via the `distributeShardsLike`
property use the `replicationFactor`, `numberOfShards`, and `shardingStrategy`
properties of the prototype collection. In previous versions, the `writeConcern`
property of the prototype collection was used as well. Now, you can independently
set a `writeConcern` when creating a collection with `distributeShardsLike`.
The property defaults to the `writeConcern` of the prototype collection if you
don't specify it explicitly. You can adjust the `writeConcern` later on in
either case.

#### Log API

The [`/_admin/log/*` endpoints](../../develop/http-api/monitoring/logs.md) no
longer use the `ldap` log topic. Changing the log level of the `ldap` topic or
any other unknown topic is not an error, however. Also see
[Incompatible changes in ArangoDB 3.12](incompatible-changes-in-3-12.md#ldap-authentication-support-removed).

A new `deprecation` log topic has been added. It warns about deprecated features
and the usage of options that will not be allowed or have no effect in a future
version.

#### Error code `12` removed

The unused error `ERROR_OUT_OF_MEMORY_MMAP` with the number `12` has been removed.

#### `mmap` log topic removed

<small>Introduced in: v3.12.1</small>

The `mmap` log topic for logging information related to memory mapping has been
unused since v3.12.0 and has now been removed. The `/_admin/log/level` endpoints
no longer include this log topic in responses and attempts to set the log level
for this topic are ignored.

### Endpoint return value changes

#### Storage engine API

- The storage engine API at `GET /_api/engine` does not return the attribute
  `dfdb` anymore.

- On single servers and DB-Servers, the `GET /_api/engine` endpoint now
  returns an `endianness` attribute. Currently, only Little Endian is supported
  as an architecture by ArangoDB. The value is therefore `"little"`.

### Endpoints added

#### Effective and available startup options

The new `GET /_admin/options` and `GET /_admin/options-description` HTTP API
endpoints allow you to return the effective configuration and the available
startup options of the queried _arangod_ instance.

Previously, it was only possible to [fetch the current configuration](../../operations/administration/configuration.md#fetch-current-configuration-options)
on single servers and Coordinators using a JavaScript transaction, and to list
the available startup options with `--dump-options`.

See the [HTTP interface for administration](../../develop/http-api/administration.md#startup-options)
for details.

#### Available key generators

You can now retrieve the available key generators for collections using the new
`GET /_api/key-generators` endpoint.

See the [HTTP API description](../../develop/http-api/collections.md#get-the-available-key-generators)

#### Shard usage metrics

With `GET /_admin/usage-metrics` you can retrieve detailed shard usage metrics on
DB-Servers.

These metrics can be enabled by setting the `--server.export-shard-usage-metrics`
startup option to `enabled-per-shard` to make DB-Servers collect per-shard
usage metrics, or to `enabled-per-shard-per-user` to make DB-Servers collect
usage metrics per shard and per user whenever a shard is accessed.

For more information, see the [HTTP API description](../../develop/http-api/monitoring/metrics.md#get-usage-metrics)
and [Monitoring per collection/database/user](../version-3.12/whats-new-in-3-12.md#monitoring-per-collectiondatabaseuser).

#### Reset log levels

<small>Introduced in: v3.12.1</small>

A new `DELETE /_admin/log/level` endpoint has been added that lets you reset the
log level settings to the values they had at server startup. This is useful for
tools that temporarily change log levels but do not want to fetch and remember
the previous log levels settings. Such tools can now simply call this new
endpoint to restore the original log levels.

See the [Log API](../../develop/http-api/monitoring/logs.md#reset-the-server-log-levels)
for details.

#### Query plan cache API

<small>Introduced in: v3.12.4</small>

Two endpoints have been added to let you list the entries and clear the cache
for AQL execution plans. Query plan caching works on a per-database basis.

- `GET /_api/query-plan-cache`
- `DELETE /_api/query-plan-cache`

See [HTTP interface for the query plan cache](../../develop/http-api/queries/aql-query-plan-cache.md)
for details.

#### API call recording

<small>Introduced in: v3.12.5</small>

A new `/_admin/server/api-calls` endpoint has been added to let you retrieve a
list of the most recent requests with a timestamp and the endpoint. This feature
is for debugging purposes.

See [HTTP interface for server logs](../../develop/http-api/monitoring/logs.md#get-recent-api-calls)
for details.

#### Access tokens

<small>Introduced in: v3.12.5</small>

New endpoints have been added to let you manage access tokens.

- `POST /_api/token/{user}`
- `GET /_api/token/{user}`
- `DELETE /_api/token/{user}/{token-id}`

See the [HTTP API](../../develop/http-api/authentication.md#access-tokens)
documentation.

Also see [Authentication with access tokens](#authentication-with-access-tokens)
for related API changes.

### Endpoints augmented

#### View API

Views of type `arangosearch` accept a new `optimizeTopK` View property for the
ArangoSearch WAND optimization. It is an immutable array of strings, optional,
and defaults to `[]`.

See the [`optimizeTopK` View property](../../index-and-search/arangosearch/arangosearch-views-reference.md#view-properties)
for details.

#### Document API

The following endpoints accept a new `versionAttribute` query parameter that adds
external versioning support:

- `PATCH /_api/document/{collection}/{key}` (single document update)
- `PATCH /_api/document/{collection}` (multiple document update)
- `PUT /_api/document/{collection}` (single document replace)
- `PUT /_api/document/{collection}/{key}` (multiple document replace)
- `POST /_api/document/{collection}` (single document insert, when used to update/replace a document)
- `POST /_api/document/{collection}/{key}` (multiple document insert, when used to update/replace a document)

If set, the attribute with the name specified by the option is looked up in the
stored document and the attribute value is compared numerically to the value of
the versioning attribute in the supplied document that is supposed to update/replace it.
The document is only changed if the new number is higher. See the
[Document API](../../develop/http-api/documents.md#create-a-document) for details.

#### Cursor API

##### `documentLookups` and `seeks` statistics

Two new statistics are included in the response when you execute an AQL query:

- `documentLookups`: The number of real document lookups caused by late materialization
  as well as `IndexNode`s that had to load document attributes not covered
  by the index. This is how many documents had to be fetched from storage after
  an index scan that initially covered the attribute access for these documents.
- `seeks`: The number of seek calls done by RocksDB iterators for merge joins
  (`JoinNode` in the execution plan).

```js
{
  "result": [
    // ...
  ],
  // ...
  "extra": {
    "stats": {
      "documentLookups": 10,
      "seeks": 0,
      // ...
    }
  }
}
```

#### Query plan cache attributes

<small>Introduced in: v3.12.4</small>

The following endpoints related to AQL queries support a new `usePlanCache`
query option in the `options` object:

- `POST /_api/cursor`
- `POST /_api/explain`

An error is raised if `usePlanCache` is set to `true` but the query is not
eligible for plan caching (a new error code
`ERROR_QUERY_NOT_ELIGIBLE_FOR_PLAN_CACHING` with the number `1584`). See
[The execution plan cache for AQL queries](../../aql/execution-and-performance/caching-query-plans.md)
for details. 

If a cached query plan is utilized, the above endpoints include a new
`planCacheKey` attribute at the top-level of the response with the key of the
cached plan (string).

See [HTTP interfaces for AQL queries](../../develop/http-api/queries/aql-queries.md#cursors)
for details.

#### Index API

##### `optimizeTopK` for inverted indexes

Indexes of type `inverted` accept a new `optimizeTopK` property for the
ArangoSearch WAND optimization. It is an array of strings, optional, and
defaults to `[]`.

See the [inverted index `optimizeTopK` property](../../develop/http-api/indexes/inverted.md)
for details.

##### Multi-dimensional indexes

The previously experimental `zkd` index type is now stable and has been renamed
to `mdi`. Existing indexes keep the `zkd` type. The HTTP API still allows the old
name to create new indexes that behave exactly like `mdi` indexes but this is
discouraged. The `zkd` alias may get removed in a future version.

An additional `mdi-prefixed` index variant has been added. This is a new index
type in the API with the same settings as the `mdi` index but with one additional
`prefixFields` attribute. It is a required setting for the `mdi-prefixed` index
type and accepts an array of strings similar to the `fields` attribute. You can
use it to narrow down the search space using equality checks.

Both multi-dimensional index variants now support a `sparse` setting (boolean)
and `storedValues` setting (array of strings) that were not supported by the
`zkd` index type in previous versions.

See [Working with multi-dimensional indexes](../../index-and-search/indexing/working-with-indexes/multi-dimensional-indexes.md)
for details.

##### Progress indication on the index generation

<small>Introduced in: v3.10.13, v3.11.7</small>

The `GET /_api/index` endpoint may now include a `progress` attribute for the
elements in the `indexes` array. For every index that is currently being created,
it indicates the progress of the index generation (in percent).

To return indexes that are not yet fully built but are in the building phase,
add the `withHidden=true` query parameter to the call of the endpoint.

```
curl "http://localhost:8529/_api/index?collection=myCollection&withHidden=true"
```

#### Vector indexes (experimental)

<small>Introduced in: v3.12.4</small>

A new `vector` index type has been added as an experimental feature.
See [HTTP interface for vector indexes](../../develop/http-api/indexes/vector.md)
for details.

#### Optimizer rule descriptions

<small>Introduced in: v3.10.9, v3.11.2</small>

The `GET /_api/query/rules` endpoint now includes a `description` attribute for
every optimizer rule that briefly explains what it does.

#### Query parsing API

The `POST /_api/query` endpoint for parsing AQL queries now unconditionally
returns the `warnings` attribute, even if no warnings were produced while parsing
the query. In that case, `warnings` contains an empty array.
In previous versions, no `warnings` attribute was returned when parsing a query
produced no warnings.

#### Metrics API

The metrics endpoint includes the following new metrics about AQL queries,
ongoing dumps, ArangoSearch parallelism and used file descriptors:

- `arangodb_aql_cursors_active`
- `arangodb_dump_memory_usage`
- `arangodb_dump_ongoing`
- `arangodb_dump_threads_blocked_total`
- `arangodb_search_execution_threads_demand`
- `arangodb_search_file_descriptors`

The following new metrics for improved memory observability have been added:

- `arangodb_agency_node_memory_usage`
- `arangodb_aql_cursors_memory_usage`
- `arangodb_index_estimates_memory_usage`
- `arangodb_internal_cluster_info_memory_usage`
- `arangodb_requests_memory_usage`
- `arangodb_revision_tree_buffered_memory_usage`
- `arangodb_scheduler_queue_memory_usage`
- `arangodb_scheduler_stack_memory_usage`
- `arangodb_search_consolidations_memory_usage`
- `arangodb_search_mapped_memory`
- `arangodb_search_readers_memory_usage`
- `arangodb_search_writers_memory_usage`
- `arangodb_transactions_internal_memory_usage`
- `arangodb_transactions_rest_memory_usage`

---

<small>Introduced in: v3.11.2</small>

The following metrics have been added about the LZ4 compression for values in
the in-memory edge cache:

- `rocksdb_cache_edge_inserts_effective_entries_size_total`
- `rocksdb_cache_edge_inserts_uncompressed_entries_size_total`
- `rocksdb_cache_edge_compression_ratio`

---

<small>Introduced in: v3.10.11, v3.11.4</small>

The following metrics have been added to improve the observability of in-memory
cache subsystem:

- `rocksdb_cache_free_memory_tasks_total`
- `rocksdb_cache_free_memory_tasks_duration_total`
- `rocksdb_cache_migrate_tasks_total`
- `rocksdb_cache_migrate_tasks_duration_total`

---

<small>Introduced in: v3.11.4</small>

The following metrics have been added to improve the observability of in-memory
edge cache:

- `rocksdb_cache_edge_compressed_inserts_total`
- `rocksdb_cache_edge_empty_inserts_total`
- `rocksdb_cache_edge_inserts_total`

---

<small>Introduced in: v3.11.5</small>

The following metrics have been added to monitor and detect temporary or
permanent connectivity issues as well as how many scheduler threads are in the
detached state:

- `arangodb_network_connectivity_failures_coordinators`
- `arangodb_network_connectivity_failures_dbservers_total`
- `arangodb_scheduler_num_detached_threads`

---

<small>Introduced in: v3.10.13, v3.11.7</small>

The following metrics have been introduced to track per-shard requests on
DB-Servers:

- `arangodb_collection_leader_reads_total`
- `arangodb_collection_leader_writes_total`
- `arangodb_collection_requests_bytes_read_total`
- `arangodb_collection_requests_bytes_written_total`

---

<small>Introduced in: v3.12.1</small>

The following metrics have been added for observability:

- `arangodb_vocbase_shards_read_only_by_write_concern`
- `arangodb_logger_messages_dropped_total`
- `arangodb_scheduler_high_prio_dequeue_hist`
- `arangodb_scheduler_medium_prio_dequeue_hist`
- `arangodb_scheduler_low_prio_dequeue_hist`
- `arangodb_scheduler_maintenance_prio_dequeue_hist`

---

<small>Introduced in: v3.12.4</small>

The following metric about partially committed or aborted transactions on
DB-Servers in a cluster has been added:

- `arangodb_vocbase_transactions_lost_subordinates_total`

#### Stream Transactions API

<small>Introduced in: v3.12.1</small>

A `skipFastLockRound` option has been added to the `POST /_api/transaction/begin`
endpoint that lets you disable the fast lock round for Stream Transactions.
The option defaults to `false` so that fast locking is tried.

See the [HTTP API](../../develop/http-api/transactions/stream-transactions.md#begin-a-stream-transaction)
for details.

#### Log API

<small>Introduced in: v3.12.2</small>

The `GET /_admin/log/level` and `PUT /_admin/log/level` endpoints have been
extended with a `withAppenders` query option to let you query and set log level
settings for individual log outputs:

```sh
curl http://localhost:8529/_admin/log/level?withAppenders=true
```

If enabled, the response structure is as follows:

```json
{
  "global": {
    "agency": "INFO",
    "agencycomm": "INFO",
    "agencystore": "WARNING",
    ...
  },
  "appenders": {
    "-": {
      "agency": "INFO",
      "agencycomm": "INFO",
      "agencystore": "WARNING",
      ...
    },
    "file:///path/to/file": {
      "agency": "INFO",
      "agencycomm": "INFO",
      "agencystore": "WARNING",
      ...
    },
    ...
  }
}
```

The keys under `appenders` correspond to the configured log outputs
(`--log.output` startup option, `-` stands for the standard output).
The `global` levels are automatically set to the most verbose log level for that
topic across all appenders.

To change any of the log levels at runtime, you can send a request following the
same structure:

```sh
curl -XPUT -d '{"global":{"queries":"DEBUG"},"appenders":{"-":{"requests":"ERROR"}}}' http://localhost:8529/_admin/log/level?withAppenders=true
```

Setting a global log level applies the value to all outputs for the specified
topic. You can only change the log levels for individual log outputs (appenders)
but not add new outputs at runtime.

#### Authentication with access tokens

<small>Introduced in: v3.12.5</small>

The newly added access tokens can be used for either creating JWT session tokens
or directly authenticate with an access token instead of a password.

If you use an access token when calling the `POST /_open/auth` endpoint to create
a session token, you only need to provide the access token as the `password`.
You don't need to specify the `username`, but if you do, it must match the
user name encoded in the access token.

```sh
# Access token of user "root"
curl -d '{"password":"v1.7b2265...71227d"}' http://localhost:8529/_open/auth
curl -d '{"username":"root", "password":"v1.7b2265...71227d"}' http://localhost:8529/_open/auth
```

Similarly, if you use an access token for HTTP Basic authentication, you can
leave out the user name. If you don't, it needs to match the name in the token.
Example:

```sh
# Access token of user "root" 
curl -u:v1.7b2265...71227d http://localhost:8529/_api/database
curl -uroot:v1.7b2265...71227d http://localhost:8529/_api/database
```

Note that it is recommended to use access tokens for creating
[JWT session tokens](../../develop/http-api/authentication.md#create-a-jwt-session-token).

### Endpoints deprecated

#### JavaScript Transactions API

JavaScript Transactions and thus the `POST /_api/transaction` endpoint is
deprecated from v3.12.0 onward and will be removed in a future version.
The endpoints for Stream Transactions (`POST /_api/transaction/begin` etc.)
are unaffected.

### Endpoints removed

#### Database target version API

The `GET /_admin/database/target-version` endpoint has been removed in favor of the
more general version API with the endpoint `GET /_api/version`. 
The endpoint was deprecated since v3.11.3.

#### JavaScript-based traversal using `/_api/traversal`

The long-deprecated JavaScript-based traversal functionality has been removed
in v3.12.0, including the REST API endpoint `/_api/traversal`.

The functionality provided by this API was deprecated and unmaintained since
v3.4.0. JavaScript-based traversals have been replaced with AQL traversals in
v2.8.0. Additionally, the JavaScript-based traversal REST API could not handle
larger amounts of data and was thus very limited.

Users of the `/_api/traversal` REST API should use
[AQL traversal queries](../../aql/graphs/traversals.md) instead.

#### Pregel API

The `/_api/control_pregel/*` endpoints have been removed in v3.12.0 as Pregel
graph processing is no longer supported. The `arangodb_pregel_*` metrics and the
`pregel` log topic have been removed as well from the respective endpoints.

#### Batch request API

<small>Removed in: v3.12.3</small>

The `/_api/batch` endpoints that let you send multiple operations in a single
HTTP request was deprecated in v3.8.0 and has now been removed.

To send multiple documents at once to an ArangoDB instance, please use the
[HTTP interface for documents](../../develop/http-api/documents.md#multiple-document-operations)
that can insert, update, replace, or remove arrays of documents.

## JavaScript API

### Collection creation

When creating a collection using the `db._create()`, `db._createDocumentCollection()`, or
`db._createEdgeCollection()` method, the server log now displays a deprecation message if illegal
combinations and unknown properties are detected in the `properties` object.

Note that all invalid elements and combinations will be rejected in future
versions.

### `@arangodb/graph/traversal` module

The long-deprecated JavaScript-based traversal functionality has been removed in
v3.12.0, including the bundled `@arangodb/graph/traversal` JavaScript module.

The functionality provided by this traversal module was deprecated and
unmaintained since v3.4.0. JavaScript-based traversals have been replaced with
AQL traversals in v2.8.0. Additionally, the JavaScript-based traversals could
not handle larger amounts of data and were thus very limited.

Users of the JavaScript-based traversal API should use
[AQL traversal queries](../../aql/graphs/traversals.md) instead.

### `collection` object

The following methods now accept a `versionAttribute` option that adds external
versioning support:

- `collection.update(object, data, options)`
- `collection.replace(object, data, options)`
- `collection.insert(data, options)` when used to update/replace a document

If set, the attribute with the name specified by the option is looked up in the
stored document and the attribute value is compared numerically to the value of
the versioning attribute in the supplied document that is supposed to update/replace it.
The document is only changed if the new number is higher. See the
[JavaScript API](../../develop/javascript-api/@arangodb/collection-object.md#collectioninsertdata--options)
for details.

### `@arangodb/pregel` removed

The `@arangodb/pregel` module of the JavaScript API has been removed in v3.12.0
as Pregel is no longer supported.

### `db._executeTransaction()` deprecated

JavaScript Transactions and thus the `db._executeTransaction()` method is
deprecated from v3.12.0 onward and will be removed in a future version.
The `db._createTransaction()` method for starting Stream Transactions is unaffected.


### `@arangodb/request` certificate validation

<small>Introduced in: v3.11.11, v3.12.2</small>

The `@arangodb/request` module now supports two additional options for making
HTTPS requests:

- `verifyCertificates` (optional): if set to `true`, the server certificate of
  the remote server is verified using the default certificate store of the system.
  Default: `false`.
- `verifyDepth` (optional): limit the maximum length of the certificate chain
  that counts as valid. Default: `10`.

### Stream Transactions API

<small>Introduced in: v3.12.1</small>

A `skipFastLockRound` option has been added to the `db._createTransaction()`
method that lets you disable the fast lock round for Stream Transactions.
The option defaults to `false` so that fast locking is tried.

See the [JavaScript API](../../develop/transactions/stream-transactions.md#javascript-api)
for details.

#### Query plan cache module

<small>Introduced in: v3.12.4</small>

The new `@arangodb/aql/plan-cache` module lets you list the entries (`.toArray()`)
and clear (`.clear()`) the AQL execution plan cache in the JavaScript API.

See [The execution plan cache for AQL queries](../../aql/execution-and-performance/caching-query-plans.md#interfaces)
for details.
