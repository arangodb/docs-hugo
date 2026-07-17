---
title: ArangoDB core database features
menuTitle: Core features
weight: 15
description: >-
  Learn the essential ArangoDB features by querying the movie graph: documents,
  AQL, indexes, joins, graph traversals, and vector search
---
In this tutorial, we learn the core features of ArangoDB by exploring the movie
dataset hands-on. We move from looking up a single document to filtering,
sorting, joining collections, and finally traversing the movie graph — the
essential skills every ArangoDB user needs.

This is learning-oriented: follow along query by query. We do not aim to cover
everything, only the essentials, using data you can see change as you go.

By the end, you will be able to:

- Navigate the data model: databases, collections, and documents.
- Read, filter, sort, and limit data with AQL.
- Insert, update, and remove a document.
- Speed up a query with an index and read its query explanation.
- Join collections and traverse the graph to answer connected questions.
- Find semantically similar movies with a vector index.

## Prerequisites

- The [example movie dataset](dataset.md) loaded into a `movies` database.
- Access to the data platform web interface, where you run every query in this
  tutorial in the built-in **Query editor**.

## Step 1: Explore the data model

- Concepts: **database → collections → documents** (schema-free JSON).
- Node (document) collections vs. edge collections (edges carry `_from` / `_to`
  and connect two nodes).
- In the web interface, browse the `Movies` collection, open the "Toy Story"
  document, and point out `_key`, `_id`, `_rev`.

## Step 2: Run your first AQL query

- Open the **Query editor** in the web interface; show how to type a query, run
  it, and read the results panel.
- `RETURN "Hello ArangoDB"` to confirm the editor works.
- Introduce AQL as the single language for documents, joins, and graphs — every
  step below is a query you paste into this editor.

## Step 3: Read documents

- Look up one document by key: `RETURN DOCUMENT("Movies/862")`.
- Iterate a collection and return a few docs:
  `FOR m IN Movies LIMIT 5 RETURN m`.
- Project only the fields you need:
  `FOR m IN Movies LIMIT 5 RETURN { title: m.title, year: m.release_date }`.

## Step 4: Filter documents

- `FOR m IN Movies FILTER m.vote_average > 8 RETURN m.title` — equality and
  comparison.
- Combine conditions with `AND` / `OR`; range filters on `release_date`.
- Point out how `FILTER` maps to intuitive "find movies where…".

## Step 5: Sort and limit

- `SORT m.vote_average DESC` to rank; `LIMIT 10` for a top-10.
- Sort by multiple attributes (e.g. `vote_average DESC, vote_count DESC`).
- Combine filter + sort + limit into a "top rated recent movies" query.

## Step 6: Compute and aggregate

- Computed fields and functions (e.g. `LENGTH`, `LOWER`, date handling).
- `COLLECT ... WITH COUNT INTO` for grouping (e.g. movies per status).
- Keep it to the few functions needed for the examples.

## Step 7: Modify data (CRUD writes)

- `INSERT { ... } INTO Movies` to add a document.
- `UPDATE "key" WITH { ... } IN Movies` to change fields (partial update).
- `REMOVE "key" IN Movies` to delete.
- Note transactional, single-document atomicity; clean up what you inserted.

## Step 8: Make queries fast with indexes

- Run a filtered query (e.g. `FILTER m.title == "Bad Boys II"`), then click the
  **Explain** button in the Query editor to see the execution plan — a full
  collection scan.
- Create a **persistent index** on `Movies.title`.
- Run **Explain** again to see the plan now uses the index; explain when indexes
  help.

## Step 9: Join collections

- Movies and embeddings share a `_key`: join by primary key with `DOCUMENT()`.
- Join via a query variable:
  `FOR m IN Movies FOR g IN ... RETURN ...` (reference-based join).
- Contrast document-reference joins with graph edges (next step).

## Step 10: Traverse the graph

- The core graph feature: `FOR node, edge, path IN 1..1 OUTBOUND "Movies/862" HasGenre RETURN node.name`.
- Find a movie's cast: traverse `INBOUND` over `ActedIn` from a movie to the
  people nodes.
- Find co-actors: 2-step traversal (Movie → People → Movies).
- Vary depth (`1..2`), direction (`INBOUND` / `OUTBOUND` / `ANY`), and uniqueness.
- Mention named-graph traversal via `GRAPH "MoviesGraph"`.

## Step 11: Find similar movies with vector search

So far we matched exact values (title, rating) and explicit relationships
(edges). Vector search finds movies by **meaning**: each movie's `overview` text
was turned into a 384-dimensional embedding in `MovieEmbeddings`, and similar
plots end up close together in that vector space.

- Create the index once: on `MovieEmbeddings.embedding`, add a **vector index**
  with metric `cosine` and dimension `384` (the `all-MiniLM-L6-v2` model's
  output). Do this in the collection's **Indexes** tab in the web interface.
  - Note the prerequisite: the deployment must be started with the
    `--vector-index` option for vector indexes to be available.
- Run a "more like this" query — take one movie's own embedding as the reference
  point and ask for its nearest neighbors:
  ```aql
  LET query = DOCUMENT("MovieEmbeddings/862").embedding  // Toy Story
  FOR e IN MovieEmbeddings
    SORT APPROX_NEAR_COSINE(e.embedding, query) DESC
    LIMIT 6
    RETURN DOCUMENT("Movies", e._key).title
  ```
- Explain what it finds: the movies whose overviews are **semantically closest**
  to Toy Story — expect other animated/family and toy-themed films — even when
  they share no genre, keyword, or cast edge in the graph. This is similarity by
  meaning, not by exact attribute match.
- Explain the moving parts: `APPROX_NEAR_COSINE` returns a cosine similarity
  (1 = most similar), `SORT ... DESC` puts the closest first, and `LIMIT` caps
  how many the index returns. The reference movie itself is the top hit
  (similarity ≈ 1), so ask for one more than you need.

## Next steps

- Combine approaches: filter or traverse the graph first, then rank the results
  by vector similarity for hybrid, context-aware search.
- Add full-text search with ArangoSearch `View`s for keyword queries.
- Connect from your application with an official [driver](../../index.md).
- Deepen your AQL and graph skills with the fundamentals courses.
