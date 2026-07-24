---
title: All Shortest Paths in AQL
menuTitle: All Shortest Paths
weight: 20
description: >-
  Find all paths of shortest length between two nodes
---
## General query idea

This type of query finds all paths of shortest length between two given
documents (*startNode* and *endNode*) in your graph.

Every returned path is a JSON object with two attributes:

- An array containing the `vertices` on the path.
- An array containing the `edges` on the path.

**Example**

A visual representation of the example graph:

![Train Connection Map](../../../../images/train_map.png)

Each ellipse stands for a train station with the name of the city written inside
of it. They are the nodes of the graph. Arrows represent train connections
between cities and are the edges of the graph.

Assuming that you want to go from **Carlisle** to **London** by train, the
expected two shortest paths are:

1. Carlisle – Birmingham – London
2. Carlisle – York – London

Another path that connects Carlisle and London is
Carlisle – Glasgow – Edinburgh – York – London, but it has two more stops and
is therefore not a path of the shortest length.

## Syntax

The syntax for All Shortest Paths queries is similar to the one for
[Shortest Path](shortest-path.md) and there are also two options to
either use a named graph or a set of edge collections. It only emits a path
variable however, whereas `SHORTEST_PATH` emits a node and an edge variable.

### Working with named graphs

```aql
FOR path
  IN OUTBOUND|INBOUND|ANY ALL_SHORTEST_PATHS
  startNode TO endNode
  GRAPH graphName
  [OPTIONS options]
```

- `FOR`: Emits the variable **path** which contains one shortest path as an
  object, with the `vertices` (nodes) and `edges` of the path.
- `IN` `OUTBOUND|INBOUND|ANY`: Defines in which direction
  edges are followed (outgoing, incoming, or both)
- `ALL_SHORTEST_PATHS`: The keyword to compute All Shortest Paths
- **startNode** `TO` **endNode** (both string\|object): The two nodes between
  which the paths are computed. This can be specified in the form of
  a ID string or in the form of a document with the attribute `_id`. All other
  values result in a warning and an empty result. If one of the specified
  documents does not exist, the result is empty as well and there is no warning.
- `GRAPH` **graphName** (string): The name identifying the named graph. Its node and
  edge collections are looked up for the path search.
