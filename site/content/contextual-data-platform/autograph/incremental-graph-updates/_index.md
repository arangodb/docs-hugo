---
title: Incremental Graph Updates in AutoGraph
menuTitle: Incremental Graph Updates
weight: 25
description: >-
  Add, remove, and replace documents in the existing categories of an AutoGraph
  knowledge graph without rebuilding it
---
{{< tag "Agentic AI Suite" >}}

With **Incremental Graph Updates (IGU)**, you add, remove, and replace documents
in the existing categories of a knowledge graph that is already built. IGU
changes the corpus graph and the knowledge graph directly, and only for the
documents that changed. The [corpus build](../reference/corpus-build.md) and
the [RAG Strategizer](../reference/rag-strategizer.md) do not run again, and
the rest of the category stays as it is. This makes small changes much cheaper
and faster than a rebuild.

{{< info >}}
**IGU is API-only in Arango Contextual Data Platform 4.1.x.** You can add,
remove, replace, and reorganize documents through the
[HTTP endpoints](api-reference.md) only. The
[web interface](../web-interface.md) does not offer these operations in this
release.
{{< /info >}}

{{< warning >}}
**IGU only works in categories that already exist.** Every document you add
goes into an existing category, and every document you remove or replace has to
be in an existing category already. IGU cannot create a category. To add a new
category, run a [corpus build](../reference/corpus-build.md), the
[RAG Strategizer](../reference/rag-strategizer.md), and a
[knowledge graph build](../reference/orchestration.md) for it.
{{< /warning >}}

To get started, see the [Quick Start](quick-start.md). For the requests and
responses, see the [API Reference](api-reference.md).

## Operations

An AutoGraph project has two graphs, and IGU updates both of them:

- The **corpus graph** is a map of your documents. It shows which documents are
  similar to each other (similarity edges), and which **cluster** of similar
  documents each one belongs to. Each cluster has a retrieval strategy.
- The **knowledge graph** contains the **entities** found in the documents,
  such as people, products, or contracts, and the **relationships** between
  them. The part of the knowledge graph that is built from one cluster is a
  **partition**.

IGU has four operations. The API uses its own names for them.

