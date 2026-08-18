---
title: Incremental Updates in the Importer
menuTitle: Incremental Updates
description: >-
  Rebuild the community layer of a Layer 3 partition without re-ingesting
  documents, and how documents are removed and replaced
weight: 55
---
After the initial build, the [Layer 3 knowledge
graph](architecture.md#knowledge-graph-collections) has to keep up with
documents that are added, removed, or replaced. It contains the documents,
chunks, entities, communities, and relationships that the Importer owns.

Apart from the import calls, the Importer offers one endpoint for this.
**Recluster** rebuilds the community layer of a single partition without
importing anything again. The Importer has **no** delete and **no** update
endpoint. Removing and replacing documents is handled by AutoGraph, see
[Deleting a document](#deleting-a-document) and
[Updating a document](#updating-a-document).

{{< info >}}
You normally do not call the recluster endpoint yourself. AutoGraph calls it as
part of [Incremental Graph
Updates](../autograph/incremental-graph-updates.md), which also maintains
Layers 1 and 2. Only call the Importer directly for standalone or advanced use
cases.

In Arango Contextual Data Platform 4.1.0, this is an **API-only** feature on
both sides. Neither this Importer endpoint nor AutoGraph's IGU endpoints are
available in the web interface.
{{< /info >}}

{{< warning >}}
An Importer replica can only run one import or recluster job at a time. The
import lock is a single global lock per replica and is not keyed by partition,
so any import blocks any recluster. While one job holds the lock, other calls
are rejected, and how they are rejected depends on the endpoint.
`/v1/recluster` returns `HTTP 503` (gRPC `UNAVAILABLE`), whereas the import
endpoints return `HTTP 200` with `"success": false` and a message that the
service is busy. Try again once the running job has finished. If a single-file
import holds the lock, there is no job to poll, so wait until the platform
service status shows that it is done. See
[Concurrency](architecture.md#asynchronous-import-lifecycle).
{{< /warning >}}

## Inserting a document

Inserting is a normal import into an existing `partition_id`:

- [`POST /v1/import`](importing-files.md#single-file-import) for a single file.
- [`POST /v1/import-multiple`](importing-files.md#multi-file-import) for one or
  more files. It returns a `job_id` that you can poll with
  [`GET /v1/jobs/{job_id}`](importing-files.md#monitoring-jobs).

The Importer builds the graph data for the files and writes `Documents`,
`Chunks`, `Entities`, `Communities`, and `Relations` to `{project}_kg`,
depending on the `rag_mode`. Every record gets the `partition_id` of the request
and an `import_number` that identifies the batch. If you import into the same
partition again, additional batches are created. Reclustering consolidates these
batches before it rebuilds the communities.

## Deleting a document

The Importer has **no** delete endpoint. Documents are removed from the
knowledge graph through AutoGraph, which cleans up Layers 1 and 2 as well as the
Layer 3 data of the document:

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/delete" >}}

Call it with the File Manager IDs in `file_ids`, or with `doc_names` as a
fallback, and the `category` the documents belong to. The call is synchronous and
removes the Layer 3 data as well, using AQL queries of its own. No Importer job
is spawned and there is nothing to poll: the response is the final result and
reports what was removed, along with the affected Layer 3 partitions. For the
request and response fields, see
[Delete documents](../autograph/reference/orchestration.md#delete-documents).

What a deletion removes from the Layer 3 collections of `{project}_kg`:

- The `Documents` vertices of the file
- `Chunks` that are left without a document
- `Entities` that are left without a `MENTIONED_IN` chunk
- `Communities` that are left empty, including parent communities that become
  empty through `SUB_COMMUNITY_OF`
- `SemanticUnits` that are left without a document
- The related `Relations` edges

Entities and communities that other files still use are kept. See
[Knowledge graph collections](architecture.md#knowledge-graph-collections) for
the collections involved.

A deletion leaves the community layer of a `full_graphrag` partition behind the
entities it now contains. AutoGraph recalculates the
[divergence](#divergence) of every affected partition and flags the ones that
should be [reclustered](#reclustering).

## Updating a document

The Importer has no endpoint for updating a document in place either. Replacing
the content of a document that is already in the graph is an AutoGraph
operation:

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/graph/update" >}}

It takes the new version from the File Manager by `file_id` and accepts no inline
content. It removes the old version, including its Layer 3 data, and adds the new
version to Layers 1 and 2. The new content only reaches Layer 3 once you run a
targeted orchestration with that `file_id`, which submits an import to the
Importer. AutoGraph resolves the partitions itself, so you do not name one. For the phases of an update and its response
fields, see
[Update documents](../autograph/reference/orchestration.md#update-documents).

{{< warning >}}
Do not import a revised file into a partition that still holds the old version.
`POST /v1/import` and `POST /v1/import-multiple` always add another import
batch, so you end up with duplicate content in the graph. Use
`POST /v1/graph/update` to replace a document.
{{< /warning >}}

## Divergence

The **divergence** shows how far the community layer of a `full_graphrag`
partition has drifted from its current entities and relationships after inserts,
deletes, and updates. It is calculated by **AutoGraph**, not by the Importer.
No Importer endpoint returns a divergence score.

If the divergence gets above the threshold of the partition, AutoGraph flags the
partition as needing a reclustering. It does **not** start one on its own. You
decide whether the refresh is worth the cost and then start it, which in turn
calls `POST /v1/recluster` for the affected `partition_id`. For the formula, the
threshold, and the lifecycle, see
[Partition divergence and reclustering](../autograph/incremental-graph-updates.md#partition-divergence-and-reclustering).

The divergence does not apply to `vector_rag` partitions because they have no
`Entities` or `Communities`.

## Reclustering

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/{serviceIdPostfix}/v1/recluster" >}}

Rebuilds the **community layer** of a single `full_graphrag` partition without
importing the documents again. The call is **asynchronous**. It returns a
`job_id` right away, and you can poll `GET /v1/jobs/{job_id}` until
`is_terminal` is `true`.

Only `full_graphrag` partitions have a community layer. A `vector_rag` partition
has no `Entities` or `Communities`, see [Knowledge graph
collections](architecture.md#knowledge-graph-collections), so there is nothing
to consolidate, cluster, or replace.

### Request

```json
{
  "partition_id": "legal_0_a"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `partition_id` | string | Yes | The partition whose community layer is rebuilt. |

{{< warning >}}
**Triton projects cannot be reclustered.** A recluster for a project that runs on
Triton is rejected before any work starts, with gRPC `FAILED_PRECONDITION`
(`HTTP 400`). No job is created, so there is nothing to poll, and there is no way
to rebuild the community layer of such a partition.
{{< /warning >}}

{{< info >}}
**A partition without entities is a successful no-op.** The job clusters `0`
entities into `0` communities and reports success. A terminal job is therefore
not evidence that anything was rebuilt. Check that the partition has `Entities`
before you read a completed job as a refreshed community layer.
{{< /info >}}

### What the Importer does

1. **Consolidate the batches, if needed.** If the partition has more than one
   import batch, or is not already a single batch with `import_number=1`, the
   Importer groups the entities whose names match after normalization and picks
   a winner. Names are compared with the surrounding quotes stripped, whitespace
   trimmed, and the rest upper-cased, so `"ACME Corp"` and `acme corp` end up in
   the same group. The winner is the entity with the most `RELATED_TO` edges to
   other entities. Ties are broken by the highest `import_number` and then by
   the entity `_key`, so the outcome is deterministic. Its content is kept as it
   is and moved to `import_number=1` if necessary. The other entity vertices are
   removed and their `RELATED_TO` and `MENTIONED_IN` edges are redirected to the
   winner. Self-references are removed and `RELATED_TO` edges that end up
   between the same two entities are folded into one.

   {{< warning >}}
   **Consolidation does not merge content.** The winner keeps its own
   `description` and embedding, and the descriptions and embeddings of the
   entities that are removed are discarded, not combined. The same is true on
   the edges: only `weight` and `source_id` accumulate when duplicate
   `RELATED_TO` edges are folded together, and `weight` is summed per distinct
   `source_id` rather than per edge. Nothing else on the edge is merged.
   {{< /warning >}}
2. **Load the graph.** The `Entities` and `RELATED_TO` edges of the partition
   are loaded into an in-memory graph, keyed by entity name, with the
   `source_id` rebuilt from `MENTIONED_IN`. Entities without a name are skipped
   without an error. Graphs that are not fully connected are accepted.
3. **Cluster and summarize.** The Leiden clustering runs and the community
   reports are generated, in the same way as during a full import.
4. **Swap in the new communities.** The old `Communities` and the community
   edges (`IN_COMMUNITY`, `SUB_COMMUNITY_OF`) are only replaced once the new
   ones are ready. New communities, embeddings, and cluster assignments for the
   entities are written with `import_number=1`.

**What is kept:** `Documents`, `Chunks`, `Entities`, and the relations that are
not community-related (`PART_OF`, `MENTIONED_IN`, `RELATED_TO`). Reclustering
updates which community an entity belongs to. It does not recreate the
relations that are kept.

### Duration and performance impact

Reclustering is not a full import. It skips the extraction of documents, chunks,
and entities, and only rebuilds the community layer. Most of the runtime goes
into **generating the community reports with the LLM**, which is the same work
as in the community stage of a full import, plus the optional consolidation and
the Leiden clustering.

- Expect longer jobs for partitions with many entities, relationships, or
  communities.
- Partitions with multiple batches need to be consolidated first.
- A reclustering holds the import lock for the whole job. Until it is done,
  further recluster calls return `HTTP 503` (gRPC `UNAVAILABLE`), and import
  calls return `"success": false`.
- The old communities are only removed once the new ones are ready, so if the
  job fails halfway through, the previous community layer is still there.

### HTTP example

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/<SERVICE_ID_POSTFIX>/v1/recluster \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "partition_id": "legal_0_a"
  }'
```

```json
{
  "success": true,
  "job_id": "<uuid>",
  "message": "Recluster started for partition legal_0_a. Use GET /v1/jobs/<uuid> to monitor progress."
}
```

## Troubleshooting

| Symptom | Likely cause | What to do |
|---------|--------------|------------|
| Recluster returns `HTTP 503` (gRPC `UNAVAILABLE`), or an import returns `"success": false` | Another import or recluster job holds the single global lock on this replica, whichever partition it works on | Try again once the running job is done (`GET /v1/jobs/{job_id}` or `GET /v1/jobs`). If a **single-file** import (`POST /v1/import`) holds the lock, there is no `job_id` to poll. Watch the platform service status or `GET /v1/health` for the busy message until it clears |
| An update left duplicate content in the graph | The revised file was imported instead of replaced, so it was added as another import batch next to the old version | Use [`POST /v1/graph/update`](../autograph/reference/orchestration.md#update-documents) in AutoGraph to replace a document |
| Communities look outdated after inserts, deletions, or updates | The community layer of a `full_graphrag` partition has not been rebuilt yet | Reclustering is never automatic. Start it in AutoGraph once it reports `needs_reclustering: true`, or call `POST /v1/recluster` for that `partition_id` yourself |
| A reclustering takes a long time and blocks other work | The LLM community reports take a while and the lock is held for the whole job | This is expected for large partitions. Avoid overlapping calls on the same replica until the recluster job is done |
| Recluster is rejected with gRPC `FAILED_PRECONDITION` (`HTTP 400`) | The project runs on Triton | Triton projects cannot be reclustered. There is nothing to retry and no job to poll |
| A recluster job reached a terminal state but the communities are unchanged | The partition has no entities, so the job was a no-op over `0` entities | Confirm that the partition has `Entities`. If it does not, import documents into it first |

## Next steps

- **[Incremental Graph Updates in AutoGraph](../autograph/incremental-graph-updates.md)**:
  The workflow that inserts, deletes, updates, and reclusters documents across
  all three layers.
- **[Architecture](architecture.md)**: The knowledge graph collections and the
  lifecycle of asynchronous jobs.
- **[Import Files](importing-files.md)**: Single-file and multi-file import
  workflows.
- **[Error Handling](reference/error-handling.md)**: Synchronous error codes and
  markers for asynchronous failures.
