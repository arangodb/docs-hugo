---
title: AutoGraph Quick Start
menuTitle: Quick Start
weight: 2
description: >-
  Go from a set of documents to a domain-aware, queryable knowledge base with
  AutoGraph in a handful of steps
---

## Prerequisites

- **Arango Contextual Data Platform 4.0+** (ships with ArangoDB 3.12.9+).
- A **GraphRAG project** in your target database (keeps datasets isolated).
  See [Projects](../../platform-suite/control-plane-acp.md#projects).
- **LLM and embedding API access** (OpenAI-compatible or Triton-compatible).
- A **valid JWT** for the API (`Authorization: Bearer ...`).

## Build your knowledge base

{{< tabs "autograph-qs" >}}

{{< tab "Web Interface" >}}
{{< steps >}}

{{< step "Open AutoGraph" >}}
In the sidebar, go to **Agentic AI Suite** > **AutoGraph**, then create a
new project for this corpus.
{{< /step >}}

{{< step "Upload your documents" >}}
Upload the files you want to organize (PDF, Office, text, and more). These
are stored in object storage and processed into the knowledge base.
{{< /step >}}

{{< step "Configure your LLM provider" >}}
Enter your chat and embedding provider settings (for example, an
OpenAI-compatible endpoint and API key) and your import settings.
{{< /step >}}

{{< step "Deploy and build the corpus" >}}
Deploy the AutoGraph service and build your **Corpus Graph**. AutoGraph
analyzes document relationships and discovers natural domain clusters.
{{< /step >}}

{{< step "Generate strategies and import" >}}
Let the **RAG Strategizer** assign a strategy per domain, import each domain
into its partition, and deploy a retriever.
{{< /step >}}

{{< /steps >}}
{{< /tab >}}

{{< tab "HTTP REST API" >}}
First, install the AutoGraph service through the Arango Control Plane:

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/autograph" >}}

Then run the pipeline. Every call uses an `Authorization: Bearer <token>`
header.

{{< steps >}}

{{< step "Import your files" >}}
{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/import-multiple" >}}
Upload the documents that make up your corpus.
{{< /step >}}

{{< step "Build the corpus" >}}
{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/corpus/builds" >}}
Builds the Corpus Graph and discovers domain clusters.
{{< /step >}}

{{< step "Generate RAG strategies" >}}
{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/rag-strategizer/analyze" >}}
Assigns each domain a strategy (FullGraphRAG or VectorRAG) and an ontology.
{{< /step >}}

{{< step "Orchestrate the import" >}}
{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/orchestrate" >}}
Runs the per-domain Importer builds automatically.
{{< /step >}}

{{< /steps >}}
{{< /tab >}}

{{< /tabs >}}

{{< tip >}}
**You now have** a domain-partitioned knowledge base with a deployed
retriever. Query it across domains with the
[Retriever service](../retriever/quick-start.md).
{{< /tip >}}

## Next steps

- [Use Cases](use-cases.md): Real-world enterprise scenarios.
- [Architecture](architecture.md): The three-layer knowledge graph and
  resulting collections.
- [Design Guide](design-guide.md): Structure data with modules, layers, and
  components.
