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
- An import script, `import.sh`, that loads everything in the right order.

## What the dataset is

- Source: **The Movie Database (TMDb)** movie data, originally published as the
  Kaggle "The Movies Dataset" by Rounak Banik (~45k movies, cast, crew,
  keywords, and ~26M user ratings).
- Why a graph: movies, people, genres, and users are naturally connected;
  modeling them as **nodes** and **edges** lets us traverse relationships directly.
  Nodes are also referred to as vertices.
- The data is provided as JSONL files, one per collection, plus embeddings —
  nothing needs to be generated, only imported.

## Step 1: Understand the graph model

- **Document (node) collections** (the "things"):
  - `Movies` — one document per film (`title`, `overview`, `release_date`,
    `budget`, `revenue`, `vote_average`, …); `_key` is the TMDb id.
  - `People` — actors and crew (deduplicated `cast` + `crew`).
  - `Genres`, `Keywords`, `ProductionCompanies`, `ProductionCountries`,
    `SpokenLanguages`, `Collections` — lookup/facet nodes.
  - `Users` — anchors for rating edges (no attributes).
  - `MovieEmbeddings` — a 384-dim vector per movie, sharing the same `_key` as
    `Movies` (joined by primary key, not by an edge).
- **Edge collections** (the relationships):
  - `ActedIn`, `WorkedOn` — People → Movies (with `character` / `job`).
  - `HasGenre`, `HasKeyword`, `ProducedBy`, `ProducedInCountry`,
    `HasSpokenLanguage`, `PartOfCollection` — Movies → facet nodes.
  - `Rated` — Users → Movies (with `rating`, `timestamp`).

Every document whether node or edge has a `_key`, which is a user-provided or
automatically generated string that is unique within its collection.

To make `_key`, `_id`, `_from`, and `_to` concrete, here is an abbreviated
`Movies` node document. Its `_key` is the TMDb id, so its full document ID is
`Movies/8961` (other attributes such as `overview`, `budget`, `revenue`, and
`vote_average` are omitted here):

```json
{
  "_key": "8961",
  "_id": "Movies/8961",
  "title": "Bad Boys II",
  "release_date": "2003-07-18"
}
```

An edge document adds `_from` and `_to`, which reference the two documents it
connects by their IDs. This `ActedIn` edge links a person to the movie above
(the attribute values are illustrative):

```json
{
  "_from": "People/2888",
  "_to": "Movies/8961",
  "character": "Mike Lowrey"
}
```

`MovieEmbeddings` is a separate collection rather than a field on `Movies` so
that the movie documents stay lean and the embeddings can be regenerated or
replaced independently, without touching the movie data.

## Step 2: Prerequisites

- A running data platform from [Evaluate locally](evaluate-locally.md), reachable
  on your machine. If you followed that tutorial, keep the `kubectl port-forward`
  from its last step running so the platform is available on `localhost:8529`.
- **Docker** or **Podman** installed. You do not install the ArangoDB client
  tools (`arangoimport`, `arangosh`) directly — they ship inside the
  `arangodb/enterprise` container image, and the script runs there, independent
  of your type of operating system.
- The provided `jsonl/` directory and `import.sh` script on disk, in the same
  directory.
- The endpoint and credentials for your data platform (you pass these to the
  script in Step 3; by default it targets `https://localhost:8529` as user
  `root`).

## Step 3: Import the dataset

{{< warning >}}
Before you run the import, check that the target database (`movies` by default,
or whatever you set `ARANGO_DB` to) does not already exist. The script creates
it only if it is missing, but if a database of that name is already present, the
import adds the dataset's collections alongside your existing data or
**overwrites** it.
{{< /warning >}}

- The script is a POSIX shell script that calls only `arangoimport` and
  `arangosh`, both of which are in the `arangodb/enterprise` image. Run it inside a
  throwaway container, mounting the current directory (which holds `jsonl/` and
  `import.sh`) so the tools can read the files:

  ```sh
  read -rs -p "ArangoDB password: " ARANGO_PASSWORD; echo; export ARANGO_PASSWORD

  docker run --rm \
    --add-host host.docker.internal:host-gateway \
    -e ARANGO_ENDPOINT="https://host.docker.internal:8529" \
    -e ARANGO_PASSWORD \
    -v "$PWD:/import:Z" -w /import \
    arangodb/enterprise:latest sh import.sh
  ```

