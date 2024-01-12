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

The `remove-unnecessary-projections` AQL optimizer rule has been renamed to
`optimize-projections` and now includes an additional optimization.

Moreover, a `remove-unnecessary-calculations-4` rule has been added.

The affected endpoints are `POST /_api/cursor`, `POST /_api/explain`, and
`GET /_api/query/rules`.

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

### Endpoints augmented

#### View API

Views of type `arangosearch` accept a new `optimizeTopK` View property for the
ArangoSearch WAND optimization. It is an immutable array of strings, optional,
and defaults to `[]`.

See the [`optimizeTopK` View property](../../index-and-search/arangosearch/arangosearch-views-reference.md#view-properties)
for details.

#### Index API

Indexes of type `inverted` accept a new `optimizeTopK` property for the
ArangoSearch WAND optimization. It is an array of strings, optional, and
defaults to `[]`.

See the [inverted index `optimizeTopK` property](../../develop/http-api/indexes/inverted.md)
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
