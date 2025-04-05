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
## Feature overview

- One database core for all graph, document, key-value, search, and vector needs
- A single composable query language for all data models
- Cluster deployments for high availability and resilience, with a multi-tenant
  deployment option for the transactional guarantees and performance of a single server
- Performance options to smartly shard and replicate graphs and datasets for
  optimal data locality
- Enhanced data security with on-disk and backup encryption, key rotation,
  audit logging, and incremental backups without downtime

See the full [Feature list of the ArangoDB core database system](core.md).

## On-premises versus Cloud

### Fully managed cloud service

The fully managed multi-cloud
[ArangoGraph Insights Platform](https://dashboard.arangodb.cloud/home?utm_source=docs&utm_medium=cluster_pages&utm_campaign=docs_traffic)
is the easiest and fastest way to get started.
It lets you deploy clusters with just a few clicks, and is operated
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

Up to version 3.12.4, the Community Edition of ArangoDB didn't include
certain query, performance, compliance, and security features. They used to
be exclusive to the Enterprise Edition.

From version 3.12.5 onward, the **Community Edition** includes all
Enterprise Edition features without time restrictions. It is governed by the
[ArangoDB Community License](https://arangodb.com/community-license). <!-- TODO: Link to new terms -->
You can download the extensively tested prepackaged binaries and official
Docker images for free.
The use for commercial purposes and distribution is prohibited for production,
but development and testing is allowed without a license even for commercial use.
The dataset size is limited to a 100 GB. If you exceed the size limit, you get
warnings for two days and can bring the deployment back below 100 GB. If you don't,
then the deployment enters read-only mode for two days and then shuts down.

The **Enterprise Edition** is an ArangoDB deployment with an activated license.
It allows you to use ArangoDB for commercial purposes and removes the 100 GB
dataset size limit of the Community Edition.

The source code of ArangoDB is available under the
[Business Source License 1.1 (BUSL-1.1)](https://github.com/arangodb/arangodb/blob/devel/LICENSE),
excluding the source code of the formerly exclusive Enterprise Edition features.
Copying, modification, redistribution, non-commercial use, and commercial use in
a non-production context are always allowed. Additionally, you can deploy
BUSL-licensed ArangoDB source code for any purpose (including production) as
long as you are not creating a commercial derivative work or offering, or are
including it in a commercial product, application, or service. On the fourth
anniversary of the first publicly available distribution of a specific version,
the license changes to the permissive Apache 2.0 open-source license.
