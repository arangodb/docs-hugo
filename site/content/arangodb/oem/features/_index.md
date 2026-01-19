---
title: Features and Capabilities
menuTitle: Features
weight: 10
description: >-
  ArangoDB is a graph database with a powerful set of features for data management and analytics,
  supported by a rich ecosystem of integrations and drivers
aliases:
  - ../operations/installation/compiling # 3.11 -> OEM
  - ../operations/installation/compiling/compile-on-debian # 3.11 -> OEM
  - ../operations/installation/compiling/compile-on-windows # 3.11 -> OEM
  - ../operations/installation/compiling/recompiling-jemalloc # 3.11 -> OEM
  - ../operations/installation/compiling/running-custom-build # 3.11 -> OEM
---
## Feature overview

- Long-term support (LTS) for the Linux and Windows Enterprise Edition of
  ArangoDB version 3.11
- One database core for all graph, document, key-value, search, and vector needs
- A single composable query language for all data models
- Cluster deployments for high availability and resilience, with a multi-tenant
  deployment option for the transactional guarantees and performance of a single server
- Performance options to smartly shard and replicate graphs and datasets for
  optimal data locality
- Enhanced data security with on-disk and backup encryption, key rotation,
  audit logging, and incremental backups without downtime

See the full [Feature list of the ArangoDB database system](list.md).

## OEM / Embedded Version

The OEM / Embedded version is for independent software vendors (ISVs) and
SaaS companies who want to embed ArangoDB into their products and distribute it
at scale.

The OEM / Embedded version has special long-term lifecycle support. It is based
on ArangoDB version 3.11.14, which receives hotfixes to address important issues
like security patches.

For more information, [Request a quote](https://arango.ai/request-pricing).

## On-premises versus Cloud

### Fully managed cloud service

The fully managed multi-cloud
[Arango Managed Platform (AMP)](https://dashboard.arangodb.cloud/home?utm_source=docs&utm_medium=cluster_pages&utm_campaign=docs_traffic) does not support the OEM / Embedded version of
ArangoDB.

### Self-managed in the cloud

ArangoDB can be self-deployed on AWS or other cloud platforms. However, when
using a self-managed deployment, you take full control of managing the resources
needed to run it in the cloud. This involves tasks such as configuring,
provisioning, and monitoring the system. For more details, see
[self-deploying ArangoDB in the cloud](../deploy/in-the-cloud.md).

ArangoDB supports Kubernetes through its official
[Kubernetes Operator](../deploy/kubernetes.md) that allows you to easily
deploy and manage clusters within a Kubernetes environment.

### On-premises

Running ArangoDB on-premises means that ArangoDB is installed locally, on your
organization's computers and servers, and involves managing all the necessary
resources within the organization's environment, rather than using external
services.

You can install ArangoDB locally by downloading and running the
[official packages](https://arango.ai/downloads/) or run it using
[Docker images](../operations/installation/docker.md).

You can deploy it on-premises as a
[single server](../deploy/single-instance/_index.md)
or as a [cluster](../deploy/cluster/_index.md)
comprised of multiple nodes with synchronous replication and automatic failover
for high availability and resilience.

ArangoDB also integrates with Kubernetes, offering a
[Kubernetes Operator](../deploy/kubernetes.md) that lets you deploy in your
Kubernetes cluster.

## ArangoDB Editions

While ArangoDB version 3.11 is available in a **Community Edition**, the
OEM / Embedded version is limited to the Enterprise Edition.

The commercial version of ArangoDB is called the **Enterprise Edition**.
It includes additional features for performance and security, such as for
scaling graphs and managing your data safely.

- Includes all Community Edition features
- Performance options to smartly shard and replicate graphs and datasets for
  optimal data locality
- Multi-tenant deployment option for the transactional guarantees and
  performance of a single server
- Enhanced data security with on-disk and backup encryption, key rotation,
  audit logging, and LDAP authentication
- Incremental backups without downtime and off-site replication