- From inside a container, `localhost` is the container itself, not your machine,
  so the endpoint uses `host.docker.internal` to reach the `port-forward` running
  on your host. With **Podman**, replace `docker` with `podman` and drop the
  `--add-host` line (Podman resolves `host.docker.internal` on its own). The
  endpoint uses `https://` because the data platform serves HTTPS; the self-signed
  certificate is accepted without extra flags.

- On **SELinux**-enforcing hosts (Fedora, RHEL, CentOS), the container cannot read
  a bind-mounted directory until it is relabeled, and the tools otherwise fail
  with a permission error even though the files are readable on your host. The
  `:Z` suffix on the `-v` mount above handles this by relabeling the directory for
  container access; it is a harmless no-op on hosts without SELinux, so you can
  leave it in either way. (Use lowercase `:z` instead if the directory is shared
  with other containers, or `--security-opt label=disable` to skip relabeling
  altogether.)

- The script reads its connection settings from environment variables, each with
  a default, so you can override any of them (with `-e` above) without editing
  the script:
  - `ARANGO_ENDPOINT` (default `https://localhost:8529`)
  - `ARANGO_DB` (default `movies`)
  - `ARANGO_USER` (default `root`)
  - `ARANGO_PASSWORD` (default empty)
  - `ARANGO_FORCE_REIMPORT` (default unset) — when set to any value, disables the
    skip-if-already-complete check described below and reimports every collection.

- The script performs the following steps, in order:
  1. Creates the `movies` database.
  2. Imports every **document** collection for the graph nodes with
     `--create-collection-type document`.
  3. Imports `MovieEmbeddings`.
  4. Imports every **edge** collection with `--create-collection-type edge`.
  5. Registers the `MoviesGraph` as a **named graph**.

- Re-running the script is safe, so if the import is interrupted (for example, a
  network timeout against a remote deployment), just run it again to continue.
  The database and named graph are created only if missing. For each collection,
  the script first compares its document count against the number of lines in the
  source file: if they already match, the collection finished on an earlier run
  and is skipped, so a re-run does not redo work that already succeeded. A
  collection that is missing or only partially loaded is imported:
  - Document collections use `--on-duplicate ignore`, so already-imported
    documents are skipped and only the remainder is inserted — a partial load
    resumes where it stopped.
  - Edge collections have no `_key` to deduplicate on, so they use `--overwrite`
    and are truncated and reloaded cleanly rather than duplicated.

- The count check is a fast guard against unnecessary reloads, not an integrity
  check — a matching count does not prove the stored documents are correct. If
  you suspect a collection's data is wrong despite a matching count, set
  `ARANGO_FORCE_REIMPORT=1` (with `-e` on the `docker run`) to reimport every
  collection regardless.

## Step 4: Verify the import

With the import finished, confirm the data landed as expected before moving on.
You do this in the web interface, working with the `movies` database you just
created.

- **Switch to the `movies` database.** Use the database selector in the web
  interface to open `movies` (the platform starts you in `_system`).
- **Check the collections and their document counts.** Click the **Database**
  icon in the left sidebar, then go to **Management** > **Collections**. You see
  every collection the script created — the document collections (`Movies`,
  `People`, `Genres`, …, `MovieEmbeddings`) and the edge collections (`ActedIn`,
  `Rated`, …). Each row shows its document count. A non-zero count for `Movies`
  and the other collections confirms the import populated them, rather than only
  creating empty collections.
- **Open a document.** Click the `Movies` collection and open a document.
  You see the same fields introduced in Step 1 —
  `title`, `release_date`, and the rest — which confirms the JSONL content
  imported intact, not just that a document with the right count exists.

## Step 5: Explore the graph in the visualizer

Now that the data is loaded, see the model from Step 1 come to life. Open the
web interface, go to **Graphs**, and open **MoviesGraph**. The rest of this step
walks through the most common things you do in the viewer. For the full
reference, see the [Graph Visualizer](../../platform-suite/graph-visualizer.md)
documentation.

When it first opens, the visualizer seeds the canvas with a random node and its
immediate neighborhood so it is not empty. That is just a starting sample, not
part of this walkthrough, so clear it first for a clean slate: click
**Clear graph** in the bottom-right toolbar. You then build the canvas up
deliberately in the steps below.

