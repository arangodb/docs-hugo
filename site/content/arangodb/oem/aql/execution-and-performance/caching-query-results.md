---
title: The AQL query results cache
menuTitle: Caching query results
weight: 30
description: >-
  AQL provides an optional query results cache in single server deployments
---
The purpose of the query results cache is to avoid repeated calculation of the same
query results. It is useful if data-reading queries repeat a lot and there are
not many write queries.

The query results cache is transparent so users do not need to manually invalidate 
results in it if underlying collection data are modified. 

{{< info >}}
The AQL query results cache is only available for single servers, i.e. servers that
are not part of a cluster setup.
{{< /info >}}

## Modes

The cache can be operated in the following modes:

- `off`: The cache is disabled. No query results are stored.
- `on`: The cache stores the results of all AQL queries unless the `cache`
  query option is set to `false`.
- `demand`: The cache stores the results of AQL queries that have the
  `cache` query option set to `true` but ignores all others.

The mode can be set at server startup as well as at runtime, see
[Global configuration](#global-configuration).

## Query eligibility

The query results cache considers two queries identical if they have exactly the
same query string and the same bind variables. Any deviation in terms of whitespace, 
capitalization etc. is considered a difference. The query string is hashed 
and used as the cache lookup key. If a query uses bind parameters, these are also
hashed and used as part of the cache lookup key.

Even if the query strings of two queries are identical, the query results cache
treats them as different queries if they have different bind parameter
values. Other components that become part of a query's cache key are the
`count`, `fullCount`, and `optimizer` attributes.

If the cache is enabled, it is checked whether it has a result ready for a
particular query at the very start of processing the query request. If this is
the case, the query result is served directly from the cache, which is normally
very efficient. If the query cannot be found in the cache, it is executed
as usual.

If the query is eligible for caching and the cache is enabled, the query
result is stored in the query results cache so it can be used for subsequent 
executions of the same query.

A query is eligible for caching only if all of the following conditions are met:

- The server the query executes on is a single server (i.e. not part of a cluster).
- The query is a read-only query and does not modify data in any collection.
- No warnings were produced while executing the query.
- The query is deterministic and only uses deterministic functions whose results
  are marked as cacheable.
- The size of the query result does not exceed the cache's configured maximal
  size for individual cache results or cumulated results.
- The query is not executed using a streaming cursor (`"stream": true` query option).

The usage of non-deterministic functions leads to a query not being cacheable.
This is intentional to avoid caching of function results which should rather
be calculated on each invocation of the query (e.g. `RAND()` or `DATE_NOW()`).

The query results cache considers all user-defined AQL functions to be non-deterministic
as it has no insight into these functions.

## Cache invalidation

The cached results are fully or partially invalidated automatically if
queries modify the data of collections that were used during the computation of
the cached query results. This is to protect users from getting stale results
from the query results cache.

This also means that if the cache is turned on, then there is an additional
cache invalidation check for each data-modification operation (e.g. insert, update, 
remove, truncate operations as well as AQL data-modification queries).

**Example**

If the result of the following query is present in the query results cache,
then either modifying data in the `users` or `organizations` collection
removes the already computed result from the cache:

```aql
FOR user IN users
  FOR organization IN organizations
    FILTER user.organization == organization._key
    RETURN { user: user, organization: organization }
```

Modifying data in other unrelated collections does not lead to this
query result being removed from the cache.

## Performance considerations

The query results cache is organized as a hash table, so looking up whether a query result
is present in the cache is fast. Still, the query string and the bind
parameter used in the query need to be hashed. This is a slight overhead that
is not present if the cache is disabled or a query is marked as not cacheable.

Additionally, storing query results in the cache and fetching results from the 
cache requires locking via a read/write lock. While many thread can read in parallel from
the cache, there can only be a single modifying thread at any given time. Modifications
of the query cache contents are required when a query result is stored in the cache
or during cache invalidation after data-modification operations. Cache invalidation
requires time proportional to the number of cached items that need to be invalidated.

There may be workloads in which enabling the query results cache leads to a performance
degradation. It is not recommended to turn the query results cache on in workloads that only
modify data, or that modify data more often than reading it. Enabling the cache
also provides no benefit if queries are very diverse and do not repeat often.
In read-only or read-mostly workloads, the cache is beneficial if the same
queries are repeated lots of times.

In general, the query results cache provides the biggest improvements for queries with
small result sets that take long to calculate. If query results are very big and
most of the query time is spent on copying the result from the cache to the client,
then the cache does not provide much benefit.

## Global configuration

The query results cache can be configured at server start with the
[`--query.cache-mode`](../../components/arangodb-server/options.md#--querycache-mode)
startup option.

The cache mode can also be changed at runtime using the JavaScript API as follows:

```js
require("@arangodb/aql/cache").properties({ mode: "on" }); 
```

The maximum number of cached results in the cache for each database can be configured
at server start using the following configuration parameters:

- `--query.cache-entries`: The maximum number of results in the query results cache per database
- `--query.cache-entries-max-size`: The maximum cumulated size of results in the query results cache per database
- `--query.cache-entry-max-size`: The maximum size of an individual result entry in query results cache
- `--query.cache-include-system-collections`: Whether to include system collection queries in the query results cache

These parameters can be used to put an upper bound on the number and size of query 
results in each database's query cache and thus restrict the cache's memory consumption.

These value can also be adjusted at runtime as follows:

```js
require("@arangodb/aql/cache").properties({ 
  maxResults: 200,
  maxResultsSize: 8 * 1024 * 1024,
  maxEntrySize: 1024 * 1024,
  includeSystem: false 
}); 
```

The above settings limit the number of cached results in the query results cache to 200
results per database, and to 8 MiB cumulated query result size per database. The maximum
size of each query cache entry is restricted to 1 MiB. Queries that involve system
collections are excluded from caching.

You can also change the configuration at runtime with the
[HTTP API](../../develop/http-api/queries/aql-query-results-cache.md).

## Per-query configuration

When a query is sent to the server for execution and the cache is set to `on` or `demand`,
the query executor checks the query's `cache` option. If the query cache mode is
`on`, then not setting this query option or setting it to anything but `false` makes the
query executor consult the query results cache. If the query cache mode is `demand`, then setting
the `cache` option to `true` makes the executor look for the query in the query results cache.
When the query cache mode is `off`, the executor does not look for the query in the cache.

The `cache` attribute can be set as follows via the `db._createStatement()` function:

```js
var stmt = db._createStatement({ 
  query: "FOR doc IN users LIMIT 5 RETURN doc",
  options: {
    cache: true
  }    
});

stmt.execute();
```

When using the `db._query()` function, the `cache` attribute can be set as follows:

```js
db._query("FOR doc IN users LIMIT 5 RETURN doc", {}, { cache: true }); 
```

You can also set the `cache` query option in the
[HTTP API](../../develop/http-api/queries/aql-queries.md#create-a-cursor).

Each query result returned contain a `cached` attribute. It is set to `true`
if the result was retrieved from the query results cache, and `false` otherwise. Clients can use
this attribute to check if a specific query was served from the cache or not.

## Query results cache inspection

The contents of the query results cache can be checked at runtime using the cache's
`toArray()` function:

```js
require("@arangodb/aql/cache").toArray();
```

This returns a list of all query results stored in the current database's query
results cache.

The query results cache for the current database can be cleared at runtime using the
cache's `clear` function:

```js
require("@arangodb/aql/cache").clear();
```

## Restrictions

Query results that are returned from the query results cache may contain execution statistics
stemming from the initial, uncached query execution. This means for a cached query results,
the `extra.stats` attribute may contain stale data, especially in terms of the `executionTime`
and `profile` attribute values.
