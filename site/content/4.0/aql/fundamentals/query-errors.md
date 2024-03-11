---
title: AQL query errors
menuTitle: Query Errors
weight: 40
description: >-
  Errors can occur for queries at compile time, like for syntax errors and
  missing collections, but warnings and errors can also occur during query
  execution
---
Issuing an invalid query to the server results in a parse error if the query
is syntactically invalid. ArangoDB detects such errors during query
inspection and aborts further processing. The error number and an error
message are returned so that you can fix the errors.

If a query passes the parsing stage, all collections explicitly referenced in
the query are known. If any of these collections doesn't exist, the query execution
is aborted and an appropriate error message is returned.

Under some circumstances, executing a query may also produce errors or warnings
at runtime. This cannot be predicted from inspecting the query text alone.
This is because query operations can be data-dependent or are only evaluated
during the query execution, like looking up documents dynamically or using
document attributes that not all documents of the collection have. This can
subsequently lead to errors or warnings if these cases are not accounted for.

Some examples of runtime errors:

- **Division by zero**: Raised when an attempt is made to use the value
  `0` as the divisor in an arithmetic division or modulus operation
- **Invalid operands for arithmetic operations**: Raised when an attempt
  is made to use any non-numeric values as operands in arithmetic operations.
  This includes unary (unary minus, unary plus) and binary operations (plus,
  minus, multiplication, division, and modulus)
- **Invalid operands for logical operations**: Raised when an attempt is
  made to use any non-boolean values as operand(s) in logical operations. This
  includes unary (logical not/negation), binary (logical and, logical or), and
  the ternary operator
- **Array expected in query**: Raised when a non-array operand is used for an
  operation that expects an array argument operand. This can happen if you
  try to iterate over an attribute with a `FOR` operation, expecting it to be an
  array, but if the attribute doesn't exist, then it has a value of `null` which
  cannot be looped over.

See the [Error codes and meanings](../../develop/error-codes-and-meanings.md)
for a complete list of ArangoDB errors.
