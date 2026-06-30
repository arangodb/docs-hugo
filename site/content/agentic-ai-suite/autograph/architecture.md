---
title: Architecture
menuTitle: Architecture
weight: 20
description: >-
  AutoGraph's three-layer knowledge graph architecture, ArangoDB collections, and named graphs
---

## Three-Layer Knowledge Graph

AutoGraph organizes data in ArangoDB across three layers. Each layer has a clear
owner, a set of collections, and a specific purpose.

All collection names are prefixed with your project name. For example, if the
project is `myapp`, collections will be `myapp_sources`, `myapp_domains`, and so on.

An AutoGraph project is made of two graphs that work as a pipeline: the **corpus
graph** (`{project}_CorpusGraph`) organizes the documents you feed in, and the
**knowledge graph** (`{project}_kg`) is the GraphRAG graph built inside each
partition. They meet only at the `partition_id` link.

{{< embed-svg "AutoGraph-Data-Model-Overview" "The AutoGraph data model. Left: the corpus graph. Right: the knowledge graph. Solid arrows are stored edges; the dashed link is a shared-property reference, not an edge." >}}

## Collections per layer

```mermaid
graph TD
  subgraph "Layer 1 — Modules  (defined by you)"
    modules["modules\n(vertex: one per module label)"]
  end

  subgraph "Layer 2 — Corpus Graph  (built by AutoGraph)"
    sources["sources\n(vertex: one per document)"]
    similarities["similarities\n(edge: source ↔ source, label SIMILAR_TO)"]
    domains["domains\n(vertex: one per Leiden cluster)"]
    corpus_relations["corpus_relations\n(edge: labels IN_DOMAIN · HAS_CLUSTER · INGESTED_AS)"]
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
  sources ---|SIMILAR_TO| similarities
  sources -->|IN_DOMAIN| domains
  domains -->|INGESTED_AS| rags
  rags -->|orchestration| Documents
  Documents --- Chunks
  Chunks --- Entities
  Entities --- Communities
```

### Layer 1 and 2

AutoGraph builds the corpus by creating collections in Layers 1 and 2. These
collections are organized into a named graph called `{project}_CorpusGraph`.

{{< embed-svg "AutoGraph-Corpus-Graph" "The corpus graph groups ingested sources into topic domains; each domain becomes a retrievable RAG partition." >}}

| Collection | Type | Built by |
|------------|------|----------|
| `modules` | vertex | You (via import or build parameters) |
| `sources` | vertex (one per document) | AutoGraph (corpus build) |
| `similarities` | edge (source ↔ source) with label `SIMILAR_TO` | AutoGraph (corpus build) |
| `domains` | vertex (Leiden clusters) | AutoGraph (corpus build) |
| `corpus_relations` | edge with labels `IN_DOMAIN`, `HAS_CLUSTER`, `INGESTED_AS` | AutoGraph (corpus build) |
| `rags` | vertex (strategy profiles) | AutoGraph (RAG Strategizer) |

{{< info >}}
The `rags` collection is populated by the RAG Strategizer,
and not during the initial corpus build.
{{< /info >}}

**Edge labels in the corpus graph**

AutoGraph assigns semantic labels to edges in the corpus graph to distinguish
different relationship types:

- `SIMILAR_TO`: Applied to edges in the `similarities` collection connecting
  semantically similar documents. These edges include a `similarity_score` field
  (0.0-1.0) computed via vector similarity, BM25 lexical search, and Reciprocal Rank Fusion.
- `IN_DOMAIN`: Applied to membership edges in the `corpus_relations` collection,
  linking documents from the `sources` collection to their cluster vertex in the
  `domains` collection.
- `HAS_CLUSTER`: Edges in the `corpus_relations` collection connecting module vertices to
  their clusters. Links from the `modules` collection to the `domains` collection.
- `INGESTED_AS`: Edges in the `corpus_relations` collection connecting clusters to their
  RAG strategy profiles. Links from the `domains` collection to the `rags` collection.

Labels are stored in the `label` field on each edge document. AQL queries can filter
by label to select specific relationship types (e.g., `FILTER edge.label == "SIMILAR_TO"`).

### Layer 3

