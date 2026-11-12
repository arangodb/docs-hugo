---
title: AutoGraph Design Guide
menuTitle: Design Guide
weight: 65
description: >-
  What AutoGraph does to your data in ArangoDB, collection by collection, and
  how to choose the categories that drive it
---
{{< tag "Agentic AI Suite" >}}

AutoGraph turns your files into documents in ArangoDB collections and connects
them in two named graphs. If you already work with ArangoDB, you can open these
collections in the web interface and compare them with the tables below.

You decide how to split your files into categories. AutoGraph derives
everything else from that choice.

## ArangoDB terms used in this guide

| Term | What it means | Where AutoGraph uses it |
|------|---------------|-------------------------|
| Document collection | A set of JSON documents. In a graph, its documents are the nodes. | `modules`, `sources`, `domains`, `rags`, `Documents`, `Chunks`, `Entities`, `Communities` |
| Edge collection | A set of documents with `_from` and `_to` attributes that connect two nodes. | `similarities`, `corpus_relations`, `Relations` |
| `_key` and `_id` | `_key` identifies a document within its collection. `_id` is `<collection>/<_key>` and identifies it within the database. Edges reference nodes by `_id`. | AutoGraph builds most keys from your category label, so you can read where a document came from by looking at its key. |
| Named graph | A set of edge definitions, each saying which collections an edge collection connects. | `{project}_CorpusGraph` and `{project}_kg` |
| SmartGraph | A named graph that is sharded by the value of one node attribute, so nodes with the same value are stored together. | `{project}_kg`, sharded by `partition_id` |

Every collection and graph name starts with your project name. In a project
called `my-sample-project`, the `sources` collection is
`my-sample-project_sources`. The collection names in this guide leave out that
prefix.

## The three layers

AutoGraph writes your data in three layers. Each layer is built from the one
before it.

| Layer | What it stores | Collections | Written by | Named graph |
|-------|----------------|-------------|------------|-------------|
| 1. Categories | One node per category | `modules` | Corpus build | `{project}_CorpusGraph` |
| 2. Corpus Graph | One node per file, similarity edges between files, and topic clusters | `sources`, `similarities`, `domains`, `corpus_relations`, `rags` | Corpus build, then the RAG Strategizer for `rags` | `{project}_CorpusGraph` |
| 3. Knowledge Graph | Text chunks, extracted entities, and communities, per partition | `Documents`, `Chunks`, `Entities`, `Communities`, `Relations` | The Importer, a worker service that AutoGraph starts during orchestration | `{project}_kg` |

