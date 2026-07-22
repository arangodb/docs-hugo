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
everything, only the essentials, using data you can see change as you go. Every
query below runs against the movie dataset from the previous tutorial, so you
can paste each one in and watch the results build on the last.

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
  tutorial in the built-in
  [**Query editor**](../../platform-suite/query-editor.md).

Before you start, use the database selector in the web interface to switch to
the `movies` database (the platform starts you in `_system`). Every query below
assumes `movies` is the active database.

## Step 1: Explore the data model

ArangoDB organizes data in a simple hierarchy: a **database** contains
**collections**, and a collection contains **documents**. A document is just a
JSON object, and ArangoDB is schema-free — two documents in the same collection
need not have the same fields. Every document carries three system attributes:
`_key` (unique within its collection), `_id` (the collection name and key joined
as `Movies/8961`), and `_rev` (a revision marker ArangoDB manages for you).

There are two kinds of collections. **Document (node) collections** such as
`Movies` and `People` hold the "things". **Edge collections** such as `HasGenre`
and `ActedIn` hold the relationships: every edge is a document that additionally
has a `_from` and a `_to` attribute, each pointing at a document by its `_id`.
Edges are what let us traverse the graph later in this tutorial.

To see this concretely, open the web interface, browse to the `Movies`
collection, and open the document with the key `8961` (Bad Boys II). Note its
`_key`, `_id`, and `_rev`, and the plain JSON fields alongside them —
`title`, `release_date`, `vote_average`, and the rest. This is the same document
we now start querying.

## Step 2: Run your first AQL query

**AQL** (the ArangoDB Query Language) is the single language you use for
everything: reading documents, filtering, joining collections, and traversing
graphs. Every step below is an AQL query you paste into the Query editor.

Open the **Query editor** in the web interface. It has an input area where you
type a query, a **Run** button (or the run shortcut) that executes it, and a
results panel below that shows what came back. To confirm the editor works, run
the simplest possible query:

```aql
RETURN "Hello ArangoDB"
```

The results panel shows a single string. `RETURN` is how every AQL query
produces output; the rest of this tutorial is mostly about deciding *what* to
return.

## Let AI write the queries for you

Before we dive deeper into AQL, it is worth knowing that the data platform can
write queries *for* you, right inside the Query editor:

