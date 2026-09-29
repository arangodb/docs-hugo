---
title: API reference of the data platform
menuTitle: API reference
group: Reference
weight: 500
description: >-
  Where to find the HTTP API of every service of the Arango Contextual Data
  Platform
---
Every service of the Arango Contextual Data Platform exposes an HTTP API, and
each is documented in the chapter of the service it belongs to. This page
lists them in one place.

| Service | Reference pages | What they cover |
|---------|-----------------|-----------------|
| Arango Control Plane (ACP) | [Control Plane HTTP API](control-plane-acp/api.md) | Install, monitor, and remove platform services, manage projects |
| File Manager | [File Manager HTTP API](file-manager/api.md) | Upload and manage RAG input files and code packages |
| AutoGraph service | [Endpoints and call sequence](autograph-studio/autograph/_index.md#endpoints), [Corpus Build](autograph-studio/autograph/corpus-build.md), [RAG Strategizer](autograph-studio/autograph/rag-strategizer.md), [Graph Operations](autograph-studio/autograph/orchestration.md), [Embeddings](autograph-studio/autograph/embeddings.md), [Project Operations](autograph-studio/autograph/project-operations.md), [Error Handling](autograph-studio/autograph/error-handling.md), [Limitations](autograph-studio/autograph/limitations.md) | Build the Context Graph, maintain it, and inspect a project |
| Importer | [Endpoints](autograph-studio/autograph/importer/_index.md#endpoints), [Import endpoints](autograph-studio/autograph/importer/import-endpoints.md), [Parameters](autograph-studio/autograph/importer/parameters.md), [Limits and Quotas](autograph-studio/autograph/importer/limits.md), [Error Handling](autograph-studio/autograph/importer/error-handling.md) | The worker that builds the Knowledge Graph, and the values you pass through `importer_env` |
| AutoRAG | [Execute Queries](autograph-studio/autorag/executing-queries.md), [Parameters](autograph-studio/autorag/parameters.md), [Custom Prompts](autograph-studio/autorag/custom-prompts.md), [Error Handling](autograph-studio/autorag/error-handling.md) | Query a Context Graph with the different search methods |
| Graph Analytics | [HTTP API for Graph Analytics Engines](graph-analytics/api.md) | Manage engines, load graphs, run algorithms |
| GraphML | [Notebooks & API](graphml/notebooks-api.md) | Control GraphML from Jupyter notebooks or Python |
| Natural Language to AQL | [API Reference](natural-language-to-aql/api-reference.md) | Generate AQL from natural language |
| Reasoner | [API Reference](reasoner/api-reference.md) | Analyze and optimize AQL queries |
| Container Manager | [Deploy a new service via API](container-manager/deploy-api.md) | Deploy your own services and apps |
| Cypher to AQL | [Cypher to AQL Translation Service](cypher-to-aql.md) | Translate Cypher queries to AQL |

## OpenAPI

The machine-readable API descriptions of the platform services are published at
[apiref.arango.ai](https://apiref.arango.ai/).

## Changes between releases

- [API changes](release-notes/api-changes.md): Breaking and non-breaking API
  changes per data platform release.
- [Service versions](release-notes/service-versions.md): The version of every
  service that each data platform release bundles.

For the HTTP API of the ArangoDB database system itself, see the
[ArangoDB HTTP API](../arangodb/3.12/develop/http-api/_index.md).
