---
title: How to get started with the Importer
menuTitle: Quickstart
weight: 10
description: >-
  Prerequisites, installation, and first import call for the Importer service
---

The Importer service is available in the Arango Contextual Data Platform
through two interfaces:

- **Web interface**: A guided workflow for configuring and running the
  Importer step by step. See the
  [Contextual Data Platform web interface](../graphrag/web-interface.md).
- **HTTP REST API**: Full programmatic control over the Importer pipeline.

{{< tip >}}
Both interfaces produce the same result: a knowledge graph in your ArangoDB
database. Choose the web interface for a guided experience or the API for
automation.
{{< /tip >}}

## Supported file formats

The Importer accepts the following formats with UTF-8 encoding:

- **Plain text**: `.txt`
- **Markdown**: `.md`
- **PDF**: `.pdf`

Office files (`.docx`, `.pptx`, etc.) and images are converted to PDF first
and then processed through the same pipeline.

## Prerequisites

- **Arango Contextual Data Platform 4.0+** (which ships with **ArangoDB
  3.12.9** or later).
- **LLM and embedding API access** (OpenAI-compatible or Triton-compatible
  endpoints).
- **Valid JWT** for the API (`Authorization: Bearer ...`).
- A **GraphRAG project** in the target database. Projects keep datasets and
  configurations isolated from each other. For instructions, see the
  [Projects](../../platform-suite/control-plane-acp.md#projects) section in
  the Arango Control Plane (ACP) documentation.

{{< warning >}}
Because the project name is used as a prefix for ArangoDB collection names,
it must conform to ArangoDB naming rules:
- Must start with a letter or underscore.
- May only contain letters, digits, underscores (`_`), or hyphens (`-`).
- Must not exceed 256 characters (including suffixes such as `_Documents`).

If the project name is not set, the service falls back to `default_project`.
An invalid name is not validated at startup and causes collection creation
to fail at runtime.
{{< /warning >}}

## Installation

To install and start the Importer service, use the following endpoint:

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/graphragimporter" >}}

This endpoint is part of the Arango Control Plane (ACP) service, which
manages the lifecycle of all AI services in the platform. For detailed
installation, monitoring, and lifecycle management instructions, see the
[Arango Control Plane (ACP)](../../platform-suite/control-plane-acp.md)
documentation.

## Get started

{{< tabs "importer-setup" >}}

{{< tab "Web Interface" >}}
The web interface lets you configure and run the Importer through a guided
workflow.

1. Navigate to **Agentic AI Suite** > **GraphRAG** in the sidebar.
2. Create a new project and upload your documents.
3. Configure your LLM provider and import settings.
4. Run the import and inspect the resulting knowledge graph.

For the full walkthrough, see the
[GraphRAG web interface](../graphrag/web-interface.md) guide.
{{< /tab >}}

{{< tab "HTTP REST API" >}}
The Importer exposes HTTP REST endpoints on port `8080`. The recommended call
sequence is:

1. **Configure your LLM provider** at install time.
   See [LLM Configuration](llm-configuration.md).
2. **Submit an import**:
   {{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/{serviceIdPostfix}/v1/import" >}}
   or for a batch:
   {{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/{serviceIdPostfix}/v1/import-multiple" >}}
3. **Monitor progress** via the platform service status (single-file imports)
   or by polling `GET /v1/jobs/{job_id}` (multi-file imports).
4. **Verify the result** in your ArangoDB database.

Authentication uses JWT Bearer tokens. For full endpoint documentation,
see the [Reference](reference/_index.md).
{{< /tab >}}

{{< /tabs >}}

## Learn more

- [Architecture](architecture.md): Knowledge graph collections, vector
  indexes, and the async-job lifecycle.
- [LLM Configuration](llm-configuration.md): Choose and configure your
  chat and embedding providers.
- [Import Files](importing-files.md): Single-file and multi-file imports
  with examples.
- [AutoGraph Integration](autograph-integration.md): How the Importer is
  driven by AutoGraph for multi-partition builds.
- [Reference](reference/_index.md): HTTP endpoints, parameters, and
  error handling.
