---
title: The example movie dataset
menuTitle: Example dataset
weight: 10
description: >-
  Get to know the movie graph used throughout the tutorials and load it into
  your data platform, going from the provided files to a queryable graph
---
In this tutorial, we load the example **movie dataset** into ArangoDB and end up
with a ready-to-query property graph that we can explore visually. Every
follow-up tutorial builds on this data, so this is the shared starting point.

By the end, you will have:

- A `movies` database populated with movie, people, genre, and rating data.
- A named graph (`MoviesGraph`) wiring the collections together for traversals.
- Vector embeddings loaded alongside the movies, ready for semantic search.
- A feel for the graph from exploring it in the built-in graph visualizer.

You are given two things to work with:

- A `jsonl/` directory with one ready-to-import JSONL file per collection.
- An import script, `imp.sh`, that loads everything in the right order.

## What the dataset is

- Source: **The Movie Database (TMDb)** movie data, originally published as the
  Kaggle "The Movies Dataset" by Rounak Banik (~45k movies, cast, crew,
  keywords, and ~26M user ratings).
- Why a graph: movies, people, genres, and users are naturally connected;
  modeling them as vertices and edges lets us traverse relationships directly.
- The data is provided as JSONL files, one per collection, plus embeddings —
  nothing needs to be generated, only imported.

## Step 1: Understand the graph model

- **Vertex collections** (the "things"):
  - `Movies` — one document per film (`title`, `overview`, `release_date`,
    `budget`, `revenue`, `vote_average`, …); `_key` is the TMDb id.
  - `People` — actors and crew (deduplicated `cast` + `crew`).
  - `Genres`, `Keywords`, `ProductionCompanies`, `ProductionCountries`,
    `SpokenLanguages`, `Collections` — lookup/facet vertices.
  - `Users` — anchors for rating edges (no attributes).
  - `MovieEmbeddings` — a 384-dim vector per movie, sharing the same `_key` as
    `Movies` (joined by primary key, not by an edge).
- **Edge collections** (the relationships):
  - `ActedIn`, `WorkedOn` — People → Movies (with `character` / `job`).
  - `HasGenre`, `HasKeyword`, `ProducedBy`, `ProducedInCountry`,
    `HasSpokenLanguage`, `PartOfCollection` — Movies → facet vertices.
  - `Rated` — Users → Movies (with `rating`, `timestamp`).
- Show one sample vertex and one sample edge document to make `_key` /
  `_from` / `_to` concrete.
- Note why `MovieEmbeddings` is a separate collection (keeps `Movies` lean,
  embeddings replaceable independently).

## Step 2: Prerequisites

- A running platform from [Evaluate locally](evaluate-locally.md) (or any
  reachable ArangoDB endpoint).
- The `arangoimport` and `arangosh` client tools installed.
- The provided `jsonl/` directory and `imp.sh` script on disk.
- Endpoint / credentials known; set `ARANGO_PASSWORD` for the script (the
  script targets database `movies` as user `root`).

## Step 3: Import the dataset

- Run the provided script from the directory that contains `jsonl/`:
  `ARANGO_PASSWORD=<pw> ./imp.sh` (adjust the endpoint at the top of the script
  if needed).
- What the script does, in order (so the reader understands, not just runs):
  1. Creates the `movies` database.
  2. Imports every **vertex** collection first (so edge references resolve),
     with `--create-collection-type document`.
  3. Imports `MovieEmbeddings`.
  4. Imports every **edge** collection with `--create-collection-type edge`.
  5. Registers the `MoviesGraph` as a **named graph**.
- Mention it is safe to re-run (existing-database/collection errors are ignored).

## Step 4: Verify the import

- Count documents per collection and compare against expected totals.
- Run one test query to confirm, e.g. fetch `Movies/8961` ("Bad Boys II").

## Step 5: Explore the graph in the visualizer

Now that the data is loaded, see the model from Step 1 come to life. Open the
web interface, go to **Graphs**, and open **MoviesGraph**. The rest of this step
walks through the most common things you do in the viewer. For the full
reference, see the [Graph Visualizer](../../platform-suite/graph-visualizer.md)
documentation.

- **Add a node by its document ID.**
  - Click the **Search & add nodes to canvas** field in the top bar to open the
    add-nodes dialog.
  - Choose the **Node type** `Movies`, search for the ID **`8961`** (Bad Boys II),
    select it, and click **Add 1 node**.
  - Right-click the node, click **Expand (#)**, then **All (#)** to pull in its
    neighbors: its cast via `ActedIn` (Will Smith, Martin Lawrence, …), its
    `Genres` via `HasGenre`, its `ProductionCompanies` via `ProducedBy`, and so on.
  - Point out how one document fans out into the surrounding graph, and how
    edge labels tell you the relationship type.
- **Add nodes with an AQL query (a basic filter).**
  - Click **Queries** in the top bar, open the **Queries** tab, and click
    **New query**.
  - Enter a simple filter that returns whole documents — no traversal yet — and
    click **Run query**:
    ```aql
    FOR m IN Movies
      FILTER m.vote_average >= 8 AND m.vote_count >= 5000
      RETURN m
    ```
  - The matching movie nodes appear on the canvas; right-click any of them to
    **Expand (#)** and explore from there.
  - Emphasize the pattern: query returns documents → documents become nodes.
- **Find the shortest path between two actors (Daniel Radcliffe → Robert De Niro).**
  - Add both actor nodes with the search field: **`People/10980`**
    (Daniel Radcliffe) and **`People/380`** (Robert De Niro).
  - **Select exactly two nodes** (click one, then {{< kbd "Shift" >}}- or
    {{< kbd "Ctrl" >}}-click the other), right-click one of them, and click
    **Shortest Path**. The nodes and edges of one shortest path between them are
    added to the canvas — no AQL required.
  - Expected path: Daniel Radcliffe → *The Tailor of Panama* → Dylan Baker →
    *Hide and Seek* → Robert De Niro.
  - Frame it as a classic "degrees of separation" question, and note the path
    alternates person/movie hops because `ActedIn` connects People and Movies.
- **Tidy up the canvas by removing nodes.**
  - The canvas gets busy fast. To focus, select the nodes you don't need,
    right-click one, and click **Dismiss # nodes** — or select the few you want
    to keep and click **Dismiss other nodes** to banish everyone else.
  - Reassure the reader: dismissing only hides nodes on the canvas, it does
    **not** delete the underlying documents, and they can be added back anytime.
    Use **Clear graph** (bottom-right toolbar) to wipe the canvas and start over.
- **Give the graph a movie-night makeover (styling).**
  - A wall of identical grey circles is no fun. Open the **Legend** panel on the
    right, pick the `Movies` collection, and give it a film icon; pick `People`
    and give them a person icon and a different color.
  - Switch the `Movies` **Label** to show `title` (and `People` to `name`) so you
    can read the graph at a glance instead of hovering every node.
  - Mention attribute-based rules as the fun next step — e.g. color every movie
    with `vote_average >= 8` gold to make the crowd-pleasers pop.

## Next steps

- Continue to [ArangoDB core features](core.md) to query this dataset with AQL,
  traverse the movie graph, and add indexes (including a vector index for
  semantic search).
