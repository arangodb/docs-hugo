---
title: Start using AQL
menuTitle: Start using AQL
weight: 45
description: >-
  You can execute AQL queries in different ways, from the easy-to-use
  web interface to the raw HTTP API
---
## How to invoke AQL

AQL queries can be executed using:

- the web interface
- the `db` object (either in arangosh or in a Foxx service)
- the raw HTTP API
- through drivers and integrations as an abstraction over the HTTP API

There are always calls to the server's API under the hood, but the web interface,
the `db` object, drivers, and integrations abstract away the low-level
communication details and are thus easier to use.

The ArangoDB Web Interface has a [specific tab for AQL queries execution](../aql/how-to-invoke-aql/with-the-web-interface.md).

You can run [AQL queries from the ArangoDB Shell](../aql/how-to-invoke-aql/with-arangosh.md)
with the [`_query()`](../aql/how-to-invoke-aql/with-arangosh.md#with-db_query) and
[`_createStatement()`](../aql/how-to-invoke-aql/with-arangosh.md#with-db_createstatement-arangostatement) methods
of the [`db` object](../develop/javascript-api/@arangodb/db-object.md). This chapter
also describes how to use bind parameters, statistics, counting and cursors with
arangosh.

If you are using Foxx, see [how to write database queries](../develop/foxx-microservices/getting-started.md#writing-database-queries)
for examples including tagged template strings.

If you want to run AQL queries from your application via the HTTP REST API,
see the full API description at [HTTP interface for AQL queries](../develop/http-api/queries/aql-queries.md).

See the respective [driver](../develop/drivers/_index.md) or
[integration](../develop/integrations/_index.md) for its support of AQL queries.

## Learn the query language

See the [AQL documentation](../aql/_index.md) for the full language reference
as well as examples.

For a tutorial, sign up for the [ArangoDB University](https://university.arangodb.com/)
to get access to the **AQL Fundamentals** course.
