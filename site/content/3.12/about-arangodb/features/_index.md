---
title: Features and Capabilities
menuTitle: Features
weight: 20
description: >-
  ArangoDB is a graph database with a powerful set of features for data management and analytics,
  supported by a rich ecosystem of integrations and drivers
aliases:
  - ../introduction/features
---
## On-premises versus Cloud

### Fully managed cloud service

The fully managed multi-cloud
[ArangoGraph Insights Platform](https://dashboard.arangodb.cloud/home?utm_source=docs&utm_medium=cluster_pages&utm_campaign=docs_traffic)
is the easiest and fastest way to get started. It runs the Enterprise Edition
of ArangoDB, lets you deploy clusters with just a few clicks, and is operated
by a dedicated team of ArangoDB engineers day and night. You can choose from a
variety of support plans to meet your needs.

- Supports many of the AWS and GCP cloud deployment regions
- High availability featuring multi-region zone clusters, managed backups,
  and zero-downtime upgrades
- Integrated monitoring, alerting, and log management
- Highly secure with encryption at transit and at rest
- Includes elastic scalability for all deployment models (OneShard and Sharded clusters)

To learn more, go to the [ArangoGraph documentation](../../arangograph/_index.md). 

### Self-managed in the cloud

ArangoDB can be self-deployed on AWS or other cloud platforms, too. However, when
using a self-managed deployment, you take full control of managing the resources
needed to run it in the cloud. This involves tasks such as configuring,
provisioning, and monitoring the system. For more details, see
[self-deploying ArangoDB in the cloud](../../deploy/in-the-cloud.md).

ArangoDB supports Kubernetes through its official
[Kubernetes Operator](../../deploy/kubernetes.md) that allows you to easily
deploy and manage clusters within a Kubernetes environment.

### On-premises

Running ArangoDB on-premises means that ArangoDB is installed locally, on your
organization's computers and servers, and involves managing all the necessary
resources within the organization's environment, rather than using external
services.

You can install ArangoDB locally by downloading and running the
[official packages](https://arangodb.com/download/) or run it using
[Docker images](../../operations/installation/docker.md).

You can deploy it on-premises as a
[single server](../../deploy/single-instance/_index.md)
or as a [cluster](../../deploy/cluster/_index.md)
comprised of multiple nodes with synchronous replication and automatic failover
for high availability and resilience.

ArangoDB also integrates with Kubernetes, offering a
[Kubernetes Operator](../../deploy/kubernetes.md) that lets you deploy in your
Kubernetes cluster.

## ArangoDB Editions

### Community Edition

ArangoDB is available in a **Community Edition** governed by the
[ArangoDB Community License](https://arangodb.com/2024/02/update-evolving-arangodbs-licensing-model-for-a-sustainable-future/).
You can download the extensively tested prepackaged binaries and official
Docker images for free.

- One database core for all graph, document, key-value, and search needs
- A single composable query language for all data models
- Extensible through microservices with custom REST APIs and user-definable
  query functions
- Cluster deployments for high availability and resilience

See all [Community Edition Features](community-edition.md).

The Community Edition is a fully-featured version without time
restrictions and includes cluster support. The use for commercial purposes is
limited to a 100 GB on dataset size in production within a single cluster and a
maximum of three clusters.

The source code of the Community Edition is available under the
[Business Source License 1.1 (BUSL-1.1)](https://github.com/arangodb/arangodb/blob/devel/LICENSE).
Copying, modification, redistribution, non-commercial use, and commercial use in
a non-production context are always allowed. Additionally, you can deploy
BUSL-licensed ArangoDB source code for any purpose (including production) as
long as you are not creating a commercial derivative work or offering, or are
including it in a commercial product, application, or service. On the fourth
anniversary of the first publicly available distribution of a specific version,
the license changes to the permissive Apache 2.0 open-source license.

### Enterprise Edition

ArangoDB is also available in a commercial version, called the
**Enterprise Edition**. It includes additional features for performance and
security, such as for scaling graphs and managing your data safely.

- Includes all Community Edition features
- Performance options to smartly shard and replicate graphs and datasets for
  optimal data locality
- Multi-tenant deployment option for the transactional guarantees and
  performance of a single server
- Enhanced data security with on-disk and backup encryption, key rotation,
  and audit logging
- Incremental backups without downtime and off-site replication

See all [Enterprise Edition Features](enterprise-edition.md).

### Differences between the Editions

| Community Edition | Enterprise Edition |
|-------------------|--------------------|
| ArangoDB Community License for prepackaged binaries and Docker images, BUSL-1.1 for the source code | Commercial License |
| Sharding using consistent hashing on the default or custom shard keys | In addition, **smart sharding** for improved data locality |
| Only hash-based graph sharding | **SmartGraphs** to intelligently shard large graph datasets and **EnterpriseGraphs** with an automatic sharding key selection |
| Only regular collection replication without data locality optimizations | **SatelliteCollections** to replicate collections on all cluster nodes and data locality optimizations for queries |
| No optimizations when querying sharded graphs and replicated collections together | **SmartGraphs using SatelliteCollections** to enable more local execution of graph queries |
| Only regular graph replication without local execution optimizations | **SatelliteGraphs** to execute graph traversals locally on a cluster node |
| Collections can be sharded alike but joins do not utilize co-location | **SmartJoins** for co-located joins in a cluster using identically sharded collections |
| Graph traversals without parallel execution | **Parallel execution of traversal queries** with many start vertices |
| Graph traversals always load full documents | **Traversal projections** optimize the data loading of AQL traversal queries if only a few document attributes are accessed |
| Inverted indexes and Views without support for search highlighting and nested search | **Search highlighting** for getting the substring positions of matches and **nested search** for matching arrays with all the conditions met by a single object |
| Only standard Jaccard index calculation | **Jaccard similarity approximation** with MinHash for entity resolution, such as for finding duplicate records, based on how many common elements they have |{{% comment %}} Experimental feature
| No fastText model support | Classification of text tokens and finding similar tokens using supervised **fastText word embedding models** |
{{% /comment %}}
| Only regular cluster deployments | **OneShard** deployment option to store all collections of a database on a single cluster node, to combine the performance of a single server and ACID semantics with a fault-tolerant cluster setup |
| ACID transactions for multi-document / multi-collection queries on single servers, for single document operations in clusters, and for multi-document queries in clusters for collections with a single shard | In addition, ACID transactions for multi-collection queries using the OneShard feature |
| Always read from leader shards in clusters | Optionally allow dirty reads to **read from followers** to scale reads |
| TLS key and certificate rotation | In addition, **key rotation for JWT secrets** and **server name indication** (SNI) |
| Only server logs | **Audit log** of server interactions |
| No on-disk encryption | **Encryption at Rest** with hardware-accelerated on-disk encryption and key rotation |
| Only unencrypted backups and basic data masking for backups | **Hot Backups**, **encrypted backups**, and **enhanced data masking** for backups |
