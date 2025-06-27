---
title: k Shortest Paths in AQL
menuTitle: k Shortest Paths
weight: 25
description: >-
  Find a number of shortest paths in the order of increasing path length or weight
---
## General query idea

This type of query finds the first *k* paths in order of length
(or weight) between two given documents (*startVertex* and *targetVertex*) in
your graph.

Every such path is returned as a JSON object with three components:

- an array containing the `vertices` on the path
- an array containing the `edges` on the path
- the `weight` of the path, that is the sum of all edge weights

If no `weightAttribute` is specified, the weight of the path is just its length.

{{< youtube id="XdITulJFdVo" >}}

**Example**

Here is an example graph to explain how the k Shortest Paths algorithm works:

![Train Connection Map](../../../images/train_map.png)

Each ellipse stands for a train station with the name of the city written inside
of it. They are the vertices of the graph. Arrows represent train connections
between cities and are the edges of the graph. The numbers near the arrows
describe how long it takes to get from one station to another. They are used
as edge weights.

Let us assume that you want to go from **Aberdeen** to **London** by train.

You expect to see the following vertices on *the* shortest path, in this order:

1. Aberdeen
2. Leuchars
3. Edinburgh
4. York
5. London

By the way, the weight of the path is: 1.5 + 1.5 + 3.5 + 1.8 = **8.3**.

Let us look at alternative paths next, for example because you know that the
direct connection between York and London does not operate currently.
An alternative path, which is slightly longer, goes like this:

1. Aberdeen
2. Leuchars
3. Edinburgh
4. York
5. **Carlisle**
6. **Birmingham**
7. London

Its weight is: 1.5 + 1.5 + 3.5 + 2.0 + 1.5 = **10.0**.

Another route goes via Glasgow. There are seven stations on the path as well,
however, it is quicker if you compare the edge weights:

1. Aberdeen
2. Leuchars
3. Edinburgh
4. **Glasgow**
5. Carlisle
6. Birmingham
7. London

The path weight is lower: 1.5 + 1.5 + 1.0 + 1.0 + 2.0 + 1.5 = **8.5**.

## Syntax

The syntax for k Shortest Paths queries is similar to the one for
[Shortest Path](shortest-path.md) and there are also two options to
either use a named graph or a set of edge collections. It only emits a path
variable however, whereas `SHORTEST_PATH` emits a vertex and an edge variable.

{{< warning >}}
It is highly recommended that you use a **LIMIT** statement, as
k Shortest Paths is a potentially expensive operation. On large connected
graphs it can return a large number of paths, or perform an expensive
(but unsuccessful) search for more short paths.
{{< /warning >}}

### Working with named graphs

```aql
FOR path
  IN OUTBOUND|INBOUND|ANY K_SHORTEST_PATHS
  startVertex TO targetVertex
  GRAPH graphName
  [OPTIONS options]
  [LIMIT offset, count]
```

- `FOR`: Emits the variable **path** which contains one path as an object containing 
   `vertices`, `edges`, and the `weight` of the path.
- `IN` `OUTBOUND|INBOUND|ANY`: Defines in which direction
  edges are followed (outgoing, incoming, or both).
- `K_SHORTEST_PATHS`: The keyword to compute k Shortest Paths
- **startVertex** `TO` **targetVertex** (both string\|object): The two vertices between
  which the paths are computed. This can be specified in the form of
  a ID string or in the form of a document with the attribute `_id`. All other
  values lead to a warning and an empty result. If one of the specified
  documents does not exist, the result is empty as well and there is no warning.
- `GRAPH` **graphName** (string): The name identifying the named graph. Its vertex and
  edge collections are looked up by the path search.
