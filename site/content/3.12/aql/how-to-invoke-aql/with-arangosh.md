---
title: Executing AQL queries from _arangosh_
menuTitle: with arangosh
weight: 5
description: >-
  How to run queries, set bind parameters, and obtain the resulting and
  additional information using the JavaScript API
# Undocumented on purpose:
#   db._query(<query>, <bindVars>, <mainOptions>, { forceOneShardAttributeValue: "..."} )
---
In the ArangoDB shell, you can use the `db._query()` and `db._createStatement()`
methods to execute AQL queries. This chapter also describes
how to use bind parameters, counting, statistics and cursors. 

## With `db._query()`

`db._query(<queryString>) → cursor`

You can execute queries with the `_query()` method of the `db` object. 
This runs the specified query in the context of the currently
selected database and returns the query results in a cursor.
You can print the results of the cursor using its `toArray()` method:

```js
---
name: 01_workWithAQL_all
description: ''
---
~addIgnoreCollection("mycollection")
var coll = db._create("mycollection")
var doc = db.mycollection.save({ _key: "testKey", Hello : "World" })
db._query('FOR my IN mycollection RETURN my._key').toArray()
```

### `db._query()` bind parameters

`db._query(<queryString>, <bindVars>) → cursor`

To pass bind parameters into a query, you can specify a second argument when
calling the `_query()` method:

```js
---
name: 02_workWithAQL_bindValues
description: ''
---
db._query('FOR c IN @@collection FILTER c._key == @key RETURN c._key', {
  '@collection': 'mycollection', 
  'key': 'testKey'
}).toArray();
```

### ES6 template strings

`` aql`<queryTemplateString>` ``

It is also possible to use ES6 template strings for generating AQL queries. There is
a template string generator function named `aql`. 

The following example demonstrates what the template string function generates:

```js
---
name: 02_workWithAQL_aqlTemplateString
description: ''
---
var key = 'testKey';
aql`FOR c IN mycollection FILTER c._key == ${key} RETURN c._key`
```

The next example directly uses the generated result to execute a query:

```js
---
name: 02_workWithAQL_aqlQuery
description: ''
---
var key = 'testKey';
db._query(
  aql`FOR c IN mycollection FILTER c._key == ${key} RETURN c._key`
).toArray();
```

Arbitrary JavaScript expressions can be used in queries that are generated with the
`aql` template string generator. Collection objects are handled automatically:

```js
---
name: 02_workWithAQL_aqlCollectionQuery
description: ''
---
var key = 'testKey';
db._query(aql`FOR doc IN ${ db.mycollection } RETURN doc`).toArray();
```

Note: data-modification AQL queries normally do not return a result unless the
AQL query contains a `RETURN` operation at the top-level. Without a `RETURN`
operation, the `toArray()` method returns an empty array.

### Statistics and extra Information

`cursor.getExtra() → queryInfo`

It is always possible to retrieve statistics for a query with the `getExtra()` method:

```js
---
name: 03_workWithAQL_getExtra
description: ''
---
db._query(`
  FOR i IN 1..100
    INSERT { _key: CONCAT('test', TO_STRING(i)) } INTO mycollection
`).getExtra();
```

The meaning of the statistics values is described in
[Query statistics](../execution-and-performance/query-statistics.md).

Query warnings are also reported here. If you design queries on the shell,
be sure to check for warnings.

### Main query options

`db._query(<queryString>, <bindVars>, <mainOptions>, <subOptions>) → cursor`

You can pass the main options as the third argument to `db._query()` if you
also pass a fourth argument with the sub options (can be an empty object `{}`).

#### `count`

Whether the number of documents in the result set should be calculated on the
server side and returned in the `count` attribute of the result. Calculating the
`count` attribute might have a performance impact for some queries so this
option is turned off by default, and only returned when requested.

If enabled, you can get the count by calling the `count()` method of the cursor.
You can also count the number of results on the client side, for example, using
`cursor.toArray().length`.

