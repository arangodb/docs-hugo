---
title: '`LIMIT` operation in AQL'
menuTitle: LIMIT
weight: 30
description: >-
  The `LIMIT` operation allows you to reduce the number of results to at most
  the specified number and optionally skip results using an offset for pagination
---
## Syntax

The general forms of `LIMIT` are:

<pre><code>LIMIT <em>count</em>
LIMIT <em>offset</em>, <em>count</em>
LIMIT <em>offset</em>, null</code></pre>

The first form allows specifying only the `count` value whereas the second form
allows specifying both `offset` and `count`. The first form is identical using
the second form with an `offset` value of `0`. The third form lets you specify
an `offset` only, without limiting how many results are returned.

The `offset` value specifies how many elements from the result shall be
skipped. It must be `0` or greater. The `count` value specifies how many
elements should be at most included in the result. It must be `0` or greater,
or `null` to not restrict the number of results.

{{< info >}}
Variables, expressions, and subqueries cannot be used for `offset` and `count`.
The values for `offset` and `count` must be known at query compile time,
which means that you can only use number literals, bind parameters or
expressions that can be resolved at query compile time.
{{< /info >}}

## Usage

### Limit the number of results

```aql
FOR u IN users
  LIMIT 5
  RETURN u
```

Above query returns five documents of the `users` collection.
It could also be written as `LIMIT 0, 5` for the same result.

Which documents it returns is rather arbitrary because collections have no
defined order for the documents they contain. A `LIMIT` operation should usually
be accompanied with a `SORT` operation to explicitly specify a sorting order
unless any five documents are acceptable for you.

### Skip results using an offset

Specify an `offset` in addition to a `count` to skip a number of results before
returning the following ones. This is how you can paginate through a result set,
by increasing the `offset` for every page you request while keeping the `count`
the same.

```aql
FOR u IN users
  SORT u.firstName, u.lastName, u.id DESC
  LIMIT 2, 5
  RETURN u
```

In above example, the documents of `users` are sorted, the first two results
get skipped, and the query returns the next five user documents.

### Skip results without limiting their number

If you want to skip results but return all of the remaining ones, use `null` as
the `count` value (instead of an arbitrary large number):

```aql
FOR u IN users
  SORT u.firstName, u.lastName, u._id
  LIMIT 10, null
  RETURN u
```

In above example, the documents of `users` are sorted, the first ten results
get skipped, and the query returns all remaining user documents.

Note that `LIMIT 0, null` neither skips nor limits any results, making the
operation effectively a no-op.

### Ensure a stable sort order for pagination

If you run a query multiple times with varying `LIMIT` offsets for pagination,
you can miss results or get duplicate results if the sort order is undefined.

In case multiple documents contain the same `SORT` attribute value, the result
set does not contain the tied documents in a fixed order as the order between
them is undefined. Additionally, the `SORT` operation does not guarantee a stable
sort if there is no unique value to sort by.

If a fixed total order is required, you can use a tiebreaker. Sort by an
additional attribute that can break the ties. If the application has a preferred
attribute that indicates the order of documents with the same value, then use
this attribute. If there is no such attribute, you can still achieve a stable
sort by using the `_id` system attribute as it is unique and present in every
document.

```aql
FOR u IN users
  SORT u.firstName, u._id // break name ties with the document ID
  LIMIT 5
  RETURN u
```

### Mind the position of a `LIMIT` operation

Where a `LIMIT` is used in relation to other operations in a query has meaning.
`LIMIT` operations before `FILTER`s in particular can change the result
significantly, because the operations are executed in the order in which they
are written in the query. See [`FILTER`](filter.md#order-of-operations)
for a detailed example.

### Limit the results of write operations

The `LIMIT` operation never applies to write operations (`INSERT`, `UPDATE`,
`REPLACE`, `REMOVE`, `UPSERT`) but only their returned results. In the following
example, five documents are created, regardless of the `LIMIT 2`. The `LIMIT`
operation only constrains the number of documents returned by the query (via
`RETURN`) to the first two:

```aql
FOR i IN 1..5
  INSERT { value: i } INTO coll
  LIMIT 2
  RETURN NEW
```
