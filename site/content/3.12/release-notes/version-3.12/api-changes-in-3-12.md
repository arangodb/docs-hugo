---
title: API Changes in ArangoDB 3.12
menuTitle: API changes in 3.12
weight: 20
description: >-
  A summary of the changes to the HTTP API and other interfaces that are relevant
  for developers, like maintainers of drivers and integrations for ArangoDB
archetype: default
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
server log now displays a deprecation message if illegal combinations and
unknown attributes and values are detected in the request body.

Note that all invalid elements and combinations will be rejected in future
versions.

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
The default value remains 128 MiB.

#### Analyzer API

The [`/_api/analyzer` endpoints](../../develop/http-api/analyzers.md) supports
a new `multi_delimiter` Analyzer that accepts an array of strings in a
`delimiter` attribute of the `properties` object.

### Privilege changes



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

### Endpoints augmented

#### View API

Views of type `arangosearch` accept a new `optimizeTopK` View property for the
ArangoSearch WAND optimization. It is an immutable array of strings, optional,
and defaults to `[]`.

See the [`optimizeTopK` View property](../../index-and-search/arangosearch/arangosearch-views-reference.md#view-properties)
for details.

#### Document API

The `PUT /_api/document/{collection}/{key}` and `PATCH /_api/document/{collection}/{key}`
endpoints accept a new `versionAttribute` property that adds external versioning
support.
If set, the attribute with the name specified by the property is looked up in
the document to be replaced or updated and its content is read and compared
numerically to the value of the versioning attribute in the document that
updates or replaces it.

#### Index API

##### `optimizeTopK` for inverted indexes

Indexes of type `inverted` accept a new `optimizeTopK` property for the
ArangoSearch WAND optimization. It is an array of strings, optional, and
defaults to `[]`.

See the [inverted index `optimizeTopK` property](../../develop/http-api/indexes/inverted.md)
for details.

##### Progress indication on the index generation

<small>Introduced in: v3.10.13, v3.11.7</small>

The `GET /_api/index` endpoint now returns a `progress` attribute that can
optionally show indexes that are currently being created and indicate progress
on the index generation.

To return indexes that are not yet fully built but are in the building phase,
add the option `withHidden=true` to `GET /_api/index?collection=<collectionName>`.

```
curl --header 'accept: application/json' --dump -
"http://localhost:8529/_api/index?collection=myCollection&withHidden=true"
```

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

### Endpoints moved



### Endpoints deprecated

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

`collection.replace(object, data, options)` and
`collection.update(object, data, options)` now have an optional
`versionAttribute` property that adds external versioning support. It can also
be used for `collection.insert(data, options)` with `overwriteMode: "update"`
or `overwriteMode: "replace"`.

If set, the attribute with the name specified by the property is looked up in
the document to be replaced or updated and its content is read and compared
numerically to the value of the versioning attribute in the document that
updates or replaces it.
If the version number in the new document is higher than in the document that
already exists in the database, then the operation is performed normally.
If the version number in the new document is lower or equal to what exists in
the database, the operation is not performed and behaves like a no-op. No error
is returned in this case.

### `@arangodb/pregel` package

The `@arangodb/pregel` JavaScript API package has been removed in v3.12.0 and
will no longer be supported.