The GraphRAG Importer constructs Layer 3 by processing documents into a detailed knowledge
graph stored in the named graph `{project}_kg`. This layer contains the actual document
content, text chunks, and optionally extracted entities and communities, depending on
your chosen RAG strategy.

{{< embed-svg "AutoGraph-Knowledge-Graph" "Inside a partition, documents become chunks, entities are extracted from chunks, and entities are grouped into communities." >}}

| Collection | Type | `full_graphrag` | `vector_rag` |
|------------|------|:-:|:-:|
| `Documents` | vertex (original documents) | yes | yes |
| `Chunks` | vertex (text chunks with optional embeddings) | yes | yes |
| `Entities` | vertex (extracted entities with embeddings) | yes | — |
| `Communities` | vertex (entity clusters with optional embeddings) | yes | — |
| `Relations` | edge (PART_OF, MENTIONED_IN, RELATED_TO, IN_COMMUNITY, SUB_COMMUNITY_OF) | yes | yes |
| `SemanticUnits` | vertex (web URLs and images, optional) | if enabled | if enabled |

{{< warning >}}
The `SemanticUnits` collection is intended to hold semantic units extracted from
document content (for example, citations referencing web URLs and images). While
the orchestrator enables semantic units for FullGraphRAG partitions
(`enable_semantic_units: true`), automatic extraction and node creation is not yet
implemented. The collection structure exists but requires manual population or
custom post-processing. See [Known Limitations](reference/error-handling.md#citation-handling) for details.
{{< /warning >}}

Layer 3 collections share the same `{project}_` prefix. Each document in Layer 3
carries a `partition_id` field so data from different partitions coexists in the same collections.

{{< info >}}
**Where the relationship type is stored differs between the two graphs.** In the
corpus graph, `corpus_relations` and `similarities` store the relationship name in
a **`label`** field. In the knowledge graph, `{project}_Relations` stores it in a
**`type`** field instead (`PART_OF`, `MENTIONED_IN`, `RELATED_TO`, `IN_COMMUNITY`,
`SUB_COMMUNITY_OF`). In both cases the value also lines up one-to-one with the
`_from`/`_to` collection pair, so you can filter either way. See
[Edge fields](#edge-fields) for the full per-edge field list.
{{< /info >}}

The named graph `{project}_CorpusGraph` ties Layers 1 and 2 together.
It contains two edge definitions:
- `similarities` (connecting sources to sources),
- `corpus_relations` (connecting sources, domains, modules, and rags).

## Node fields

When you open a node in the
[Graph Visualizer](../../platform-suite/graph-visualizer.md#view-node-and-edge-properties)
(right-click a node and choose **View node**), a Properties panel lists that node's fields. The tables below show
the fields you can expect on one node of each type, with example values. The system
fields `_id`, `_key`, and `_rev` exist on every node and are omitted. Collection
names use the `{project}_` prefix (the examples below come from a project whose
prefix is `SG_`).

### Corpus-graph nodes

**`sources`**: one ingested source document

| Field | Example value | What it is |
|-------|---------------|------------|
| `filename` | `about-us.md` | Original file name. |
| `content` | `"--- source: https://… Building the world's leading AI data…"` | The raw source text. |
| `module` | `default` | Which module / corpus it belongs to. |
| `partition_id` | (empty until assigned) | Filled once its domain becomes a partition. |
| `embeddings` | `[vector]` | Corpus-level vector used to cluster sources into domains. |

**`domains`**: a topic cluster of similar sources

| Field | Example value | What it is |
|-------|---------------|------------|
| `size` | `100` | Number of sources in the cluster. |
| `members` | `[source ids]` | The sources grouped into this domain. |
| `module` | `default` | Owning module. |

**`rags`**: the RAG-partition configuration (written by the RAG Strategizer)

| Field | Example value | What it is |
|-------|---------------|------------|
| `rag_mode` / `strategy_type` | `FullGraphRAG` | Which RAG strategy the partition uses. |
| `rag_partition_id` | `default_0_a` | Links the partition to its knowledge-graph rows. |
| `chunk_token_size` | `1200` | Target chunk size when splitting documents. |
| `chunk_overlap_token_size` | `100` | Token overlap between consecutive chunks. |
| `enable_chunk_embeddings` | `true` | Whether chunks get their own embeddings. |
| `entity_types` | `[configured types]` | Entity types the extractor may produce (the per-cluster ontology; typically 8–12 types). |
| `smart_graph_attribute` | `partition_id` | The SmartGraph sharding key. |

**`modules`**: the top-level corpus container

| Field | Example value | What it is |
|-------|---------------|------------|
| `name` | `default` | Module name. |
| `clusters` | `[domains/cluster_default_0]` | The domains grouped under this module. |

### Knowledge-graph nodes

**`Documents`**: a full document inside a partition (provenance)

| Field | Example value | What it is |
|-------|---------------|------------|
| `file_name` | `enterprise-context-management.md` | Source file (provenance). |
| `content` | `"--- source: https://…"` | Full document text. |
| `partition_id` | `default_0_a` | Which RAG partition it belongs to. |
| `import_number` | `1` | Which import / build produced it. |

**`Chunks`**: a token-sized passage, the retrieval unit

| Field | Example value | What it is |
|-------|---------------|------------|
| `tokens` | `740` | Length of the chunk in tokens. |
| `chunk_order_index` | `0` | Position of the chunk within its document. |
| `content` | `"--- source: …"` | The passage text. |
| `partition_id` | `default_0_a` | Owning partition. |
| `embedding` | `[vector, when enabled]` | Per-chunk vector for search. |

**`Entities`**: an extracted entity, a node in the graph

| Field | Example value | What it is |
|-------|---------------|------------|
| `entity_name` | `CUSTOMER 360 CO-PILOTS` | The entity's name. |
| `entity_type` | `use_case` | One of the partition's configured ontology types. |
| `description` | `"A use case of the Arango AI Data Platform that unifies profiles…"` | LLM-written description. |
| `partition_id` | `default_0_a` | Owning partition. |
| `embedding` | `[vector]` | Entity embedding for similarity. |

The set of `entity_type` values you see across a corpus is the union of every
partition's ontology, so a multi-cluster corpus shows more distinct types than any
single partition's 8–12.

**`Communities`**: a cluster of related entities

| Field | Example value | What it is |
|-------|---------------|------------|
| `title` | `Cluster 32` | Community title. |
| `level` | `1` | Level in the community hierarchy. |
| `report_string` | `"# GraphRAG and ArangoDB… Community…"` | LLM-written summary report (Markdown). |
| `report_json` | `{ title, summary, rating, rating_explanation, findings }` | Structured version of the report. |
| `occurrence` | `0.37` | How prominent the community is. |
| `sub_communities` | `[ids, if any]` | Child communities (hierarchy). |

## Edge fields

Each edge collection records its relationship name in a different field, plus a few
extras. This is the distinction that is easiest to misread, so it is worth checking
the field name before writing AQL filters.

| Edge collection | Relationship-type field | Other fields |
|-----------------|-------------------------|--------------|
| `corpus_relations` | `label` = `HAS_CLUSTER` / `IN_DOMAIN` / `INGESTED_AS` | `module`, `cluster_id` (IN_DOMAIN only), `_from`, `_to` |
| `Relations` | `type` = `PART_OF` / `MENTIONED_IN` / `RELATED_TO` / `IN_COMMUNITY` / `SUB_COMMUNITY_OF` | `partition_id`, `import_number`, `type`, `_from`, `_to` |
| `similarities` | `label` = `SIMILAR_TO` | `similarity_score`, `module`, `_from`, `_to` |

Knowledge-graph relationships in `Relations` also line up one-to-one with the
collections each edge connects:

| `_from` | `type` | `_to` |
|---------|--------|-------|
| `Entities` | `MENTIONED_IN` | `Chunks` |
| `Entities` | `IN_COMMUNITY` | `Communities` |
| `Entities` | `RELATED_TO` | `Entities` |
| `Chunks` | `PART_OF` | `Documents` |
| `Communities` | `SUB_COMMUNITY_OF` | `Communities` |

## Things people misread

- **Two graphs, not one.** The corpus graph and the knowledge graph are separate;
  they meet only at the partition.
- **The relationship type lives in different fields.** `corpus_relations` and
  `similarities` use a `label` field; `Relations` uses a `type` field. Both also
  match the `_from`/`_to` collections.
- **Arrow direction is not build order.** Arrows show ownership/provenance, not the
  sequence in which the pipeline created the nodes.
- **`rags` → `Documents` is a property link, not a stored edge.** They are joined by
  the `rags` side's `rag_partition_id` matching `Documents.partition_id`, not by an
  edge in any collection.
- **`module` is both a vertex and a property.** It is a node in the `modules`
  collection and also a field stored on `sources`, `domains`, and `rags`.
- **The corpus embedding is not the retrieval index.** The `sources` embedding is a
  single-vector clustering signature (from the first chunk); the full text is
  chunked and indexed separately in the knowledge graph.

## Complete Pipeline

The diagram below shows the full end-to-end API flow across all three layers.
Solid arrows are the sequential pipeline steps; dashed arrows are polling and
inspection calls that you can make at any time.

```mermaid
flowchart TD

    Client["Client / HTTP REST"]

    %% Entry points
    Client -->|Step 0| HEALTH
    Client -->|Step 1| IMP
    Client -->|Step 2| BUILD
    Client -.->|poll anytime| STATUS
    Client -->|Step 3| STRAT
    Client -.->|inspect anytime| GETSTRAT
    Client -->|Step 4| ORCH

    %% Health
    HEALTH["GET /v1/health\nConfirm service status is SERVING"]

    %% Layer 1
    subgraph L1 [Layer 1 - Modules]
        IMP["POST /v1/import-multiple\nUpload documents\nAttach module label\nFiles stored on disk"]
    end

    %% Layer 2
    subgraph L2 [Layer 2 - Corpus Graph]

        %% Build Pipeline
        subgraph BUILD_PIPE [Corpus Build Background Task]
            BUILD["POST /v1/corpus/builds\nReturns corpus_build_id"]
            STATUS["GET /v1/corpus/builds/{id}\nStatus + progress"]

            B1["Read files from disk"]
            B2["Extract text\nPDF / Office / JSON / HTML"]
            B3["Generate embeddings\nFirst 1200 tokens"]
            B4["Insert document nodes"]
            B5["Build similarity edges\nVector + BM25 + RRF"]
            B6["Store similarity edges"]
            B7["Leiden clustering per module"]
            B8["Create cluster nodes"]
            B9["Link docs to clusters"]
            B10["Build corpus relations"]
            B11["Register named graph"]

            BUILD --> B1 --> B2 --> B3 --> B4 --> B5 --> B6 --> B7 --> B8 --> B9 --> B10 --> B11
        end

        %% Strategizer
        subgraph STRAT_PIPE [RAG Strategizer Background Task]
            STRAT["POST /v1/rag-strategizer/analyze"]
            GETSTRAT["GET /v1/rag-strategizer/strategy"]

            S1["Read clusters"]
            S2["Generate per-cluster ontology\n(8-12 entity types via LLM)"]
            S3["Compute complexity score"]
            S4{"Rank clusters by complexity"}
            S5["Assign FullGraphRAG"]
            S6["Assign VectorRAG"]
            S7["Store strategy profiles"]

            STRAT --> S1 --> S2 --> S3 --> S4
            S4 -->|Top N%| S5 --> S7
            S4 -->|Remaining| S6 --> S7
        end
    end

    %% Layer 3
    subgraph L3 [Layer 3 - Knowledge Graph]

        subgraph ORCH_PIPE [Orchestration Background Task]
            ORCH["POST /v1/orchestrate\nReturns orchestration_id"]

            O1["Load jobs from rags\n(all strategy profiles)"]
            O2["Spawn Importer replicas"]
            O3["Submit jobs with rag_mode\nvector_rag or full_graphrag"]
            O4["Poll Importer until done"]
            O5["Tear down workers"]

            ORCH --> O1 --> O2 --> O3 --> O4 --> O5
        end
    end

    %% Cross-layer connections
    IMP -->|files on disk| B1
    B11 -->|Corpus ready| S1
    S7 -->|Strategies ready| O1
```