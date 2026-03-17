---
title: Transactions in ArangoDB
menuTitle: Transactions
weight: 260
description: >-
  ArangoDB provides support for user-definable transactions
---
## Transaction Types

ArangoDB offers different types of transactions:

- AQL queries (with exceptions)
- Stream Transactions

### AQL Queries

<!-- TODO
read own writes (UPSERT?), intermediate commits
-->

### Stream Transactions

[Stream Transactions](stream-transactions.md) allow you to perform
multi-document transactions with individual begin and commit / abort commands.
They work similar to the *BEGIN*, *COMMIT*, and *ROLLBACK* operations in
relational database systems.

The client is responsible for making sure that transactions are committed or
aborted when they are no longer needed, to avoid taking up resources.

## Transactional Properties

Transactions in ArangoDB are atomic, consistent, isolated, and durable (*ACID*).

These *ACID* properties provide the following guarantees:

- The *atomicity* principle makes transactions either complete in their
  entirety or have no effect at all.
- The *consistency* principle ensures that no constraints or other invariants
  are violated during or after any transaction. A transaction never
  corrupts the database.
- The *isolation* property hides the modifications of a transaction from
  other transactions until the transaction commits.
- Finally, the *durability* proposition makes sure that operations from
  transactions that have committed are made persistent. The amount of
  transaction durability is configurable in ArangoDB, as is the durability
  on collection level.

The descriptions in this section only provide a general overview. The actual
transactional guarantees depend on the deployment mode and usage pattern.

