---
title: HTTP interfaces for AQL queries
menuTitle: AQL queries
weight: 5
description: >-
  The HTTP API for AQL queries lets you to execute, track, kill, explain, and
  validate queries written in ArangoDB's query language
# Undocumented on purpose:
#   PUT /_db/{database-name}/_api/cursor/{cursor-identifier}  (deprecated)
---
## Cursors

Results of AQL queries are returned as cursors in order to batch the communication
between server and client. Each batch contains a number of documents and an
indication if the current batch is the final batch. Depending on the query, the
total number of documents in the result set may or may not be known in advance.

If the number of documents doesn't exceed the batch size, the full query result
is returned to the client in a single round-trip. If there are more documents,
then the first batch is returned to the client and the client needs to use the
cursor to retrieve the other batches.

In order to free up server resources, the client should delete a cursor as soon
as it is no longer needed.

### Single roundtrip

The server only transfers a certain number of result documents back to the
client in one roundtrip. This number is controllable by the client by setting
the `batchSize` attribute when issuing the query.

If the complete result can be transferred to the client in one go, the client
does not need to issue any further request. The client can check whether it has
retrieved the complete result set by checking the `hasMore` attribute of the
result set. If it is set to `false`, then the client has fetched the complete
result set from the server. In this case, no server-side cursor is created.

```js
> curl --data @- -X POST --dump - http://localhost:8529/_api/cursor
{ "query" : "FOR u IN users LIMIT 2 RETURN u", "count" : true, "batchSize" : 2 }

HTTP/1.1 201 Created
Content-type: application/json

{
  "hasMore" : false,
  "error" : false,
  "result" : [
    {
      "name" : "user1",
      "_rev" : "210304551",
      "_key" : "210304551",
      "_id" : "users/210304551"
    },
    {
      "name" : "user2",
      "_rev" : "210304552",
      "_key" : "210304552",
      "_id" : "users/210304552"
    }
  ],
  "code" : 201,
  "count" : 2
}
```

### Using a cursor

If the result set contains more documents than should be transferred in a single
roundtrip (i.e. as set via the `batchSize` attribute), the server returns
the first few documents and creates a temporary cursor. The cursor identifier
is also returned to the client. The server puts the cursor identifier
in the `id` attribute of the response object. Furthermore, the `hasMore`
attribute of the response object is set to `true`. This is an indication
for the client that there are additional results to fetch from the server.

**Examples**

Create and extract first batch:

```js
> curl --data @- -X POST --dump - http://localhost:8529/_api/cursor
{ "query" : "FOR u IN users LIMIT 5 RETURN u", "count" : true, "batchSize" : 2 }

HTTP/1.1 201 Created
Content-type: application/json

{
  "hasMore" : true,
  "error" : false,
  "id" : "26011191",
  "result" : [
    {
      "name" : "user1",
      "_rev" : "258801191",
      "_key" : "258801191",
      "_id" : "users/258801191"
    },
    {
      "name" : "user2",
      "_rev" : "258801192",
      "_key" : "258801192",
      "_id" : "users/258801192"
    }
  ],
  "code" : 201,
  "count" : 5
}
```

Extract next batch, still have more:

```js
> curl -X POST --dump - http://localhost:8529/_api/cursor/26011191

HTTP/1.1 200 OK
Content-type: application/json

{
  "hasMore" : true,
  "error" : false,
  "id" : "26011191",
  "result": [
    {
      "name" : "user3",
      "_rev" : "258801193",
      "_key" : "258801193",
      "_id" : "users/258801193"
    },
    {
      "name" : "user4",
      "_rev" : "258801194",
      "_key" : "258801194",
      "_id" : "users/258801194"
    }
  ],
  "code" : 200,
  "count" : 5
}
```

Extract next batch, done:

```js
> curl -X POST --dump - http://localhost:8529/_api/cursor/26011191

HTTP/1.1 200 OK
Content-type: application/json

{
  "hasMore" : false,
  "error" : false,
  "result" : [
    {
      "name" : "user5",
      "_rev" : "258801195",
      "_key" : "258801195",
      "_id" : "users/258801195"
    }
  ],
  "code" : 200,
  "count" : 5
}
```

Do not do this because `hasMore` now has a value of false:

```js
> curl -X POST --dump - http://localhost:8529/_api/cursor/26011191

HTTP/1.1 404 Not Found
Content-type: application/json

{
  "errorNum": 1600,
  "errorMessage": "cursor not found: disposed or unknown cursor",
  "error": true,
  "code": 404
}
```

The response object contains a `nextBatchId` attribute, except for the last batch
(when `hasMore` is `false`). If the `allowRetry` query option is set to `true`
and if retrieving a result batch fails because of a connection issue, you
can ask for that batch again using the `POST /_api/cursor/<cursor-id>/<batch-id>`
endpoint. The first batch has an ID of `1` and the value is incremented by 1
with every batch. Every result response except the last one also includes a
`nextBatchId` attribute, indicating the ID of the batch after the current.
You can remember and use this batch ID should retrieving the next batch fail.

```js
> curl --data @- -X POST --dump - http://localhost:8529/_api/cursor
{ "query": "FOR i IN 1..5 RETURN i", "batchSize": 2, "options": { "allowRetry": true } }

HTTP/1.1 201 Created
Content-type: application/json

{
  "result":[1,2],
  "hasMore":true,
  "id":"3517",
  "nextBatchId":2,
  "cached":false,
  "error":false,
  "code":201
}
```

Fetching the second batch would look like this:

```js
> curl -X POST --dump - http://localhost:8529/_api/cursor/3517
```

Assuming the above request fails because of a connection issue but advances the
cursor nonetheless, you can retry fetching the batch using the `nextBatchId` of
the first request (`2`):

```js
curl -X POST --dump http://localhost:8529/_api/cursor/3517/2

{
  "result":[3,4],
  "hasMore":true,
  "id":"3517",
  "nextBatchId":3,
  "cached":false,
  "error":false,
  "code":200
}
```

To allow refetching of the last batch of the query, the server cannot
automatically delete the cursor. After the first attempt of fetching the last
batch, the server would normally delete the cursor to free up resources. As you
might need to reattempt the fetch, it needs to keep the final batch when the
`allowRetry` option is enabled. Once you successfully received the last batch,
you should call the `DELETE /_api/cursor/<cursor-id>` endpoint so that the
server doesn't unnecessarily keep the batch until the cursor times out
(`ttl` query option).

```js
curl -X POST --dump http://localhost:8529/_api/cursor/3517/3

{
  "result":[5],
  "hasMore":false,
  "id":"3517",
  "cached":false,
  "error":false,
  "code":200
}

curl -X DELETE --dump http://localhost:8529/_api/cursor/3517

{
  "id":"3517",
  "error":false,
  "code":202
}
```

If you are no longer interested in the results of a query, you can call the
`DELETE /_api/cursor/<cursor-id>` endpoint as long as a cursor exists to discard
the cursor, even before you requested the last batch.

## Execute AQL queries

### Create a cursor

