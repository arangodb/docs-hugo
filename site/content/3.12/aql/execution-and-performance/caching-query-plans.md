---
title: The AQL query execution plan cache
menuTitle: Caching query plans
weight: 29
description: >-
  AQL provides an optional cache for query plans to skip query planning and
  optimization when running the same queries repeatedly
---
Query plan caching can reduce the total time for processing queries by avoiding
to parse, plan, and optimize queries over and over again that effectively have
the same execution plan with at most some changes to bind parameter values.
It is especially useful for particular queries where a lot of time is spent on
the query planning and optimization passes in proportion to the actual execution.

## Use plan caching for queries

Query plans are not cached by default. You need to enable the query option for
plan caching on a per-query basis to utilize cached plans as well as to add
plans to the cache. Otherwise, the plan cache is bypassed.

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. Click **Queries** in the main navigation.
2. Enter an AQL query and specify the values for bind variables if necessary.
3. Switch to the **Options** tab to access the query options.
4. Expand the **Advanced** panel.
5. Enable the **Use Plan Cache** option.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: arangosh_cache_query_plan
description: ''
---
db._query("RETURN @val")
```
See the [JavaScript API](../../develop/javascript-api/@arangodb/db-object.md#db_createcollection-name--properties--type--options)
for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl -d '{"query":"RETURN @val","bindVars":{"val":"5"},"options":{"usePlanCache":true}}' http://localhost:8529/_db/mydb/_api/cursor
```

See the [HTTP API](../../develop/http-api/queries/aql-query-plan-cache.md) for details. <!-- TODO: link to cursor API or query cache API? -->
{{< /tab >}}

{{< /tabs >}}

## Cache eligibility

<!-- TODO
LIMIT offset/count values must be constant numeric values - only raised if plan caching is on
-->
If plan caching is enabled for query, the eligibility for being cached is checked
first. Any queries that have any of the following query options set are not
eligible for plan caching:

- `allPlans`
- `optimizer.rules`
- `explainRegisters` (internal)
- `inaccessibleCollections` (internal)
- `shardIds` (internal)

Additionally, a query is not eligible for plan caching if it uses attribute 
name bind parameters (e.g. `FILTER doc.@attributeName == ...`) or when using
value bind parameters in any of the following places:
- Specifying the depths for traversals or path queries
  (e.g. `FOR v, e IN @min..@max OUTBOUND ...`)
- Referring to a named graph (e.g. `GRAPH @graphName`)
- Referring to edge collections used in traversals or path queries 
  (e.g. `FOR v, e IN 1..2 OUTBOUND 'v/0' @@edgeColl ...`)

If a query produces any warnings during parsing or query plan optimization,
it is also not eligible for plan caching.

Query plans are also not eligible for caching if they contain one of the
following execution node types in the plan:
- `SingleRemoteOperationNode` (cluster only)
- `MultipleRemoteModificationNode` (cluster only)
- `UpsertNode`, i.e. the AQL `UPSERT` operation

If a query is eligible for plan caching, the plan cache is checked using
the exact same query string and set of collection bind parameter values.
A cached plan entry is only considered identical to the current query if the
query strings are identical byte for byte and the set of collection bind 
parameters is exactly the same (bind parameter names and bind parameter 
values).

If no plan entry can be found in the plan cache, the query is planned and 
optimized as usual, and the cached plan is inserted into the plan cache.
Repeated executions of the same query (same query string and using the same 
set of collection bind parameters) then makes use of the cached plan
entry, potentially with different value bind parameters.

The following query options are ignored when a cached plan is used:
- `joinStrategyType`
- `maxDNFConditionMembers`
- `maxNodesPerCallstack`

Whenever a query uses a plan from the plan cache, the query
result includes a `planCacheKey` attribute on the top level when
executing, explaining, or profiling a query. The explain and profiling
outputs also indicate when a cached query plan was used, showing
`plan cache key: ...` at the top.

## Cache invalidation

The query plan cache is organized per database. It gets invalidated at the
following events:

- An existing collection gets dropped or renamed, or the properties of an
  existing collection are modified
- An index is added to an existing collection or an index is dropped
- An existing View gets dropped or renamed, or the properties of an existing
  View are modified
- A named graph is added, or an existing named graph gets dropped

## Configuration

The memory usage of the query plan cache can be restricted using the following
startup options:

- [`--query.plan-cache-max-entries`](../../components/arangodb-server/options.md#--queryplan-cache-max-entries)
- [`--query.plan-cache-max-memory-usage`](../../components/arangodb-server/options.md#--queryplan-cache-max-memory-usage)
- [`--query.plan-cache-max-entry-size`](../../components/arangodb-server/options.md#--queryplan-cache-max-entry-size)
- [`--query.plan-cache-invalidation-time`](../../components/arangodb-server/options.md#--queryplan-cache-invalidation-time)

Note that each database has its own query plan cache, and that these options
are used for each individual plan cache. In a cluster, each Coordinator has its
own query plan cache.

## Interfaces

### List the query plan cache entries

Retrieve all entries in the query plan cache for the current database.

This requires read privileges for the current database. In addition, only those
query plans are returned for which the current user has at least read permissions
on all collections and Views included in the query.

{{< tabs "interfaces" >}}

{{< tab "arangosh" >}}
```js
const planCache = require("@arangodb/aql/plan-cache");
planCache.toArray();
```
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl http://localhost:8529/_api/query-plan-cache
```

See the [HTTP API](../../develop/http-api/queries/aql-query-plan-cache.md#list-the-entries-of-the-aql-query-plan-cache)
for details.
{{< /tab >}}

{{< /tabs >}}

### Clear the query plan cache

Delete all entries in the query plan cache for the current database.

This requires write privileges for the current database.

{{< tabs "interfaces" >}}

{{< tab "arangosh" >}}
```js
const planCache = require("@arangodb/aql/plan-cache");
planCache.clear();
```
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl -XDELETE http://localhost:8529/_api/query-plan-cache
```

See the [HTTP API](../../develop/http-api/queries/aql-query-plan-cache.md#clear-the-aql-query-results-cache)
for details.
{{< /tab >}}

{{< /tabs >}}
