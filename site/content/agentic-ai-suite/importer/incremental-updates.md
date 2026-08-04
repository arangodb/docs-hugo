---
title: Incremental Updates in the Importer
menuTitle: Incremental Updates
description: >-
  Delete Layer 3 knowledge graph data for individual files and rebuild the
  community layer of a partition without re-ingesting documents
weight: 55
---
After the initial build, the [Layer 3 knowledge
graph](architecture.md#knowledge-graph-collections) - the documents, chunks,
entities, communities, and relationships the Importer owns - has to keep up with
documents that are added, removed, or replaced. The Importer provides two
endpoints for this beyond the import calls: **delete** removes a file's
knowledge-graph artifacts, and **recluster** rebuilds the community layer of a
single partition without re-ingesting anything.

{{< info >}}
Under normal operation you do not call these endpoints directly. AutoGraph
drives them as part of
[Incremental Graph Updates](../autograph/incremental-graph-updates.md), which
also maintains Layers 1 and 2. Call the Importer yourself only for standalone
or advanced scenarios.
{{< /info >}}

There is **no** dedicated update endpoint. Insert and delete are first-class
operations; an update is composed from them. See
[Updating a document](#updating-a-document).

{{< warning >}}
Import, delete, and recluster jobs on a given Importer replica are
**single-flight**. While one of them holds the import lock, a concurrent
import, delete, or recluster returns `UNAVAILABLE`. Retry once the running job
has reached a terminal state.
{{< /warning >}}

## Inserting a document

Inserting is a normal import into an existing `partition_id`:

- [`POST /v1/import`](importing-files.md#single-file-import) for a single file.
- [`POST /v1/import-multiple`](importing-files.md#multi-file-import) for one or
  more files. Returns a `job_id` you poll through
  [`GET /v1/jobs/{job_id}`](importing-files.md#monitoring-jobs).

The Importer builds the graph artifacts for the files and writes `Documents`,
`Chunks`, `Entities`, `Communities`, and `Relations` (depending on `rag_mode`)
into `{project}_kg`, stamped with the request's `partition_id` and an
`import_number` that identifies the batch. Repeated imports into the same
partition create additional batches; reclustering consolidates those batches
before rebuilding the communities.

## Deleting a document

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/{serviceIdPostfix}/v1/delete" >}}

Removes a file's Layer 3 artifacts from `{project}_kg`. AutoGraph's delete
orchestration calls this after its own Layer 1 and Layer 2 cleanup.

The call is **asynchronous**: it returns a `job_id` immediately and the delete
runs in the background. Poll
[`GET /v1/jobs/{job_id}`](importing-files.md#monitoring-jobs) until
`is_terminal` is `true`. For delete jobs the outcome lives in
**`job.deleteResult`** (`delete_result` in the protobuf), not in the immediate
acknowledgement.

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
| `partition_id` | string | Yes | Layer 3 partition to scope the delete to. Must exist; matched against the `partition_id` field on vertices and edges. |
| `file_ids` | string[] | Yes | File Manager ids to delete, matched against `Documents.file_id`. |
| `doc_names` | string[] | No | File-name fallback, parallel to `file_ids`. When `file_ids[i]` matches no document, `doc_names[i]` is matched against `Documents.file_name`. Either side of a pair may be empty, but not both. |

**Resolution order:** each file is resolved by `file_id` first, then by
`file_name` if needed. The fallback is useful for documents imported before
`file_id` stamping was introduced. See
[Documents](architecture.md#documents) for the fields involved.

{{< warning >}}
**The existence check is atomic.** If any requested file is missing from the
partition, the job fails and **nothing** is deleted. Missing files are reported
as `FILE_NOT_FOUND`; the remaining files in that batch report `ERROR`
("not deleted").
{{< /warning >}}

### What is removed

Per file, the Importer removes:

- The `Documents` vertices for that file.
- Orphaned `Chunks`.
- Orphaned `Entities` - those left without a surviving `MENTIONED_IN` chunk.
- Orphaned `Communities`, including parent communities left empty through
  `SUB_COMMUNITY_OF`.
- Orphaned `SemanticUnits`.
- The related `Relations` edges.

Entities and communities that are still used by other files are kept.

Per-file status values: `SUCCESS`, `PARTITION_NOT_FOUND`, `FILE_NOT_FOUND`,
`ERROR`.

### Polling a delete job

Start the delete and capture the `job_id`:

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

The immediate response only acknowledges the job:

```json
{
  "job_id": "<uuid>",
  "success": true,
  "message": "Delete started. Use GET /v1/jobs/<uuid> to monitor progress."
}
```

Poll until `isTerminal` is `true`:

```bash
curl -sS "https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/<SERVICE_ID_POSTFIX>/v1/jobs/<uuid>" \
  -H "Authorization: Bearer <your-jwt-token>"
```

The terminal response carries the outcome in `job.deleteResult` (the
gRPC-gateway JSON uses camelCase):

```json
{
  "success": true,
  "job": {
    "jobId": "<uuid>",
    "createdAt": "...",
    "files": ["rag-input-..."],
    "filesCount": 1,
    "isTerminal": true,
    "currentStatus": {
      "status": "service_completed",
      "progress": 100,
      "message": "Deleted N document(s), ..."
    },
    "statusHistory": [],
    "deleteResult": {
      "jobId": "<uuid>",
      "success": true,
      "results": [
        {
          "fileId": "rag-input-...",
          "status": "SUCCESS",
          "documentsRemoved": 1
        }
      ],
      "documentsRemoved": 1,
      "chunksRemoved": 12
    }
  }
}
```

`deleteResult` holds the per-file receipts and the batch aggregates
`documentsRemoved`, `chunksRemoved`, `entitiesRemoved`, `communitiesRemoved`,
`semanticUnitsRemoved`, and `edgesRemoved`.

{{< warning >}}
Do not treat the `POST /v1/delete` acknowledgement as the final outcome. Its
`results` array is empty; the populated result is only available from the job
status once the job is terminal.
{{< /warning >}}

## Updating a document

The Importer does not expose an in-place update endpoint. To replace a
document's content in Layer 3:

1. **Delete** the old file with `POST /v1/delete`, using the same
   `partition_id` and the file id and/or name. Capture the returned `job_id`.
2. **Poll** `GET /v1/jobs/{job_id}` until the delete job reaches **terminal
   success**. Do not continue if the job failed.
3. **Import** the new version with `POST /v1/import` or
   `POST /v1/import-multiple` into the **same** `partition_id`.

That delete-then-import sequence is the supported update path. Because the
delete holds the import lock until it finishes, calling import before the
delete job is terminal returns `UNAVAILABLE`.

{{< warning >}}
Importing a revised file **without** deleting the old one first creates another
import batch alongside the previous document, which leaves duplicate content in
the graph. Always delete first when you intend to replace.
{{< /warning >}}

## Divergence

**Divergence** measures how far a partition's community layer has drifted from
its current entity and relationship graph after inserts, deletes, and updates.
It is computed and interpreted by **AutoGraph**, not by the Importer - no
Importer endpoint returns a divergence score.

When AutoGraph determines that divergence is high enough for community reports
and memberships to be stale, it triggers a recluster of the affected
`partition_id` on the Importer. For the formula, the threshold, and the
lifecycle, see
[Partition divergence and reclustering](../autograph/incremental-graph-updates.md#partition-divergence-and-reclustering).

## Reclustering

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/{serviceIdPostfix}/v1/recluster" >}}

Rebuilds the **community layer** of a single partition without re-ingesting
documents. The call is **asynchronous**: it returns a `job_id` immediately;
poll `GET /v1/jobs/{job_id}` until `is_terminal` is `true`.

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

1. **Consolidate (when needed).** If the partition holds multiple import
   batches, or is not already a single batch at `import_number=1`, the Importer
   groups duplicate entities that share a name and picks a winner: the
   duplicate with the most entity-to-entity `RELATED_TO` edges, breaking ties
   by the latest `import_number`. The winner's content is kept as-is and
   relocated to the canonical `import_number=1` slot if needed. Losing entity
   vertices are dropped and their `RELATED_TO` and `MENTIONED_IN` edges are
   repointed onto the winner; self-loops are dropped and parallel `RELATED_TO`
   edges are deduplicated.
2. **Load the graph.** The partition's `Entities` and `RELATED_TO` edges are
   loaded into an in-memory graph, keyed by entity name, with `source_id`
   rebuilt from `MENTIONED_IN`. Disconnected graphs are accepted.
3. **Cluster and summarize.** Leiden clustering runs and community reports are
   generated, in the same way as during a full import.
4. **Swap in the new communities.** The old `Communities` and the community
   edges (`IN_COMMUNITY`, `SUB_COMMUNITY_OF`) are replaced only once the new
   ones are ready. New communities, embeddings, and entity cluster assignments
   are written back at `import_number=1`.

**Preserved:** `Documents`, `Chunks`, `Entities`, and the non-community
relations (`PART_OF`, `MENTIONED_IN`, `RELATED_TO`). Reclustering refreshes
community membership on entities; it does not recreate those preserved edges.

### Duration and performance impact

Reclustering is not a full re-ingest - it skips document, chunk, and entity
extraction and rebuilds only the community layer. Runtime is dominated by
**LLM community-report generation**, the same work as the community stage of a
full import, plus the optional consolidation pass and Leiden clustering.

- Expect longer jobs for partitions with many entities, relationships, or
  communities.
- Multi-batch partitions pay for a consolidation pass first.
- While a recluster runs it holds the single-flight import lock, so concurrent
  import, delete, and recluster calls return `UNAVAILABLE` until it finishes.
- Old communities are removed only after the new ones are ready, so a mid-job
  failure leaves the previous community layer intact.

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
| Import, delete, or recluster returns `UNAVAILABLE` | Another import, delete, or recluster holds the single-flight lock on this replica | Retry after the running job reaches a terminal state (`GET /v1/jobs/{job_id}` or `GET /v1/jobs`) |
| A delete job failed and nothing was removed | At least one requested file was missing from the partition | Check `delete_result.results` for `FILE_NOT_FOUND`, then fix the ids or names, or drop the missing entries, and retry |
| `FILE_NOT_FOUND` when deleting by `file_id` | The document was imported before `file_id` stamping, or the id does not match | Pass `doc_names` as a fallback, or confirm `Documents.file_id` (see [Documents](architecture.md#documents)) |
| An update left duplicate content in the graph | The import ran without a prior successful delete, or started before the delete finished | Delete, poll to terminal success, then import into the same `partition_id` |
| An import during an in-flight delete returns `UNAVAILABLE` | The delete holds the import lock until its background task completes | Poll the delete `job_id` until `is_terminal`, then retry the import |
| Communities look stale after inserts or deletes | The community layer has not been rebuilt yet | Let AutoGraph trigger a recluster when divergence is high, or call `POST /v1/recluster` for that `partition_id` |
| A recluster takes a long time and blocks other work | LLM community reports, with the lock held for the whole job | Expected for large partitions. Avoid overlapping calls on the same replica until the recluster job is terminal |

## Next steps

- **[Incremental Graph Updates in AutoGraph](../autograph/incremental-graph-updates.md)**:
  The operator-facing workflow that drives these endpoints.
- **[Architecture](architecture.md)**: Knowledge-graph collections and the
  async-job lifecycle.
- **[Import Files](importing-files.md)**: Single-file and multi-file import
  workflows.
- **[Error Handling](reference/error-handling.md)**: Synchronous error codes and
  asynchronous failure markers.