```openapi
paths:
  /_db/{database-name}/_api/cursor:
    post:
      operationId: createAqlQueryCursor
      description: |
        Submits an AQL query for execution in the current database. The server returns
        a result batch and may indicate that further batches need to be fetched using
        a cursor identifier.

        The query details include the query string plus optional query options and
        bind parameters. These values need to be passed in a JSON representation in
        the body of the POST request.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: x-arango-allow-dirty-read
          in: header
          required: false
          description: |
            Set this header to `true` to allow the Coordinator to ask any shard replica for
            the data, not only the shard leader. This may result in "dirty reads".

            The header is ignored if this operation is part of a Stream Transaction
            (`x-arango-trx-id` header). The header set when creating the transaction decides
            about dirty reads for the entire transaction, not the individual read operations.
          schema:
            type: boolean
        - name: x-arango-trx-id
          in: header
          required: false
          description: |
            To make this operation a part of a Stream Transaction, set this header to the
            transaction ID returned by the `POST /_api/transaction/begin` call.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - query
              properties:
                # Purposefully undocumented:
                #   forceOneShardAttributeValue
                query:
                  description: |
                    The AQL query string to execute.
                  type: string
                count:
                  description: |
                    Whether the number of documents in the result set should be returned in
                    the `count` attribute of the result.
                    Calculating this count might have a performance impact for some queries
                    in the future, so this option is turned off by default and `count`
                    is only returned when requested.
                  type: boolean
                  default: false
                batchSize:
                  description: |
                    The maximum number of result documents to be transferred from
                    the server to the client in one roundtrip. If this attribute is
                    not set, a server-controlled default value will be used. A `batchSize` value of
                    `0` is disallowed.
                  type: integer
                  default: 1000
                ttl:
                  description: |
                    The time-to-live for the cursor (in seconds). If the result set is small enough
                    (less than or equal to `batchSize`) then results are returned right away.
                    Otherwise they are stored in memory and will be accessible via the cursor with
                    respect to the `ttl`. The cursor will be removed on the server automatically
                    after the specified amount of time. This is useful to ensure garbage collection
                    of cursors that are not fully fetched by clients.

                    The time-to-live is renewed upon every access to the cursor.

                    Default: Controlled by the `--query.registry-ttl` startup option.
                    If not set, the defaults are 30 seconds for single servers and 600 seconds for
                    Coordinators of a cluster deployment.
                  type: integer
                memoryLimit:
                  description: |
                    The maximum amount of memory (in bytes) that the query is allowed to
                    use. If set, then the query fails with error "resource limit exceeded" in
                    case it allocates too much memory. A value of `0` indicates that there is
                    no memory limit, but the `--query.global-memory-limit` startup option
                    may still limit it.

                    Default: You can configure a default per-query memory limit with the
                    `--query.memory-limit` startup option. You can only increase
                    this default memory limit if `--query.memory-limit-override`
                    is enabled.
                  type: integer
                bindVars:
                  description: |
                    An object with key/value pairs representing the bind parameters.
                    For a bind variable `@var` in the query, specify the value using an attribute
                    with the name `var`. For a collection bind variable `@@coll`, use `@coll` as the
                    attribute name. For example: `"bindVars": { "var": 42, "@coll": "products" }`.
                  type: object
                options:
                  description: |
                    key/value object with extra options for the query.
                  type: object
                  properties:
                    fullCount:
                      description: |
                        If set to `true` and the query contains a `LIMIT` clause, then the
                        result will have an `extra` attribute with the sub-attributes `stats`
                        and `fullCount`, `{ ... , "extra": { "stats": { "fullCount": 123 } } }`.
                        The `fullCount` attribute will contain the number of documents in the result before the
                        last top-level LIMIT in the query was applied. It can be used to count the number of
                        documents that match certain filter criteria, but only return a subset of them, in one go.
                        It is thus similar to MySQL's *SQL_CALC_FOUND_ROWS* hint. Note that setting the option
                        will disable a few LIMIT optimizations and may lead to more documents being processed,
                        and thus make queries run longer. Note that the `fullCount` attribute may only
                        be present in the result if the query has a top-level LIMIT clause and the LIMIT
                        clause is actually used in the query.
                      type: boolean
                      default: false
                    fillBlockCache:
                      description: |
                        If set to `true`, then the query stores the data it
                        reads via the RocksDB storage engine in the RocksDB block cache. This is usually
                        the desired behavior. The option can be set to `false` for queries that are
                        known to either read a lot of data which would thrash the block cache, or for queries
                        that read data which are known to be outside of the hot set. By setting the option
                        to `false`, data read by the query does not make it into the RocksDB block cache if
                        not already in there, thus leaving more room for the actual hot set.
                      type: boolean
                      default: true
                    maxNumberOfPlans:
                      description: |
                        Limits the maximum number of plans that are created by the AQL query optimizer.

                        Default: Controlled by the `--query.optimizer-max-plans` startup option.
                      type: integer
                    maxNodesPerCallstack:
                      description: |
                        The number of execution nodes in the query plan after that stack splitting is
                        performed to avoid a potential stack overflow.

                        This option is only useful for testing and debugging and normally does not need
                        any adjustment.

                        Default: Controlled by the `--query.max-nodes-per-callstack` startup option.
                      type: integer
                    maxWarningCount:
                      description: |
                        Limits the number of warnings a query can return.
                        You can increased or decreased the number with this option.
                      type: integer
                      default: 10
                    failOnWarning:
                      description: |
                        If set to `true`, the query throws an exception and aborts instead of producing
                        a warning. You should use this option during development to catch potential issues
                        early. When the attribute is set to `false`, warnings are not propagated to
                        exceptions and are returned with the query result.

                        Default: Controlled by the `--query.fail-on-warning` startup option,
                        so you don't need to set it on a per-query basis.
                      type: boolean
                    allowRetry:
                      description: |
                        Set this option to `true` to make it possible to retry
                        fetching the latest batch from a cursor.

                        If retrieving a result batch fails because of a connection issue, you can ask
                        for that batch again using the `POST /_api/cursor/<cursor-id>/<batch-id>`
                        endpoint. The first batch has an ID of `1` and the value is incremented by 1
                        with every batch. Every result response except the last one also includes a
                        `nextBatchId` attribute, indicating the ID of the batch after the current.
                        You can remember and use this batch ID should retrieving the next batch fail.

                        You can only request the latest batch again (or the next batch).
                        Earlier batches are not kept on the server-side.
                        Requesting a batch again does not advance the cursor.

                        You can also call this endpoint with the next batch identifier, i.e. the value
                        returned in the `nextBatchId` attribute of a previous request. This advances the
                        cursor and returns the results of the next batch. This is only supported if there
                        are more results in the cursor (i.e. `hasMore` is `true` in the latest batch).

                        From v3.11.1 onward, you may use the `POST /_api/cursor/<cursor-id>/<batch-id>`
                        endpoint even if the `allowRetry` attribute is `false` to fetch the next batch,
                        but you cannot request a batch again unless you set it to `true`.

                        To allow refetching of the very last batch of the query, the server cannot
                        automatically delete the cursor. After the first attempt of fetching the last
                        batch, the server would normally delete the cursor to free up resources. As you
                        might need to reattempt the fetch, it needs to keep the final batch when the
                        `allowRetry` option is enabled. Once you successfully received the last batch,
                        you should call the `DELETE /_api/cursor/<cursor-id>` endpoint so that the
                        server doesn't unnecessarily keep the batch until the cursor times out
                        (`ttl` query option).
                      type: boolean
                      default: false
                    stream:
                      description: |
                        Can be enabled to execute the query lazily. If set to `true`, then the query is
                        executed as long as necessary to produce up to `batchSize` results. These
                        results are returned immediately and the query is suspended until the client
                        asks for the next batch (if there are more results). Depending on the query
                        this can mean that the first results will be available much faster and that
                        less memory is needed because the server only needs to store a subset of
                        results at a time. Read-only queries can benefit the most, unless `SORT`
                        without index or `COLLECT` are involved that make it necessary to process all
                        documents before a partial result can be returned. It is advisable to only use
                        this option for queries without exclusive locks.

                        Remarks:
                        - The query will hold resources until it ends (such as RocksDB snapshots, which
                          prevents compaction to some degree). Writes will be in memory until the query
                          is committed.
                        - If existing documents are modified, then write locks are held on these
                          documents and other queries trying to modify the same documents will fail
                          because of this conflict.
                        - A streaming query may fail late because of a conflict or for other reasons
                          after some batches were already returned successfully, possibly rendering the
                          results up to that point meaningless.
                        - The query options `cache`, `count` and `fullCount` are not supported for
                          streaming queries.
                        - Query statistics, profiling data and warnings are delivered as part of the
                          last batch.

                        If the `stream` option is `false`, then the complete result of the
                        query is calculated before any of it is returned to the client. The server
                        stores the full result in memory (on the contacted Coordinator if in a cluster).
                        All other resources are freed immediately (locks, RocksDB snapshots). The query
                        will fail before it returns results in case of a conflict.
                      type: boolean
                      default: false
                    cache:
                      description: |
                        Whether the [AQL query results cache](../../../aql/execution-and-performance/caching-query-results.md)
                        shall be used for adding as well as for retrieving results.

                        If the query cache mode is set to `demand` and you set the `cache` query option
                        to `true` for a query, then its query result is cached if it's eligible for
                        caching. If the query cache mode is set to `on`, query results are automatically
                        cached if they are eligible for caching unless you set the `cache` option to `false`.

                        If you set the `cache` option to `false`, then any query cache lookup is skipped
                        for the query. If you set it to `true`, the query cache is checked for a cached result
                        **if** the query cache mode is either set to `on` or `demand`.

                        Default: Controlled by the `--query.cache-mode` startup option.
                      type: boolean
                    usePlanCache:
                      description: |
                        Set this option to `true` to utilize a cached query plan or add the execution plan
                        of this query to the cache if it's not in the cache yet. Otherwise, the plan cache
                        is bypassed (introduced in v3.12.4).
                        
                        Query plan caching can reduce the total time for processing queries by avoiding
                        to parse, plan, and optimize queries over and over again that effectively have
                        the same execution plan with at most some changes to bind parameter values.
                        
                        An error is raised if a query doesn't meet the requirements for plan caching.
                        See [Cache eligibility](../../../aql/execution-and-performance/caching-query-plans.md#cache-eligibility)
                        for details.
                      type: boolean
                      default: false
                    spillOverThresholdMemoryUsage:
                      description: |
                        This option allows queries to store intermediate and final results temporarily
                        on disk if the amount of memory used (in bytes) exceeds the specified value.
                        This is used for decreasing the memory usage during the query execution.

                        This option only has an effect on queries that use the `SORT` operation but
                        without a `LIMIT`, and if you enable the spillover feature by setting a path
                        for the directory to store the temporary data in with the
                        `--temp.intermediate-results-path` startup option.

                        Default: 128 MiB, respectively the value of the
                        `--temp.intermediate-results-spillover-threshold-memory-usage`
                        startup option.

                        {{</* info */>}}
                        Spilling data from RAM onto disk is an experimental feature and is turned off
                        by default. The query results are still built up entirely in RAM on Coordinators
                        and single servers for non-streaming queries. To avoid the buildup of
                        the entire query result in RAM, use a streaming query (see the `stream` option).
                        {{</* /info */>}}
                      type: integer
                    spillOverThresholdNumRows:
                      description: |
                        This option allows queries to store intermediate and final results temporarily
                        on disk if the number of rows produced by the query exceeds the specified value.
                        This is used for decreasing the memory usage during the query execution. In a
                        query that iterates over a collection that contains documents, each row is a
                        document, and in a query that iterates over temporary values
                        (i.e. `FOR i IN 1..100`), each row is one of such temporary values.

                        This option only has an effect on queries that use the `SORT` operation but
                        without a `LIMIT`, and if you enable the spillover feature by setting a path
                        for the directory to store the temporary data in with the
                        `--temp.intermediate-results-path` startup option.

                        Default: 5 million rows, respectively the value of the
                        `--temp.intermediate-results-spillover-threshold-num-rows`
                        startup option.

                        {{</* info */>}}
                        Spilling data from RAM onto disk is an experimental feature and is turned off
                        by default. The query results are still built up entirely in RAM on Coordinators
                        and single servers for non-streaming queries. To avoid the buildup of
                        the entire query result in RAM, use a streaming query (see the `stream` option).
                        {{</* /info */>}}
                      type: integer
                    optimizer:
                      description: |
                        Options related to the query optimizer.
                      type: object
                      properties:
                        rules:
                          description: |
                            A list of optimizer rules, telling the optimizer to
                            include or exclude specific rules. See the
                            [List of optimizer rules](../../../aql/execution-and-performance/query-optimization.md#list-of-optimizer-rules).

                            To disable a rule, prefix its name with `-`. To enable a rule,
                            prefix it with `+`. There is also a pseudo-rule `all` that
                            matches all optimizer rules. `-all` disables all rules.
                          type: array
                          items:
                            type: string
                    profile:
                      description: |
                        If set to `true` or `1`, then the additional query profiling information is returned
                        in the `profile` sub-attribute of the `extra` return attribute, unless the query result
                        is served from the query results cache. If set to `2`, the query includes execution stats
                        per query plan node in `stats.nodes` sub-attribute of the `extra` return attribute.
                        Additionally, the query plan is returned in the `extra.plan` sub-attribute.
                      type: integer
                      default: 0
                    satelliteSyncWait:
                      description: |
                        How long a DB-Server has time (in seconds) to bring the SatelliteCollections
                        involved in the query into sync. When the maximal time is reached, the query is stopped.
                      type: number
                      default: 60.0
                    maxRuntime:
                      description: |
                        The query has to be executed within the given runtime or it is killed.
                        The value is specified in seconds. A value of `0.0` means no timeout.
                        
                        Default: Controlled by the `--query.max-runtime` startup option.
                      type: number
                    maxDNFConditionMembers:
                      description: |
                        A threshold for the maximum number of `OR` sub-nodes in the internal
                        representation of an AQL `FILTER` condition.

                        Yon can use this option to limit the computation time and memory usage when
                        converting complex AQL `FILTER` conditions into the internal DNF
                        (disjunctive normal form) format. `FILTER` conditions with a lot of logical
                        branches (`AND`, `OR`, `NOT`) can take a large amount of processing time and
                        memory. This query option limits the computation time and memory usage for
                        such conditions.

                        Once the threshold value is reached during the DNF conversion of a `FILTER`
                        condition, the conversion is aborted, and the query continues with a simplified
                        internal representation of the condition, which **cannot be used for index lookups**.

                        Default: Controlled by the `--query.max-dnf-condition-members` startup option
                        to set the threshold globally instead of per query.
                      type: integer
                    maxTransactionSize:
                      description: |
                        The transaction size limit in bytes.

                        Default: Controlled by the `--rocksdb.max-transaction-size` startup option.
                      type: integer
                    intermediateCommitSize:
                      description: |
                        The maximum total size of operations after which an intermediate commit is performed
                        automatically.

                        Default: Controlled by `--rocksdb.intermediate-commit-size` startup option.
                      type: integer
                    intermediateCommitCount:
                      description: |
                        The maximum number of operations after which an intermediate commit is performed
                        automatically.

                        Default: Controlled by the `--rocksdb.intermediate-commit-count` startup option.
                      type: integer
                    skipInaccessibleCollections:
                      description: |
                        Let AQL queries (especially graph traversals) treat collections to which a user
                        has no access rights for as if these collections are empty. Instead of returning a
                        forbidden access error, your queries execute normally. This is intended to help
                        with certain use-cases: A graph contains several collections and different users
                        execute AQL queries on that graph. You can naturally limit the accessible
                        results by changing the access rights of users on collections.
                      type: boolean
                      default: false
                    allowDirtyReads:
                      description: |
                        If you set this option to `true` and execute the query against a cluster
                        deployment, then the Coordinator is allowed to read from any shard replica and
                        not only from the leader.

                        You may observe data inconsistencies (dirty reads) when reading from followers,
                        namely obsolete revisions of documents because changes have not yet been
                        replicated to the follower, as well as changes to documents before they are
                        officially committed on the leader.

                        The option is ignored if this operation is part of a Stream Transaction
                        (`x-arango-trx-id` header). The `x-arango-allow-dirty-read` header set
                        when creating the transaction decides about dirty reads for the entire
                        transaction, not the individual read operations.
                      type: boolean
                      default: false
      responses:
        '201':
          description: |
            is returned if the result set can be created by the server.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - hasMore
                  - cached
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
                    example: 201
                  result:
                    description: |
                      An array of result documents for the current batch
                      (might be empty if the query has no results).
                    type: array
                  hasMore:
                    description: |
                      A boolean indicator whether there are more results
                      available for the cursor on the server.

                      Note that even if `hasMore` returns `true`, the next call might still return no
                      documents. Once `hasMore` is `false`, the cursor is exhausted and the client
                      can stop asking for more results.
                    type: boolean
                  count:
                    description: |
                      The total number of result documents available (only
                      available if the query was executed with the `count` attribute set).
                    type: integer
                  id:
                    description: |
                      The ID of the cursor for fetching more result batches.
                    type: string
                  nextBatchId:
                    description: |
                      Only set if the `allowRetry` query option is enabled in v3.11.0.
                      From v3.11.1 onward, this attribute is always set, except in the last batch.

                      The ID of the batch after the current one. The first batch has an ID of `1` and
                      the value is incremented by 1 with every batch. You can remember and use this
                      batch ID should retrieving the next batch fail. Use the
                      `POST /_api/cursor/<cursor-id>/<batch-id>` endpoint to ask for the batch again.
                      You can also request the next batch.
                    type: string
                  extra:
                    description: |
                      An optional JSON object with extra information about the query result.

                      Only delivered as part of the first batch, or the last batch in case of a cursor
                      with the `stream` option enabled.
                    type: object
                    required:
                      - warnings
                      - stats
                    properties:
                      warnings:
                        description: |
                          A list of query warnings.
                        type: array
                        items:
                          type: object
                          required:
                            - code
                            - message
                          properties:
                            code:
                              description: |
                                An error code.
                              type: integer
                            message:
                              description: |
                                A description of the problem.
                              type: string
                      stats:
                        description: |
                          An object with query statistics.
                        type: object
                        required:
                          - writesExecuted
                          - writesIgnored
                          - documentLookups
                          - seeks
                          - scannedFull
                          - scannedIndex
                          - cursorsCreated
                          - cursorsRearmed
                          - cacheHits
                          - cacheMisses
                          - filtered
                          - httpRequests
                          - executionTime
                          - peakMemoryUsage
                          - intermediateCommits
                        properties:
                          writesExecuted:
                            description: |
                              The total number of data-modification operations successfully executed.
                            type: integer
                          writesIgnored:
                            description: |
                              The total number of data-modification operations that were unsuccessful,
                              but have been ignored because of the `ignoreErrors` query option.
                            type: integer
                          documentLookups:
                            description: |
                              The number of real document lookups caused by late materialization
                              as well as `IndexNode`s that had to load document attributes not covered
                              by the index. This is how many documents had to be fetched from storage after
                              an index scan that initially covered the attribute access for these documents.
                            type: integer
                          seeks:
                            description: |
                              The number of seek calls done by RocksDB iterators for merge joins
                              (`JoinNode` in the execution plan).
                            type: integer
                          scannedFull:
                            description: |
                              The total number of documents iterated over when scanning a collection
                              without an index. Documents scanned by subqueries are included in the result, but
                              operations triggered by built-in or user-defined AQL functions are not.
                            type: integer
                          scannedIndex:
                            description: |
                              The total number of documents iterated over when scanning a collection using
                              an index. Documents scanned by subqueries are included in the result, but operations
                              triggered by built-in or user-defined AQL functions are not.
                            type: integer
                          cursorsCreated:
                            description: |
                              The total number of cursor objects created during query execution. Cursor
                              objects are created for index lookups.
                            type: integer
                          cursorsRearmed:
                            description: |
                              The total number of times an existing cursor object was repurposed.
                              Repurposing an existing cursor object is normally more efficient compared to destroying an
                              existing cursor object and creating a new one from scratch.
                            type: integer
                          cacheHits:
                            description: |
                              The total number of index entries read from in-memory caches for indexes
                              of type edge or persistent. This value is only non-zero when reading from indexes
                              that have an in-memory cache enabled, and when the query allows using the in-memory
                              cache (i.e. using equality lookups on all index attributes).
                            type: integer
                          cacheMisses:
                            description: |
                              The total number of cache read attempts for index entries that could not
                              be served from in-memory caches for indexes of type edge or persistent. This value
                              is only non-zero when reading from indexes that have an in-memory cache enabled, the
                              query allows using the in-memory cache (i.e. using equality lookups on all index attributes)
                              and the looked up values are not present in the cache.
                            type: integer
                          filtered:
                            description: |
                              The total number of documents removed after executing a filter condition
                              in a `FilterNode` or another node that post-filters data. Note that nodes of the
                              `IndexNode` type can also filter documents by selecting only the required index range
                              from a collection, and the `filtered` value only indicates how much filtering was done by a
                              post filter in the `IndexNode` itself or following `FilterNode` nodes.
                              Nodes of the `EnumerateCollectionNode` and `TraversalNode` types can also apply
                              filter conditions and can report the number of filtered documents.
                            type: integer
                          httpRequests:
                            description: |
                              The total number of cluster-internal HTTP requests performed.
                            type: integer
                          fullCount:
                            description: |
                              The total number of documents that matched the search condition if the query's
                              final top-level `LIMIT` operation were not present.
                              This attribute may only be returned if the `fullCount` option was set when starting the
                              query and only contains a sensible value if the query contains a `LIMIT` operation on
                              the top level.
                            type: integer
                          executionTime:
                            description: |
                              The query execution time (wall-clock time) in seconds.
                            type: number
                          peakMemoryUsage:
                            description: |
                              The maximum memory usage of the query while it was running. In a cluster,
                              the memory accounting is done per shard, and the memory usage reported is the peak
                              memory usage value from the individual shards.
                              Note that to keep things lightweight, the per-query memory usage is tracked on a relatively
                              high level, not including any memory allocator overhead nor any memory used for temporary
                              results calculations (e.g. memory allocated/deallocated inside AQL expressions and function
                              calls).
                            type: integer
                          intermediateCommits:
                            description: |
                              The number of intermediate commits performed by the query. This is only non-zero
                              for write queries, and only for queries that reached either the `intermediateCommitSize`
                              or `intermediateCommitCount` thresholds. Note: in a cluster, intermediate commits can happen
                              on each participating DB-Server.
                            type: integer
                          nodes:
                            description: |
                              When the query is executed with the `profile` option set to at least `2`,
                              then this attribute contains runtime statistics per query execution node.
                              For a human readable output, you can execute
                              `db._profileQuery(<query>, <bind-vars>)` in arangosh.
                            type: array
                            items:
                              type: object
                              required:
                                - id
                                - calls
                                - items
                                - runtime
                              properties:
                                id:
                                  description: |
                                    The execution node ID to correlate the statistics with the `plan` returned in
                                    the `extra` attribute.
                                  type: integer
                                calls:
                                  description: |
                                    The number of calls to this node.
                                  type: integer
                                items:
                                  description: |
                                    The number of items returned by this node. Items are the temporary results
                                    returned at this stage.
                                  type: integer
                                runtime:
                                  description: |
                                    The execution time of this node in seconds.
                                  type: number
                      profile:
                        description: |
                          The duration of the different query execution phases in seconds.
                        type: object
                        required:
                          - initializing
                          - parsing
                          - optimizing ast
                          - loading collections
                          - instantiating plan
                          - optimizing plan
                          - instantiating executors
                          - executing
                          - finalizing
                        properties:
                          initializing:
                            description: ''
                            type: number
                          parsing:
                            description: ''
                            type: number
                          optimizing ast:
                            description: ''
                            type: number
                          loading collections:
                            description: ''
                            type: number
                          instantiating plan:
                            description: ''
                            type: number
                          optimizing plan:
                            description: ''
                            type: number
                          instantiating executors:
                            description: ''
                            type: number
                          executing:
                            description: ''
                            type: number
                          finalizing:
                            description: ''
                            type: number
                      plan:
                        description: |
                          The execution plan.
                        type: object
                        required:
                          - nodes
                          - rules
                          - collections
                          - variables
                          - estimatedCost
                          - estimatedNrItems
                          - isModificationQuery
                        properties:
                          nodes:
                            description: |
                              A nested list of the execution plan nodes.
                            type: array
                            items:
                              type: object
                          rules:
                            description: |
                              A list with the names of the applied optimizer rules.
                            type: array
                            items:
                              type: string
                          collections:
                            description: |
                              A list of the collections involved in the query. The list only includes the
                              collections that can statically be determined at query compile time.
                            type: array
                            items:
                              type: object
                              required:
                                - name
                                - type
                              properties:
                                name:
                                  description: |
                                    The collection name.
                                  type: string
                                type:
                                  description: |
                                    How the collection is used.
                                  type: string
                                  enum: [read, write, exclusive]
                          variables:
                            description: |
                              All of the query variables, including user-created and internal ones.
                            type: array
                            items:
                              type: object
                          estimatedCost:
                            description: |
                              The estimated cost of the query.
                            type: number
                          estimatedNrItems:
                            description: |
                              The estimated number of results.
                            type: integer
                          isModificationQuery:
                            description: |
                              Whether the query contains write operations.
                            type: boolean
                  cached:
                    description: |
                      A boolean flag indicating whether the query result was served
                      from the query results cache or not. If the query result is served from the query
                      cache, the `extra` attribute in the response does not contain the `stats`
                      and `profile` sub-attributes.
                    type: boolean
                  planCacheKey:
                    description: |
                      The key of the plan cache entry. This attribute is only
                      present if a cached query execution plan has been used.
                    type: string
        '400':
          description: |
            The JSON representation is malformed, the query specification is
            missing from the request, or the query is invalid.

            The body of the response contains a JSON object with additional error
            details.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.

                      If the query specification is complete, the server will process the query. If an
                      error occurs during query processing, the server will respond with *HTTP 400*.
                      Again, the body of the response will contain details about the error.
                    type: string
        '404':
          description: |
            A non-existing collection is accessed in the query.

            This error also occurs if you try to run this operation as part of a
            Stream Transaction but the transaction ID specified in the
            `x-arango-trx-id` header is unknown to the server.
        '405':
          description: |
            An unsupported HTTP method is used.
        '410':
          description: |
            A server which processes the query or the leader of a shard which is used
            in the query stops responding, but the connection has not been closed.

            This error also occurs if you try to run this operation as part of a
            Stream Transaction that has just been canceled or timed out.
        '503':
          description: |
            A server which processes the query or the leader of a shard which is used
            in the query is down, either for going through a restart, a failure, or
            connectivity issues.
      tags:
        - Queries
```

