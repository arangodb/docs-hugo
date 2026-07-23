---
title: The _cursor_ object of the JavaScript API
menuTitle: cursor object
weight: 20
description: >-
  Cursor objects let you iterate over the results of executed AQL queries
---
The JavaScript API returns _cursor_ objects when you use the following methods
of the [`db` object](db-object.md) from the `@arangodb` module:

- `db._query(...)` 
- `db._createStatement(...).execute()`

Both methods return a cursor object regardless of whether you call them
client-side or server-side, but the underlying implementation differs:

- In _arangosh_, the cursor fetches the query results from the server,
  transferring them in batches as you iterate over the cursor.
- In server-side JavaScript contexts (such as Foxx services or
  JavaScript Transactions), the results are by default computed and held in
  memory on the server. If you enable the `stream` query option, the query is
  instead executed lazily, producing results as you iterate over the cursor.

If a query returns a cursor, then you can use the `hasNext()` and `next()`
methods to iterate over the results, or call `toArray()` right away to get an
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
position. In _arangosh_, the results are buffered locally in batches; when the
current batch is exhausted and more results are available on the server,
`next()` fetches the next batch, which requires a roundtrip to the server.

If you use `next()` on an exhausted cursor, then an error is thrown in
_arangosh_, whereas `undefined` is returned in server-side JavaScript contexts.
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

Returns all remaining result documents from the cursor as an array, and fully
exhausts the cursor. In _arangosh_, this fetches any results that are not yet
available locally from the server.

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

## `cursor.dispose()`

Disposes the cursor and its results.

If you are no longer interested in any further results, you should call
`dispose()` in order to free any resources associated with the cursor.
After calling `dispose()`, you can no longer access the cursor.

## `cursor.count()`

Returns the total number of documents in the result set, or `undefined` if the
number is not available.

The number remains the same regardless of how many result documents have
already been fetched from the cursor.

In _arangosh_, this method only returns a number if the cursor was created with the
`count` cursor option enabled. Otherwise, it returns `undefined`.

Note that streaming cursors never return a count.

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
