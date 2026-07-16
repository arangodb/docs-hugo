---
title: Importer Quick Start
menuTitle: Quick Start
weight: 2
description: >-
  Install the Importer and turn your first document into a knowledge graph
  stored in ArangoDB
---

## Prerequisites

- **Arango Contextual Data Platform 4.0+** (ships with ArangoDB 3.12.9+).
- A **GraphRAG project** in your target database. The project name prefixes
  the collection names, so it must follow ArangoDB naming rules.
  See [Projects](../../platform-suite/control-plane-acp.md#projects).
- **LLM and embedding API access** (OpenAI-compatible or Triton-compatible).
- A **valid JWT** (`Authorization: Bearer ...`).
- A document to import (`.txt`, `.md`, or `.pdf`).

## Import your first document

You reach the Importer through the platform API gateway on port `8529`. Every
call includes an `Authorization: Bearer <token>` header.

{{< steps >}}

{{< step "Install the Importer service" >}}
Install and start the service through the Arango Control Plane. Configure
your LLM and embedding providers at install time.

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/graphragimporter" >}}

Note the `serviceIdPostfix` from the response - you need it for the
following calls.
{{< /step >}}

{{< step "Submit an import" >}}
Submit a single file (use `/import-multiple` for a batch). Keep the default
`rag_mode: "full_graphrag"` to build a complete knowledge graph.

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/{serviceIdPostfix}/v1/import" >}}
{{< /step >}}

{{< step "Monitor progress" >}}
For single-file imports, watch the platform service status. For multi-file
imports, poll the job:

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/{serviceIdPostfix}/v1/jobs/{job_id}" >}}
{{< /step >}}

{{< step "Verify the result" >}}
Open your ArangoDB database and confirm the knowledge-graph collections
(prefixed with your project name) were created and populated. See
[Verify and explore](verify-and-explore.md).
{{< /step >}}

{{< /steps >}}

{{< tip >}}
**You now have** a knowledge graph in ArangoDB. Query it with the
[Retriever service](../retriever/quick-start.md) or with AQL directly.
{{< /tip >}}

## Next steps

- [LLM Configuration](llm-configuration.md): Configure chat and embedding
  providers.
- [Import Files](importing-files.md): Single-file and multi-file workflows.
- [Architecture](architecture.md): Collections, vector indexes, and the
  async-job lifecycle.
