---
title: HTTP interface for the query plan cache
menuTitle: AQL query plan cache
weight: 9
description: >-
  The query plan cache HTTP API lets you list the AQL execution plans that
  are in the cache as well as clear the cache
---
<small>Introduced in: v3.12.4</small>

To cache execution plans for AQL queries as well as to utilize cached plans,
set the `usePlanCache` query option to `true` when issuing a query. See
[HTTP interfaces for AQL queries](aql-queries.md#create-a-cursor) for details
and [The execution plan cache for AQL queries](../../../aql/execution-and-performance/caching-query-plans.md)
for general information about the feature.

## List the entries of the AQL query plan cache

```openapi
paths:
  /_db/{database-name}/_api/query-plan-cache:
    get:
      operationId: listQueryCachePlans
      description: |
        Returns an array containing information about each AQL execution plan
        currently stored in the cache of the selected database.

        This requires read privileges for the current database. In addition, only those
        query plans are returned for which the current user has at least read permissions
        on all collections and Views included in the query.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
      responses:
        '200':
          description: |
            The list of cached query plans.
          content:
            application/json:
              schema:
                description: |
                  The entries of the query plan cache.
                type: array
                items:
                  description: |
                    The properties of a cache entry.
                  type: object
                  required:
                    - hash
                    - query
                    - queryHash
                    - bindVars
                    - fullCount
                    - dataSources
                    - created
                    - hits
                    - memoryUsage
                  properties:
                    hash:
                      description: |
                        The plan cache key.
                      type: string
                    query:
                      description: |
                        The query string.
                      type: string
                    queryHash:
                      description: |
                        The hash value of the query string.
                      type: integer
                    bindVars:
                      description: |
                        A subset of the original bind parameters with only the
                        collection bind parameters (e.g. `@@coll`). They need to
                        have the same names and values for utilizing a cached plan.
                      type: object
                    fullCount:
                      description: |
                        The value of the `fullCount` query option in the
                        original query. This option generally leads to different
                        execution plans.
                      type: boolean
                    dataSources:
                      description: |
                        The collections and Views involved in the query.
                      type: array
                      items:
                        type: string
                    created:
                      description: |
                        The date and time at which the query plan has been added
                        to the cache (in ISO 8601 format).
                      type: string
                      format: date-time
                    hits:
                      description: |
                        How many times the cached plan has been utilized so far.
                      type: integer
                    memoryUsage:
                      description: |
                        How much memory the plan cache entry takes up for the
                        execution plan, query string, and so on (in bytes).
                      type: integer
      tags:
        - Queries
```

```curl
---
name: HttpListQueryPlanCache
description: |
  Retrieve the entries stored in the AQL query plan cache of the current database:
---
db._create("coll");
for (let i = 0; i < 3; i++) {
  db._query("FOR doc IN @@coll FILTER doc.attr == @val RETURN doc", {
    "@coll": "coll", val: "foo"
  }, { usePlanCache: true });
}
db._query("RETURN 42", {}, { usePlanCache: true });

var url = "/_api/query-plan-cache";
var response = logCurlRequest('GET', url);
assert(response.code === 200);
assert(response.parsedBody.length >= 2);
logJsonResponse(response);

db._drop("coll");
```

## Clear the AQL query plan cache

```openapi
paths:
  /_db/{database-name}/_api/query-plan-cache:
    delete:
      operationId: deleteAqlQueryPlanCache
      description: |
        Clears all execution plans stored in the AQL query plan cache for the
        current database.

        This requires write privileges for the current database.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
      responses:
        '200':
          description: |
            The query plan cache has been cleared for the current database.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
      tags:
        - Queries
```

```curl
---
name: HttpClearQueryPlanCache
description: |
  Clear the AQL query plan cache of the current database:
---
var url = "/_api/query-plan-cache";
var response = logCurlRequest('DELETE', url);
assert(response.code === 200);
logJsonResponse(response);
```
