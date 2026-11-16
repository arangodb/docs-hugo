---
title: Shortest Path in AQL
menuTitle: Shortest Path
weight: 15
description: >-
  Find one path of shortest length between two vertices
---
## General query idea

This type of query finds a path between two given documents
(*startVertex* and *targetVertex*) in your graph.

By default, a path with the fewest edges is returned. If there are multiple
paths of this length, then it is undefined which one of them you get.

If you set the [`weightAttribute` option](#weightattribute), a path with the
lowest sum of edge weights is returned instead. Such a path is not necessarily
one of the paths with the fewest edges. It can comprise more edges but have a
lower total weight than a path of shorter length, so this mode finds the
*lightest* path rather than the shortest one. If there are multiple paths with
the lowest weight, then it is undefined which one of them you get.

The shortest path search emits the following two variables for every step of
the path:

1. The vertex on this path.
2. The edge pointing to it.

### Example execution

Let's take a look at a simple example to explain how it works.
This is the graph that you are going to find a shortest path on, the
[`serviceGraph`](../../graphs/example-graphs.md#service-graph) example graph
of services that call each other:

{{< embed-svg "service-graph" >}}

You can use the following parameters for the query:

1. You start at the vertex `web`.
2. You finish with the vertex `inventory`.

So, obviously, you have the vertices `web`, `api`, `orders`, and `inventory` on
the shortest path in exactly this order. Then, the shortest path statement
returns the following pairs:

| Vertex        | Edge                    |
|-------------|-------------------------|
| `web`       | `null`                  |
| `api`       | `web` → `api`           |
| `orders`    | `api` → `orders`        |
| `inventory` | `orders` → `inventory`  |

Note that the first edge is always `null` because there is no edge pointing
to the *startVertex*.

## Syntax

The next step is to see how you can write a shortest path query.
You have two options here, you can either use a named graph or a set of edge
collections (anonymous graph).

### Working with named graphs

```aql
FOR vertex[, edge]
  IN OUTBOUND|INBOUND|ANY SHORTEST_PATH
  startVertex TO targetVertex
  GRAPH graphName
  [OPTIONS options]
```

- `FOR`: Emits up to two variables:
  - **vertex** (object): The current vertex on the shortest path
  - **edge** (object, *optional*): The edge pointing to the vertex
- `IN` `OUTBOUND|INBOUND|ANY`: Defines in which direction edges are followed
  (outgoing, incoming, or both)
- **startVertex** `TO` **targetVertex** (both string\|object): The two vertices between
  which the shortest path is computed. This can be specified in the form of
  an ID string or in the form of a document with the attribute `_id`. All other
  values lead to a warning and an empty result. If one of the specified
  documents does not exist, the result is empty as well and there is no warning.
- `GRAPH` **graphName** (string): The name identifying the named graph. Its vertex and
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
FOR vertex[, edge]
  IN OUTBOUND|INBOUND|ANY SHORTEST_PATH
  startVertex TO targetVertex
  edgeCollection1, ..., edgeCollectionN
  [OPTIONS options]
```

Instead of `GRAPH graphName` you may specify a list of edge collections (anonymous
graph). The involved vertex collections are determined by the edges of the given
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

### Traversing in mixed directions

For shortest path with a list of edge collections you can optionally specify the
direction for some of the edge collections. Say for example you have three edge
collections *edges1*, *edges2* and *edges3*, where in *edges2* the direction
has no relevance, but in *edges1* and *edges3* the direction should be taken into
account. In this case you can use `OUTBOUND` as general search direction and `ANY`
specifically for *edges2* as follows:

```aql
FOR vertex IN OUTBOUND SHORTEST_PATH
  startVertex TO targetVertex
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

The following examples use the
[`serviceGraph`](../../graphs/example-graphs.md#service-graph) example graph
that is shown in [Example execution](#example-execution).

```aql
---
name: GRAPHSP_02_web_to_inventory_a
description: |
  Find the shortest path from `web` to `inventory` as described above, using the
  named graph:
dataset: serviceGraph
---
FOR v, e IN OUTBOUND SHORTEST_PATH "services/web" TO "services/inventory" GRAPH "serviceGraph"
  RETURN { service: v._key, latencyMs: e.latencyMs }
```

```aql
---
name: GRAPHSP_02_web_to_inventory_b
description: |
  The same path search, using the edge collection directly:
dataset: serviceGraph
---
FOR v, e IN OUTBOUND SHORTEST_PATH "services/web" TO "services/inventory" calls
  RETURN { service: v._key, latencyMs: e.latencyMs }
```

You can see that expectations are fulfilled. You find the vertices in the
correct ordering and the first edge is `null`, because no edge is pointing
to the start vertex on this path.

You can also compute shortest paths based on documents found in collections.

```aql
---
name: GRAPHSP_03_web_to_inventory_docs
description: |
  Look up the start and target vertex in the `services` collection and use the
  documents for the shortest path search:
dataset: serviceGraph
---
FOR a IN services
  FILTER a._key == "web"
  FOR b IN services
    FILTER b._key == "inventory"
    FOR v, e IN OUTBOUND SHORTEST_PATH a TO b GRAPH "serviceGraph"
      RETURN { service: v._key, latencyMs: e.latencyMs }
```

If you set the [`weightAttribute` option](#weightattribute), you get the path
with the lowest sum of edge weights instead. From `web` to `db`, the paths via
`auth` and `catalog` have the fewest edges, but the path via `orders` and
`inventory` has the lowest total latency.

```aql
---
name: GRAPHSP_04_web_to_db_weighted
description: |
  Find the path from `web` to `db` with the lowest total latency:
dataset: serviceGraph
---
FOR v, e IN OUTBOUND SHORTEST_PATH "services/web" TO "services/db" GRAPH "serviceGraph"
  OPTIONS { weightAttribute: "latencyMs" }
  RETURN { service: v._key, latencyMs: e.latencyMs }
```