**Examples**

```curl
---
description: |-
  Execute a query and extract the result in a single go
name: RestCursorCreateCursorForLimitReturnSingle
---
var cn = "products";
db._drop(cn);
db._create(cn);

db.products.save({"hello1":"world1"});
db.products.save({"hello2":"world1"});

var url = "/_api/cursor";
var body = {
  query: "FOR p IN products LIMIT 2 RETURN p",
  count: true,
  batchSize: 2
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 201);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Execute a query and extract a part of the result
name: RestCursorCreateCursorForLimitReturn
---
var cn = "products";
db._drop(cn);
db._create(cn);

db.products.save({"hello1":"world1"});
db.products.save({"hello2":"world1"});
db.products.save({"hello3":"world1"});
db.products.save({"hello4":"world1"});
db.products.save({"hello5":"world1"});

var url = "/_api/cursor";
var body = {
  query: "FOR p IN products LIMIT 5 RETURN p",
  count: true,
  batchSize: 2
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 201);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Using the query option "fullCount"
name: RestCursorCreateCursorOption
---
var url = "/_api/cursor";
var body = {
  query: "FOR i IN 1..1000 FILTER i > 500 LIMIT 10 RETURN i",
  count: true,
  options: {
    fullCount: true
  }
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 201);

logJsonResponse(response);
```

