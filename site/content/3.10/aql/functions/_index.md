---
title: AQL functions
menuTitle: Functions
weight: 30
description: >-
  AQL offers an extensive set of functions to allow for complex computations
  and it supports user-defined functions
archetype: chapter
---
Functions can be called at any query position where an expression is allowed.
The general function call syntax is:

```aql
FUNCTIONNAME(arguments)
```

`FUNCTIONNAME` is the name of the function to be called, and `arguments`
is a comma-separated list of function arguments. If a function does not need any
arguments, the argument list can be left empty. However, even if the argument
list is empty, the parentheses around it are still mandatory to make function
calls distinguishable from variable names.

Some example function calls:

```aql
HAS(user, "name")
LENGTH(friends)
COLLECTIONS()
```

In contrast to collection and variable names, function names are case-insensitive, 
i.e. `LENGTH(foo)` and `length(foo)` are equivalent.

## Extending AQL

It is possible to extend AQL with user-defined functions. These functions need to
be written in JavaScript, and have to be registered before they can be used in a query.
Please refer to [Extending AQL](../user-defined-functions.md) for more details.
