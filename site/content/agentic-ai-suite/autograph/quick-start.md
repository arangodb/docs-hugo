---
title: AutoGraph Quick Start
menuTitle: Quick Start
weight: 2
description: >-
  Turn a pile of documents into a knowledge base you can chat with, with
  answers cited back to the source
---
## Prerequisites

- **Arango Contextual Data Platform 4.0+** (ships with ArangoDB 3.12.9+).
- A **GraphRAG project** in your target database (keeps datasets isolated).
  See [Projects](../../platform-suite/control-plane-acp/_index.md#projects).
- **LLM and embedding API access** (OpenAI-compatible or Triton-compatible).
- A **valid JWT** for the API (`Authorization: Bearer ...`).

## Build your knowledge base

{{< tabs "autograph-qs" >}}

{{< tab "Web Interface" >}}
{{< steps >}}

{{< step "Create a project" >}}
In the sidebar, open **Agentic AI Suite** > **AutoGraph** and create a
project. A project is an isolated workspace: you keep one set of related
documents per project and their data stays separate from everything else.
{{< /step >}}

{{< step "Upload the documents you want answers from" >}}
Add your files (PDF, Office, text, and more). This is the raw material
AutoGraph reads.
{{< /step >}}

{{< step "Connect an AI model / LLM" >}}
Enter your model provider and key (for example, an OpenAI key covers both
the chat and embedding settings). AutoGraph uses the model to read your
documents now and to answer your questions later. Leave the import settings
at their defaults for your first run.
{{< /step >}}

{{< step "Let AutoGraph analyze your documents" >}}
Deploy the service and start the build (shown as the **Corpus Graph** in the
UI). AutoGraph reads every document, groups them by the topics they actually
cover, and picks the right processing depth for each group, so that dense
technical material and simple FAQs are each handled appropriately. This runs
on its own; wait for it to finish.
{{< /step >}}

{{< step "Build the knowledge base" >}}
Start the import. AutoGraph turns each topic group into a part of a searchable
knowledge base and deploys a retriever to query it. Wait for the
"knowledge graph built successfully" confirmation.
{{< /step >}}

{{< step "Ask your first question" >}}
Open the chat and ask a question in plain language. Answers come back with
citations linking to the source documents they came from.
{{< /step >}}

{{< /steps >}}

{{< info >}}
To add, remove, or replace individual documents later, use the API. The web
interface does not offer these operations in Arango Contextual Data Platform
4.1.0. See [Incremental Graph Updates](incremental-graph-updates.md).
{{< /info >}}
{{< /tab >}}

{{< tab "HTTP REST API" >}}
First, install the AutoGraph service through the Arango Control Plane:

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/autograph" >}}

Then run the pipeline. Every call uses an `Authorization: Bearer <token>`
header.

{{< steps >}}

{{< step "Check the service is ready" >}}
{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/health" >}}
Confirm AutoGraph is up before you start.
{{< /step >}}

{{< step "Upload your files" >}}
{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/filemanager/_db/{database}/rag-input" >}}
Upload your documents to the [File Manager](../../platform-suite/file-manager/)
under the scope `[project, category]`, one category per knowledge domain, for
example `legal` and `engineering`.
{{< /step >}}

{{< step "Build the corpus" >}}
{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/corpus/builds" >}}
List your category labels in `categories`. Builds the Corpus Graph and discovers
domain clusters. Returns `202` with a `corpus_build_id`. Poll
`GET /autograph/v1/corpus/builds/{corpus_build_id}` until `status` is
`completed` before moving on, and check `error_code` even then.
{{< /step >}}

{{< step "Generate RAG strategies" >}}
{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/rag-strategizer/analyze" >}}
Assigns each domain a strategy (FullGraphRAG or VectorRAG) and an ontology.
`project` and `complexity` are required; send `complexity: "very_high"` if every
domain has to answer entity-based questions. Run this only after the corpus
build has completed, then poll
`GET /autograph/v1/rag-strategizer/jobs/{strategize_job_id}` until `status` is
`completed`.
{{< /step >}}

{{< step "Orchestrate the import" >}}
{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/orchestrate" >}}
Spawns the per-domain Importer workers to build the knowledge graph. Run this
only after the strategizer has finished. Returns `202` with an
`orchestration_id`; poll `GET /autograph/v1/orchestrate/{orchestration_id}`
until it reports a terminal status.
{{< /step >}}

{{< step "Keep the graph up-to-date (optional)" >}}
{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/update" >}}
Once the graph is built, you can add, remove, or replace individual documents
with `/v1/graph/insert`, `/v1/graph/delete`, and `/v1/graph/update` instead of
rebuilding the corpus. After an insert or update, call `/v1/orchestrate` again
with the `file_ids` of the changed documents so that the change reaches the
knowledge graph. See [Incremental Graph Updates](incremental-graph-updates.md).
{{< /step >}}

{{< /steps >}}

{{< info >}}
Insert and update identify every document by its File Manager `file_id`, which
is why step 2 uploads through the File Manager. The legacy
`POST /v1/import-multiple` path uploads files directly to the service, but a
corpus built that way cannot be changed document by document. See
[Identifying documents for Layer 3](incremental-graph-updates.md#identifying-documents-for-layer-3).
{{< /info >}}

{{< tip >}}
At any point, `GET /autograph/v1/projects/{project}/overview` reports where the
project stands: the document and cluster counts, and which categories still need
a build, strategies, or an orchestration. See
[Project Operations](reference/project-operations.md#project-overview).
{{< /tip >}}

Next, query your knowledge base with the
[Retriever service](../retriever/quick-start.md).
{{< /tab >}}

{{< /tabs >}}

{{< tip >}}
**You now have** a knowledge base built from your documents and a chat
interface that answers questions about them, with citations back to the
source. To query it programmatically, see the
[Retriever service](../retriever/quick-start.md).
{{< /tip >}}

## Next steps

- [Use Cases](use-cases.md): Real-world enterprise scenarios.
- [Incremental Graph Updates](incremental-graph-updates.md): Add, remove, and
  replace documents in a knowledge graph that has already been built.
- [Architecture](architecture.md): The three-layer knowledge graph and
  resulting collections.
- [Design Guide](design-guide.md): Structure data with categories, layers, and
  components.
