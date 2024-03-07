---
title: Transactions
menuTitle: Transactions
weight: 260
description: >-
  ArangoDB provides support for user-definable transactions
---
## Transaction Types

ArangoDB offers different types of transactions:

- AQL queries (with exceptions)
- Stream Transactions
- JavaScript Transactions

<!-- TODO
### AQL Queries

read own writes (UPSERT?), intermediate commits
-->

### Stream Transactions

[Stream Transactions](stream-transactions.md) allow you to perform
multi-document transactions with individual begin and commit / abort commands.
They work similar to the *BEGIN*, *COMMIT*, and *ROLLBACK* operations in
relational database systems.

The client is responsible for making sure that transactions are committed or
aborted when they are no longer needed, to avoid taking up resources.

###  JavaScript Transactions

<small>Deprecated in: v3.12.0</small>

[JavaScript Transactions](javascript-transactions.md) allow you
to send the server a dedicated piece of JavaScript code (i.e. a function), which
will be executed transactionally.

At the end of the function, the transaction is automatically committed, and all
changes done by the transaction will be persisted. No interaction is required by 
the client beyond the initial request.

## Transactional Properties

Transactions in ArangoDB are atomic, consistent, isolated, and durable (*ACID*).

These *ACID* properties provide the following guarantees:

- The *atomicity* principle makes transactions either complete in their
  entirety or have no effect at all.
- The *consistency* principle ensures that no constraints or other invariants
  will be violated during or after any transaction. A transaction will never
  corrupt the database.
- The *isolation* property will hide the modifications of a transaction from
  other transactions until the transaction commits. 
- Finally, the *durability* proposition makes sure that operations from 
  transactions that have committed will be made persistent. The amount of
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
