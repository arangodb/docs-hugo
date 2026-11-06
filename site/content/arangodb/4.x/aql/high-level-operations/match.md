---
title: '`MATCH` operation in AQL'
menuTitle: MATCH
weight: 80
description: >-
  The experimental `MATCH` operation lets you query graphs by describing the
  pattern of nodes and edges you want to find, similar to Cypher and GQL
---
{{< tag "Experimental" >}}

The `MATCH` operation finds all occurrences of a graph pattern in your data.
You describe nodes in parentheses and edges in square brackets with arrows that
indicate the direction. The syntax is similar to the graph patterns of Cypher
and of GQL, the ISO standard for graph query languages, but it is not a
complete or conforming implementation of either:

```aql
MATCH (a:persons) -[k:knows]-> (b:persons)
  RETURN { from: a.name, to: b.name }
```

Every node and edge in a pattern names the collection it belongs to (its
_label_). For each combination of documents that fits the pattern, `MATCH`
binds the pattern variables, like `a`, `k`, and `b` in the example above,
and you can use these variables in the subsequent operations of the query.

{{< warning >}}
The `MATCH` operation is an experimental feature. It is disabled by default and
you need to enable it per query. The syntax and behavior may change in future
versions in ways that are not backward-compatible. Don't use it in production.
{{< /warning >}}

## Enable the `MATCH` operation

To use `MATCH`, set the `matchStatement` query option to `"experimental"`.
Otherwise, the query fails with error `9` (*not implemented*).

In _arangosh_, pass the option in the third argument of `db._query()`:

```js
db._query(`
  MATCH (a:persons) -[:knows]-> (b:persons)
    RETURN [a._key, b._key]
`, {}, { matchStatement: "experimental" }).toArray();
```

