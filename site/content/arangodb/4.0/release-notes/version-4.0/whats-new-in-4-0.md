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

### `LIKE` as an array comparison operator

You can now combine the `LIKE` and `NOT LIKE` operators for wildcard matching
with the [array comparison operators](../../aql/operators.md#array-comparison-operators)
`ALL`, `ANY`, `NONE`, and `AT LEAST (<expression>)`. This lets you match the
elements of an array against a pattern, for example:

```aql
["foo", "bar"]  ANY LIKE  "b%"           // true
["foo", "bar"]  AT LEAST (2) LIKE  "_oo" // false
```

Previously, `LIKE` and `NOT LIKE` were among the few comparison operators that could not be
combined with the array comparison operators. The regular expression operators
`=~` and `!~` remain unsupported as array variants.

## Indexing



## Server options



## Miscellaneous changes



## Client tools



## Internal changes