```curl
---
description: |-
  Enabling and disabling optimizer rules
name: RestCursorOptimizerRules
---
var url = "/_api/cursor";
var body = {
  query: "FOR i IN 1..10 LET a = 1 LET b = 2 FILTER a + b == 3 RETURN i",
  count: true,
  options: {
    maxPlans: 1,
    optimizer: {
      rules: [ "-all", "+remove-unnecessary-filters" ]
    }
  }
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 201);

logJsonResponse(response);
```

```curl
---
description: |-
  Execute instrumented query and return result together with
  execution plan and profiling information
name: RestCursorProfileQuery
---
var url = "/_api/cursor";
var body = {
  query: "LET s = SLEEP(0.25) LET t = SLEEP(0.5) RETURN 1",
  count: true,
  options: {
    profile: 2
  }
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 201);

logJsonResponse(response);
```

```curl
---
description: |-
  Execute a data-modification query and retrieve the number of
  modified documents
name: RestCursorDeleteQuery
---
var cn = "products";
db._drop(cn);
db._create(cn);

db.products.save({"hello1":"world1"});
db.products.save({"hello2":"world1"});

var url = "/_api/cursor";
var body = {
  query: "FOR p IN products REMOVE p IN products"
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 201);
assert(response.parsedBody.extra.stats.writesExecuted === 2);
assert(response.parsedBody.extra.stats.writesIgnored === 0);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Execute a data-modification query with option `ignoreErrors`
name: RestCursorDeleteIgnore
---
var cn = "products";
db._drop(cn);
db._create(cn);

db.products.save({ _key: "foo" });

var url = "/_api/cursor";
var body = {
  query: "REMOVE 'bar' IN products OPTIONS { ignoreErrors: true }"
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 201);
assert(response.parsedBody.extra.stats.writesExecuted === 0);
assert(response.parsedBody.extra.stats.writesIgnored === 1);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  The following example appends a value to the array `arr` of the document
  with key `test` in the collection `documents`. The normal update behavior of the
  `UPDATE` operation is to replace the array attribute completely, but using the
  `PUSH()` function allows you to append to the array:
name: RestCursorModifyArray
---
var cn = "documents";
db._drop(cn);
db._create(cn);

db.documents.save({ _key: "test", arr: [1, 2, 3] });

var url = "/_api/cursor";
var body = {
  query: "FOR doc IN documents FILTER doc._key == @myKey UPDATE doc._key WITH { arr: PUSH(doc.arr, @value) } IN documents RETURN NEW",
  bindVars: { myKey: "test", value: 42 }
};

var response = logCurlRequest('POST', url, body);
assert(response.code === 201);
logJsonResponse(response);

db._drop(cn);
```

```curl
---
description: |-
  To set a memory limit for the query, the `memoryLimit` option can be passed to
  the server.

  The memory limit specifies the maximum number of bytes that the query is
  allowed to use. When a single AQL query reaches the specified limit value,
  the query is aborted with a *resource limit exceeded* exception. In a
  cluster, the memory accounting is done per server, so the limit value is
  effectively a memory limit per query per server.

  If no memory limit is specified, then the server default value (controlled by
  startup option `--query.memory-limit`) is used for restricting the maximum amount
  of memory the query can use. A memory limit value of `0` means that the maximum
  amount of memory for the query is not restricted.
name: RestCursorMemoryLimit
---
var url = "/_api/cursor";
var body = {
  query: "FOR i IN 1..100000 SORT i RETURN i",
  memoryLimit: 100000
}
var response = logCurlRequest('POST', url, body);
assert(response.code === 500);
logJsonResponse(response);
```

```curl
---
description: |-
  Bad query - Missing body
name: RestCursorCreateCursorMissingBody
---
var url = "/_api/cursor";

var response = logCurlRequest('POST', url, '');

assert(response.code === 400);

logJsonResponse(response);
```

```curl
---
description: |-
  Bad query - Unknown collection
name: RestCursorCreateCursorUnknownCollection
---
var url = "/_api/cursor";
var body = {
  query: "FOR u IN unknowncoll LIMIT 2 RETURN u",
  count: true,
  batchSize: 2
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 404);

logJsonResponse(response);
```

```curl
---
description: |-
  Bad query - Execute a data-modification query that attempts to remove a non-existing
  document
name: RestCursorDeleteQueryFail
---
var cn = "products";
db._drop(cn);
db._create(cn);

db.products.save({ _key: "bar" });

var url = "/_api/cursor";
var body = {
  query: "REMOVE 'foo' IN products"
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 404);

logJsonResponse(response);
db._drop(cn);
```

### Read the next batch from a cursor

