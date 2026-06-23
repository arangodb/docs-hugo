---
title: Features and Improvements in ArangoDB 4.0
menuTitle: What's New in 4.0
weight: 5
description: >-
  TODO
---
The following list shows in detail which features have been added or improved in
ArangoDB 4.0. ArangoDB 4.0 also contains several bug fixes that are not listed
here.

## ArangoSearch



## Analyzers



## Web interface



## AQL

### `UNION_DISTINCT_STABLE()` function

The new [`UNION_DISTINCT_STABLE()`](../../aql/functions/array.md#union_distinct_stable)
function combines the distinct values of an arbitrary number of arrays into a
single array, like the existing
[`UNION_DISTINCT()`](../../aql/functions/array.md#union_distinct) function, but
retains the order of the elements. Each distinct value appears at the position
of its first occurrence across the arrays, processed from left to right:

```aql
RETURN UNION_DISTINCT_STABLE([1, 2, 3], [3, 2, 1], [4], [5, 6, 1])
// [1, 2, 3, 4, 5, 6]
```

## Indexing



## Server options



## Miscellaneous changes



## Client tools



## Internal changes


