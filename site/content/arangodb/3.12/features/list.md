---
title: Feature list of the ArangoDB core database system
menuTitle: Core Database
weight: 5
description: >-
  All features of the ArangoDB database system, available in both the
  Community Edition and Enterprise Edition
aliases:
  - ../introduction/features/community-edition
  - ../introduction/features/enterprise-edition
  - community-edition
  - enterprise-edition
---
{{< info >}}
Feature parity between the Community Edition and the Enterprise Edition is
available from v3.12.5 onward.
{{< /info >}}

## General

- [**Graph Database**](../concepts/data-models.md#graph-model):
  Native support for storing and querying graphs comprised of nodes and edges.
  You can model complex domains because both nodes and edges are fully-fledged
  documents, without restrictions in complexity. Edges can connect node documents
  to express m:n relations with any depth.

- [**Document Database**](../concepts/data-models.md#document-model):
  A modern document database system that allows you to model data intuitively
  and evolve the data model easily. Documents can be organized in collections,
  and collections in databases for multi-tenancy.

- **Native Multi-model**:
  The capabilities of a graph database, a document database, a key-value store
  in one C++ core with a unified query language for a lower TCO (total cost of
  ownership). Easily change the data access strategy or even combine all
  supported data models in a single query. Add full-text search with ranking on
  top and mix it with graph traversals, geo queries, aggregations, or any other
  supported access pattern.

- [**Data Format**](../concepts/data-structure/_index.md#documents):
  JSON, internally stored in a binary format invented by ArangoDB called
  VelocyPack.

- **Schema-free**:
  Flexible data modeling without having to define a schema upfront.
  Model your data as combination of key-value pairs,
  documents, or graphs - perfect for social relations. Optional document
  validation using JSON Schema (draft-4, without remote schema support).

- [**Data Storage**](../components/arangodb-server/storage-engine.md):
  RocksDB storage engine to persist data and indexes on disk, with a hot set in
  memory. It uses journaling (write-ahead logging) and can take advantage of
  modern storage hardware, like SSDs and large caches.

- [**Computed Values**](../concepts/data-structure/documents/computed-values.md):
  Persistent document attributes that are generated when documents are created
  or modified, using an AQL expression.

- [**In the cloud or on-prem**](../features/_index.md#on-premises-versus-cloud):
  Use ArangoDB as a [fully managed service](https://dashboard.arangodb.cloud/home?utm_source=docs&utm_medium=cluster_pages&utm_campaign=docs_traffic),
  self-managed in the cloud, or on-premises.

- [**Multiple Environments**](../operations/installation/_index.md#supported-platforms-and-architectures):
  Run ArangoDB on Linux using the production-ready packages for the x86-64
  architecture, on bare metal or in containers.
  Develop and test with ArangoDB on Windows, macOS, and Linux using the official
  ArangoDB Docker images, available for the x86-64 architecture and 64-bit ARM chips.

## Scalability & High Availability

- [**Hash-based sharding**](../deploy/architecture/data-sharding.md):
  Spread bigger datasets across multiple servers using consistent hashing on
  the default or custom shard keys.

- [**Synchronous Replication**](../deploy/cluster/_index.md#synchronous-replication):
  Data changes are propagated to other cluster nodes immediately as part of an
  operation, and are only considered successful when the configured number of writes
  is reached. Synchronous replication works on a per-shard basis. For each
  collection, you can configure how many copies of each shard are kept in the cluster.

- [**Automatic Failover Cluster**](../deploy/cluster/_index.md#automatic-failover):
  If a cluster node goes down, another node takes over to avoid downtime.

- **Load-Balancer Support**:
  Round-robin load-balancer support for cloud environments.

- **High-performance Request Handling**:
  Low-latency request handling using a boost-ASIO server infrastructure.

## Querying

- [**Declarative Query Language for All Data Models**](../aql/_index.md):
  Powerful query language (AQL) to retrieve and modify data.
  Graph traversals, full-text searches, geo-spatial queries, and aggregations
  can be composed in a single query.
  Support for sliding window queries to aggregate adjacent documents, value
  ranges and time intervals.
  Cluster-distributed aggregation queries.

- [**Query Optimizer**](../aql/execution-and-performance/query-optimization.md):
  Cost-based query optimizer that takes index selectivity estimates into account.
  <!-- TODO: Explain, batching?, lazy evaluation (stream)? -->

- [**Query Profiling**](../aql/execution-and-performance/query-profiling.md):
  Show detailed runtime information for AQL queries.

- [**Query Logging**](../aql/execution-and-performance/query-logging.md):
  Store query metadata and analyze it directly in the database system to debug
  issues and understand usage patterns.

- [**Upsert Operations**](../aql/examples-and-query-patterns/upsert-repsert-guide.md):
  Support for insert-or-update (upsert), insert-or-replace (repsert), and
  insert-or-ignore requests, that result in one or the other operation depending
  on whether the target document exists already.

- [**Relational Joins**](../aql/examples-and-query-patterns/joins.md):
  Joins similar to those in relational database systems can be leveraged to
  match up documents from different collections, allowing normalized data models.

- **Advanced Path-Finding with Multiple Algorithms**:
  Graphs can be [traversed](../aql/graphs/traversals-explained.md) with AQL
  in outbound, inbound, or both directions to retrieve direct and indirect
  neighbor nodes using a fixed or variable depth.
  The [traversal order](../aql/graphs/traversals.md) can be
  depth-first, breadth-first, or in order of increasing edge weights
  ("Weighted Traversals"). Stop conditions for pruning paths are supported.
  Traversal algorithms to get a [shortest path](../aql/graphs/shortest-path.md),
  [all shortest paths](../aql/graphs/all-shortest-paths.md), paths in order of
  increasing length ("[k Shortest Paths](../aql/graphs/k-shortest-paths.md)"),
  and to enumerate all paths between two nodes
  ("[k Paths](../aql/graphs/k-paths.md)") are available, too.

- [**ArangoSearch for Text Search and Ranking**](../index-and-search/arangosearch/_index.md):
  A built-in search engine for full-text, complex data structures, and more.
  Exact value matching, range queries, prefix matching, case-insensitive and
  accent-insensitive search. Token, phrase, wildcard, and fuzzy search support
  for full-text. Result ranking using Okapi BM25 and TF-IDF.
  Geo-spatial search that can be combined with full-text search.
  Flexible data field pre-processing with custom queries and the ability to
  chain built-in and custom Analyzers. Language-agnostic tokenization of text.

- [**GeoJSON Support**](../aql/functions/geo.md#geojson):
  Geographic data encoded in the popular GeoJSON format can be stored and used
  for geo-spatial queries.

{{% comment %}} Experimental feature
- [**Query result spillover**](../aql/how-to-invoke-aql/with-arangosh.md#spilloverthresholdmemoryusage):
  AQL queries can store intermediate and final results temporarily on disk
  (also known as external result sets) to decrease memory usage when a specified
  threshold is reached.
{{% /comment %}}

- [**Vector search**](../index-and-search/indexing/working-with-indexes/vector-indexes.md):
  Find items with similar properties by comparing vector embeddings generated by
  machine learning models.

- [**Search highlighting**](../index-and-search/arangosearch/search-highlighting.md):
  Get the substring positions of matched terms, phrases, or _n_-grams.

- [**Nested search**](../index-and-search/arangosearch/nested-search.md):
  Match arrays of objects with all the conditions met by a single sub-object,
  and define for how many of the elements this must be true.

{{% comment %}} Experimental feature
- **[`classification`](../index-and-search/analyzers.md#classification) and [`nearest_neighbors` Analyzers](../index-and-search/analyzers.md#nearest_neighbors)**:
  Classification of text tokens and finding similar tokens using supervised
  fastText word embedding models.
{{% /comment %}}

- [**Skip inaccessible collections**](../aql/how-to-invoke-aql/with-arangosh.md#skipinaccessiblecollections):
  Let AQL queries like graph traversals pretend that collections are empty if
  the user has no access to them instead of failing the query.

## Transactions

- [**AQL Queries**](../aql/data-queries.md#transactional-execution):
  AQL queries are executed transactionally (with exceptions), either committing
  or rolling back data modifications automatically.

- [**Stream Transactions**](../develop/http-api/transactions/stream-transactions.md):
  Transactions with individual begin and commit / abort commands that can span
  multiple AQL queries and API calls of supported APIs.

- [**JavaScript Transactions**](../develop/http-api/transactions/javascript-transactions.md):
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
  feature to be ACID. <!-- TODO: can we put it like this? -->

## Performance

- [**SmartGraphs**](../graphs/smartgraphs/_index.md):
  Value-based sharding of large graph datasets for better data locality when
  traversing graphs.

- [**EnterpriseGraphs**](../graphs/enterprisegraphs/_index.md):
  A specialized version of SmartGraphs, with an automatic sharding key selection.

- [**SmartGraphs using SatelliteCollections**](../graphs/smartgraphs/_index.md):
  Collections replicated on all cluster nodes can be combined with graphs
  sharded by document attributes to enable more local execution of graph queries.

- [**SatelliteGraphs**](../graphs/satellitegraphs/_index.md):
  Graphs replicated on all cluster nodes to execute graph traversals locally.

- [**SatelliteCollections**](../develop/satellitecollections.md):
  Collections replicated on all cluster nodes to execute joins with sharded
  data locally.

- [**SmartJoins**](../develop/smartjoins.md):
  Co-located joins in a cluster using identically sharded collections.

- [**OneShard**](../deploy/oneshard.md):
  Option to store all collections of a database on a single cluster node, to
  combine the performance of a single server and ACID semantics with a
  fault-tolerant cluster setup.

- [**Traversal**](../release-notes/version-3.7/whats-new-in-3-7.md#traversal-parallelization-enterprise-edition)
  [**Parallelization**](../release-notes/version-3.10/whats-new-in-3-10.md#parallelism-for-sharded-graphs-enterprise-edition):
  Parallel execution of traversal queries with many start nodes, leading to
  faster results.

- [**Traversal Projections**](../release-notes/version-3.10/whats-new-in-3-10.md#traversal-projections-enterprise-edition):
  Optimized data loading for AQL traversal queries if only a few document
  attributes are accessed.

- [**Parallel index creation**](../release-notes/version-3.10/whats-new-in-3-10.md#parallel-index-creation-enterprise-edition):
  Non-unique indexes can be created with multiple threads in parallel.

- [**`minhash` Analyzer**](../index-and-search/analyzers.md#minhash):
  Jaccard similarity approximation for entity resolution, such as for finding
  duplicate records, based on how many elements they have in common

- [**`geo_s2` Analyzer**](../index-and-search/analyzers.md#geo_s2):
  Efficiently index geo-spatial data using different binary formats, tuning the
  size on disk, the precision, and query performance.

- [**ArangoSearch column cache**](../release-notes/version-3.10/whats-new-in-3-10.md#arangosearch-column-cache-enterprise-edition):
  Always cache field normalization values, Geo Analyzer auxiliary data,
  stored values, primary sort columns, and primary key columns in memory to
  improve the performance of Views and inverted indexes.

- [**ArangoSearch WAND optimization**](../index-and-search/arangosearch/performance.md#wand-optimization):
  Retrieve search results for the highest-ranking matches from Views faster by
  defining a list of sort expressions to optimize.

- [**Read from followers in clusters**](../develop/http-api/documents.md#read-from-followers):
  Allow dirty reads so that Coordinators can read from any shard replica and not
  only from the leader, for scaling reads.

- [**Persistent Indexes**](../index-and-search/indexing/basics.md#persistent-index):
  Indexes are stored on disk to enable fast server restarts. You can create
  secondary indexes over one or multiple fields, optionally with a uniqueness
  constraint. A "sparse" option to only index non-null values is also available.
  The elements of an array can be indexed individually.

- [**Inverted indexes**](../index-and-search/indexing/working-with-indexes/inverted-indexes.md):
  An eventually consistent index type that can accelerate a broad range of
  queries from simple to complex, including full-text search.

- [**Vertex-centric Indexes**](../index-and-search/indexing/basics.md#vertex-centric-indexes):
  Secondary indexes for more efficient graph traversals with filter conditions.

- [**Time-to-Live (TTL) Indexes**](../index-and-search/indexing/basics.md#ttl-time-to-live-index):
  Time-based removal of expired documents.

- [**Geo-spatial Indexes**](../index-and-search/indexing/basics.md#geo-index):
  Accelerated geo-spatial queries for locations and GeoJSON objects, based on
  the S2 library. <!-- TODO: list supported queries? Centroid-limitations? -->
  Support for composable, distance-based geo-queries ("geo cursors").

- [**Multi-dimensional indexes**](../index-and-search/indexing/working-with-indexes/multi-dimensional-indexes.md):
  An index type to efficiently intersect multiple range queries, like finding
  all appointments that intersect a time range.

- [**Background Indexing**](../index-and-search/indexing/basics.md#creating-indexes-in-background):
  Indexes can be created in the background to not block queries in the meantime.

- [**Index cache refilling**](../release-notes/version-3.11/whats-new-in-3-11.md#index-cache-refilling):
  In-memory index caches are automatically repopulated after writes that affect
  an edge index or cache-enabled persistent indexes to maximize cache hits and
  thus query performance.

- [**Extensive Query Optimization**](../aql/execution-and-performance/query-optimization.md):
  Late document materialization to only fetch the relevant documents from
  SORT/LIMIT queries. Early pruning of non-matching documents in full
  collection scans. Inlining of certain subqueries to improve execution time.
  <!-- TODO, move to Querying? -->

{{% comment %}} Experimental feature in v3.12.4
- [**Query plan caching**](../aql/execution-and-performance/caching-query-plans.md)
  Reduce the total time for processing queries by avoiding to parse, plan, and
  optimize the same queries over and over again with an AQL execution plan cache.
{{% /comment %}}

- [**Parallel gather**](../release-notes/version-3.11/whats-new-in-3-11.md#parallel-gather):
  Fast, memory-efficient processing of cluster queries by combining
  results in parallel.

## Extensibility

- [**Microservice Support with ArangoDB Foxx**](../develop/foxx-microservices/_index.md):
  Use ArangoDB as an application server and fuse your application and database
  together for maximal throughput.
  With fault-tolerant cluster support.

- [**Server-Side Functions**](../aql/user-defined-functions.md):
  You can extend AQL with user-defined functions written in JavaScript.

## Security

- [**Auditing**](../operations/security/audit-logging.md):
  Audit logs of all server interactions.

- [**Encryption at Rest**](../operations/security/encryption-at-rest.md):
  Hardware-accelerated on-disk encryption for your data.

- [**Encrypted Backups**](../components/tools/arangodump/examples.md#encryption):
  Data dumps can be encrypted using a strong 256-bit AES block cipher.

- [**Hot Backups**](../operations/backup-and-restore.md#hot-backups):
  Consistent, incremental data backups without downtime for single servers and clusters.

- [**Enhanced Data Masking**](../components/tools/arangodump/maskings.md#masking-functions):
  Extended data masking capabilities for attributes containing sensitive data
  / PII when creating backups.

- **Advanced Encryption and Security Configuration**:
  Key rotation for [JWT secrets](../develop/http-api/authentication.md#hot-reload-jwt-secrets)
  and [on-disk encryption](../develop/http-api/security.md#encryption-at-rest),
  as well as [Server Name Indication (SNI)](../components/arangodb-server/options.md#--sslserver-name-indication).

- [**Authentication**](../operations/administration/user-management/_index.md):
  Built-in user management with password- and token-based authentication.

- **Role-based Access Control**:
  ArangoDB supports all basic security requirements. By using ArangoDB's Foxx
  microservice framework users can achieve very high security standards
  fitting individual needs.

- [**TLS Encryption**](../components/arangodb-server/options.md#ssl):
  Internal and external communication over encrypted network connections with
  TLS (formerly SSL).
  [TLS key and certificate rotation](../release-notes/version-3.7/whats-new-in-3-7.md#tls-key-and-certificate-rotation)
  is supported.

## Administration

- [**Web-based User Interface**](../components/web-interface/_index.md):
  Graphical UI for your browser to work with ArangoDB. It allows you to
  view, create, and modify databases, collections, documents, graphs, etc.
  You can also run, explain, and profile AQL queries. Includes a graph viewer
  with WebGL support.

- **Cluster-friendly User Interface**:
  View the status of your cluster and its individual nodes, and move and
  rebalance shards via the web interface.

- **[Backup](../components/tools/arangodump/_index.md) and [Restore](../components/tools/arangorestore/_index.md) Tools**:
  Multi-threaded dumping and restoring of collection settings and data
  in JSON format. Data masking capabilities for attributes containing sensitive
  data / PII when creating backups.

- **[Import](../components/tools/arangoimport/_index.md) and [Export](../components/tools/arangoexport/_index.md) Tools**:
  CLI utilities to load and export data in multiple text-based formats.
  You can import from JSON, JSONL, CSV, and TSV files, and export to JSON, JSONL,
  CSV, TSV, XML, and XGMML files.

- [**Metrics**](../develop/http-api/monitoring/metrics.md):
  Monitor the healthiness and performance of ArangoDB servers using the metrics
  exported in the Prometheus format.
