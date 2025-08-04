---
title: HTTP interface for the query results cache
menuTitle: AQL query results cache
weight: 10
description: >-
  The query results cache HTTP API lets you control the cache for AQL query results
---
See [The AQL query results cache](../../../aql/execution-and-performance/caching-query-results.md)
for a description of the feature and the configuration options.

{{< info >}}
The AQL query results cache is only available for single servers, i.e. servers that
are not part of a cluster setup.
{{< /info >}}

## List the entries of the AQL query results cache

```openapi
paths:
  /_db/{database-name}/_api/query-cache/entries:
    get:
      operationId: listQueryCacheResults
      description: |
        Returns an array containing the AQL query results currently stored in the query results
        cache of the selected database.
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
            The list of cached query results.
          content:
            application/json:
              schema:
                description: |
                  The entries of the query results cache.
                type: array
                items:
                  description: |
                    The properties of a cache entry.
                  type: object
                  required:
                    - hash
                    - query
                    - size
                    - results
                    - hits
                    - runTime
                    - started
                    - dataSources
                  properties:
                    hash:
                      description: |
                        The hash value calculated from the the query string,
                        certain query options, and the bind variables.
                      type: string
                    query:
                      description: |
                        The query string.
                      type: string
                    bindVars:
                      description: |
                        The bind parameters. This attribute is omitted if the
                        `--query.tracking-with-bindvars` startup option is set
                        to `false`.
                      type: object
                    size:
                      description: |
                        The size of the query result and bind parameters (in bytes).
                      type: integer
                    results:
                      description: |
                        The number of documents/rows in the query result.
                      type: integer
                    started:
                      description: |
                        The date and time at which the query result has been added
                        to the cache (in ISO 8601 format).
                      type: string
                      format: date-time
                    hits:
                      description: |
                        How many times the result has been served from the cache so far.
                      type: integer
                    runTime:
                      description: |
                        The total duration of the query in seconds.
                      type: number
                    dataSources:
                      description: |
                        The collections and Views involved in the query.
                      type: array
                      items:
                        type: string
        '400':
          description: |
            The request is malformed.
      tags:
        - Queries
```

```curl
---
name: HttpListQueryResultsCache
description: |
  Retrieve the entries stored in the AQL query results cache of the current database:
---
var resultsCache = require("@arangodb/aql/cache");
resultsCache.properties({ mode: "demand" }); 

db._create("coll");
for (let i = 0; i < 3; i++) {
  db._query("FOR doc IN @@coll FILTER doc.attr == @val RETURN doc", {
    "@coll": "coll", val: "foo"
  }, { cache: true, fullCount: true });
}
db._query("RETURN 42", {}, { cache: true });

var url = "/_api/query-cache/entries";
var response = logCurlRequest('GET', url);
assert(response.code === 200);
assert(response.parsedBody.length >= 2);
logJsonResponse(response);

db._drop("coll");
```

## Clear the AQL query results cache

```openapi
paths:
  /_db/{database-name}/_api/query-cache:
    delete:
      operationId: deleteAqlQueryCache
      description: |
        Clears all results stored in the AQL query results cache for the current database.
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
            The results cache has been cleared.
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
        '400':
          description: |
            The request is malformed.
      tags:
        - Queries
```

```curl
---
name: HttpClearQueryResultsCache
description: |
  Clear the AQL query results cache of the current database:
---
var url = "/_api/query-cache";
var response = logCurlRequest('DELETE', url);
assert(response.code === 200);
logJsonResponse(response);
```

## Get the AQL query results cache configuration

