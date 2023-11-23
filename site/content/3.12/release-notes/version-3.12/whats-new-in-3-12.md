---
title: Features and Improvements in ArangoDB 3.12
menuTitle: What's New in 3.12
weight: 5
description: >-
  A new optimization for specific ArangoSearch queries, more entries in the
  edge cache with compression
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

### `SEARCH` parallelization

In search queries against Views, you can set the new `parallelism` option for
`SEARCH` operations to optionally process index segments in parallel using
multiple threads. This can speed up search queries.

The default value for the `parallelism` option is defined by the new
`--arangosearch.default-parallelism` startup option that defaults to `1`.

The new `--arangosearch.execution-threads-limit` startup option controls how
many threads can be used in total for search queries. The new
`arangodb_search_execution_threads_demand` metric reports the number of threads
that queries request. If it is below the configured thread limit, it coincides
with the number of active threads. If it exceeds the limit, some queries cannot
currently get the threads as requested and may have to use a single thread until
more become available.

See [`SEARCH` operation in AQL](../../aql/high-level-operations/search.md#parallelism)
for details.

## Analyzers


## Improved memory accounting and usage

Version 3.12 features multiple improvements to observability of ArangoDB
deployments. Memory usage is more accurately tracked and additional metrics have
been added for monitoring the memory consumption.

AQL queries may now report a higher memory usage and thus run into memory limits
sooner, see [Higher reported memory usage for AQL queries](incompatible-changes-in-3-12.md#higher-reported-memory-usage-for-aql-queries).

Furthermore, the memory usage of some subsystems has been optimized. When
dropping a database, all contained collections are now marked as dropped
immediately. Ongoing operations on these collections can be stopped earlier, and
memory for the underlying collections and indexes can be reclaimed sooner.
Memory used for index selectively estimates is now also released early.
ArangoSearch has a smaller memory footprint for removal operations now.

The following new metrics have been added for memory observability:

| Label | Description |
|:------|:------------|
| `arangodb_agency_node_memory_usage` | Memory used by Agency store/cache. |
| `arangodb_index_estimates_memory_usage` | Total memory usage of all index selectivity estimates. |
| `arangodb_internal_cluster_info_memory_usage` | Amount of memory spent in ClusterInfo. |
| `arangodb_requests_memory_usage` | Memory consumed by incoming, queued, and currently processed requests. |
| `arangodb_revision_tree_buffered_memory_usage` | Total memory usage of buffered updates for all revision trees. |
| `arangodb_scheduler_queue_memory_usage` | Number of bytes allocated for tasks in the scheduler queue. |
| `arangodb_scheduler_stack_memory_usage` | Approximate stack memory usage of worker threads. |
| `arangodb_search_consolidations_memory_usage` | Amount of memory in bytes that is used for consolidating an ArangoSearch index. |
| `arangodb_search_mapped_memory` | Amount of memory in bytes that is mapped for an ArangoSearch index. |
| `arangodb_search_readers_memory_usage` | Amount of memory in bytes that is used for reading from an ArangoSearch index. |
| `arangodb_search_writers_memory_usage` | Amount of memory in bytes that is used for writing to an ArangoSearch index. |
| `arangodb_transactions_internal_memory_usage` | Total memory usage of internal transactions. |
| `arangodb_transactions_rest_memory_usage` | Total memory usage of user transactions (excluding top-level AQL queries). |

## Web interface

### Shard rebalancing

The feature for rebalancing shards in cluster deployments has been moved from
the **Rebalance Shards** tab in the **NODES** section to the **Distribution**
tab in the **CLUSTER** section of the web interface.

The updated interface now offers the following options:
- **Move Leaders**
- **Move Followers**
- **Include System Collections**

### Unified list view

ArangoDB 3.12 brings a significant enhancement to the display of collections,
Views, graphs, users, services, and databases in the web interface.
The previous tile format has been replaced with a user-friendly tabular
layout, providing a consistent and intuitive experience that is visually
aligned across all components. The existing tabular views have also been
reworked to ensure a seamless transition.

The new tabular format includes the following features:
- **Dynamic filters on columns**: Each column now has a dynamic filter box,
  allowing you to efficiently search and filter based on keywords. This makes
  it easy to locate specific items within the list.
- **Dynamic sorting on columns**: Sort elements easily based on column data
  such as name, date, or size. This functionality provides a flexible way to
  organize and view your data.

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

### Adjustable Stream Transaction size

The previously fixed limit of 128 MiB for [Stream Transactions](../../develop/transactions/stream-transactions.md)
can now be configured with the new `--transaction.streaming-max-transaction-size`
startup option. The default value remains 128 MiB.

### LZ4 compression for values in the in-memory edge cache

<small>Introduced in: v3.11.2</small>

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

<small>Introduced in: v3.10.10, v3.11.2</small>

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

<small>Introduced in: v3.11.5</small>

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

### Configurable maximum for queued log entries

<small>Introduced in: v3.10.12, v3.11.5</small>

The new `--log.max-queued-entries` startup option lets you configure how many
log entries are queued in a background thread.

Log entries are pushed on a queue for asynchronous writing unless you enable the
`--log.force-direct` startup option. If you use a slow log output (e.g. syslog),
the queue might grow and eventually overflow.

You can configure the upper bound of the queue with this option. If the queue is
full, log entries are written synchronously until the queue has space again.

## Client tools

### arangodump

_arangodump_ now supports a `--ignore-collection` startup option that you can
specify multiple times to exclude the specified collections from a dump.

It cannot be used together with the existing `--collection` option for specifying
collections to include.

## Miscellaneous changes

### Active AQL query cursors metric

The `arangodb_aql_cursors_active` metric has been added and shows the number
of active AQL query cursors.

AQL query cursors are created for queries that produce more results than
specified in the `batchSize` query option (default value: `1000`). Such results
can be fetched incrementally by client operations in chunks.
As it is unclear if and when a client will fetch any remaining data from a
cursor, every cursor has a server-side timeout value (TTL) after which it is
considered inactive and garbage-collected.

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
The disadvantage of enabling these options is that there can be more .sst
files than when the option is turned off, and the disk space used by
these .sst files can be higher.
In particular, on deployments with many collections/shards/indexes
this can lead to a very high number of .sst files, with the potential
of outgrowing the maximum number of file descriptors the ArangoDB process 
can open. Thus, these options should only be enabled on deployments with a
limited number of collections/shards/indexes.

### ArangoSearch file descriptor metric

The following metric has been added:

- `arangodb_search_file_descriptors`:
  Current count of opened file descriptors for an ArangoSearch index.

### More instant Hot Backups

<small>Introduced in: v3.10.10, v3.11.3</small>

Cluster deployments no longer wait for all in-progress transactions to get
committed when a user requests a Hot Backup. The waiting could cause deadlocks
and thus Hot Backups to fail, in particular in ArangoGraph. Now, Hot Backups are
created immediately and commits have to wait until the backup process is done.

### In-memory edge cache startup options and metrics

<small>Introduced in: v3.11.4</small>

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

<small>Introduced in: v3.10.11, v3.11.4</small>

The following metrics have been added to improve the observability of the in-memory
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

### Detached scheduler threads

<small>Introduced in: v3.11.5</small>

A scheduler thread now has the capability to detach itself from the scheduler
if it observes the need to perform a potentially long running task, like waiting
for a lock. This allows a new scheduler thread to be started and prevents
scenarios where all threads are blocked waiting for a lock, which has previously
led to deadlock situations.

Threads waiting for more than 1 second on a collection lock will detach
themselves.

The following startup option has been added:
- `--server.max-number-detached-threads`: The maximum number of detached scheduler
  threads.

The following metric as been added:
- `arangodb_scheduler_num_detached_threads`: The number of worker threads
  currently started and detached from the scheduler. 

## Client tools

### arangodump

#### Improved dump performance and size

From version 3.12 onward, _arangodump_ has extended parallelization capabilities
to work not only at the collection level, but also at the shard level.
In combination with the newly added support for the VelocyPack format that
ArangoDB uses internally, database dumps can now be created and restored more
quickly and occupy less disk space. This major performance boost makes dumps and
restores up to several times faster, which is extremely useful when dealing
with large shards.

- Whether the new parallel dump variant is used is controlled by the newly added
  `--use-parallel-dump` startup option. The default value is `true`.

- To achieve the best dump performance and the smallest data dumps in terms of
  size, you can additionally use the `--dump-vpack` option. The resulting dump data
  is then stored in the more compact but binary VelocyPack format instead of the
  text-based JSON format. The output file size can be less even compared to
  compressed JSON. It can also lead to faster dumps because there is less data to
  transfer and no conversion from the server-internal format (VelocyPack) to JSON
  is needed. Note, however, that this option is **experimental** and disabled by
  default.

- Optionally, you can make _arangodump_ write multiple output files per
  collection/shard. The file splitting allows for better parallelization when
  writing the results to disk, which in case of non-split files must be serialized.
  You can enable it by setting the `--split-files` option to `true`. This option
  is disabled by default because dumps created with this option enabled cannot
  be restored into previous versions of ArangoDB.

- You can enable the new `--compress-transfer` startup option for compressing the
  dump data on the server for a faster transfer. This is helpful especially if
  the network is slow or its capacity is maxed out. The data is decompressed on
  the client side and recompressed if you enable the  `--compress-output` option.

#### Server-side resource usage limits and metrics

The following `arangod` startup options can be used to limit
the resource usage of parallel _arangodump_ invocations:

- `--dump.max-memory-usage`: Maximum memory usage (in bytes) to be
  used by the server-side parts of all ongoing _arangodump_ invocations.
  This option can be used to limit the amount of memory for prefetching
  and keeping results on the server side when _arangodump_ is invoked
  with the `--parallel-dump` option. It does not have an effect for
  _arangodump_ invocations that did not use the `--parallel-dump` option.
  Note that the memory usage limit is not exact and that it can be
  slightly exceeded in some situations to guarantee progress.
- -`-dump.max-docs-per-batch`: Maximum number of documents per batch
  that can be used in a dump. If an _arangodump_ invocation requests
  higher values than configured here, the value is automatically
  capped to this value. Will only be followed for _arangodump_ invocations
  that use the `--parallel-dump` option.
- `--dump.max-batch-size`: Maximum batch size value (in bytes) that
  can be used in a dump. If an _arangodump_ invocation requests larger
  batch sizes than configured here, the actual batch sizes is capped
  to this value. Will only be followed for _arangodump_ invocations that
  use the -`-parallel-dump` option.
- `--dump.max-parallelism`: Maximum parallelism (number of server-side
  threads) that can be used in a dump. If an _arangodump_ invocation requests
  a higher number of prefetch threads than configured here, the actual
  number of server-side prefetch threads is capped to this value.
  Will only be followed for _arangodump_ invocations that use the
  `--parallel-dump` option.

The following metrics have been added to observe the behavior of parallel
_arangodump_ operations on the server:

- `arangodb_dump_memory_usage`: Current memory usage of all ongoing
  _arangodump_ operations on the server.
- `arangodb_dump_ongoing`: Number of currently ongoing _arangodump_
  operations on the server.
- `arangodb_dump_threads_blocked_total`: Number of times a server-side
  dump thread was blocked because it honored the server-side memory
  limit for dumps.

## Internal changes