- **Set up readable labels and icons first.** By default every node is a grey
  circle labeled with its document ID, which becomes unreadable as soon as you
  expand one. Configure this once through the **Legend** panel on the right:
  - For `Movies`, set the **Label** to `title` and give it a clapperboard icon
    (open the icon picker and search for `movie`).
  - For `People`, set the **Label** to `name` and give it a user-silhouette icon
    (search for `account`); optionally choose a different color so people and
    movies are easy to tell apart at a glance.
  - For the `ActedIn` edge, set the **Label** to `character`.

  From here on, anything you add is labeled by its title, name, or character
  instead of an opaque ID.

- **Add a node by its document ID.**
  1. Click the **Search & add nodes to canvas** field in the top bar to open the
     add-nodes dialog.
  2. Choose the **Node type** `People` and type the ID **`10980`** (Daniel
     Radcliffe) into the search field. The search matches any key *containing* what
     you type, so the list shows every person whose key includes `10980` (such as
     `People/109802` and `People/1098026`), each labeled by its document ID and key.
     The exact match `People/10980` is at the top of the list — select it and click
     **Add 1 node**.
  3. The node appears as **Daniel Radcliffe** with the person icon, using the
     `name` label you set. In case you don't see the node, click **Fit all nodes**
     in the bottom-right toolbar to bring it into view.
- **Expand the node to see its neighborhood.**
  - Right-click the Daniel Radcliffe node, click **Expand (#)**, then **All (#)**.
    This pulls in the 22 movies he acted in through `ActedIn` edges — each movie
    node shows its `title`, and each edge shows the `character` he played.
  - Notice how one person fans out into the surrounding graph, and how the edge
    labels (character names) tell you what each relationship means.
  - We start from a person rather than a movie on purpose. Expanding a popular
    movie would also pull in a batch of `Users` (up to 100 at a time) through its
    rating edges, and those `Users` nodes carry no attributes — they would clutter
    the canvas without adding anything to read.
- **Add nodes with an AQL query (a basic filter).**
  1. Click **Queries** in the top bar, open the **Queries** tab, and click
     **New query**.
  2. Enter a simple filter that returns whole documents — no traversal yet — and
     click **Run query**:
     ```aql
     FOR m IN Movies
       FILTER m.vote_average >= 8 AND m.vote_count >= 5000
       RETURN m
     ```
  3. The matching movie nodes appear on the canvas. This is the core pattern to
     remember: a query returns documents, and those become nodes on the canvas.
- **Find the shortest path between two actors (Daniel Radcliffe → Robert De Niro).**
  1. Daniel Radcliffe (**`People/10980`**) is already on the canvas from the
     earlier steps; add Robert De Niro (**`People/380`**) with the search field so
     both actor nodes are present.
  2. **Select exactly two nodes** (click one, then {{< kbd "Shift" >}}- or
     {{< kbd "Ctrl" >}}-click the other), right-click one of them, and click
     **Shortest Path**. The nodes and edges of one shortest path between them are
     added to the canvas — no AQL required.
  3. Expected path: Daniel Radcliffe → *The Tailor of Panama* → Dylan Baker →
    *Hide and Seek* → Robert De Niro.
  4. This is the classic "degrees of separation" question. Notice how the path
     alternates between person and movie hops, because `ActedIn` always connects a
     person to a movie.
- **Tidy up the canvas by removing nodes.**
  - The canvas gets busy fast. To focus, select the nodes you don't need,
    right-click one, and click **Dismiss # nodes** — or select the few you want
    to keep and click **Dismiss other nodes** to banish everyone else.
  - Dismissing only hides nodes on the canvas; it does **not** delete the
    underlying documents, and you can add them back at any time. Use **Clear
    graph** (bottom-right toolbar) to wipe the canvas and start over.
- **Take the styling further.** You already set labels and icons at the start of
  this step. As a fun next step, try attribute-based styling rules — for example,
  color every movie with `vote_average >= 8` gold to make the crowd-pleasers pop.

## Next steps

- Continue to [ArangoDB core features](core.md) to query this dataset with AQL,
  traverse the movie graph, and add indexes (including a vector index for
  semantic search).
