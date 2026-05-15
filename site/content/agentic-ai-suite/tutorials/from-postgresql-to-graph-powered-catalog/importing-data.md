---
title: "Chapter 1.1 - Importing the Nordweave spine"
menuTitle: Importing the data
weight: 5
description: >-
  Load the Nordweave v0.1 spine - products, customers, orders, reviews,
  suppliers, and the edges between them - from JSON Lines files into ArangoDB
  using arangoimport
---

This is the first step of the [From PostgreSQL to a Graph-Powered Catalog](_index.md)
tutorial. The goal here is concrete: get the v0.1 spine into ArangoDB.

ArangoDB is a *unified* data platform: it doesn't care whether your data
arrives as JSON, CSV, TSV, or - through the Importer service - even as
unstructured PDFs, Markdown, or plain text. For now, the spine is structured
JSONL, so this chapter uses the workhorse import tool: `arangoimport`.

Make sure you have the dataset files in hand before proceeding - see the
[dataset overview](_index.md#the-dataset) on the section landing page for
contents and folder layout.

## A quick mental model

`arangoimport` is the bulk loader that ships with ArangoDB. It connects to a
Coordinator (in a cluster) or a single server and streams documents into a
collection. It supports:

- **JSON Lines (JSONL)** - one JSON object per line. Streamable,
  memory-efficient, the recommended format for anything non-trivial.
  Every Nordweave spine file is in this format.
- **JSON** - a single top-level array of objects. Easier to read by hand,
  but the whole array must fit in memory before the first batch ships.
- **CSV / TSV** - for tabular exports from spreadsheets or relational
  systems.
- **Gzip-compressed input** transparently, when the file ends in `.gz`.

## Importing a vertex collection

Load `products` first:

```bash
arangoimport \
  --file "spine/products.jsonl" \
  --type jsonl \
  --collection products \
  --create-collection true \
  --create-database true \
  --server.database nordweave \
  --server.endpoint "http+ssl://<COORDINATOR>:8529" \
  --server.username root \
  --threads 4 \
  --progress true
```

A few flags worth a closer look - they show up in every real import:

- `--create-collection true` creates the collection on first run. By default
  it makes a document collection (a vertex collection).
- `--create-database true` lets you point at a database that doesn't exist
  yet. The next chapter covers *how* that database should be created when
  OneShard is enabled.
- `--threads 4` parallelizes the import. Fine for fresh loads. Drop it back
  to `1` if your input has duplicates and you care about which version wins.

## Importing an edge collection

Edge collections must be told they are edge collections at creation time.
That is what `--create-collection-type edge` is for:

```bash
arangoimport \
  --file "spine/edges_contains.jsonl" \
  --type jsonl \
  --collection contains \
  --create-collection true \
  --create-collection-type edge \
  --server.database nordweave \
  --server.endpoint "http+ssl://<COORDINATOR>:8529" \
  --server.username root \
  --threads 4
```

The records in `edges_contains.jsonl` already have `_from` and `_to` in the
right shape (`orders/ord_000000`, `products/prod_04762`), so ArangoDB stores
them directly without any transformation.

## Loading the whole spine in one go

There are 33 JSONL files in `spine/`. A small Bash loop handles all of them
- vertex files first, edge files second, so referenced vertices already
exist when the edges land:

```bash
#!/usr/bin/env bash
set -euo pipefail

ENDPOINT="http+ssl://<COORDINATOR>:8529"
DB="nordweave"
USER="root"

import_vertex() {
  local file="$1" coll="$2"
  arangoimport --file "spine/${file}" --type jsonl \
    --collection "${coll}" --create-collection true \
    --create-database true \
    --server.endpoint "${ENDPOINT}" --server.database "${DB}" \
    --server.username "${USER}" --threads 4 --progress true
}

import_edge() {
  local file="$1" coll="$2"
  arangoimport --file "spine/${file}" --type jsonl \
    --collection "${coll}" --create-collection true \
    --create-collection-type edge \
    --server.endpoint "${ENDPOINT}" --server.database "${DB}" \
    --server.username "${USER}" --threads 4 --progress true
}

# Vertex collections (15)
for v in brands categories collections customers employees influencers \
         materials orders products returns reviews stores style_tags \
         suppliers teams; do
  import_vertex "${v}.jsonl" "${v}"
done

# Edge collections (18) - file is "edges_<name>.jsonl", collection is "<name>"
for e in belongs_to_category contains designed_by fulfilled_at \
         has_style_pref leads made_of manages manufactured_by \
         member_of part_of_collection placed purchased returned \
         reviewed sold_as_brand tagged_as works_at; do
  import_edge "edges_${e}.jsonl" "${e}"
done
```

On a developer laptop this runs in a few minutes. The bottleneck is disk
and network, not the database.

## Why this is fast

A common question from customers migrating off relational systems is *"is
this going to be slow?"* The honest answer is: imports into ArangoDB are
usually limited by your disk and network, not by the database.

Under the hood, ArangoDB stores its data via RocksDB, a high-throughput
embedded storage engine written in C++. `arangoimport` streams documents in
batches; RocksDB writes them sequentially to a write-ahead log and then
flattens them into sorted on-disk tables. There is no query planner
involvement, no index lookup per row, no SQL parsing - it is the closest
thing to "open file, write file" that a database can offer while still
giving you full transactional guarantees.

## What about unstructured data?

Not every customer hands us a clean JSONL spine. The Nordweave dataset also
has - or will have, in a later version - long-form text: 80 lookbooks, 120
design briefs, 40 trend reports, 60 style guides, 200 supplier audits, and
80 incident post-mortems. That is the kind of corpus you would want to turn
into a knowledge graph, not just store as blobs.

ArangoDB has an answer for that: the [GraphRAG Importer
service](../../graphrag/_index.md), part of the Agentic AI Suite. It reads
`.txt`, `.md`, `.pdf` (and Office files / images, which it converts to PDF
first), runs them through a language model, extracts entities and
relationships, and writes the result back into ArangoDB as a knowledge
graph. A later chapter of this series uses it - it is one of the
destinations this whole tutorial is heading toward.

For now, the takeaway is simply: data, in any shape, has a path into
Arango. Today we use `arangoimport` for the structured spine; later we will
use the GraphRAG Importer for everything else.

## What's next

The data is in, but every collection landed with default sharding. The
next page covers [OneShard databases](oneshard-databases.md), which is the
right answer for a tightly-connected dataset like Nordweave's spine.
