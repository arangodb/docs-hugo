---
title: Design Guide
menuTitle: Design Guide
weight: 15
description: >-
  How to structure your data with modules, layers, and components when building knowledge graphs with AutoGraph
---

This section helps you reason about how to structure your data and decide which components to drive directly.

## At a glance: AutoGraph, Importer, layers, and modules

### AutoGraph vs Importer — who does what?

| You call… | Role | Typical use |
|-----------|------|-------------|
| **AutoGraph** (this service's HTTP/gRPC API) | Owns **import**, **corpus build**, **clustering**, **RAG strategizer**, **orchestration**, and optional **embed-field**. Writes Layer 1–2 data in ArangoDB and strategy profiles in `rags`; starts Importer workers when you orchestrate. | Always the **primary control plane** for ingestion and corpus graph construction. |
| **Importer** (separate GraphRAG worker) | Executes **per-partition import jobs** AutoGraph submits after orchestration. Materializes **Layer 3** behavior (chunking, entity work, `rag_mode`: `vector_rag` vs `full_graphrag`) inside each `rag_partition_id`. | **Do not call directly** in the standard flow; AutoGraph's `POST /v1/orchestrate` creates replicas and POSTs jobs. Call Importer yourself only for **standalone** or **emergency** scenarios (e.g. re-running one partition with custom tooling). |

**Rule of thumb:** If it touches **which files are in the corpus**, **similarity edges**, **Leiden domains**, or **strategy rows in `rags`**, that is **AutoGraph**. If it is **"run the heavy GraphRAG import pipeline for partition X"** after strategies exist, that is the **Importer**, normally reached **only via AutoGraph orchestration**.

### How to think about the three layers

Think **bottom-up** — each layer assumes the one below:

1. **Layer 1 — Modules (your design choice)**
   A **module** is a **label** you attach to documents (import `module` field or metadata + corpus build). It is the **unit of isolation**: no cross-module similarity edges, clustering runs **inside** each module, and rebuilds can target **one module** (`incremental: true` + `modules`).

2. **Layer 2 — Corpus graph (AutoGraph)**
   For each module, AutoGraph builds **document vertices** (`sources`), **similarity** edges (vector + BM25 + RRF), **domain** vertices (Leiden clusters), **`corpus_relations`** (membership, `HAS_CLUSTER`, `INGESTED_AS`), **`modules`** collection, and **`rags`** after the strategizer. The named graph **`{project}_CorpusGraph`** is the **map of the whole corpus** — what is connected to what **before** full GraphRAG import.

3. **Layer 3 — Per-partition GraphRAG (Importer)**
   After strategies exist, **orchestration** assigns each **`rag_partition_id`** to an Importer job. The Importer creates **`Documents`**, **`Chunks`**, and **`Relations`** for every partition. **FullGraphRAG** additionally creates **`Entities`** and **`Communities`** (rich entity/relationship graphs); **VectorRAG** skips those (lighter path). All Layer 3 data lives in the **`{project}_kg`** named graph, partitioned by the `partition_id` field on each document.

### What can a module be?

A module is any **stable string identifier** that groups documents that should **share** similarity and clustering **with each other** and **not** with other groups. Treat it as a **shard key** for the corpus graph, not a display name.

**Good candidates:**

- **Product or surface** — `"docs"`, `"api"`, `"console"`.
- **Audience or function** — `"legal"`, `"support"`, `"engineering"`.
- **Locale** — `"en"`, `"de"` when you do **not** want cross-language similarity.
- **Tenant or org unit** — one module per customer or BU when isolation is required.
- **Default bucket** — omit a module on import or rely on **`default`** (assigned at corpus build for any file without a label) for a **single** mixed corpus.

The section [Designing modules](#designing-modules) goes deeper into split vs merge trade-offs and incremental rebuilds.

### How modules become a partitioned knowledge graph

The same module string flows from **files** → **clusters** → **strategies** → **Importer partitions**:

1. **Ingestion** — `POST /v1/import-multiple` can set `module` for the batch; metadata on disk records it. Files without a module get **`default`** when the corpus build runs.

2. **Corpus build** — Processing is **per module** (sequentially). Within a module, similarity and Leiden see **only** that module's documents.

3. **Domain (`domains`) keys** — Cluster vertices are stored with keys like **`cluster_<module>_<n>`** when a module label is present (e.g. `cluster_legal_0`), or **`cluster_<n>`** when no module prefix applies, so clusters from different modules never collide.

4. **Graph wiring** — **`modules`** vertices link to their clusters via **`HAS_CLUSTER`**. Documents link into clusters via **`corpus_relations`** membership edges.

5. **RAG strategizer** — Reads clusters, ranks them, assigns **`VectorRAG`** or **`FullGraphRAG`**, and writes **`rags`** with a **`rag_partition_id`** derived from the cluster key (strategy suffix **`_a`** / **`_b`** distinguishes FullGraphRAG vs VectorRAG for that cluster). Example shape: cluster key `cluster_legal_0` → partition id like **`legal_0_a`**.

6. **Orchestration** — **`POST /v1/orchestrate`** loads **every** matching profile from **`rags`** and runs **one Importer job per `rag_partition_id`**. That is how **modules** (via cluster naming) become **parallel partitions** in Layer 3 — a **partitioned knowledge graph**, not a single undifferentiated blob.

Use **`partition_ids`** on the orchestrate request when you want to **re-run or subset** specific partitions (e.g. only `legal_0_a`) without touching others.

## The three-layer mental model

See the [collections diagram](architecture.md#collections-per-layer) for the full picture. In summary:

- **Layer 1 (Modules)** — defined by you. Logical groupings of documents. Modules are the unit of isolation: documents in different modules never share similarity edges.
- **Layer 2 (Corpus Graph)** — built by AutoGraph (`POST /v1/corpus/builds` + `POST /v1/rag-strategizer/analyze`). Contains the document similarity graph, Leiden clusters, and RAG strategy profiles. This is the topology map of your entire corpus.
- **Layer 3 (Knowledge Graph)** — built by Importer (spawned by `POST /v1/orchestrate`). Creates `Documents`, `Chunks`, and `Relations` for all partitions; `full_graphrag` also creates `Entities` and `Communities` for rich entity graphs; `vector_rag` skips those (lighter path). All Layer 3 data lives in the `{project}_kg` named graph.


## When to use AutoGraph

Use AutoGraph — this service — for everything up to and including Layer 2.

| Goal | Endpoint |
|------|----------|
| Import documents and assign them to a module | `POST /v1/import-multiple` |
| Build the corpus graph (similarity edges + clusters) | `POST /v1/corpus/builds` |
| Monitor a build in progress | `GET /v1/corpus/builds/{id}` |
| Assign VectorRAG or FullGraphRAG to each cluster | `POST /v1/rag-strategizer/analyze` |
| Run orchestration (Importer jobs for all strategy profiles) | `POST /v1/orchestrate` |
| Add a new module without rebuilding the whole corpus | `POST /v1/corpus/builds` with `incremental: true` and the target module listed in `modules` |
| Embed a field on any existing ArangoDB collection | `POST /v1/embed-field-in-collection` |

**Incremental vs full builds:**

- **`incremental: false`** (default) — wipes and rebuilds data for all discovered modules. Use for first builds or full rebuilds.
- **`incremental: true`** — preserves all modules except those listed in `modules`, which are wiped and rebuilt from their current files. Use to add a new module (e.g. a new product line's documentation) or update one module without touching others.

Do not use incremental mode for a first-time build.

---

## When to use the Importer

The Importer is the GraphRAG entity-extraction worker that populates Layer 3 (Knowledge_Graph). **Under normal operation you do not call it directly.** AutoGraph spawns Importer worker replicas automatically when you call `POST /v1/orchestrate`.

```
AutoGraph orchestration (POST /v1/orchestrate)
  │
  ├─ Loads every strategy profile from corpus rags (VectorRAG + FullGraphRAG)
  │
  ├─ Spawns Importer replica pool
  │
  └─ Submits one import job per profile; payload includes rag_mode
       • vector_rag   → creates Documents, Chunks, Relations
       • full_graphrag → creates Documents, Chunks, Entities, Communities, Relations
```

**When you do interact with the Importer directly:**

- **Re-running a specific partition** — pass `partition_ids` in `POST /v1/orchestrate` to target only the partitions you need rather than re-orchestrating the whole corpus.
- **Configuring importer behaviour** — pass environment variable overrides in the `importer_env` map of the orchestration request (e.g. chunk sizes, model endpoints) without rebuilding the corpus.
- **Standalone mode** — if you are running the Importer as an independent service outside AutoGraph, you call it directly with a pre-existing partition. This is an advanced integration pattern and is not required for the standard workflow.

**Decision rule:** after the RAG strategizer has written profiles to `rags`, call `POST /v1/orchestrate` when you want Importer workers to process those profiles (including VectorRAG partitions). Skip orchestration only if you intentionally do not need any Importer-side processing for your deployment. FullGraphRAG partitions require that path for entity-level knowledge graphs; VectorRAG partitions still receive importer jobs configured for `vector_rag` unless you filter with `partition_ids` to exclude them.

---

## Per-cluster ontology (entity_types)

Beyond assigning VectorRAG or FullGraphRAG, the strategizer generates a **domain-specific ontology** for each cluster — a list of 8-12 entity types that defines what the Importer will extract.

**How it works:**

1. The strategizer samples documents from each cluster.
2. An LLM analyzes the samples and identifies the entity types most representative of that domain.
3. The resulting list (e.g. `DRONE`, `FLIGHT_PLAN`, `SENSOR`, `AIRSPACE` for an aviation corpus, or `CONTRACT`, `JURISDICTION`, `LEGISLATION` for legal) is stored in the `rags` collection alongside the strategy profile.
4. Orchestration passes the ontology to the Importer, which uses it to **constrain entity extraction** — only entities matching the ontology are created in the knowledge graph.

**Why this matters:** without a per-cluster ontology, the Importer would fall back to generic entity types and miss domain-specific concepts. The ontology is the schema of your knowledge graph — it determines what entities, relationships, and communities Layer 3 contains.

You can inspect each cluster's ontology via `GET /v1/rag-strategizer/strategy` (the `entity_types` field in each strategy profile).

---

## Designing modules

Modules are the primary architectural decision you make at ingestion time. They cannot be merged after the fact without a full rebuild of the affected modules.

**Split into separate modules when:**

- Documents belong to fundamentally different knowledge domains (e.g. legal contracts vs. product engineering specs)

**Keep as a single module (or use `default`) when:**

- All documents cover a single product or system (e.g. all technical guides for one software platform)
- You have a small corpus (fewer than a few hundred documents) — clustering benefits diminish when the pool is too small to form meaningful groups
- You are prototyping and have not yet determined domain boundaries

**Practical naming examples:**

| Scenario | Suggested modules |
|----------|-------------------|
| SaaS product with docs, legal, and support content | `"docs"`, `"legal"`, `"support"` |
| Multi-language knowledge base | `"en"`, `"de"`, `"fr"` |
| Single unified internal wiki | `"default"` |
| Regulated industry with strict data separation | one module per business unit |

**Rules of thumb:**
- Start with fewer modules and split later if queries are returning irrelevant cross-domain results.
- A module with fewer than ~20 documents will produce a single cluster — the RAG strategizer will have little signal to differentiate strategies.
- Module names are stored in document metadata and in `HAS_CLUSTER` edges; choose names that are stable identifiers, not human-readable labels that will change.