```openapi
paths:
  /_db/{database-name}/_api/cursor/{cursor-identifier}:
    post:
      operationId: getNextAqlQueryCursorBatch
      description: |
        If the cursor is still alive, returns an object with the next query result batch.

        If the cursor is not fully consumed, the time-to-live for the cursor
        is renewed by this API call.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: cursor-identifier
          in: path
          required: true
          description: |
            The name of the cursor
          schema:
            type: string
      responses:
        '200':
          description: |
            Successfully fetched the batch.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - hasMore
                  - cached
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
                  result:
                    description: |
                      An array of result documents for the current batch
                      (might be empty if the query has no results).
                    type: array
                  hasMore:
                    description: |
                      A boolean indicator whether there are more results
                      available for the cursor on the server.

                      Note that even if `hasMore` returns `true`, the next call might still return no
                      documents. Once `hasMore` is `false`, the cursor is exhausted and the client
                      can stop asking for more results.
                    type: boolean
                  count:
                    description: |
                      The total number of result documents available (only
                      available if the query was executed with the `count` attribute set).
                    type: integer
                  id:
                    description: |
                      The ID of the cursor for fetching more result batches.
                    type: string
                  nextBatchId:
                    description: |
                      Only set if the `allowRetry` query option is enabled in v3.11.0.
                      From v3.11.1 onward, this attribute is always set, except in the last batch.

                      The ID of the batch after the current one. The first batch has an ID of `1` and
                      the value is incremented by 1 with every batch. You can remember and use this
                      batch ID should retrieving the next batch fail. Use the
                      `POST /_api/cursor/<cursor-id>/<batch-id>` endpoint to ask for the batch again.
                      You can also request the next batch.
                    type: string
                  extra:
                    description: |
                      An optional JSON object with extra information about the query result.

                      Only delivered as part of the first batch, or the last batch in case of a cursor
                      with the `stream` option enabled.
                    type: object
                    required:
                      - warnings
                      - stats
                    properties:
                      warnings:
                        description: |
                          A list of query warnings.
                        type: array
                        items:
                          type: object
                          required:
                            - code
                            - message
                          properties:
                            code:
                              description: |
                                An error code.
                              type: integer
                            message:
                              description: |
                                A description of the problem.
                              type: string
                      stats:
                        description: |
                          An object with query statistics.
                        type: object
                        required:
                          - writesExecuted
                          - writesIgnored
                          - documentLookups
                          - seeks
                          - scannedFull
                          - scannedIndex
                          - cursorsCreated
                          - cursorsRearmed
                          - cacheHits
                          - cacheMisses
                          - filtered
                          - httpRequests
                          - executionTime
                          - peakMemoryUsage
                          - intermediateCommits
                        properties:
                          writesExecuted:
                            description: |
                              The total number of data-modification operations successfully executed.
                            type: integer
                          writesIgnored:
                            description: |
                              The total number of data-modification operations that were unsuccessful,
                              but have been ignored because of the `ignoreErrors` query option.
                            type: integer
                          documentLookups:
                            description: |
                              The number of real document lookups caused by late materialization
                              as well as `IndexNode`s that had to load document attributes not covered
                              by the index. This is how many documents had to be fetched from storage after
                              an index scan that initially covered the attribute access for these documents.
                            type: integer
                          seeks:
                            description: |
                              The number of seek calls done by RocksDB iterators for merge joins
                              (`JoinNode` in the execution plan).
                            type: integer
                          scannedFull:
                            description: |
                              The total number of documents iterated over when scanning a collection
                              without an index. Documents scanned by subqueries are included in the result, but
                              operations triggered by built-in or user-defined AQL functions are not.
                            type: integer
                          scannedIndex:
                            description: |
                              The total number of documents iterated over when scanning a collection using
                              an index. Documents scanned by subqueries are included in the result, but operations
                              triggered by built-in or user-defined AQL functions are not.
                            type: integer
                          cursorsCreated:
                            description: |
                              The total number of cursor objects created during query execution. Cursor
                              objects are created for index lookups.
                            type: integer
                          cursorsRearmed:
                            description: |
                              The total number of times an existing cursor object was repurposed.
                              Repurposing an existing cursor object is normally more efficient compared to destroying an
                              existing cursor object and creating a new one from scratch.
                            type: integer
                          cacheHits:
                            description: |
                              The total number of index entries read from in-memory caches for indexes
                              of type edge or persistent. This value is only non-zero when reading from indexes
                              that have an in-memory cache enabled, and when the query allows using the in-memory
                              cache (i.e. using equality lookups on all index attributes).
                            type: integer
                          cacheMisses:
                            description: |
                              The total number of cache read attempts for index entries that could not
                              be served from in-memory caches for indexes of type edge or persistent. This value
                              is only non-zero when reading from indexes that have an in-memory cache enabled, the
                              query allows using the in-memory cache (i.e. using equality lookups on all index attributes)
                              and the looked up values are not present in the cache.
                            type: integer
                          filtered:
                            description: |
                              The total number of documents removed after executing a filter condition
                              in a `FilterNode` or another node that post-filters data. Note that nodes of the
                              `IndexNode` type can also filter documents by selecting only the required index range
                              from a collection, and the `filtered` value only indicates how much filtering was done by a
                              post filter in the `IndexNode` itself or following `FilterNode` nodes.
                              Nodes of the `EnumerateCollectionNode` and `TraversalNode` types can also apply
                              filter conditions and can report the number of filtered documents.
                            type: integer
                          httpRequests:
                            description: |
                              The total number of cluster-internal HTTP requests performed.
                            type: integer
                          fullCount:
                            description: |
                              The total number of documents that matched the search condition if the query's
                              final top-level `LIMIT` operation were not present.
                              This attribute may only be returned if the `fullCount` option was set when starting the
                              query and only contains a sensible value if the query contains a `LIMIT` operation on
                              the top level.
                            type: integer
                          executionTime:
                            description: |
                              The query execution time (wall-clock time) in seconds.
                            type: number
                          peakMemoryUsage:
                            description: |
                              The maximum memory usage of the query while it was running. In a cluster,
                              the memory accounting is done per shard, and the memory usage reported is the peak
                              memory usage value from the individual shards.
                              Note that to keep things lightweight, the per-query memory usage is tracked on a relatively
                              high level, not including any memory allocator overhead nor any memory used for temporary
                              results calculations (e.g. memory allocated/deallocated inside AQL expressions and function
                              calls).
                            type: integer
                          intermediateCommits:
                            description: |
                              The number of intermediate commits performed by the query. This is only non-zero
                              for write queries, and only for queries that reached either the `intermediateCommitSize`
                              or `intermediateCommitCount` thresholds. Note: in a cluster, intermediate commits can happen
                              on each participating DB-Server.
                            type: integer
                          nodes:
                            description: |
                              When the query is executed with the `profile` option set to at least `2`,
                              then this attribute contains runtime statistics per query execution node.
                              For a human readable output, you can execute
                              `db._profileQuery(<query>, <bind-vars>)` in arangosh.
                            type: array
                            items:
                              type: object
                              required:
                                - id
                                - calls
                                - items
                                - runtime
                              properties:
                                id:
                                  description: |
                                    The execution node ID to correlate the statistics with the `plan` returned in
                                    the `extra` attribute.
                                  type: integer
                                calls:
                                  description: |
                                    The number of calls to this node.
                                  type: integer
                                items:
                                  description: |
                                    The number of items returned by this node. Items are the temporary results
                                    returned at this stage.
                                  type: integer
                                runtime:
                                  description: |
                                    The execution time of this node in seconds.
                                  type: number
                      profile:
                        description: |
                          The duration of the different query execution phases in seconds.
                        type: object
                        required:
                          - initializing
                          - parsing
                          - optimizing ast
                          - loading collections
                          - instantiating plan
                          - optimizing plan
                          - instantiating executors
                          - executing
                          - finalizing
                        properties:
                          initializing:
                            description: ''
                            type: number
                          parsing:
                            description: ''
                            type: number
                          optimizing ast:
                            description: ''
                            type: number
                          loading collections:
                            description: ''
                            type: number
                          instantiating plan:
                            description: ''
                            type: number
                          optimizing plan:
                            description: ''
                            type: number
                          instantiating executors:
                            description: ''
                            type: number
                          executing:
                            description: ''
                            type: number
                          finalizing:
                            description: ''
                            type: number
                      plan:
                        description: |
                          The execution plan.
                        type: object
                        required:
                          - nodes
                          - rules
                          - collections
                          - variables
                          - estimatedCost
                          - estimatedNrItems
                          - isModificationQuery
                        properties:
                          nodes:
                            description: |
                              A nested list of the execution plan nodes.
                            type: array
                            items:
                              type: object
                          rules:
                            description: |
                              A list with the names of the applied optimizer rules.
                            type: array
                            items:
                              type: string
                          collections:
                            description: |
                              A list of the collections involved in the query. The list only includes the
                              collections that can statically be determined at query compile time.
                            type: array
                            items:
                              type: object
                              required:
                                - name
                                - type
                              properties:
                                name:
                                  description: |
                                    The collection name.
                                  type: string
                                type:
                                  description: |
                                    How the collection is used.
                                  type: string
                                  enum: [read, write, exclusive]
                          variables:
                            description: |
                              All of the query variables, including user-created and internal ones.
                            type: array
                            items:
                              type: object
                          estimatedCost:
                            description: |
                              The estimated cost of the query.
                            type: number
                          estimatedNrItems:
                            description: |
                              The estimated number of results.
                            type: integer
                          isModificationQuery:
                            description: |
                              Whether the query contains write operations.
                            type: boolean
                  cached:
                    description: |
                      A boolean flag indicating whether the query result was served
                      from the query results cache or not. If the query result is served from the query
                      cache, the `extra` attribute in the response does not contain the `stats`
                      and `profile` sub-attributes.
                    type: boolean
                  planCacheKey:
                    description: |
                      The key of the plan cache entry. This attribute is only
                      present if a cached query execution plan has been used.
                    type: string
        '400':
          description: |
            The cursor identifier is missing.
        '404':
          description: |
            A cursor with the specified identifier cannot found.
        '410':
          description: |
            A server which processes the query or the leader of a shard which is
            used in the query stops responding, but the connection has not been closed.
        '503':
          description: |
            A server which processes the query or the leader of a shard which is used
            in the query is down, either for going through a restart, a failure,
            or connectivity issues.
      tags:
        - Queries
```

**Examples**

```curl
---
description: |-
  Valid request for next batch
name: RestCursorPostForLimitReturnCont
---
var url = "/_api/cursor";
var cn = "products";
db._drop(cn);
db._create(cn);

db.products.save({"hello1":"world1"});
db.products.save({"hello2":"world1"});
db.products.save({"hello3":"world1"});
db.products.save({"hello4":"world1"});
db.products.save({"hello5":"world1"});

var url = "/_api/cursor";
var body = {
  query: "FOR p IN products LIMIT 5 RETURN p",
  count: true,
  batchSize: 2
};
var response = logCurlRequest('POST', url, body);

response = logCurlRequest('POST', url + '/' + response.parsedBody.id, '');
assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Missing identifier
name: RestCursorPostMissingCursorIdentifier
---
var url = "/_api/cursor";

var response = logCurlRequest('POST', url, '');

assert(response.code === 400);

logJsonResponse(response);
```

```curl
---
description: |-
  Unknown identifier
name: RestCursorPostInvalidCursorIdentifier
---
var url = "/_api/cursor/123123";

var response = logCurlRequest('POST', url, '');

assert(response.code === 404);

logJsonResponse(response);
```

### Read a batch from the cursor again

