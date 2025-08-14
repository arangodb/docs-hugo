---
title: Shortest Path in AQL
menuTitle: Shortest Path
weight: 15
description: >-
  Find one path of shortest length between two nodes
---
## General query idea

This type of query finds the shortest path between two given documents
(*startNode* and *endNode*) in your graph. If there are multiple
shortest paths, the path with the lowest weight or a random one (in case
of a tie) is returned.

The shortest path search emits the following two variables for every step of
the path:

1. The node on this path.
2. The edge pointing to it.

### Example execution

Let's take a look at a simple example to explain how it works.
This is the graph that you are going to find a shortest path on:

![traversal graph](../../../images/traversal_graph.png)

You can use the following parameters for the query:

1. You start at the node **A**.
2. You finish with the node **D**.

So, obviously, you have the nodes **A**, **B**, **C** and **D** on the
shortest path in exactly this order. Then, the shortest path statement
returns the following pairs:

| Node  | Edge  |
|-------|-------|
|   A   | null  |
|   B   | A → B |
|   C   | B → C |
|   D   | C → D |

Note that the first edge is always `null` because there is no edge pointing
to the *startNode*.

## Syntax

The next step is to see how you can write a shortest path query.
You have two options here, you can either use a named graph or a set of edge
collections (anonymous graph).

### Working with named graphs

```aql
FOR node[, edge]
  IN OUTBOUND|INBOUND|ANY SHORTEST_PATH
  startNode TO endNode
  GRAPH graphName
  [OPTIONS options]
```

- `FOR`: Emits up to two variables:
  - **node** (object): The current node on the shortest path
  - **edge** (object, *optional*): The edge pointing to the node
- `IN` `OUTBOUND|INBOUND|ANY`: Defines in which direction edges are followed
  (outgoing, incoming, or both)
- **startNode** `TO` **endNode** (both string\|object): The two nodes between
  which the shortest path is computed. This can be specified in the form of
  an ID string or in the form of a document with the attribute `_id`. All other
  values lead to a warning and an empty result. If one of the specified
  documents does not exist, the result is empty as well and there is no warning.
- `GRAPH` **graphName** (string): The name identifying the named graph. Its node and
  edge collections are looked up for the path search.
- `OPTIONS` **options** (object, *optional*):
  See the [path search options](#path-search-options).

{{< info >}}
Shortest Path traversals do not support negative weights. If a document
attribute (as specified by `weightAttribute`) with a negative value is
encountered during traversal, or if `defaultWeight` is set to a negative
number, then the query is aborted with an error.
{{< /info >}}

### Working with collection sets

```aql
FOR node[, edge]
  IN OUTBOUND|INBOUND|ANY SHORTEST_PATH
  startNode TO endNode
  edgeCollection1, ..., edgeCollectionN
  [OPTIONS options]
```

Instead of `GRAPH graphName` you may specify a list of edge collections (anonymous
graph). The involved node collections are determined by the edges of the given
edge collections. The rest of the behavior is similar to the named version.

### Path search options

You can optionally specify the following options to modify the execution of a
graph path search. If you specify unknown options, query warnings are raised.

#### `weightAttribute`

A top-level edge attribute that should be used to read the edge weight (string).

If the attribute does not exist or is not numeric, the `defaultWeight` is used
instead.

The attribute value must not be negative.

#### `defaultWeight`

This value is used as fallback if there is no `weightAttribute` in the
edge document, or if it's not a number (number).

The value must not be negative. The default is `1`.

#### `useCache`

<small>Introduced in: v3.12.2</small>

Whether to use the in-memory cache for edges. The default is `true`.

You can set this option to `false` to not make a large graph operation pollute
the edge cache.

### Traversing in mixed directions

For shortest path with a list of edge collections you can optionally specify the
direction for some of the edge collections. Say for example you have three edge
collections *edges1*, *edges2* and *edges3*, where in *edges2* the direction
has no relevance, but in *edges1* and *edges3* the direction should be taken into
account. In this case you can use `OUTBOUND` as general search direction and `ANY`
specifically for *edges2* as follows:

```aql
FOR node IN OUTBOUND SHORTEST_PATH
  startNode TO endNode
  edges1, ANY edges2, edges3
```

All collections in the list that do not specify their own direction use the
direction defined after `IN` (here: `OUTBOUND`). This allows to use a different
direction for each collection in your path search.

## Conditional shortest path

The `SHORTEST_PATH` computation only finds an unconditioned shortest path.
With this construct it is not possible to define a condition like: "Find the
shortest path where all edges are of type *X*". If you want to do this, use a
normal [Traversal](traversals.md) instead with the option
`{order: "bfs"}` in combination with `LIMIT 1`.

Please also consider using [`WITH`](../high-level-operations/with.md) to specify the
collections you expect to be involved.

## Examples

Creating a simple symmetric traversal demonstration graph:

![traversal graph](../../../images/traversal_graph.png)

```js
---
name: GRAPHSP_01_create_graph
description: ''
---
~addIgnoreCollection("circles");
~addIgnoreCollection("edges");
var examples = require("@arangodb/graph-examples/example-graph");
var graph = examples.loadGraph("traversalGraph");
db.circles.toArray();
db.edges.toArray();
```

Start with the shortest path from **A** to **D** as above:

```js
---
name: GRAPHSP_02_A_to_D
description: ''
---
db._query(`
  FOR v, e IN OUTBOUND SHORTEST_PATH 'circles/A' TO 'circles/D' GRAPH 'traversalGraph'
    RETURN [v._key, e._key]
`);

db._query(`
  FOR v, e IN OUTBOUND SHORTEST_PATH 'circles/A' TO 'circles/D' edges
    RETURN [v._key, e._key]
`);
```

You can see that expectations are fulfilled. You find the nodes in the
correct ordering and the first edge is `null`, because no edge is pointing
to the start node on this path.

You can also compute shortest paths based on documents found in collections:

```js
---
name: GRAPHSP_03_A_to_D
description: ''
---
db._query(`
  FOR a IN circles
    FILTER a._key == 'A'
    FOR d IN circles
      FILTER d._key == 'D'
      FOR v, e IN OUTBOUND SHORTEST_PATH a TO d GRAPH 'traversalGraph'
        RETURN [v._key, e._key]
`);

db._query(`
  FOR a IN circles
    FILTER a._key == 'A'
    FOR d IN circles
      FILTER d._key == 'D'
      FOR v, e IN OUTBOUND SHORTEST_PATH a TO d edges
        RETURN [v._key, e._key]
`);
```

And finally clean it up again:

```js
---
name: GRAPHSP_99_drop_graph
description: ''
---
var examples = require("@arangodb/graph-examples/example-graph");
examples.dropGraph("traversalGraph");
~removeIgnoreCollection("circles");
~removeIgnoreCollection("edges");
```
