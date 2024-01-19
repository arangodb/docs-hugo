---
title: Parsing AQL queries
menuTitle: Parsing queries
weight: 10
description: >-
  Clients can check if given AQL queries are syntactically valid using an
  HTTP API or JavaScript API
archetype: default
---
ArangoDB provides an [HTTP REST API](../../develop/http-api/queries/aql-queries.md)
for parsing and thus statically validating queries.

A query can also be parsed from the ArangoShell using `ArangoStatement`'s `parse` method. The
`parse` method will throw an exception if the query is syntactically invalid. Otherwise, it will
return the some information about the query.

The return value is an object with the collection names used in the query listed in the
`collections` attribute, and all bind parameters listed in the `bindVars` attribute.
Additionally, the internal representation of the query, the query's abstract syntax tree, will
be returned in the `AST` attribute of the result. Please note that the abstract syntax tree
will be returned without any optimizations applied to it.

```js
---
name: 11_workWithAQL_parseQueries
description: ''
---
var stmt = db._createStatement(
  "FOR doc IN @@collection FILTER doc.foo == @bar RETURN doc");
stmt.parse();
~removeIgnoreCollection("mycollection")
~db._drop("mycollection")
```
