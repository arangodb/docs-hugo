---
title: Arango Contextual Data Platform
menuTitle: Arango Contextual Data Platform
weight: 2
description: >-
  The Arango Contextual Data Platform provides entity-aware retrieval,
  graph-based reasoning, temporal state management, and platform-level
  governance to support reliable, stateful agentic AI systems in
  production environments
aliases:
  - /arangodb/3.12/data-science/ # 3.10, 3.11
  - /arangodb/stable/data-science/ # 3.10, 3.11
  - /arangodb/4.x/data-science/ # 3.10, 3.11
  - /arangodb/devel/data-science/ # 3.10, 3.11
---
The Arango Contextual Data Platform brings everything Arango offers together
in a single solution that you can deploy and self-manage on-premises or in the
cloud, or use as a managed service - [Arango Managed Platform (AMP)](../amp/_index.md).
It is built on a modern, cloud-native foundation designed for enterprise
scalability and reliability.

To install the platform and run your first graph-powered questions, see
[Get started with the Contextual Data Platform](../get-started/contextual-data-platform/_index.md).

## Architecture

The Arango Contextual Data Platform is a layered architecture that combines
powerful components into a unified solution. The
[ArangoDB](../arangodb/_index.md) multi-model database system is the foundation
for it all. On top of it, the platform runs the services for working with your
data and operating the deployment, and the AI services that turn documents
into context for agents and copilots.

{{< embed-svg "Arango-Contextual-Data-Platform-Overview" >}}

The Contextual Data Platform is a [**Kubernetes-native**](architecture.md)
technical infrastructure that acts as the umbrella for hosting the entire Arango
offering of products. Built from the ground up for cloud-native orchestration,
the platform leverages the power of Kubernetes to make it easy to deploy, scale,
and operate the core ArangoDB database system along with additional services and
AI solutions for graph-based retrieval-augmented generation (GraphRAG), graph
machine learning, data explorations, and more. You can run it on-premises or in
the cloud yourself on top of Kubernetes to access all of the platform features
with enterprise-grade automation and reliability. The official ArangoDB
Kubernetes Operator (`kube-arangodb`) is leveraged to deliver enterprise-grade
database management, automation, scalability, high availability, and
operational excellence. Read more about the platform's
[Kubernetes-native architecture](architecture.md).

## What you can do

| Goal | Start here |
|:-----|:-----------|
| **Install** the data platform | [Install & Upgrade](install-and-upgrade/_index.md), [License Management](license-management.md) |
| **Build** a Context Graph from your documents and ask questions | [AutoGraph](autograph/_index.md), [AutoRAG](autorag/_index.md) |
| **Query & explore** your data in the web interface | [Query Editor](query-editor.md), [Graph Visualizer](graph-visualizer.md) |
| **Integrate** the services into your applications | [API references](reference.md) |

## Where your data lives

The Arango Contextual Data Platform deploys and integrates multiple services,
but the data itself lives in the ArangoDB core database system. Everything
the platform's AI services produce (knowledge graphs, embeddings, analytics
results, query history) is persisted as collections and documents in
ArangoDB databases, alongside your existing application data.

The exception is raw files (PDFs, images, Office documents, and other
binaries) that you upload for AI processing, such as the documents you
feed into AutoGraph.
These are stored in object storage (S3, MinIO, or another object store) and
managed through the
[File Manager](file-manager/_index.md) service. The same
File Manager also holds the code packages uploaded through the Container
Manager's
[Bring Your Own Code](container-manager/_index.md#bring-your-own-code)
flow, so its contents are not exclusive to the AI services.
Any structured data extracted from uploaded files
(entities, relationships, embeddings) is written back into ArangoDB.

## Deployment options

### Use the Arango Contextual Data Platform as a managed service

You can request the Arango Contextual Data Platform as a managed service for the
[Arango Managed Platform (AMP)](../amp/_index.md).

[Get in touch](https://arango.ai/contact-us/) with the Arango team to learn more.

### Self-host the Arango Contextual Data Platform

You can set up and run the Arango Contextual Data Platform on-premises or in
the cloud and manage this deployment yourself.

For a guide on how to set up the Contextual Data Platform yourself, see
[Install and upgrade the Arango Contextual Data Platform](install-and-upgrade/_index.md).

{{< info >}}
**Kubernetes-Native**: The Arango Contextual Data Platform is built specifically
for Kubernetes environments and relies on the official
[ArangoDB Kubernetes Operator](https://arangodb.github.io/kube-arangodb/)
to provide automated deployment, scaling, and management capabilities.
{{< /info >}}

## Licensing

The Arango Contextual Data Platform is licensed as two suites:

- {{< tag "Platform Suite" >}} Always included.

- {{< tag "Agentic AI Suite" >}} Licensed on top of the Platform Suite.

See [Features and licensing](features-and-licensing.md) for what each
includes. Every page carries a badge with the suite it belongs to.
Licenses are activated and renewed automatically by the ArangoDB Kubernetes
Operator, see [License Management](license-management.md).

## Tutorials

To try out the data platform, follow the tutorials:

- [Tutorial 1: Install and try it out](../get-started/contextual-data-platform/quickstart/_index.md)
- [Tutorial 2: From documents to answers](../get-started/contextual-data-platform/build-with-autograph.md)
