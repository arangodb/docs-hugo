---
title: GraphRAG Quick Start
menuTitle: Quick Start
weight: 2
description: >-
  Turn a document into a knowledge graph and ask it a question, end to end,
  using the GraphRAG web interface
---

## Prerequisites

- **Arango Contextual Data Platform 4.0+** (ships with ArangoDB 3.12.9+).
- A **GraphRAG project** in your target database.
  See [Projects](../../platform-suite/control-plane-acp.md#projects).
- **LLM and embedding API access** (OpenAI-compatible or Triton-compatible).
- One or more documents to ingest (`.txt`, `.md`, or `.pdf`).

## Build a knowledge graph and query it

{{< steps >}}

{{< step "Open GraphRAG" >}}
In the sidebar, go to **Agentic AI Suite** > **GraphRAG** and create a new
project (or open an existing one).
{{< /step >}}

{{< step "Configure your LLM provider" >}}
Set your chat and embedding providers (for example, an OpenAI-compatible
endpoint and API key). These power both entity extraction and querying.
{{< /step >}}

{{< step "Upload a document and import it" >}}
Upload a document and run the import. Keep the default **Full GraphRAG**
mode to extract entities, relationships, and communities into a knowledge
graph. Wait for the import job to finish.
{{< /step >}}

{{< step "Ask a question" >}}
Open the query view and use **Instant Search** for a fast answer with
references, or **Deep Search** for thorough, multi-step research over your
new knowledge graph.
{{< /step >}}

{{< /steps >}}

{{< tip >}}
**You now have** a knowledge graph stored in ArangoDB and a working natural
language interface over it. The same graph is queryable through the
[Retriever API](../retriever/quick-start.md).
{{< /tip >}}

## Prefer the API?

Drive the same loop programmatically:

1. [**Importer Quick Start**](../importer/quick-start.md): build the
   knowledge graph from your documents.
2. [**Retriever Quick Start**](../retriever/quick-start.md): query it with
   Global, Local, Deep, or Instant search.

## Next steps

- [Technical Overview](technical-overview.md): Architecture and services.
- [Web Interface](web-interface.md): The full guided workflow.
- [Tutorial Notebook](tutorial-notebook.md): Hands-on examples in Jupyter.
