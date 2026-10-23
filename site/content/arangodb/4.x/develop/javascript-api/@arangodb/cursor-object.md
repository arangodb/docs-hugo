---
title: The _cursor_ object of the JavaScript API
menuTitle: cursor object
weight: 20
description: >-
  Cursor objects let you iterate over the results of executed AQL queries
---
The JavaScript API returns _cursor_ objects when you use the following methods
of the [`db` object](db-object.md) from the `@arangodb` module in _arangosh_:

- `db._query(...)` 
- `db._createStatement(...).execute()`

Unless an error is thrown, for example due to a syntax error in the query or a
runtime error during the query execution, both methods return a cursor object
for a successful query. This is the case even if the result set is small enough
to be transferred in a single batch, so you always interact with the results
through a cursor in _arangosh_.

You can use the `hasNext()` and `next()` methods of the returned cursor object
to iterate over the results, or call `toArray()` right away to get an
array with all results.

If the number of query results is expected to be big, it is possible to 
limit the amount of documents transferred between the server and the client
to a specific value. This value is called `batchSize`. You can set the
`batchSize` as an option when you execute a query with `db._query()` or when
you create a statement with `db._createStatement()`. If no `batchSize` value is
specified, the server picks a reasonable default value.
If the server has more documents than should be returned in a single batch,
the server sets the `hasMore` attribute in the result. It also
returns the ID of the server-side cursor in the `id` attribute in the response.
This ID can be used with the Cursor API to fetch any outstanding results from
the server and dispose the server-side cursor afterwards.

## `cursor.hasNext()`

Checks whether there are more results available in the cursor.

If the `hasNext()` method returns `true`, then the cursor still has documents,
and you can retrieve the next one with the `next()` method. If it returns
`false`, the cursor is exhausted.

**Example**

```js
---
name: cursorHasNext
description: |
  Iterate over a query result, fetching one document at a time as long as
  there are more available:
---
~db._create("five");
~db.five.save({ name : "one" });
~db.five.save({ name : "two" });
~db.five.save({ name : "three" });
~db.five.save({ name : "four" });
~db.five.save({ name : "five" });
var cursor = db._query("FOR x IN five RETURN x");
while (cursor.hasNext()) {
  print(cursor.next());
}
~db._drop("five")
```

## `cursor.next()`

Returns the next result document.

As long as `hasNext()` returns `true`, there are more results available, and
each call to `next()` returns a single document and advances the cursor by one
position. The results are buffered locally in batches; when the current batch
is exhausted and more results are available on the server, `next()` fetches the
next batch, which requires a roundtrip to the server.

If you call `next()` on an exhausted cursor, then an error is thrown.
To avoid this, check the availability of results with `hasNext()` beforehand.

**Example**

```js
---
name: cursorNext
description: |
  Get the next document of a query result:
---
~db._create("five");
~db.five.save({ name : "one" });
~db.five.save({ name : "two" });
~db.five.save({ name : "three" });
~db.five.save({ name : "four" });
~db.five.save({ name : "five" });
db._query("FOR x IN five RETURN x").next();
~db._drop("five")
```

## `cursor.toArray()`

Returns all remaining result documents from the cursor as an array.

If no more results are available locally but more results are available on
the server, then this method makes one or multiple roundtrips to the
server to fetch them. Calling this method fully exhausts the cursor.

**Example**

```js
---
name: cursorToArray
description: |
  Get all remaining documents of a query result as an array:
---
~db._create("five");
~db.five.save({ name : "one" });
~db.five.save({ name : "two" });
~db.five.save({ name : "three" });
~db.five.save({ name : "four" });
~db.five.save({ name : "five" });
db._query("FOR x IN five RETURN x").toArray();
~db._drop("five")
```

## `cursor.count()`

Returns the total number of documents in the result set, or `undefined` if the
number is not available.

The number remains the same regardless of how many result documents have
already been fetched from the cursor.

This method only returns a number if the cursor was created with the
`count` cursor option enabled. Otherwise, it returns `undefined`.

Note that streaming cursors never return a count.

**Examples**

```js
---
name: cursorCount
description: |
  Get the total number of documents in the result set by enabling the
  `count` option:
---
db._query("FOR x IN 1..5 RETURN x", null, { count: true }).count();
```

