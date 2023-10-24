---
title: Community Edition Features
menuTitle: Community Edition
weight: 5
description: >-
  The open-source version of ArangoDB is available under the permissive
  Apache 2.0 license and offers an extensive feature set including cluster
  support for free
archetype: default
aliases:
  - ../../introduction/features/community-edition
---
The Community Edition features are outlined below. For additional information,
see [arangodb.com/community-server/](https://www.arangodb.com/community-server/).

## General

- [**Graph Database**](../../concepts/data-models.md#graph-model):
  Native support for storing and querying graphs comprised of vertices and edges.
  You can model complex domains because edges are documents without any
  restrictions in complexity.

- [**Document Database**](../../concepts/data-models.md#document-model):
  A modern document database system that allows you to model data intuitively
  and evolve the data model easily. Documents can be organized in collections,
  and collections in databases for multi-tenancy.

{{% comment %}}
  TODO: Add a bullet point for multi-model? (unified query language, lower TCO, ...)
{{% /comment %}}

- [**Data Format**](../../concepts/data-structure/_index.md#documents):
  JSON, internally stored in a binary format invented by ArangoDB called
  VelocyPack.

- **Schema-free**:
  Flexible data modeling without having to define a schema upfront.
  Model your data as combination of key-value pairs,
  documents, or graphs - perfect for social relations. Optional document
  validation using JSON Schema (draft-4, without remote schema support).

- [**Data Storage**](../../deploy/architecture/storage-engine.md):
  RocksDB storage engine to persist data and indexes on disk, with a hot set in
  memory. It uses journaling (write-ahead logging) and can take advantage of
  modern storage hardware, like SSDs and large caches.

- [**Computed Values**](../../concepts/data-structure/documents/computed-values.md):
  Persistent document attributes that are generated when documents are created
  or modified, using an AQL expression.

- [**Multiple Environments**](../../operations/installation/_index.md#supported-platforms-and-architectures):
  Use ArangoDB as a [managed service](https://cloud.arangodb.com),
  in your own cloud, or on-premises.
  Develop and test with ArangoDB on Linux, macOS, and Windows, and run it in
  production on Linux. ArangoDB is available for 64-bit ARM chips on macOS and
  Linux as well as for the x86-64 architecture.

## Scalability & High Availability

- [**Hash-based sharding**](../../deploy/architecture/data-sharding.md):
  Spread bigger datasets across multiple servers using consistent hashing on
  the default or custom shard keys.

- [**Synchronous Replication**](../../deploy/deployment/cluster/_index.md#synchronous-replication):
  Data changes are propagated to other cluster nodes immediately as part of an
  operation, and only considered successful when the configured number of writes
  is reached. Synchronous replication works on a per-shard basis. For each
  collection, you can configure how many copies of each shard are kept in the cluster.

- [**Active Failover**](../../deploy/deployment/active-failover/_index.md):
  Run a single server with asynchronous replication to one or more passive
  single servers for automatic failover.

- [**Automatic Failover Cluster**](../../deploy/deployment/cluster/_index.md#automatic-failover):
  If a nodes goes down, another node takes over to avoid any downtime. <!-- TODO: Can we say that? -->

{{% comment %}}
  TODO: - **Master/Master Conflict Resolution**: What does this refer to? How does it work? MVCC?
{{% /comment %}}

- **Load-Balancer Support**:
  Round-robin load-balancer support for cloud environments.

- **High-performance Request Handling**:
  Low-latency request handling using a boost-ASIO server infrastructure.

## Querying

- [**Declarative Query Language for All Data Models**](../../aql/_index.md):
  Powerful query language (AQL) to retrieve and modify data.
  Graph traversals, full-text searches, geo-spatial queries, and aggregations
  can be composed in a single query.
  Support for sliding window queries to aggregate adjacent documents, value
  ranges and time intervals.
  Cluster-distributed aggregation queries.

- [**Query Optimizer**](../../aql/execution-and-performance/query-optimization.md):
  Cost-based query optimizer that takes index selectivity estimates into account.
  <!-- TODO: Explain, batching?, lazy evaluation (stream)? -->

- [**Query Profiling**](../../aql/execution-and-performance/query-profiling.md):
  Show detailed runtime information for AQL queries.

- [**Upsert Operations**](../../aql/examples-and-query-patterns/upsert-repsert-guide.md):
  Support for insert-or-update (upsert), insert-or-replace (repsert), and
  insert-or-ignore requests, that result in one or the other operation depending
  on whether the target document exists already.

- **Graph Relations**:
  Edges can connect vertex and even edge documents to express complex m:n
  relations with any depth, creating graphs and hyper-graphs.
  <!-- TODO: does this refer to the data model, graph traversals, or something else? -->

- [**Relational Joins**](../../aql/examples-and-query-patterns/joins.md):
  Joins similar to those in relational database systems can be leveraged to
  match up documents from different collections, allowing normalized data models.

- **Advanced Path-Finding with Multiple Algorithms**:
  Graphs can be [traversed](../../aql/graphs/traversals-explained.md) with AQL to
  retrieve direct and indirect neighbor nodes using a fixed or variable depth.
  The [traversal order](../../aql/graphs/traversals.md) can be
  depth-first, breadth-first, or in order of increasing edge weights
  ("Weighted Traversals"). Stop conditions for pruning paths are supported.
  Traversal algorithms to get a [shortest path](../../aql/graphs/shortest-path.md),
  [all shortest paths](../../aql/graphs/all-shortest-paths.md), paths in order of
  increasing length ("[k Shortest Paths](../../aql/graphs/k-shortest-paths.md)"),
  and to enumerate all paths between two vertices
  ("[k Paths](../../aql/graphs/k-paths.md)") are available, too.

- [**Pregel**](../../data-science/pregel/_index.md):
  Iterative graph processing for single servers with pre-built algorithms like
  PageRank, Connected Components, and Label Propagation. Cluster support
  requires the Enterprise Edition.

- [**ArangoSearch for Text Search and Ranking**](../../index-and-search/arangosearch/_index.md):
  A built-in search engine for full-text, complex data structures, and more.
  Exact value matching, range queries, prefix matching, case-insensitive and
  accent-insensitive search. Token, phrase, wildcard, and fuzzy search support
  for full-text. Result ranking using Okapi BM25 and TF-IDF.
  Geo-spatial search that can be combined with full-text search.
  Flexible data field pre-processing with custom queries and the ability to
  chain built-in and custom Analyzers. Language-agnostic tokenization of text.

- [**GeoJSON Support**](../../index-and-search/indexing/working-with-indexes/geo-spatial-indexes.md#geojson):
  Geographic data encoded in the popular GeoJSON format can be stored and used
  for geo-spatial queries.

{{% comment %}} Experimental feature
- [**Query result spillover**](../../aql/how-to-invoke-aql/with-arangosh.md#spilloverthresholdmemoryusage)
  AQL queries can store intermediate and final results temporarily on disk
  (also known as external result sets) to decrease memory usage when a specified
  threshold is reached.
{{% /comment %}}

## Transactions

- [**AQL Queries**](../../aql/data-queries.md#transactional-execution):
  AQL queries are executed transactionally (with exceptions), either committing
  or rolling back data modifications automatically.

- [**Stream Transactions**](../../develop/http-api/transactions/stream-transactions.md):
  Transactions with individual begin and commit / abort commands that can span
  multiple AQL queries and API calls of supported APIs.

- [**JavaScript Transactions**](../../develop/http-api/transactions/javascript-transactions.md):
  Single-request transactions written in JavaScript that leverage ArangoDB's
  JavaScript API.

- **Multi-Document Transactions**:
  Transactions are not limited to single documents, but can involve many
  documents of a collection.

- **Multi-Collection Transactions**
  A single transaction can modify the documents of multiple collections.
  There is an automatic deadlock detection for single servers.

- **ACID Transactions**:
  Using single servers, multi-document / multi-collection queries are guaranteed
  to be fully ACID (atomic, consistent, isolated, durable).
  Using cluster deployments, single-document operations are fully ACID, too.
  Multi-document queries in a cluster are not ACID, except for collections with
  a single shard. Multi-collection queries require the OneShard
  feature of the Enterprise Edition to be ACID. <!-- TODO: can we put it like this? -->

## Performance

- [**Persistent Indexes**](../../index-and-search/indexing/basics.md#persistent-index):
  Indexes are stored on disk to enable fast server restarts. You can create
  secondary indexes over one or multiple fields, optionally with a uniqueness
  constraint. A "sparse" option to only index non-null values is also available.
  The elements of an array can be indexed individually.

- [**Inverted indexes**](../../index-and-search/indexing/working-with-indexes/inverted-indexes.md):
  An eventually consistent index type that can accelerate a broad range of
  queries from simple to complex, including full-text search.

- [**Vertex-centric Indexes**](../../index-and-search/indexing/basics.md#vertex-centric-indexes):
  Secondary indexes for more efficient graph traversals with filter conditions.

- [**Time-to-Live (TTL) Indexes**](../../index-and-search/indexing/basics.md#ttl-time-to-live-index):
  Time-based removal of expired documents.

- [**Geo-spatial Indexes**](../../index-and-search/indexing/basics.md#geo-index):
  Accelerated geo-spatial queries for locations and GeoJSON objects, based on
  the S2 library. <!-- TODO: list supported queries? Centroid-limitations? -->
  Support for composable, distance-based geo-queries ("geo cursors").

{{% comment %}} Experimental feature
- [**Multi-dimensional indexes**](../../index-and-search/indexing/working-with-indexes/multi-dimensional-indexes.md):
  An index type to efficiently intersect multiple range queries, like finding
  all appointments that intersect a time range.
{{% /comment %}}

- [**Background Indexing**](../../index-and-search/indexing/basics.md#creating-indexes-in-background):
  Indexes can be created in the background to not block queries in the meantime.

- [**Index cache refilling**](../../release-notes/version-3.11/whats-new-in-3-11.md#index-cache-refilling):
  In-memory index caches are automatically repopulated after writes that affect
  an edge index or cache-enabled persistent indexes to maximize cache hits and
  thus query performance.

- [**Extensive Query Optimization**](../../aql/execution-and-performance/query-optimization.md):
  Late document materialization to only fetch the relevant documents from
  SORT/LIMIT queries. Early pruning of non-matching documents in full
  collection scans. Inlining of certain subqueries to improve execution time.
  <!-- TODO, move to Querying? -->

- [**Parallel gather**](../../release-notes/version-3.11/whats-new-in-3-11.md#parallel-gather):
  Fast, memory-efficient processing of cluster queries by combining
  results in parallel.

## Extensibility

- [**Microservice Support with ArangoDB Foxx**](../../develop/foxx-microservices/_index.md):
  Use ArangoDB as an application server and fuse your application and database
  together for maximal throughput.
  With fault-tolerant cluster support.

- [**Server-Side Functions**](../../aql/user-defined-functions.md):
  You can extend AQL with user-defined functions written in JavaScript.

## Security

- [**Authentication**](../../operations/administration/user-management/_index.md):
  Built-in user management with password- and token-based authentication.

- **Role-based Access Control**:
  ArangoDB supports all basic security requirements. By using ArangoDB's Foxx
  microservice framework users can achieve very high security standards
  fitting individual needs.

- [**TLS Encryption**](../../components/arangodb-server/options.md#ssl):
  Internal and external communication over encrypted network connections with
  TLS (formerly SSL).
  [TLS key and certificates rotation](../../release-notes/version-3.7/whats-new-in-3-7.md#tls-key-and-certificate-rotation)
  is supported.

## Administration

- [**Web-based User Interface**](../../components/web-interface/_index.md):
  Graphical UI for your browser to work with ArangoDB. It allows you to
  view, create, and modify databases, collections, documents, graphs, etc.
  You can also run, explain, and profile AQL queries. Includes a graph viewer
  with WebGL support.

- **Cluster-friendly User Interface**:
  View the status of your cluster and its individual nodes, and move and
  rebalance shards via the web interface.

- **[Backup](../../components/tools/arangodump/_index.md) and [Restore](../../components/tools/arangorestore/_index.md) Tools**:
  Multi-threaded dumping and restoring of collection settings and data
  in JSON format. Data masking capabilities for attributes containing sensitive
  data / PII when creating backups.

- **[Import](../../components/tools/arangoimport/_index.md) and [Export](../../components/tools/arangoexport/_index.md) Tools**:
  CLI utilities to load and export data in multiple text-based formats.
  You can import from JSON, JSONL, CSV, and TSV files, and export to JSON, JSONL,
  CSV, TSV, XML, and XGMML files.

- [**Metrics**](../../develop/http-api/monitoring.md#metrics):
  Monitor the healthiness and performance of ArangoDB servers using the metrics
  exported in the Prometheus format.