```openapi
paths:
  /_db/{database-name}/_api/cursor/{cursor-identifier}/{batch-identifier}:
    post:
      operationId: getPreviousAqlQueryCursorBatch
      description: |
        You can use this endpoint to retry fetching the latest batch from a cursor.
        The endpoint requires the `allowRetry` query option to be enabled for the cursor.

        Calling this endpoint with the last returned batch identifier returns the
        query results for that same batch again. This does not advance the cursor.
        Client applications can use this to re-transfer a batch once more in case of
        transfer errors.

        You can also call this endpoint with the next batch identifier, i.e. the value
        returned in the `nextBatchId` attribute of a previous request. This advances the
        cursor and returns the results of the next batch.

        From v3.11.1 onward, you may use this endpoint even if the `allowRetry`
        attribute is `false` to fetch the next batch, but you cannot request a batch
        again unless you set it to `true`.

        Note that it is only supported to query the last returned batch identifier or
        the directly following batch identifier. The latter is only supported if there
        are more results in the cursor (i.e. `hasMore` is `true` in the latest batch).

        Note that when the last batch has been consumed successfully by a client
        application, it should explicitly delete the cursor to inform the server that it
        successfully received and processed the batch so that the server can free up
        resources.

        The time-to-live for the cursor is renewed by this API call.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: cursor-identifier
          in: path
          required: true
          description: |
            The ID of the cursor.
          schema:
            type: string
        - name: batch-identifier
          in: path
          required: true
          description: |
            The ID of the batch. The first batch has an ID of `1` and the value is
            incremented by 1 with every batch. You can only request the latest batch again
            (or the next batch). Earlier batches are not kept on the server-side.
          schema:
            type: string
      responses:
        '200':
          description: |
            The server responds with *HTTP 200* in case of success.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - hasMore
                  - cached
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
                  result:
                    description: |
                      An array of result documents for the current batch
                      (might be empty if the query has no results).
                    type: array
                  hasMore:
                    description: |
                      A boolean indicator whether there are more results
                      available for the cursor on the server.

                      Note that even if `hasMore` returns `true`, the next call might still return no
                      documents. Once `hasMore` is `false`, the cursor is exhausted and the client
                      can stop asking for more results.
                    type: boolean
                  count:
                    description: |
                      The total number of result documents available (only
                      available if the query was executed with the `count` attribute set).
                    type: integer
                  id:
                    description: |
                      The ID of the cursor for fetching more result batches.
                    type: string
                  nextBatchId:
                    description: |
                      Only set if the `allowRetry` query option is enabled in v3.11.0.
                      From v3.11.1 onward, this attribute is always set, except in the last batch.

                      The ID of the batch after the current one. The first batch has an ID of `1` and
                      the value is incremented by 1 with every batch. You can remember and use this
                      batch ID should retrieving the next batch fail. Use the
                      `POST /_api/cursor/<cursor-id>/<batch-id>` endpoint to ask for the batch again.
                      You can also request the next batch.
                    type: string
                  extra:
                    description: |
                      An optional JSON object with extra information about the query result.

                      Only delivered as part of the first batch, or the last batch in case of a cursor
                      with the `stream` option enabled.
                    type: object
                    required:
                      - warnings
                      - stats
                    properties:
                      warnings:
                        description: |
                          A list of query warnings.
                        type: array
                        items:
                          type: object
                          required:
                            - code
                            - message
                          properties:
                            code:
                              description: |
                                An error code.
                              type: integer
                            message:
                              description: |
                                A description of the problem.
                              type: string
                      stats:
                        description: |
                          An object with query statistics.
                        type: object
                        required:
                          - writesExecuted
                          - writesIgnored
                          - documentLookups
                          - seeks
                          - scannedFull
                          - scannedIndex
                          - cursorsCreated
                          - cursorsRearmed
                          - cacheHits
                          - cacheMisses
                          - filtered
                          - httpRequests
                          - executionTime
                          - peakMemoryUsage
                          - intermediateCommits
                        properties:
                          writesExecuted:
                            description: |
                              The total number of data-modification operations successfully executed.
                            type: integer
                          writesIgnored:
                            description: |
                              The total number of data-modification operations that were unsuccessful,
                              but have been ignored because of the `ignoreErrors` query option.
                            type: integer
                          documentLookups:
                            description: |
                              The number of real document lookups caused by late materialization
                              as well as `IndexNode`s that had to load document attributes not covered
                              by the index. This is how many documents had to be fetched from storage after
                              an index scan that initially covered the attribute access for these documents.
                            type: integer
                          seeks:
                            description: |
                              The number of seek calls done by RocksDB iterators for merge joins
                              (`JoinNode` in the execution plan).
                            type: integer
                          scannedFull:
                            description: |
                              The total number of documents iterated over when scanning a collection
                              without an index. Documents scanned by subqueries are included in the result, but
                              operations triggered by built-in or user-defined AQL functions are not.
                            type: integer
                          scannedIndex:
                            description: |
                              The total number of documents iterated over when scanning a collection using
                              an index. Documents scanned by subqueries are included in the result, but operations
                              triggered by built-in or user-defined AQL functions are not.
                            type: integer
                          cursorsCreated:
                            description: |
                              The total number of cursor objects created during query execution. Cursor
                              objects are created for index lookups.
                            type: integer
                          cursorsRearmed:
                            description: |
                              The total number of times an existing cursor object was repurposed.
                              Repurposing an existing cursor object is normally more efficient compared to destroying an
                              existing cursor object and creating a new one from scratch.
                            type: integer
                          cacheHits:
                            description: |
                              The total number of index entries read from in-memory caches for indexes
                              of type edge or persistent. This value is only non-zero when reading from indexes
                              that have an in-memory cache enabled, and when the query allows using the in-memory
                              cache (i.e. using equality lookups on all index attributes).
                            type: integer
                          cacheMisses:
                            description: |
                              The total number of cache read attempts for index entries that could not
                              be served from in-memory caches for indexes of type edge or persistent. This value
                              is only non-zero when reading from indexes that have an in-memory cache enabled, the
                              query allows using the in-memory cache (i.e. using equality lookups on all index attributes)
                              and the looked up values are not present in the cache.
                            type: integer
                          filtered:
                            description: |
                              The total number of documents removed after executing a filter condition
                              in a `FilterNode` or another node that post-filters data. Note that nodes of the
                              `IndexNode` type can also filter documents by selecting only the required index range
                              from a collection, and the `filtered` value only indicates how much filtering was done by a
                              post filter in the `IndexNode` itself or following `FilterNode` nodes.
                              Nodes of the `EnumerateCollectionNode` and `TraversalNode` types can also apply
                              filter conditions and can report the number of filtered documents.
                            type: integer
                          httpRequests:
                            description: |
                              The total number of cluster-internal HTTP requests performed.
                            type: integer
                          fullCount:
                            description: |
                              The total number of documents that matched the search condition if the query's
                              final top-level `LIMIT` operation were not present.
                              This attribute may only be returned if the `fullCount` option was set when starting the
                              query and only contains a sensible value if the query contains a `LIMIT` operation on
                              the top level.
                            type: integer
                          executionTime:
                            description: |
                              The query execution time (wall-clock time) in seconds.
                            type: number
                          peakMemoryUsage:
                            description: |
                              The maximum memory usage of the query while it was running. In a cluster,
                              the memory accounting is done per shard, and the memory usage reported is the peak
                              memory usage value from the individual shards.
                              Note that to keep things lightweight, the per-query memory usage is tracked on a relatively
                              high level, not including any memory allocator overhead nor any memory used for temporary
                              results calculations (e.g. memory allocated/deallocated inside AQL expressions and function
                              calls).
                            type: integer
                          intermediateCommits:
                            description: |
                              The number of intermediate commits performed by the query. This is only non-zero
                              for write queries, and only for queries that reached either the `intermediateCommitSize`
                              or `intermediateCommitCount` thresholds. Note: in a cluster, intermediate commits can happen
                              on each participating DB-Server.
                            type: integer
                          nodes:
                            description: |
                              When the query is executed with the `profile` option set to at least `2`,
                              then this attribute contains runtime statistics per query execution node.
                              For a human readable output, you can execute
                              `db._profileQuery(<query>, <bind-vars>)` in arangosh.
                            type: array
                            items:
                              type: object
                              required:
                                - id
                                - calls
                                - items
                                - runtime
                              properties:
                                id:
                                  description: |
                                    The execution node ID to correlate the statistics with the `plan` returned in
                                    the `extra` attribute.
                                  type: integer
                                calls:
                                  description: |
                                    The number of calls to this node.
                                  type: integer
                                items:
                                  description: |
                                    The number of items returned by this node. Items are the temporary results
                                    returned at this stage.
                                  type: integer
                                runtime:
                                  description: |
                                    The execution time of this node in seconds.
                                  type: number
                      profile:
                        description: |
                          The duration of the different query execution phases in seconds.
                        type: object
                        required:
                          - initializing
                          - parsing
                          - optimizing ast
                          - loading collections
                          - instantiating plan
                          - optimizing plan
                          - instantiating executors
                          - executing
                          - finalizing
                        properties:
                          initializing:
                            description: ''
                            type: number
                          parsing:
                            description: ''
                            type: number
                          optimizing ast:
                            description: ''
                            type: number
                          loading collections:
                            description: ''
                            type: number
                          instantiating plan:
                            description: ''
                            type: number
                          optimizing plan:
                            description: ''
                            type: number
                          instantiating executors:
                            description: ''
                            type: number
                          executing:
                            description: ''
                            type: number
                          finalizing:
                            description: ''
                            type: number
                      plan:
                        description: |
                          The execution plan.
                        type: object
                        required:
                          - nodes
                          - rules
                          - collections
                          - variables
                          - estimatedCost
                          - estimatedNrItems
                          - isModificationQuery
                        properties:
                          nodes:
                            description: |
                              A nested list of the execution plan nodes.
                            type: array
                            items:
                              type: object
                          rules:
                            description: |
                              A list with the names of the applied optimizer rules.
                            type: array
                            items:
                              type: string
                          collections:
                            description: |
                              A list of the collections involved in the query. The list only includes the
                              collections that can statically be determined at query compile time.
                            type: array
                            items:
                              type: object
                              required:
                                - name
                                - type
                              properties:
                                name:
                                  description: |
                                    The collection name.
                                  type: string
                                type:
                                  description: |
                                    How the collection is used.
                                  type: string
                                  enum: [read, write, exclusive]
                          variables:
                            description: |
                              All of the query variables, including user-created and internal ones.
                            type: array
                            items:
                              type: object
                          estimatedCost:
                            description: |
                              The estimated cost of the query.
                            type: number
                          estimatedNrItems:
                            description: |
                              The estimated number of results.
                            type: integer
                          isModificationQuery:
                            description: |
                              Whether the query contains write operations.
                            type: boolean
                  cached:
                    description: |
                      A boolean flag indicating whether the query result was served
                      from the query results cache or not. If the query result is served from the query
                      cache, the `extra` attribute in the response does not contain the `stats`
                      and `profile` sub-attributes.
                    type: boolean
                  planCacheKey:
                    description: |
                      The key of the plan cache entry. This attribute is only
                      present if a cached query execution plan has been used.
                    type: string
        '400':
          description: |
            The cursor and the batch identifier are missing.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A cursor with the specified identifier cannot be found, or the requested
            batch isn't available.
        '410':
          description: |
            The server responds with *HTTP 410* if a server which processes the query
            or is the leader for a shard which is used in the query stops responding, but
            the connection has not been closed.
        '503':
          description: |
            The server responds with *HTTP 503* if a server which processes the query
            or is the leader for a shard which is used in the query is down, either for
            going through a restart, a failure or connectivity issues.
      tags:
        - Queries
```

**Examples**

```curl
---
description: |-
  Request the second batch (again):
name: RestCursorPostBatch
---
var url = "/_api/cursor";
var body = {
  query: "FOR i IN 1..5 RETURN i",
  count: true,
  batchSize: 2,
  options: {
    allowRetry: true
  }
};
var response = logCurlRequest('POST', url, body);
var secondBatchId = response.parsedBody.nextBatchId;
assert(response.code === 201);
logJsonResponse(response);

response = logCurlRequest('POST', url + '/' + response.parsedBody.id, '');
assert(response.code === 200);
logJsonResponse(response);

response = logCurlRequest('POST', url + '/' + response.parsedBody.id + '/' + secondBatchId, '');
assert(response.code === 200);
logJsonResponse(response);
```

### Delete a cursor

```openapi
paths:
  /_db/{database-name}/_api/cursor/{cursor-identifier}:
    delete:
      operationId: deleteAqlQueryCursor
      description: |
        Deletes the cursor and frees the resources associated with it.

        The cursor will automatically be destroyed on the server when the client has
        retrieved all documents from it. The client can also explicitly destroy the
        cursor at any earlier time using an HTTP DELETE request. The cursor identifier must
        be included as part of the URL.

        Note: the server will also destroy abandoned cursors automatically after a
        certain server-controlled timeout to avoid resource leakage.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: cursor-identifier
          in: path
          required: true
          description: |
            The identifier of the cursor
          schema:
            type: string
      responses:
        '202':
          description: |
            The server is aware of the cursor.
        '404':
          description: |
            The server is not aware of the cursor. This is also
            returned if a cursor is used after it has been destroyed.
      tags:
        - Queries
```

**Examples**

```curl
---
description: ''
name: RestCursorDelete
---
var url = "/_api/cursor";
var cn = "products";
db._drop(cn);
db._create(cn);

db.products.save({"hello1":"world1"});
db.products.save({"hello2":"world1"});
db.products.save({"hello3":"world1"});
db.products.save({"hello4":"world1"});
db.products.save({"hello5":"world1"});

var url = "/_api/cursor";
var body = {
  query: "FOR p IN products LIMIT 5 RETURN p",
  count: true,
  batchSize: 2
};
var response = logCurlRequest('POST', url, body);
logJsonResponse(response);
response = logCurlRequest('DELETE', url + '/' + response.parsedBody.id);
logJsonResponse(response);

assert(response.code === 202);
db._drop(cn);
```

## Track queries

You can track AQL queries by enabling query tracking. This allows you to list
all currently executing queries. You can also list slow queries and clear this
list.

### Get the AQL query tracking configuration

