---
title: Graph traversals in AQL
menuTitle: Traversals
weight: 10
description: >-
  You can traverse named graphs and anonymous graphs with a native AQL
  language construct
---
A graph traversal starts at a vertex and follows the edges connected to it, then
the edges of the vertices it reaches, and so on, up to a maximum depth. In AQL,
you write a traversal as a special form of a `FOR` loop that emits the visited
vertices, as well as the edges and paths that lead to them. Vertices that are reached
with fewer edges than a minimum depth are not emitted.
You can control the direction of the edges, the order of the traversal, and
when to stop following a path.

## How traversals work

Every sequence of edges that a traversal follows from the start vertex forms a
_path_. For each path whose length is between the minimum and the maximum
depth, the traversal emits up to three variables:

1. The vertex at the end of the path (`v` in the examples below).
2. The last edge of the path (`e`). It is `null` for the start vertex, which is
   only emitted if the minimum depth is `0`.
3. The path itself (`p`) as an object with the following attributes:
   - `vertices`: an array with the vertices of the path, starting with the start
     vertex and ending with the emitted vertex
   - `edges`: an array with the edges of the path, where the n-th edge connects
     the n-th and the (n+1)-th vertex
   - `weights`: an array with the accumulated edge weights at each vertex, see the
     [`order` option](#order)

The examples in this section use the
[`serviceGraph`](../../graphs/example-graphs.md#service-graph) example graph.
Its vertices are the services of an application, stored in a `services`
collection, and its edges are the calls from one service to another, stored in
a `calls` edge collection, with the protocol and the latency in milliseconds:

{{< embed-svg "service-graph" >}}

### Traversal walkthrough

The following query follows the calls from the `api` service and emits the
services that are two or three calls away.

```aql
---
name: GRAPHTRAV_how_dfs
description: |
  Follow the outbound edges of the `api` service with a depth of 2 to 3 and
  return the services along each path:
dataset: serviceGraph
---
FOR v, e, p IN 2..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  RETURN CONCAT_SEPARATOR(" → ", p.vertices[*]._key)
```

The following diagram shows the paths that the traversal follows, by depth:

{{< embed-svg "traversal-explained" >}}

- The traversal visits `auth`, `catalog`, and `orders` at depth 1 to continue
  from there, but it doesn't emit them because the minimum depth is `2`.
- `db` is emitted three times because three different paths lead to it.
  Every path is a separate result, even if it ends at a vertex that was already
  emitted.
- `orders` is emitted again at depth 3 because `payments` calls `orders` back.
  This path contains `orders` twice but each edge only once, which is allowed
  by default. See [Cycles and uniqueness](#cycles-and-uniqueness).
- The traversal doesn't follow the edges of the vertices at depth 3 because the
  maximum depth is `3`.

### What happens at each step

The traversal keeps a queue of paths that it still needs to process. At first,
the queue only holds the path that consists of the start vertex alone. For each
path that the traversal takes from the queue, it performs the following steps:

1. If you restrict the vertex collections with the
   [`vertexCollections` option](#vertexcollections) and the last vertex of the
   path isn't stored in one of them, the path is discarded. The start vertex is
   always allowed.
2. The [`PRUNE` condition](#pruning) is evaluated, at every depth including the
   start vertex. If it is fulfilled, the traversal doesn't follow the path any
   further, but the path can still be emitted.
3. Conditions on the vertex at a specific position of the path, like
   `FILTER p.vertices[2].tier == "data"`, or on all vertices of the path, like
   `FILTER p.vertices[*].tier ALL != "external"`, are checked if the optimizer
   could move them into the traversal. If a condition is not fulfilled, the path
   is discarded and not followed any further, as no longer path can fulfill the
   condition either.
4. Conditions on the emitted vertex or edge, like `FILTER v.tier == "data"`, are
   checked if the optimizer could move them into the traversal. If a condition
   is not fulfilled, the path is not emitted, but the traversal still follows it
   because vertices further down the path may fulfill the condition.
5. The uniqueness of vertices and edges on the path is checked according to the
   [`uniqueVertices`](#uniquevertices) and [`uniqueEdges`](#uniqueedges)
   options. A path that violates them is discarded.
6. If the path has at least the minimum length, it is emitted.
7. If the path is shorter than the maximum length and wasn't pruned, the
   traversal looks up the edges of the last vertex in the traversal direction and
   adds a new path to the queue for each of them. Conditions on edges, like
   `FILTER p.edges[*].protocol ALL == "grpc"`, are already checked when looking
   up the edges, so that edges that don't fulfill them don't lead to new paths.

Conditions that the optimizer cannot move into the traversal, like conditions
combined with `OR`, are applied to the emitted paths afterwards.
See [Using filters](#using-filters) for details.

The following three queries show how `PRUNE`, a `FILTER` on the emitted vertex,
and a `FILTER` on the path differ in their effect on the `payments` service.

```aql
---
name: GRAPHTRAV_how_prune
description: |
  `PRUNE` emits `payments` but doesn't follow the calls that it makes:
dataset: serviceGraph
---
FOR v, e, p IN 1..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  PRUNE v._key == "payments"
  RETURN CONCAT_SEPARATOR(" → ", p.vertices[*]._key)
```

```aql
---
name: GRAPHTRAV_how_filter_node
description: |
  A `FILTER` on the emitted vertex doesn't emit `payments` but still follows its
  calls to `bank` and back to `orders`:
dataset: serviceGraph
---
FOR v, e, p IN 1..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  FILTER v._key != "payments"
  RETURN CONCAT_SEPARATOR(" → ", p.vertices[*]._key)
```

```aql
---
name: GRAPHTRAV_how_filter_path
description: |
  A `FILTER` on the vertex at depth 2 of the path discards all paths via `payments`:
dataset: serviceGraph
---
FOR v, e, p IN 1..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  FILTER p.vertices[2]._key != "payments"
  RETURN CONCAT_SEPARATOR(" → ", p.vertices[*]._key)
```

### Traversal order

The [`order` option](#order) determines which path the traversal takes from
the queue next, and thus the order of the results:

- `"dfs"` (default): The traversal takes the path that it added last. It follows
  one path as deep as possible before it continues with the alternatives, and
  emits a path before the longer paths that extend it. This is the order of the
  [walkthrough example](#traversal-walkthrough) above.
- `"bfs"`: The traversal takes the path that it added first. It emits all paths
  of one depth before it continues with the next depth.
- `"weighted"`: The traversal takes the path with the lowest sum of edge weights.
  You can set the attribute to use as the weight of an edge with the
  [`weightAttribute` option](#weightattribute).

The order in which the traversal follows the edges of a single vertex is undefined.

```aql
---
name: GRAPHTRAV_how_bfs
description: |
  A breadth-first traversal emits the paths with two edges before the paths with
  three edges:
dataset: serviceGraph
---
FOR v, e, p IN 2..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  OPTIONS { order: "bfs" }
  RETURN CONCAT_SEPARATOR(" → ", p.vertices[*]._key)
```

```aql
---
name: GRAPHTRAV_how_weighted
description: |
  A weighted traversal emits the paths in the order of increasing latency. The
  `weights` attribute of the path variable holds the accumulated latency at each
  vertex:
dataset: serviceGraph
---
FOR v, e, p IN 2..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  OPTIONS { order: "weighted", weightAttribute: "latencyMs" }
  RETURN { path: CONCAT_SEPARATOR(" → ", p.vertices[*]._key), weights: p.weights }
```

### Cycles and uniqueness

By default, a path cannot contain the same edge more than once, but it can
contain the same vertex multiple times. The traversal therefore follows cycles,
like the one between `orders` and `payments`, until it reaches the maximum
depth. In large graphs with many cycles, the number of paths can grow quickly
with the maximum depth.

You can prevent vertices from occurring more than once on a path by setting the
[`uniqueVertices` option](#uniquevertices) to `"path"`.

```aql
---
name: GRAPHTRAV_how_unique_path
description: |
  The path from `api` via `orders` and `payments` back to `orders` is no longer
  part of the result:
dataset: serviceGraph
---
FOR v, e, p IN 2..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  OPTIONS { uniqueVertices: "path" }
  RETURN CONCAT_SEPARATOR(" → ", p.vertices[*]._key)
```

With `uniqueVertices: "global"`, the traversal visits every vertex at most once,
no matter how many paths lead to it. This requires the `"bfs"` or `"weighted"`
order. The first path that reaches a vertex wins, which is a path with the
fewest edges for `"bfs"` and a path with the lowest weight for `"weighted"`.

```aql
---
name: GRAPHTRAV_how_unique_global
description: |
  `db` is only emitted once, and the paths via `catalog` and `inventory` to `db`
  as well as the path back to `orders` are not part of the result:
dataset: serviceGraph
---
FOR v, e, p IN 2..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  OPTIONS { order: "bfs", uniqueVertices: "global" }
  RETURN CONCAT_SEPARATOR(" → ", p.vertices[*]._key)
```

## Syntax

There are two slightly different syntaxes for traversals in AQL, one for
- [named graphs](../../graphs/_index.md#named-graphs) and another to
- specify a [set of edge collections](#working-with-collection-sets)
  ([anonymous graph](../../graphs/_index.md#anonymous-graphs)).

### Working with named graphs

The syntax for AQL graph traversals using named graphs is as follows
(square brackets denote optional parts and `|` denotes alternatives):

```aql
FOR vertex[, edge[, path]]
  IN [min[..max]]
  OUTBOUND|INBOUND|ANY startVertex
  GRAPH graphName
  [PRUNE [pruneVariable = ]pruneCondition]
  [OPTIONS options]
```

- `FOR`: emits up to three variables:
  - **vertex** (object): the current vertex in a traversal
  - **edge** (object, *optional*): the current edge in a traversal
  - **path** (object, *optional*): representation of the current path with
    two members:
    - `vertices`: an array of all vertices on this path
    - `edges`: an array of all edges on this path
- `IN` `min..max`: the minimal and maximal depth for the traversal:
  - **min** (number, *optional*): edges and vertices returned by this query
    start at the traversal depth of *min* (thus edges and vertices below it are
    not returned). If not specified, it defaults to 1. The minimal
    possible value is 0.
  - **max** (number, *optional*): up to *max* length paths are traversed.
    If omitted, *max* defaults to *min*. Thus only the vertices and edges in
    the range of *min* are returned. *max* cannot be specified without *min*.
- `OUTBOUND|INBOUND|ANY`: follow outgoing, incoming, or edges pointing in either
  direction in the traversal. Note that this can't be replaced by a bind parameter.
- **startVertex** (string\|object): a vertex where the traversal originates from.
  This can be specified in the form of an ID string or in the form of a document
  with the `_id` attribute. All other values lead to a warning and an empty
  result. If the specified document does not exist, the result is empty as well
  and there is no warning.
- `GRAPH` **graphName** (string): the name identifying the named graph.
  Its vertex and edge collections are looked up. Note that the graph name
  is like a regular string, hence it must be enclosed by quote marks, like
  `GRAPH "graphName"`.
- `PRUNE` **expression** (AQL expression, *optional*):
  An expression, like in a `FILTER` statement, which is evaluated in every step of
  the traversal, as early as possible. The semantics of this expression are as follows:
  - If the expression evaluates to `false`, the traversal continues on the current path.
  - If the expression evaluates to `true`, the traversal does not continue on the
    current path. However, the paths up to this point are considered as a result
    (they might still be post-filtered or ignored due to depth constraints).
    For example, a traversal over the graph `(A) -> (B) -> (C)` starting at `A`
    and pruning on `B` results in `(A)` and `(A) -> (B)` being valid paths,
    whereas `(A) -> (B) -> (C)` is not returned because it gets pruned on `B`.

  You can only use a single `PRUNE` clause per `FOR` traversal operation, but
  the prune expression can contain an arbitrary number of conditions using `AND`
  and `OR` statements for complex expressions. You can use the variables emitted
  by the `FOR` operation in the prune expression, as well as all variables
  defined before the traversal.

  You can optionally assign the prune expression to a variable like
  `PRUNE var = <expr>` to use the evaluated result elsewhere in the query,
  typically in a `FILTER` expression.

  See [Pruning](#pruning) for details.
- `OPTIONS` **options** (object, *optional*): See the [traversal options](#traversal-options).

### Working with collection sets

The syntax for AQL graph traversals using collection sets is as follows
(square brackets denote optional parts and `|` denotes alternatives):

```aql
[WITH vertexCollection1[, vertexCollection2[, vertexCollectionN]]]
FOR vertex[, edge[, path]]
  IN [min[..max]]
  OUTBOUND|INBOUND|ANY startVertex
  edgeCollection1[, edgeCollection2[, edgeCollectionN]]
  [PRUNE [pruneVariable = ]pruneCondition]
  [OPTIONS options]
```

- `WITH`: Declaration of collections. Optional for single server instances, but
  required for [graph traversals in a cluster](#graph-traversals-in-a-cluster).
  Needs to be placed at the very beginning of the query.
  - **collections** (collection, *repeatable*): list of vertex collections that
    are involved in the traversal
- **edgeCollections** (collection, *repeatable*): One or more edge collections
  to use for the traversal (instead of using a named graph with `GRAPH graphName`).
  Vertex collections are determined by the edges in the edge collections.
  
  You can override the default traversal direction by setting `OUTBOUND`,
  `INBOUND`, or `ANY` before any of the edge collections.
  
  If the same edge collection is specified multiple times, it behaves as if it
  were specified only once. Specifying the same edge collection is only allowed
  when the collections do not have conflicting traversal directions.

  Views cannot be used as edge collections.
- See the [named graph variant](#working-with-named-graphs) for the remaining
  traversal parameters as well as the [traversal options](#traversal-options).
  The `edgeCollections` restriction option is redundant in this case.

### Traversal options

You can optionally specify the following options to modify the execution of a
graph traversal. If you specify unknown options, query warnings are raised.

#### `order`

Specify which traversal algorithm to use (string):
- `"bfs"` – the traversal is executed breadth-first. The results
  first contain all vertices at depth 1, then all vertices at depth 2 and so on.
- `"dfs"` (default) – the traversal is executed depth-first. It
  first returns all paths from *min* depth to *max* depth for one vertex at
  depth 1, then for the next vertex at depth 1 and so on.
- `"weighted"` - the traversal is a weighted traversal
  (introduced in v3.8.0). Paths are enumerated with increasing cost.
  Also see `weightAttribute` and `defaultWeight`. A returned path has an
  additional attribute `weights` containing the cost of the path after every
  step. The order of paths having the same cost is non-deterministic.
  Negative weights are not supported and abort the query with an error.

#### `bfs`

Deprecated, use `order: "bfs"` instead.

#### `uniqueVertices`

Ensure vertex uniqueness (string):

- `"path"` – it is guaranteed that there is no path returned with a duplicate vertex
- `"global"` – it is guaranteed that each vertex is visited at most once during
  the traversal, no matter how many paths lead from the start vertex to this one.
  If you start with a `min depth > 1` a vertex that was found before *min* depth
  might not be returned at all (it still might be part of a path).
  It is required to set `order: "bfs"` or `order: "weighted"` because with
  depth-first search the results would be unpredictable. **Note:**
  Using this configuration the result is not deterministic any more. If there
  are multiple paths from *startVertex* to *vertex*, one of those is picked.
  In case of a `weighted` traversal, the path with the lowest weight is
  picked, but in case of equal weights it is undefined which one is chosen.
- `"none"` (default) – no uniqueness check is applied on vertices

#### `uniqueEdges`

Ensure edge uniqueness (string):

- `"path"` (default) – it is guaranteed that there is no path returned with a
  duplicate edge
- `"none"` – no uniqueness check is applied on edges. **Note:**
  Using this configuration, the traversal follows edges in cycles.

#### `edgeCollections`

<small>Introduced in: v3.7.0</small>

Restrict edge collections the traversal may visit (string\|array).

If omitted or an empty array is specified, then there are no restrictions.

- A string parameter is treated as the equivalent of an array with a single
  element.
- Each element of the array should be a string containing the name of an
  edge collection.

#### `vertexCollections`

<small>Introduced in: v3.7.0</small>

Restrict vertex collections the traversal may visit (string\|array).

If omitted or an empty array is specified, then there are no restrictions.

- A string parameter is treated as the equivalent of an array with a single
  element.
- Each element of the array should be a string containing the name of a
  vertex collection.
- The starting vertex is always allowed, even if it does not belong to one
  of the collections specified by a restriction.

#### `parallelism`

{{< tag "ArangoDB Enterprise Edition" "AMP" >}}

Parallelize traversal execution (number).
    
If omitted or set to a value of `1`, the traversal execution is not parallelized.
If set to a value greater than `1`, then up to that many worker threads can be
used for concurrently executing the traversal. The value is capped by the number
of available cores on the target machine.

Parallelizing a traversal is normally useful when there are many inputs (start
vertices) that the nested traversal can work on concurrently. This is often the
case when a nested traversal is fed with several tens of thousands of start
vertices, which can then be distributed randomly to worker threads for parallel
execution.

#### `maxProjections`

{{< tag "ArangoDB Enterprise Edition" "AMP" >}}

Specifies the number of document attributes per `FOR` loop to be used as
projections (number). The default value is `5`.

#### `weightAttribute`

Specifies the name of an attribute that is used to look up the weight of an edge
(string).

If no attribute is specified or if it is not present in the edge document then
the `defaultWeight` is used.

The attribute value must not be negative.

{{< info >}}
Weighted traversals do not support negative weights. If a document
attribute (as specified by `weightAttribute`) with a negative value is
encountered during traversal, the query is aborted with an error.
{{< /info >}}

#### `defaultWeight`

Specifies the default weight of an edge (number). The default value is `1`.

The value must not be negative.

{{< info >}}
Weighted traversals do not support negative weights. If `defaultWeight` is set
to a negative number, then the query is aborted with an error.
{{< /info >}}

### Traversing in mixed directions

For traversals with a list of edge collections you can optionally specify the
direction for some of the edge collections. Say for example you have three edge
collections *edges1*, *edges2* and *edges3*, where in *edges2* the direction has
no relevance but in *edges1* and *edges3* the direction should be taken into account.
In this case you can use `OUTBOUND` as general traversal direction and `ANY`
specifically for *edges2* as follows:

```aql
FOR vertex IN OUTBOUND
  startVertex
  edges1, ANY edges2, edges3
```

All collections in the list that do not specify their own direction use the
direction defined after `IN`. This allows to use a different direction for each
collection in your traversal.

### Graph traversals in a cluster

Due to the nature of graphs, edges may reference vertices from arbitrary
collections. Following the paths can thus involve documents from various
collections and it is not possible to predict which are visited in a
traversal. Which collections need to be loaded by the graph engine can only be
determined at run time.

Use the [`WITH` statement](../high-level-operations/with.md) to specify the collections you
expect to be involved. This is required for traversals using collection sets
in cluster deployments.

## Pruning

You can define stop conditions for graph traversals to return specific data and
to improve the query performance. This is called _pruning_ and works by checking
conditions during the traversal as opposed to filtering the results afterwards
(post-filtering). This reduces the amount of data to be checked by stopping the
traversal down specific paths early.

{{< youtube id="4LVeeC0ciCQ" >}}

You can specify one `PRUNE` expression per graph traversal, but it can contain
an arbitrary number of conditions. You can use the vertex, edge, and path
variables emitted by the traversal in a prune expression, as well as all other
variables defined before the `FOR` operation. Note that `PRUNE` is an optional
clause of the `FOR` operation and that the `OPTIONS` clause needs to be placed
after `PRUNE`.

```aql
---
name: GRAPHTRAV_graphPruneExample1
description: ''
dataset: kShortestPathsGraph
---
FOR v, e, p IN 0..10 OUTBOUND "places/Toronto" GRAPH "kShortestPathsGraph"
  PRUNE v.label == "Edmonton"
  OPTIONS { uniqueVertices: "path" }
  RETURN CONCAT_SEPARATOR(" -- ", p.vertices[*].label)
```

The above example shows a graph traversal using the North American part of the
[`kShortestPathsGraph`](../../graphs/example-graphs.md#k-shortest-paths-graph)
example graph, a network of train stations and connections:

{{< embed-svg "train-map-north-america" >}}

The traversal starts at **Toronto**, the traversal depth is
limited to 10, and every station is only visited once. The traversal could
continue up to **Vancouver** at depth 5, but it is stopped early
on this path (the only path in this example) at **Edmonton** because of the
prune expression.

The traversal along paths is stopped as soon as the prune expression evaluates
to `true` for a given path. The current depth is still included in the result,
however. This can be seen in the query result of the example which includes the
Edmonton vertex at which it stopped.

The next examples use the European part of the same example graph:

{{< embed-svg "train-map-europe" >}}

The following example starts a traversal at **London**, with a
depth between 2 and 3, and every station is only visited once. The station names
as well as the travel times are returned:

```aql
---
name: GRAPHTRAV_graphPruneExample2
description: ''
dataset: kShortestPathsGraph
---
FOR v, e, p IN 2..3 OUTBOUND "places/London" GRAPH "kShortestPathsGraph"
  OPTIONS { uniqueVertices: "path" }
  RETURN CONCAT_SEPARATOR(" -- ", INTERLEAVE(p.vertices[*].label, p.edges[*].travelTime))
```

The same example with an added prune expression, with vertex and edge conditions:

```aql
---
name: GRAPHTRAV_graphPruneExample3
description: ''
dataset: kShortestPathsGraph
---
FOR v, e, p IN 2..3 OUTBOUND "places/London" GRAPH "kShortestPathsGraph"
  PRUNE v.label == "Carlisle" OR e.travelTime > 3
  OPTIONS { uniqueVertices: "path" }
  RETURN CONCAT_SEPARATOR(" -- ", INTERLEAVE(p.vertices[*].label, p.edges[*].travelTime))
```

If either the **Carlisle** vertex or an edge with a travel time of over three
hours is encountered, the subsequent paths are pruned. In the example, this
removes the train connections to **Birmingham**, **Glasgow**, and **York**,
which come after **Carlisle**, as well as the connections to and via
**Edinburgh** because of the four hour duration for the section from **York**
to **Edinburgh**.

If your graph is comprised of multiple vertex or edge collections, you can
also prune as soon as you reach a certain collection, using a condition like
`PRUNE IS_SAME_COLLECTION("stopCollection", v)`.

If you want to only return the results of the depth at which the traversal
stopped due to the prune expression, you can use a `FILTER` in addition. You can
assign the evaluated result of a prune expression to a variable
(`PRUNE var = <expr>`) and use it for filtering:

```aql
---
name: GRAPHTRAV_graphPruneExample4
description: ''
dataset: kShortestPathsGraph
---
FOR v, e, p IN 2..3 OUTBOUND "places/London" GRAPH "kShortestPathsGraph"
  PRUNE cond = v.label == "Carlisle" OR e.travelTime > 3
  OPTIONS { uniqueVertices: "path" }
  FILTER cond
  RETURN CONCAT_SEPARATOR(" -- ", INTERLEAVE(p.vertices[*].label, p.edges[*].travelTime))
```

Only paths that end at **Carlisle** or with the last edge having a travel time
of over three hours are returned. This excludes the connection to **Cologne**
from the results compared to the previous query.

If you want to exclude the depth at which the prune expression stopped the
traversal, you can assign the expression to a variable and use its negated value
in a `FILTER`:

```aql
---
name: GRAPHTRAV_graphPruneExample5
description: ''
dataset: kShortestPathsGraph
---
FOR v, e, p IN 2..3 OUTBOUND "places/London" GRAPH "kShortestPathsGraph"
  PRUNE cond = v.label == "Carlisle" OR e.travelTime > 3
  OPTIONS { uniqueVertices: "path" }
  FILTER NOT cond
  RETURN CONCAT_SEPARATOR(" -- ", INTERLEAVE(p.vertices[*].label, p.edges[*].travelTime))
```

This only returns the connection to **Cologne**, which is the opposite of the
previous example.

You may combine the prune variable with arbitrary other conditions in a `FILTER`
operation. For example, you can remove results where the last edge has as lower
travel time than the second to last edge of the path:

```aql
---
name: GRAPHTRAV_graphPruneExample6
description: ''
dataset: kShortestPathsGraph
---
FOR v, e, p IN 2..5 OUTBOUND "places/London" GRAPH "kShortestPathsGraph"
  PRUNE cond = v.label == "Carlisle" OR e.travelTime > 3
  OPTIONS { uniqueVertices: "path" }
  FILTER cond AND p.edges[-1].travelTime >= p.edges[-2].travelTime
  RETURN CONCAT_SEPARATOR(" -- ", INTERLEAVE(p.vertices[*].label, p.edges[*].travelTime))
```

{{< info >}}
The prune expression is **evaluated at every step of the traversal**. This
includes any traversal depths below the specified minimum depth, despite not
becoming part of the result. It also includes depth 0, which is the start vertex
and a `null` edge.

If you add prune conditions using the edge variable, make sure to account for
the edge at depth 0 being `null`, as it may accidentally stop the traversal
immediately. This may not be apparent due to the depth constraints.
{{< /info >}}

The following examples shows a graph traversal starting at **London**, with a
traversal depth between 2 and 3, and every station is only visited once:

```aql
---
name: GRAPHTRAV_graphPruneExample7
description: ''
dataset: kShortestPathsGraph
---
FOR v, e, p IN 2..3 OUTBOUND "places/London" GRAPH "kShortestPathsGraph"
  OPTIONS { uniqueVertices: "path" }
  RETURN CONCAT_SEPARATOR(" -- ", INTERLEAVE(p.vertices[*].label, p.edges[*].travelTime))
```

If you add prune conditions to stop the traversal if the station is **Glasgow**
or the travel time less than some number, no results are turned. This is even the
case for a value of `2.5`, for which two paths exist that fulfill the criterion
– to **Cologne** and **Carlisle**:

```aql
---
name: GRAPHTRAV_graphPruneExample8
description: ''
dataset: kShortestPathsGraph
---
FOR v,e,p IN 2..3 OUTBOUND "places/London" GRAPH "kShortestPathsGraph"
  PRUNE v.label == "Glasgow" OR e.travelTime < 2.5
  OPTIONS { uniqueVertices: "path" }
  RETURN CONCAT_SEPARATOR(" -- ", INTERLEAVE(p.vertices[*].label, p.edges[*].travelTime))
```

The problem is that `null`, `false`, and `true` are all less than any number (`< 2.5`)
because of AQL's [Type and value order](../fundamentals/type-and-value-order.md), and
because the edge at depth 0 is always `null`. The prune condition is accidentally
fulfilled at the start vertex, stopping the traversal too early. This similarly
happens if you check an edge attribute for inequality (`!=`) and compare it to
string, for instance, which evaluates to `true` for the `null` value.

The depth at which a traversal is stopped by pruning is considered as a result,
but in the above example, the minimum depth of `2` filters the start vertex out.
If you lower the minimum depth to `0`, you get **London** as the sole result.
This confirms that the traversal stopped at the start vertex.

To avoid this problem, exclude the `null` value. For example, you can use
`e.travelTime > 0 AND e.travelTime < 2.5`, but more generic solutions are to
exclude depth 0 from the check (`LENGTH(p.edges) > 0`) or to simply ignore the
`null` edge (`e != null`):

```aql
---
name: GRAPHTRAV_graphPruneExample9
description: ''
dataset: kShortestPathsGraph
---
FOR v,e,p IN 2..3 OUTBOUND "places/London" GRAPH "kShortestPathsGraph"
  PRUNE v.label == "Glasgow" OR (e != null AND e.travelTime < 2.5)
  OPTIONS { uniqueVertices: "path" }
  RETURN CONCAT_SEPARATOR(" -- ", INTERLEAVE(p.vertices[*].label, p.edges[*].travelTime))
```

{{< warning >}}
You can use AQL functions in prune expressions but only those that can be
executed on DB-Servers, regardless of your deployment mode. The following
functions cannot be used in the expression:
- `CALL()`
- `APPLY()`
- `DOCUMENT()`
- `V8()`
- `SCHEMA_GET()`
- `SCHEMA_VALIDATE()`
- `VERSION()`
- `COLLECTIONS()`
- `CURRENT_USER()`
- `CURRENT_DATABASE()`
- `COLLECTION_COUNT()`
- `NEAR()`
- `WITHIN()`
- `WITHIN_RECTANGLE()`
- `FULLTEXT()`
- [User-defined functions (UDFs)](../user-defined-functions.md)
{{< /warning >}}

## Using filters

All three variables emitted by the traversals might as well be used in filter
statements. For some of these filter statements the optimizer can detect that it
is possible to prune paths of traversals earlier, hence filtered results are
not emitted to the variables in the first place. This may significantly
improve the performance of your query. Whenever a filter is not fulfilled,
the complete set of `vertex`, `edge` and `path` is skipped. All paths
with a length greater than the `max` depth are never computed.

Filter conditions that are `AND`-combined can be optimized, but `OR`-combined
conditions cannot.

### Filtering on paths

Filtering on paths allows for the second most powerful filtering and may have the
second highest impact on performance. Using the path variable you can filter on
specific iteration depths. You can filter for absolute positions in the path
by specifying a positive number (which then qualifies for the optimizations),
or relative positions to the end of the path by specifying a negative number.

#### Filtering edges on the path

```aql
---
name: GRAPHTRAV_graphFilterEdges
description: |
  Only follow the paths where the first edge (index 0) has a latency of at most
  6 milliseconds. The resulting paths have up to three edges:
dataset: serviceGraph
---
FOR v, e, p IN 1..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  FILTER p.edges[0].latencyMs <= 6
  RETURN { services: p.vertices[*]._key, protocols: p.edges[*].protocol }
```

#### Filtering vertices on the path

Similar to filtering the edges on the path, you can also filter the vertices.

```aql
---
name: GRAPHTRAV_graphFilterVertices
description: |
  Only follow the paths where the vertex at depth 1 is `orders`:
dataset: serviceGraph
---
FOR v, e, p IN 1..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  FILTER p.vertices[1]._key == "orders"
  RETURN { services: p.vertices[*]._key, protocols: p.edges[*].protocol }
```

#### Combining several filters

You can combine filters in any way you like.

```aql
---
name: GRAPHTRAV_graphFilterCombine
description: |
  Only follow the paths where the first edge has a latency of at most
  6 milliseconds, the vertex at depth 1 is `orders`, and the second edge uses the
  `grpc` protocol:
dataset: serviceGraph
---
FOR v, e, p IN 1..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  FILTER p.edges[0].latencyMs <= 6
     AND p.edges[1].protocol == "grpc"
  FILTER p.vertices[1]._key == "orders"
  RETURN { services: p.vertices[*]._key, protocols: p.edges[*].protocol }
```

**Note**: Despite the `min` depth of 1, this only returns results of
depth 2 and 3. This is because for all results in depth 1, the second edge does
not exist and hence cannot fulfill the condition here.

#### Filter on the entire path

With the help of array comparison operators, filters can also be defined
on the entire path, like `ALL` edges should use the `grpc` protocol.

```aql
---
name: GRAPHTRAV_graphFilterEntirePath
description: |
  Only follow the paths on which all calls use the `grpc` protocol:
dataset: serviceGraph
---
FOR v, e, p IN 1..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  FILTER p.edges[*].protocol ALL == "grpc"
  RETURN { services: p.vertices[*]._key, protocols: p.edges[*].protocol }
```

```aql
---
name: GRAPHTRAV_graphFilterPathEdges
description: |
  Only follow the paths on which none of the calls use the `http` protocol,
  which leaves out the requests to the database:
dataset: serviceGraph
---
FOR v, e, p IN 1..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  FILTER p.edges[*].protocol NONE == "http"
  RETURN { services: p.vertices[*]._key, protocols: p.edges[*].protocol }
```

Both examples above are recognized by the optimizer and can potentially use other indexes
than the edge index.

It is also possible to define that at least one edge on the path has to fulfill
the condition.

```aql
---
name: GRAPHTRAV_graphFilterPathAnyEdge
description: |
  Only return the paths that contain at least one call using the `https`
  protocol:
dataset: serviceGraph
---
FOR v, e, p IN 1..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  FILTER p.edges[*].protocol ANY == "https"
  RETURN { services: p.vertices[*]._key, protocols: p.edges[*].protocol }
```

It is guaranteed that at least one, but potentially more edges fulfill the condition.
All of the above filters can be defined on vertices in the exact same way.

### Filtering on the path vs. filtering on vertices or edges

Filtering on the path influences the Iteration on your graph. If certain conditions 
aren't met, the traversal may stop continuing along this path.

In contrast filters on vertex or edge only express whether you're interested in the actual value of these
documents. Thus, it influences the list of returned documents (if you return v or e) similar 
as specifying a non-null `min` value. If you specify a min value of 2, the traversal over the first
two nodes of these paths has to be executed - you just won't see them in your result array. 

Similar are filters on vertices or edges - the traverser has to walk along these nodes, since 
you may be interested in documents further down the path.

### Examples

The following examples use the
[`serviceGraph`](../../graphs/example-graphs.md#service-graph) example graph
that is shown in [How traversals work](#how-traversals-work).

```aql
---
name: GRAPHTRAV_02_traverse_all_a
description: |
  Follow all calls from the `api` service up to a depth of 3 and only return the
  service names, using the named graph:
dataset: serviceGraph
---
FOR v IN 1..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  RETURN v._key
```

```aql
---
name: GRAPHTRAV_02_traverse_all_b
description: |
  The same traversal, using the edge collection directly:
dataset: serviceGraph
---
FOR v IN 1..3 OUTBOUND "services/api" calls
  RETURN v._key
```

Both queries return the same result. The traversal follows one path as deep as
possible, like from `orders` to `payments` and the services that `payments`
calls, before it continues with the next call of a service that it visited before.

Now we only want the vertices of a specific depth (min = max = 2).

```aql
---
name: GRAPHTRAV_03_traverse_3a
description: |
  Return the services that `api` calls indirectly, via exactly one other service:
dataset: serviceGraph
---
FOR v IN 2..2 OUTBOUND "services/api" GRAPH "serviceGraph"
  RETURN v._key
```

```aql
---
name: GRAPHTRAV_03_traverse_3b
description: |
  The same traversal with a single depth instead of a range:
dataset: serviceGraph
---
FOR v IN 2 OUTBOUND "services/api" GRAPH "serviceGraph"
  RETURN v._key
```

As you can see, we can express this in two ways: with or without the `max` depth
parameter.

### Filter examples

Now let's start to add some filters. To leave out the `orders` service and
everything it calls, you can filter in two ways:

- the vertex at depth 1 has the `_key` `orders`
- the first edge points to `services/orders` (its `_to` attribute)

```aql
---
name: GRAPHTRAV_04_traverse_4a
description: |
  Filter by the key of the vertex at depth 1:
dataset: serviceGraph
---
FOR v, e, p IN 1..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  FILTER p.vertices[1]._key != "orders"
  RETURN v._key
```

```aql
---
name: GRAPHTRAV_04_traverse_4b
description: |
  Filter by the target of the first edge:
dataset: serviceGraph
---
FOR v, e, p IN 1..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  FILTER p.edges[0]._to != "services/orders"
  RETURN v._key
```

As we can see, all vertices behind `orders` are skipped in both queries.
Note again, as soon as a filter is not fulfilled for any of the three elements
`v`, `e` or `p`, the complete set of these is excluded from the result.

We also may combine several filters, for instance to filter out the `orders`
branch as well as the calls to the cache, which use the `tcp` protocol.

```aql
---
name: GRAPHTRAV_05_traverse_5a
description: |
  Use two `FILTER` operations:
dataset: serviceGraph
---
FOR v, e, p IN 1..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  FILTER p.vertices[1]._key != "orders"
  FILTER p.edges[1].protocol != "tcp"
  RETURN v._key
```

```aql
---
name: GRAPHTRAV_05_traverse_5b
description: |
  Use a single `FILTER` operation with both conditions combined by `AND`:
dataset: serviceGraph
---
FOR v, e, p IN 1..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  FILTER p.vertices[1]._key != "orders" AND p.edges[1].protocol != "tcp"
  RETURN v._key
```

As you can see, combining two `FILTER` statements with an `AND` has the same result.

## Comparing OUTBOUND / INBOUND / ANY

All our previous examples traversed the graph in `OUTBOUND` edge direction.
You may however want to also traverse in reverse direction (`INBOUND`) or
both (`ANY`). In the `serviceGraph`, `OUTBOUND` finds the services that a
service depends on, whereas `INBOUND` finds the services that depend on it, for
example, to assess the impact of an outage.

```aql
---
name: GRAPHTRAV_06_traverse_6a
description: |
  Find the services that `catalog` calls, directly or indirectly:
dataset: serviceGraph
---
FOR v IN 1..2 OUTBOUND "services/catalog" GRAPH "serviceGraph"
  RETURN v._key
```

```aql
---
name: GRAPHTRAV_06_traverse_6b
description: |
  Find the services that call `catalog`, directly or indirectly:
dataset: serviceGraph
---
FOR v IN 1..2 INBOUND "services/catalog" GRAPH "serviceGraph"
  RETURN v._key
```

```aql
---
name: GRAPHTRAV_06_traverse_6c
description: |
  Follow the edges in both directions and return the paths:
dataset: serviceGraph
---
FOR v, e, p IN 1..2 ANY "services/catalog" GRAPH "serviceGraph"
  RETURN CONCAT_SEPARATOR(" - ", p.vertices[*]._key)
```

The first traversal only follows the calls that `catalog` makes, which lead to
`db` and `cache`. Walking in reverse direction (`INBOUND`), we find `api`, which
calls `catalog`, and `web`, which calls `api`.

Walking in both directions (`ANY`), the traversal also reaches services that
neither call `catalog` nor are called by it, like `inventory`, which uses the
same `db`. It doesn't walk back along the edge it came from, however, because
a path cannot contain the same edge twice with the default
[`uniqueEdges`](#uniqueedges) setting.

Please note that the direction can't be passed in by a bind parameter.

## Use the AQL explainer for optimizations

Now let's have a look what the optimizer does behind the curtain and inspect
traversal queries using [the explainer](../execution-and-performance/query-optimization.md):

```aql
---
name: GRAPHTRAV_07_traverse_7
description: ''
dataset: serviceGraph
explain: true
---
FOR v, e, p IN 1..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  LET localScopeVar = RAND() * 10
  FILTER p.edges[0].latencyMs < localScopeVar
  RETURN v._key
```

```aql
---
name: GRAPHTRAV_07_traverse_8
description: ''
dataset: serviceGraph
explain: true
---
FOR v, e, p IN 1..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  FILTER p.edges[0]._to == "services/orders"
  RETURN v._key
```

We now see two queries: In one we add a `localScopeVar` variable, which is outside
the scope of the traversal itself - it is not known inside of the traverser.
Therefore, this filter can only be executed after the traversal, which may be
undesired in large graphs. The second query on the other hand only operates on the
path, and therefore this condition can be used during the execution of the traversal.
Paths that are filtered out by this condition won't be processed at all.

If this traversal is not powerful enough for your needs, like you cannot describe
your conditions as AQL filter statements, then you might want to have a look at
the [edge collection methods](../../develop/javascript-api/@arangodb/collection-object.md#edge-documents)
in the JavaScript API.

Also see how to [combine graph traversals](../examples-and-query-patterns/traversals.md).
