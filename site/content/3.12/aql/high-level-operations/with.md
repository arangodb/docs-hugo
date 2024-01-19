---
title: '`WITH` operation in AQL'
menuTitle: WITH
weight: 75
description: >-
  An AQL query can start with a `WITH` operation, listing collections that a
  query implicitly reads from
archetype: default
---
Reading implicitly from a collections means that the collections are not
specified explicitly in language constructs like the following:

- `FOR ... IN collection`
- `INSERT ... INTO collection`
- `UPDATE ... IN collection`
- `GRAPH "graph-name"` (via the graph definition)

Instead, the collections are only known at runtime of the query. Such dynamic
collection access is invisible to the AQL query parser at query compile time.
Dynamic access is possible via the `DOCUMENT()` function as well as with
graph traversals (in particular the variant using collection sets), because
edges may point to arbitrary vertex collections. Additionally, if you specify
the start vertex of a traversal using a string, its collection needs to be
declared as well.

Collections that are explicitly used in a query are automatically detected by
the AQL query parser. Any additional collections that will be involved in the
query but cannot be detected automatically by the query parser can be manually
specified using a `WITH` statement. It is recommended to declare all collections
that the `DOCUMENT()` function or graph traversals using collection sets might
possibly access to avoid occasional query failures.

## Syntax

<pre><code>WITH <em>collection1</em> [, <em>collection2</em> [, ... <em>collectionN</em> ] ]</code></pre>

`WITH` is also a keyword that is used in other contexts, for example in `UPDATE`
statements. To declare additional collections, you must place the `WITH` keyword
at the very start of the query.

## Usage

The `WITH` operation is only required if you use a cluster deployment and only
for AQL queries that dynamically read from vertex collections as part of
graph traversals.

You can enable the `--query.require-with` startup option to make single server
instances require `WITH` declarations like cluster deployments to ease development,
see [Requiring `WITH` statements](../../components/arangodb-server/options.md#--queryrequire-with).

Dynamic access via the `DOCUMENT()` function does not require you to list the
involved collections. Using named graphs in traversals (`GRAPH "graph-name"`)
does not require it either, assuming that all vertices are in collections that
are part of the graph, as enforced by the [Graph API](../../develop/http-api/graphs/named-graphs.md).
That means, it is only necessary for traversals using anonymous graphs /
[collection sets](../graphs/traversals.md#working-with-collection-sets).

The following example query specifies an edge collection `usersHaveManagers`
to perform a graph traversal. It is the only explicitly specified collection in
the query. It does not need to be declared using the `WITH` operation.

However, the involved vertex collections need to be declared. In this example,
the start vertex is specified as a string and it is stored in the `users`
collections. Furthermore, the edges of the edge collection reference vertices of
a collection called `managers`. Both collections are declared at the beginning
of the query using the `WITH` operation:

```aql
WITH users, managers
FOR v, e, p IN 1..2 OUTBOUND 'users/1' usersHaveManagers
  RETURN { v, e, p }
```
