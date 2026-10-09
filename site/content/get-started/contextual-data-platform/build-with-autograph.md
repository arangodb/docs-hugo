---
title: Build and tune Context Graphs from file corpora
menuTitle: Build with AutoGraph
weight: 10
description: >-
  Ingest a directory of documents with AutoGraph, tune the build parameters,
  and pick the right retrieval mode for each kind of question
---
## Prerequisites

- **Completed installation**: A running Arango Contextual Data Platform instance
  and the Arango AI SDK installed, see the
  [Arango Contextual Data Platform Quickstart](quickstart/_index.md).
- **Document corpus**: A directory of documents ready for ingestion, such as
  text, Markdown, or PDF files.

To follow along with this tutorial, download the example corpus: 50 Markdown
articles about technology companies, products, and people, such as Google,
NVIDIA, Amazon, and Elon Musk. Download and unpack it with `curl`:

```bash
curl -L https://github.com/arangodb/docs-tutorials/releases/download/autograph-v1/corpus.zip -o corpus.zip && unzip -o corpus.zip -d ./files
```

This creates the `./files/tech_articles` directory used in the examples below.
Alternatively, download `corpus.zip` manually from the
[docs-tutorials repository](https://github.com/arangodb/docs-tutorials/releases/tag/autograph-v1)
and extract it into a local `./files` directory. You can also use your own
documents instead, and adjust the path and the example questions to match your
content.

## Ingest a file corpus

While the [Quickstart](quickstart/_index.md#quick-start) uploaded three short
text files one by one, real-world applications require ingesting complete file
corpora. You can upload an entire local directory with
`client.files.upload_folder()`.

### Connect and create a project

Connect to the platform and create a project for this corpus. To pick up a
project you created earlier, use `client.project.get(project_name=...)`
instead:

```python
from arango_ai_sdk import ArangoAIClient

client = ArangoAIClient(
    base_url="https://localhost:8529",
    username="root",
    password="test",
    verify=False,  # the local deployment uses a self-signed certificate
)

project = client.project.create(
    project_name="enterprise-docs",
    project_type="autograph",
)
```

### Store the API key and deploy AutoGraph

Store your LLM API key once as a secret profile and deploy the project's
AutoGraph service with it. One key can serve both the chat and the embedding
model. `fps_recovery_username` names an existing ArangoDB user with read and
write access to the project's database; for a local evaluation setup, `root`
is fine:

```python
profile = client.secret_profile.create(
    name="enterprise-docs-openai",
    secret="YOUR_LLM_API_KEY",
    provider="openai",
)

project.autograph.deploy(
    chat_api_provider="openai",
    embedding_api_provider="openai",
    chat_secret_profile_id=profile.profile_id,
    embedding_secret_profile_id=profile.profile_id,
    fps_recovery_username="root",
    chat_model="gpt-4o",
    embedding_model="text-embedding-3-small",
)

if not project.autograph.wait_until_ready():
    raise RuntimeError("AutoGraph did not become ready in time")
```

### Upload files

Files are uploaded under a *scope*: the first label is the project name and
the second is the *category*, the label the build steps below refer to:

```python
# Point to a directory containing Markdown files
results = client.files.upload_folder(
    "./files/tech_articles",
    scope=["enterprise-docs", "tech_articles"],
)

# One rejected file does not stop the others, so check every result
for result in results:
    print(result.name, result.status)
```

`upload_folder()` uploads every file directly inside the directory. It does not
descend into subdirectories, so either keep all documents at the top level or
call it once per directory, each with its own category. To upload an explicit
list of files, use `client.files.upload_files()`, and for a single file,
`client.files.upload_file()`.

AutoGraph automatically parses supported document formats, including PDF, DOCX,
PPTX, XLSX, TXT, and Markdown, without requiring manual format conversion. For
optimal results, ensure files use standard extensions and contain
well-structured text headings to assist topic segmentation. For full details on
supported formats and ingestion limits, see
[Document parsing](../../agentic-ai-suite/autograph/reference/corpus-build.md#document-parsing)
and [Limitations](../../agentic-ai-suite/autograph/reference/limitations.md).

## Basic pipeline configuration

When `project.autograph.ingest()` is executed, AutoGraph processes the ingested
document corpus through three primary phases:

- **Corpus Build**: Generates a single vector embedding per document, connects
  nearest-neighbor whole documents using `SIMILAR_TO` edges, applies Leiden
  clustering across topic domains, and defers chunking to the orchestration
  phase.
- **RAG Strategizer**: Analyzes clusters and determines the retrieval strategy
  partitioning between FullGraphRAG (deep entity-relationship knowledge graph
  extraction) and VectorRAG (pure vector indexing) based on the specified
  complexity level.
- **Orchestration**: Provisions importer pods and executes distributed graph
  loading jobs into ArangoDB.

You can tune key build parameters to balance extraction depth, accuracy, and
operational throughput:

- `complexity` (default: `high`): Controls the FullGraphRAG versus VectorRAG
  strategy split across clusters. It is a `RagStrategizerComplexity` enum
  value, imported from `arango_ai_sdk.models`. The supported levels are:
  - `very_low`: 0% FullGraphRAG / 100% VectorRAG
  - `low`: 25% FullGraphRAG / 75% VectorRAG
  - `moderate`: 50% FullGraphRAG / 50% VectorRAG
  - `high`: 75% FullGraphRAG / 25% VectorRAG
  - `very_high`: 100% FullGraphRAG / 0% VectorRAG
- `top_k` (default: `7`): The number of nearest-neighbor documents each
  document is linked to via `SIMILAR_TO` edges in the Corpus Graph.
- `cluster_threshold` (default: `2`): Determines the clustering granularity
  across the corpus. The allowed values are `1`, which keeps the first-level
  clusters, and `2`, which merges related clusters into fewer, larger ones.

{{< warning >}}
If `complexity` is set too low and too many clusters fall back to VectorRAG,
entity-based multi-hop traversal queries fail due to missing entity-relationship
graph structures.
{{< /warning >}}

`ingest()` accepts `complexity` directly and blocks until all three phases are
complete. Expect it to take 10 to 15 minutes for a corpus of about 1 MB, longer
for larger corpora:

```python
from arango_ai_sdk.models import RagStrategizerComplexity

project.autograph.ingest(
    categories=["tech_articles"],
    complexity=RagStrategizerComplexity.very_high,
)
```

`top_k` and `cluster_threshold` belong to the Corpus Build phase, so to tune
them you run the phases individually instead of calling `ingest()`. Each call
blocks until its phase finishes:

```python
# Build the Corpus Graph with tuned parameters
project.autograph.corpus_build(
    categories=["tech_articles"],
    top_k=10,
    cluster_threshold=2,
)

# Decide FullGraphRAG versus VectorRAG per cluster
project.autograph.strategize(
    categories=["tech_articles"],
    complexity=RagStrategizerComplexity.very_high,
)

# Read which cluster got which strategy (read-only)
print(project.autograph.strategies().strategy_type_counts)

# Import the Knowledge Graph
project.autograph.orchestrate(categories=["tech_articles"])
```

A category can only be built once. To ingest again after adding files, pass
`incremental=True`; without it, a second build of the same category raises
`CategoryAlreadyBuiltError`.

## Deploy a retriever

Questions are answered by an AutoRAG retriever, a separate service you deploy
on top of the Context Graph with the same model settings as AutoGraph:

```python
retriever = project.autorag.deploy(
    chat_api_provider="openai",
    embedding_api_provider="openai",
    chat_secret_profile_id=profile.profile_id,
    embedding_secret_profile_id=profile.profile_id,
    chat_model="gpt-4o",
    embedding_model="text-embedding-3-small",
)

rag = retriever.autorag
if not rag.wait_until_ready():
    raise RuntimeError("The retriever did not become ready in time")
```

## Choose a retrieval strategy

Selecting the appropriate retrieval mode balances response speed, factual
accuracy, and reasoning depth across different query types. You select it with
the `query_type` parameter of `ask()`, a `QueryType` enum value imported from
`arango_ai_sdk.models`:

- [**Local search**](../../agentic-ai-suite/autorag/search-methods/local-search.md)
  (`QueryType.LOCAL`): Focuses on entity neighborhood traversal and
  precise local relationship lookups.
- [**Global search**](../../agentic-ai-suite/autorag/search-methods/global-search.md)
  (`QueryType.GLOBAL`): Synthesizes high-level thematic insights across overall
  community summaries.
- [**Unified search**](../../agentic-ai-suite/autorag/search-methods/unified-search.md)
  (`QueryType.UNIFIED`, the default): Blends vector similarity search with
  entity-relationship path traversal for balanced contextual recall, and works
  on both FullGraphRAG and VectorRAG partitions.

[**Deep search**](../../agentic-ai-suite/autorag/search-methods/deep-search.md),
which decomposes complex multi-step questions with an LLM planner, is not
available through the SDK yet; use the web interface or the AutoRAG HTTP API
for it. See [Search methods](../../agentic-ai-suite/autorag/search-methods/_index.md)
for more information.

```python
from arango_ai_sdk.models import QueryType

# Local search
local_search_response = rag.ask(
    "Who founded SpaceX and what other company does he run?",
    query_type=QueryType.LOCAL,
)

# Global search (themes across the whole graph)
global_search_response = rag.ask(
    "What are the recurring themes across these tech companies and products?",
    query_type=QueryType.GLOBAL,
)

# Unified search (passages + entities combined, the default)
unified_search_response = rag.ask("Which companies offer delivery drones?")
```

## Execute queries and verify accuracy

`ask()` returns a response object whose `result` field holds the generated
answer, so you can print it or pass it on to the rest of your application:

```python
response = rag.ask(
    "Who founded SpaceX and what other company does he run?",
    query_type=QueryType.LOCAL,
)
print(response.result)
```

To check that answers come from your documents and not from the LLM's general
knowledge, also ask a question that your corpus does not cover. The retriever
should say that it does not know rather than invent an answer:

```python
print(rag.ask("What was the score of last night's football game?").result)
```

## Complete Python script

The following script combines all the steps above into a single file. It reads
the database password and the LLM API key from the `ARANGODB_PASSWORD` and
`LLM_API_KEY` environment variables:

```python
import os

from arango_ai_sdk import ArangoAIClient
from arango_ai_sdk.models import QueryType, RagStrategizerComplexity

client = ArangoAIClient(
    base_url="https://localhost:8529",
    username="root",
    password=os.environ["ARANGODB_PASSWORD"],
    verify=False,
)

project = client.project.create(
    project_name="enterprise-docs",
    project_type="autograph",
)

profile = client.secret_profile.create(
    name="enterprise-docs-openai",
    secret=os.environ["LLM_API_KEY"],
    provider="openai",
)

project.autograph.deploy(
    chat_api_provider="openai",
    embedding_api_provider="openai",
    chat_secret_profile_id=profile.profile_id,
    embedding_secret_profile_id=profile.profile_id,
    fps_recovery_username="root",
    chat_model="gpt-4o",
    embedding_model="text-embedding-3-small",
)
if not project.autograph.wait_until_ready():
    raise RuntimeError("AutoGraph did not become ready in time")

for result in client.files.upload_folder(
    "./files/tech_articles", scope=["enterprise-docs", "tech_articles"]
):
    print(result.name, result.status)

# Build the Context Graph with tuned parameters, printing each polled
# status so you can follow the progress of the long-running phases
project.autograph.corpus_build(
    categories=["tech_articles"],
    top_k=10,
    cluster_threshold=2,
    on_progress=lambda s: print("corpus build:", s.status, s.progress),
)
project.autograph.strategize(
    categories=["tech_articles"],
    complexity=RagStrategizerComplexity.very_high,
    on_progress=lambda s: print("strategize:", s.status),
)
project.autograph.orchestrate(
    categories=["tech_articles"],
    on_progress=lambda s: print("orchestrate:", s.status, s.phase),
)

# Deploy a retriever on top of the Context Graph
retriever = project.autorag.deploy(
    chat_api_provider="openai",
    embedding_api_provider="openai",
    chat_secret_profile_id=profile.profile_id,
    embedding_secret_profile_id=profile.profile_id,
    chat_model="gpt-4o",
    embedding_model="text-embedding-3-small",
)
rag = retriever.autorag
if not rag.wait_until_ready():
    raise RuntimeError("The retriever did not become ready in time")

print("=== Local search (entity neighborhood) ===")
print(rag.ask("Who founded SpaceX and what other company does he run?",
              query_type=QueryType.LOCAL).result)

print("\n=== Global search (themes across the whole graph) ===")
print(rag.ask("What are the recurring themes across these tech companies and products?",
              query_type=QueryType.GLOBAL).result)

print("\n=== Unified search (passages + entities combined, the default) ===")
print(rag.ask("Which companies offer delivery drones?").result)

print("\n=== Out-of-scope question (grounding check) ===")
print(rag.ask("What was the score of last night's football game?").result)

# Stop services; the project and the graph stay in the database
rag.undeploy()
project.autograph.undeploy()
client.close()
```
