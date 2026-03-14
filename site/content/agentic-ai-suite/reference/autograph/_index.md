---
title: AutoGraph Service
menuTitle: AutoGraph
description: >-
  The AutoGraph service orchestrates corpus analysis, RAG strategy selection, and automated
  knowledge graph building workflows
weight: 5
---
## Overview

The AutoGraph service provides a comprehensive solution for building and managing corpus-based knowledge graphs. It coordinates the entire pipeline from file import through intelligent RAG strategy selection to automated knowledge graph construction and two-stage retrieval.

**Key features:**
- Multi-file import with metadata support
- Corpus build orchestration with progress tracking
- Intelligent RAG strategy analysis and selection
- Automated orchestration of importer workers
- Field-level embedding generation
- Module-based corpus organization
- Incremental corpus updates
- File Manager integration

{{< tip >}}
AutoGraph is designed to work seamlessly with the [Importer](../importer/) and [Retriever](../retriever/) services, providing intelligent automation and optimization for large-scale knowledge graph deployments and retrieval.
{{< /tip >}}

## Prerequisites

Before importing data, you need to create a GraphRAG project. Projects help you 
organize your work and keep your data separate from other projects.

For detailed instructions on creating and managing projects, see the 
[Projects](../../../platform-suite/control-plane-acp.md#projects) section in
the Arango Control Plane (ACP) service documentation.

Once you have created a project, you can reference it when deploying the AutoGraph 
service using the `project_name` field in the service configuration.

## Installation

To install and start the AutoGraph service, use the AI service endpoint
`/v1/AutoGraph`. This endpoint is part of the Arango Control Plane (ACP)
service, which manages the lifecycle of all AI services in the platform.

The `/v1/health` endpoint provides a simple way to verify that the AutoGraph service is running and is ready to accept requests.

For detailed instructions on installing, monitoring, and managing the AutoGraph service, 
see [The Arango Control Plane (ACP) service](../../../platform-suite/control-plane-acp.md)
documentation.

## Workflow

The typical AutoGraph workflow consists of these stages:

1. **[Import Files](importing-files.md)**: Upload multiple documents with module labels
2. **[Create Corpus Build](corpus-build.md)**: Trigger corpus analysis and clustering
3. **[Monitor Build Progress](corpus-build.md#monitoring-build-status)**: Track the build status
4. **[Analyze RAG Strategies](rag-strategizer.md)**: Let AutoGraph recommend optimal RAG approaches
5. **[Orchestrate Importer Workers](orchestration.md)**: Automatically spawn workers to build knowledge graphs

**Optional operations:**
- **[Embed Fields](embeddings.md)**: Generate embeddings for specific collection fields
- **[Incremental Updates](corpus-build.md#incremental-builds)**: Add new modules without rebuilding everything

## Service Architecture

AutoGraph acts as an intelligent orchestrator that:

- **Manages corpus state**: Tracks files, builds, and metadata
- **Analyzes document clusters**: Groups semantically similar documents
- **Recommends RAG strategies**: Selects between FullGraphRAG and VectorRAG per domain
- **Spawns worker pipelines**: Coordinates multiple importer instances for parallel processing
- **Optimizes retrieval**: Creates semantic partitions for efficient two-stage retrieval

## API Reference

For detailed API documentation, see the
[AutoGraph API Reference](https://arangoml.github.io/platform-dss-api/AutoGraph/proto/index.html).
