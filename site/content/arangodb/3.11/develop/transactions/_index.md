---
title: Transactions
menuTitle: Transactions
weight: 260
description: >-
  AQL queries can be transactional, you can execute supported operations as
  part of a client-controlled Stream Transaction, as well as run single-request
  JavaScript Transactions
---
## Transaction Types

ArangoDB offers different types of transactions:

- AQL queries (with exceptions)
- Stream Transactions
- JavaScript Transactions

### AQL Queries

AQL queries are principally transactional. If you insert 100 documents into a
collection using a single AQL query and the first 99 writes are successful but
the last one fails, the query is aborted. None of the documents are typically
persisted and are not even visible temporarily to other operations.

```aql
FOR i IN 0..99
  INSERT { _key: TO_STRING(i % 99)  } INTO coll
  // Duplicate key ("0") on the 100th document write
```

There are limitations to the transactionality, however. The following conditions
can make AQL queries non-transactional:

- A query exceeds the specified size thresholds, causing the RocksDB
  storage engine to perform intermediate commits. The query's operations carried
  out so far are committed and not rolled back in case of a later abort/rollback.
  See [Known limitations for AQL queries](../../aql/fundamentals/limitations.md#storage-engine-properties).

- A query runs in a cluster deployment and involves different shards, DB-Servers,
  or both. This can be a query using a collection with more than one shard or a
  multi-collection query. It is possible that write operations get committed for
  some shards but not others, and the system cannot automatically resolve this
  situation. The client sees some kind of error, but this can be a timeout or
  connection loss.

<!-- TODO
No atomic distributed transactions. Really bad for smart edge collections, where an edge is written into multiple collections.
Atomic commits only guaranteed for certain groups of shards:
Same sharding via distributeShardsLike, but then also just for all the 1st shards, separately all the 2nd shards, etc.
With numberOfShards: 1, it's all of them, and this is utilized for OneShard databases.

read own writes (UPSERT?) is unrelated to transactionality but might be worth mentioning nonetheless
-->

### Stream Transactions

[Stream Transactions](stream-transactions.md) allow you to perform
multi-document transactions with individual begin and commit / abort commands.
They work similar to the *BEGIN*, *COMMIT*, and *ROLLBACK* operations in
relational database systems.

Only certain operations like document CRUD and AQL queries can be run as part of
a Stream Transactions.

The client is responsible for making sure that transactions are committed or
aborted when they are no longer needed, to avoid taking up resources.

###  JavaScript Transactions

[JavaScript Transactions](javascript-transactions.md) allow you
to send the server a dedicated piece of JavaScript code (i.e. a function), which
will be executed transactionally.

At the end of the function, the transaction is automatically committed, and all
changes done by the transaction will be persisted. No interaction is required by 
the client beyond the initial request.

## Transactional Properties

Transactions in ArangoDB are atomic, consistent, isolated, and durable (**ACID**).

These ACID properties provide the following guarantees:

- The **atomicity** principle makes transactions either complete in their
  entirety or have no effect at all.
- The **consistency** principle ensures that no constraints or other invariants
  are violated during or after any transaction. A transaction never
  corrupts the database.
- The **isolation** property hides the modifications of a transaction from
  other transactions until the transaction commits.
- Finally, the **durability** proposition makes sure that operations from
  transactions that have committed are made persistent. The amount of
  transaction durability is configurable in ArangoDB, as is the durability
  on collection level.

The descriptions in this section only provide a general overview. The actual
transactional guarantees depend on the deployment mode and usage pattern.

Also see:
- [Operation Atomicity](../operational-factors.md#operation-atomicity)
  for more details on atomicity guarantees.
- [Transactional Isolation](../operational-factors.md#transactional-isolation)
  for more details on isolation guarantees in the single server
  and OneShard database case.
- [Cluster Transaction Limitations](limitations.md#in-clusters)
  for more details on the transactional behavior of multi-document transactions in
  cluster deployments

