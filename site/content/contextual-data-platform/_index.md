---
title: Arango Contextual Data Platform
menuTitle: Arango Contextual Data Platform
weight: 1
description: >-
  The Arango Contextual Data Platform provides entity-aware retrieval,
  graph-based reasoning, temporal state management, and platform-level
  governance to support reliable, stateful agentic AI systems in
  production environments
aliases:
  - /agentic-ai-suite/
  - /platform-suite/
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

{{< cards >}}

{{% card title="Build" link="autograph-studio/" %}}
Turn documents into a Context Graph and answer questions from it with
[AutoGraph Studio](autograph-studio/_index.md), apply machine learning to
graphs with [GraphML](graphml/_index.md), run graph algorithms with
[Graph Analytics](graph-analytics/_index.md), and pick from the
[supported LLM providers and models](llm-models.md).
{{% /card %}}

{{% card title="Query & explore" link="query-editor/" %}}
Write and analyze AQL in the [Query Editor](query-editor.md), explore graphs
visually in the [Graph Visualizer](graph-visualizer.md), generate queries from
[natural language](natural-language-to-aql/_index.md), optimize them with the
[Reasoner](reasoner/_index.md), chat with your data through
[Ada](ada/_index.md), and [translate Cypher to AQL](cypher-to-aql.md).
{{% /card %}}

{{% card title="Develop & extend" link="container-manager/" %}}
Deploy your own services and apps with the
[Container Manager](container-manager/_index.md), manage the files they and the
AI services use with the [File Manager](file-manager/_index.md), and
experiment in [Jupyter notebooks](notebook-servers.md) next to the database.
{{% /card %}}

{{% card title="Deploy & operate" link="install-and-upgrade/" %}}
[Install and upgrade](install-and-upgrade/_index.md) the platform, manage
[licenses](license-management.md), [access control](access-control/_index.md),
and [secrets](secrets-manager.md), run services through the
[Control Plane](control-plane-acp/_index.md), host
[private LLMs](private-llms/_index.md), and [monitor](monitoring.md) the
deployment.
{{% /card %}}

{{% card title="Reference" link="reference/" %}}
The [HTTP APIs](reference.md) of every service, the
[release notes](release-notes/_index.md), the
[API changes](release-notes/api-changes.md), and the
[service versions](release-notes/service-versions.md) each release bundles.
{{% /card %}}

{{< /cards >}}

## Where your data lives

The Arango Contextual Data Platform deploys and integrates multiple services,
but the data itself lives in the ArangoDB core database system. Everything
the platform's AI services produce (knowledge graphs, embeddings, analytics
results, query history) is persisted as collections and documents in
ArangoDB databases, alongside your existing application data.

The exception is raw files (PDFs, images, office documents, and other
binaries) that you upload for AI processing, such as the documents you
feed into AutoGraph.
These are stored in object storage (S3, MinIO, or another blob store) and
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

The Arango Contextual Data Platform is licensed, and its AI services are
licensed on top of it. Pages that require the AI services carry an
**Agentic AI Suite** badge. Licenses are activated and renewed automatically
by the ArangoDB Kubernetes Operator, see
[License Management](license-management.md).

## Sample datasets

If you want to try out the platform's data science features, you may use the
[`arango-datasets` Python package](../ecosystem/arango-datasets.md)
to load sample datasets into a deployment.
