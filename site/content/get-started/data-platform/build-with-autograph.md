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
  and the Arango AI SDK installed, see
  [Install the Arango Contextual Data Platform](install/_index.md).
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

While the [Quick Start](install/_index.md#quick-start) processed inline text strings
directly, real-world applications require ingesting complete file corpora. You
can ingest an entire local directory with `ag.upload()`.

### Connect

```python
from arango_ai import ArangoAIClient

client = ArangoAIClient("https://localhost:8529", verify_tls=False)
db = client.db('tech_corpus', username='root', password='test')
ag = db.autograph('enterprise-docs', llm_api_key='YOUR_LLM_API_KEY')
```

### Upload files

```python
# Point to a directory containing Markdown files
ag.upload("./files/tech_articles")
```

`ag.upload()` uploads every file directly inside the directory. It does not
descend into subdirectories, so either keep all documents at the top level or
pass a list of paths, for example
`ag.upload(["./files/tech_articles", "./files/press_releases"])`.

AutoGraph automatically parses supported document formats, including PDF, DOCX,
PPTX, XLSX, TXT, and Markdown, without requiring manual format conversion. For
optimal results, ensure files use standard extensions and contain
well-structured text headings to assist topic segmentation. For full details on
supported formats and ingestion limits, see
[Document parsing](../../agentic-ai-suite/autograph/reference/corpus-build.md#document-parsing)
and [Limitations](../../agentic-ai-suite/autograph/reference/limitations.md).

## Basic pipeline configuration

When `ag.build()` is executed, AutoGraph processes the ingested document corpus
through three primary phases:

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

You can tune key build parameters in `ag.build()` to balance extraction depth,
accuracy, and operational throughput:

- `top_k` (default: `7`): The number of nearest-neighbor documents each
  document is linked to via `SIMILAR_TO` edges in the Corpus Graph.
- `cluster_threshold` (default: `1` in the SDK, `2` in the REST API): Determines
  hierarchical versus flat clustering granularity across the corpus. The
  allowed values are `1` (single-level clustering) and `2` (two-level
  clustering).
- `complexity` (default: `moderate`): Controls the FullGraphRAG versus VectorRAG
  strategy split across clusters. The supported levels are:
  - `very_low`: 0% FullGraphRAG / 100% VectorRAG
  - `low`: 25% FullGraphRAG / 75% VectorRAG
  - `moderate`: 50% FullGraphRAG / 50% VectorRAG
  - `high`: 75% FullGraphRAG / 25% VectorRAG
  - `very_high`: 100% FullGraphRAG / 0% VectorRAG
- `replicas` (default: `2`): Configures worker pod parallelism for ingestion
  throughput.
- `max_retries` (default: `1`): How many times a failed import job is retried
  during orchestration.

{{< warning >}}
If `complexity` is set too low and too many clusters fall back to VectorRAG,
entity-based multi-hop traversal queries fail due to missing entity-relationship
graph structures.
{{< /warning >}}

```python
# Build the Context Graph with tuned parameters
ag.build(
    top_k=10,
    cluster_threshold=2,
    complexity="very_high",
    replicas=2,
)
```

`ag.build()` blocks until all three phases are complete and the retriever is
ready to answer questions. Expect it to take 10 to 15 minutes for a corpus of
about 1 MB, longer for larger corpora.

## Choose a retrieval strategy

Selecting the appropriate retrieval mode balances response speed, factual
accuracy, and reasoning depth across different query types:

- [**Local search**](../../agentic-ai-suite/autorag/search-methods/local-search.md)
  (`mode="local"`, the default): Focuses on entity neighborhood traversal and
  precise local relationship lookups.
- [**Global search**](../../agentic-ai-suite/autorag/search-methods/global-search.md)
  (`mode="global"`): Synthesizes high-level thematic insights across overall
  community summaries.
- [**Unified search**](../../agentic-ai-suite/autorag/search-methods/unified-search.md)
  (`mode="unified"`): Blends vector similarity search with entity-relationship
  path traversal for balanced contextual recall.
- [**Deep search**](../../agentic-ai-suite/autorag/search-methods/deep-search.md)
  (`use_llm_planner=True`): Leverages an LLM planner to decompose complex
  multi-step questions and execute multi-hop reasoning pathways across documents
  and graph entities.

See [Search methods](../../agentic-ai-suite/autorag/search-methods/_index.md)
for more information.

```python
# Local search
local_search_response = ag.ask("Who founded SpaceX and what other company does he run?")

# Global search (themes across the whole graph)
global_search_response = ag.ask("What are the recurring themes across these tech companies and products?", mode="global")

# Unified search (passages + entities combined)
unified_search_response = ag.ask("Which companies offer delivery drones?", mode="unified")

# Deep search (multi-hop reasoning with LLM planner)
deep_search_response = ag.ask("How are Google, Android, and NVIDIA connected through GPU or AI hardware?", use_llm_planner=True)
```

## Execute queries and verify accuracy

`ag.ask()` returns the generated answer as a string, so you can print it or
pass it on to the rest of your application:

```python
answer = ag.ask("Who founded SpaceX and what other company does he run?")
print(answer)
```

To check that answers come from your documents and not from the LLM's general
knowledge, also ask a question that your corpus does not cover. The retriever
should say that it does not know rather than invent an answer:

```python
print(ag.ask("What was the score of last night's football game?"))
```

## Complete Python script

The following script combines all the steps above into a single file. It reads
the database password and the LLM API key from the `ARANGODB_PASSWORD` and
`LLM_API_KEY` environment variables:

```python
import os
import logging

from arango_ai import ArangoAIClient

# Enable SDK logs so you can follow the build progress
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

client = ArangoAIClient("https://localhost:8529", verify_tls=False)
db = client.db("tech_corpus", username="root", password=os.environ["ARANGODB_PASSWORD"])

ag = db.autograph("enterprise-docs", llm_api_key=os.environ["LLM_API_KEY"])

ag.upload("./files/tech_articles")

ag.build(
    top_k=10,
    cluster_threshold=2,
    complexity="very_high",
    replicas=2,
)

print("=== Local search (entity neighborhood) ===")
print(ag.ask("Who founded SpaceX and what other company does he run?"))

print("\n=== Global search (themes across the whole graph) ===")
print(ag.ask("What are the recurring themes across these tech companies and products?", mode="global"))

print("\n=== Unified search (passages + entities combined) ===")
print(ag.ask("Which companies offer delivery drones?", mode="unified"))

print("\n=== Deep search (multi-hop reasoning with LLM planner) ===")
print(ag.ask("How are Google, Android, and NVIDIA connected through GPU or AI hardware?", use_llm_planner=True))

print("\n=== Out-of-scope question (grounding check) ===")
print(ag.ask("What was the score of last night's football game?"))

# Stop services
ag.stop()
```