Also see:
- [Operation Atomicity](../operational-factors.md#operation-atomicity) for more details on atomicity guarantees
- [Transactional Isolation](../operational-factors.md#transactional-isolation) for more details on isolation guarantees in the single server
  and OneShard database case
- [Cluster Transaction Limitations](limitations.md#in-clusters)
  for more details on the transactional behavior of multi-document transactions in
  cluster deployments

## Limitations of transactions

<!-- TODO: Update for RocksDB -->

### In general

Transactions in ArangoDB have been designed with particular use cases
in mind. They are mainly for **short and small** data retrieval operations,
modification operations, or both.

The implementation is **not** optimized for **very long-running** or
**very voluminous** operations, and may not be usable for these cases.

One limitation is that a transaction operation information must fit into main
memory. The transaction information consists of record pointers, revision numbers
and rollback information. The actual data modification operations of a transaction
are written to the write-ahead log and do not need to fit entirely into main
memory.

Ongoing transactions also prevent the write-ahead logs from being fully
garbage-collected. Information in the write-ahead log files cannot be written
to collection data files or be discarded while transactions are ongoing.

To ensure progress of the write-ahead log garbage collection, transactions should
be kept as small as possible, and big transactions should be split into multiple
smaller transactions.

Transactions in ArangoDB cannot be nested, i.e. a transaction must not start another
transaction. If an attempt is made to create a transaction from inside a running
transaction, the server throws error `1651` (nested transactions detected).

It is also disallowed to execute user transaction on some of ArangoDB's own system
collections. This shouldn't be a problem for regular usage as system collections
don't contain user data and there is no need to access them from within a user
transaction.

Some operations are not allowed inside transactions in general:

- creation and deletion of databases (`db._createDatabase()`, `db._dropDatabase()`)
- creation and deletion of collections (`db._create()`, `db._drop()`, `db.<collection>.rename()`)
- creation and deletion of indexes (`db.<collection>.ensureIndex()`, `db.<collection>.dropIndex()`)

If an attempt is made to carry out any of these operations during a transaction,
ArangoDB aborts the transaction with error code `1653`
(disallowed operation inside transaction).

Finally, all collections that may be modified during a transaction must be
declared beforehand, i.e. using the `collections` attribute of the object passed
to the `db._createTransaction()` function when starting a Stream Transaction. If any attempt is made to carry out a data
modification operation on a collection that was not declared in the `collections`
attribute, the transaction aborts and ArangoDB throws error `1652`
(unregistered collection used in transaction).
It is legal to not declare read-only collections, but this should be avoided if
possible to reduce the probability of deadlocks and non-repeatable reads.

### Transactions in cluster deployments

Using a single instance of ArangoDB (or a OneShard database in a
cluster), multi-document / multi-collection queries are guaranteed to be
fully ACID in the
[traditional sense](https://en.wikipedia.org/wiki/ACID_(computer_science)).
For more details see
[Operation Atomicity](../operational-factors.md#operation-atomicity)
and
[Transactional Isolation](../operational-factors.md#transactional-isolation).
This is more than many other NoSQL database systems support.
In cluster mode, single-document operations are also *fully ACID*.

Multi-document / multi-collection queries and transactions offer different guarantees.
Understanding these differences is important when designing applications that need
to be resilient against outages of individual servers.

Cluster transactions share the underlying characteristics of the
[storage engine](../../components/arangodb-server/storage-engine.md) that is used for the cluster deployment.
A transaction started on a Coordinator translates to one transaction per involved DB-Server.
The guarantees and characteristics of the given storage-engine apply additionally
to the cluster specific information below.
Please refer to [Locking and isolation of transactions](#locking-and-isolation-of-transactions) for more details
on the storage-engines.

#### Atomicity

A transaction on *one DB-Server* is either committed completely or not at all.

ArangoDB transactions do currently not require any form of global consensus. This makes
them relatively fast, but also vulnerable to unexpected server outages.

Should a transaction involve [Leader Shards](../../deploy/cluster/_index.md#db-servers)
on *multiple DB-Servers*, the atomicity of the distributed transaction *during the commit operation*
cannot be guaranteed. Should one of the involved DB-Servers fail during the commit the transaction
is not rolled-back globally, sub-transactions may have been committed on some DB-Servers, but not on others.
Should this case occur, the client application sees an error.

An improved failure handling issue might be introduced in future versions.

#### Consistency

ArangoDB provides consistency even in the cluster. A transaction never leaves
the data in an incorrect or corrupt state.

In a cluster deployment, there is always exactly one DB-Server responsible for
a given shard. The locking procedure in the RocksDB storage engine ensures that
dependent transactions (in the sense that the transactions modify the same
documents or unique index entries) are ordered sequentially.
Therefore we can provide [Causal-Consistency](https://en.wikipedia.org/wiki/Consistency_model#Causal_consistency)
for your transactions.

From the applications point-of-view this also means that a given transaction can always
[read its own writes](https://en.wikipedia.org/wiki/Consistency_model#Read-your-writes_consistency).
Other concurrent operations don't change the database state seen by a transaction.

#### Isolation

The ArangoDB Cluster provides **Local Snapshot Isolation**. This means that all
operations and queries in the transactions see the same version, or snapshot,
of the data on a given DB-Server. This snapshot is based on the state of the
data at the moment in time when the transaction begins **on that DB-Server**.

#### Durability

It is guaranteed that successfully committed transactions are persistent. Using
replication, `waitForSync`, or both, increases the durability
(just as with the single server).

### Size and time limits

#### Intermediate commits

[Intermediate commits](../../aql/fundamentals/limitations.md#storage-engine-properties)
that would automatically split and commit parts of big transactions are
**disabled** for Stream Transactions in the RocksDB storage engine, including
AQL queries that run inside of such transactions.

#### Limits for Stream Transactions

Stream Transactions enforce a maximum lifetime and transaction size.
See [Stream Transactions](stream-transactions.md#timeout-and-transaction-size)
for details.

## Durability of transactions

Transactions are executed until there is either a rollback
or a commit. On rollback, the operations from the transaction are reversed.

The RocksDB storage engine applies operations of a transaction in main memory
only until they are committed. In case of an a rollback the entire transaction
is just cleared, no extra rollback steps are required.

<!-- TODO: point out data loss (query accepted by server, but will be lost) -->
<!-- TODO: intermediate commits?! -->

In the event of a server crash, the storage engine scans the write-ahead log
to restore certain meta-data like the number of documents in collection
or the selectivity estimates of secondary indexes.

<!-- TODO: obsolete? -->
There is thus the potential risk of losing data between the commit of the
transaction and the actual (delayed) disk synchronization. This is the same as
writing into collections that have the `waitForSync` property set to `false`
outside of a transaction.
In case of a crash with `waitForSync` set to false, the operations performed in
the transaction are either visible completely or not at all, depending on
whether the delayed synchronization had kicked in or not.

To ensure durability of transactions on a collection that have the `waitForSync`
property set to `false`, you can set the `waitForSync` attribute of the object
that is passed to `db._createTransaction()`. This forces a synchronization of the
transaction to disk even for collections that have `waitForSync` set to `false`:

```js
var trx = db._createTransaction({
  collections: { write: "users" },
  waitForSync: true
});
// Perform operations like trx.save(), trx.update(), trx.query() ...
trx.commit();
```

An alternative is to perform an individual operation with an explicit
`waitForSync` request (if supported) in a transaction. Example:

```js
trx.collection("users").save({ _key: "1234" }, { waitForSync: true });
```

In this case, the `waitForSync` option makes the whole transaction be synchronized
to disk at the commit. <!-- TODO: Is this true for Stream Transactions? -->

In any case, ArangoDB gives you the choice of whether or not you want full
durability for single collection transactions. Using the delayed synchronization
(i.e. `waitForSync` with a value of `false`) potentially increases throughput
and performance of transactions, but introduces the risk of losing the last
committed transactions in the case of a crash.

When using `db._createTransaction()` with `waitForSync` set to `true`, the call to
`trx.commit()` only returns after the data of all modified collections has been
synchronized to disk and the transaction has been made fully durable. This not
only reduces the risk of losing data in case of a crash but also ensures
consistency after a restart.

## Locking and isolation of transactions

Transactions need to specify from which collections they will read data and which
collections they intend to modify. This can be done by setting the `read`, `write`,
or `exclusive` attributes in the `collections` attribute when starting a Stream
Transaction:

```js
var trx = db._createTransaction({
  collections: {
    read: "users",
    write: ["test", "log"]
  }
});
trx.query(`FOR doc IN users RETURN doc`).toArray().forEach(function(doc) {
  trx.collection("log").insert({ value: "removed user: " + doc.name });
  trx.collection("test").remove(doc._key);
});
trx.commit();
```

<!-- TODO: does write access imply read access in RocksDB? -->
*write* here means write access to the collection, and also includes any read accesses.

*exclusive* means exclusive write access to the collection, and *write* means (shared)
write access to the collection, which can be interleaved with write accesses by other
concurrent transactions.

### Storage engine

The RocksDB storage engine does not lock any collections participating in a transaction
for read. Read operations can run in parallel to other read or write operations on the
same collections.

#### Locking

For all collections that are used in write mode, the RocksDB engine internally
acquires a (shared) read lock. This means that many writers can modify data in the same
collection in parallel (and also run in parallel to ongoing reads). However, if two
concurrent transactions attempt to modify the same document or index entry, there
is a write-write conflict, and one of the transactions aborts with error `1200`
(conflict). It is then up to client applications to retry the failed transaction or
accept the failure. <!-- TODO: Stream Transactions require explicitly abort! -->

In order to guard long-running or complex transactions against concurrent operations
on the same data, the RocksDB engine allows you to access collections in exclusive mode.
Exclusive accesses internally acquire a write-lock on the collections, so that they
are not executed in parallel with any other write operations. Read operations can still
be carried out by other concurrent transactions.

#### Isolation

The RocksDB storage-engine provides **snapshot isolation**. This means that all operations
and queries in the transactions see the same version, or snapshot, of the database.
This snapshot is based on the state of the database at the moment in time when the transaction
begins. No locks are acquired on the underlying data to keep this snapshot, which permits
other transactions to execute without being blocked by an older uncompleted transaction
(so long as they do not try to modify the same documents or unique index-entries concurrently).
In the cluster a snapshot is acquired on each DB-Server individually.

### Lazily adding collections

There might be situations when declaring all collections a priori is not possible,
for example, because further collections are determined by a dynamic AQL query
inside the transaction, for example a query using AQL graph traversal.

In this case, it would be impossible to know beforehand which collection to lock, and
thus it is legal to not declare collections that will be accessed in the transaction in
read-only mode. Accessing a non-declared collection in read-only mode during a
transaction adds the collection to the transaction lazily, and fetches data
from the collection as usual. However, as the collection is added lazily, there is no
isolation from other concurrent operations or transactions. Reads from such
collections are potentially non-repeatable.

**Examples:**

```js
var trx = db._createTransaction({
  collections: { read: "users" }
});
/* Execute an AQL query that traverses an anonymous graph starting at a "users" node.
   It is yet unknown into which other collections the query might traverse */
trx.query(`FOR v IN ANY "users/1234" connections RETURN v`).toArray().forEach(function (d) {
  /* ... */
});
trx.commit();
```

This automatic lazy addition of collections to a transaction also introduces the
possibility of deadlocks. Deadlocks may occur if there are concurrent transactions
that try to acquire locks on the same collections lazily.

In order to make a transaction fail when a non-declared collection is used inside
a transaction for reading, the optional `allowImplicit` sub-attribute of
`collection` can be set to `false`:

```js
var trx = db._createTransaction({
  collections: {
    read: "users",
    allowImplicit: false
  }
});
/* The below query now fails because the collection "connections" has not
   been specified in the list of collections used by the transaction */
trx.query(`FOR v IN ANY "users/1234" connections RETURN v`).toArray().forEach(function (d) {
  /* ... */
});
trx.abort();
```

The default value for `allowImplicit` is `true`. Write-accessing collections that
have not been declared in the `collections` array is never possible, regardless of
the value of `allowImplicit`.

If `users/1234` has an edge in `connections`, linking it to another document in
the `users` collection, then the following explicit declaration works:

```js
var trx = db._createTransaction({
  collections: {
    read: ["users", "connections"],
    allowImplicit: false
  }
});
// Perform operations like trx.save(), trx.update(), trx.query() ...
trx.commit();
```

However, if the edge points to a document in another collection, then the query
fails, unless that other collection is added to the declaration as well.

Note that if a document handle is used as starting point for a traversal, e.g.
`FOR v IN ANY "users/not_linked" ...` or `FOR v IN ANY {_id: "users/not_linked"} ...`,
then no error is raised in the case of the start node not having any edges to
follow, with `allowImplicit` set to `false` and the `users` collection not being
declared for read access.
AQL only sees a string and does not consider it a read access, unless there are
edges connected to it. `FOR v IN ANY DOCUMENT("users/not_linked") ...` fails
even without edges, as it is always considered to be a read access to the `users`
collection.

### Deadlocks and Deadlock detection

<!-- TODO: Obsolete? -->

A deadlock is a situation in which two or more concurrent operations
(user transactions or AQL queries) try to access the same resources
(collections, documents) and need to wait for the others to finish, but none of
them can make any progress.

A good example for a deadlock is two concurrently executing transactions
T1 and T2 that try to access the same collections but that need to wait for each
other. In this example, transaction T1 writes to collection `c1`, but also reads
documents from collection `c2` without announcing it:

```js
var trxT1 = db._createTransaction({
  collections: { write: "c1" }
});
/* write into c1 (announced) */
trxT1.collection("c1").insert({ foo: "bar" });

/* some operation here that takes long to execute... */

/* read from c2 (unannounced) */
trxT1.query(`FOR doc IN c2 RETURN doc`).toArray();
trxT1.commit();
```

Transaction T2 announces to write into collection `c2`, but also reads
documents from collection `c1` without announcing it:

```js
var trxT2 = db._createTransaction({
  collections: { write: "c2" }
});
/* write into c2 (announced) */
trxT2.collection("c2").insert({ bar: "baz" });

/* some operation here that takes long to execute... */

/* read from c1 (unannounced) */
trxT2.query(`FOR doc IN c1 RETURN doc`).toArray();
trxT2.commit();
```

In the above example, a deadlock occurs if transaction T1 and T2 have both
acquired their write locks (T1 for collection `c1` and T2 for collection `c2`)
and are then trying to read from the other (T1 reads from `c2`, T2 reads from `c1`).
T1 then tries to acquire the read lock on collection `c2`, which
is prevented by transaction T2. However, T2 waits for the read lock on
collection `c1`, which is prevented by transaction T1.

In case of such a deadlock, there would be no progress for any of the involved
transactions, and none of the involved transactions could ever complete. This is
completely undesirable, so the automatic deadlock detection mechanism in ArangoDB
automatically aborts one of the transactions involved in such a deadlock situation.
Aborting means that all changes done by the transaction are rolled back and
error `29` (deadlock detected) is returned.

Client code (AQL queries, user transactions) that accesses more than one collection
should be aware of the potential of deadlocks and should handle the error `29`
(deadlock detected) properly, either by passing the exception to the caller or
retrying the operation.

To avoid both deadlocks and non-repeatable reads, all collections used in a
transaction should be specified in the `collections` attribute when known in advance.
In case this is not possible because collections are added dynamically inside the
transaction, deadlocks may occur and the deadlock detection may kick in and abort
the transaction.

The RocksDB storage engine uses document-level locks and therefore doesn't have a deadlock
problem on collection level. However, if two concurrent transactions modify the same
documents or index entries, the RocksDB engine signals a write-write conflict
and aborts one of the transactions with error `1200` (conflict) automatically.
