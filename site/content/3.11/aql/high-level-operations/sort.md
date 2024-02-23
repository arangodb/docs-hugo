---
title: '`SORT` operation in AQL'
menuTitle: SORT
weight: 25
description: >-
  The `SORT` operation allows you to specify one or multiple sort criteria and
  directions to control the order of query results or the elements of arrays
archetype: default
---
## Syntax

The general syntax is:

<pre><code>SORT <em>expression</em> <em>direction</em></code></pre>

## Usage

The `SORT` operation sorts the already produced intermediate results of the
current block. For example, the following query sorts by `lastName`
(in ascending order), then `firstName` (in ascending order), then by `id`
(in descending order):

```aql
FOR u IN users
  SORT u.lastName, u.firstName, u.id DESC
  RETURN u
```

Specifying the *direction* is optional. The default (implicit) direction for a
sort expression is the ascending order. To explicitly specify the sort direction, 
the keywords `ASC` (ascending) and `DESC` (descending) can be used. Multiple sort
criteria can be separated using commas. In this case, the direction is specified
for each expression separately.

The following example first sorts documents by `lastName` in ascending order and
then by `firstName` in ascending order.

```aql
SORT doc.lastName, doc.firstName
```

The following example first sorts documents by `lastName` in descending order
and then by `firstName` in ascending order.

```aql
SORT doc.lastName DESC, doc.firstName
```

The following example first sorts documents by `lastName` in ascending order
and then by `firstName` in descending order.

```aql
SORT doc.lastName, doc.firstName DESC
```

{{< warning >}}
When iterating over a collection, the order of documents is always
**undefined unless an explicit sort order is defined** with a `SORT` operation.

If the values you sort by are not unique, the order among tied documents is
undefined and you may want to sort by another attribute to break ties.
If the application has a preferred attribute that indicates the order of
documents with the same value, then use this attribute. If there is no such
attribute, you can still achieve a stable sort by using the `_id` system attribute
as it is unique and present in every document.

```aql
FOR u IN users
  SORT u.firstName, u._id // break name ties with the document ID
  RETURN u
```
{{< /warning >}}

Constant `SORT` expressions can be used to indicate that no particular
sort order is desired.

```aql
SORT null
```

Constant `SORT` expressions are optimized away by the AQL
optimizer during optimization, but specifying them explicitly may enable further
optimizations if the optimizer does not need to take into account any particular
sort order. This is especially the case after a `COLLECT` statement, which is 
supposed to produce a sorted result. Specifying an extra `SORT null` after the
`COLLECT` statement allows to AQL optimizer to remove the post-sorting of the
collect results altogether. Also see [`COLLECT` option `method`](collect.md#method).

In case of a sequence of `SORT` operations, the last one is always the one
that is performed unless a previous `SORT` expression is more accurate.
If the optimization rules `remove-redundant-sorts` and `remove-redundant-sorts-2`
are deactivated in the query's execution, then the last `SORT` is always the one
that wins, despite the accuracy. For example, consider the following query with
multiple consecutive `SORT` operations:

```aql
FOR friend IN friends
  SORT friend.friend.name, friend.id, friend.age 
  SORT friend.age, friend.id
  SORT friend.age
  RETURN friend
```

If the optimization rules mentioned above are deactivated, then the last `SORT`
becomes operative and the collection is sorted by `friend.age`. If the
optimization rules are active, then the second `SORT` becomes operative because
it covers the same `friend.age` attribute and additionally sorts by another
attribute in case of ties, making it more accurate. However, if the attributes
in the second `SORT` expression are in opposite order, as in
`SORT friend.id, friend.age`, then the last `SORT` is operative.
