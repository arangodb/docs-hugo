---
title: Set up AutoGraph
menuTitle: Setup
weight: 5
description: >-
  Set up AutoGraph using the web interface or the HTTP REST API
  to build knowledge graphs from your enterprise documents
---
AutoGraph is available in the Arango Contextual Data Platform through two
interfaces:

- [**Web interface**](web-interface.md): A guided, step-by-step workflow
  for creating projects, uploading documents, and deploying retrieval
  services without writing code.
- [**HTTP REST API**](./reference/_index.md): Full programmatic control
  over the AutoGraph pipeline for automation and integration into existing workflows.

{{< tip >}}
Both interfaces produce the same result: a fully operational
knowledge graph with deployed retrieval services. Choose the web
interface for a guided experience, or the API for automation.
{{< /tip >}}

## Supported file formats

The corpus build does not parse documents itself. It hands every input that is
not already plain text or Markdown to the **File Parser service**, which
converts it to Markdown and, where applicable, extracts the embedded images
together with the text surrounding each one. AutoGraph then embeds and clusters
that Markdown.

The File Parser is an internal data platform service installed once per environment,
without a web interface of its own. The GraphRAG [Importer](../importer/_index.md)
uses the same service when it builds the knowledge graph, so the whole AutoGraph
pipeline accepts one consistent set of inputs:

- **PDF**: `.pdf` files including scanned documents, read using OCR
- **Office documents**: `.doc`, `.docx`, `.ppt`, and `.pptx` files
- **Plain text**: `.txt` and `.md` files

For the per-format detail, see
[Format support](../importer/setup.md#format-support).

{{< tip >}}
Parsing runs on CPU. Throughput for large-scale ingestion of PDF and Office
documents is governed by how many File Parser worker pods your node pool can
support, not by GPU availability. Parsing PDFs is by far the most expensive
operation, because every page without a text layer has to be read using OCR. See
[Tuning the File Parser](../importer/setup.md#tuning-the-file-parser-for-self-hosted-deployments)
if a self-hosted cluster is slower than you expect.
{{< /tip >}}

## Prerequisites

- **Arango Contextual Data Platform 4.0+** (which ships with
  **ArangoDB 3.12.9** or later)
- **LLM and embedding API access** (commonly OpenAI-compatible or Triton-compatible endpoints)
- **Valid JWT** for the API (`Authorization: Bearer ...`)
- **Platform auth** reachable from the service (for token validation and
  renewal), if your deployment uses it

Before importing data, you need to create a GraphRAG project. Projects keep
datasets and configurations isolated from each other.

For detailed instructions on creating and managing projects, see the
[Projects](../../platform-suite/control-plane-acp/_index.md#projects) section in
the Arango Control Plane (ACP) documentation.

To install and start the AutoGraph service, use the `/_platform/acp/v1/autograph`
endpoint of the [Arango Control Plane (ACP)](../../platform-suite/control-plane-acp/_index.md).

## Get started

{{< tabs "autograph-setup" >}}

{{< tab "Web Interface" >}}
The web interface of the Arango Contextual Data Platform lets you create,
configure, and run a complete AutoGraph workflow through a streamlined
web interface.

1. Navigate to **Agentic AI Suite** > **AutoGraph** in the sidebar.
2. Create a new project and upload your documents.
3. Configure your LLM provider and import settings.
4. Deploy the AutoGraph service and build your corpus.
5. Generate strategies, import into the knowledge graph, and deploy a retriever.

For the full walkthrough, see the [Web Interface](web-interface.md) guide.
{{< /tab >}}

{{< tab "HTTP REST API" >}}
The AutoGraph service exposes HTTP REST endpoints (port `8080`)
for programmatic access. The recommended call sequence is:

1. **Import files**
   {{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/import-multiple" >}}
2. **Build corpus**
   {{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/corpus/builds" >}}
3. **Generate strategies**
   {{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/rag-strategizer/analyze" >}}
4. **Orchestrate import**
   {{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/orchestrate" >}}

Authentication uses JWT Bearer tokens. For full endpoint documentation,
see the [API Reference](reference/_index.md).
{{< /tab >}}

{{< /tabs >}}

## Learn more

- [Use Cases](use-cases.md): Real-world enterprise applications and business
  impact metrics.
- [Architecture](architecture.md): Learn more about the three-layer knowledge graph
  architecture and resulting collections.
- [Design Guide](design-guide.md): How to structure your data with modules,
  layers, and components.