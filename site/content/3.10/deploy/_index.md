---
title: Deploy ArangoDB
menuTitle: Deploy
weight: 185
description: >-
  ArangoDB supports multiple deployment modes to meet the exact needs of your
  project for resilience and performance
---
For installation instructions, please refer to the
[Installation](../operations/installation/_index.md) chapter.

For _production_ deployments, please also carefully check the
[ArangoDB Production Checklist](production-checklist.md).

## Deployment Modes

ArangoDB can be deployed in different configurations, depending on your needs.

### Single Instance

A [Single Instance deployment](single-instance/_index.md) is the most simple way
to get started. Unlike other setups, which require some specific procedures,
deploying a stand-alone instance is straightforward and can be started manually
or by using the ArangoDB Starter tool.

### Active Failover

[Active Failover deployments](active-failover/_index.md) use ArangoDB's
multi-node technology to provide high availability for smaller projects with
fast asynchronous replication from the leading node to multiple replicas.
If the leader fails, then a follower takes over seamlessly.

### Cluster

[Cluster deployments](cluster/_index.md) are designed for large scale
operations and analytics, allowing you to scale elastically with your
applications and data models. ArangoDB's synchronously-replicating cluster
technology runs on premises, on Kubernetes, and in the cloud on
[ArangoGraph](https://dashboard.arangodb.cloud/home?utm_source=docs&utm_medium=cluster_pages&utm_campaign=docs_traffic) - ArangoDB's fully managed service.

Clustering ArangoDB not only delivers better performance and capacity improvements,
but it also provides resilience through replication and automatic failover.
You can deploy systems that dynamically scale up and down according to demand.

### OneShard

{{< tag "ArangoDB Enterprise Edition" "ArangoGraph" >}}

[OneShard deployments](oneshard.md) are cluster deployments but with the data of
each database restricted to a single shard. This allows queries to run locally
on a single DB-Server node for better performance and with transactional
guarantees similar to a single server deployment. OneShard is primarily intended
for multi-tenant use cases.

### Datacenter-to-Datacenter

{{< tag "ArangoDB Enterprise Edition" >}}

For cluster deployments, ArangoDB supports
[Datacenter-to-Datacenter Replication](arangosync/_index.md) (DC2DC). You can
use it as an additional security feature to replicate your entire cluster
off-site to another datacenter. The leading datacenter asynchronously replicates
the data and configuration to the other datacenter for disaster recovery.

## How to deploy

There are different ways to set up and operate ArangoDB.

- You can start all the needed server processes manually, locally or on different
  machines, bare-metal or in Docker containers. This gives you the most control
  but you also need to manually deal with upgrades, outages, and so on.

- You can use the ArangoDB _Starter_ (the _arangodb_ executable) to mostly
  automatically create and keep deployments running, either bare-metal or in
  Docker containers.

- If you want to deploy in your Kubernetes cluster, you can use the
  ArangoDB Kubernetes Operator (`kube-arangodb`).

The fastest way to get ArangoDB up and running is to run it in the cloud - the
[ArangoGraph Platform](https://dashboard.arangodb.cloud/home?utm_source=docs&utm_medium=cluster_pages&utm_campaign=docs_traffic) offers a fully managed
cloud service, available on AWS, Microsoft Azure, and Google Cloud Platform.

### Manual Deployment

**Single Instance:**

- [Manually created processes](single-instance/manual-start.md)
- [Manually created Docker containers](single-instance/manual-start.md#manual-start-in-docker)

**Active Failover:**

- [Manually created processes](active-failover/manual-start.md)
- [Manually created Docker containers](active-failover/manual-start.md#manual-start-in-docker)

**Cluster:**

- [Manually created processes](cluster/deployment/manual-start.md)
- [Manually created Docker containers](cluster/deployment/manual-start.md#manual-start-in-docker)

### Deploying using the ArangoDB Starter

Setting up an ArangoDB cluster, for example, involves starting various nodes
with different roles (Agents, DB-Servers, and Coordinators). The starter
simplifies this process.

The Starter supports different deployment modes (single server, Active Failover,
cluster) and it can either use Docker containers or processes (using the
`arangod` executable).

Besides starting and maintaining ArangoDB deployments, the Starter also provides
various commands to create TLS certificates and JWT token secrets to secure your
ArangoDB deployments.

The ArangoDB Starter is an executable called `arangodb` and comes with all
current distributions of ArangoDB.

If you want a specific version, download the precompiled executable via the
[GitHub releases page](https://github.com/arangodb-helper/arangodb/releases).

**Single Instance:**

- [_Starter_ using processes](single-instance/using-the-arangodb-starter.md)
- [_Starter_ using Docker containers](single-instance/using-the-arangodb-starter.md#using-the-arangodb-starter-in-docker)

**Active Failover:**

- [_Starter_ using processes](active-failover/using-the-arangodb-starter.md)
- [_Starter_ using Docker containers](active-failover/using-the-arangodb-starter.md#using-the-arangodb-starter-in-docker)

**Cluster:**

- [_Starter_ using processes](cluster/deployment/using-the-arangodb-starter.md)
- [_Starter_ using Docker containers](cluster/deployment/using-the-arangodb-starter.md#using-the-arangodb-starter-in-docker)

### Run in the cloud

- [AWS and Azure](in-the-cloud.md)
- [ArangoGraph Insights Platform](https://dashboard.arangodb.cloud/home?utm_source=docs&utm_medium=cluster_pages&utm_campaign=docs_traffic),
  fully managed, available on AWS, Azure & GCP

### Run in Kubernetes

- [ArangoDB Kubernetes Operator](kubernetes.md)
