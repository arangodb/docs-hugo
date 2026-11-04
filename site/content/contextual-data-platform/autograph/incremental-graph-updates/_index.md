---
title: Incremental Graph Updates in AutoGraph
menuTitle: Incremental Graph Updates
weight: 25
description: >-
  Add, remove, and replace documents in the existing categories of an AutoGraph
  knowledge graph without rebuilding it
---
{{< tag "Agentic AI Suite" >}}

**Incremental Graph Updates (IGU)** let you add, remove, and replace documents
in the **existing categories** of a knowledge graph that is already built,
without rebuilding it. Only the documents that changed are processed: the
[corpus build](../reference/corpus-build.md) and the
[RAG Strategizer](../reference/rag-strategizer.md) do not run again, and the
rest of the category stays as it is. This makes everyday document changes much
cheaper and faster than a rebuild.

{{< info >}}
**IGU is API-only in Arango Contextual Data Platform 4.1.0.** You can add,
remove, replace, and reorganize documents through the
[HTTP endpoints](api-reference.md) only. The
[web interface](../web-interface.md) does not offer these operations in this
release.
{{< /info >}}

{{< warning >}}
**IGU only works in categories that already exist.** Every document you add
goes into an existing category, and every document you remove or replace has to
be in an existing category already. IGU cannot create a category. To add a new
category, run the full build for it: a
[corpus build](../reference/corpus-build.md), the
[RAG Strategizer](../reference/rag-strategizer.md), and a
[knowledge graph build](../reference/orchestration.md).
{{< /warning >}}

To get started right away, see the [Quick Start](quick-start.md). For the
endpoints, requests, and responses, see the [API Reference](api-reference.md).

## Terms and legend

The diagrams on these pages use the following symbols:

{{< embed-svg "AutoGraph-IGU-Legend" "The symbols used in the Incremental Graph Updates diagrams: documents and similarity edges in the corpus graph, entities, relationships, and communities in the knowledge graph." >}}

The pages use the following terms:

