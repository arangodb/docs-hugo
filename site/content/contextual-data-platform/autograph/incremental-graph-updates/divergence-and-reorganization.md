---
title: Divergence and Reorganization in Incremental Graph Updates
menuTitle: Divergence and Reorganization
weight: 20
description: >-
  How AutoGraph measures how much a partition has changed, and when to
  reorganize its communities
---
{{< tag "Agentic AI Suite" >}}

Adding, removing, and replacing documents in an existing category changes the
entities of the knowledge graph, but not the communities they belong to. To
show when the communities no longer match the entities, AutoGraph tracks the
**divergence** of every partition. The divergence is how much of the partition
has changed since its communities were last organized. If it is above 25%,
AutoGraph sets `needs_reclustering: true` on the partition, and you can
[reorganize](api-reference.md#reorganize-partitions) it.

{{< embed-svg "AutoGraph-IGU-Divergence" "The divergence of a partition grows with every change. Replacing 3 documents changes 200 of 1,000 entities (20%). Adding 2 more documents brings it to 280 (28%), which is above the threshold of 25%. Reorganizing rebuilds the communities and sets the divergence back to 0%." >}}

In the example above, the divergence of one partition develops as follows:

1. After the knowledge graph build, the partition has 1,000 entities. This is
   the starting point, and the divergence is 0%.
2. Three documents are replaced. Their old versions had 100 entities, which are
   removed, and the new versions have 100 entities, which are added. Both
   count, so 200 of 1,000 entities have changed (20%).
3. Two documents are added, with 80 entities. Now 280 of 1,000 entities have
   changed (28%). This is above the threshold, so AutoGraph flags the
   partition.
4. You reorganize the partition. Its communities are rebuilt, the current
   entities become the new starting point, and the divergence is back to 0%.

Partitions with the VectorRAG strategy have no communities, so AutoGraph never
flags them.

## How the divergence is calculated

AutoGraph calculates two values from the entities of the partition and uses
the higher one:

```text
divergence_score = max(gross_churn_score, multi_batch_score)
needs_reclustering = (divergence_score > divergence_threshold)
```

The `divergence_threshold` is `0.25` (25%) in Arango Contextual Data Platform
4.1.x. It is stored per partition, in the `rags` profile (the document that
stores the strategy of the partition). No API request sets it, so every
partition uses this default. To change it, you have to edit the `rags` document
in ArangoDB by hand. A divergence equal to the threshold does not set the flag.
Only a higher one does.

### Changed entities

```text
gross_churn_score = cumulative_churn / baseline_entity_count
```

- `baseline_entity_count` is the number of distinct entity names when the
  partition was last organized, by the knowledge graph build or by a
  reorganization. The first time AutoGraph measures the divergence after a
  build, the current count becomes the baseline, and the divergence starts at
  `0`.
- `cumulative_churn` is the number of entities that all changes since then
  have added, plus the number they have removed. Additions and removals do not
  cancel each other out. Replacing a document whose old version had 100
  entities with a new version that has 100 entities adds about 200, not 0.

The diagram above shows this value. With a baseline of `1000` entities,
removing `100` entities and adding `100` gives a `cumulative_churn` of `200`
and a `gross_churn_score` of `0.20`.

### Entities from several imports

If a partition has received several incremental imports without a
reorganization, the same entities can exist several times across the imports.
AutoGraph groups the entities by `import_number`, uses the largest import as the
baseline, and counts everything outside of it as changed.

```text
multi_batch_score = (total_entities - largest_batch) / total_entities
```

A partition with a single import, or with no entities, scores `0`. Imports of
`[500, 300, 200]` entities give `(1000 - 500) / 1000 = 0.50`.

### Combined example

If the changed entities give `0.20` and the imports give `0.50`, the
`divergence_score` is `0.50`. This is above the threshold of `0.25`, so
`needs_reclustering` is `true`.

## Where the values are stored

AutoGraph stores the divergence values in the `rags` profile of the partition.

| Field | Meaning |
|-------|---------|
| `divergence_score` | The current divergence |
| `divergence_threshold` | The threshold for this partition. Always `0.25`, as no API sets it |
| `needs_reclustering` | `true` if the divergence is above the threshold |
| `last_reclustered_at` | When the partition was last organized successfully, in epoch seconds. AutoGraph took the current baseline at this time |

## How the values change

| Event | Effect on the divergence values |
|-------|----------------------------|
| First measurement after a build | The current entity count becomes the baseline, the divergence is `0`, and the flag is `false` |
| Documents added, removed, or replaced, once the knowledge graph contains the change | AutoGraph calculates the divergence again and sets the flag if it is above the threshold |
| Successful reorganization | The divergence is reset to `0`, the changes are cleared, a new baseline is taken, the flag is cleared, and `last_reclustered_at` is set |
| Failed, deferred, or incomplete reorganization | The divergence and the flag stay as they are, so that you can try again later |

## Where to read the divergence

The divergence only counts the entities in the knowledge graph. Adding and
replacing finish before a knowledge graph build has created the new entities,
so their responses do not report the divergence.

You can read it in three places.

| Where | What you get | Notes |
|-------|--------------|-------|
| [`GET /v1/orchestrate/{orchestration_id}`](../reference/orchestration.md#monitor-an-orchestration), per entry of `jobs` | The divergence of every partition the knowledge graph build changed | Read it here after adding or replacing documents. The status is kept in memory only. A new `POST /v1/orchestrate` replaces it, and an unknown or replaced ID returns `404` |
| [`POST /v1/graph/delete`](api-reference.md#remove-documents), per file in `results` | The divergence after the removal | Only if `overall_status` is `DELETE_OVERALL_STATUS_COMMITTED`. A removal that is rolled back or fails reports no divergence |
| The `rags` profile of the partition | The stored values, see [Where the values are stored](#where-the-values-are-stored) | Always available, also after the build status is gone. [`GET /v1/rag-strategizer/strategy`](../reference/rag-strategizer.md#retrieve-rag-strategies) returns the profiles of all partitions, with the values in `parameters` as strings |

A removal reports the divergence directly, because it removes the entities
before it returns.

The knowledge graph build only reports the partitions it processed. After a
batch of changes, other partitions can have changed too: the partitions of
removed documents, and the partitions that replaced documents moved away from,
if the new version was assigned to another cluster. Only the `rags` profiles
show all of them.

## When to reorganize

AutoGraph never reorganizes on its own. When it flags a partition, compare the
benefit with the cost:

- Reorganizing a partition can take up to an hour. While it runs, it blocks all
  other changes to the project, including corpus builds and adding, removing,
  and replacing documents. Partitions are reorganized one after another.
- Until you reorganize, the communities and their summaries do not reflect the
  latest changes. The entities and relationships are up-to-date as soon as the
  knowledge graph build has run.

Reorganize at a time when nothing else has to change the project. For the
request, see [Reorganize partitions](api-reference.md#reorganize-partitions).
