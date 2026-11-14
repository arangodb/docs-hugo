---
title: Deployment modes
menuTitle: Deployment modes
weight: 410
group: Deploy
description: >-
  ArangoDB supports multiple deployment modes to meet the exact needs of your
  project for resilience and performance
---
For installation instructions, please refer to the
[Installation](../installation/_index.md) chapter.

For _production_ deployments, please also carefully check the
[ArangoDB Production Checklist](../production-checklist.md).

## Deployment Modes

ArangoDB can be deployed in different configurations, depending on your needs.

### Single Instance

A [Single Instance deployment](single-instance.md) is the most simple way
to get started. Unlike other setups, which require some specific procedures,
deploying a stand-alone instance is straightforward and can be started manually
or by using the ArangoDB Starter tool.

### Cluster

[Cluster deployments](cluster/_index.md) are designed for large scale
operations and analytics, allowing you to scale elastically with your
applications and data models. ArangoDB's synchronously-replicating cluster
technology runs on premises, on Kubernetes, and in the cloud on the
[Arango Managed Platform (AMP)](https://dashboard.arangodb.cloud/home) - Arango's fully managed service.

Clustering ArangoDB not only delivers better performance and capacity improvements,
but it also provides resilience through replication and automatic failover.
You can deploy systems that dynamically scale up and down according to demand.

### OneShard

[OneShard deployments](oneshard.md) are cluster deployments but with the data of
each database restricted to a single shard. This allows queries to run locally
on a single DB-Server node for better performance and with transactional
guarantees similar to a single server deployment. OneShard is primarily intended
for multi-tenant use cases.

### Arango Contextual Data Platform

The Arango Contextual Data Platform is the umbrella for deploying and operating
the entire Arango product offering with a unified interface in a Kubernetes cluster.
It is offered for self-hosting on-prem or in the cloud and as a managed service,
superseding the Arango Managed Platform (AMP).

See [The Arango Contextual Data Platform](../../../contextual-data-platform/_index.md)
for details.

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
[Arango Managed Platform (AMP)](https://dashboard.arangodb.cloud/home)
offers a fully managed cloud service, available on AWS and GCP.

### Manual Deployment

**Single Instance:**

- [Manually created processes](../manual-deployment/single-instance.md)
- [Manually created Docker containers](../manual-deployment/single-instance.md#manual-start-in-docker)

**Cluster:**

- [Manually created processes](../manual-deployment/cluster.md)
- [Manually created Docker containers](../manual-deployment/cluster.md#manual-start-in-docker)

### Deploying using the ArangoDB Starter

Setting up an ArangoDB cluster, for example, involves starting various nodes
with different roles (Agents, DB-Servers, and Coordinators). The starter
simplifies this process.

The Starter supports different deployment modes (single server and cluster) and
it can either use Docker containers or processes (using the _arangod_ executable).

Besides starting and maintaining ArangoDB deployments, the Starter also provides
various commands to create TLS certificates and JWT token secrets to secure your
ArangoDB deployments.

The ArangoDB Starter is an executable called `arangodb` and comes with all
current distributions of ArangoDB.

If you want a specific version, download the precompiled executable via the
[GitHub releases page](https://github.com/arangodb-helper/arangodb/releases).

**Single Instance:**

- [_Starter_ using processes](../arangodb-starter/single-instance.md)
- [_Starter_ using Docker containers](../arangodb-starter/single-instance.md#using-the-arangodb-starter-in-docker)

**Cluster:**

- [_Starter_ using processes](../arangodb-starter/cluster.md)
- [_Starter_ using Docker containers](../arangodb-starter/cluster.md#using-the-arangodb-starter-in-docker)

### Run in the cloud

- [AWS and Azure](../cloud-providers.md)
- [Arango Managed Platform (AMP)](https://dashboard.arangodb.cloud/home),
  fully managed, available on AWS and GCP

### Run in Kubernetes

- [ArangoDB Kubernetes Operator](../kubernetes.md)