```openapi
paths:
  /_db/{database-name}/_api/query/properties:
    get:
      operationId: getAqlQueryTrackingProperties
      description: |
        Returns the current query tracking configuration. The configuration is a
        JSON object with the following properties:

        - `enabled`: if set to `true`, then queries will be tracked. If set to
          `false`, neither queries nor slow queries will be tracked.

        - `trackSlowQueries`: if set to `true`, then slow queries will be tracked
          in the list of slow queries if their runtime exceeds the value set in
          `slowQueryThreshold`. In order for slow queries to be tracked, the `enabled`
          property must also be set to `true`.

        - `trackBindVars`: if set to `true`, then bind variables used in queries will
          be tracked.

        - `maxSlowQueries`: the maximum number of slow queries to keep in the list
          of slow queries. If the list of slow queries is full, the oldest entry in
          it will be discarded when additional slow queries occur.

        - `slowQueryThreshold`: the threshold value for treating a query as slow. A
          query with a runtime greater or equal to this threshold value will be
          put into the list of slow queries when slow query tracking is enabled.
          The value for `slowQueryThreshold` is specified in seconds.

        - `maxQueryStringLength`: the maximum query string length to keep in the
          list of queries. Query strings can have arbitrary lengths, and this property
          can be used to save memory in case very long query strings are used. The
          value is specified in bytes.
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
            Is returned if properties were retrieved successfully.
        '400':
          description: |
            The request is malformed.
      tags:
        - Queries
```

### Update the AQL query tracking configuration

```openapi
paths:
  /_db/{database-name}/_api/query/properties:
    put:
      operationId: updateAqlQueryTrackingProperties
      description: |
        The properties need to be passed in the attribute `properties` in the body
        of the HTTP request. `properties` needs to be a JSON object.

        After the properties have been changed, the current set of properties will
        be returned in the HTTP response.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                enabled:
                  description: |
                    If set to `true`, then queries are tracked. If set to
                    `false`, neither regular queries nor slow queries are tracked.

                    Default: Controlled by the `--query.tracking` startup option.
                  type: boolean
                trackSlowQueries:
                  description: |
                    If set to `true`, then slow queries are tracked
                    in the list of slow queries if their runtime exceeds the value set in
                    `slowQueryThreshold`. In order for slow queries to be tracked, the `enabled`
                    property must also be set to `true`.

                    Default: Controlled by the `--query.tracking-slow-queries` startup option.
                  type: boolean
                trackBindVars:
                  description: |
                    If set to `true`, then the bind variables used in queries are tracked
                    along with queries.

                    Default: Controlled by the `--query.tracking-with-bindvars` startup option.
                  type: boolean
                maxSlowQueries:
                  description: |
                    The maximum number of slow queries to keep in the list
                    of slow queries. If the list of slow queries is full, the oldest entry
                    is discarded when additional slow queries occur.
                  type: integer
                  default: 64
                slowQueryThreshold:
                  description: |
                    The threshold value for treating a query as slow (in seconds).
                    A query with a runtime greater or equal to this threshold value is
                    put into the list of slow queries if slow query tracking is enabled.

                    Default: Controlled by the `--query.slow-threshold` startup option.
                  type: integer
                slowStreamingQueryThreshold:
                  description: |
                    The threshold value for treating a streaming query as slow (in seconds).
                    A query with `"stream"` set to `true` and a runtime greater or equal to this
                    threshold value is put into the list of slow queries if slow query tracking
                    is enabled.

                    Default: Controlled by the `--query.slow-streaming-threshold` startup option.
                  type: integer
                maxQueryStringLength:
                  description: |
                    The maximum query string length to keep in the list of queries.
                    Query strings can have arbitrary lengths, and this property
                    can be used to save memory in case very long query strings are used. The
                    value is specified in bytes.

                    You can disable the tracking of query strings with the
                    `--query.tracking-with-querystring` startup option.
                  type: integer
                  default: 4096
      responses:
        '200':
          description: |
            Is returned if the properties were changed successfully.
        '400':
          description: |
            The request is malformed.
      tags:
        - Queries
```

### List the running AQL queries

```openapi
paths:
  /_db/{database-name}/_api/query/current:
    get:
      operationId: listAqlQueries
      description: |
        Returns an array containing the AQL queries currently running in the selected
        database. Each query is a JSON object with the following attributes:

        - `id`: the query's id

        - `database`: the name of the database the query runs in

        - `user`: the name of the user that started the query

        - `query`: the query string (potentially truncated)

        - `bindVars`: the bind parameter values used by the query

        - `started`: the date and time when the query was started

        - `runTime`: the query's run time up to the point the list of queries was
          queried

        - `peakMemoryUsage`: the query's peak memory usage in bytes (in increments of 32KB)

        - `state`: the query's current execution state (as a string). One of:
          - `"initializing"`
          - `"parsing"`
          - `"optimizing ast"`
          - `"loading collections"`
          - `"instantiating plan"`
          - `"optimizing plan"`
          - `"instantiating executors"`
          - `"executing"`
          - `"finalizing"`
          - `"finished"`
          - `"killed"`
          - `"invalid"`

        - `stream`: whether or not the query uses a streaming cursor
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: all
          in: query
          required: false
          description: |
            If set to `true`, will return the currently running queries in all databases,
            not just the selected one.
            Using the parameter is only allowed in the `_system` database and with superuser
            privileges.
          schema:
            type: boolean
            default: false
      responses:
        '200':
          description: |
            Is returned when the list of queries can be retrieved successfully.
        '400':
          description: |
            The request is malformed.
        '403':
          description: |
            In case the `all` parameter is used but the request was made in a
            different database than `_system`, or by a non-privileged user.
      tags:
        - Queries
```

### List the slow AQL queries

```openapi
paths:
  /_db/{database-name}/_api/query/slow:
    get:
      operationId: listSlowAqlQueries
      description: |
        Returns an array containing the last AQL queries that are finished and
        have exceeded the slow query threshold in the selected database.
        The maximum amount of queries in the list can be controlled by setting
        the query tracking property `maxSlowQueries`. The threshold for treating
        a query as *slow* can be adjusted by setting the query tracking property
        `slowQueryThreshold`.

        Each query is a JSON object with the following attributes:

        - `id`: the query's id

        - `database`: the name of the database the query runs in

        - `user`: the name of the user that started the query

        - `query`: the query string (potentially truncated)

        - `bindVars`: the bind parameter values used by the query

        - `started`: the date and time when the query was started

        - `runTime`: the query's total run time

        - `peakMemoryUsage`: the query's peak memory usage in bytes (in increments of 32KB)

        - `state`: the query's current execution state (will always be "finished"
          for the list of slow queries)

        - `stream`: whether or not the query uses a streaming cursor
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: all
          in: query
          required: false
          description: |
            If set to `true`, will return the slow queries from all databases, not just
            the selected one.
            Using the parameter is only allowed in the `_system` database and with superuser
            privileges.
          schema:
            type: boolean
            default: false
      responses:
        '200':
          description: |
            Is returned when the list of queries can be retrieved successfully.
        '400':
          description: |
            The request is malformed.
        '403':
          description: |
            In case the `all` parameter is used but the request was made in a
            different database than `_system`, or by a non-privileged user.
      tags:
        - Queries
```

### Clear the list of slow AQL queries

```openapi
paths:
  /_db/{database-name}/_api/query/slow:
    delete:
      operationId: clearSlowAqlQueryList
      description: |
        Clears the list of slow AQL queries for the current database.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: all
          in: query
          required: false
          description: |
            If set to `true`, will clear the slow query history in all databases, not just
            the selected one.
            Using the parameter is only allowed in the `_system` database and with superuser
            privileges.
          schema:
            type: boolean
            default: false
      responses:
        '200':
          description: |
            The list of queries has been cleared successfully.
        '400':
          description: |
            The request is malformed.
      tags:
        - Queries
```

## Kill queries

Running AQL queries can be killed on the server. To kill a running query, its ID
(as returned for the query in the list of currently running queries) must be
specified. The kill flag of the query is then set, and the query is aborted as
soon as it reaches a cancelation point.

### Kill a running AQL query

```openapi
paths:
  /_db/{database-name}/_api/query/{query-id}:
    delete:
      operationId: deleteAqlQuery
      description: |
        Kills a running query in the currently selected database. The query will be
        terminated at the next cancelation point.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: query-id
          in: path
          required: true
          description: |
            The identifier of the query.
          schema:
            type: string
        - name: all
          in: query
          required: false
          description: |
            If set to `true`, attempt to kill the specified query in all databases,
            not just the selected one.
            Using the parameter is only allowed in the `_system` database and with superuser
            privileges.
          schema:
            type: boolean
            default: false
      responses:
        '200':
          description: |
            The query was still running when the kill request was executed and
            the query's kill flag has been set.
        '400':
          description: |
            The request is malformed.
        '403':
          description: |
            In case the `all` parameter is used but the request was made in a
            different database than `_system`, or by a non-privileged user.
        '404':
          description: |
            A query with the specified identifier cannot be found.
      tags:
        - Queries
```

## Explain and parse AQL queries

You can retrieve the execution plan for any valid AQL query, as well as
syntactically validate AQL queries. Both functionalities don't actually execute
the supplied AQL query, but only inspect it and return meta information about it.

You can also retrieve a list of all query optimizer rules and their properties.

### Explain an AQL query