```js
---
name: 02_workWithAQL_count
description: ''
---
var cursor = db._query(
  'FOR i IN 1..42 RETURN i',
  {},
  { count: true },
  {}
);
cursor.count();
cursor.toArray().length;
```

#### `batchSize`

The maximum number of result documents to be transferred from the server to the
client in one roundtrip. If this attribute is not set, a server-controlled
default value is used. A `batchSize` value of `0` is disallowed.

```js
---
name: 02_workWithAQL_batchSize
description: ''
---
db._query(
  'FOR i IN 1..3 RETURN i',
  {},
  { batchSize: 2 },
  {}
).toArray(); // full result retrieved in two batches
```

#### `ttl`

The time-to-live for the cursor (in seconds). If the result set is small enough
(less than or equal to `batchSize`), then results are returned right away.
Otherwise, they are stored in memory and are accessible via the cursor with
respect to the `ttl`. The cursor is removed on the server automatically after
the specified amount of time. This is useful to ensure garbage collection of
cursors that are not fully fetched by clients. If not set, a server-defined
value is used (default: 30 seconds).

```js
---
name: 02_workWithAQL_ttl
description: ''
---
db._query(
  'FOR i IN 1..20 RETURN i',
  {},
  { ttl: 5, batchSize: 10 },
  {}
).toArray(); // Each batch needs to be fetched within 5 seconds
```

#### `memoryLimit`

To set a memory limit for the query, pass `options` to the `_query()` method.
The memory limit specifies the maximum number of bytes that the query is
allowed to use. When a single AQL query reaches the specified limit value, 
the query will be aborted with a *resource limit exceeded* exception. In a 
cluster, the memory accounting is done per shard, so the limit value is 
effectively a memory limit per query per shard.

```js
---
name: 02_workWithAQL_memoryLimit
description: ''
---
db._query(
  'FOR i IN 1..100000 SORT i RETURN i',
  {},
  { memoryLimit: 100000 }
).toArray(); // xpError(ERROR_RESOURCE_LIMIT)
```

If no memory limit is specified, then the server default value (controlled by
the `--query.memory-limit` startup option) is used for restricting the maximum amount 
of memory the query can use. A memory limit value of `0` means that the maximum
amount of memory for the query is not restricted. 

### Query sub options

`db._query(<queryString>, <bindVars>, <subOptions>) → cursor`

`db._query(<queryString>, <bindVars>, <mainOptions>, <subOptions>) → cursor`

You can pass the sub options as the third argument to `db._query()` if you don't
provide main options, or as fourth argument if you do.

#### `fullCount`

If you set `fullCount` to `true` and if the query contains a `LIMIT` operation, then the
result has an extra attribute with the sub-attributes `stats` and `fullCount`, like
`{ ... , "extra": { "stats": { "fullCount": 123 } } }`. The `fullCount` attribute
contains the number of documents in the result before the last top-level `LIMIT` in the
query was applied. It can be used to count the number of documents that match certain
filter criteria, but only return a subset of them, in one go. It is thus similar to
MySQL's `SQL_CALC_FOUND_ROWS` hint. Note that setting the option disables a few
`LIMIT` optimizations and may lead to more documents being processed, and thus make
queries run longer. Note that the `fullCount` attribute may only be present in the
result if the query has a top-level `LIMIT` operation and the `LIMIT` operation
is actually used in the query.

#### `failOnWarning`
If you set `failOnWarning` to `true`, this makes the query throw an exception and
abort in case a warning occurs. You should use this option in development to catch
errors early. If set to `false`, warnings don't propagate to exceptions and are
returned with the query results. There is also a `--query.fail-on-warning`
startup options for setting the default value for `failOnWarning`, so that you
don't need to set it on a per-query level.

#### `cache`

Whether the [AQL query results cache](../execution-and-performance/caching-query-results.md)
shall be used for adding as well as for retrieving results.

