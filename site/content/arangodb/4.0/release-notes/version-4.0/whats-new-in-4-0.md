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

### `LIKE`, `NOT LIKE`, `=~`, `!~` as array comparison operators

You can now combine the `LIKE` and `NOT LIKE` operators for wildcard matching
as well as the `=~` and `!~` operators for regular expression matching
with the [array comparison operators](../../aql/operators.md#array-comparison-operators)
`ALL`, `ANY`, `NONE`, and `AT LEAST (<expression>)`. This lets you match the
elements of an array against a pattern, for example:

```aql
["foo", "bar"]  ANY LIKE  "b%"           // true
["foo", "bar"]  AT LEAST (2) LIKE  "_oo" // false

["foo", "bar"]  ALL =~  "[a-fro]{3}"  // true
["foo", "bar"]  ANY !~  "^mo+$"       // true
```

Previously, these operators were the only comparison operators that could not be
combined with the array comparison operators. Internally, these constructs are
transformed into approximately the following AQL expressions using the
question mark operator:

```aql
["foo", "bar"][? ANY FILTER LIKE(CURRENT, "b%")]
["foo", "bar"][? AT LEAST(2) FILTER LIKE(CURRENT, "_oo")]

["foo", "bar"][? ALL FILTER REGEX_TEST(CURRENT, "[a-fro]{3}")]
["foo", "bar"][? ANY FILTER ! REGEX_TEST(CURRENT, "^mo+$")]
```

## Indexing



## Server options



## Miscellaneous changes



## Client tools



## Internal changes


