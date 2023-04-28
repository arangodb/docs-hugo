---
title: High-level operations
weight: 25
description: >-
  High-level operations are the core language constructs of the query language.
archetype: chapter
---
The following high-level operations are described here after:

- [**FOR**](for.md):
  Iterate over a collection or View, all elements of an array or traverse a graph

- [**RETURN**](return.md):
  Produce the result of a query.

- [**FILTER**](filter.md):
  Restrict the results to elements that match arbitrary logical conditions.

- [**SEARCH**](search.md):
  Query an `arangosearch` or `search-alias` View.

- [**SORT**](sort.md):
  Force a sort of the array of already produced intermediate results.

- [**LIMIT**](limit.md):
  Reduce the number of elements in the result to at most the specified number,
  optionally skip elements (pagination).

- [**LET**](let.md):
  Assign an arbitrary value to a variable.

- [**COLLECT**](collect.md):
  Group an array by one or multiple group criteria. Can also count and aggregate.

- [**WINDOW**](window.md):
  Perform aggregations over related rows.

- [**REMOVE**](remove.md):
  Remove documents from a collection.

- [**UPDATE**](update.md):
  Partially update documents in a collection.

- [**REPLACE**](replace.md):
  Completely replace documents in a collection.

- [**INSERT**](insert.md):
  Insert new documents into a collection.

- [**UPSERT**](upsert.md):
  Update/replace an existing document, or create it in the case it does not exist.

- [**WITH**](with.md):
  Specify collections used in a query (at query begin only).