```openapi
paths:
  /_db/{database-name}/_api/explain:
    post:
      operationId: explainAqlQuery
      description: |
        To explain how an AQL query would be executed on the server, the query string
        can be sent to the server via an HTTP POST request. The server will then validate
        the query and create an execution plan for it. The execution plan will be
        returned, but the query will not be executed.

        The execution plan that is returned by the server can be used to estimate the
        probable performance of the query. Though the actual performance will depend
        on many different factors, the execution plan normally can provide some rough
        estimates on the amount of work the server needs to do in order to actually run
        the query.

        By default, the explain operation will return the optimal plan as chosen by
        the query optimizer The optimal plan is the plan with the lowest total estimated
        cost. The plan will be returned in the attribute `plan` of the response object.
        If the option `allPlans` is specified in the request, the result will contain
        all plans created by the optimizer. The plans will then be returned in the
        attribute `plans`.

        The result will also contain an attribute `warnings`, which is an array of
        warnings that occurred during optimization or execution plan creation. Additionally,
        a `stats` attribute is contained in the result with some optimizer statistics.
        If `allPlans` is set to `false`, the result will contain an attribute `cacheable`
        that states whether the query results can be cached on the server if the query
        result cache were used. The `cacheable` attribute is not present when `allPlans`
        is set to `true`.

        Each plan in the result is a JSON object with the following attributes:
        - `nodes`: the array of execution nodes of the plan.

        - `estimatedCost`: the total estimated cost for the plan. If there are multiple
          plans, the optimizer will choose the plan with the lowest total cost.

        - `collections`: an array of collections used in the query

        - `rules`: an array of rules the optimizer applied.

        - `variables`: array of variables used in the query (note: this may contain
          internal variables created by the optimizer)
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - query
              properties:
                query:
                  description: |
                    the query which you want explained; If the query references any bind variables,
                    these must also be passed in the attribute `bindVars`. Additional
                    options for the query can be passed in the `options` attribute.
                  type: string
                bindVars:
                  description: |
                    An object with key/value pairs representing the bind parameters.
                    For a bind variable `@var` in the query, specify the value using an attribute
                    with the name `var`. For a collection bind variable `@@coll`, use `@coll` as the
                    attribute name. For example: `"bindVars": { "var": 42, "@coll": "products" }`.
                  type: object
                options:
                  description: |
                    Options for the query
                  type: object
                  properties:
                    # Purposefully undocumented:
                    #   verbosePlans
                    #   explainInternals
                    #   explainRegisters
                    allPlans:
                      description: |
                        If set to `true`, all possible execution plans are returned.
                        The default is `false`, meaning only the optimal plan is returned.
                      type: boolean
                      default: false
                    maxNumberOfPlans:
                      description: |
                        The maximum number of plans that the optimizer is allowed to
                        generate. Setting this attribute to a low value allows to put a
                        cap on the amount of work the optimizer does.

                        Default: Controlled by the `--query.optimizer-max-plans` startup option.
                      type: integer
                    fullCount:
                      description: |
                        Whether to calculate the total number of documents matching the
                        filter conditions as if the query's final top-level `LIMIT` operation
                        were not applied. This option generally leads to different
                        execution plans.
                      type: boolean
                      default: false
                    profile:
                      description: |
                        Whether to include additional query profiling information.
                        If set to `2`, the response includes the time it took to process
                        each optimizer rule under `stats.rules`.
                      type: integer
                      default: 0
                    maxNodesPerCallstack:
                      description: |
                        The number of execution nodes in the query plan after that stack splitting is
                        performed to avoid a potential stack overflow.

                        This option is only useful for testing and debugging and normally does not need
                        any adjustment.

                        Default: Controlled by the `--query.max-nodes-per-callstack` startup option.
                      type: integer
                    maxWarningCount:
                      description: |
                        Limits the number of warnings a query can return.
                        You can increased or decreased the number with this option.
                      type: integer
                      default: 10
                    failOnWarning:
                      description: |
                        If set to `true`, the query throws an exception and aborts instead of producing
                        a warning. You should use this option during development to catch potential issues
                        early. When the attribute is set to `false`, warnings are not propagated to
                        exceptions and are returned with the query result.

                        Default: Controlled by the `--query.fail-on-warning` startup option,
                        so you don't need to set it on a per-query basis.
                      type: boolean
                    optimizer:
                      description: |
                        Options related to the query optimizer.
                      type: object
                      properties:
                        rules:
                          description: |
                            A list of optimizer rules, telling the optimizer to
                            include or exclude specific rules. See the
                            [List of optimizer rules](../../../aql/execution-and-performance/query-optimization.md#list-of-optimizer-rules).

                            To disable a rule, prefix its name with `-`. To enable a rule,
                            prefix it with `+`. There is also a pseudo-rule `all` that
                            matches all optimizer rules. `-all` disables all rules.
                          type: array
                          items:
                            type: string
                    usePlanCache:
                      description: |
                        Set this option to `true` to utilize a cached query plan or add the execution plan
                        of this query to the cache if it's not in the cache yet. Otherwise, the plan cache
                        is bypassed (introduced in v3.12.4).
                        
                        Query plan caching can reduce the total time for processing queries by avoiding
                        to parse, plan, and optimize queries over and over again that effectively have
                        the same execution plan with at most some changes to bind parameter values.
                        
                        An error is raised if a query doesn't meet the requirements for plan caching.
                        See [Cache eligibility](../../../aql/execution-and-performance/caching-query-plans.md#cache-eligibility)
                        for details.
                      type: boolean
                      default: false
      responses:
        '200':
          description: |
            If the query is valid, the server will respond with *HTTP 200* and
            return the optimal execution plan in the `plan` attribute of the response.
            If option `allPlans` was set in the request, an array of plans will be returned
            in the `allPlans` attribute instead.
        '400':
          description: |
            The request is malformed or the query contains a parse error.
            The body of the response contains the error details embedded in a JSON object.
            Omitting bind variables if the query references any also results
            an error.
        '404':
          description: |
            A non-existing collection is accessed in the query.
      tags:
        - Queries
```

**Examples**

```curl
---
description: |-
  Valid query
name: RestExplainValid
---
var url = "/_api/explain";
var cn = "products";
db._drop(cn);
db._create(cn);
for (var i = 0; i < 10; ++i) { db.products.save({ id: i }); }
body = {
  query : "FOR p IN products RETURN p"
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  A plan with some optimizer rules applied
name: RestExplainOptimizerRules
---
var url = "/_api/explain";
var cn = "products";
db._drop(cn);
db._create(cn);
db.products.ensureIndex({ type: "persistent", fields: ["id"] });
for (var i = 0; i < 10; ++i) { db.products.save({ id: i }); }
body = {
  query : "FOR p IN products LET a = p.id FILTER a == 4 LET name = p.name SORT p.id LIMIT 1 RETURN name",
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Using some options
name: RestExplainOptions
---
var url = "/_api/explain";
var cn = "products";
db._drop(cn);
db._create(cn);
db.products.ensureIndex({ type: "persistent", fields: ["id"] });
for (var i = 0; i < 10; ++i) { db.products.save({ id: i }); }
body = {
  query : "FOR p IN products LET a = p.id FILTER a == 4 LET name = p.name SORT p.id LIMIT 1 RETURN name",
  options : {
    maxNumberOfPlans : 2,
    allPlans : true,
    optimizer : {
      rules: [ "-all", "+use-index-for-sort", "+use-index-range" ]
    }
  }
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Returning all plans
name: RestExplainAllPlans
---
var url = "/_api/explain";
var cn = "products";
db._drop(cn);
db._create(cn);
db.products.ensureIndex({ type: "persistent", fields: ["id"] });
body = {
  query : "FOR p IN products FILTER p.id == 25 RETURN p",
  options: {
    allPlans: true
  }
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  A query that produces a warning
name: RestExplainWarning
---
var url = "/_api/explain";
body = {
  query : "FOR i IN 1..10 RETURN 1 / 0"
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 200);

logJsonResponse(response);
```

```curl
---
description: |-
  Invalid query (missing bind parameter)
name: RestExplainInvalid
---
var url = "/_api/explain";
var cn = "products";
db._drop(cn);
db._create(cn);
body = {
  query : "FOR p IN products FILTER p.id == @id LIMIT 2 RETURN p.n"
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 400);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  The data returned in the **plan** attribute of the result contains one element per AQL top-level statement
  (i.e. `FOR`, `RETURN`, `FILTER` etc.). If the query optimizer removed some unnecessary statements,
  the result might also contain less elements than there were top-level statements in the AQL query.

  The following example shows a query with a non-sensible filter condition that
  the optimizer has removed so that there are less top-level statements.
name: RestExplainEmpty
---
var url = "/_api/explain";
var cn = "products";
db._drop(cn);
db._create(cn, { waitForSync: true });
body = '{ "query" : "FOR i IN [ 1, 2, 3 ] FILTER 1 == 2 RETURN i" }';

var response = logCurlRequest('POST', url, body);

assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```

### Parse an AQL query

```openapi
paths:
  /_db/{database-name}/_api/query:
    post:
      operationId: parseAqlQuery
      description: |
        This endpoint is for query validation only. To actually query the database,
        see `/api/cursor`.
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
              type: object
              required:
                - query
              properties:
                query:
                  description: |
                    To validate a query string without executing it, the query string can be
                    passed to the server via an HTTP POST request.
                  type: string
      responses:
        '200':
          description: |
            If the query is valid, the server will respond with *HTTP 200* and
            return the names of the bind parameters it found in the query (if any) in
            the `bindVars` attribute of the response. It will also return an array
            of the collections used in the query in the `collections` attribute.
            If a query can be parsed successfully, the `ast` attribute of the returned
            JSON will contain the abstract syntax tree representation of the query.
            The format of the `ast` is subject to change in future versions of
            ArangoDB, but it can be used to inspect how ArangoDB interprets a given
            query. Note that the abstract syntax tree will be returned without any
            optimizations applied to it.
        '400':
          description: |
            The request is malformed or the query contains a parse error.
            The body of the response contains the error details embedded in a JSON object.
      tags:
        - Queries
```

**Examples**

```curl
---
description: |-
  a valid query
name: RestQueryValid
---
var url = "/_api/query";
var body = '{ "query" : "FOR i IN 1..100 FILTER i > 10 LIMIT 2 RETURN i * 3" }';

var response = logCurlRequest('POST', url, body);

assert(response.code === 200);

logJsonResponse(response);
```

```curl
---
description: |-
  an invalid query
name: RestQueryInvalid
---
var url = "/_api/query";
var body = '{ "query" : "FOR i IN 1..100 FILTER i = 1 LIMIT 2 RETURN i * 3" }';

var response = logCurlRequest('POST', url, body);

assert(response.code === 400);

logJsonResponse(response);
```

### List all AQL optimizer rules

```openapi
paths:
  /_db/{database-name}/_api/query/rules:
    get:
      operationId: getAqlQueryOptimizerRules
      description: |
        A list of all optimizer rules and their properties.
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
            is returned if the list of optimizer rules can be retrieved successfully.
          content:
            application/json:
              schema:
                description: |
                  An array of objects. Each object describes an AQL optimizer rule.
                type: array
                items:
                  type: object
                  required:
                    - name
                    - flags
                  properties:
                    name:
                      description: |
                        The name of the optimizer rule as seen in query explain outputs.
                      type: string
                    flags:
                      description: |
                        An object with the properties of the rule.
                      type: object
                      required:
                        - hidden
                        - clusterOnly
                        - canBeDisabled
                        - canCreateAdditionalPlans
                        - disabledByDefault
                        - enterpriseOnly
                      properties:
                        hidden:
                          description: |
                            Whether the rule is displayed to users. Internal rules are hidden.
                          type: boolean
                        clusterOnly:
                          description: |
                            Whether the rule is applicable in the cluster deployment mode only.
                          type: boolean
                        canBeDisabled:
                          description: |
                            Whether users are allowed to disable this rule. A few rules are mandatory.
                          type: boolean
                        canCreateAdditionalPlans:
                          description: |
                            Whether this rule may create additional query execution plans.
                          type: boolean
                        disabledByDefault:
                          description: |
                            Whether the optimizer considers this rule by default.
                          type: boolean
                        enterpriseOnly:
                          description: |
                            Whether the rule is implemented in the non-public enterprise code.
                          type: boolean
      tags:
        - Queries
```

**Examples**

```curl
---
description: |-
  Retrieve the list of all query optimizer rules:
name: RestQueryRules
---
var url = "/_api/query/rules";
var response = logCurlRequest('GET', url);
assert(response.code === 200);
logJsonResponse(response);
```
