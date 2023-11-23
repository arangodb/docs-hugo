---
title: '`UPSERT` operation in AQL'
menuTitle: UPSERT
weight: 70
description: >-
  The `UPSERT` operations either modifies an existing document, or creates a new
  document if it does not exist
archetype: default
---
Each `UPSERT` operation is restricted to a single collection, and the 
[collection name](../../concepts/data-structure/collections.md#collection-names) must not be dynamic.
Only a single `UPSERT` statement per collection is allowed per AQL query, and 
it cannot be followed by read or write operations that access the same collection, by
traversal operations, or AQL functions that can read documents.

## Syntax

The syntax for upsert and repsert operations is:

<pre><code>UPSERT <em>searchExpression</em>
INSERT <em>insertExpression</em>
UPDATE <em>updateExpression</em>
IN <em>collection</em></code></pre>

<pre><code>UPSERT <em>searchExpression</em>
INSERT <em>insertExpression</em>
REPLACE <em>updateExpression</em>
IN <em>collection</em></code></pre>

Both variants can optionally end with an `OPTIONS { … }` clause.

When using the `UPDATE` variant of the upsert operation, the found document
will be partially updated, meaning only the attributes specified in
*updateExpression* will be updated or added. When using the `REPLACE` variant
of upsert (repsert), existing documents will be replaced with the contexts of
*updateExpression*.

Updating a document will modify the document's revision number with a server-generated value.
The system attributes `_id`, `_key` and `_rev` cannot be updated, `_from` and `_to` can.

The *searchExpression* contains the document to be looked for. It must be an object 
literal without dynamic attribute names. In case no such document can be found in
*collection*, a new document will be inserted into the collection as specified in the
*insertExpression*. 

In case at least one document in *collection* matches the *searchExpression*, it will
be updated using the *updateExpression*. When more than one document in the collection
matches the *searchExpression*, it is undefined which of the matching documents will
be updated. It is therefore often sensible to make sure by other means (such as unique 
indexes, application logic etc.) that at most one document matches *searchExpression*.

The following query will look in the *users* collection for a document with a specific
*name* attribute value. If the document exists, its *logins* attribute will be increased
by one. If it does not exist, a new document will be inserted, consisting of the
attributes *name*, *logins*, and *dateCreated*:

```aql
UPSERT { name: 'superuser' } 
INSERT { name: 'superuser', logins: 1, dateCreated: DATE_NOW() } 
UPDATE { logins: OLD.logins + 1 } IN users
```

Note that in the `UPDATE` case it is possible to refer to the previous version of the
document using the `OLD` pseudo-value.

## Query options

### `ignoreErrors`

The `ignoreErrors` option can be used to suppress query errors that may occur
when trying to violate unique key constraints.

### `keepNull`

When updating an attribute to the `null` value, ArangoDB does not remove the
attribute from the document but stores this `null` value. To remove attributes
in an update operation, set them to `null` and set the `keepNull` option to
`false`. This removes the attributes you specify but not any previously stored
attributes with the `null` value:

```aql
UPSERT { _key: "mary" }
INSERT { _key: "mary", name: "Mary", notNeeded: 123 }
UPDATE { foobar: true, notNeeded: null }
IN users OPTIONS { keepNull: false }
```

If no document with the key `mary` exists, the above query creates such a user
document with a `notNeeded` attribute. If it exists already, it removes the
`notNeeded` attribute from the document and updates the `foobar` attribute
normally.

Only top-level attributes and sub-attributes can be removed this way
(e.g. `{ attr: { sub: null } }`) but not attributes of objects that are nested
inside of arrays (e.g. `{ attr: [ { nested: null } ] }`).

### `mergeObjects`

The option `mergeObjects` controls whether object contents will be
merged if an object attribute is present in both the `UPDATE` query and in the 
to-be-updated document.

{{< tip >}}
The default value for `mergeObjects` is `true`, so there is no need to specify it
explicitly.
{{< /tip >}}

### `waitForSync`

To make sure data are durable when an update query returns, there is the `waitForSync` 
query option.

### `ignoreRevs`

In order to not accidentally update documents that have been written and updated since 
you last fetched them you can use the option `ignoreRevs` to either let ArangoDB compare 
the `_rev` value and only succeed if they still match, or let ArangoDB ignore them (default):

```aql
FOR i IN 1..1000
  UPSERT { _key: CONCAT('test', i)}
    INSERT {foobar: false}
    UPDATE {_rev: "1287623", foobar: true }
  IN users OPTIONS { ignoreRevs: false }
```

{{< info >}}
You need to add the `_rev` value in the *updateExpression*. It will not be used
within the *searchExpression*. Even worse, if you use an outdated `_rev` in the
*searchExpression*, `UPSERT` will trigger the `INSERT` path instead of the
`UPDATE` path, because it has not found a document exactly matching the
*searchExpression*.
{{< /info >}}

### `exclusive`

The RocksDB engine does not require collection-level locks. Different write
operations on the same collection do not block each other, as
long as there are no _write-write conflicts_ on the same documents. From an application
development perspective it can be desired to have exclusive write access on collections,
to simplify the development. Note that writes do not block reads in RocksDB.
Exclusive access can also speed up modification queries, because we avoid conflict checks.

Use the `exclusive` option to achieve this effect on a per query basis:

```aql
FOR i IN 1..1000
  UPSERT { _key: CONCAT('test', i) }
  INSERT { foobar: false }
  UPDATE { foobar: true }
  IN users OPTIONS { exclusive: true }
```

### `indexHint`

The `indexHint` option will be used as a hint for the document lookup
performed as part of the `UPSERT` operation, and can help in cases such as
`UPSERT` not picking the best index automatically.

```aql
UPSERT { a: 1234 }
  INSERT { a: 1234, name: "AB" }
  UPDATE { name: "ABC" } IN myCollection
  OPTIONS { indexHint: "index_name" }
```

The index hint is passed through to an internal `FOR` loop that is used for the
lookup. Also see [`indexHint` Option of the `FOR` Operation](for.md#indexhint).

### `forceIndexHint`

Makes the index or indexes specified in `indexHint` mandatory if enabled. The
default is `false`. Also see
[`forceIndexHint` Option of the `FOR` Operation](for.md#forceindexhint).

```aql
UPSERT { a: 1234 }
  INSERT { a: 1234, name: "AB" }
  UPDATE { name: "ABC" } IN myCollection
  OPTIONS { indexHint: … , forceIndexHint: true }
```

## Returning documents

`UPSERT` statements can optionally return data. To do so, they need to be followed
by a `RETURN` statement (intermediate `LET` statements are allowed, too). These statements
can optionally perform calculations and refer to the pseudo-values `OLD` and `NEW`.
In case the upsert performed an insert operation, `OLD` will have a value of `null`.
In case the upsert performed an update or replace operation, `OLD` will contain the
previous version of the document, before update/replace.

`NEW` will always be populated. It will contain the inserted document in case the
upsert performed an insert, or the updated/replaced document in case it performed an
update/replace.

This can also be used to check whether the upsert has performed an insert or an update 
internally:

```aql
UPSERT { name: 'superuser' } 
INSERT { name: 'superuser', logins: 1, dateCreated: DATE_NOW() } 
UPDATE { logins: OLD.logins + 1 } IN users
RETURN { doc: NEW, type: OLD ? 'update' : 'insert' }
```

## Transactionality and Limitations

- On a single server, upserts are generally executed transactionally in an
  all-or-nothing fashion.

  For sharded collections in cluster deployments, the entire query and/or upsert
  operation may not be transactional, especially if it involves different shards,
  DB-Servers, or both.

- Queries may execute intermediate transaction commits in case the running
  transaction (AQL query) hits the specified size thresholds. This writes the
  data that has been modified so far and it is not rolled back in case of a later
  abort/rollback of the transaction.
  
  Such  **intermediate commits** can occur for `UPSERT` operations over all
  documents of a large collection, for instance. This has the side-effect that
  atomicity of this operation cannot be guaranteed anymore and ArangoDB cannot
  guarantee that "read your own writes" in upserts work.

  This is only an issue if you write a query where your search condition would
  hit the same document multiple times, and only if you have large transactions.
  You can adjust the behavior of the RocksDB storage engine by increasing the
  `intermediateCommit` thresholds for data size and operation counts.

- The lookup and the insert/update/replace parts are executed one after
  another, so that other operations in other threads can happen in
  between. This means if multiple `UPSERT` queries run concurrently, they
  may all determine that the target document does not exist and then
  create it multiple times!

  Note that due to this gap between the lookup and insert/update/replace,
  even with a unique index, duplicate key errors or conflicts can occur.
  But if they occur, the application/client code can execute the same query
  again.

  To prevent this from happening, you should add a unique index to the lookup
  attribute(s). Note that in the cluster a unique index can only be created if
  it is equal to the shard key attribute of the collection or at least contains
  it as a part.

  An alternative to making an UPSERT statement work atomically is to use the
  `exclusive` option to limit write concurrency for this collection to 1, which
  helps avoiding conflicts but is bad for throughput!

- `UPSERT` operations do not observe their own writes correctly in cluster
  deployments. They only do for OneShard databases with the `cluster-one-shard`
  optimizer rule active.

  If upserts in a query create new documents and would then semantically hit the
  same documents again, the operation may incorrectly use the `INSERT` branch to
  create more documents instead of the `UPDATE`/`REPLACE` branch to update the
  previously created documents.

  If upserts find existing documents for updating/replacing, you can access the
  current document via the `OLD` pseudo-variable, but this may hold the initial
  version of the document from before the query even if it has been modified
  by `UPSERT` in the meantime.

- The lookup attribute(s) from the search expression should be indexed in order
  to improve the `UPSERT` performance. Ideally, the search expression contains the
  shard key, as this allows the lookup to be restricted to a single shard.