If the query cache mode is set to `demand` and you set the `cache` query option
to `true` for a query, then its query result is cached if it's eligible for
caching. If the query cache mode is set to `on`, query results are automatically
cached if they are eligible for caching unless you set the `cache` option to `false`.

If you set the `cache` option to `false`, then any query cache lookup is skipped
for the query. If you set it to `true`, the query cache is checked a cached result
**if** the query cache mode is either set to `on` or `demand`.

```js
---
name: 02_workWithAQL_cache
description: ''
---
var resultCache = require("@arangodb/aql/cache");
resultCache.properties({ mode: "demand" });
~resultCache.clear();
db._query("FOR i IN 1..5 RETURN i", {}, { cache: true }); // Adds result to cache
db._query("FOR i IN 1..5 RETURN i", {}, { cache: true }); // Retrieves result from cache
db._query("FOR i IN 1..5 RETURN i", {}, { cache: false }); // Bypasses the cache
```

#### `usePlanCache`

Set this option to `true` to utilize a cached query plan or add the execution plan
of this query to the cache if it's not in the cache yet. Otherwise, the plan cache
is bypassed.

Query plan caching can reduce the total time for processing queries by avoiding
to parse, plan, and optimize queries over and over again that effectively have
the same execution plan with at most some changes to bind parameter values.

