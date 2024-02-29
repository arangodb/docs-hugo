---
title: Enterprise Edition Features
menuTitle: Enterprise Edition
weight: 10
description: >-
  The commercial version of ArangoDB offers performance, compliance, and
  security features for larger or more sensitive datasets, as well as additional
  query capabilities
aliases:
  - ../../introduction/features/enterprise-edition
---
The Enterprise Edition has all the features of the
[Community Edition](community-edition.md) and, on top of that, the
features outlined below. For additional information, see
[arangodb.com/enterprise-server/](https://www.arangodb.com/enterprise-server/).

## Performance

- [**SmartGraphs**](../../graphs/smartgraphs/_index.md):
  Value-based sharding of large graph datasets for better data locality when
  traversing graphs.

- [**EnterpriseGraphs**](../../graphs/enterprisegraphs/_index.md):
  A specialized version of SmartGraphs, with an automatic sharding key selection.

- [**SmartGraphs using SatelliteCollections**](../../graphs/smartgraphs/_index.md):
  Collections replicated on all cluster nodes can be combined with graphs
  sharded by document attributes to enable more local execution of graph queries.

- [**SatelliteGraphs**](../../graphs/satellitegraphs/_index.md):
  Graphs replicated on all cluster nodes to execute graph traversals locally.

- [**SatelliteCollections**](../../develop/satellitecollections.md):
  Collections replicated on all cluster nodes to execute joins with sharded
  data locally.

- [**SmartJoins**](../../develop/smartjoins.md):
  Co-located joins in a cluster using identically sharded collections.

- [**OneShard**](../../deploy/oneshard.md):
  Option to store all collections of a database on a single cluster node, to
  combine the performance of a single server and ACID semantics with a
  fault-tolerant cluster setup.

- [**Traversal**](../../release-notes/version-3.7/whats-new-in-3-7.md#traversal-parallelization-enterprise-edition)
  [**Parallelization**](../../release-notes/version-3.10/whats-new-in-3-10.md#parallelism-for-sharded-graphs-enterprise-edition):
  Parallel execution of traversal queries with many start vertices, leading to
  faster results.

- [**Traversal Projections**](../../release-notes/version-3.10/whats-new-in-3-10.md#traversal-projections-enterprise-edition):
  Optimized data loading for AQL traversal queries if only a few document
  attributes are accessed.

- [**Parallel index creation**](../../release-notes/version-3.10/whats-new-in-3-10.md#parallel-index-creation-enterprise-edition):
  Non-unique indexes can be created with multiple threads in parallel.

- [**`minhash` Analyzer**](../../index-and-search/analyzers.md#minhash):
  Jaccard similarity approximation for entity resolution, such as for finding
  duplicate records, based on how many elements they have in common

- [**`geo_s2` Analyzer**](../../index-and-search/analyzers.md#geo_s2):
  Efficiently index geo-spatial data using different binary formats, tuning the
  size on disk, the precision, and query performance.

- [**ArangoSearch column cache**](../../release-notes/version-3.10/whats-new-in-3-10.md#arangosearch-column-cache-enterprise-edition):
  Always cache field normalization values, Geo Analyzer auxiliary data,
  stored values, primary sort columns, and primary key columns in memory to
  improve the performance of Views and inverted indexes.

- [**ArangoSearch WAND optimization**](../../index-and-search/arangosearch/performance.md#wand-optimization):
  Retrieve search results for the highest-ranking matches from Views faster by
  defining a list of sort expressions to optimize.

- [**Read from followers in clusters**](../../develop/http-api/documents.md#read-from-followers):
  Allow dirty reads so that Coordinators can read from any shard replica and not
  only from the leader, for scaling reads.

## Querying

- [**Search highlighting**](../../index-and-search/arangosearch/search-highlighting.md):
  Get the substring positions of matched terms, phrases, or _n_-grams.

- [**Nested search**](../../index-and-search/arangosearch/nested-search.md):
  Match arrays of objects with all the conditions met by a single sub-object,
  and define for how many of the elements this must be true.

{{% comment %}} Experimental feature
- **[`classification`](../../index-and-search/analyzers.md#classification) and [`nearest_neighbors` Analyzers](../../index-and-search/analyzers.md#nearest_neighbors)**:
  Classification of text tokens and finding similar tokens using supervised
  fastText word embedding models.
{{% /comment %}}

- [**Skip inaccessible collections**](../../aql/how-to-invoke-aql/with-arangosh.md#skipinaccessiblecollections):
  Let AQL queries like graph traversals pretend that collections are empty if
  the user has no access to them instead of failing the query.

## Security

- [**Auditing**](../../operations/security/audit-logging.md):
  Audit logs of all server interactions.

- [**Encryption at Rest**](../../operations/security/encryption-at-rest.md):
  Hardware-accelerated on-disk encryption for your data.

- [**Encrypted Backups**](../../components/tools/arangodump/examples.md#encryption):
  Data dumps can be encrypted using a strong 256-bit AES block cipher.

- [**Hot Backups**](../../operations/backup-and-restore.md#hot-backups):
  Consistent, incremental data backups without downtime for single servers and clusters.

- [**Enhanced Data Masking**](../../components/tools/arangodump/maskings.md#masking-functions):
  Extended data masking capabilities for attributes containing sensitive data
  / PII when creating backups.

- **Advanced Encryption and Security Configuration**:
  Key rotation for [JWT secrets](../../develop/http-api/authentication.md#hot-reload-jwt-secrets)
  and [on-disk encryption](../../develop/http-api/security.md#encryption-at-rest),
  as well as [Server Name Indication (SNI)](../../components/arangodb-server/options.md#--sslserver-name-indication).
