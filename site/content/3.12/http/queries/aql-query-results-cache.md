---
title: HTTP interface for the query cache
menuTitle: AQL query results cache
weight: 10
description: >-
  The query cache HTTP API lets you control the cache for AQL query results
archetype: default
---
```openapi
## Returns the currently cached query results

paths:
  /_api/query-cache/entries:
    get:
      operationId: listQueryCacheResults
      description: |
        Returns an array containing the AQL query results currently stored in the query results
        cache of the selected database. Each result is a JSON object with the following attributes:

        - *hash*: the query result's hash

        - *query*: the query string

        - *bindVars*: the query's bind parameters. this attribute is only shown if tracking for
          bind variables was enabled at server start

        - *size*: the size of the query result and bind parameters, in bytes

        - *results*: number of documents/rows in the query result

        - *started*: the date and time when the query was stored in the cache

        - *hits*: number of times the result was served from the cache (can be
          *0* for queries that were only stored in the cache but were never accessed
          again afterwards)

        - *runTime*: the query's run time

        - *dataSources*: an array of collections/Views the query was using
      responses:
        '200':
          description: |
            Is returned when the list of results can be retrieved successfully.
        '400':
          description: |
            The server will respond with *HTTP 400* in case of a malformed request,
      tags:
        - Queries
```
```openapi
## Clears any results in the AQL query results cache

paths:
  /_api/query-cache:
    delete:
      operationId: deleteAqlQueryCache
      description: |
        clears the query results cache for the current database
      responses:
        '200':
          description: |
            The server will respond with *HTTP 200* when the cache was cleared
            successfully.
        '400':
          description: |
            The server will respond with *HTTP 400* in case of a malformed request.
      tags:
        - Queries
```
```openapi
## Returns the global properties for the AQL query results cache

paths:
  /_api/query-cache/properties:
    get:
      operationId: getQueryCacheProperties
      description: |
        Returns the global AQL query results cache configuration. The configuration is a
        JSON object with the following properties:

        - *mode*: the mode the AQL query results cache operates in. The mode is one of the following
          values: *off*, *on* or *demand*.

        - *maxResults*: the maximum number of query results that will be stored per database-specific
          cache.

        - *maxResultsSize*: the maximum cumulated size of query results that will be stored per
          database-specific cache.

        - *maxEntrySize*: the maximum individual result size of queries that will be stored per
          database-specific cache.

        - *includeSystem*: whether or not results of queries that involve system collections will be
          stored in the query results cache.
      responses:
        '200':
          description: |
            Is returned if the properties can be retrieved successfully.
        '400':
          description: |
            The server will respond with *HTTP 400* in case of a malformed request,
      tags:
        - Queries
```
```openapi
## Globally adjusts the AQL query results cache properties

paths:
  /_api/query-cache/properties:
    put:
      operationId: setQueryCacheProperties
      description: |
        After the properties have been changed, the current set of properties will
        be returned in the HTTP response.

        Note: changing the properties may invalidate all results in the cache.
        The global properties for AQL query cache.
        The properties need to be passed in the attribute *properties* in the body
        of the HTTP request. *properties* needs to be a JSON object with the following
        properties:
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                mode:
                  description: |
                     the mode the AQL query cache should operate in. Possible values are *off*, *on* or *demand*.
                  type: string
                maxResults:
                  description: |
                    the maximum number of query results that will be stored per database-specific cache.
                  type: integer
                maxResultsSize:
                  description: |
                    the maximum cumulated size of query results that will be stored per database-specific cache.
                  type: integer
                maxEntrySize:
                  description: |
                    the maximum individual size of query results that will be stored per database-specific cache.
                  type: integer
                includeSystem:
                  description: |
                    whether or not to store results of queries that involve system collections.
                  type: boolean
      responses:
        '200':
          description: |
            Is returned if the properties were changed successfully.
        '400':
          description: |
            The server will respond with *HTTP 400* in case of a malformed request,
      tags:
        - Queries
```
