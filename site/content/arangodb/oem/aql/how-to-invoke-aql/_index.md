---
title: How to execute AQL queries
menuTitle: How to invoke AQL
weight: 5
description: ''
---
AQL queries can be invoked in the following ways:

- Via the web interface
- Using the `db` object of the JavaScript API, for example, in arangosh or in a Foxx service
- Via the raw REST HTTP API

There are always calls to the server's HTTP API under the hood, but the web interface
and the `db` object abstract away the low-level communication details and are
thus easier to use.

The ArangoDB web interface has a specific section for [**QUERIES**](with-the-web-interface.md).

You can run [AQL queries from the ArangoDB Shell](with-arangosh.md)
with the [`db._query()`](with-arangosh.md#with-db_query) and
[`db._createStatement()`](with-arangosh.md#with-db_createstatement-arangostatement)
methods of the [`db` object](../../develop/javascript-api/@arangodb/db-object.md). This chapter
also describes how to use bind parameters, statistics, counting, and cursors with
arangosh.

If you use Foxx microservices, see [how to write database queries](../../develop/foxx-microservices/getting-started.md#writing-database-queries)
for examples including tagged template strings.

If you want to run AQL queries from your application via the HTTP REST API,
see the full API description at [HTTP interface for AQL queries](../../develop/http-api/queries/aql-queries.md).