| Operation | API name | What it does | Corpus graph | Knowledge graph |
|-----------|----------|--------------|--------------|-----------------|
| [Add](#add-documents) | insert | Adds new documents to an existing category | The documents join the closest existing cluster | Added afterwards, by a knowledge graph build that you start |
| [Remove](#remove-documents) | delete | Removes documents that are in an existing category | The documents are removed | Their entities are removed first, in the same call |
| [Replace](#replace-documents) | update | Replaces documents that are in an existing category with a new version | The old version is removed and the new one is added | The old entities are removed. The new ones are added afterwards, by a knowledge graph build that you start |
| [Reorganize](#reorganize-the-knowledge-graph) | recluster | Rebuilds the communities of a partition that has changed a lot | Not changed | The communities of the partition are rebuilt |

### Add documents

Adding puts new documents into an existing category. You upload the documents
to the File Manager and send their `file_id` values to
[`POST /v1/graph/insert`](api-reference.md#add-documents). AutoGraph stores each
document, links it to the most similar documents with similarity edges, and
assigns it to the closest existing cluster. The document gets the strategy of
that cluster, so the RAG Strategizer does not run again.

{{< embed-svg "AutoGraph-IGU-Insert" "Adding attaches new documents to the existing corpus graph of the category. The documents that were already there are not processed again." >}}

You get a response as soon as the documents are in the corpus graph. To add
them to the knowledge graph, start a
[knowledge graph build](api-reference.md#build-the-knowledge-graph-for-changed-documents)
with the `file_id` values of the added documents. The build reads the documents,
extracts their entities and relationships, and adds them to the knowledge
graph.

### Remove documents

Removing deletes documents from an existing category, together with everything
that was built from them. You send their `file_id` values or file names to
[`POST /v1/graph/delete`](api-reference.md#remove-documents). AutoGraph
removes their entities from the knowledge graph first. Then it removes the
documents, their similarity edges, and their cluster membership from the corpus
graph. The other documents do not change.

{{< embed-svg "AutoGraph-IGU-Delete" "Removing deletes the selected documents and every edge attached to them. The other documents stay as they are." >}}

The response is the final result. You do not need to wait or run a knowledge
graph build afterwards.

### Replace documents

Replacing swaps documents in an existing category for a new version. You
upload the new version to the File Manager under the same name and send its
`file_id` to [`POST /v1/graph/update`](api-reference.md#replace-documents).
AutoGraph removes the old version and then adds the new one:

1. AutoGraph removes the entities of the old version from the knowledge graph.
2. AutoGraph removes the old version from the corpus graph.
3. AutoGraph adds the new version to the corpus graph, links it to the most
   similar documents again, and assigns it to the closest cluster.

{{< embed-svg "AutoGraph-IGU-Update" "Replacing keeps the document but processes its new content, so its similarity edges and possibly its cluster change." >}}

Replacing runs in the background, and the response only confirms that it has
started. Once it is done, start a
[knowledge graph build](api-reference.md#build-the-knowledge-graph-for-changed-documents)
to add the new version to the knowledge graph.

### Add or replace?

| | Add | Replace |
|--|-----|---------|
| Use if | The document is not in the category yet | The document is already in the category, and you have a new version of it |
| Knowledge graph | Start a knowledge graph build afterwards | Start a knowledge graph build afterwards for the new version |
| Wrong choice | Adding a document that is already in the category creates a duplicate | Replacing a document that is not in the category fails, and nothing changes |

{{< warning >}}
Do not add a new version of a document instead of replacing it. The old version
stays in the graph next to the new one.
{{< /warning >}}

### Reorganize the knowledge graph

In a partition with the FullGraphRAG strategy, closely related entities form
**communities**, and each community has a summary of what its entities have in
common. Adding, removing, and replacing documents changes the entities but not
the communities, so the communities and their summaries become out of date.
**Reorganizing** groups the entities again, based on what the partition
contains now.

{{< embed-svg "AutoGraph-IGU-Reorganization" "Adding, removing, and replacing documents changes the entities but not the communities. Once a partition has changed a lot, reorganizing rebuilds its communities. They can grow, split, or shrink." >}}

Reorganizing is expensive, so it does not run after every change. AutoGraph
tracks how much each partition has changed since it was last organized, as its
**divergence**. If the divergence is above 25%, AutoGraph flags the partition.
It never reorganizes on its own. You decide when, and start it with
[`POST /v1/graph/recluster`](api-reference.md#reorganize-partitions). See
[Divergence and Reorganization](divergence-and-reorganization.md).

## Clusters and strategies do not change

IGU works with the clusters and strategies from the last full build. It does
not cluster the category again or run the RAG Strategizer, which keeps it fast.
This has downsides:

- A new document always joins the existing cluster it is most similar to, even
  if it does not fit that cluster well. A full build might have put it into a
  cluster of its own. Documents on a new topic can end up next to unrelated
  content, which can make answers about them less accurate.
- The document gets the strategy of that cluster. If the cluster uses
  VectorRAG, no entities and relationships are extracted from it. If the
  cluster uses FullGraphRAG, only the entity types chosen for that cluster are
  extracted, so new kinds of entities can be missed.
- If no existing cluster is similar enough, or the cluster has no strategy yet,
  the document is added to the corpus graph only. It does not reach the
  knowledge graph. The response of the
  [add request](api-reference.md#add-documents) then has an empty
  `cluster_key` or `rag_partition_id`.
- The communities become out of date, see
  [Reorganize the knowledge graph](#reorganize-the-knowledge-graph).

IGU cannot change the strategy of a cluster or add strategies. If a category
has changed a lot, or new documents cover new topics, build the category again,
see [When to use IGU](#when-to-use-igu). For the full data model, see
[Architecture](../architecture.md).

## When to use IGU

Use IGU for changes that are small compared to the size of the category. A
batch of documents is fine. A large change raises the
[divergence](divergence-and-reorganization.md) and leads to an expensive
reorganization.

In other cases, use one of the following:

| Situation | Use instead |
|-----------|-------------|
| No knowledge graph exists yet | The [standard workflow](../reference/_index.md#standard-workflow) |
| A new category | A [corpus build](../reference/corpus-build.md) with `incremental: false` for the new category, the RAG Strategizer, and a knowledge graph build |
| Many new documents for an existing category | An [incremental corpus build](../reference/corpus-build.md#incremental-builds) with `incremental: true` |
| A category has to be built again, for example because of wrong embeddings or clusters | [Delete the category](../reference/project-operations.md#delete-category), then build it again |
| Only vectors on an existing collection | [`POST /v1/embed-field-in-collection`](../reference/embeddings.md) |
