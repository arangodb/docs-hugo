---
title: Architecture
menuTitle: Architecture
weight: 10
description: >-
  AutoGraph's three-layer knowledge graph architecture, ArangoDB collections, and named graphs
---

## Three-Layer Knowledge Graph

AutoGraph organizes data in ArangoDB across three layers. Each layer has a clear
owner, a set of collections, and a specific purpose.

All collection names are prefixed with your project name. For example, if the project is `myapp`, collections will be `myapp_sources`, `myapp_domains`, and so on.

## Collections per layer

```
graph TD
  subgraph "Layer 1 — Modules  (defined by you)"
    modules["modules\n(vertex: one per module label)"]
  end

  subgraph "Layer 2 — Corpus Graph  (built by AutoGraph)"
    sources["sources\n(vertex: one per document)"]
    similarities["similarities\n(edge: source ↔ source)"]
    domains["domains\n(vertex: one per Leiden cluster)"]
    corpus_relations["corpus_relations\n(edge: membership · HAS_CLUSTER)"]
    rags["rags\n(vertex: strategy profiles — added by strategizer)"]
  end

  subgraph "Layer 3 — Knowledge Graph  (built by Importer)"
    Documents["Documents\n(vertex: original documents)"]
    Chunks["Chunks\n(vertex: text chunks)"]
    Entities["Entities\n(vertex: extracted entities — full_graphrag only)"]
    Communities["Communities\n(vertex: entity clusters — full_graphrag only)"]
    Relations["Relations\n(edge: all relationships)"]
  end

  modules -->|HAS_CLUSTER| domains
  sources --- similarities
  sources -->|membership| domains
  domains -->|INGESTED_AS| rags
  rags -->|orchestration| Documents
  Documents --- Chunks
  Chunks --- Entities
  Entities --- Communities
```

### Layer 1 and 2

AutoGraph builds the corpus by creating collections in Layers 1 and 2. These collections are organized into a named graph called `{project}_CorpusGraph`.

| Collection | Type | Built by |
|------------|------|----------|
| `modules` | vertex | You (via import or build parameters) |
| `sources` | vertex (one per document) | AutoGraph (corpus build) |
| `similarities` | edge (source ↔ source) | AutoGraph (corpus build) |
| `domains` | vertex (Leiden clusters) | AutoGraph (corpus build) |
| `corpus_relations` | edge (membership, HAS_CLUSTER, INGESTED_AS) | AutoGraph (corpus build) |
| `rags` | vertex (strategy profiles) | AutoGraph (RAG Strategizer) |

{{< info >}}
The `rags` collection is populated by the RAG Strategizer,
and not during the initial corpus build.
{{< /info >}}

### Layer 3

The GraphRAG Importer constructs Layer 3 by processing documents into a detailed knowledge graph stored in the named graph `{project}_kg`. This layer contains the actual document content, text chunks, and optionally extracted entities and communities, depending on your chosen RAG strategy:

| Collection | Type | `full_graphrag` | `vector_rag` |
|------------|------|:-:|:-:|
| `Documents` | vertex (original documents) | yes | yes |
| `Chunks` | vertex (text chunks with optional embeddings) | yes | yes |
| `Entities` | vertex (extracted entities with embeddings) | yes | — |
| `Communities` | vertex (entity clusters with optional embeddings) | yes | — |
| `Relations` | edge (PART_OF, MENTIONED_IN, RELATED_TO, IN_COMMUNITY, SUB_COMMUNITY_OF) | yes | yes |
| `SemanticUnits` | vertex (web URLs and images — optional) | if enabled | if enabled |

Layer 3 collections share the same `{project}_` prefix. Each document in Layer 3 carries a `partition_id` field so data from different partitions coexists in the same collections.

The named graph `{project}_CorpusGraph` ties Layers 1 and 2 together.
It contains two edge definitions:
- `similarities` (connecting sources to sources),
- `corpus_relations` (connecting sources, domains, and modules).