- `OPTIONS` **options** (object, *optional*):
  See the [path search options](#path-search-options).

{{< info >}}
All Shortest Paths traversals do not support edge weights.
{{< /info >}}

### Working with collection sets

```aql
FOR path
  IN OUTBOUND|INBOUND|ANY ALL_SHORTEST_PATHS
  startNode TO endNode
  edgeCollection1, ..., edgeCollectionN
```

Instead of `GRAPH graphName` you can specify a list of edge collections.
The involved node collections are determined by the edges of the given
edge collections. 

### Path search options

You can optionally specify the following options to modify the execution of a
graph path search. If you specify unknown options, query warnings are raised.

#### `useCache`

<small>Introduced in: v3.12.2</small>

Whether to use the in-memory cache for edges. The default is `true`.

You can set this option to `false` to not make a large graph operation pollute
the edge cache.

### Traversing in mixed directions

For All Shortest Paths with a list of edge collections, you can optionally specify the
direction for some of the edge collections. Say, for example, you have three edge
collections *edges1*, *edges2* and *edges3*, where in *edges2* the direction
has no relevance, but in *edges1* and *edges3* the direction should be taken into
account. In this case you can use `OUTBOUND` as a general search direction and `ANY`
specifically for *edges2* as follows:

```aql
FOR path IN OUTBOUND ALL_SHORTEST_PATHS
  startNode TO endNode
  edges1, ANY edges2, edges3
```

All collections in the list that do not specify their own direction use the
direction defined after `IN` (here: `OUTBOUND`). This allows using a different
direction for each collection in your path search.

### Graph path searches in a cluster

Due to the nature of graphs, edges may reference nodes from arbitrary
collections. Following the paths can thus involve documents from various
collections and it is not possible to predict which are visited in a path
search - unless you use named graphs that define all node and edge collections
that belong to them and the graph data is consistent.

If you use anonymous graphs / collection sets for graph queries, which node
collections need to be loaded by the graph engine can deduced automatically if
there is a named graph with a matching edge collection in its edge definitions
(introduced in v3.12.6). Edge collections are always declared explicitly in
queries, directly or via referencing a named graph.

Without a named graph, the involved node collections can only be determined at
run time. Use the [`WITH` operation](../high-level-operations/with.md) to
declare the node collections upfront. This is required for path searches
using collection sets in cluster deployments (if there is no named graph to
deduce the node collections from). Declare the collection of the start node as
well if it's not declared already (like by a `FOR` loop).

For example, suppose you have two node collections, `person` and `movie`, and
an `acts_in` edge collection that connects them. If you want to run a path search
query that starts (and ends) at a person that you specify with its document ID,
you need to declare both node collections at the beginning of the query:

```aql
WITH person, movie
FOR p IN ANY ALL_SHORTEST_PATHS "person/1544" TO "person/52560" acts_in
  RETURN p.vertices[*].label
```

However, if there is a named graph that includes an edge definition for the
`acts_in` edge collection, with `person` as the _from_ collection and `movie`
as the _to_ collection, you can omit `WITH person, movie`. That is, if you
specify `acts_in` as an edge collection in an anonymous graph query, all
named graphs are checked for this edge collection, and if there is a matching
edge definition, its node collections are automatically added as data sources to
the query.

```aql
FOR p IN ANY ALL_SHORTEST_PATHS "person/1544" TO "person/52560" acts_in
  RETURN p.vertices[*].label

// Chris Rock --> Dogma <-- Ben Affleck --> Surviving Christmas <-- Jennifer Morrison
// Chris Rock --> The Longest Yard <-- Rob Schneider --> Big Stan <-- Jennifer Morrison
// Chris Rock --> Down to Earth <-- John Cho --> Star Trek <-- Jennifer Morrison
```

You can still declare collections manually, in which case they are added as
data sources in addition to automatically deduced collections.

## Examples

Load an example graph to get a named graph that reflects some possible
train connections in Europe and North America:

![Train Connection Map](../../../../images/train_map.png)

```js
---
name: GRAPHASP_01_create_graph
description: ''
---
~addIgnoreCollection("places");
~addIgnoreCollection("connections");
var examples = require("@arangodb/graph-examples/example-graph");
var graph = examples.loadGraph("kShortestPathsGraph");
db.places.toArray();
db.connections.toArray();
```

Suppose you want to query a route from **Carlisle** to **London**, and
compare the outputs of `SHORTEST_PATH`, `K_SHORTEST_PATHS` and `ALL_SHORTEST_PATHS`.
Note that `SHORTEST_PATH` returns any of the shortest paths, whereas
`ALL_SHORTEST_PATHS` returns all of them. `K_SHORTEST_PATHS` returns the
shortest paths first but continues with longer paths, until it found all routes
or reaches the defined limit (the number of paths).

Using `SHORTEST_PATH` to get one shortest path:

```aql
---
name: GRAPHASP_01_Carlisle_to_London
description: ''
dataset: kShortestPathsGraph
---
FOR v, e IN OUTBOUND SHORTEST_PATH 'places/Carlisle' TO 'places/London'
GRAPH 'kShortestPathsGraph'
  RETURN { place: v.label }
```

Using `ALL_SHORTEST_PATHS` to get both shortest paths:

```aql
---
name: GRAPHASP_02_Carlisle_to_London
description: ''
dataset: kShortestPathsGraph
---
FOR p IN OUTBOUND ALL_SHORTEST_PATHS 'places/Carlisle' TO 'places/London'
GRAPH 'kShortestPathsGraph'
  RETURN { places: p.vertices[*].label }
```

Using `K_SHORTEST_PATHS` without a limit to get all paths in order of
increasing length:

```aql
---
name: GRAPHASP_03_Carlisle_to_London
description: ''
dataset: kShortestPathsGraph
---
FOR p IN OUTBOUND K_SHORTEST_PATHS 'places/Carlisle' TO 'places/London'
GRAPH 'kShortestPathsGraph'
  RETURN { places: p.vertices[*].label }
```

If you ask for routes that don't exist, you get an empty result
(from **Carlisle** to **Toronto**):

```aql
---
name: GRAPHASP_04_Carlisle_to_Toronto
description: ''
dataset: kShortestPathsGraph
---
FOR p IN OUTBOUND ALL_SHORTEST_PATHS 'places/Carlisle' TO 'places/Toronto'
GRAPH 'kShortestPathsGraph'
  RETURN {
    places: p.vertices[*].label
  }
```

And finally clean up by removing the named graph:

```js
---
name: GRAPHASP_99_drop_graph
description: ''
---
var examples = require("@arangodb/graph-examples/example-graph");
examples.dropGraph("kShortestPathsGraph");
~removeIgnoreCollection("places");
~removeIgnoreCollection("connections");
```
