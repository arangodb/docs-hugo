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

### Spread operator for arrays and objects

You can use the spread syntax `...`, inspired by JavaScript, to insert the
elements of an array into an array literal and to copy the attributes of an
object into an object literal:

```aql
LET arr = [2, 3]
LET obj = { b: 2, c: 9 }
RETURN {
  array: [1, ...arr, 4],         // [1, 2, 3, 4]
  object: { a: 1, ...obj, c: 3 } // { "a": 1, "b": 2, "c": 3 } (last "c" wins)
}
```

The spread syntax is a more concise and readable alternative to combining
arrays with the [`PUSH()`](../../aql/functions/array.md#push) and
[`APPEND()`](../../aql/functions/array.md#append) functions, and to merging
objects with the [`MERGE()`](../../aql/functions/document-object.md#merge)
function. For details, see [Array spread](../../aql/operators.md#array-spread-syntax)
and [Object spread](../../aql/operators.md#object-spread-syntax).

This change also includes a change of behavior for duplicate attribute names in
object literals. The last occurrence now wins instead of the first one. See
[Incompatible changes in ArangoDB 4.0](incompatible-changes-in-4-0.md#duplicate-attribute-names-in-object-literals).

### PARTITION() string function

The new [`PARTITION()` AQL function](../../aql/functions/string.md#partition)
splits a string at a single occurrence of a separator and returns an array of
exactly three strings: the part before the separator, the separator itself, and
the part after the separator. An optional `occurrence` parameter lets you select
which occurrence of the separator to split at, counted from the start (positive
values) or from the end (negative values).

```aql
RETURN PARTITION("foo:bar:baz", ":", -1) // ["foo:bar", ":", "baz"]
```

### `UNION_DISTINCT_STABLE()` function

The new [`UNION_DISTINCT_STABLE()`](../../aql/functions/array.md#union_distinct_stable)
function combines the unique values of an arbitrary number of arrays into a
single array, like the existing
[`UNION_DISTINCT()`](../../aql/functions/array.md#union_distinct) function, but
retains the order of the elements. Each value appears at the position
of its first occurrence across the arrays, processed from left to right:

```aql
RETURN UNION_DISTINCT_STABLE([1, 2, 3], [3, 2, 1], [4], [5, 6, 1])
// [1, 2, 3, 4, 5, 6]
```

Like `UNION_DISTINCT()`, the `UNION_DISTINCT_STABLE()` function cannot be used
as an aggregation function in a `COLLECT` operation.

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


