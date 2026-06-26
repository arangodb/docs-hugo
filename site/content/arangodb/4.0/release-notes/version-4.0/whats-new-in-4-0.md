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

### String concatenation with the `+` operator

The `+` operator is now overloaded and can concatenate strings. If at least one
of its two operands is a string, it concatenates the operands as strings, casting
the other operand to a string if necessary. If both operands are non-string
values, it performs arithmetic addition as before. This makes the operator behave
similarly to the `+` operator in JavaScript.

```aql
RETURN "foo" + "bar" // "foobar"
RETURN "answer: " + 42 // "answer: 42"
RETURN 123 + "200" // "123200"
RETURN 1 + 2 // 3
```

Previously, you had to use the [`CONCAT()`](../../aql/functions/string.md#concat)
function for string concatenation and the `+` operator always performed arithmetic
addition. Note that this is a potentially breaking change for queries that relied
on the previous behavior, see
[Incompatible changes in ArangoDB 4.0](incompatible-changes-in-4-0.md#aql--operator-overloaded-for-string-concatenation).

For more information, see [String operators](../../aql/operators.md#string-operators).

## Indexing



## Server options



## Miscellaneous changes



## Client tools



## Internal changes


