---
title: Graph traversals in AQL
menuTitle: Traversals
weight: 10
description: >-
  You can traverse named graphs and anonymous graphs with a native AQL
  language construct
---
A graph traversal starts at a node and follows the edges connected to it, then
the edges of the nodes it reaches, and so on, up to a maximum depth. In AQL,
you write a traversal as a special form of a `FOR` loop that emits the visited
nodes, as well as the edges and paths that lead to them. Nodes that are reached
with fewer edges than a minimum depth are not emitted.
You can control the direction of the edges, the order of the traversal, and
when to stop following a path.

{{< info >}}
Alternatively, you can describe the nodes and edges you want to find as a
pattern like `(a:persons) -[:knows]-> (b:persons)`, using the
[`MATCH` operation](../high-level-operations/match.md). For the differences
between the two approaches, see
[`MATCH` compared to graph traversals](../high-level-operations/match.md#match-compared-to-graph-traversals).
{{< /info >}}

## How traversals work

Every sequence of edges that a traversal follows from the start node forms a
_path_. For each path whose length is between the minimum and the maximum
depth, the traversal emits up to three variables:

1. The node at the end of the path (`v` in the examples below).
2. The last edge of the path (`e`). It is `null` for the start node, which is
   only emitted if the minimum depth is `0`.
3. The path itself (`p`) as an object with the following attributes:
   - `vertices`: an array with the nodes of the path, starting with the start
     node and ending with the emitted node
   - `edges`: an array with the edges of the path, where the n-th edge connects
     the n-th and the (n+1)-th node
   - `weights`: an array with the accumulated edge weights at each node, see the
     [`order` option](#order)

The examples in this section use the
[`serviceGraph`](../../graphs/example-graphs.md#service-graph) example graph.
Its nodes are the services of an application, stored in a `services`
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
  Every path is a separate result, even if it ends at a node that was already
  emitted.
- `orders` is emitted again at depth 3 because `payments` calls `orders` back.
  This path contains `orders` twice but each edge only once, which is allowed
  by default. See [Cycles and uniqueness](#cycles-and-uniqueness).
- The traversal doesn't follow the edges of the nodes at depth 3 because the
  maximum depth is `3`.

### What happens at each step

The traversal keeps a queue of paths that it still needs to process. At first,
the queue only holds the path that consists of the start node alone. For each
path that the traversal takes from the queue, it performs the following steps:

1. If you restrict the node collections with the
   [`vertexCollections` option](#vertexcollections) and the last node of the
   path isn't stored in one of them, the path is discarded. The start node is
   always allowed.
2. The [`PRUNE` condition](#pruning) is evaluated, at every depth including the
   start node. If it is fulfilled, the traversal doesn't follow the path any
   further, but the path can still be emitted.
3. Conditions on the node at a specific position of the path, like
   `FILTER p.vertices[2].tier == "data"`, or on all nodes of the path, like
   `FILTER p.vertices[*].tier ALL != "external"`, are checked if the optimizer
   could move them into the traversal. If a condition is not fulfilled, the path
   is discarded and not followed any further, as no longer path can fulfill the
   condition either.
4. Conditions on the emitted node or edge, like `FILTER v.tier == "data"`, are
   checked if the optimizer could move them into the traversal. If a condition
   is not fulfilled, the path is not emitted, but the traversal still follows it
   because nodes further down the path may fulfill the condition.
5. The uniqueness of nodes and edges on the path is checked according to the
   [`uniqueVertices`](#uniquevertices) and [`uniqueEdges`](#uniqueedges)
   options. A path that violates them is discarded.
6. If the path has at least the minimum length, it is emitted.
7. If the path is shorter than the maximum length and wasn't pruned, the
   traversal looks up the edges of the last node in the traversal direction and
   adds a new path to the queue for each of them. Conditions on edges, like
   `FILTER p.edges[*].protocol ALL == "grpc"`, are already checked when looking
   up the edges, so that edges that don't fulfill them don't lead to new paths.

Conditions that the optimizer cannot move into the traversal, like conditions
combined with `OR`, are applied to the emitted paths afterwards.
See [Conditions applied during the traversal](#conditions-applied-during-the-traversal)
for details.

The following three queries show how `PRUNE`, a `FILTER` on the emitted node,
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
  A `FILTER` on the emitted node doesn't emit `payments` but still follows its
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
  A `FILTER` on the node at depth 2 of the path discards all paths via `payments`:
dataset: serviceGraph
---
FOR v, e, p IN 1..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  FILTER p.vertices[2]._key != "payments"
  RETURN CONCAT_SEPARATOR(" → ", p.vertices[*]._key)
```

The third query only works because `payments` is always at depth 2. To exclude
a node regardless of its depth, use a condition on all nodes of the path, like
`FILTER p.vertices[*]._key NONE == "payments"`, or
[assign the prune expression to a variable](#pruning) (like `PRUNE cond = ...`)
and use an additional `FILTER NOT cond`.

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

The order in which the traversal follows the edges of a single node is undefined.

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
  node:
dataset: serviceGraph
---
FOR v, e, p IN 2..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  OPTIONS { order: "weighted", weightAttribute: "latencyMs" }
  RETURN { path: CONCAT_SEPARATOR(" → ", p.vertices[*]._key), weights: p.weights }
```

### Cycles and uniqueness

By default, a path cannot contain the same edge more than once, but it can
contain the same node multiple times. The traversal therefore follows cycles,
like the one between `orders` and `payments`, until it reaches the maximum
depth. In large graphs with many cycles, the number of paths can grow quickly
with the maximum depth.

You can prevent nodes from occurring more than once on a path by setting the
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

With `uniqueVertices: "global"`, the traversal visits every node at most once,
no matter how many paths lead to it. This requires the `"bfs"` or `"weighted"`
order. The first path that reaches a node wins, which is a path with the
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
FOR node[, edge[, path]]
  IN [min[..max]]
  OUTBOUND|INBOUND|ANY startNode
  GRAPH graphName
  [PRUNE [pruneVariable = ]pruneCondition]
  [OPTIONS options]
```

- `FOR`: emits up to three variables:
  - **node** (object): the current node in a traversal
  - **edge** (object, *optional*): the current edge in a traversal
  - **path** (object, *optional*): representation of the current path with
    the following attributes:
    - `vertices`: An array of all nodes on this path.
    - `edges`: An array of all edges on this path.
    - `weights`: An array of the edge weight sums at each depth of this path.
      See the `"weighted"` setting of the [`order`](#order) traversal option.
- `IN` `min..max`: The minimal and maximal depth for the traversal.
  Depth values of `2` or higher makes it a multi-hop traversal, and if `min` and
  `max` differ, it's a variable depth traversal.
  - **min** (number, *optional*): nodes and edges returned by this query
    start at the traversal depth of *min* (thus nodes and edges below it are
    not returned). If not specified, it defaults to `1`. The minimal
    possible value is `0`, which emits the start node and a `null` edge before
    emitting anything else.
  - **max** (number, *optional*): up to *max* length paths are traversed.
    If omitted, *max* defaults to *min*. Thus only the nodes and edges in
    the range of *min* are returned. *max* cannot be specified without *min*.
- `OUTBOUND|INBOUND|ANY`: follow outgoing, incoming, or edges pointing in either
  direction in the traversal. Note that this can't be replaced by a bind parameter.
- **startNode** (string\|object): a node where the traversal originates from.
  This can be specified in the form of an ID string or in the form of a document
  with the `_id` attribute. All other values lead to a warning and an empty
  result. If the specified document does not exist, the result is empty as well
  and there is no warning.
- `GRAPH` **graphName** (string): the name identifying the named graph.
  Its node and edge collections are looked up. Note that the graph name
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
[WITH nodeCollection1[, nodeCollection2[, nodeCollectionN]]]
FOR node[, edge[, path]]
  IN [min[..max]]
  OUTBOUND|INBOUND|ANY startNode
  edgeCollection1[, edgeCollection2[, edgeCollectionN]]
  [PRUNE [pruneVariable = ]pruneCondition]
  [OPTIONS options]
```

- `WITH`: Declaration of collections. Optional for single server instances, but
  required for [graph traversals in a cluster](#graph-traversals-in-a-cluster).
  Needs to be placed at the very beginning of the query.
  - **collections** (collection, *repeatable*): list of node collections that
    are involved in the traversal
- **edgeCollections** (collection, *repeatable*): One or more edge collections
  to use for the traversal (instead of using a named graph with `GRAPH graphName`).
  Node collections are determined by the edges in the edge collections.
  
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

- `"bfs"`: The traversal is executed breadth-first. The results
  first contain all nodes at depth 1, then all nodes at depth 2, and so on.

- `"dfs"` (default): The traversal is executed depth-first. It
  first returns all paths from *min* depth to *max* depth for one node at
  depth 1, then for the next node at depth 1, and so on.

- `"weighted"`: The traversal is a weighted traversal.
  Paths are enumerated with increasing cost.
  The order of paths having the same cost is non-deterministic.

  You can define what attribute to use as the cost of an edge with the
  [`weightAttribute`](#weightattribute) traversal option, as well as a fallback
  with [`defaultWeight`](#defaultweight). Negative weights are not supported and
  abort the query with an error.

  The path variable emitted by the traversal has a `weights` attribute with a
  list of the calculated edge weight sums at each depth:
  - **Depth 0**: The first value is always `0`.
  - **Depth 1**: The second value is the weight of the edge between the
    start node and the direct neighbor node.
  - **Depth 2**: The third value is the sum of weights of the edges between the
    start node, the direct neighbor node, and the neighbor's neighbor node.
  - And so on for greater depths, summing all edge weights along the path.
 
  Note that the `weightAttribute` and `defaultWeight` options are ignored for
  traversal orders other than `"weighted"`, which means the `weights` attribute
  is like `[0, 1, 2, 3, …]` for e.g. `order: "dfs"` and therefore not useful.

#### `uniqueVertices`

Ensure node uniqueness (string):

- `"path"` – it is guaranteed that there is no path returned with a duplicate node
- `"global"` – it is guaranteed that each node is visited at most once during
  the traversal, no matter how many paths lead from the start node to this one.
  If you start with a `min depth > 1` a node that was found before *min* depth
  might not be returned at all (it still might be part of a path).
  It is required to set `order: "bfs"` or `order: "weighted"` because with
  depth-first search the results would be unpredictable. **Note:**
  Using this configuration the result is not deterministic any more. If there
  are multiple paths from *startNode* to *node*, one of those is picked.
  In case of a `weighted` traversal, the path with the lowest weight is
  picked, but in case of equal weights it is undefined which one is chosen.
- `"none"` (default) – no uniqueness check is applied on nodes

#### `uniqueEdges`

Ensure edge uniqueness (string):

- `"path"` (default) – it is guaranteed that there is no path returned with a
  duplicate edge
- `"none"` – no uniqueness check is applied on edges. **Note:**
  Using this configuration, the traversal follows edges in cycles.

#### `edgeCollections`

Restrict edge collections the traversal may visit (string\|array).

If omitted or an empty array is specified, then there are no restrictions.

- A string parameter is treated as the equivalent of an array with a single
  element.
- Each element of the array should be a string containing the name of an
  edge collection.

#### `vertexCollections`

Restrict node collections the traversal may visit (string\|array).

If omitted or an empty array is specified, then there are no restrictions.

- A string parameter is treated as the equivalent of an array with a single
  element.
- Each element of the array should be a string containing the name of a
  node collection.
- The starting node is always allowed, even if it does not belong to one
  of the collections specified by a restriction.

#### `parallelism`

Parallelize traversal execution (number).
    
If omitted or set to a value of `1`, the traversal execution is not parallelized.
If set to a value greater than `1`, then up to that many worker threads can be
used for concurrently executing the traversal. The value is capped by the number
of available cores on the target machine.

Parallelizing a traversal is normally useful when there are many inputs (start
nodes) that the nested traversal can work on concurrently. This is often the
case when a nested traversal is fed with several tens of thousands of start
nodes, which can then be distributed randomly to worker threads for parallel
execution.

#### `maxProjections`

Specifies the number of document attributes per `FOR` loop to be used as
projections (number). The default value is `5`.

The AQL optimizer automatically detects which document attributes you access in
traversal queries and optimizes the data loading. This optimization is 
beneficial if you have large documents but only access a few document attributes.
The `maxProjections` option lets you tune when to load individual attributes
versus the whole document.

#### `indexHint`

<small>Introduced in: v3.12.1</small>

You can provide index hints for traversals to let the optimizer prefer
the [vertex-centric indexes](../../indexes-and-search/indexing/working-with-indexes/vertex-centric-indexes.md)
you specify over the regular edge index.

This is useful for cases where the selectively estimate of the edge index
is higher than the ones for suitable vertex-centric indexes (and thus they
aren't picked automatically) but the vertex-centric indexes are known to
perform better.

The `indexHint` option expects an object in the following format:

`{ "<edgeColl>": { "<direction>": { "<level>": <index> } } }`

- `<edgeColl>`: The name of an edge collection for which the index hint
  shall be applied. Collection names are case-sensitive.
- `<direction>`: The direction for which to apply the index hint.
  Valid values are `inbound` and `outbound`, in lowercase.
  You can specify indexes for both directions.
- `<level>`: The level/depth for which the index should be applied. Valid
  values are the string `base` (to define the default index for all levels)
  and any stringified integer values greater or equal to zero.
  You can specify multiple levels.
- `<index>`: The name of an index as a string, or multiple index names as
  a list of strings in the order of preference. The optimizer uses the first
  suitable index.

Because collection names and levels/depths are used as object keys,
enclose them in quotes to avoid query parse errors.

Example:

```aql
FOR v, e, p IN 1..4 OUTBOUND startNode edgeCollection
OPTIONS {
  indexHint: {
    "edgeCollection": {
      "outbound": {
        "base": ["edge"],
        "1": "myIndex1",
        "2": ["myIndex2", "myIndex1"],
        "3": "myIndex3",
      }
    }
  }
}
FILTER p.edges[1].foo == "bar" AND
       p.edges[2].foo == "bar" AND
       p.edges[2].baz == "qux"
```

Index hints for levels other than `base` are only considered if the
traversal actually uses a specific filter condition for the specified level.
In the above example, this is true for levels 1 and 2, but not for level 3.
Consequently, the index hint for level 3 is ignored here.

An expression like `FILTER p.edges[*].foo ALL == "bar"` cannot utilize the
indexes you specify for individual levels (level 1, level 2, etc.) but uses
the index for the `base` level.

The vertex-centric indexes you specify are only used if they are eligible
and the index hints for traversals cannot be forced.

#### `weightAttribute`

This option is only used for traversals with `order: "weighted"`.

The edge attribute to use as the weight (string\|array):

- A **string** refers to a top-level attribute of exactly this name. A `.` is
  interpreted as a literal dot and not as a separator for an attribute path.
  For example, `"attr.sub"` reads the weight from an edge document like
  `{ "attr.sub": 5 }`.
- An **array of strings** describes an attribute path, letting you use a
  sub-attribute as the edge weight. Each element is one level of nesting, for
  example `["attr", "sub"]` to read the weight from an edge document like
  `{ "attr": { "sub": 3 } }`.

  An array with a single element is equivalent to passing that element as a
  string. `["attr.sub"]` therefore refers to the top-level attribute `attr.sub`
  just like `"attr.sub"` does.

If the value is neither a string nor an array of strings, a query warning is
raised and the option is ignored, which means the `defaultWeight` is used as the
weight of every edge. An empty string or an empty array has the same effect but
raises no warning.

For example, consider edge documents with both a nested `sub` attribute and a
top-level attribute whose name contains a dot:

```json
{
  "attr": { "sub": 3 },
  "attr.sub": 5
}
```

| `weightAttribute` | Resulting edge weight |
|:------------------|----------------------:|
| `["attr", "sub"]` | `3` |
| `["attr.sub"]`    | `5` |
| `"attr.sub"`      | `5` |

```aql
FOR v, e, p IN 1..3 OUTBOUND startNode edgeCollection
  OPTIONS { order: "weighted", weightAttribute: ["attr", "sub"] }
  RETURN p.weights
```

If no attribute is specified, or if the attribute path cannot be resolved in the
edge document, or if the value it refers to is non-numeric, then the
`defaultWeight` is used.

The attribute value must not be negative.

{{< info >}}
Weighted traversals do not support negative weights. If a document
attribute (as specified by `weightAttribute`) with a negative value is
encountered during traversal, the query is aborted with an error.
{{< /info >}}

#### `defaultWeight`

This option is only used for traversals with `order: "weighted"`.

Specifies the default weight of an edge (number). The default value is `1`.

The value must not be negative.

{{< info >}}
Weighted traversals do not support negative weights. If `defaultWeight` is set
to a negative number, then the query is aborted with an error.
{{< /info >}}

#### `useCache`

<small>Introduced in: v3.12.2</small>

Whether to use the in-memory cache for edges. The default is `true`.

You can set this option to `false` to not make a large graph operation pollute
the edge cache.

### Traversing in mixed directions

For traversals with a list of edge collections you can optionally specify the
direction for some of the edge collections. Say for example you have three edge
collections *edges1*, *edges2* and *edges3*, where in *edges2* the direction has
no relevance but in *edges1* and *edges3* the direction should be taken into account.
In this case you can use `OUTBOUND` as general traversal direction and `ANY`
specifically for *edges2* as follows:

```aql
FOR node IN OUTBOUND
  startNode
  edges1, ANY edges2, edges3
```

All collections in the list that do not specify their own direction use the
direction defined after `IN`. This allows you to use a different direction for each
collection in your traversal.

### Graph traversals in a cluster

Due to the nature of graphs, edges may reference nodes from arbitrary
collections. Following the paths can thus involve documents from various
collections and it is not possible to predict which are visited in a path
search - unless you use named graphs that define all node and edge collections
that belong to them and the graph data is consistent.

If you use anonymous graphs / collection sets for graph queries, which node
collections need to be loaded by the graph engine can be deduced automatically if
there is a named graph with a matching edge collection in its edge definitions
(introduced in v3.12.6). Edge collections are always declared explicitly in
queries, directly or via referencing a named graph.

Without a named graph, the involved node collections can only be determined at
run time. Use the [`WITH` operation](../high-level-operations/with.md) to
declare the node collections upfront. This is required for traversals
using collection sets in cluster deployments (if there is no named graph to
deduce the node collections from). Declare the collection of the start node as
well if it's not declared already (like by a `FOR` loop).

For example, suppose you have two node collections, `person` and `movie`, and
an `acts_in` edge collection that connects them. If you want to run a traversal
query that starts at a person that you specify with its document ID,
you need to declare both node collections at the beginning of the query:

```aql
WITH person, movie
FOR v, IN 0..1 OUTBOUND "person/1544" acts_in
  LIMIT 4
  RETURN v.label
```

However, if there is a named graph that includes an edge definition for the
`acts_in` edge collection, with `person` as the _from_ collection and `movie`
as the _to_ collection, you can omit `WITH person, movie`. That is, if you
specify `acts_in` as an edge collection in an anonymous graph query, all
named graphs are checked for this edge collection, and if there is a matching
edge definition, its node collections are automatically added as data sources to
the query.

```aql
FOR v, IN 0..1 OUTBOUND "person/1544" acts_in
  LIMIT 4
  RETURN v.label

// Chris Rock
// A.I. Artificial Intelligence
// Lethal Weapon 4
// Madagascar
```

You can still declare collections manually, in which case they are added as
data sources in addition to automatically deduced collections.

## Pruning

You can define stop conditions for graph traversals to return specific data and
to improve the query performance. This is called _pruning_ and works by checking
conditions during the traversal as opposed to filtering the results afterwards
(post-filtering). This reduces the amount of data to be checked by stopping the
traversal down specific paths early.

{{< youtube id="4LVeeC0ciCQ" >}}

You can specify one `PRUNE` expression per graph traversal, but it can contain
an arbitrary number of conditions. You can use the node, edge, and path
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
Edmonton node at which it stopped.

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

The same example with an added prune expression, with node and edge conditions:

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

If either the **Carlisle** node or an edge with a travel time of over three
hours is encountered, the subsequent paths are pruned. In the example, this
removes the train connections to **Birmingham**, **Glasgow**, and **York**,
which come after **Carlisle**, as well as the connections to and via
**Edinburgh** because of the four hour duration for the section from **York**
to **Edinburgh**.

If your graph is comprised of multiple node or edge collections, you can
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
becoming part of the result. It also includes depth 0, which is the start node
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
fulfilled at the start node, stopping the traversal too early. This similarly
happens if you check an edge attribute for inequality (`!=`) and compare it to
string, for instance, which evaluates to `true` for the `null` value.

The depth at which a traversal is stopped by pruning is considered as a result,
but in the above example, the minimum depth of `2` filters the start node out.
If you lower the minimum depth to `0`, you get **London** as the sole result.
This confirms that the traversal stopped at the start node.

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
- `SCHEMA_GET()`
- `SCHEMA_VALIDATE()`
- `VERSION()`
- `COLLECTIONS()`
- `CURRENT_USER()`
- `CURRENT_DATABASE()`
- `COLLECTION_COUNT()`
{{< /warning >}}

## Using filters

All three variables emitted by the traversals might as well be used in filter
statements. For some of these filter statements the optimizer can detect that it
is possible to prune paths of traversals earlier, hence filtered results are
not emitted to the variables in the first place. This may significantly
improve the performance of your query. Whenever a filter is not fulfilled,
the complete set of `node`, `edge` and `path` is skipped. All paths
with a length greater than the `max` depth are never computed.

Filter conditions that are `AND`-combined can be optimized, but `OR`-combined
conditions cannot. See
[Conditions applied during the traversal](#conditions-applied-during-the-traversal)
for details.

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

#### Filtering nodes on the path

Similar to filtering the edges on the path, you can also filter the nodes.

```aql
---
name: GRAPHTRAV_graphFilterVertices
description: |
  Only follow the paths where the node at depth 1 is `orders`:
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
  6 milliseconds, the node at depth 1 is `orders`, and the second edge uses the
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
All of the above filters can be defined on nodes in the exact same way.

#### Filter a subset of the path

<small>Introduced in: v3.12.11</small>

An array expansion in a path filter can contain an
[inline `FILTER`](../operators.md#inline-filter) to restrict which nodes or
edges the array comparison operator applies to. This is useful if a condition
is only meaningful for some of the path elements, for instance because an
attribute is optional:

```aql
FOR v, e, p IN 1..5 OUTBOUND startNode GRAPH "myGraph"
  FILTER p.edges[* FILTER CURRENT.validUntil != null].validUntil ALL > DATE_NOW()
  RETURN p.edges[*]._key
```

Only the edges that have a `validUntil` attribute are compared against the
current date. Without the inline `FILTER`, an edge without this attribute would
evaluate `null > DATE_NOW()` to `false` and thus reject the entire path.

The optimizer can check such a condition during the traversal instead of
filtering the emitted paths afterwards. Each node and edge is checked as the
traversal reaches it, and the elements that the inline `FILTER` excludes are
skipped. The traversal can thus stop following a path as soon as an element
violates the condition, and the condition can be taken into account for the
edge index lookups.

An inline `FILTER` only allows the condition to be evaluated during the
traversal if all of the following apply. Otherwise, the condition remains a
post-filter that is applied to the paths the traversal emits:

- The array comparison operator is `ALL` or `NONE`. `ANY` and
  `AT LEAST (<number>)` need to count the matching elements of the entire path
  and cannot be expressed as a condition for a single node or edge.
- The array expansion uses `FILTER` only, without an inline `LIMIT` or a
  `RETURN` projection. Both of them need the complete array and therefore the
  complete path.
- The inline `FILTER` condition doesn't use the path variable, because the path
  isn't available when the traversal evaluates a single node or edge. It may
  refer to `CURRENT` and to variables defined before the traversal, however.
- The inline `FILTER` condition doesn't use the
  [question mark operator](../operators.md#question-mark-operator).

Conditions that can be evaluated during the traversal:

```aql
// Only check the edges that have a `weight` attribute
FILTER p.edges[* FILTER CURRENT.weight != null].weight ALL <= 10

// `NONE` is supported as well, and so are function calls in the inline `FILTER`
FILTER p.edges[* FILTER HAS(CURRENT, "weight")].weight NONE > 10

// A variable from outside of the traversal can be used in the inline `FILTER`
FILTER p.edges[* FILTER CURRENT.weight > threshold].weight ALL <= 10

// A nested array expansion in the inline `FILTER` is allowed
FILTER p.edges[* FILTER LENGTH(CURRENT.tags[* FILTER CURRENT != "draft"]) > 0].weight ALL <= 10
```

Conditions that remain post-filters:

```aql
// `ANY` and `AT LEAST` cannot be checked per edge
FILTER p.edges[* FILTER CURRENT.weight != null].weight ANY <= 10
FILTER p.edges[* FILTER CURRENT.weight != null].weight AT LEAST (2) <= 10

// An inline `LIMIT` or `RETURN` needs the entire path
FILTER p.edges[* FILTER CURRENT.weight != null LIMIT 3].weight ALL <= 10
FILTER p.edges[* FILTER CURRENT.weight != null RETURN CURRENT.weight] ALL <= 10

// The inline `FILTER` cannot use the path variable
FILTER p.edges[* FILTER CURRENT.weight > LENGTH(p.vertices)].weight ALL <= 10
```

To check whether a condition is evaluated during the traversal, see
[Conditions applied during the traversal](#conditions-applied-during-the-traversal).

### Filtering on the path vs. filtering on nodes or edges

Filters on the emitted path (`p` variable) influence how the graph is traversed.
If a path doesn't fulfill a condition, the traversal may stop following this
path and not explore it any further.

Filters on the emitted node (`v` variable) or edge (`e` variable) only
determine whether the current node and edge become part of the result.
The traversal walks past them either way, because vertices and edges further
down the path may still match. This is comparable to setting a minimum traversal
depth greater than zero. With a minimum depth of `2`, the traversal still has to
walk over the first two vertices of every path, you just don't see them in the
result.

### Conditions applied during the traversal

The `optimize-traversals` optimizer rule can move `FILTER` conditions into the
traversal so that they are checked at every step, as described in
[What happens at each step](#what-happens-at-each-step). Conditions that it
cannot move are applied to the emitted paths afterwards, after the traversal
has explored all paths up to the maximum depth.

The optimizer combines all `FILTER` operations that follow the traversal and
can move the conditions into the traversal if the following applies:

- The conditions are not combined with `OR`. If any `FILTER` operation contains
  an `OR`, none of the conditions are moved into the traversal, including the
  ones in other `FILTER` operations. The optimizer can turn simple cases like
  `v.tier == "data" OR v.tier == "external"` into
  `v.tier IN ["data", "external"]`, however.
- Each condition refers to only one of the node, edge, and path variables.
  For example, `v.tier == e.protocol` cannot be moved.
- Function calls are deterministic (not `RAND()`, for example) and not
  user-defined functions. In clusters, the functions also need to be able to
  run on DB-Servers.

Conditions on the path variable additionally need to have one of the
following forms:

- A condition on the node or edge at a fixed position, like
  `p.vertices[2].tier == "data"` or `p.edges[0].latencyMs <= 6`. The position
  needs to be a number literal greater or equal to `0`. A negative position
  like `p.vertices[-1]` refers to the emitted node or edge, and the traversal
  handles it like a condition on `v` or `e`.
  - If the position exceeds the maximum depth, the query returns no results.
  - If the condition isn't fulfilled for a missing node or edge (`null`), the
    minimum depth is increased so that shorter paths aren't emitted.
- A condition on all nodes or edges, like `p.edges[*].protocol ALL == "grpc"`,
  using the array comparison operators `ALL` or `NONE` with `==`, `!=`, `<`,
  `<=`, `>`, `>=`, `IN`, or `NOT IN`. The path needs to be on the left-hand
  side of the operator. `ANY` and `AT LEAST` cannot be moved because they need
  the entire path, and neither can the `LIKE`, `=~`, and `!~` operators.
  You can [filter a subset of the path](#filter-a-subset-of-the-path)
  with an inline `FILTER`.

The value you compare the path to needs to be a fixed value, a bind parameter,
or a variable that holds a subquery result. Expressions like `doc.maxLatency`,
`v.tier`, or function calls prevent the optimization. This includes variables
like `LET max = doc.maxLatency` because the optimizer replaces them with their
expression.

To check whether a condition is evaluated during the traversal, inspect the
[execution plan](../execution-and-performance/query-optimization.md#execution-plans).
The conditions that the traversal checks are listed in the
**Filter / Prune Conditions** column of the **Traversals on graphs** table.

```aql
---
name: GRAPHTRAV_explainTraversalConditions
description: |
  The condition on all nodes of the path is moved into the traversal:
dataset: serviceGraph
explain: true
---
FOR v, e, p IN 1..3 OUTBOUND "services/api" GRAPH "serviceGraph"
  FILTER p.vertices[*]._key NONE == "payments"
  RETURN CONCAT_SEPARATOR(" → ", p.vertices[*]._key)
```

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

Now we only want the nodes of a specific depth (min = max = 2).

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

- the node at depth 1 has the `_key` `orders`
- the first edge points to `services/orders` (its `_to` attribute)

```aql
---
name: GRAPHTRAV_04_traverse_4a
description: |
  Filter by the key of the node at depth 1:
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

As we can see, all nodes behind `orders` are skipped in both queries.
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
