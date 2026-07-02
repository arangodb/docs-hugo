---
title: Limitations of transactions
menuTitle: Limitations
weight: 25
description: ''
---
<!-- TODO: Update for RocksDB -->

## In General

Transactions in ArangoDB have been designed with particular use cases
in mind. They are mainly for **short and small** data retrieval operations
modification operations, or both.

The implementation is **not** optimized for **very long-running** or
**very voluminous** operations, and may not be usable for these cases.

One limitation is that transaction operations and transaction metadata must
fit into main memory. The actual data modification operations of a transaction
are only written to the write-ahead log on commit and therefore need to fit
entirely into main memory.

Ongoing transactions also prevent the write-ahead logs from being fully
garbage-collected. Information in the write-ahead log files cannot be written
to collection data files or be discarded while transactions are ongoing.

To ensure progress of the write-ahead log garbage collection, transactions should
be kept as small as possible, and big transactions should be split into multiple
smaller transactions.

Transactions in ArangoDB cannot be nested, i.e. you cannot start another
Stream Transaction inside of a Stream Transaction. It simply starts a separate
Stream Transaction if you try to. A JavaScript Transaction must not start another 
transaction either. If an attempt is made to call a transaction from inside a
running JavaScript Transaction, the server throws error `1651`
(nested transactions detected).

It is disallowed to execute user transaction on some of ArangoDB's own system
collections. This shouldn't be a problem for regular usage as system collections
don't contain user data and there is no need to access them from within a user
transaction.

Some operations are not allowed inside transactions in general:

- Creation and deletion of databases
- Creation and deletion of collections and Views
- Creation and deletion of indexes
- Other data definition operations

If you try to run such operations as part of a Stream Transaction, ArangoDB
executes them independent of the transaction without warning. In case of
JavaScript Transactions, ArangoDB aborts the transaction with error code `1653`
(disallowed operation inside transaction).

Finally, all collections that may be modified during a transaction must be 
declared beforehand, i.e. using the `collections` attribute of the object passed
when starting a transaction. If any attempt is made to carry out a data
modification operation on a collection that was not declared in the `collections`
attribute, the transaction aborts and ArangoDB throws error `1652`
(unregistered collection used in transaction).
It is possible to not declare collections you only read from, but this should be
avoided if possible to reduce the probability of deadlocks and non-repeatable reads.

<!-- TODO: Update last sentence for RocksDB? -->

## In Clusters

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
Please refer to [Locking and Isolation](locking-and-isolation.md) for more details
on the storage-engines.

### Atomicity

A transaction on **one DB-Server** is either committed completely or not at all.

ArangoDB transactions do currently not require any form of global consensus. This makes
them relatively fast, but also vulnerable to unexpected server outages.

Should a transaction involve [Leader Shards](../../deploy/cluster/_index.md#db-servers) 
on *multiple DB-Servers*, the atomicity of the distributed transaction *during the commit operation*
cannot be guaranteed. Should one of the involved DB-Servers fail during the commit the transaction
is not rolled-back globally, sub-transactions may have been committed on some DB-Servers, but not on others.
Should this case occur, the client application sees an error.

An improved failure handling issue might be introduced in future versions.

### Consistency

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

### Isolation

The ArangoDB Cluster provides **Local Snapshot Isolation**. This means that all
operations and queries in the transactions see the same version, or snapshot,
of the data on a given DB-Server. This snapshot is based on the state of the
data at the moment in time when the transaction begins **on that DB-Server**.

### Durability

It is guaranteed that successfully committed transactions are persistent. Using
replication, `waitForSync`, or both, increases the durability
(just as with the single server).

## Size and time limits

### Intermediate commits

[Intermediate commits](../../aql/fundamentals/limitations.md#storage-engine-properties)
that would automatically split and commit parts of big transactions are **disabled**
for JavaScript Transactions and Stream Transactions in the RocksDB storage engine,
including AQL queries that run inside of such transactions.

### Limits for Stream transactions

A maximum lifetime and transaction size for Stream Transactions is enforced
on the Coordinator to ensure that abandoned transactions cannot block the
cluster from operating properly:

- Maximum idle timeout of up to **120 seconds** between operations
- Maximum transaction size of **128 MB** per DB-Server

These limits are also enforced for Stream Transactions on single servers.

The default maximum idle timeout is **60 seconds** between operations in a
single Stream Transaction. The maximum value can be bumped up to at most 120
seconds by setting the startup option `--transaction.streaming-idle-timeout`.
Posting an operation into a non-expired Stream Transaction will reset the
transaction's timeout to the configured idle timeout.

Enforcing the limit is useful to free up resources used by abandoned
transactions, for example from transactions that are abandoned by client
applications due to programming errors or that were left over because client
connections were interrupted.
