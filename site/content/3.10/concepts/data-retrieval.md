---
title: Data Retrieval
weight: 70
description: >-
  You can get information stored in ArangoDB back out using queries, optionally
  accelerated by indexes, and possibly in result batches
archetype: default
---
**Queries** are used to filter documents based on certain criteria, to compute
or store new data, as well as to manipulate or delete existing documents.
Queries can be as simple as returning individual records, or as complex as
traversing graphs or performing [joins](../aql/examples-and-query-patterns/joins.md) using many
collections. Queries are written in the [ArangoDB Query Language](../aql/_index.md),
**AQL** for short.

**Cursors** are used to iterate over the result of queries, so that you get
easily processable batches instead of one big hunk.

**Indexes** are used to speed up queries. There are multiple types of indexes,
such as [persistent indexes](../index-and-search/indexing/working-with-indexes/persistent-indexes.md) and
[geo-spatial indexes](../index-and-search/indexing/working-with-indexes/geo-spatial-indexes.md).

**Views** are another type of index, primarily for full-text search. See
[ArangoSearch](../index-and-search/arangosearch/_index.md).
