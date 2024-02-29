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

- Supports many cloud deployment regions across the main cloud providers
  (AWS, Azure, GCP)
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
for high availability and resilience. For the highest level of data safety,
you can additionally set up off-site replication for your entire cluster
([Datacenter-to-Datacenter Replication](../../deploy/arangosync/_index.md)).

ArangoDB also integrates with Kubernetes, offering a
[Kubernetes Operator](../../deploy/kubernetes.md) that lets you deploy in your
Kubernetes cluster.

## ArangoDB Editions

### Community Edition

ArangoDB is freely available in a **Community Edition** under the Apache 2.0
open-source license. It is a fully-featured version without time or size
restrictions and includes cluster support.

- Open source under a permissive license
- One database core for all graph, document, key-value, and search needs
- A single composable query language for all data models
- Extensible through microservices with custom REST APIs and user-definable
  query functions
- Cluster deployments for high availability and resilience

See all [Community Edition Features](community-edition.md).

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
| Apache 2.0 License | Commercial License |
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
| Only regular backups | **Datacenter-to-Datacenter Replication** for disaster recovery |
| Only unencrypted backups and basic data masking for backups | **Hot Backups**, **encrypted backups**, and **enhanced data masking** for backups |
