---
title: Incremental Updates in the Importer
menuTitle: Incremental Updates
description: >-
  Delete Layer 3 knowledge graph data for individual files and rebuild the
  community layer of a partition without re-ingesting documents
weight: 55
---
After the initial build, the [Layer 3 knowledge
graph](architecture.md#knowledge-graph-collections) has to keep up with
documents that are added, removed, or replaced. It contains the documents,
chunks, entities, communities, and relationships that the Importer owns. Apart
from the import calls, the Importer offers two endpoints for this. **Delete**
removes the knowledge graph data of a file, and **recluster** rebuilds the
community layer of a single partition without importing anything again.

{{< info >}}
You normally do not call these endpoints yourself. AutoGraph calls them as part
of [Incremental Graph
Updates](../autograph/incremental-graph-updates.md), which also maintains
Layers 1 and 2. Only call the Importer directly for standalone or advanced use
cases.

In Arango Contextual Data Platform 4.1.0, this is an **API-only** feature on
both sides. Neither these Importer endpoints nor AutoGraph's IGU endpoints are
available in the web interface.
{{< /info >}}

There is **no** dedicated update endpoint. Insert and delete are available as
operations, and an update is a combination of the two. See
[Updating a document](#updating-a-document).

{{< warning >}}
An Importer replica can only run one import, delete, or recluster job at a time.
While one of them holds the import lock, other calls are rejected, and how they
are rejected depends on the endpoint. `/v1/delete` and `/v1/recluster` return
`UNAVAILABLE`, whereas the import endpoints return `HTTP 200` with
`"success": false` and a message that the service is busy. Try again once the
running job has finished. If a single-file import holds the lock, there is no
job to poll, so wait until the platform service status shows that it is done.
See [Concurrency](architecture.md#asynchronous-import-lifecycle).
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

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/{serviceIdPostfix}/v1/delete" >}}

Removes the Layer 3 data of a file from `{project}_kg`. AutoGraph calls this
after it has cleaned up Layer 1 and Layer 2.

The call is **asynchronous**. It returns a `job_id` right away and the deletion
runs in the background. Poll
[`GET /v1/jobs/{job_id}`](importing-files.md#monitoring-jobs) until
`is_terminal` is `true`. For delete jobs, the result is in
**`job.delete_result`**, not in the immediate response.

### Request

```json
{
  "partition_id": "legal_0_a",
  "file_ids": ["rag-input-..."],
  "doc_names": ["report.pdf"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `partition_id` | string | Yes | The Layer 3 partition to delete from. It has to exist and is matched against the `partition_id` field of the vertices and edges. |
| `file_ids` | string[] | Yes | The File Manager IDs to delete, matched against the `Documents.file_ids` list. |
| `doc_names` | string[] | No | A fallback based on file names, parallel to `file_ids`. If `file_ids[i]` matches no document, then `doc_names[i]` is matched against `Documents.file_name`. One of the two can be empty, but not both. |

**Resolution order:** Each file is looked up by ID first and by `file_name`
only if that fails. `Documents.file_ids` is a **list** with a persistent array
index, so a document matches if the requested ID is anywhere in that list. The
fallback to the name is useful for documents that were imported before file IDs
were stored. See [Documents](architecture.md#documents) for the fields involved.

{{< warning >}}
**Either all files are deleted or none.** If one of the requested files is not
in the partition, the job fails and **nothing** is deleted. Missing files are
reported as `FILE_NOT_FOUND` and the other files of the batch report `ERROR`
("not deleted").
{{< /warning >}}

### What is removed

For every file, the Importer removes the following:

- The `Documents` vertices of the file
- `Chunks` that are left without a document
- `Entities` that are left without a `MENTIONED_IN` chunk
- `Communities` that are left empty, including parent communities that become
  empty through `SUB_COMMUNITY_OF`
- `SemanticUnits` that are left without a document
- The related `Relations` edges

Entities and communities that other files still use are kept.

The status of each file is `SUCCESS`, `PARTITION_NOT_FOUND`, `FILE_NOT_FOUND`,
or `ERROR`.

### Polling a delete job

Start the deletion and note down the `job_id`:

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/<SERVICE_ID_POSTFIX>/v1/delete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "partition_id": "legal_0_a",
    "file_ids": ["rag-input-..."],
    "doc_names": ["report.pdf"]
  }'
```

The immediate response only confirms that the job has started:

```json
{
  "job_id": "<uuid>",
  "success": true,
  "message": "Delete started. Use GET /v1/jobs/<uuid> to monitor progress."
}
```

Poll until `is_terminal` is `true`:

```bash
curl -sS "https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/<SERVICE_ID_POSTFIX>/v1/jobs/<uuid>" \
  -H "Authorization: Bearer <your-jwt-token>"
```

The final response contains the result in `job.delete_result`:

```json
{
  "success": true,
  "job": {
    "job_id": "<uuid>",
    "created_at": "...",
    "files": ["rag-input-..."],
    "files_count": 1,
    "is_terminal": true,
    "current_status": {
      "status": "service_completed",
      "progress": 100,
      "message": "Deleted N document(s), ..."
    },
    "status_history": [],
    "delete_result": {
      "job_id": "<uuid>",
      "success": true,
      "results": [
        {
          "file_id": "rag-input-...",
          "status": "SUCCESS",
          "documents_removed": 1
        }
      ],
      "documents_removed": 1,
      "chunks_removed": 12
    }
  }
}
```

`delete_result` contains the result for each file as well as the totals for the
batch in `documents_removed`, `chunks_removed`, `entities_removed`,
`communities_removed`, `semantic_units_removed`, and `edges_removed`.

{{< warning >}}
Do not treat the response of `POST /v1/delete` as the final result. It contains
no results for the individual files, only `job_id`, `success`, and `message`.
Its `success: true` means that the job has been **accepted**, not that anything
has been deleted. The results for the individual files are only available in
`job.delete_result.results` once the job has finished.
{{< /warning >}}

## Updating a document

The Importer has no endpoint for updating a document in place. To replace the
content of a document in Layer 3, do the following:

1. **Delete** the old file with `POST /v1/delete`, using the same
   `partition_id` and the file ID and/or name. Note down the returned `job_id`.
2. **Poll** `GET /v1/jobs/{job_id}` until the delete job has **finished
   successfully**. Do not continue if the job failed.
3. **Import** the new version with `POST /v1/import` or
   `POST /v1/import-multiple` into the **same** `partition_id`.

Deleting and then importing is the supported way to update a document. The
deletion holds the import lock until it is done, so an import that you start
before the delete job has finished is rejected with `HTTP 200` and
`"success": false`.

{{< warning >}}
If you import a revised file **without** deleting the old one first, you create
another import batch next to the existing document and end up with duplicate
content in the graph. Always delete first if you want to replace a document.
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

### What the Importer does

1. **Consolidate the batches, if needed.** If the partition has more than one
   import batch, or is not already a single batch with `import_number=1`, the
   Importer groups the entities that share a name and picks a winner. The winner
   is the entity with the most `RELATED_TO` edges to other entities, and if
   there is a tie, the one with the highest `import_number`. Its content is kept
   as it is and moved to `import_number=1` if necessary. The other entity
   vertices are removed and their `RELATED_TO` and `MENTIONED_IN` edges are
   redirected to the winner. Self-references are removed and duplicate
   `RELATED_TO` edges are merged.
2. **Load the graph.** The `Entities` and `RELATED_TO` edges of the partition
   are loaded into an in-memory graph, keyed by entity name, with the
   `source_id` rebuilt from `MENTIONED_IN`. Graphs that are not fully connected
   are accepted.
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
  delete and recluster calls return `UNAVAILABLE`, and import calls return
  `"success": false`.
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
| Delete or recluster returns `UNAVAILABLE`, or an import returns `"success": false` | Another import, delete, or recluster job holds the lock on this replica | Try again once the running job is done (`GET /v1/jobs/{job_id}` or `GET /v1/jobs`). If a **single-file** import (`POST /v1/import`) holds the lock, there is no `job_id` to poll. Watch the platform service status or `GET /v1/health` for the busy message until it clears |
| A delete job failed and nothing was removed | At least one of the requested files is not in the partition | Check `delete_result.results` for `FILE_NOT_FOUND`, then correct the IDs or names, or remove the missing entries, and try again |
| `FILE_NOT_FOUND` when deleting by file ID | The document was imported before file IDs were stored, or the ID does not match | Use `doc_names` as a fallback, or check the `Documents.file_ids` list (see [Documents](architecture.md#documents)) |
| An update left duplicate content in the graph | The import ran without deleting first, or started before the deletion was done | Delete, poll until the job has finished successfully, then import into the same `partition_id` |
| An import during a running delete is rejected as busy | The deletion holds the import lock until its background task is done | Poll the delete `job_id` until `is_terminal`, then try the import again |
| Communities look outdated after inserts or deletes | The community layer of a `full_graphrag` partition has not been rebuilt yet | Reclustering is never automatic. Start it in AutoGraph once it reports `needs_reclustering: true`, or call `POST /v1/recluster` for that `partition_id` yourself |
| A reclustering takes a long time and blocks other work | The LLM community reports take a while and the lock is held for the whole job | This is expected for large partitions. Avoid overlapping calls on the same replica until the recluster job is done |

## Next steps

- **[Incremental Graph Updates in AutoGraph](../autograph/incremental-graph-updates.md)**:
  The workflow that uses these endpoints.
- **[Architecture](architecture.md)**: The knowledge graph collections and the
  lifecycle of asynchronous jobs.
- **[Import Files](importing-files.md)**: Single-file and multi-file import
  workflows.
- **[Error Handling](reference/error-handling.md)**: Synchronous error codes and
  markers for asynchronous failures.
