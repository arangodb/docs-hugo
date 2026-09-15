---
title: AQL query logging
menuTitle: Query logging
weight: 35
description: >-
  You can optionally let ArangoDB write metadata of finished AQL queries to a
  collection for later analysis
---
<small>Introduced in: v3.12.2</small>

For debugging query issues and to understand usage patterns, it can be helpful
to have a persistent log of queries.

ArangoDB lets you store information about past queries to a system collection
with a configurable sampling probability and retention period. This allows you
to analyze the metadata such as run time, memory usage, and failure reasons
directly in the database system.

{{< tip >}}
ArangoDB also supports event logging to a file, syslog, or the attached terminal.
See [`--log.level`](../../components/arangodb-server/options.md#--loglevel) for
details. The relevant log topics are `aql` and `queries`.

For in-memory tracking of currently running and slow queries, see the
[`@arangodb/aql/queries`](../../develop/javascript-api/aql-queries.md) module
of the JavaScript API for _arangosh_ as well as the query tracking endpoints of the
[HTTP API](../../develop/http-api/queries/aql-queries.md#track-queries).
{{< /tip >}}

## Enable query logging

To activate the logging of AQL queries to the `_queries` collection in the
`_system` database, you need to enable the `--query.collection-logger-enabled`
startup option for _arangod_.

If you want queries that run in the `_system` database to be logged, you
additionally need to enable the `--query.collection-logger-include-system-database`
startup option.

As logging all queries can have a high overhead on busy systems, only a random
sample of the total queries is typically logged. You can control the probability
with the `--query.collection-logger-probability` startup option. A value of `100`
logs all queries, whereas a value of `1` approximately logs every 100th query
and ignores the rest. Which queries are logged is based on randomness.

You can enable the `--query.collection-logger-all-slow-queries` startup option
to always log slow queries regardless of whether they are selected for sampling
or not. You can configure the time threshold for what is considered a slow query
(AQL queries with a duration greater than or equal to the slow query threshold)
with the `--query.slow-threshold` and `--query.slow-streaming-threshold`
startup options or the `slowQueryThreshold` and `slowStreamingQueryThreshold`
properties of the [`PUT /_db/{database-name}/_api/query/properties` endpoint](../../develop/http-api/queries/aql-queries.md#update-the-aql-query-tracking-configuration)
at runtime.

## Use the logged metadata

Query metadata is stored in the `_queries` collection in the `_system` database.
This collection is created automatically if needed.

{{< security >}}
The `_queries` collection is a normal system collection, so it can be queried by
every user with at least read access to the `_system` database and the `_queries`
collection. Keep this in mind when enabling the query logging as the data may
include sensitive information such as user names, query strings, and bind parameters.
{{< /security >}}

Only finished queries are logged to the `_queries` collection. Queries are
considered finished when they have executed completely or failed with an error.
In-flight queries are not logged but should eventually become finished queries.

Each document in the `_queries` collection represents a past query that has been
sampled. The document structure is as follows:

- `id` (string): The internal identifier of the query.

- `database` (string): The name of the database the query ran in.

- `user` (string): The name of the user who started the query.

- `query` (string): The query string (potentially truncated).

  The cutoff is controlled by the
  [`--query.max-artifact-log-length` startup option](../../components/arangodb-server/options.md#--querymax-artifact-log-length)
  or the `maxQueryStringLength` query tracking property
  that you can change via the
  `PUT /_db/{database-name}/_api/query/properties` endpoint
  at runtime.

  Whether the actual query string is tracked or only a
  value of `"<hidden>"` is returned depends on the
  [`--query.tracking-with-querystring` startup option](../../components/arangodb-server/options.md#--querytracking-with-querystring).

- `bindVars`: The bind parameter values used by the query.

  Whether the actual bind variables or an empty object is
  returned is controlled by the
  [`--query.tracking-with-bindvars` startup option](../../components/arangodb-server/options.md#--querytracking-with-bindvars)
  or the `trackBindVars` query tracking property that you can
  change via the `PUT /_db/{database-name}/_api/query/properties`
  endpoint at runtime.

- `dataSources` (array of strings): The collections and Views involved in the query.
  
  Only present if the
  [`--query.tracking-with-datasources` startup option](../../components/arangodb-server/options.md#--querytracking-with-datasources)
  is enabled.

- `started` (string): The date and time when the query was started (in ISO 8601 format).

- `runTime` (number): The total query duration (in seconds).

- `peakMemoryUsage` (integer): The query's peak memory usage in bytes (in increments of 32KB).

- `state` (string): The query's last execution state. Possible values:
  `"finished"`, `"killed"`, `"invalid"`

- `stream` (boolean):  Whether the query used a streaming cursor (`stream` query option).

- `modificationQuery` (boolean): Whether the query created, updated, replaced, or deleted
  any documents (`true`) or only read data (`false`).

- `warnings` (integer): The number of query warnings that occurred.

- `exitCode` (integer): An error code (`errorNum`) that indicates why the query
  failed, or `0` on success. See the [error codes](../../develop/error-codes.md) documentation.

You can retrieve and analyze the stored query metadata by running AQL queries on
the `_queries` collection in the `_system` database. You can use arbitrary
filtering, sorting, and aggregation.

**Examples**

Return the logged queries issued by a specific user and that ran for at least
10 seconds, sorted by start time:

```aql
FOR doc IN _queries
  FILTER doc.runTime >= 10.0
  FILTER doc.user == @user
  SORT doc.started
  RETURN doc
```

Group the logged queries from a specified time range by database and user and
return the count, database name, and user name for each group.

```aql
FOR doc IN _queries
  FILTER doc.started >= @start
  FILTER doc.started < @end
  COLLECT db = doc.database, user = doc.user WITH COUNT INTO count
  RETURN { db, user, count }
```

## Log retention

When query logging is enabled, obsolete entries from the `_queries` collection
are purged with a configurable schedule. The `--query.collection-logger-retention-time`
startup option determines for how long after a query's start time an entry is
approximately retained in the system collection. For example, a value of `86400`
keeps the document around for approximately one day (86400 seconds).
The default retention time is `28800` seconds (8 hours).

The actual cleanup of the system collection runs in configurable intervals.
This ensures that the cleanup process imposes minimal load.
You can configure it with the `--query.collection-logger-cleanup-interval`
startup option (in milliseconds).

## Log buffering

You can use the `--query.collection-logger-push-interval` startup option to set
a maximum wait time after which queries are logged to the system collection.
This is a performance optimization that helps to reduce the overhead of the
query logging. For example, a value of `10000` buffers query log entries in
memory for at most 10,000 milliseconds before they are actually written to the
system collection. When additional queries complete within this interval, their
log entries are batched together into a single write operation to the
system collection. This can amortize the cost of writing the query metadata to
the system collection across multiple user queries.

The `--query.collection-logger-max-buffered-queries` startup option limits the
number of query log entries to buffer in memory before they are flushed to the
system collection. Once this limit has been reached, no further query metadata
is buffered in memory and it is lost. To make this relatively unlikely, a flush
is triggered automatically once 25% of the limit is reached. However, it is
still possible that the single-thread flush operation cannot keep up with the
rate of incoming queries so that the limit is reached and some query metadata is
not logged.

Any queries that are buffered in memory and are not yet flushed out to the
system collection is lost in case the _arangod_ process shuts down or crashes.
The query logging functionality should therefore not be used for auditing but
rather for debugging and troubleshooting query issues, such as finding
long-running queries, queries that produced warnings or errors, users that
overuse the database, and so on.