The Corpus Graph is a map of your files. It shows which files are similar and
which topic each file belongs to. The Knowledge Graph stores the content that
retrieval uses. There is no edge between the two graphs. They are joined by a
shared value, the partition ID, as described in
[How the partition ID shards the Knowledge Graph](#how-the-partition-id-shards-the-knowledge-graph).

### Layer 1: Categories

A category is the label you file a document under. In the
[File Manager](../file-manager/api.md#scopes), it is the second level of the
file's scope, `[project, category]`.

The corpus build writes one document per category to the `modules` document
collection. Its `_key` is `module_<stored label>`, where the stored label is the
project and category joined with an underscore. For the category
`ArangoDB-3-12` in the project `my-sample-project`:

```json
{
  "_key": "module_my-sample-project_ArangoDB-3-12",
  "name": "my-sample-project_ArangoDB-3-12",
  "clusters": ["my-sample-project_domains/cluster_my-sample-project_ArangoDB-3-12_0", "..."]
}
```

A category is the unit of isolation:

- Similarity edges never connect files of two different categories.
- Clustering runs inside each category on its own.
- You can build, rebuild, or delete one category without touching the others.

{{< info >}}
**`module` is the internal name for a category.** The collection is called
`modules`, and documents in other collections store their category in a
`module` field. That field always contains the stored label (for example
`my-sample-project_ArangoDB-3-12`), never the bare category name you send in
requests.
{{< /info >}}

### Layer 2: Corpus Graph

The corpus build reads every file of a category and creates an embedding for
it. An embedding is a list of numbers that represents the meaning of a text.
Texts about similar things get similar numbers, so AutoGraph can find similar
files by comparing their embeddings. The corpus build then writes the
following:

| Collection | Type | One document per | `_key` | What it connects |
|------------|------|------------------|--------|------------------|
| `sources` | Document | File | `doc_<hash>`, a hash of the stored label and the file name | |
| `similarities` | Edge | Pair of similar files | Generated | `sources` to `sources`, with `label: "SIMILAR_TO"` and a `similarity_score` |
| `domains` | Document | Topic cluster, found by the Leiden community detection algorithm | `cluster_<stored label>_<n>` | |
| `corpus_relations` | Edge | Membership link | Generated | `modules` to `domains` (`label: "HAS_CLUSTER"`), `sources` to `domains` (`label: "IN_DOMAIN"`), and `domains` to `rags` (`label: "INGESTED_AS"`) |
| `rags` | Document | Cluster, after you run the RAG Strategizer | `rag_<partition ID>` | |

Read the edges the same way as any ArangoDB edge. An edge in
`corpus_relations` with
`_from: "my-sample-project_modules/module_my-sample-project_ArangoDB-3-12"`,
`_to: "my-sample-project_domains/cluster_my-sample-project_ArangoDB-3-12_13"`,
and `label: "HAS_CLUSTER"` says that the category `ArangoDB-3-12` has
cluster 13.

Some details follow from how the keys are built:

- The `sources` key depends only on the category and the file name, not on the
  content. If you upload a file with the same name to the same category again,
  it replaces the existing document instead of adding a second one. The same
  file in two categories becomes two documents.
- Cluster keys include the stored label, so cluster 0 of one category never
  collides with cluster 0 of another.
- The `rags` collection stays empty until you run the RAG Strategizer. Each
  `rags` document stores the strategy for one cluster (`strategy_type`,
  `VectorRAG` or `FullGraphRAG`), the cluster's
  [ontology](#per-cluster-ontology-entity_types), and the `rag_partition_id`
  that the Knowledge Graph uses. FullGraphRAG documents also store the import
  settings, such as chunk sizes.

The named graph `{project}_CorpusGraph` has two edge definitions,
`similarities` and `corpus_relations`. Open it in the
[Graph Visualizer](../graph-visualizer.md) to see your files grouped around
their clusters.

### Layer 3: Knowledge Graph

When you build the Knowledge Graph, AutoGraph starts one Importer job per
`rags` document. Each job reads the files of one cluster and writes:

| Collection | Type | Stores | VectorRAG | FullGraphRAG |
|------------|------|--------|-----------|--------------|
| `Documents` | Document | The full text of each file | yes | yes |
| `Chunks` | Document | Token-sized passages, the unit that retrieval returns. VectorRAG always embeds them; for FullGraphRAG, chunk embeddings are a setting. | yes | yes |
| `Entities` | Document | Entities extracted from the chunks, with an LLM-written description | no | yes |
| `Communities` | Document | Groups of related entities, with an LLM-written summary | no | yes |
| `Relations` | Edge | All links between the above, with the relationship in a `type` field (`PART_OF`, `MENTIONED_IN`, `RELATED_TO`, `IN_COMMUNITY`, `SUB_COMMUNITY_OF`) | yes | yes |

The Importer creates all five collections with the graph, so `Entities` and
`Communities` exist even if every partition uses VectorRAG. They stay empty in
that case. If you turn on image extraction, a sixth collection,
`SemanticUnits`, is added.

All clusters of all categories write to the same collections. Every document in
them has a `partition_id` field that says which cluster it came from.

## How the partition ID shards the Knowledge Graph

The partition ID connects the two graphs. The RAG Strategizer creates it from
the cluster key: it drops the `cluster_` prefix and adds a suffix for the
strategy, `_a` for FullGraphRAG and `_b` for VectorRAG. Cluster
`cluster_my-sample-project_ArangoDB-3-12_13` with the VectorRAG strategy becomes
partition `my-sample-project_ArangoDB-3-12_13_b`.

The partition ID is stored in two places:

- In `rags.rag_partition_id`, on the strategy document of the cluster.
- In the `partition_id` field of every document the Importer writes for that
  cluster.

There is no edge from `rags` to `Documents`. To go from one to the other, match
the two fields in a query:

```aql
FOR r IN `my-sample-project_rags`
  FILTER r.rag_partition_id == "my-sample-project_ArangoDB-3-12_13_b"
  FOR c IN `my-sample-project_Chunks`
    FILTER c.partition_id == r.rag_partition_id
    RETURN { strategy: r.strategy_type, chunk: c._key, tokens: c.tokens }
```

The collection names need backticks in AQL because they contain hyphens.

### The Knowledge Graph is a SmartGraph

AutoGraph creates `{project}_kg` as a
[SmartGraph](../../arangodb/3.12/graphs/smartgraphs/_index.md) with
`partition_id` as its SmartGraph attribute. A SmartGraph shards its data by the
value of that attribute instead of distributing documents at random, so all
nodes of one partition are stored on the same DB-Server. A query that stays
inside one partition then does not need network hops between servers. See
[Smart data distribution](../../arangodb/3.12/graphs/smartgraphs/_index.md#smart-data-distribution).

You can see this in the keys. In a SmartGraph, the `_key` of every node starts
with its SmartGraph attribute value and a colon. The Importer builds the rest of
the key from a hash and the import number. A chunk of partition
`my-sample-project_ArangoDB-3-12_13_b` that was written by import 8 has a key
like `my-sample-project_ArangoDB-3-12_13_b:16247946107544591335_8`.

Current limits:

- The sharding only applies in an ArangoDB cluster. On a single server, the
  graph has the SmartGraph properties but behaves like a General Graph. See
  [Testing graphs on a single server](../../arangodb/3.12/graphs/smartgraphs/testing-graphs-on-single-server.md).
- AutoGraph creates the graph with a shard count of 1, because ArangoDB trains a
  vector index per shard. All partitions of a project therefore share one shard
  per collection for now. See
  [Graphs and sharding](importer/limits.md#graphs-and-sharding).
- If `{project}_kg` already exists and is not a SmartGraph, AutoGraph keeps
  writing to it without SmartGraph sharding and logs a warning.

## How categories become a partitioned knowledge graph

The same category label shows up, in its stored form, in the keys and fields of
every layer. Following one file of the category `ArangoDB-3-12` in the project
`my-sample-project`:

| Step | Collection | What is written |
|------|------------|-----------------|
| You upload the file | File Manager | Scope `["my-sample-project", "ArangoDB-3-12"]` |
| Corpus build | `modules` | `_key: "module_my-sample-project_ArangoDB-3-12"` (once per category) |
| Corpus build | `sources` | `_key: "doc_<hash>"`, `module: "my-sample-project_ArangoDB-3-12"` |
| Corpus build | `domains` | `_key: "cluster_my-sample-project_ArangoDB-3-12_13"` |
| Corpus build | `corpus_relations` | `HAS_CLUSTER` edge from the module to the cluster, `IN_DOMAIN` edge from the file to the cluster |
| RAG Strategizer | `rags` | `_key: "rag_my-sample-project_ArangoDB-3-12_13_b"`, `rag_partition_id: "my-sample-project_ArangoDB-3-12_13_b"`, and an `INGESTED_AS` edge from the cluster |
| Knowledge Graph build | `Documents`, `Chunks`, `Relations` | `partition_id: "my-sample-project_ArangoDB-3-12_13_b"` on every document, and keys that start with `my-sample-project_ArangoDB-3-12_13_b:` |

Because each cluster becomes its own partition, you can rebuild or reprocess one
category without touching the data of the others.

## Example: the my-sample-project project

This example builds a Context Graph from the Markdown source files of this
documentation site. The project is `my-sample-project`, and the files are split
into four categories:

| Category | Files |
|----------|-------|
| `ArangoDB-3-12` | 437 |
| `contextual-data-platform` | 103 |
| `drivers` | 9 |
| `integrations` | 23 |

After the corpus build, the database contains these collections:

| Collection | Type |
|------------|------|
| `my-sample-project_modules` | Document |
| `my-sample-project_sources` | Document |
| `my-sample-project_similarities` | Edge |
| `my-sample-project_domains` | Document |
| `my-sample-project_corpus_relations` | Edge |
| `my-sample-project_file_parser_corpus_builds` | Document |

`my-sample-project_modules` has four documents, one per category.
`my-sample-project_sources` has 572 documents, one per file. The Leiden
algorithm found 138 clusters across the four categories, stored in
`my-sample-project_domains`. The `file_parser_corpus_builds` collection records
the progress of each build and is not part of the graph. The named graph
`my-sample-project_CorpusGraph` connects the rest. The corpus build also creates
the ArangoSearch View `my-sample-project_sources_search_view` for the full-text
part of the similarity search.

After the RAG Strategizer, `my-sample-project_rags` contains 138 strategy
documents, one per cluster, and `my-sample-project_corpus_relations` gains one
`INGESTED_AS` edge per cluster, for 848 edges in total.

To count the edges of each kind in your own project, group them by label:

```aql
FOR e IN `my-sample-project_corpus_relations`
  COLLECT label = e.label WITH COUNT INTO n
  RETURN { label, n }
```

After the Knowledge Graph build, five more collections exist:
`my-sample-project_Documents`, `my-sample-project_Chunks`,
`my-sample-project_Entities`, `my-sample-project_Communities`, and the edge
collection `my-sample-project_Relations`. They form the named graph
`my-sample-project_kg`. A chunk from the deployment section of the ArangoDB
manual looks like this:

```json
{
  "_id": "my-sample-project_Chunks/my-sample-project_ArangoDB-3-12_13_b:16247946107544591335_8",
  "_key": "my-sample-project_ArangoDB-3-12_13_b:16247946107544591335_8",
  "tokens": 915,
  "chunk_order_index": 0,
  "content": "---\ntitle: Cluster deployment options\nmenuTitle: Deployment\n...",
  "import_number": 8,
  "partition_id": "my-sample-project_ArangoDB-3-12_13_b",
  "embedding": []
}
```

The content is shortened here. The `embedding` is the chunk's embedding, a list
of 512 numbers. When you ask a question, retrieval creates an embedding for the
question and returns the chunks whose embeddings are closest to it.

From the key and the `partition_id`, you can tell that this chunk comes from
cluster 13 of the category `ArangoDB-3-12`, and that the cluster uses the
VectorRAG strategy (`_b`). A VectorRAG partition has no entities or
communities, so this chunk is linked only to its document, through a `PART_OF`
edge in `my-sample-project_Relations`.

## Per-cluster ontology (entity_types)

For each FullGraphRAG cluster, the RAG Strategizer samples documents and asks an
LLM for the entity types that best describe that domain, typically 8 to 12. It
stores the list in the `entity_types` field of the cluster's `rags` document.
For example:

- Aviation documents: `DRONE`, `FLIGHT_PLAN`, `SENSOR`, `AIRSPACE`
- Legal documents: `CONTRACT`, `JURISDICTION`, `LEGISLATION`

The Importer passes the list to the LLM that extracts entities, so the ontology
steers what the Knowledge Graph of the partition contains. It does not filter
out entities of other types: the Importer only does that when
`enable_strict_types` is on, and AutoGraph does not turn it on. VectorRAG
clusters extract no entities, and their `entity_types` list is empty.

You can review and edit each cluster's ontology before you build the Knowledge
Graph.

## Changing data later

Each kind of change rewrites a different part of the collections:

| Change | What it rewrites | How |
|--------|------------------|-----|
| Add a category | New `modules`, `sources`, `domains`, and `corpus_relations` documents for that category only | Build only the new category, with [Corpus Build](reference/corpus-build.md) |
| Add many files to a built category | The Corpus Graph documents of that category. The Knowledge Graph is not touched. | [Incremental build](reference/corpus-build.md#incremental-builds) |
| Add, remove, or replace a few files | The affected documents in all three layers, keeping clusters and partitions | [Incremental Graph Updates](incremental-graph-updates.md) |
| Rebuild one category from scratch | Everything the category wrote, in all three layers | [Delete the category](reference/project-operations.md#delete-category), then build, strategize, and build the Knowledge Graph again |

Once a category has data in the Knowledge Graph, you cannot rebuild it in place,
because the Importer only adds to a partition and cannot remove what a rebuild
makes outdated. Delete the category first.

## Designing categories

You cannot merge categories later without deleting and rebuilding them. Put
documents in the same category if they should be compared and clustered with
each other, and in different categories if they should not.

Split files into separate categories when they belong to different knowledge
domains, for example legal contracts and engineering specifications.

Keep files in one category, or leave them unlabeled so they get the `default`
category, when:

- All documents cover one product or system.
- The corpus is small. Clustering has little to work with below a few hundred
  documents. If the documents of a category have no similarity edges between
  them, AutoGraph puts them all in a single cluster.
- You are prototyping and do not know the domain boundaries yet.

| Scenario | Suggested categories |
|----------|----------------------|
| Product with docs, legal, and support content | `docs`, `legal`, `support` |
| Multi-language knowledge base, without cross-language similarity | `en`, `de`, `fr` |
| Single internal wiki | `default` |
| Regulated industry with strict data separation | One category per business unit |
| Documentation for several products or versions | One category per product or version, as in the [example](#example-the-my-sample-project-project) |

Start with fewer categories and split later if answers mix unrelated domains.
Category labels end up in `_key` values and `module` fields across the
database, so choose names that do not change.