If the `count` option is not enabled, then `count()` returns `undefined`:

```js
---
name: cursorCountUndefined
description: |
  Without the `count` option enabled, `count()` returns `undefined`:
---
db._query("FOR x IN 1..5 RETURN x").count();
```

## `cursor.getExtra()`

Returns the extra data stored for the cursor, or an empty object if there
is none.

The extra data can include the following attributes:
- `stats`: statistics about the query execution, such as the number of
  scanned documents (`scannedFull`, `scannedIndex`), the number of documents
  written (`writesExecuted`), the execution time, the peak memory usage, and
  a `fullCount` value if the `fullCount` query option was enabled.
- `warnings`: any warnings that occurred during the query execution.
- `profile`: profiling information if the `profile` query option was enabled.

**Example**

```js
---
name: cursorGetExtra
description: |
  Get the extra information about a query, such as execution statistics and
  warnings:
---
db._query("FOR x IN 1..5 RETURN x").getExtra();
```

## `cursor.cached()`

Returns whether the query result was served from the
[AQL query results cache](../../../aql/execution-and-performance/caching-query-results.md)
(`true`) or computed from scratch (`false`).

For the result of a query to be served from the cache, the query results
cache needs to be enabled and the same query needs to have been executed
and cached before.

**Example**

```js
---
name: cursorCached
description: |
  Check whether the query result was served from the query results cache:
---
db._query("FOR x IN 1..5 RETURN x", null, null, { cache: true }).cached();
db._query("FOR x IN 1..5 RETURN x", null, null, { cache: true }).cached();
```

## `cursor.stream()`

Returns whether the cursor is a streaming cursor (`true`) or not (`false`).

With a streaming cursor, the query is executed lazily as you fetch results,
instead of computing the full result set upfront. You can request a streaming
cursor with the `stream` query option.

**Example**

```js
---
name: cursorStream
description: |
  Check whether the cursor is a streaming cursor:
---
db._query("FOR x IN 1..5 RETURN x", null, null, { stream: true }).stream();
```

## `cursor.retriable()`

Returns whether the cursor is retriable (`true`) or not (`false`).

If a cursor is retriable, then fetching the next batch of results from the
server can be retried in case a previous fetch attempt failed, without
skipping or losing any results. You can request a retriable cursor with the
`allowRetry` query option.

**Example**

```js
---
name: cursorRetriable
description: |
  Check whether the fetching of result batches from the cursor can be retried:
---
db._query("FOR x IN 1..5 RETURN x", null, null, { allowRetry: true }).retriable();
```

## `cursor.dispose()`

Disposes the cursor and its results.

If you are no longer interested in any further results, you should call
`dispose()` in order to free any resources associated with the cursor.
If a server-side cursor still exists because not all batches have been fetched,
calling `dispose()` deletes it on the server, which requires a roundtrip. After
calling `dispose()`, you can no longer access the cursor.

**Example**

```js
---
name: cursorDispose
description: |
  Dispose of a cursor to free the resources associated with it:
---
var cursor = db._query("FOR x IN 1..5 RETURN x");
cursor.dispose();
```

## `cursor.toString()`

Returns a string representation of the cursor.

The string representation includes metadata about the cursor, such as the
cursor `id`, the count (for non-streaming cursors), whether the results were
cached, whether more results are available, and any warnings. It also prints
up to the first ten result documents. In _arangosh_, this is the
representation that is shown for a cursor that is not assigned to a variable.

**Example**

```js
---
name: cursorToString
description: |
  Get a string representation of the cursor:
---
db._query("FOR x IN 1..5 RETURN x").toString();
```

## `cursor.data`

The raw result data object as returned by the server.

This attribute holds the underlying server response for the current batch,
including the following attributes:
- `result`: the documents of the currently loaded batch.
- `hasMore`: whether more results are available on the server.
- `id`: the identifier of the server-side cursor (if any).
- `count`: the total number of documents (if the `count` option was enabled).
- `cached`: whether the result was served from the query results cache.
- `extra`: extra data such as statistics and warnings (see `getExtra()`).

Prefer the methods described above over accessing this attribute directly,
as the raw data is subject to change.

**Example**

```js
---
name: cursorData
description: |
  Access the raw result data object as returned by the server:
---
db._query("FOR x IN 1..5 RETURN x").data;
```
