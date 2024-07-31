---
title: AQL query logging
menu: Query logging
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

ArangoDB also supports event logging to a file, syslog, or the attached terminal.
See [`--log.level`](../../components/arangodb-server/options.md#--loglevel) for
details. The relevant log topics are `aql` and `queries`.

## Enable query logging

To activate the logging of AQL queries to the `_queries` collection, you need to
enable the `--query.collection-logger-enabled` startup option for _arangod_.

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
with the `--query.slow-threshold` and `--query.slow-streaming-threshold`
startup options.

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
sampled and includes the following attributes:

- `id`: The internal ID of the query.
- `database`: The name of the database the query ran in.
- `user`: The name of the user that executed the query.
- `query`: The query string, if the `--query.tracking-with-querystring`
  startup option is enabled (the default is `true`). Otherwise, the value is
  `"<hidden>"`. The query string is cut off after
  `--query.max-artifact-log-length` characters.
- `bindVars`: The bind parameter values used by the query, if the
  `--query.tracking-with-bindvars` startup option is enabled (the default is
  `true`). If it is disabled or no bind parameters were used, the value is `{}`.
- `dataSources`: An array of collection and View names that were used in the
  query. Only present if `--query.tracking-with-datasources` startup option is
  enabled (the default is `false`).
- `started`: An ISO 8601 date time strings with the point in time the query
  started executing.
- `runTime`: The total duration of the query in seconds.
- `state`: The state of the query (always `"finished"`).
- `stream`:  Whether the query was a streaming AQL query (`stream` option).
- `modificationQuery`: Whether the query created, modified, or deleted any documents.
- `warnings`: The number of warnings issued by the query.
- `exitCode`: The exit code of the query (`0` = success, any other exit code
  indicates a specific [error](../../develop/error-codes-and-meanings.md)).

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
