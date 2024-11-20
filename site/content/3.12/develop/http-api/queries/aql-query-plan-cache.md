---
title: HTTP interface for the query plan cache
menuTitle: AQL query plan cache
weight: 9
description: >-
  The query plan cache HTTP API lets you list the AQL query execution plans that
  are in the cache as well as clear the cache
---
## List the entries of the AQL query plan cache

```openapi
paths:
  /_db/{database-name}/_api/query-plan-cache:
    get:
      operationId: listQueryCachePlans
      description: |
        Returns an array containing information about each AQL query execution
        plan currently stored in the cache of the selected database.

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
                    - numUsed
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
                        original query.
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
                    numUsed:
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

## Clear the AQL query results cache

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