| Term | Meaning |
|------|---------|
| **Category** | A group of documents that you defined when you first built the project, for example `legal` or `engineering`. IGU works inside existing categories only. |
| **Document** | One file in the [File Manager](../../file-manager/api.md#upload-a-rag-input-file), identified by its `file_id`. |
| **Corpus graph** | The map of your documents: which documents are similar to each other (**similarity edges**) and which cluster each one belongs to. It does not contain what the documents say. |
| **Cluster** | A group of similar documents within a category. Each cluster has a retrieval strategy, which the RAG Strategizer assigned to it. |
| **Knowledge graph** | What the documents are about: the **entities** (people, products, contracts, and so on) found in the documents, and the **relationships** between them. |
| **Partition** | The part of the knowledge graph that is built from one cluster. In the API, it is identified by its `rag_partition_id`. |
| **Community** | A group of closely related entities, with a summary of what they have in common. Only partitions with the FullGraphRAG strategy have communities. |
| **Knowledge graph build** | The step that reads documents, extracts their entities and relationships, and adds them to the knowledge graph. In the API, it is `POST /v1/orchestrate`. |
| **Divergence** | How much the entities of a partition have changed since its communities were last organized, from 0% to 100%. See [Divergence and Reorganization](divergence-and-reorganization.md). |
| **Reorganize** | Rebuild the communities of a partition from its current entities. In the API, this is called **recluster**. |

## Operations

IGU has four operations. The API uses its own names for them:

| Operation | API name | What it does | Corpus graph | Knowledge graph |
|-----------|----------|--------------|--------------|-----------------|
| [Add](#add-documents) | insert | Adds new documents to an existing category | The documents join the closest existing cluster | Added afterwards, by a knowledge graph build that you start |
| [Remove](#remove-documents) | delete | Removes documents that are in an existing category | The documents are removed | Their entities are removed first, in the same call |
| [Replace](#replace-documents) | update | Replaces documents that are in an existing category with a new version | The old version is removed and the new one is added | The old entities are removed. The new ones are added afterwards, by a knowledge graph build that you start |
| [Reorganize](#reorganize-the-knowledge-graph) | recluster | Rebuilds the communities of a partition that has changed a lot | Not touched | The communities of the partition are rebuilt |

Existing clusters and strategies are kept: a new document joins the cluster that
is closest to it, so the category does not have to be clustered again. IGU
cannot change the strategy of a cluster or add new strategies. See
[Architecture](../architecture.md) for the full data model.

### Add documents

Adding puts documents that are not in the graph yet into an **existing
category**. AutoGraph stores each document, links it to the most similar
documents with similarity edges, and assigns it to the closest existing
cluster. The document gets the strategy of that cluster, so the RAG Strategizer
does not run again.

{{< embed-svg "AutoGraph-IGU-Insert" "Adding attaches new documents to the existing corpus graph of the category. The documents that were already there are not processed again." >}}

You get a response as soon as the documents are in the corpus graph. They are
not in the knowledge graph yet: to add them, start a
[knowledge graph build](api-reference.md#build-the-knowledge-graph-for-changed-documents)
with the `file_id` values of the added documents.

### Remove documents

Removing deletes documents that are **already in an existing category**,
together with everything that was built from them. AutoGraph removes their
entities from the knowledge graph first, and then removes the documents, their
similarity edges, and their cluster membership from the corpus graph. The other
documents are not touched.

{{< embed-svg "AutoGraph-IGU-Delete" "Removing deletes the selected documents and every edge attached to them. The other documents stay as they are." >}}

The response is the final result, so there is nothing to wait for and no
knowledge graph build to run afterwards.

### Replace documents

Replacing swaps documents that are **already in an existing category** for a
new version. It removes the old version and then adds the new one:

1. AutoGraph removes the entities of the old version from the knowledge graph.
2. AutoGraph removes the old version from the corpus graph.
3. AutoGraph adds the new version to the corpus graph, links it to the most
   similar documents again, and assigns it to the closest cluster.

{{< embed-svg "AutoGraph-IGU-Update" "Replacing keeps the document but processes its new content, so its similarity edges and possibly its cluster change." >}}

Replacing runs in the background. The response only confirms that it has
started. Once it is done, start a
[knowledge graph build](api-reference.md#build-the-knowledge-graph-for-changed-documents)
so that the knowledge graph contains the new version.

### Add or replace?

| | Add | Replace |
|--|-----|---------|
| **Use if** | The document is **not** in the category yet | The document **is already in the category** and you have a new version of it |
| **Knowledge graph** | Start a knowledge graph build afterwards | Start a knowledge graph build afterwards for the new version |
| **Wrong choice** | Adding a document that is already in the category creates a duplicate | Replacing a document that is not in the category fails, and nothing is changed |

{{< warning >}}
Adding is not a safe way to replace a document. If you add a new version
instead of replacing the old one, the old version stays in the graph next to
the new one.
{{< /warning >}}

### Reorganize the knowledge graph

In a partition with the FullGraphRAG strategy, the entities are grouped into
communities, and each community has a summary. Adding, removing, and replacing
documents changes the entities but not the communities, so the communities and
their summaries slowly drift out of date. **Reorganizing** groups the entities
again, based on what the partition contains now.

{{< embed-svg "AutoGraph-IGU-Reorganization" "Adding, removing, and replacing documents changes the entities but not the communities. Once a partition has changed a lot, reorganizing rebuilds its communities: they can grow, split, or shrink." >}}

Reorganizing is expensive, so it does not run after every change. Instead,
AutoGraph tracks the **divergence** of every partition: how much of it has
changed since it was last organized. Once the divergence is above 25%, the
partition is flagged as needing to be reorganized. AutoGraph never reorganizes
on its own: you decide when it is worth the cost. See
[Divergence and Reorganization](divergence-and-reorganization.md).

## When to use IGU

Use IGU to add, remove, or replace documents in an **existing category**, as
long as the change is small compared to what the category already holds. A
batch of documents is fine. A large change drives up the
[divergence](divergence-and-reorganization.md) and leads to a costly
reorganization.

In all other cases, use one of the following instead:

| Situation | Use instead |
|-----------|-------------|
| No knowledge graph exists yet | The [standard workflow](../reference/_index.md#standard-workflow) |
| A new category | The full build for that category: a [corpus build](../reference/corpus-build.md) with `incremental: false`, the RAG Strategizer, and a knowledge graph build |
| Many new documents for an existing category | An [incremental corpus build](../reference/corpus-build.md#incremental-builds) with `incremental: true` |
| A category has to be built again, for example because of wrong embeddings or clusters | [Delete the category](../reference/project-operations.md#delete-category), then run the full build for it again |
| Only vectors on an existing collection | [`POST /v1/embed-field-in-collection`](../reference/embeddings.md) |
