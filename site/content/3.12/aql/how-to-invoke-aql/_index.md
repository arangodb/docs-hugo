---
title: How to invoke AQL
menuTitle: How to invoke AQL
weight: 5
description: >-
  AQL queries can be executed using
archetype: chapter
---
AQL queries can be executed using:

- the web interface,
- the `db` object (either in arangosh or in a Foxx service)
- or the raw HTTP API.

There are always calls to the server's API under the hood, but the web interface
and the `db` object abstract away the low-level communication details and are
thus easier to use.

The ArangoDB Web Interface has a [specific tab for AQL queries execution](with-the-web-interface.md).

You can run [AQL queries from the ArangoDB Shell](with-arangosh.md)
with the [_query](with-arangosh.md#with-db_query) and
[_createStatement](with-arangosh.md#with-db_createstatement-arangostatement) methods
of the [`db` object](../../develop/javascript-api/@arangodb/db-object.md). This chapter
also describes how to use bind parameters, statistics, counting and cursors with
arangosh.

If you are using Foxx, see [how to write database queries](../../develop/foxx-microservices/getting-started.md#writing-database-queries)
for examples including tagged template strings.

If you want to run AQL queries from your application via the HTTP REST API,
see the full API description at [HTTP interface for AQL queries](../../http/queries/aql-queries.md).
