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

## Indexing



## Server options



## Miscellaneous changes



## Client tools



## Internal changes