An error is raised if a query doesn't meet the requirements for plan caching.
See [Cache eligibility](../execution-and-performance/caching-query-plans.md#cache-eligibility)
for details.

#### `fillBlockCache`

If you set `fillBlockCache` to `true` or not specify it, this makes the query store
the data it reads via the RocksDB storage engine in the RocksDB block cache. This is
usually the desired behavior. You can set the option to `false` for queries that are
known to either read a lot of data that would thrash the block cache, or for queries
that read data known to be outside of the hot set. By setting the option
to `false`, data read by the query does not make it into the RocksDB block cache if
it is not already in there, thus leaving more room for the actual hot set.

#### `profile`

If you set `profile` to `true` or `1`, extra timing information is returned for the query.
The timing information is accessible via the `getExtra()` method of the query
result. If set to `2`, the query includes execution statistics per query plan
execution node in `stats.nodes` sub-attribute of the `extra` return attribute.
Additionally, the query plan is returned in the `extra.plan` sub-attribute.

#### `maxWarningCount`

The `maxWarningCount` option limits the number of warnings that are returned by the query if
`failOnWarning` is not set to `true`. The default value is `10`.

#### `maxNumberOfPlans`

The `maxNumberOfPlans` option limits the number of query execution plans the optimizer
creates at most. Reducing the number of query execution plans may speed up query plan
creation and optimization for complex queries, but normally there is no need to adjust
this value.

#### `optimizer`

Options related to the query optimizer.

- `rules`: A list of to-be-included or to-be-excluded optimizer rules can be put into
  this attribute, telling the optimizer to include or exclude specific rules. To disable
  a rule, prefix its name with a `-`, to enable a rule, prefix it with a `+`. There is also
  a pseudo-rule `all`, which matches all optimizer rules. `-all` disables all rules.

#### `allowRetry`

Set this option to `true` to make it possible to retry fetching the latest batch
from a cursor.

{{< info >}}
This feature cannot be used on the server-side, like in [Foxx](../../develop/foxx-microservices/_index.md), as
there is no client connection and no batching.
{{< /info >}}

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

To allow refetching of the last batch of the query, the server cannot
automatically delete the cursor. After the first attempt of fetching the last
batch, the server would normally delete the cursor to free up resources. As you
might need to reattempt the fetch, it needs to keep the final batch when the
`allowRetry` option is enabled. Once you successfully received the last batch,
you should call the `DELETE /_api/cursor/<cursor-id>` endpoint so that the
server doesn't unnecessarily keep the batch until the cursor times out
(`ttl` query option).

#### `stream`

Set `stream` to `true` to execute the query in a **streaming** fashion.
The query result is not stored on the server, but calculated on the fly.

{{< warning >}}
Long-running queries need to hold the collection locks for as long as the query
cursor exists. It is advisable to **only** use this option on short-running
queries **or** without exclusive locks.
{{< /warning >}}

If set to `false`, the query is executed right away in its entirety.
In that case, the query results are either returned right away (if the result
set is small enough), or stored on the arangod instance and can be accessed
via the cursor API. 

The default value is `false`.

{{< info >}}
The query options `cache`, `count` and `fullCount` don't work on streaming
queries. Additionally, query statistics, profiling data, and warnings are only
available after the query has finished and are delivered as part of the last batch.
{{< /info >}}

#### `maxRuntime`

The query has to be executed within the given runtime or it is killed.
The value is specified in seconds. The default value is `0.0` (no timeout).

#### `maxDNFConditionMembers`

<small>Introduced in: v3.11.0</small>

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

You can also set the threshold globally instead of per query with the
[`--query.max-dnf-condition-members` startup option](../../components/arangodb-server/options.md#--querymax-dnf-condition-members).

#### `maxNodesPerCallstack`

The number of execution nodes in the query plan after
that stack splitting is performed to avoid a potential stack overflow.
Defaults to the configured value of the startup option
`--query.max-nodes-per-callstack`.

This option is only useful for testing and debugging and normally does not need
any adjustment.

#### `maxTransactionSize`

The transaction size limit in bytes.

#### `intermediateCommitSize`

The maximum total size of operations after which an intermediate
commit is performed automatically.

#### `intermediateCommitCount`

The maximum number of operations after which an intermediate
commit is performed automatically.

#### `spillOverThresholdMemoryUsage`

<small>Introduced in: v3.10.0</small>

This option allows queries to store intermediate and final results temporarily
on disk if the amount of memory used (in bytes) exceeds the specified value.
This is used for decreasing the memory usage during the query execution.

This option only has an effect on queries that use the `SORT` operation but
without a `LIMIT`, and if you enable the spillover feature by setting a path
for the directory to store the temporary data in with the
[`--temp.intermediate-results-path` startup option](../../components/arangodb-server/options.md#--tempintermediate-results-path).

Default value: 128MB.

{{< info >}}
Spilling data from RAM onto disk is an experimental feature and is turned off 
by default. The query results are still built up entirely in RAM on Coordinators
and single servers for non-streaming queries. To avoid the buildup of
the entire query result in RAM, use a streaming query (see the
[`stream`](#stream) option).
{{< /info >}}

#### `spillOverThresholdNumRows`

<small>Introduced in: v3.10.0</small>
  
This option allows queries to store intermediate and final results temporarily
on disk if the number of rows produced by the query exceeds the specified value.
This is used for decreasing the memory usage during the query execution. In a
query that iterates over a collection that contains documents, each row is a
document, and in a query that iterates over temporary values 
(i.e. `FOR i IN 1..100`), each row is one of such temporary values.

This option only has an effect on queries that use the `SORT` operation but
without a `LIMIT`, and if you enable the spillover feature by setting a path
for the directory to store the temporary data in with the
[`--temp.intermediate-results-path` startup option](../../components/arangodb-server/options.md#--tempintermediate-results-path).

Default value: `5000000` rows.

{{< info >}}
Spilling data from RAM onto disk is an experimental feature and is turned off 
by default. The query results are still built up entirely in RAM on Coordinators
and single servers for non-streaming queries. To avoid the buildup of
the entire query result in RAM, use a streaming query (see the
[`stream`](#stream) option).
{{< /info >}}

#### `allowDirtyReads`

<small>Introduced in: v3.10.0</small>

If you set this option to `true` and execute the query against a cluster
deployment, then the Coordinator is allowed to read from any shard replica and
not only from the leader. See [Read from followers](../../develop/http-api/documents.md#read-from-followers)
for details.

#### `skipInaccessibleCollections`

Let AQL queries (especially graph traversals) treat collection to which a
user has **no access** rights for as if these collections are empty.
Instead of returning a *forbidden access* error, your queries execute normally.
This is intended to help with certain use-cases: A graph contains several collections
and different users execute AQL queries on that graph. You can naturally limit the 
accessible results by changing the access rights of users on collections.

#### `satelliteSyncWait`

Configure how long a DB-Server has time to bring the SatelliteCollections
involved in the query into sync. The default value is `60.0` seconds.
When the maximal time is reached, the query is stopped.

## With `db._createStatement()` (ArangoStatement)

The `_query()` method is a shorthand for creating an `ArangoStatement` object,
executing it and iterating over the resulting cursor. If more control over the
result set iteration is needed, it is recommended to first create an
`ArangoStatement` object as follows:

```js
---
name: 04_workWithAQL_statements1
description: ''
---
stmt = db._createStatement( { "query": "FOR i IN [ 1, 2 ] RETURN i * 2" } );
```

To execute the query, use the `execute()` method of the _statement_ object:

```js
---
name: 05_workWithAQL_statements2
description: ''
---
~var stmt = db._createStatement( { "query": "FOR i IN [ 1, 2 ] RETURN i * 2" } );
cursor = stmt.execute();
```

You can pass a number to the `execute()` method to specify a batch size value.
The server returns at most this many results in one roundtrip.
The batch size cannot be adjusted after the query is first executed.

**Note**: There is no need to explicitly call the execute method if another
means of fetching the query results is chosen. The following two approaches
lead to the same result:

```js
---
name: executeQueryNoBatchSize
description: ''
---
~db._create("users");
~db.users.save({ name: "Gerhard" });
~db.users.save({ name: "Helmut" });
~db.users.save({ name: "Angela" });
var result = db.users.all().toArray();
print(result);

var q = db._query("FOR x IN users RETURN x");
result = [ ];
while (q.hasNext()) {
  result.push(q.next());
}
print(result);
~db._drop("users")
```

The following two alternatives both use a batch size and return the same
result:

```js
---
name: executeQueryBatchSize
description: ''
---
~db._create("users");
~db.users.save({ name: "Gerhard" });
~db.users.save({ name: "Helmut" });
~db.users.save({ name: "Angela" });
var result = [ ];
var q = db.users.all();
q.execute(1);
while(q.hasNext()) {
  result.push(q.next());
}
print(result);

result = [ ];
q = db._query("FOR x IN users RETURN x", {}, { batchSize: 1 });
while (q.hasNext()) {
  result.push(q.next());
}
print(result);
~db._drop("users")
```

### Cursors

Once the query executed the query results are available in a cursor. 
The cursor can return all its results at once using the `toArray()` method.
This is a short-cut that you can use if you want to access the full result
set without iterating over it yourself.

```js
---
name: 05_workWithAQL_statements3
description: ''
---
~var stmt = db._createStatement( { "query": "FOR i IN [ 1, 2 ] RETURN i * 2" } );
~var cursor = stmt.execute();
cursor.toArray();
```

Cursors can also be used to iterate over the result set document-by-document.
To do so, use the `hasNext()` and `next()` methods of the cursor:

```js
---
name: 05_workWithAQL_statements4
description: ''
---
~var stmt = db._createStatement( { "query": "FOR i IN [ 1, 2 ] RETURN i * 2" } );
~var c = stmt.execute();
while (c.hasNext()) {
  require("@arangodb").print(c.next());
}
```

Please note that you can iterate over the results of a cursor only once, and that
the cursor will be empty when you have fully iterated over it. To iterate over
the results again, the query needs to be re-executed.

Additionally, the iteration can be done in a forward-only fashion. There is no 
backwards iteration or random access to elements in a cursor.    

### ArangoStatement parameters binding

To execute an AQL query using bind parameters, you need to create a statement first
and then bind the parameters to it before execution:

```js
---
name: 05_workWithAQL_statements5
description: ''
---
var stmt = db._createStatement( { "query": "FOR i IN [ @one, @two ] RETURN i * 2" } );
stmt.bind("one", 1);
stmt.bind("two", 2);
cursor = stmt.execute();
```

The cursor results can then be dumped or iterated over as usual, e.g.:

```js
---
name: 05_workWithAQL_statements6
description: ''
---
~var stmt = db._createStatement( { "query": "FOR i IN [ @one, @two ] RETURN i * 2" } );
~stmt.bind("one", 1);
~stmt.bind("two", 2);
~var cursor = stmt.execute();
cursor.toArray();
```

or

```js
---
name: 05_workWithAQL_statements7
description: ''
---
~var stmt = db._createStatement( { "query": "FOR i IN [ @one, @two ] RETURN i * 2" } );
~stmt.bind("one", 1);
~stmt.bind("two", 2);
~var cursor = stmt.execute();
while (cursor.hasNext()) {
  require("@arangodb").print(cursor.next());
}
```

Please note that bind parameters can also be passed into the `_createStatement()`
method directly, making it a bit more convenient:

```js
---
name: 05_workWithAQL_statements8
description: ''
---
stmt = db._createStatement({ 
  "query": "FOR i IN [ @one, @two ] RETURN i * 2", 
  "bindVars": { 
    "one": 1, 
    "two": 2 
  } 
});
```

### Counting with a cursor

Cursors also optionally provide the total number of results. By default, they do not. 
To make the server return the total number of results, you may set the `count` attribute to 
`true` when creating a statement:

```js
---
name: 05_workWithAQL_statements9
description: ''
---
stmt = db._createStatement( {
  "query": "FOR i IN [ 1, 2, 3, 4 ] RETURN i",
  "count": true } );
```

After executing this query, you can use the `count` method of the cursor to get the 
number of total results from the result set:

```js
---
name: 05_workWithAQL_statements10
description: ''
---
~var stmt = db._createStatement( { "query": "FOR i IN [ 1, 2, 3, 4 ] RETURN i", "count": true } );
var cursor = stmt.execute();
cursor.count();
```

Please note that the `count` method returns nothing if you did not specify the `count`
attribute when creating the query.

This is intentional so that the server may apply optimizations when executing the query and 
construct the result set incrementally. Incremental creation of the result sets
is no possible
if all of the results need to be shipped to the client anyway. Therefore, the client
has the choice to specify `count` and retrieve the total number of results for a query (and
disable potential incremental result set creation on the server), or to not retrieve the total
number of results and allow the server to apply optimizations.

Please note that at the moment the server will always create the full result set for each query so 
specifying or omitting the `count` attribute currently does not have any impact on query execution.
This may change in the future. Future versions of ArangoDB may create result sets incrementally 
on the server-side and may be able to apply optimizations if a result set is not fully fetched by 
a client.

### Using cursors to obtain additional information on internal timings

Cursors can also optionally provide statistics of the internal execution phases. By default, they do not. 
To get to know how long parsing, optimization, instantiation and execution took,
make the server return that by setting the `profile` attribute to
`true` when creating a statement:

```js
---
name: 06_workWithAQL_statements11
description: ''
---
stmt = db._createStatement({
  query: "FOR i IN [ 1, 2, 3, 4 ] RETURN i",
  options: {"profile": true}});
```

After executing this query, you can use the `getExtra()` method of the cursor to get the 
produced statistics:

```js
---
name: 06_workWithAQL_statements12
description: ''
---
~var stmt = db._createStatement( { "query": "FOR i IN [ 1, 2, 3, 4 ] RETURN i", options: {"profile": true}} );
var cursor = stmt.execute();
cursor.getExtra();
```

## Query validation with `db._parse()`

The `_parse()` method of the `db` object can be used to parse and validate a
query syntactically, without actually executing it.

```js
---
name: 06_workWithAQL_statements13
description: ''
---
db._parse( "FOR i IN [ 1, 2 ] RETURN i" );
```
