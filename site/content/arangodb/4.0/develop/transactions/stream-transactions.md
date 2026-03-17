---
title: Stream Transactions
menuTitle: Stream Transactions
weight: 10
description: >-
  Stream Transactions allow you start a transaction, run multiple operations
  like AQL queries over a short period of time, and then commit or abort the
  transaction
---
Stream Transactions allow you to perform multi-document transaction
with individual begin and commit / abort commands. This is comparable to the
*BEGIN*, *COMMIT* and *ROLLBACK* operations found in relational database systems.

Stream Transaction work in conjunction with other operations in ArangoDB.
Supported operations include:

- Read and write documents
- Get the number of documents of collections
- Truncate collections
- Run AQL queries

You **always need to start the transaction first** and explicitly specify the
collections used for write accesses upfront. You need to make sure that the
transaction is committed or aborted when it is no longer needed.
This avoids taking up resources on the ArangoDB server.

{{< warning >}}
Transactions acquire collection locks for write operations in RocksDB.
It is therefore advisable to keep the transactions as short as possible.
{{< /warning >}}

For a more detailed description of how transactions work in ArangoDB, please
refer to [Transactions](_index.md).

You can use Stream Transactions via the [JavaScript API](#javascript-api) and
the [HTTP API](../http-api/transactions/stream-transactions.md).

## Limitations

### Timeout and transaction size

A maximum lifetime and transaction size for Stream Transactions is enforced
on the Coordinator to ensure that abandoned transactions cannot block the
cluster from operating properly:

- Maximum idle timeout of up to **120 seconds** between operations.
- Maximum transaction size with a default of **512 MiB** (per DB-Server in clusters).

These limits are also enforced for Stream Transactions on single servers.

The maximum size for a single Stream Transaction can be adjusted with the
`--transaction.streaming-max-transaction-size` startup option.

The default maximum idle timeout is **60 seconds** between operations in a
single Stream Transaction. The maximum value can be bumped up to at most 120
seconds by setting the `--transaction.streaming-idle-timeout` startup option.
Posting an operation into a non-expired Stream Transaction resets the
transaction's timeout to the configured idle timeout.

Enforcing the limit is useful to free up resources used by abandoned
transactions, for example from transactions that are abandoned by client
applications due to programming errors or that were left over because client
connections were interrupted.

### Concurrent requests

A given transaction is intended to be used **serially**. No concurrent requests
using the same transaction ID should be issued by the client. The server can
make some effort to serialize certain operations (see
[Streaming Lock Timeout](../../components/arangodb-server/options.md#--transactionstreaming-lock-timeout)),
however, this degrades the server's performance and may lead to sporadic
errors with code `28` (locked).

### Declaration of Collections

All collections participating in a transaction need to be declared
beforehand. This is necessary to ensure proper locking and isolation.

Collections can be used in a transaction in write mode or in read-only mode.
<!-- TODO: exclusive -->

If any data modification operations are to be executed, the collection must be
declared for use in write mode. The write mode allows modifying and reading data
from the collection during the transaction (i.e. the write mode includes the
read mode).

Contrary, using a collection in read-only mode will only allow performing
read operations on a collection. Any attempt to write into a collection used
in read-only mode will make the transaction fail.

Collections for a transaction are declared by providing them in the `collections`
attribute of the object passed to the `_executeTransaction()` function. The
`collections` attribute can have the sub-attributes `read`, `write`, and
`exclusive`:

```js
db._executeTransaction({
  collections: {
    write: [ "users", "logins" ],
    read: [ "recommendations" ]
  }
});
```

`read`, `write`, and `exclusive` are optional attributes, and only need to be
specified if the operations inside the transactions demand for it.

The attribute values can each be lists of collection names or a single
collection name (as a string):

```js
db._executeTransaction({
  collections: {
    write: "users",
    read: "recommendations"
  }
});
```

**Note**: It is optional to specify collections for read-only access by default.
Even without specifying them, it is still possible to read from such collections
from within a transaction, but with relaxed isolation. Please read about
[transactions locking](_index.md#locking-and-isolation-of-transactions) for more details.

In order to make a transaction fail when a non-declared collection is used inside
for reading, the optional `allowImplicit` sub-attribute of `collections` can be
set to `false`:

```js
db._executeTransaction({
  collections: {
    read: "recommendations",
    allowImplicit: false  /* this disallows read access to other collections
                             than specified */
  },
  action: function () {
    var db = require("@arangodb").db;
    return db.foobar.toArray(); /* will fail because db.foobar must not be accessed
                                   for reading inside this transaction */
  }
});
```

The default value for `allowImplicit` is `true`. Write-accessing collections that
have not been declared in the `collections` array is never possible, regardless of
the value of `allowImplicit`.

## Handling errors

If individual ops fail, either handle errors or abort transaction - no auto abort!

## JavaScript API

### Create Transaction

`db._createTransaction(options) → trx`

Begin a Stream Transaction.

`options` must be an object with the following attributes:

- `collections`: A sub-object that defines which collections you want to use
  in the transaction. It can have the following sub-attributes:
  - `read`: A single collection or a list of collections to use in the
    transaction in read-only mode.
  - `write`: A single collection or a list of collections to use in the
    transaction in write or read mode.
  - `exclusive`: A single collection or a list of collections to acquire
    exclusive write access for.

  Collections that will be written to in the transaction must be declared with
  the `write` or `exclusive` attribute or it will fail, whereas non-declared
  collections from which is solely read will be added lazily. You can set the
  `allowImplicit` option to `false` to let transactions fail in case of
  undeclared collections for reading. Collections for reading should be fully
  declared if possible, to avoid deadlocks.

Additionally, `options` can have the following optional attributes:

- `allowImplicit`: Allow reading from undeclared collections.
- `waitForSync`: An optional boolean flag that, if set, forces the
  transaction to write all data to disk before returning.
- `lockTimeout`: A numeric value that can be used to set a timeout in seconds for
  waiting on collection locks. This option is only meaningful when using
  `exclusive` locks. If not specified, a default value is used. Setting
  `lockTimeout` to `0` makes ArangoDB not time out waiting for a lock.
- `maxTransactionSize`: Transaction size limit in bytes. Can be at most the
  value of the `--transaction.streaming-max-transaction-size` startup option.
- `skipFastLockRound`: Whether to disable fast locking for write operations
  (default: `false`).

  Skipping the fast lock round can be faster overall if there are many concurrent
  Stream Transactions queued that all try to lock the same collection exclusively.
  It avoids deadlocking and retrying which can occur with the fast locking by
  guaranteeing a deterministic locking order at the expense of each actual
  locking operation taking longer.

  Fast locking should not be skipped for read-only Stream Transactions because
  it degrades performance if there are no concurrent transactions that use
  exclusive locks on the same collection.

The method returns an object that lets you run supported operations as part of
the transactions, get the status information, and commit or abort the transaction.

The following example shows how you can remove a document from a collection and
create a new document in the same collection using a Stream Transaction:

```js
---
name: jsStreamTransaction_1
description: ''
---
~db._create("tasks");
~db.tasks.save({ _key: "123", type: "sendEmail", date: "2022-07-07T15:20:00.000Z" });
var coll = "tasks";
var trx = db._createTransaction({ collections: { write: [coll] } });
var task = trx.query(`FOR t IN @@coll SORT t.date DESC LIMIT 1 RETURN t`, {"@coll": coll}).toArray()[0];
if (task) {
  print(task);
  trx.collection(coll).remove(task._key);
  var newTask = trx.collection(coll).save({ _key: "124", type: task.type, date: new Date().toISOString() }, { returnNew: true }).new;
  print(newTask);
  trx.commit();
} else {
  trx.abort();
}
trx.status();
~db._drop("tasks");
```

### Commit

`trx.commit() → status`

Commit a Stream Transaction and return the [status](#status).

All changes done by the transaction are persisted.

Committing is an idempotent operation. It is not an error to commit a transaction
more than once.

### Abort

`trx.abort() → status`

Abort a Stream Transaction and return the [status](#status).

All operations performed in the transaction are rolled back, reverting all
changes as if the transaction never happened. As required by the *consistency*
principle, aborting a transaction also restores secondary indexes to the state
at transaction start.

Aborting is an idempotent operation. It is not an error to abort a transaction
more than once.

### Collection

`trx.collection(collection-name) → coll`

Return a collection object for the specified collection, or null if it does not
exist.

The object lets you access the following methods to perform document and
collection operations:

- [`count()`](../javascript-api/@arangodb/collection-object.md#collectioncount)
- [`document()`](../javascript-api/@arangodb/collection-object.md#collectiondocumentobject--options)
- [`exists()`](../javascript-api/@arangodb/collection-object.md#collectionexistsobject--options)
- [`insert()`](../javascript-api/@arangodb/collection-object.md#collectioninsertdata--options)
- [`name()`](../javascript-api/@arangodb/collection-object.md#collectionname)
- [`remove()`](../javascript-api/@arangodb/collection-object.md#collectionremoveobject)
- [`replace()`](../javascript-api/@arangodb/collection-object.md#collectionreplacedocument-data--options)
- [`save()`](../javascript-api/@arangodb/collection-object.md#collectionsavedata--options)
- [`truncate()`](../javascript-api/@arangodb/collection-object.md#collectiontruncateoptions)
- [`update()`](../javascript-api/@arangodb/collection-object.md#collectionupdatedocument-data--options)

Compared to the collection object returned by `db._collection()`, only a subset
of methods is available, and the operations are executed as part of the
Stream Transactions, but they work the same otherwise.

### Query

`trx.query(aql-query) → cursor`

Run an AQL query as part of a Stream Transaction and return a result cursor.
The method works similar to the
[`db._query()` method](../../aql/how-to-invoke-aql/with-arangosh.md#with-db_query).

### ID

`trx.id() → id`

Get the identifier of the Stream Transaction.

### Running

`trx.running() → bool`

Return a boolean that indicates whether the Stream Transaction is on-going.

### Status

`trx.status() → status`

Return an object with the status information of the Stream Transaction.
The object has the following attributes:

- `id`: The identifier of the Stream Transaction.
- `status`: The status of the Stream Transaction.
  One of `"running"`, `"committed"`, or `"aborted"`.

## HTTP API

See the [HTTP Interface for Stream Transactions](../http-api/transactions/stream-transactions.md)
documentation.
