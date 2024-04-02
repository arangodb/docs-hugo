---
title: Accessing data from collections with AQL
menuTitle: Accessing data from collections
weight: 25
description: >-
  You can access collection data by looping over a collection and reading
  document attributes, with non-existing attributes returning a `null` value
---
A collection can be thought of as an array of documents. To access the documents,
use a [`FOR` operation](../high-level-operations/for.md) to iterate over a
collection using its name, like `FOR doc IN collection ...`.

Note that when iterating over a collection, the order of documents is undefined.
To establish an explicit and deterministic order for the documents, use a
[`SORT` operation](../high-level-operations/sort.md) in addition.

Data in collections is stored in documents, which are JSON objects. Each document
potentially has different attributes than other documents. This is true even for
documents of the same collection.

It is therefore quite normal to encounter documents that do not have some or all
of the attributes that are queried in an AQL query. In this case, the
non-existing attributes in the document are treated as if they would exist
with a value of `null`. This means that comparing a document attribute to
`null` returns `true` if the document has the particular attribute and the
attribute has a value of `null`, or that the document does not have the
particular attribute at all.

For example, the following query returns all documents from the collection
`users` that have a value of `null` in the attribute `name`, plus all documents
from `users` that do not have the `name` attribute at all:

```aql
FOR u IN users
  FILTER u.name == null
  RETURN u
```

Furthermore, `null` is less than any other value (excluding `null` itself). That
means documents with non-existing attributes may be included in the result
when comparing attribute values with the less than or less equal operators.

For example, the following query returns all documents from the collection
`users` that have an attribute `age` with a value less than `39`, but also all
documents from the collection that do not have the attribute `age` at all.

```aql
FOR u IN users
  FILTER u.age < 39
  RETURN u
```

This behavior should always be taken into account when writing queries.

To distinguish between an explicit `null` value and the implicit `null` value
you get if you access a non-existent attribute, you can use the
[`HAS() function`](../functions/document-object.md#has). The following query
only returns documents that have a `name` attribute with a `null` value:

```aql
FOR u IN users
  FILTER u.name == null AND HAS(u, "name")
  RETURN u
```

To exclude implicit as well as explicit `null` values in a query that uses
`<` or `<=` comparison operators to limit the upper bound, you can add a check
for the lower bound:

```aql
FOR u IN users
  FILTER u.age > null AND u.age < 39
  // or potentially
  //FILTER u.age >= 0 AND u.age < 39
  // which can be replaced with
  //FILTER RANGE(u.age, 0, 39, true, false)
  RETURN u
```
