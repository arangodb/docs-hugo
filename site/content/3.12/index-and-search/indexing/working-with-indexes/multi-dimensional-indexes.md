---
title: Multi-dimensional indexes
menuTitle: Multi-dimensional Indexes
weight: 25
description: >-
  Multi-dimensional indexes allow you to index two- or higher dimensional data
  such as time ranges, for efficient intersection of multiple range queries
archetype: default
---
A multi-dimensional index maps multi-dimensional data in the form of multiple
numeric attributes to one dimension while mostly preserving locality so that
similar values in all of the dimensions remain close to each other in the mapping
to a single dimension. Queries that filter by multiple value ranges at once can
be better accelerated with such an index compared to a persistent index.

You can choose between two subtypes of multi-dimensional indexes:

- An `mdi` index with a `fields` property that describes which document
  attributes to use as dimensions
- An `mdi-prefixed` index with a `fields` property as well as a `prefixFields`
  property to specify one or more mandatory document attributes to narrow down
  the search space using equality checks

Both subtypes require that the attributes described by `fields` have numeric
values. You can optionally omit documents from the index that have any of
the `fields` or `prefixFields` attributes not set or set to `null` by declaring
the index as sparse with `sparse: true`.

Multi-dimensional indexes can be created with a uniqueness constraint with
`unique: true`. This only allows a single document with a given combination of
attribute values, using all of the `fields` attributes and (for `mdi-prefixed`
indexes) `prefixFields`. Documents omitted because of `sparse: true` are exempt.

You can store additional attributes in multi-dimensional indexes with the
`storedValues` property. They can be used for projections (unlike the `fields`
attributes) so that indexes can cover more queries without having to access the
full documents.

Non-unique `mdi` indexes have a fixed selectivity estimate of `1`. For `mdi`
indexes with `unique: true` as well as for `mdi-prefixed` indexes, you can
control whether index selectivity estimates are maintained for the index.
It is enabled by default and you can disable it with `estimates: false`.
Not maintaining index selectivity estimates can have a slightly positive impact
on write performance but the query optimizer is not able to determine the
usefulness of different competing indexes in AQL queries when there are multiple
candidate indexes to choose from.

{{< info >}}
The `mdi` index type was previously called `zkd`.
{{< /info >}}

## Querying documents within a 3D box

Assume we have documents in a collection `points` of the form

```json
{"x": 12.9, "y": -284.0, "z": 0.02}
```

and we want to query all documents that are contained within a box defined by
`[x0, x1] * [y0, y1] * [z0, z1]`.

To do so one creates a multi-dimensional index on the attributes `x`, `y` and
`z`, e.g. in _arangosh_:

```js
db.points.ensureIndex({
  type: "mdi",
  fields: ["x", "y", "z"],
  fieldValueTypes: "double"
});
```

Unlike with other indexes, the order of the `fields` does not matter.

`fieldValueTypes` is required and the only allowed value is `"double"` to use a
double-precision (64-bit) floating-point format internally.

Now we can use the index in a query:

```aql
FOR p IN points
  FILTER x0 <= p.x && p.x <= x1
  FILTER y0 <= p.y && p.y <= y1
  FILTER z0 <= p.z && p.z <= z1
  RETURN p
```

## Possible range queries

Having an index on a set of fields does not require you to specify a full range
for every field. For each field you can decide if you want to bound
it from both sides, from one side only (i.e. only an upper or lower bound)
or not bound it at all.

Furthermore you can use any comparison operator. The index supports `<=` and `>=`
naturally, `==` will be translated to the bound `[c, c]`. Strict comparison
is translated to their non-strict counterparts and a post-filter is inserted.

```aql
FOR p IN points
  FILTER 2 <= p.x && p.x < 9
  FILTER p.y >= 80
  FILTER p.z == 4
  RETURN p
```

## Example Use Case

If you build a calendar using ArangoDB you could create a collection for each user
that contains the appointments. The documents would roughly look as follows:

```json
{
  "from": 345365,
  "to": 678934,
  "what": "Dentist",
}
```

`from`/`to` are the timestamps when an appointment starts/ends. Having an
multi-dimensional index on the fields `["from", "to"]` allows you to query
for all appointments within a given time range efficiently.

### Finding all appointments within a time range

Given a time range `[f, t]` we want to find all appointments `[from, to]` that
are completely contained in `[f, t]`. Those appointments clearly satisfy the
condition

```
f <= from and to <= t
```

Thus our query would be:

```aql
FOR app IN appointments
  FILTER f <= app.from
  FILTER app.to <= t
  RETURN app
```

### Finding all appointments that intersect a time range