- `OPTIONS` **options** (object, *optional*):
  See the [path search options](#path-search-options).
- `LIMIT` (see [LIMIT operation](../high-level-operations/limit.md), *optional*):
  the maximal number of paths to return. It is highly recommended to use
  a `LIMIT` for `K_SHORTEST_PATHS`.

{{< info >}}
k Shortest Paths traversals do not support negative weights. If a document
attribute (as specified by `weightAttribute`) with a negative value is
encountered during traversal, or if `defaultWeight` is set to a negative
number, then the query is aborted with an error.
{{< /info >}}

### Working with collection sets

```aql
FOR path
  IN OUTBOUND|INBOUND|ANY K_SHORTEST_PATHS
  startVertex TO targetVertex
  edgeCollection1, ..., edgeCollectionN
  [OPTIONS options]
  [LIMIT offset, count]
```

Instead of `GRAPH graphName` you can specify a list of edge collections.
The involved vertex collections are determined by the edges of the given
edge collections. 

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

For k shortest paths with a list of edge collections you can optionally specify the
direction for some of the edge collections. Say for example you have three edge
collections *edges1*, *edges2* and *edges3*, where in *edges2* the direction
has no relevance, but in *edges1* and *edges3* the direction should be taken into
account. In this case you can use `OUTBOUND` as general search direction and `ANY`
specifically for *edges2* as follows:

```aql
FOR vertex IN OUTBOUND K_SHORTEST_PATHS
  startVertex TO targetVertex
  edges1, ANY edges2, edges3
```

All collections in the list that do not specify their own direction use the
direction defined after `IN` (here: `OUTBOUND`). This allows to use a different
direction for each collection in your path search.

## Examples

You can load the `kShortestPathsGraph` example graph to get a named graph that
reflects some possible train connections in Europe and North America.

![Train Connection Map](../../../images/train_map.png)

```js
---
name: GRAPHKSP_01_create_graph
description: ''
---
~addIgnoreCollection("places");
~addIgnoreCollection("connections");
var examples = require("@arangodb/graph-examples/example-graph");
var graph = examples.loadGraph("kShortestPathsGraph");
db.places.toArray();
db.connections.toArray();
```

Suppose you want to query a route from **Aberdeen** to **London**, and
compare the outputs of `SHORTEST_PATH` and `K_SHORTEST_PATHS` with
`LIMIT 1`. Note that while `SHORTEST_PATH` and `K_SHORTEST_PATH` with
`LIMIT 1` should return a path of the same length (or weight), they do
not need to return the same path.

Using `SHORTEST_PATH`:

```aql
---
name: GRAPHKSP_01_Aberdeen_to_London
description: ''
dataset: kShortestPathsGraph
---
FOR v, e IN OUTBOUND SHORTEST_PATH 'places/Aberdeen' TO 'places/London'
GRAPH 'kShortestPathsGraph'
    RETURN { place: v.label, travelTime: e.travelTime }
```

Using `K_SHORTEST_PATHS`:

```aql
---
name: GRAPHKSP_02_Aberdeen_to_London
description: ''
dataset: kShortestPathsGraph
---
FOR p IN OUTBOUND K_SHORTEST_PATHS 'places/Aberdeen' TO 'places/London'
GRAPH 'kShortestPathsGraph'
    LIMIT 1
    RETURN { places: p.vertices[*].label, travelTimes: p.edges[*].travelTime }
```

With `K_SHORTEST_PATHS`, you can ask for more than one option for a route:

```aql
---
name: GRAPHKSP_03_Aberdeen_to_London
description: ''
dataset: kShortestPathsGraph
---
FOR p IN OUTBOUND K_SHORTEST_PATHS 'places/Aberdeen' TO 'places/London'
GRAPH 'kShortestPathsGraph'
    LIMIT 3
    RETURN {
        places: p.vertices[*].label,
        travelTimes: p.edges[*].travelTime,
        travelTimeTotal: SUM(p.edges[*].travelTime)
    }
```

If you ask for routes that don't exist, you get an empty result
(from **Aberdeen** to **Toronto**):

```aql
---
name: GRAPHKSP_04_Aberdeen_to_Toronto
description: ''
dataset: kShortestPathsGraph
---
FOR p IN OUTBOUND K_SHORTEST_PATHS 'places/Aberdeen' TO 'places/Toronto'
GRAPH 'kShortestPathsGraph'
    LIMIT 3
    RETURN {
        places: p.vertices[*].label,
        travelTimes: p.edges[*].travelTime,
        travelTimeTotal: SUM(p.edges[*].travelTime)
    }
```

You can use the `travelTime` attribute that connections have as edge weights to
take into account which connections are quicker. A high default weight is set,
to be used if an edge has no `travelTime` attribute (not the case with the
example graph). This returns the top three routes with the fewest changes
and favoring the least travel time for the connection **Saint Andrews**
to **Cologne**:

```aql
---
name: GRAPHKSP_05_StAndrews_to_Cologne
description: ''
dataset: kShortestPathsGraph
---
FOR p IN OUTBOUND K_SHORTEST_PATHS 'places/StAndrews' TO 'places/Cologne'
GRAPH 'kShortestPathsGraph'
OPTIONS {
    weightAttribute: 'travelTime',
    defaultWeight: 15
}
    LIMIT 3
    RETURN {
        places: p.vertices[*].label,
        travelTimes: p.edges[*].travelTime,
        travelTimeTotal: SUM(p.edges[*].travelTime)
    }
```

And finally clean up by removing the named graph:

```js
---
name: GRAPHKSP_99_drop_graph
description: ''
---
var examples = require("@arangodb/graph-examples/example-graph");
examples.dropGraph("kShortestPathsGraph");
~removeIgnoreCollection("places");
~removeIgnoreCollection("connections");
```
