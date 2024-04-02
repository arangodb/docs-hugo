---
title: AQL query results
menuTitle: Query Results
weight: 35
description: >-
  The result set of an AQL query is always an array of values, even if it
  returns a single element only
---
AQL queries and also [subqueries](subqueries.md) each produce an array with zero
or more elements.

An empty array typically means that no (matching) data was found to act upon, or
that a write query didn't specify anything to return.

```aql
FOR doc IN emptyCollection
  RETURN doc  // no documents
```

```
FOR u IN users
  FILTER age == -1  // no matches
  RETURN u
```

```aql
UPDATE { id: 2, active: true } IN users
// no RETURN operation
```

The result set of the above examples is empty:

```json
[ ]
```

If there is a single result, you get an array with one element back, not the
result value only.


```aql
FOR u IN users
  LIMIT 1
  RETURN u.name
```

```json
[ "John" ]
```

If there are multiple results, you get an array with many elements back.

```aql
FOR u IN users
  RETURN u.name
```

```json
[
  "John",
  "Vanessa",
  "Amy"
]
```

The individual values in the result array of a query may or may not have a
homogeneous structure, depending on what is actually queried.

For example, the individual documents of a collection can use different sets of
attribute names. When returning data from a collection with inhomogeneous
documents without modification, the result values have an inhomogeneous structure,
too. Each result value itself is a document:

```aql
FOR u IN users
  RETURN u
```

```json
[
  { "id": 1, "name": "John", "active": false },
  { "age": 32, "id": 2, "name": "Vanessa" },
  { "friends": [ "John", "Vanessa" ], "id": 3, "name": "Amy" }
]
```

However, if a fixed set of attributes from the collection is queried, then the 
query result values have a homogeneous structure. Each result value is
still (a projection of) a document:

```aql
FOR u IN users
  RETURN { "id": u.id, "name": u.name }
```

```json
[
  { "id": 1, "name": "John" },
  { "id": 2, "name": "Vanessa" },
  { "id": 3, "name": "Amy" }
]
```

It is also possible to query scalar values only. In this case, the result set
is an array of scalars, and each result value is a scalar value:

```aql
FOR u IN users
  RETURN u.id
```

```json
[ 1, 2, 3 ]
```