Given a time range `[f, t]` we want to find all appointments `[from, to]` that
intersect `[f, t]`. Two intervals `[f, t]` and `[from, to]` intersect if
and only if

```
f <= to and from <= t
```

Thus our query would be:

```aql
FOR app IN appointments
  FILTER f <= app.to
  FILTER app.from <= t
  RETURN app
```

## Prefix fields

Multi-dimensional indexes can accelerate range queries well but they are
inefficient for queries that check for equality of values. For use cases where
you have a combination of equality and range conditions in queries, you can use
the `mdi-prefixed` subtype instead of `mdi`. It has all the features of the
`mdi` subtype but additionally lets you define one or more document attributes
you want to use for equality checks. This combination allows to efficiently
narrow down the search space to a subset of multi-dimensional index data before
performing the range checking.

```js
db.<collection>.ensureIndex({
  type: "mdi-prefixed",
  prefixFields: ["v", "w"]
  fields: ["x", "y"],
  fieldValueTypes: "double"
});
```

You need to specify all of the `prefixFields` attributes in your queries to
utilize the index.

```aql
FOR p IN points
  FILTER p.v == "type"
  FILTER p.w == "group"
  FILTER 2 <= p.x && p.x < 9
  FILTER p.y >= 80
  RETURN p
```

You can create `mdi-prefixed` indexes on edge collections with the `_from` or
`_to` edge attribute as the first prefix field. Graph traversals with range filters
can then utilize such indexes. See [Vertex-centric indexes](vertex-centric-indexes.md)
for details.

## Storing additional values in indexes

<small>Introduced in: v3.12.0</small>

Multi-dimensional indexes allow you to store additional attributes in the index
that can be used to satisfy projections of the document. They cannot be used for
index lookups or for sorting, but for projections only. They allow multi-dimensional
indexes to fully cover more queries and avoid extra document lookups. This can
have a great positive effect on index scan performance if the number of scanned
index entries is large.

You can set the `storedValues` option and specify the additional attributes as
an array of attribute paths when creating a new `mdi` or `mdi-prefixed` index,
similar to the `fields` option:

```js
db.<collection>.ensureIndex({
  type: "mdi",
  fields: ["x", "y"],
  fieldValueTypes: "double",
  storedValues: ["y", "z"]
});
```

This indexes the `x` and `y` attributes so that the index can be used for range
queries by these attributes. Using these document attributes like for returning
them from the query is not covered by the index, however, unless you add the
attributes to `storedValues` in addition to `fields`. The reason is that the
index doesn't store the original values of the attributes.

You can have the same attributes in `storedValues` and `fields` as the attributes
in `fields` cannot be used for projections, but you can also store additional
attributes that are not listed in `fields`.
The above example stores the `y` and `z` attribute values in the index using
`storedValues`. The index can thus supply the values for projections without
having to look up the full document.

Attributes in `storedValues` cannot overlap with the attributes specified in
`prefixFields`. There is no reason to store them in the index because you need
to specify them in queries in order to use `mdi-prefixed` indexes.

In unique indexes, only the index attributes in `fields` and (for `mdi-prefixed`
indexes) `prefixFields` are checked for uniqueness. The index attributes in
`storedValues` are not checked for their uniqueness.

You cannot create multiple multi-dimensional indexes with the same `sparse`,
`unique`, `fields` and (for `mdi-prefixed` indexes) `prefixFields` attributes
but different `storedValues` settings. That means the value of `storedValues` is
not considered by index creation calls when checking if an index is already
present or needs to be created.

Non-existing attributes are stored as `null` values.

The maximum number of attributes that you can use in `storedValues` is 32.

## Lookahead Index Hint

<small>Introduced in: v3.10.0</small>

Using the lookahead index hint can increase the performance for certain use
cases. Specifying a lookahead value greater than zero makes the index fetch
more documents that are no longer in the search box, before seeking to the
next lookup position. Because the seek operation is computationally expensive,
probing more documents before seeking may reduce the number of seeks, if
matching documents are found. Please keep in mind that it might also affect
performance negatively if documents are fetched unnecessarily.

You can specify the `lookahead` value using the `OPTIONS` keyword:

```aql
FOR app IN appointments OPTIONS { lookahead: 32 }
    FILTER @to <= app.to
    FILTER app.from <= @from
    RETURN app
```

## Limitations

- Using array expansions for attributes is not possible (e.g. `array[*].attr`)
- You can only index numeric values that are representable as IEEE-754 double.
- A high number of dimensions (more than 5) can impact the performance considerably.
- The performance can vary depending on the dataset. Densely packed points can
  lead to a high number of seeks. This behavior is typical for indexing using
  space filling curves.