- **AQLizer** turns a plain-language request into an AQL query. Click the
  **AQLizer** button, describe what you want (for example, "list the 10
  highest-rated movies with at least 1000 votes"), and it generates the query,
  which you open in a tab to run. This can make it unnecessary to write AQL by
  hand for everyday questions. It is a data platform feature — see
  [Generate queries (AQLizer)](../../platform-suite/query-editor.md#generate-queries-aqlizer)
  and the [Natural Language to AQL](../../agentic-ai-suite/natural-language-to-aql/_index.md)
  introduction.
- **Reasoner** analyzes an existing AQL query and returns a validated, faster
  version with a performance comparison. Click **Optimize** to use it. See
  [Optimize queries (Reasoner)](../../platform-suite/query-editor.md#optimize-queries-reasoner).

So why learn AQL at all? Because generation is a starting point, not the finish
line: AI can make mistakes, so you always verify what it produces, and real work
means reading a generated query, correcting it, and extending it into something
more specific. The rest of this tutorial gives you exactly that foundation — with
it, the generated queries become something you can trust, adapt, and build on
rather than a black box.

## Step 3: Read documents

The most direct read is a lookup by document ID with the `DOCUMENT()` function.
This fetches exactly one document — the one you opened in Step 1:

```aql
RETURN DOCUMENT("Movies/8961")
```

More often you iterate over a collection with a `FOR` loop. `LIMIT` caps how many
documents you get back, which keeps exploratory queries fast on a 45,000-movie
collection:

```aql
FOR m IN Movies
  LIMIT 5
  RETURN m
```

Returning the whole document is rarely what you want. Build a new object in the
`RETURN` to project only the fields you need:

```aql
FOR m IN Movies
  LIMIT 5
  RETURN { title: m.title, year: m.release_date }
```

Here `m` is the loop variable — one movie document per iteration — and `m.title`
reads a single attribute from it.

## Step 4: Filter documents

Add a `FILTER` to keep only the documents that match a condition. Read it as
"find movies where…":

```aql
FOR m IN Movies
  FILTER m.vote_average > 8
  RETURN m.title
```

Combine conditions with `AND` and `OR`, and use range comparisons to narrow a
result set. This finds well-rated movies released in this century that enough
people actually voted on:

```aql
FOR m IN Movies
  FILTER m.vote_average >= 8
     AND m.vote_count >= 1000
     AND m.release_date >= "2000-01-01"
  RETURN { title: m.title, rating: m.vote_average }
```

Because `release_date` is stored as an ISO date string (`"2003-07-18"`), string
comparison and date comparison agree, so `>= "2000-01-01"` does what you expect.

## Step 5: Sort and limit

`SORT` orders the results; combine it with `LIMIT` to get a top-N. This is the
classic "top 10 highest-rated movies" query:

```aql
FOR m IN Movies
  SORT m.vote_average DESC
  LIMIT 10
  RETURN { title: m.title, rating: m.vote_average }
```

Sort by more than one attribute to break ties — here, when two movies have the
same average, the one with more votes ranks higher:

```aql
FOR m IN Movies
  SORT m.vote_average DESC, m.vote_count DESC
  LIMIT 10
  RETURN { title: m.title, rating: m.vote_average, votes: m.vote_count }
```

`FILTER`, `SORT`, and `LIMIT` compose naturally. Put them together for
"top-rated recent movies with a meaningful number of votes":

```aql
FOR m IN Movies
  FILTER m.release_date >= "2010-01-01" AND m.vote_count >= 1000
  SORT m.vote_average DESC
  LIMIT 10
  RETURN { title: m.title, rating: m.vote_average, released: m.release_date }
```

## Step 6: Compute and aggregate

You are not limited to returning stored fields — you can compute values in the
query. AQL ships with functions for strings, numbers, dates, arrays, and more.
This uses `LENGTH` (string length) and `LEFT` (the first characters of a string)
to derive new fields:

```aql
FOR m IN Movies
  FILTER m.release_date != null
  LIMIT 5
  RETURN {
    title: m.title,
    title_length: LENGTH(m.title),
    release_year: LEFT(m.release_date, 4)
  }
```

To summarize many documents into a few numbers, use `COLLECT`. Grouping with
`WITH COUNT INTO` counts how many documents fall into each group. This counts
movies per release year, newest years first:

```aql
FOR m IN Movies
  FILTER m.release_date != null
  COLLECT year = LEFT(m.release_date, 4) WITH COUNT INTO total
  SORT year DESC
  RETURN { year, total }
```

`COLLECT` builds one output row per distinct group value (each `year` here), and
`total` holds the number of movies in that group. The same pattern groups by any
expression — swap the `year` computation for any attribute to count by it.

## Step 7: Modify data (CRUD writes)

AQL writes as well as reads. Add a document with `INSERT`:

```aql
INSERT {
  _key: "tutorial-demo",
  title: "My Tutorial Movie",
  vote_average: 7.5
} INTO Movies
```

Change an existing document with `UPDATE ... WITH`. This is a *partial* update —
it merges the given fields and leaves the rest untouched:

```aql
UPDATE "tutorial-demo" WITH { vote_average: 9.1 } IN Movies
```

Remove it with `REMOVE`:

```aql
REMOVE "tutorial-demo" IN Movies
```

Each of these operations on a single document is atomic: it either fully applies
or not at all. Run the three queries in order to insert, change, and then clean
up the demo document, so you leave the dataset as you found it.

## Step 8: Make queries fast with indexes

By default, a `FILTER` on a non-indexed attribute forces ArangoDB to read every
document in the collection — a full collection scan. To see this, run a filtered
query and then use the **Explain** feature of the Query editor, which shows the
execution plan without running the query:

```aql
FOR m IN Movies
  FILTER m.title == "Bad Boys II"
  RETURN m
```

Explain reports a scan over the whole `Movies` collection: ArangoDB has no faster
way to find the matching title.

Now create an index. In the web interface, open the `Movies` collection, go to
its **Indexes** tab, and add a **persistent index** on the `title` field.
Run **Explain** on the same query again: the plan now uses an index lookup
instead of a collection scan, because ArangoDB can jump straight to the matching
document. Indexes speed up filtering and sorting on the indexed attributes, at
the cost of a little extra storage and slightly slower writes — so you index the
fields you query on, not every field.

## Step 9: Join collections

Sometimes the data you want lives in another collection. The `Movies` and
`MovieEmbeddings` collections share the same `_key` for each movie (the
embeddings were kept separate so the movie documents stay lean), so you can join
them by primary key. The efficient way is a direct `DOCUMENT()` lookup using the
movie's own key:

```aql
FOR m IN Movies
  FILTER m.vote_average >= 8
  LIMIT 5
  LET emb = DOCUMENT("MovieEmbeddings", m._key)
  RETURN { title: m.title, embedding_dimensions: LENGTH(emb.embedding) }
```

For each movie, `LET emb = ...` fetches its matching embedding document, and the
`RETURN` combines fields from both. The general, collection-agnostic form of a
join is a nested `FOR` with a `FILTER` that relates the two sides:

```aql
FOR m IN Movies
  FILTER m.vote_average >= 8
  LIMIT 5
  FOR e IN MovieEmbeddings
    FILTER e._key == m._key
    RETURN { title: m.title, embedding_dimensions: LENGTH(e.embedding) }
```

Both queries produce the same result; the `DOCUMENT()` form is preferred when you
join on the key, because it is a direct lookup rather than a search. This kind of
join follows a shared *value*. When relationships are modeled as edges instead,
you follow them with a graph traversal — that is the next step.

## Step 10: Traverse the graph

A graph traversal follows edges from a starting document. The core syntax names
three variables (the `node` reached, the `edge` used, and the `path` so far), a
depth range, a direction, and the edge collection to walk. Let's switch to Toy
Story (`Movies/862`) and list its genres by following `HasGenre` edges outbound
from the movie to the genre nodes:

```aql
FOR node, edge, path IN 1..1 OUTBOUND "Movies/862" HasGenre
  RETURN node.name
```

Direction matters. `ActedIn` edges point from a person **to** a movie, so to find
a movie's cast you traverse `INBOUND` — from the movie back to the people:

```aql
FOR person IN 1..1 INBOUND "Movies/862" ActedIn
  RETURN person.name
```

Increase the depth to answer connected questions. A two-step traversal from a
movie to its actors and on to *their* other movies finds films that share cast
with Toy Story:

```aql
FOR person IN 1..1 INBOUND "Movies/862" ActedIn
  FOR other IN 1..1 OUTBOUND person ActedIn
    FILTER other._id != "Movies/862"
    RETURN DISTINCT other.title
```

You can vary the depth range (`1..2`), the direction (`INBOUND`, `OUTBOUND`, or
`ANY`), and how strictly nodes and paths must be unique, to shape what a
traversal explores. Instead of naming edge collections one by one, you can also
traverse the whole named graph at once with `GRAPH "MoviesGraph"`, which walks
every edge collection the graph defines:

```aql
FOR node IN 1..1 OUTBOUND "Movies/862" GRAPH "MoviesGraph"
  RETURN node
```

## Step 11: Find similar movies with vector search

So far we matched exact values (title, rating) and explicit relationships
(edges). Vector search finds movies by **meaning**: each movie's `overview` text
was turned into a 384-dimensional embedding in `MovieEmbeddings`, and similar
plots end up close together in that vector space.

First, create the index once. In the web interface, open the `MovieEmbeddings`
collection, go to its **Indexes** tab, and add a **vector index** on the
`embedding` field with metric `cosine` and dimension `384` (the output size of
the `all-MiniLM-L6-v2` model that produced the embeddings).

{{< info >}}
Vector indexes require the deployment to be started with the `--vector-index`
startup option. On a platform from [Evaluate locally](evaluate-locally.md) this
is already set; on your own deployment, enable it before creating the index.
{{< /info >}}

Now run a "more like this" query. Take Toy Story's own embedding as the reference
point and ask the index for its nearest neighbors:

```aql
LET query = DOCUMENT("MovieEmbeddings/862").embedding  // Toy Story
FOR e IN MovieEmbeddings
  SORT APPROX_NEAR_COSINE(e.embedding, query) DESC
  LIMIT 6
  RETURN DOCUMENT("Movies", e._key).title
```

The results are the movies whose overviews are **semantically closest** to Toy
Story — expect other animated, family, and toy-themed films — even when they
share no genre, keyword, or cast edge in the graph. This is similarity by
meaning, not by exact attribute match.

The moving parts: `APPROX_NEAR_COSINE` returns a cosine similarity (`1` = most
similar) computed against the vector index, `SORT ... DESC` puts the closest
matches first, and `LIMIT` caps how many the index returns. The reference movie
itself is always the top hit (similarity ≈ 1), which is why we ask for 6 to get
5 genuinely *other* recommendations.

## Next steps

- Combine approaches: filter or traverse the graph first, then rank the results
  by vector similarity for hybrid, context-aware search.
- Add full-text search with ArangoSearch `View`s for keyword queries.
- Connect from your application with an official [driver](../../index.md).
- Deepen your AQL and graph skills with the fundamentals courses.
