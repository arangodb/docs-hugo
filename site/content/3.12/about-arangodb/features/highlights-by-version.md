---
title: Highlights by Version
menuTitle: Highlights by Version
weight: 15
description: >-
  The most notable features in the Community and Enterprise Edition of ArangoDB,
  grouped by version
archetype: default
aliases:
  - ../../introduction/features/highlights-by-version
---
## Version 3.12

**All Editions**

- [**`wildcard` Analyzer**](../../index-and-search/analyzers.md#wildcard):
  Accelerate wildcard searches against Views and inverted indexes with _n_-grams
  to quickly find candidate matches.

- [**Multi-dimensional indexes**](../../index-and-search/indexing/working-with-indexes/multi-dimensional-indexes.md):
  An index type to efficiently intersect multiple range queries, like finding
  all appointments that intersect a time range.

- [**External versioning**](../../release-notes/version-3.12/whats-new-in-3-12.md#external-versioning-support):
  Specify any top-level attribute to compare whether the version number is higher
  than the currently stored one when updating or replacing documents.

**Enterprise Edition**

- [**ArangoSearch WAND optimization**](../../index-and-search/arangosearch/performance.md#wand-optimization):
  Retrieve search results for the highest-ranking matches from Views faster by
  defining a list of sort expressions to optimize.

Also see [What's New in 3.12](../../release-notes/version-3.12/whats-new-in-3-12.md).

## Version 3.11

**All Editions**

- [**Parallel gather**](../../release-notes/version-3.11/whats-new-in-3-11.md#parallel-gather):
  Faster, more memory-efficient processing of cluster queries by combining
  results on Coordinators in parallel.

- [**Index cache refilling**](../../release-notes/version-3.11/whats-new-in-3-11.md#index-cache-refilling):
  Automatically repopulate in-memory index caches after writes that affect an
  edge index or cache-enabled persistent indexes to maximize cache hits and thus
  query performance.

**Enterprise Edition**

- [**ArangoSearch column cache**](../../release-notes/version-3.10/whats-new-in-3-10.md#arangosearch-column-cache-enterprise-edition):
  Always cache field normalization values, Geo Analyzer auxiliary data,
  stored values, primary sort columns, and primary key columns in memory to
  improve the performance of Views and inverted indexes.

- [**`geo_s2` Analyzer**](../../index-and-search/analyzers.md#geo_s2):
  Efficiently index geo-spatial data using different binary formats, tuning the
  size on disk, the precision, and query performance.

Also see [What's New in 3.11](../../release-notes/version-3.11/whats-new-in-3-11.md).

## Version 3.10

**All Editions**

- [**Native ARM Support**](../../release-notes/version-3.10/whats-new-in-3-10.md#native-arm-support):
  Packages for the ARM architecture are now available, including native support
  for Apple silicon.

- [**Computed Values**](../../concepts/data-structure/documents/computed-values.md):
  Persistent document attributes that are generated when documents are created
  or modified, using an AQL expression.

- [**Inverted indexes**](../../index-and-search/indexing/working-with-indexes/inverted-indexes.md):
  A new, eventually consistent index type that can accelerate a broad range of
  queries, providing similar search capabilities as `arangosearch` Views, but
  defined per collection and simpler to use.

- [**`search-alias` Views**](../../release-notes/version-3.10/whats-new-in-3-10.md#search-alias-views):
  Add inverted indexes to `search-alias` Views for searching multiple collections
  at once, with ranking and search highlighting capabilities, as a lightweight
  alternative to `arangosearch` Views.

- **Persistent indexes**:
  An optional [**In-memory Cache**](../../index-and-search/indexing/working-with-indexes/persistent-indexes.md#caching-of-index-values)
  for faster lookups and [**Stored Values**](../../index-and-search/indexing/working-with-indexes/persistent-indexes.md#storing-additional-values-in-indexes)
  to let persistent indexes cover additional attributes of projections.

- **AQL Graph Traversals**:
  [All Shortest Paths](../../aql/graphs/all-shortest-paths.md) allows you to query
  for all paths of shortest length between two documents.

**Enterprise Edition**

- [**EnterpriseGraphs**](../../graphs/enterprisegraphs/_index.md): A new specialized version of
  SmartGraphs, with an automatic sharding key selection.

- [**Search highlighting**](../../index-and-search/arangosearch/search-highlighting.md):
  Get the substring positions of matched terms, phrases, or _n_-grams.

- [**Nested search**](../../index-and-search/arangosearch/nested-search.md):
  Match arrays of objects with all the conditions met by a single sub-object,
  and define for how many of the elements this must be true.

- **ArangoSearch**:
  New [`minhash` Analyzer](../../index-and-search/analyzers.md#minhash) for locality-sensitive hashing
  to approximate the Jaccard similarity, with inverted index and
  `arangosearch` View support that allows you to implement entity resolution.

- [**Parallelism for sharded graphs**](../../release-notes/version-3.10/whats-new-in-3-10.md#parallelism-for-sharded-graphs-enterprise-edition):
  Parallel execution of AQL traversal queries with many start vertices for all
  types of sharded graphs, leading to faster results.

- [**Traversal Projections**](../../release-notes/version-3.10/whats-new-in-3-10.md#traversal-projections-enterprise-edition): 
  Optimized data loading for AQL traversal queries if only a few document
  attributes are accessed.

- [**Read from followers in clusters**](../../develop/http-api/documents.md#read-from-followers):
  Allow dirty reads so that Coordinators can read from any shard replica and not
  only from the leader, for scaling reads.
  
Also see [What's New in 3.10](../../release-notes/version-3.10/whats-new-in-3-10.md).

## Version 3.9

**All Editions**

- **ArangoSearch**:
  New [**Segmentation Analyzer**](../../index-and-search/analyzers.md#segmentation)
  for language-agnostic tokenization of text.
  A [**Collation Analyzer**](../../index-and-search/analyzers.md#collation)
  to honor the alphabetical order of the specified language in range queries.

**Enterprise Edition**

- [**(Disjoint) SmartGraphs using SatelliteCollections**](../../graphs/smartgraphs/_index.md):
  SatelliteCollections can be used in (Disjoint) SmartGraphs to enable more
  local execution of graph queries.

Also see [What's New in 3.9](../../release-notes/version-3.9/whats-new-in-3-9.md).

## Version 3.8

**All Editions**

- [**Weighted traversals**](../../release-notes/version-3.8/whats-new-in-3-8.md#weighted-traversals)
  and [**k Paths**](../../release-notes/version-3.8/whats-new-in-3-8.md#k-paths):
  Two new AQL graph traversal methods to emit paths in order of increasing
  weights and to enumerate all paths between a source and a target vertex that
  match a given length.

- **ArangoSearch**:
  New [**Pipeline Analyzer**](../../index-and-search/analyzers.md#pipeline)
  that allows you to combine multiple Analyzers, enabling case-insensitive
  _n_-gram-based fuzzy search and more. New
  [**AQL Analyzer**](../../index-and-search/analyzers.md#aql)
  so that you can use an AQL query to pre-process and filter your data for
  indexing. Support for **geo-spatial queries** through new
  [Geo](../../index-and-search/analyzers.md#geojson)
  [Analyzers](../../index-and-search/analyzers.md#geopoint) and
  [ArangoSearch Geo functions](../../aql/functions/arangosearch.md#geo-functions).
  A new [**Stop words Analyzer**](../../index-and-search/analyzers.md#stopwords) that
  can be used standalone or in an Analyzer pipeline.

- A [**`WINDOW` operation**](../../aql/high-level-operations/window.md) for aggregations over
  adjacent rows, value ranges or time windows.

**Enterprise Edition**

- **Encryption at Rest** utilizes
  [hardware acceleration](../../release-notes/version-3.8/whats-new-in-3-8.md#encryption-at-rest)
  capabilities of modern CPUs.

Also see [What's New in 3.8](../../release-notes/version-3.8/whats-new-in-3-8.md).

## Version 3.7

**All Editions**

- **ArangoSearch**:
  [Wildcard](../../aql/functions/arangosearch.md#like) and fuzzy search
  ([Levenshtein distance](../../aql/functions/arangosearch.md#levenshtein_match) and
  [_n_-gram based](../../aql/functions/arangosearch.md#ngram_match)),
  enhanced [phrase and proximity search](../../aql/functions/arangosearch.md#phrase),
  improved late document materialization and
  [Views covering queries](../../release-notes/version-3.7/whats-new-in-3-7.md#covering-indexes)
  using their indexes without touching the storage engine, as well as a new
  SIMD-based index format for faster processing and
  [stemming support](../../release-notes/version-3.7/whats-new-in-3-7.md#stemming-support-for-more-languages)
  for 15 additional languages.

- [**Schema Validation**](../../concepts/data-structure/documents/schema-validation.md):
  Enforce a JSON Schema for documents on collection level. Invalid documents
  can be rejected automatically by the database system, making it easy to
  maintain data quality.

- [**Insert-Update** and **Insert-Ignore**](../../release-notes/version-3.7/whats-new-in-3-7.md#insert-update-and-insert-ignore):
  New document API operations to upsert documents and to efficiently insert
  documents while skipping the creation if the document exists already.

- **AQL**:
  Improved [subquery](../../release-notes/version-3.7/whats-new-in-3-7.md#subquery-optimizations) and
  [graph traversal performance](../../release-notes/version-3.7/whats-new-in-3-7.md#traversal-optimizations),
  among many optimizations and enhancements.

- [**HTTP/2 support**](../../release-notes/version-3.7/whats-new-in-3-7.md#http2-support):
  Better load-balancer and Kubernetes compatibility, improved request throughput.

**Enterprise Edition**

- [**SatelliteGraphs**](../../release-notes/version-3.7/whats-new-in-3-7.md#satellitegraphs):
  Synchronously replicated graphs with local traversal execution.

- [**Disjoint SmartGraphs**](../../release-notes/version-3.7/whats-new-in-3-7.md#disjoint-smartgraphs):
  Improve traversal execution times for SmartGraphs without edges between
  vertices with different SmartGraph attributes.

- [**Traversal parallelization**](../../release-notes/version-3.7/whats-new-in-3-7.md#traversal-parallelization-enterprise-edition):
  Optional parallel execution of nested traversals for single servers and
  OneShard clusters.

- **Security**:
  Added support for multiple
  [JWT Secrets](../../release-notes/version-3.7/whats-new-in-3-7.md#jwt-secret-rotation-enterprise-edition)
  and the ability to hot-reload them from disk,
  [TLS key and certificate rotation](../../release-notes/version-3.7/whats-new-in-3-7.md#tls-key-and-certificate-rotation),
  [Encryption at rest key rotation](../../release-notes/version-3.7/whats-new-in-3-7.md#encryption-at-rest-key-rotation-enterprise-edition)
  and [Server Name Indication (SNI)](../../release-notes/version-3.7/whats-new-in-3-7.md#server-name-indication-enterprise-edition).

Also see [What's New in 3.7](../../release-notes/version-3.7/whats-new-in-3-7.md).

## Version 3.6

**All Editions**

- **AQL**:
  Improved query performance thanks to
  [early pruning](../../release-notes/version-3.6/whats-new-in-3-6.md#early-pruning-of-non-matching-documents),
  [subquery splicing](../../release-notes/version-3.6/whats-new-in-3-6.md#subquery-splicing-optimization),
  [late document materialization](../../release-notes/version-3.6/whats-new-in-3-6.md#late-document-materialization-rocksdb),
  [parallelization](../../release-notes/version-3.6/whats-new-in-3-6.md#parallelization-of-cluster-aql-queries) for certain cluster queries
  and more. New server-side [`maxRuntime`](../../aql/how-to-invoke-aql/with-arangosh.md#maxruntime)
  option for queries.

- **ArangoSearch**:
  New [Analyzer options](../../release-notes/version-3.6/whats-new-in-3-6.md#analyzers) for
  edge _n_-grams (`text` Analyzer), UTF-8 encoded _n_-gram input and optional
  start/end markers (`ngram` Analyzer). Support for
  [dynamic expressions](../../release-notes/version-3.6/whats-new-in-3-6.md#dynamic-search-expressions-with-arrays)
  using arrays (array comparison operators in `SEARCH` queries and the
  `TOKENS()` / `PHRASE()` functions accept arrays). Views can benefit from the
  SmartJoins optimization.

**Enterprise Edition**

- [**OneShard**](../../deploy/oneshard.md)
  deployments offer a practicable solution that enables significant performance
  improvements by massively reducing cluster-internal communication. A database
  created with OneShard enabled is limited to a single DB-Server node but still
  replicated synchronously to ensure resilience. This configuration allows
  running transactions with ACID guarantees on shard leaders.

Also see [What's New in 3.6](../../release-notes/version-3.6/whats-new-in-3-6.md).

## Version 3.5

**All Editions**

- **ArangoSearch**:
  The search and ranking engine received an upgrade and now features
  [Configurable Analyzers](../../index-and-search/analyzers.md),
  [Sorted Views](../../index-and-search/arangosearch/performance.md#primary-sort-order)
  and several improvements to the
  [AQL integration](../../release-notes/version-3.5/whats-new-in-3-5.md#arangosearch).

- **AQL Graph Traversals**:
  [k Shortest Paths](../../aql/graphs/k-shortest-paths.md) allows you to query not
  just for one shortest path between two documents but multiple, sorted by
  length or weight. With [PRUNE](../../aql/graphs/traversals.md#pruning) you can
  stop walking down certain paths early in a graph traversal to improve its
  efficiency.

- [**Stream Transaction API**](../../develop/http-api/transactions/stream-transactions.md):
  Perform multi-document transactions with individual begin and commit / abort
  commands using the new HTTP endpoints or via a supported driver.

- [**Time-to-Live**](../../index-and-search/indexing/basics.md#ttl-time-to-live-index)
  [**Indexes**](../../index-and-search/indexing/working-with-indexes/ttl-indexes.md):
  TTL indexes can be used to automatically remove documents in collections for
  use cases like expiring sessions or automatic purging of statistics or logs.

- [**Index Hints**](../../aql/high-level-operations/for.md#indexhint) &
  [**Named Indexes**](https://www.arangodb.com/learn/development/index-hints-named-indices/):
  Indexes can be given names and an optional AQL inline query option
  `indexHint` was added to override the internal optimizer decision on which
  index to utilize.

- [**Data Masking**](../../components/tools/arangodump/maskings.md):
  arangodump provides a convenient way to extract production data but mask
  critical information that should not be visible.

**Enterprise Edition**

- [**Hot Backups**](../../operations/backup-and-restore.md#hot-backups):
  Create automatic, consistent backups of your cluster without noticeable
  impact on your production systems. In contrast to _arangodump_, hot backups
  are taken on the level of the underlying storage engine and hence both backup
  and restore are considerably faster.

- [**SmartJoins**](../../develop/smartjoins.md):
  Run joins between identically sharded collections with performance close to
  that of a local join operation.

- **Advanced Data Masking**:
  There are additional
  [data masking functions](../../components/tools/arangodump/maskings.md#masking-functions)
  available in the Enterprise Edition, such as for substituting email addresses
  and phone numbers with similar looking pseudo-data.

Also see [What's New in 3.5](../../release-notes/version-3.5/whats-new-in-3-5.md).

## Version 3.4

**All Editions**

- [**ArangoSearch**](../../index-and-search/arangosearch/_index.md):
  Search and similarity ranking engine integrated natively into ArangoDB and
  AQL. ArangoSearch combines Boolean retrieval capabilities with generalized
  ranking algorithms (BM25, TFDIF). Support of e.g. relevance-based searching,
  phrase and prefix-matching, complex boolean searches and query time relevance
  tuning. Search can be combined with all supported data models in a single
  query. Many specialized language Analyzers are already included for e.g.
  English, German, French, Chinese, Spanish and many other language.

- [**GeoJSON Support**](../../aql/functions/geo.md) and
  [**S2 Geo Index**](../../index-and-search/indexing/working-with-indexes/geo-spatial-indexes.md): ArangoDB now supports all geo primitives.
  (Multi-)Point, (Multi-)LineStrings, (Multi-)Polygons or intersections can be
  defined and queried for. The Google S2 geo index is optimized for RocksDB and
  enables efficient querying. Geo query results are automatically visualized
  with an OpenStreetMap integration within the Query Editor of the web interface.

- [**Query Profiler**](../../aql/execution-and-performance/query-profiling.md):
  Enables the analysis of queries and adds additional information for the user
  to identify optimization potentials more easily. The profiler can be accessed
  via _arangosh_ with `db._profileQuery(...)` or via the *Profile* button in the
  Query Editor of the web interface.

- [**Streaming Cursors**](../../aql/how-to-invoke-aql/with-arangosh.md#stream):
  Cursors requested with the stream option on make queries calculate results
  on the fly and make them available for the client in a streaming fashion,
  as soon as possible.

- **RocksDB as Default Storage Engine**: With ArangoDB 3.4 the default
  [storage engine](../../components/arangodb-server/storage-engine.md) for fresh installations will
  switch from MMFiles to RocksDB. Many optimizations have been made to RocksDB
  since the first release in 3.2. For 3.4 we optimized the binary storage
  format for improved insertion, implemented "optional caching", reduced the
  replication catch-up time and much more.

Also see [What's New in 3.4](../../release-notes/version-3.4/whats-new-in-3-4.md).

## Version 3.3

**Enterprise Edition**

- [**Datacenter-to-Datacenter Replication**](../../deploy/arangosync/deployment/_index.md):
  Replicate the entire structure and content of an ArangoDB cluster
  asynchronously to another cluster in a different datacenter with ArangoSync.
  Multi-datacenter support means you can fallback to a replica of your cluster
  in case of a disaster in one datacenter.

- [**Encrypted Backups**](../../components/tools/arangodump/examples.md#encryption):
  _arangodump_ can create backups encrypted with a secret key using AES256
  block cipher.

**All Editions**

- [**Server-level Replication**](../../release-notes/version-3.3/whats-new-in-3-3.md#server-level-replication):
  In addition to per-database replication, there is now an additional
  `globalApplier`. Start the global replication on the Follower once and all
  current and future databases will be replicated from the Leader to the
  Follower automatically.

- [**Asynchronous Failover**](../../release-notes/version-3.3/whats-new-in-3-3.md#asynchronous-failover):
  Make a single server instance resilient with a second server instance, one
  as Leader and the other as asynchronously replicating Follower, with automatic
  failover to the Follower if the Leader goes down.

Also see [What's New in 3.3](../../release-notes/version-3.3/whats-new-in-3-3.md).

## Version 3.2

**All Editions**

- [**RocksDB Storage Engine**](../../components/arangodb-server/storage-engine.md): You can now use
  as much data in ArangoDB as you can fit on your disk. Plus, you can enjoy
  performance boosts on writes by having only document-level locks.

- **Pregel**
  We implemented distributed graph processing with Pregel to discover hidden
  patterns, identify communities and perform in-depth analytics of large graph
  data sets.

- [**Fault-Tolerant Foxx**](../../develop/http-api/foxx.md): The Foxx management
  internals have been rewritten from the ground up to make sure
  multi-coordinator cluster setups always keep their services in sync and
  new Coordinators are fully initialized even when all existing Coordinators
  are unavailable.

**Enterprise Edition**

- **LDAP integration**: Users and permissions
  can be managed from outside ArangoDB with an LDAP server in different
  authentication configurations.

- [**Encryption at Rest**](../../operations/security/encryption-at-rest.md): Let the server
  persist your sensitive data strongly encrypted to protect it even if the
  physical storage medium gets stolen.

- [**SatelliteCollections**](../../develop/satellitecollections.md): Faster join operations when
  working with sharded datasets by synchronously replicating selected
  collections to all DB-Servers in a cluster, so that joins can be
  executed locally.

Also see [What's New in 3.2](../../release-notes/version-3.2/whats-new-in-3-2.md).

## Version 3.1

**All Editions**

- [**Vertex-centric indexes**](../../index-and-search/indexing/working-with-indexes/vertex-centric-indexes.md):
  AQL traversal queries can utilize secondary edge collection
  indexes for better performance against graphs with supernodes.

- [**VelocyPack over HTTP**](https://www.arangodb.com/2016/10/updated-java-drivers-with-arangodb-3-1/):
  In addition to JSON, the binary storage format VelocyPack can now also be
  used in transport over the HTTP protocol.

**Enterprise Edition**

- [**SmartGraphs**](../../graphs/smartgraphs/_index.md): Scale with graphs to a
  cluster and stay performant. With SmartGraphs you can use the "smartness"
  of your application layer to shard your graph efficiently to your machines
  and let traversals run locally.

- **Encryption Control**: Choose your level of [SSL encryption](../../components/arangodb-server/options.md#ssl)

- [**Auditing**](../../operations/security/audit-logging.md): Keep a detailed log
  of all the important things that happened in ArangoDB.

Also see [What's New in 3.1](../../release-notes/version-3.1/whats-new-in-3-1.md).

## Version 3.0

- [**self-organizing cluster**](../../deploy/cluster/_index.md) with
  synchronous replication, master/master setup, shared nothing
  architecture, cluster management Agency.

- Deeply integrated, native [**AQL graph traversal**](../../aql/graphs/_index.md)

- [**VelocyPack**](https://github.com/arangodb/velocypack) as new internal
  binary storage format as well as for intermediate AQL values.

- [**Persistent indexes**](../../index-and-search/indexing/working-with-indexes/persistent-indexes.md) via RocksDB suitable
  for sorting and range queries.

- [**Foxx 3.0**](../../develop/foxx-microservices/_index.md): overhauled JS framework for data-centric
  microservices

- Significantly improved [**Web Interface**](../../components/web-interface/_index.md)

Also see [What's New in 3.0](../../release-notes/version-3.0/whats-new-in-3-0.md).
