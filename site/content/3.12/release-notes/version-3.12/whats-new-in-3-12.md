---
title: Features and Improvements in ArangoDB 3.12
menuTitle: What's New in 3.12
weight: 5
description: >-
  ArangoDB v3.12 Release Notes New Features
archetype: default
---
The following list shows in detail which features have been added or improved in
ArangoDB 3.12. ArangoDB 3.12 also contains several bug fixes that are not listed
here.

## ArangoSearch

### WAND optimization (Enterprise Edition)

For `arangosearch` Views and inverted indexes (and by extension `search-alias`
Views), you can define a list of sort expressions that you want to optimize.
This is also known as _WAND optimization_.

If you query a View with the `SEARCH` operation in combination with a
`SORT` and `LIMIT` operation, search results can be retrieved faster if the
`SORT` expression matches one of the optimized expressions.

Only sorting by highest rank is supported, that is, sorting by the result
of a scoring function in descending order (`DESC`).

See [Optimizing View and inverted index query performance](../../index-and-search/arangosearch/performance.md#wand-optimization)
for examples.

This feature is only available in the Enterprise Edition.

## Analyzers



## Web interface

### Shard rebalancing

The feature for rebalancing shards in cluster deployments has been moved from
the **Rebalance Shards** tab in the **NODES** section to the **Distribution**
tab in the **CLUSTER** section of the web interface.

The updated interface now offers the following options:
- **Move Leaders**
- **Move Followers**
- **Include System Collections**

### Swagger UI

The interactive tool for exploring HTTP APIs has been updated to version 5.4.1.
You can find it in the web interface in the **Rest API** tab of the **SUPPORT**
section, as well as in the **API** tab of Foxx services and Foxx routes that use
`module.context.createDocumentationRouter()`.

The new version adds support for OpenAPI 3.x specifications in addition to
Swagger 2.x compatibility.

## AQL



## Indexing

### Stored values can contain the `_id` attribute

The usage of the `_id` system attribute was previously disallowed for
`persistent` indexes inside of `storedValues`. This is now allowed in v3.12.

Note that it is still forbidden to use `_id` as a top-level attribute or
sub-attribute in `fields` of persistent indexes. On the other hand, inverted
indexes have been allowing to index and store the `_id` system attribute.

## Server options

### LZ4 compression for values in the in-memory edge cache

<small>Introduced in: v3.11.2, v3.12.0</small>

LZ4 compression of edge index cache values allows to store more data in main
memory than without compression, so the available memory can be used more
efficiently. The compression is transparent and does not require any change to
queries or applications.
The compression can add CPU overhead for compressing values when storing them
in the cache, and for decompressing values when fetching them from the cache.

The new startup option `--cache.min-value-size-for-edge-compression` can be
used to set a threshold value size for compression edge index cache payload
values. The default value is `1GB`, which effectively turns compression
off. Setting the option to a lower value (i.e. `100`) turns on the
compression for any payloads whose size exceeds this value.
  
The new startup option `--cache.acceleration-factor-for-edge-compression` can
be used to fine-tune the compression. The default value is `1`.
Higher values typically mean less compression but faster speeds.

The following new metrics can be used to determine the usefulness of
compression:
  
- `rocksdb_cache_edge_inserts_effective_entries_size_total`: returns the total
  number of bytes of all entries that were stored in the in-memory edge cache,
  after compression was attempted/applied. This metric is populated regardless
  of whether compression is used or not.
- `rocksdb_cache_edge_inserts_uncompressed_entries_size_total`: returns the total
  number of bytes of all entries that were ever stored in the in-memory edge
  cache, before compression was applied. This metric is populated regardless of
  whether compression is used or not.
- `rocksdb_cache_edge_compression_ratio`: returns the effective
  compression ratio for all edge cache entries ever stored in the cache.

Note that these metrics are increased upon every insertion into the edge
cache, but not decreased when data gets evicted from the cache.

### Limit the number of databases in a deployment

<small>Introduced in: v3.10.10, v3.11.2, v3.12.0</small>

The `--database.max-databases` startup option allows you to limit the
number of databases that can exist in parallel in a deployment. You can use this
option to limit the resources used by database objects. If the option is used
and there are already as many databases as configured by this option, any
attempt to create an additional database fails with error
`32` (`ERROR_RESOURCE_LIMIT`). Additional databases can then only be created
if other databases are dropped first. The default value for this option is
unlimited, so an arbitrary amount of databases can be created.

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

### Cluster-internal connectivity checks

<small>Introduced in: v3.11.5, v.3.12.0</small>

This feature makes Coordinators and DB-Servers in a cluster periodically send
check requests to each other, in order to see if all nodes can connect to
each other.
If a cluster-internal connection to another Coordinator or DB-Server cannot
be established within 10 seconds, a warning is now logged.

The new `--cluster.connectivity-check-interval` startup option can be used
to control the frequency of the connectivity check, in seconds.
If set to a value greater than zero, the initial connectivity check is
performed approximately 15 seconds after the instance start, and subsequent
connectivity checks are executed with the specified frequency.
If set to `0`, connectivity checks are disabled.

You can also use the following metrics to monitor and detect temporary or
permanent connectivity issues:
- `arangodb_network_connectivity_failures_coordinators`: Number of failed
  connectivity check requests sent by this instance to Coordinators.
- `arangodb_network_connectivity_failures_dbservers_total`: Number of failed
  connectivity check requests sent to DB-Servers.

## Miscellaneous changes

### In-memory edge cache startup options and metrics

<small>Introduced in: v3.11.4, v3.12.0</small>

The following startup options have been added:

- `--cache.max-spare-memory-usage`: the maximum memory usage for spare tables
  in the in-memory cache.
- `--cache.high-water-multiplier`: controls the cache's effective memory usage
  limit. The user-defined memory limit (i.e. `--cache.size`) is multiplied with
  this value to create the effective memory limit, from which on the cache tries
  to free up memory by evicting the oldest entries.

The following metrics have been added:

| Label | Description |
|:------|:------------|
| `rocksdb_cache_edge_compressed_inserts_total` | Total number of compressed inserts into the in-memory edge cache. |
| `rocksdb_cache_edge_empty_inserts_total` | Total number of insertions into the in-memory edge cache for non-connected edges. |
| `rocksdb_cache_edge_inserts_total` | Total number of insertions into the in-memory edge cache. |

### Observability of in-memory cache subsystem

<small>Introduced in: v3.10.11, v.3.11.4, v.3.12.0</small>

The following metrics have been added to improve the observability of in-memory
cache subsystem:
- `rocksdb_cache_free_memory_tasks_total`: Total number of free memory tasks
  that were scheduled by the in-memory edge cache subsystem. This metric will
  be increased whenever the cache subsystem schedules a task to free up memory
  in one of the managed in-memory caches. It is expected to see this metric
  rising when the cache subsystem hits its global memory budget.
- `rocksdb_cache_free_memory_tasks_duration_total`: Total amount of time spent
  inside the free memory tasks of the in-memory cache subsystem. Free memory
  tasks are scheduled by the cache subsystem to free up memory in existing cache
  hash tables.
- `rocksdb_cache_migrate_tasks_total`: Total number of migrate tasks that were
  scheduled by the in-memory edge cache subsystem. This metric will be increased 
  whenever the cache subsystem schedules a task to migrate an existing cache hash
  table to a bigger or smaller size.
- `rocksdb_cache_migrate_tasks_duration_total`: Total amount of time spent inside
  the migrate tasks of the in-memory cache subsystem. Migrate tasks are scheduled
  by the cache subsystem to migrate existing cache hash tables to a bigger or
  smaller table.

### RocksDB .sst file partitioning (experimental)

The following experimental startup options for RockDB .sst file partitioning
have been added:

- `--rocksdb.partition-files-for-documents`
- `--rocksdb.partition-files-for-primary-index`
- `--rocksdb.partition-files-for-edge-index`
- `--rocksdb.partition-files-for-persistent-index`

Enabling any of these options makes RocksDB's compaction write the 
data for different collections/shards/indexes into different .sst files. 
Otherwise, the document data from different collections/shards/indexes 
can be mixed and written into the same .sst files.

When these options are enabled, the RocksDB compaction is more efficient since
a lot of different collections/shards/indexes are written to in parallel.
The disavantage of enabling these options is that there can be more .sst
files than when the option is turned off, and the disk space used by
these .sst files can be higher.
In particular, on deployments with many collections/shards/indexes
this can lead to a very high number of .sst files, with the potential
of outgrowing the maximum number of file descriptors the ArangoDB process 
can open. Thus, these options should only be enabled on deployments with a
limited number of collections/shards/indexes.

### Active AQL query cursors metric

The `arangodb_aql_cursors_active` metric has been added and shows the number
of active AQL query cursors.

AQL query cursors are created for queries that produce more results than
specified in the `batchSize` query option (default value: `1000`). Such results
can be fetched incrementally by client operations in chunks.
As it is unclear if and when a client will fetch any remaining data from a
cursor, every cursor has a server-side timeout value (TTL) after which it is
considered inactive and garbage-collected.

## Internal changes

