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
entities of the knowledge graph, but not the communities they are grouped
into. To tell you when the communities are out of date, AutoGraph tracks the
**divergence** of every partition: how much of it has changed since its
communities were last organized. Once the divergence is above the threshold of
25%, the partition is flagged with `needs_reclustering: true`, and you can
[reorganize](api-reference.md#reorganize-partitions) it.

For the terms used on this page, see
[Terms](_index.md#terms).

{{< embed-svg "AutoGraph-IGU-Divergence" "The divergence of a partition grows with every change. Replacing 3 documents changes 200 of 1,000 entities (20%). Adding 2 more documents brings it to 280 (28%), which is above the threshold of 25%. Reorganizing rebuilds the communities and sets the divergence back to 0%." >}}

The example above shows how the divergence of one partition develops:

1. After the knowledge graph is built, the partition has 1,000 entities. This
   is the starting point, and the divergence is 0%.
2. Three documents are replaced. Their old versions had 100 entities, which are
   removed, and the new versions have 100 entities, which are added. Both count,
   so 200 of 1,000 entities have changed: 20%.
3. Two documents are added, with 80 entities. Now 280 of 1,000 entities have
   changed: 28%. This is above the threshold, so the partition is flagged.
4. You reorganize the partition. Its communities are rebuilt, the current
   entities become the new starting point, and the divergence is back to 0%.

VectorRAG partitions have no communities, so they are never flagged.

## How the divergence is calculated

The divergence is the higher one of two values, both measured on the entities
of the partition:

```text
divergence_score = max(gross_churn_score, multi_batch_score)
needs_reclustering = (divergence_score > divergence_threshold)
```

The **`divergence_threshold`** is stored per partition on the `rags` profile and
is **`0.25`** (25%) in this release. It is **not configurable through the API**:
no request field sets it, so every partition uses the default. The only way to
change it is to edit the `rags` document in ArangoDB by hand. A divergence that
is equal to the threshold does not set the flag, only a higher one does.

### Changed entities

```text
gross_churn_score = cumulative_churn / baseline_entity_count
```

- **`baseline_entity_count`** is the number of distinct entity names when the
  partition was last organized, either by the knowledge graph build or by a
  reorganization. The first time the divergence is measured after a partition
  is built, the current count becomes the baseline and the divergence starts at
  `0`.
- **`cumulative_churn`** is the total number of entities that have been added
  **and** removed by all changes since then. Additions and removals do not
  cancel each other out. Replacing a document whose old version had 100
  entities with a new version that has 100 entities therefore adds about 200,
  not 0.

This is the value shown in the diagram above: with a baseline of `1000`
entities, removing `100` entities and adding `100` gives a `cumulative_churn` of
`200` and thus a `gross_churn_score` of `0.20`.

### Entities from several imports

If a partition has received several incremental imports without being
reorganized, the same entities can exist multiple times across the imports.
AutoGraph groups the entities by `import_number`, uses the **largest** import as
the baseline, and counts everything outside of it as changed:

```text
multi_batch_score = (total_entities - largest_batch) / total_entities
```

A partition with a single import, or with no entities at all, scores `0` here.
Imports of `[500, 300, 200]` entities, for example, give
`(1000 - 500) / 1000 = 0.50`.

### Combined example

If the changed entities give `0.20` and the imports give `0.50`, the
`divergence_score` is `0.50`. With the threshold of `0.25`, `needs_reclustering`
is set to `true`.

## Where the values are stored

The divergence values are stored in the `rags` strategy profile of the
partition:

| Field | Meaning |
|-------|---------|
| `divergence_score` | The current divergence, calculated as described above |
| `divergence_threshold` | The threshold for this partition. Always `0.25`, as no API sets it |
| `needs_reclustering` | `true` as soon as the divergence is above the threshold |
| `last_reclustered_at` | When the partition was last organized successfully, as epoch seconds. This is also when the current baseline was taken |

## How the values change

| Event | Effect on the divergence values |
|-------|----------------------------|
| First measurement after a build | The current entity count becomes the baseline, the divergence is `0`, and the flag is `false` |
| Documents added, removed, or replaced, once the knowledge graph contains the change | The divergence is calculated again, and the flag is set if it is above the threshold |
| Successful reorganization | The divergence is reset to `0`, the changes are cleared, a new baseline is taken, the flag is cleared, and `last_reclustered_at` is set |
| Failed, deferred, or incomplete reorganization | The divergence and the flag stay as they are, so that you can try again later |

## Where to read the divergence

The divergence is only meaningful once the knowledge graph contains the change.
That is why **adding and replacing do not report it**: they finish while the
change is only in the corpus graph, before a knowledge graph build has created
the entities that the divergence is measured on.

You can read it in three places:

| Where | What you get | Notes |
|-------|--------------|-------|
| [`GET /v1/orchestrate/{orchestration_id}`](../reference/orchestration.md#monitor-an-orchestration), per entry of `jobs` | The divergence of every partition the knowledge graph build touched | This is the value to act on after adding or replacing documents. It is held in memory only: a new `POST /v1/orchestrate` replaces the previous build, and an unknown or replaced ID returns `404` |
| [`POST /v1/graph/delete`](api-reference.md#remove-documents), per file in `results` | The divergence after the removal | Only reported if `overall_status` is `COMMITTED`. A removal that ends in `ROLLED_BACK` or `FAILED` reports no divergence |
| The `rags` strategy profile of the partition | The stored values, see [Where the values are stored](#where-the-values-are-stored) | Always available. Read it here once the build status is gone |

A removal can report the divergence directly because it removes the entities
itself, before it returns. There is no knowledge graph build to run afterwards.

## When to reorganize

AutoGraph never reorganizes on its own. When a partition is flagged, weigh the
benefit against the cost:

- Reorganizing a partition can take up to an **hour**, and it blocks all other
  changes to the project while it runs: corpus builds and adding, removing, and
  replacing documents. Partitions are reorganized one after another.
- Until you reorganize, the communities and their summaries do not reflect the
  latest changes. The entities and relationships are up-to-date as soon as the
  knowledge graph build has run.

Plan reorganizing as maintenance, at a time when nothing else has to change the
project. For the request, see
[Reorganize partitions](api-reference.md#reorganize-partitions).
