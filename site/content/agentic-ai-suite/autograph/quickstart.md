---
title: How to get started with AutoGraph
menuTitle: Quickstart
weight: 5
description: >-
  Get started with AutoGraph using the web interface or the HTTP REST API
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

AutoGraph can process a wide variety of document formats:

- **Text files**: `.txt`, `.md`
- **PDF files**: `.pdf`
- **Office documents**: `.docx`, `.pptx`, `.xlsx`, `.doc`, `.ppt`, `.xls`
- **OpenDocument formats**: `.odt`, `.odp`, `.ods`
- **Rich Text Format**: `.rtf`

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
   {{< endpoint "POST" "/v1/import-multiple" >}}
2. **Build corpus**
   {{< endpoint "POST" "/v1/corpus/builds" >}}
3. **Generate strategies**
   {{< endpoint "POST" "/v1/rag-strategizer/analyze" >}}
4. **Orchestrate import**
   {{< endpoint "POST" "/v1/orchestrate" >}}

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