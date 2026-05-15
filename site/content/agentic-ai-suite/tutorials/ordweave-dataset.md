---
title: The Nordweave dataset
menuTitle: Nordweave dataset
weight: 99
description: >-
  Download and overview of the synthetic Nordweave dataset used throughout
  the Nordweave tutorial series
---

The Nordweave dataset is the synthesized snapshot of a fictional clothing
retailer's operational data used by [The Nordweave Story](nordweave/_index.md)
tutorial series. It is distributed as a set of JSON Lines files, one per
collection, ready to be loaded into ArangoDB with `arangoimport`.

## Contents

The dataset is organized into two folders:

- **`spine/`** - structured ground-truth JSON Lines files, one per
  collection. This is the part loaded in
  [Chapter 1.1 - Importing the spine](nordweave/importing-data.md).
- **`unstructured/`** - long-form text (lookbooks, design briefs, trend
  reports, style guides, supplier audits, incident post-mortems). Used by
  later chapters with the
  [GraphRAG Importer](../graphrag/_index.md).

The full breakdown of vertex and edge collections, record counts, and
sample records is documented in the
[Nordweave tutorial overview](nordweave/_index.md#the-dataset).

## How the data is shaped

Each record in the spine is plain JSON. Vertex files use a `_key` field;
edge files use ArangoDB-native `_from` and `_to` references in
`<collection>/<key>` form, so no transformation is needed at import time.
Some edges carry payload attributes (`pct` on `made_of`, `qty` and
`unit_price_usd` on `contains`, etc.) - edges in ArangoDB are first-class
documents and can carry any properties you like.

## Using the dataset

The tutorial series walks you through everything end-to-end, starting from
the import step:

1. [Importing the data with arangoimport](nordweave/importing-data.md)
2. [OneShard databases](nordweave/oneshard-databases.md)
3. [SatelliteGraphs](nordweave/satellitegraphs.md)
4. [Graph Visualizer](nordweave/graph-visualizer.md)
5. [Custom themes](nordweave/custom-themes.md)
6. [Canvas Actions](nordweave/canvas-actions.md)
7. [Meeting Ada](nordweave/meeting-ada.md)

The dataset is roughly 57k vertices and 750k edges - small enough to fit
on a single DB-Server, large enough to make sharding decisions matter,
and varied enough to exercise every layer of the Agentic AI Suite as the
series progresses.
