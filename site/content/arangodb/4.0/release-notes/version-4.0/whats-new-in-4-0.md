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
function. For details, see [Array spread](../../aql/operators.md#array-spread)
and [Object spread](../../aql/operators.md#object-spread).

This change also includes a change of behavior for duplicate attribute names in
object literals. The last occurrence now wins instead of the first one. See
[Incompatible changes in ArangoDB 4.0](incompatible-changes-in-4-0.md#duplicate-attribute-names-in-object-literals).

## Indexing



## Server options



## Miscellaneous changes



## Client tools



## Internal changes