Via the HTTP API, set the option in the `options` object of the request body
for [`POST /_api/cursor`](../../develop/http-api/queries/aql-queries.md#create-a-cursor):

```json
{
  "query": "MATCH (a:persons) -[:knows]-> (b:persons) RETURN [a._key, b._key]",
  "options": { "matchStatement": "experimental" }
}
```

The keyword `MATCH` is reserved regardless of the option. See
[Keywords](../fundamentals/syntax.md#keywords) if you use `match` as a name
in your queries.

## Syntax

<pre><code>MATCH <em>pattern</em> [, <em>pattern</em> ... ]
  [OPTIONS {}]</code></pre>

A `MATCH` operation consists of one or more comma-separated _patterns_.
A pattern is a sequence of node patterns connected by edge patterns, optionally
assigned to a path variable:

<pre><code>[<em>pathVar</em> =] <em>node</em> [ <em>edge</em> <em>node</em> ... ]</code></pre>

A _node pattern_ has the following form:

<pre><code>( [<em>nodeVar</em>]:<em>collection</em> [{ <em>attribute</em>: <em>value</em>, ... }] [WHERE <em>condition</em>] [RETURN <em>projection</em>, ... ] )</code></pre>

Alternatively, a node pattern can refer to a variable that is already defined:

<pre><code>( <em>nodeVar</em> )</code></pre>

An _edge pattern_ has one of the following forms, depending on the direction:

<pre><code>-[ [<em>edgeVar</em>]:<em>edgeCollection</em> [| <em>edgeCollection</em> ... ] [{ <em>attribute</em>: <em>value</em>, ... }] [WHERE <em>condition</em>] [RETURN <em>projection</em>, ... ] ]->
<-[ ... ]-
-[ ... ]-</code></pre>

A variable-length edge pattern has one of the following forms:

<pre><code>-[ [<em>pathVar</em>]:<em>edgeCollection</em> [| <em>edgeCollection</em> ... ] * <em>min</em>..<em>max</em> ]->
<-[ ... ]-
-[ ... ]-</code></pre>

- `nodeVar`, `edgeVar`, `pathVar` (optional): variable names that let you
  access the matched node, edge, or path after the `MATCH` operation.
  If you omit the name, you still need to write the colon before the label,
  like `(:persons)` and `-[:knows]->`.
- `collection` (required): the name of a document collection that the node
  needs to be stored in. You can use a collection bind parameter (`@@coll`).
- `edgeCollection` (required): the name of an edge collection that the edge
  needs to be stored in. You can list multiple edge collections separated by
  `|` to match edges from any of them. You can use collection bind parameters
  (`@@coll`).
- `{ attribute: value, ... }` (optional): attribute values the node or edge
  needs to have. Each pair is an equality condition.
- `WHERE condition` (optional): an arbitrary AQL condition that the node or edge
  needs to fulfill.
- `RETURN projection, ...` (optional): the attributes to keep in the variable.
  See [Projections](#projections).
- `min..max` (required for variable-length edges): the minimum and maximum
  number of edges to follow.
- `OPTIONS {}` (optional): reserved for future options. Only an empty object is
  accepted at this time. Any attribute raises an error.

## Usage

The examples on this page use the [`knows_graph`](../../graphs/example-graphs.md#knows-graph)
example graph. It consists of a `persons` node collection with the people Alice,
Bob, Charlie, Dave, and Eve, and a `knows` edge collection with the following
edges:

- Alice knows Bob
- Bob knows Charlie
- Bob knows Dave
- Eve knows Alice
- Eve knows Bob

### Match nodes

The simplest pattern is a single node pattern. It iterates over a collection,
similar to a `FOR` loop:

```aql
MATCH (p:persons)
  RETURN p.name
```

You can restrict the matched documents with attribute values in curly braces
or with a `WHERE` condition, or with both. The following query returns the
persons whose name is `Alice` or starts with `D`:

```aql
MATCH (p:persons WHERE p.name == "Alice" OR p.name LIKE "D%")
  RETURN p.name
```

Attribute values in curly braces are equality conditions on top-level
attributes. The following two node patterns are equivalent:

```aql
(p:persons { name: "Alice" })
(p:persons WHERE p.name == "Alice")
```

The values can be arbitrary expressions, including bind parameters and
references to other pattern variables.

### Match edges

To find nodes that are connected by edges, combine node patterns with edge
patterns. The arrow indicates the direction of the edge:

- `(a) -[ ... ]-> (b)`: an edge from `a` to `b` (outbound from `a`)
- `(a) <-[ ... ]- (b)`: an edge from `b` to `a` (inbound to `a`)
- `(a) -[ ... ]- (b)`: an edge between `a` and `b` in either direction

An edge pattern with arrowheads on both sides (`<-[ ... ]->`) is invalid.

The following query returns the people that Eve knows, together with the
edges that connect them:

```aql
---
name: aqlMatch_outbound
description: ''
dataset: knows_graph
options:
  matchStatement: experimental
---
MATCH (a:persons { _key: "eve" }) -[k:knows]-> (b:persons)
  RETURN { from: a.name, edge: k._id, to: b.name }
```

If you follow edges in any direction, then each edge is matched once from each
side. The following query finds everyone that Bob knows or who knows Bob:

```aql
---
name: aqlMatch_any
description: ''
dataset: knows_graph
options:
  matchStatement: experimental
---
MATCH (a:persons { name: "Bob" }) -[:knows]- (b:persons)
  RETURN b.name
```

Edge patterns support attribute values in curly braces and `WHERE` conditions
like node patterns. A `WHERE` condition can also refer to variables of other
elements in the pattern, for example, to compare attributes of the edge with
attributes of the nodes it connects:

```aql
MATCH (a:persons) -[k:knows WHERE k.vertex == a._key]-> (b:persons)
  RETURN [a.name, b.name]
```

You can specify multiple edge collections by separating them with `|`, like
`-[e:knows|follows]->`. Edges from any of the collections can then match.

### Match longer patterns

You can chain node and edge patterns to describe paths with multiple hops.
The following query finds the people who are known by somebody that Eve knows:

```aql
---
name: aqlMatch_two_hops
description: ''
dataset: knows_graph
options:
  matchStatement: experimental
---
MATCH (a:persons { _key: "eve" }) -[:knows]-> (b:persons) -[:knows]-> (c:persons)
  RETURN [a.name, b.name, c.name]
```

### Match variable-length paths

To follow a variable number of edges, append `* min..max` to the edge
collections. The following query finds everyone that Eve can reach with
one to three hops:

```aql
---
name: aqlMatch_variable_length
description: ''
dataset: knows_graph
options:
  matchStatement: experimental
---
MATCH (a:persons { _key: "eve" }) -[p:knows * 1..3]-> (b:persons)
  RETURN { to: b.name, via: p.vertices[*].name }
```

The variable of a variable-length edge pattern (`p` in the example above) holds
the path that the edges form, not a single edge. The path is an object with an
`edges` and a `vertices` attribute (as well as a `weights` attribute), like
the path variable of a [graph traversal](../graph-queries/traversals.md).

Note the following about variable-length edge patterns:

- `min` and `max` need to be non-negative integers, and `min` cannot be greater
  than `max`. You can use bind parameters and constant expressions.
  A `min` of `0` includes the start node itself as a match with an empty path.
- You cannot specify attribute values, `WHERE` conditions, or projections for
  variable-length edge patterns.
- The collection labels of the node patterns only apply to the nodes at both
  ends. The nodes in between can be stored in any collection.
- A path never contains the same edge twice, but it can contain the same node
  multiple times.

### Use path variables

To get access to the entire path that a pattern describes, assign the pattern
to a variable. The path variable holds an object with an `edges` and a
`vertices` attribute, with the matched edges and nodes in the order of the path:

```aql
---
name: aqlMatch_path_variable
description: ''
dataset: knows_graph
options:
  matchStatement: experimental
---
MATCH path = (a:persons { _key: "eve" }) -[:knows]-> (b:persons) -[:knows]-> (c:persons)
  RETURN path.vertices[*].name
```

Path variables also work with variable-length edge patterns. The path then
includes the nodes and edges of all segments.

### Reuse variables

A node pattern with a variable name and a label, like `(v:persons)`, declares
the variable `v`. You cannot declare the same variable twice. To refer to a node
again in the same `MATCH` operation, use its variable name without a label,
like `(v)`.

For example, the following query finds nodes with an edge that points to the
node itself (a self-loop):

```aql
MATCH (v:persons) -[e:knows]-> (v)
  RETURN e
```

Writing `(v:persons) -[e:knows]-> (v:persons)` instead raises a parse error
because it attempts to declare `v` a second time.

You can also refer to variables that you defined before the `MATCH` operation,
for example, by a `FOR` loop or a `LET` operation. The variable needs to
contain a document (or an object with an `_id` attribute):

```aql
FOR start IN persons
  FILTER start.name IN ["Alice", "Eve"]
  MATCH (start) -[:knows]-> (b:persons)
  RETURN [start.name, b.name]
```

You cannot specify attribute values, `WHERE` conditions, or projections for a
node pattern that refers to an existing variable. Use a `FILTER` operation
instead.

A node pattern without a label needs to refer to a variable that is already
defined, either earlier in the `MATCH` operation or before it. Otherwise, the
query fails with a parse error (*MATCH vertex variable '...' needs a label or
has to be bound earlier*).

Edge variables always need to be new. Using an edge variable name that is
already defined raises a parse error.

Note that variable names cannot be the same as the collection names that you
use as labels, like `(persons:persons)`.

### Match multiple patterns

You can specify multiple patterns separated by commas. All patterns need to
match, and you can connect them by referring to the same variables.
The following query finds pairs of people `w` and `x` who both know `v`:

```aql
---
name: aqlMatch_multiple_patterns
description: ''
dataset: knows_graph
options:
  matchStatement: experimental
---
MATCH (w:persons) -[:knows]-> (v:persons), (x:persons) -[:knows]-> (v)
  FILTER w != x
  RETURN [w.name, x.name, v.name]
```

If the patterns don't share any variables, the result is the combination of
every match of the first pattern with every match of the second pattern.

### Projections

You can limit the attributes that a pattern variable holds by adding `RETURN`
followed by a comma-separated list of attributes at the end of a node or edge
pattern. This reduces the size of the variables and of the query result.

```aql
---
name: aqlMatch_projections
description: ''
dataset: knows_graph
options:
  matchStatement: experimental
---
MATCH (a:persons { _key: "alice" } RETURN name, initial = LEFT(a.name, 1))
      -[k:knows RETURN vertex]-> (b:persons RETURN name)
  RETURN [a, k, b]
```

A projection list can contain the following items:

- An attribute name, like `name`, to keep this top-level attribute.
- A nested attribute path, like `profile.name`, to keep a sub-attribute.
  The result contains the parent objects, like `{ "profile": { "name": ... } }`.
  If you specify paths that overlap, like `profile` and `profile.name`, the
  shorter path takes precedence.
- A quoted attribute name, like `"profile.name"`, to keep a top-level attribute
  whose name contains a dot.
- An assignment, like `initial = LEFT(a.name, 1)`, to add an attribute with the
  result of an expression. The expression can refer to the pattern variables.

Note the following about projections:

- The `_id` attribute of nodes as well as the `_id`, `_from`, and `_to`
  attributes of edges are always kept. Other system attributes like `_key` are
  only kept if you list them.
- Attributes that you list but that don't exist in a document are set to `null`.
- You cannot assign to system attributes like `_id = ...`, and you cannot use
  the same attribute name more than once.
- Attribute values in curly braces and `WHERE` conditions are evaluated against
  the full documents, so they can use attributes that you don't keep.
  This also applies to the conditions of other patterns of the same `MATCH`
  operation.
- If you access an attribute that a projection didn't keep after the `MATCH`
  operation, the value is `null` and the query raises a warning
  (error code `1596`, *attribute '...' was excluded by MATCH projection on
  variable '...'*).
- The nodes and edges of a path variable are the projected documents. This
  includes the nodes at both ends of a variable-length edge pattern. The nodes
  and edges in between are always full documents because you cannot specify
  projections for them.

### Use bind parameters for collections

You can specify the labels of node and edge patterns with collection bind
parameters (`@@name`). Value bind parameters (`@name`) are not supported in
this place.

```aql
MATCH (a:@@nodeColl { _key: @key }) -[:@@edgeColl1|@@edgeColl2]-> (b:@@nodeColl)
  RETURN b
```

### Combine `MATCH` with other operations

`MATCH` is a high-level operation like `FOR`. You can combine it with other
operations like `FILTER`, `SORT`, `LIMIT`, `COLLECT`, and `RETURN`, and you can
use it inside of `FOR` loops and subqueries:

```aql
MATCH (a:persons) -[:knows]-> (b:persons)
  COLLECT name = b.name WITH COUNT INTO knownBy
  SORT knownBy DESC
  RETURN { name, knownBy }
```

## `MATCH` compared to graph traversals

`MATCH` and [graph traversals](../graph-queries/traversals.md) (`FOR ... IN
min..max OUTBOUND|INBOUND|ANY ...`) can answer many of the same questions.
They differ in what they let you express and in how they are executed.

### How `MATCH` is executed

When planning a query, ArangoDB translates a `MATCH` operation into regular
AQL operations:

- Node patterns and fixed-length edge patterns become nested `FOR` loops that
  join the nodes and edges via their `_id`, `_from`, and `_to` attributes, with
  filter conditions for the attribute values and `WHERE` conditions. This is
  similar to the joins you could write by hand, and the optimizer can use the
  primary index, the edge index, and other indexes for them.
- Variable-length edge patterns become graph traversals with a filter that
  checks the collection of the end node.

You can see the resulting execution plan by
[explaining the query](../execution-and-performance/explaining-queries.md)
with the `matchStatement` option set. The following plan shows that the
pattern becomes three nested loops, a primary index lookup for the start node
followed by an edge index lookup and a primary index lookup for each match:

```aql
---
name: aqlMatch_explain
description: ''
dataset: knows_graph
explain: true
options:
  matchStatement: experimental
---
MATCH (a:persons { _key: "eve" }) -[:knows]-> (b:persons)
  RETURN b.name
```

### When to use `MATCH`

- **Multi-hop patterns with conditions on every element**: You can name and
  filter each node and edge of a pattern individually, which is more verbose
  with traversals, where you need to check `p.vertices[n]` and `p.edges[n]`
  for each position.
- **Patterns with cycles and multiple branches**: A pattern can refer back to a
  node, like `(a) -[...]-> (b) -[...]-> (c) -[...]-> (a)`, and you can combine
  multiple patterns that share nodes. Traversals only follow paths from a
  start node and you need additional filters or nested traversals for such
  shapes.
- **Patterns without a fixed start node**: With fixed-length edge patterns, the
  query is executed as a join, which can be efficient if there are selective
  conditions on the nodes and edges, compared to starting a traversal from every
  node of a collection.
- **Familiar syntax**: If you know Cypher or GQL, the pattern syntax lets you
  get started quickly.

### When to use graph traversals

- **Control over the traversal**: Traversals support `PRUNE` conditions to stop
  following a path early, options for the uniqueness of nodes and edges,
  breadth-first and weighted order, depth-dependent conditions, and more.
  `MATCH` uses the defaults of traversals for variable-length edge patterns
  (depth-first order, unique edges per path, no uniqueness of nodes) and
  you cannot change them.
- **Variable-length paths**: Variable-length edge patterns check the collection
  of the end node, which makes them slower than an equivalent traversal
  without such a check.
- **Named graphs and path searches**: `MATCH` only supports collections.
  For named graphs as well as shortest path and k paths searches, use the
  respective graph queries.
- **Production use**: `MATCH` is experimental.

### Performance considerations

- **Order of the patterns**: The joins are executed in the order that the
  elements appear in the pattern. Start a pattern with the most selective node
  pattern. For example, `(a:persons) -[:knows]-> (b:persons { _key: "bob" })`
  iterates over all persons for `a` before it looks for Bob, whereas the
  equivalent `(b:persons { _key: "bob" }) <-[:knows]- (a:persons)` starts with
  a single document lookup for Bob and only follows his inbound edges.
- **Indexes**: Conditions on the nodes and edges can utilize indexes like in
  regular `FOR` loops, for example, a persistent index on an attribute that
  you filter by in a node pattern.

## Limitations

The following restrictions apply to the experimental `MATCH` operation:

- Every node pattern that declares a variable and every edge pattern needs a
  collection label. Patterns like `()`, `-[]->`, and `-->` are not supported.
- Labels need to be collection names or collection bind parameters. Views are
  not supported. Node labels need to be document collections, and edge labels
  need to be edge collections.
- In cluster deployments, a `MATCH` operation with variable-length edge
  patterns or multiple edge collections can access node collections that it
  doesn't know about at query compile time. Declare all node collections that
  such patterns can reach with a [`WITH` operation](with.md) at the start of the
  query, like for graph traversals.
- Named graphs (`GRAPH "name"`) are not supported.
