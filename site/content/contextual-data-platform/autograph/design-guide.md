---
title: AutoGraph Design Guide
menuTitle: Design Guide
weight: 65
description: >-
  How AutoGraph handles your data in ArangoDB, collection by collection, and
  how to choose the categories that drive it
---
{{< tag "Agentic AI Suite" >}}

AutoGraph turns your files into documents in ArangoDB collections and connects
them in two named graphs. You can view these collections and their documents in
the ArangoDB web interface and compare them with the tables below.

You decide how to split your files into categories. AutoGraph derives
everything else from that choice. Put files in the same category if they should
be compared and clustered with each other, for example the documentation of one
product version, and in different categories if they belong to separate domains,
such as legal contracts and engineering specifications. See
[Designing categories](#designing-categories) for more guidance.

## ArangoDB terms used in this guide

| Term | What it means | Where AutoGraph uses it |
|------|---------------|-------------------------|
| Document collection | A set of JSON documents. In a graph, its documents are the nodes. | `modules`, `sources`, `domains`, `rags`, `Documents`, `Chunks`, `Entities`, `Communities` |
| Edge collection | A set of documents with `_from` and `_to` attributes that connect two nodes. | `similarities`, `corpus_relations`, `Relations` |
| `_key` and `_id` | `_key` identifies a document within its collection. `_id` is `<collection>/<_key>` and identifies it within the database. Edges reference nodes by `_id`. | AutoGraph builds most keys from your category label, so you can read where a document came from by looking at its key. |
| Named graph | A set of edge definitions, each saying which collections an edge collection connects. | `{project}_CorpusGraph` and `{project}_kg` |
| SmartGraph | A named graph that is sharded by the value of one node attribute, so nodes with the same value are stored together. | `{project}_kg`, sharded by `partition_id` |

The examples in this guide use the project `quickstart` and the category
`physicists` from the
[Contextual Data Platform Quickstart](../../get-started/contextual-data-platform/quickstart/_index.md),
unless they say otherwise.

Every collection and graph name starts with your project name. In the project
`quickstart`, the `sources` collection is
`quickstart_sources`. The collection names in this guide leave out that
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
`physicists` in the project `quickstart`:

```json
{
  "_key": "module_quickstart_physicists",
  "name": "quickstart_physicists",
  "clusters": ["quickstart_domains/cluster_quickstart_physicists_0", "..."]
}
```

Files you upload without a category, with only the project in their scope, are
built as the `default` category (`categories: ["default"]`). `default` does not
appear in any key: the stored label is the project name alone. In a project
called `wiki`, the category document is `module_wiki`, and the clusters are
`cluster_wiki_0`, `cluster_wiki_1`, and so on.

The `default` category covers every file of the project, including the files of
named categories. Do not mix unlabeled files and named categories in one
project: if a named category is already built, building `default` fails because
that category is already in the corpus.

A category is the unit of isolation:

- Similarity edges never connect files of two different categories.
- Clustering runs inside each category on its own.
- You can build, rebuild, or delete one category without touching the others.

{{< info >}}
**`module` is the internal name for a category.** The collection is called
`modules`, and documents in other collections store their category in a
`module` field. That field always contains the stored label (for example
`quickstart_physicists`), never the bare category name you send in
requests.
{{< /info >}}

### Layer 2: Corpus Graph

The corpus build reads every file of a category and creates an embedding for
it. An embedding is a vector, a list of numbers that places the meaning of a
text as a direction in a space with many dimensions. Texts about similar things
point in similar directions, so AutoGraph finds similar files by comparing the
directions of their embeddings. The corpus build then writes the following:

| Collection | Type | One document per | `_key` | What it connects |
|------------|------|------------------|--------|------------------|
| `sources` | Document | File | `doc_<hash>`, a hash of the stored label and the file name | |
| `similarities` | Edge | Pair of similar files | Generated | `sources` to `sources`, with `label: "SIMILAR_TO"` and a `similarity_score` |
| `domains` | Document | Topic cluster, found by the Leiden community detection algorithm | `cluster_<stored label>_<n>` | |
| `corpus_relations` | Edge | Membership link | Generated | `modules` to `domains` (`label: "HAS_CLUSTER"`), `sources` to `domains` (`label: "IN_DOMAIN"`), and `domains` to `rags` (`label: "INGESTED_AS"`) |
| `rags` | Document | Cluster, after you run the RAG Strategizer | `rag_<partition ID>` | |

Read the edges the same way as any ArangoDB edge. An edge in
`corpus_relations` with
`_from: "quickstart_modules/module_quickstart_physicists"`,
`_to: "quickstart_domains/cluster_quickstart_physicists_0"`,
and `label: "HAS_CLUSTER"` says that the category `physicists` has
cluster 0.

Some details follow from how the keys are built:

- The `sources` key depends only on the category and the file name, not on the
  content. If you upload a file with the same name to the same category again,
  it replaces the existing document instead of adding a second one. The same
  file in two categories becomes two documents.
- Cluster keys include the stored label, so cluster 0 of one category never
  collides with cluster 0 of another.
- The `rags` collection does not exist until you run the RAG Strategizer. Each
  `rags` document stores the strategy for one cluster (`strategy_type`,
  `VectorRAG` or `FullGraphRAG`), the cluster's
  [entity schema](#per-cluster-entity-schema-entity_types), and the
  `rag_partition_id`
  that the Knowledge Graph uses. FullGraphRAG documents also store the import
  settings, such as chunk sizes.

The named graph `{project}_CorpusGraph` has two edge definitions,
`similarities` and `corpus_relations`. Open it in the
[Graph Visualizer](../graph-visualizer.md) to see your files grouped around
their clusters.

### Layer 3: Knowledge Graph

When you build the Knowledge Graph, AutoGraph creates one Importer job per
`rags` document. The jobs do not all start at once: they run on a pool of
Importer workers, and the
[`replicas`](reference/orchestration.md#build-the-knowledge-graph) setting decides
how many run in parallel (1 by default). Each job reads the files of one
cluster and writes:

| Collection | Type | Stores | VectorRAG | FullGraphRAG |
|------------|------|--------|-----------|--------------|
| `Documents` | Document | The full text of each file | yes | yes |
| `Chunks` | Document | Passages of a file, the unit that retrieval returns. Their length is set in tokens: up to 1200 tokens per chunk, with 100 tokens of overlap, by default (`chunk_token_size` and `chunk_overlap_token_size` in the `rags` document). VectorRAG always embeds them; for FullGraphRAG, chunk embeddings are a setting. | yes | yes |
| `Entities` | Document | Entities extracted from the chunks, with an LLM-written description | no | yes |
| `Communities` | Document | Groups of related entities, with an LLM-written summary | no | yes |
| `Relations` | Edge | All links between the above, with the relationship in a `type` field (`PART_OF`, `MENTIONED_IN`, `RELATED_TO`, `IN_COMMUNITY`, `SUB_COMMUNITY_OF`) | yes | yes |

The Importer creates all five collections with the graph, so `Entities` and
`Communities` exist even if every partition uses VectorRAG. They stay empty in
that case. If you enable image extraction, a sixth collection,
`SemanticUnits`, is added.

All clusters of all categories write to the same collections. Every document in
them has a `partition_id` field that says which cluster it came from. Clusters
and partitions map one to one: each cluster becomes exactly one partition, and
the partition ID is derived from the cluster key, with a suffix for its strategy. The
partition ID is also the SmartGraph attribute of the Knowledge Graph, as the next
section explains.

## How the partition ID shards the Knowledge Graph

The partition ID connects the two graphs. The RAG Strategizer creates it from
the cluster key: it drops the `cluster_` prefix and adds a suffix for the
strategy, `_a` for FullGraphRAG and `_b` for VectorRAG. Cluster
`cluster_quickstart_physicists_0` with the FullGraphRAG strategy becomes
partition `quickstart_physicists_0_a`.

The partition ID is stored in two places:

- In `rags.rag_partition_id`, on the strategy document of the cluster.
- In the `partition_id` field of every document the Importer writes for that
  cluster.

There is no edge from `rags` to `Documents`. To go from one to the other, match
the two fields in a query:

```aql
FOR r IN quickstart_rags
  FILTER r.rag_partition_id == "quickstart_physicists_0_a"
  FOR c IN quickstart_Chunks
    FILTER c.partition_id == r.rag_partition_id
    RETURN { strategy: r.strategy_type, chunk: c._key, tokens: c.tokens }
```

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
`quickstart_physicists_0_a` that was written by import 1 has a key
like `quickstart_physicists_0_a:11142339072494813907_1`.

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
every layer. Following one file of the category `physicists` in the project
`quickstart`:

| Step | Collection | What is written |
|------|------------|-----------------|
| You upload the file | File Manager | Scope `["quickstart", "physicists"]` |
| Corpus build | `modules` | `_key: "module_quickstart_physicists"` (once per category) |
| Corpus build | `sources` | `_key: "doc_<hash>"`, `module: "quickstart_physicists"` |
| Corpus build | `domains` | `_key: "cluster_quickstart_physicists_0"` |
| Corpus build | `corpus_relations` | `HAS_CLUSTER` edge from the module to the cluster, `IN_DOMAIN` edge from the file to the cluster |
| RAG Strategizer | `rags` | `_key: "rag_quickstart_physicists_0_a"`, `rag_partition_id: "quickstart_physicists_0_a"`, and an `INGESTED_AS` edge from the cluster |
| Knowledge Graph build | `Documents`, `Chunks`, `Relations` | `partition_id: "quickstart_physicists_0_a"` on every document, and keys that start with `quickstart_physicists_0_a:` |

Because each cluster becomes its own partition, you can rebuild or reprocess one
category without touching the data of the others.

## Example: the quickstart project with two categories

This example continues the
[Contextual Data Platform Quickstart](../../get-started/contextual-data-platform/quickstart/_index.md).
The quickstart builds the category `physicists` from three short biographies.
A second category, `chemists`, adds three more files to the project
`quickstart`:

| Category | Files |
|----------|-------|
| `physicists` | `einstein.txt`, `bohr.txt`, `heisenberg.txt` |
| `chemists` | `curie.txt`, `pauling.txt`, `mendeleev.txt` |

Because `physicists` is already built, only `chemists` is sent to the corpus
build, with `categories: ["chemists"]`. This is the
[Add a category](#changing-data-later) case: the `physicists` documents are not
touched.

After the corpus build, the database contains these collections:

| Collection | Type | Documents |
|------------|------|-----------|
| `quickstart_modules` | Document | 2, one per category |
| `quickstart_sources` | Document | 6, one per file |
| `quickstart_similarities` | Edge | 6 |
| `quickstart_domains` | Document | 2 |
| `quickstart_corpus_relations` | Edge | 8 |
| `quickstart_file_parser_corpus_builds` | Document | One per build |

Each category is small, so the Leiden algorithm puts each into a single
cluster: `cluster_quickstart_physicists_0` and `cluster_quickstart_chemists_0`.
All six `SIMILAR_TO` edges connect files of the same category, because
similarity edges never cross categories. The `file_parser_corpus_builds`
collection records the progress of each build and is not part of the graph. The
named graph `quickstart_CorpusGraph` connects the rest. The corpus build also
creates the ArangoSearch View `quickstart_sources_search_view` for the full-text
part of the similarity search.

After the RAG Strategizer, `quickstart_rags` contains two strategy documents,
one per cluster. Both clusters get FullGraphRAG, each with its own entity schema:

| Partition | Strategy | Entity types |
|-----------|----------|--------------|
| `quickstart_physicists_0_a` | FullGraphRAG | `PHYSICIST`, `SCIENTIFIC_THEORY`, `INSTITUTE`, `NOBEL_PRIZE`, `MENTORSHIP`, and 6 more |
| `quickstart_chemists_0_a` | FullGraphRAG | `PERSON`, `CHEMICAL_ELEMENT`, `DISCOVERY`, `ACADEMIC_INSTITUTION`, `NOBEL_PRIZE`, and 7 more |

`quickstart_corpus_relations` gains one `INGESTED_AS` edge per cluster. To
count the edges of each kind in your own project, group them by label:

```aql
FOR e IN quickstart_corpus_relations
  COLLECT label = e.label WITH COUNT INTO n
  RETURN { label, n }
```

```json
[
  { "label": "HAS_CLUSTER", "n": 2 },
  { "label": "IN_DOMAIN", "n": 6 },
  { "label": "INGESTED_AS", "n": 2 }
]
```

After the Knowledge Graph build, five more collections exist:
`quickstart_Documents` (6), `quickstart_Chunks` (6), `quickstart_Entities`
(60), `quickstart_Communities` (4), and the edge collection
`quickstart_Relations` (125). They form the named graph `quickstart_kg`. The
chunk of `pauling.txt` looks like this:

```json
{
  "_id": "quickstart_Chunks/quickstart_chemists_0_a:7745226842599354226_2",
  "_key": "quickstart_chemists_0_a:7745226842599354226_2",
  "tokens": 51,
  "chunk_order_index": 0,
  "content": "Linus Pauling described the nature of the chemical bond and introduced the concept of electronegativity. ...",
  "import_number": 2,
  "partition_id": "quickstart_chemists_0_a",
  "embedding": []
}
```

The content is shortened here. The `embedding` is the chunk's embedding, a list
of 512 numbers. When you ask a question, retrieval creates an embedding for the
question and returns the chunks whose embeddings are closest to it.

From the key and the `partition_id`, you can tell that this chunk comes from
cluster 0 of the category `chemists`, that the cluster uses the FullGraphRAG
strategy (`_a`), and that it was written by the second import of the project.
In `quickstart_Relations`, the chunk has a `PART_OF` edge to its document and a
`MENTIONED_IN` edge from each of the 9 entities that it mentions, such as
`LINUS PAULING` (`person`), `ELECTRONEGATIVITY` (`concept`), and
`CALIFORNIA INSTITUTE OF TECHNOLOGY` (`academic_institution`). The entities connect to each other through `RELATED_TO`
edges and to their communities through `IN_COMMUNITY` edges.

## Per-cluster entity schema (entity_types)

For each FullGraphRAG cluster, the RAG Strategizer samples documents and asks an
LLM for the entity types that best describe them, typically 8 to 12. It stores
the list in the `entity_types` field of the cluster's `rags` document. In the
[example](#example-the-quickstart-project-with-two-categories):

- `physicists`: `PHYSICIST`, `SCIENTIFIC_THEORY`, `NOBEL_PRIZE`, `INSTITUTE`
- `chemists`: `PERSON`, `CHEMICAL_ELEMENT`, `NOBEL_PRIZE`, `ACADEMIC_INSTITUTION`

The entity schema is a list of type names derived from your documents. It is not
an ontology in the formal sense: the types have no definitions, hierarchy, or
rules, and they differ between clusters, projects, and runs. In the example,
people are `PHYSICIST` in one cluster and `PERSON` in the other.

The Importer passes the list to the LLM that extracts entities, so the entity
schema steers what the Knowledge Graph of the partition contains. It does not filter
out entities of other types: the Importer only does that when
`enable_strict_types` is on, and AutoGraph does not enable it. VectorRAG
clusters extract no entities, and their `entity_types` list is empty.

You can review and edit each cluster's entity schema before you build the Knowledge
Graph, either in the [web interface](web-interface.md#review-strategies) or with
[`PATCH /v1/rag-strategizer/strategy/{cluster_id}`](reference/rag-strategizer.md#update-a-cluster-strategy).

## Changing data later

Each kind of change rewrites a different part of the collections:

| Change | What it rewrites | How |
|--------|------------------|-----|
| Add a category | New `modules`, `sources`, `domains`, and `corpus_relations` documents for that category only | Build only the new category, with [Corpus Build](reference/corpus-build.md) |
| Add many files to a built category | The Corpus Graph documents of that category. The Knowledge Graph is not touched. | [Incremental build](reference/corpus-build.md#incremental-builds) |
| Add, remove, or replace a few files | The affected documents in all three layers. Existing clusters and partitions stay in place at first, but after enough changes AutoGraph flags a FullGraphRAG partition as needing to be [reorganized](incremental-graph-updates/divergence-and-reorganization.md). | [Incremental Graph Updates](incremental-graph-updates/_index.md) |
| Rebuild one category from scratch | Everything the category wrote, in all three layers | [Delete the category](reference/project-operations.md#delete-a-category), then build, strategize, and build the Knowledge Graph again |

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

Leaving files unlabeled only works in a project without named categories. Their
keys use the project name alone, without `default`, for example
`cluster_wiki_0`. See [Layer 1](#layer-1-categories).

| Scenario | Suggested categories |
|----------|----------------------|
| Product with docs, legal, and support content | `docs`, `legal`, `support` |
| Multi-language knowledge base, without cross-language similarity | `en`, `de`, `fr` |
| Single internal wiki | `default` |
| Regulated industry with strict data separation | One category per business unit |
| Documentation for several products or versions | One category per product or version |
| Biographies from different fields | One category per field, as in the [example](#example-the-quickstart-project-with-two-categories) |

Start with fewer categories and split later if answers mix unrelated domains.
Category labels end up in `_key` values and `module` fields across the
database, so choose names that do not change.
