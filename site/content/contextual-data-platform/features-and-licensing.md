---
title: Features and licensing
menuTitle: Features and licensing
group: Overview
weight: 10
description: >-
  The two suites the Arango Contextual Data Platform is licensed as, and
  which services and features each of them includes
---
The Arango Contextual Data Platform is licensed as two suites. The
**Platform Suite** is always included and provides the services for working
with your data and operating the deployment. The **Agentic AI Suite** is the
optional capability layer on top, licensed separately, and adds the AI
services that turn documents into context for agents and copilots.

The documentation is organized by what you want to do, not by suite. To see
which suite a page belongs to, look at the badge below its headline, which
reads **Platform Suite** or **Agentic AI Suite**. Pages without a badge, such
as the installation guide, apply to the platform as a whole.

{{< embed-svg "Contextual-Data-Platform-Suites" "The three layers of the Arango Contextual Data Platform and how they are licensed." >}}

## What's included in the Platform Suite

- [**ArangoDB Enterprise Edition**](../arangodb/_index.md):
  The multi-model database foundation supporting graphs, documents, key-value,
  vector search, and full-text search capabilities.

- [**Graph Visualizer**](graph-visualizer.md):
  A sophisticated web-based interface for graph exploration, smart search, and
  visual layouts.

- [**Query Editor**](query-editor.md):
  Write, run, and analyze AQL queries using an IDE-like interface with tabs,
  result history, query management, and more.

- [**Container Manager**](container-manager/_index.md):
  Deploy and manage custom services using your own code packages or container images.

- [**File Manager**](file-manager/_index.md):
  View and manage the files that your services and the AI services use.

- [**Secrets Manager**](secrets-manager.md):
  Store secrets like API keys for use across the platform.

- [**Cypher to AQL Translation Service**](cypher-to-aql.md) (experimental):
  Translate Cypher queries to AQL.

- [**Arango Control Plane**](control-plane-acp/_index.md):
  Install, manage, and run services in the Contextual Data Platform with the
  Arango Control Plane (ACP).

- [**Monitoring**](monitoring.md):
  Grafana and Prometheus dashboards for the deployment.

## What's included in the Agentic AI Suite

The Agentic AI Suite is composed of the following major components:

- [**Ada**](ada/_index.md): The AI digital assistant, for natural language interaction and development.
- [**AutoGraph and AutoRAG**](autograph/_index.md): **AutoGraph** organizes
  enterprise data into a **Context Graph**, assigning each domain the right
  processing depth. **AutoRAG** is the retrieval layer on top: it deploys the
  retrievers that answer questions from that Context Graph. Both stages are
  driven from the **AutoGraph Studio** view of the web interface. See
  [GraphRAG Concepts](autograph/concepts.md) for the approach behind them.
- [**Natural Language to AQL/AQLizer**](natural-language-to-aql/_index.md): Generate AQL
  queries from natural language to explore your data and gain insights without having
  to learn the query language first.
- [**Reasoner**](reasoner/_index.md): Automatically analyze and optimize AQL queries
  using AI-powered reasoning, with validated performance improvements.
- [**GraphML**](graphml/_index.md): Apply machine learning to graphs for link prediction,
  classification, and computing embeddings.
- [**Graph Analytics**](graph-analytics/_index.md):
  Run graph algorithms such as PageRank on dedicated compute resources to
  discover influential nodes and patterns.

Most components have an intuitive graphical user interface integrated into the
Arango Contextual Data Platform web interface, guiding you through the process.
In the left-hand sidebar, **Agentic AI Suite** groups **AutoGraph Studio**,
**Graph Analytics**, and **GraphML**.

Alongside these components, you also get the following additional features:

- [**Jupyter notebooks**](notebook-servers.md): Run a Jupyter kernel in the
  Contextual Data Platform for hosting interactive notebooks for experimentation and
  development of applications that use ArangoDB as their backend.
- **LLM support**: Use large language models (LLMs) through OpenAI-compatible
  APIs. See [Supported LLM providers and models](llm-models.md).
- **Application Programming Interfaces (APIs)**: Use the underlying APIs of the
  Agentic AI Suite and build your own integrations. See the
  [API references](reference.md) for details.

## Licensing

- {{< tag "Platform Suite" >}} Every deployment of the data platform includes
  the Platform Suite. Its license also covers the ArangoDB Enterprise Edition
  that the data platform runs on.
- {{< tag "Agentic AI Suite" >}} The Agentic AI Suite requires a separate
  license on top of the Platform Suite.

Both the data platform and ArangoDB are activated through the same managed
license service operated by Arango. The ArangoDB Kubernetes Operator activates
and renews the licenses automatically. Air-gapped deployments apply a
generated license key instead. See [License Management](license-management.md).