```openapi
paths:
  /_db/{database-name}/_api/query-cache/properties:
    get:
      operationId: getQueryCacheProperties
      description: |
        Returns the global AQL query results cache configuration.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database.
          schema:
            type: string
      responses:
        '200':
          description: |
            The result cache configuration is returned successfully.
          content:
            application/json:
              schema:
                description: |
                  The result cache configuration.
                type: object
                properties:
                  mode:
                    description: |
                      The mode the AQL query results cache operates in.
                    type: string
                    # Unquoted on and off are booleans in YAML 1.1!
                    enum: ["off", "on", "demand"]
                  maxResults:
                    description: |
                      The maximum number of query results that are stored per
                      database-specific cache.
                    type: integer
                  maxResultsSize:
                    description: |
                      The maximum cumulated size of query results that are
                      stored per database-specific cache (in bytes).
                    type: integer
                  maxEntrySize:
                    description: |
                      The maximum individual result size of queries that are
                      stored per database-specific cache (in bytes).
                  includeSystem:
                    description: |
                      Whether results of queries that involve system collections
                      are stored in the query results cache.
                    type: boolean
        '400':
          description: |
            The request is malformed.
      tags:
        - Queries
```

```curl
---
name: HttpGetQueryResultsCacheProperties
description: |
  Retrieve the global configuration of the AQL query results cache:
---
var resultsCache = require("@arangodb/aql/cache");
resultsCache.properties({ mode: "demand" }); 

var url = "/_api/query-cache/properties";
var response = logCurlRequest('GET', url);
assert(response.code === 200);
assert(response.parsedBody.mode == "demand");
logJsonResponse(response);
```

## Set the AQL query results cache configuration

```openapi
paths:
  /_db/{database-name}/_api/query-cache/properties:
    put:
      operationId: setQueryCacheProperties
      description: |
        Adjusts the global properties for the AQL query results cache.

        Changing the properties may invalidate all results currently in the cache.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              description: |
                The result cache configuration settings to change.
              type: object
              properties:
                mode:
                  description: |
                     The mode the AQL query cache shall operate in.

                     Default: Controlled by the `--query.cache-mode` startup option.
                  type: string
                  # Unquoted on and off are booleans in YAML 1.1!
                  enum: ["off", "on", "demand"]
                maxResults:
                  description: |
                    The maximum number of query results that are stored per
                    database-specific cache.

                    Default: Controlled by the  `--query.cache-entries` startup option.
                  type: integer
                maxResultsSize:
                  description: |
                    The maximum cumulated size of query results that are stored
                    per database-specific cache (in bytes).

                    Default: Controlled by the `--query.cache-entries-max-size` startup option.
                  type: integer
                maxEntrySize:
                  description: |
                    The maximum individual size of query results that are stored
                    per database-specific cache (in bytes).

                    Default: Controlled by the `--query.cache-entry-max-size` startup option.
                  type: integer
                includeSystem:
                  description: |
                    Whether to store results of queries that involve
                    system collections in the cache.

                    Default: Controlled by the `--query.cache-include-system-collections`
                    startup option
                  type: boolean
      responses:
        '200':
          description: |
            The result cache configuration has been changed successfully.
          content:
            application/json:
              schema:
                description: |
                  The result cache configuration.
                type: object
                properties:
                  mode:
                    description: |
                      The mode the AQL query results cache operates in.
                    type: string
                    # Unquoted on and off are booleans in YAML 1.1!
                    enum: ["off", "on", "demand"]
                  maxResults:
                    description: |
                      The maximum number of query results that are stored per
                      database-specific cache.
                    type: integer
                  maxResultsSize:
                    description: |
                      The maximum cumulated size of query results that are
                      stored per database-specific cache (in bytes).
                    type: integer
                  maxEntrySize:
                    description: |
                      The maximum individual result size of queries that are
                      stored per database-specific cache (in bytes).
                  includeSystem:
                    description: |
                      Whether results of queries that involve system collections
                      are stored in the query results cache.
                    type: boolean
        '400':
          description: |
            The request is malformed.
      tags:
        - Queries
```

```curl
---
name: HttpSetQueryResultsCacheProperties
description: |
  Change some properties of the global configuration of the AQL query results cache:
---
var url = "/_api/query-cache/properties";
var body = { mode: "demand", maxResults: 32 };
var response = logCurlRequest('PUT', url, body);
assert(response.code === 200);
assert(response.parsedBody.mode == "demand");
assert(response.parsedBody.maxResults == 32);
logJsonResponse(response);
```
