---
title: Known limitations for AQL queries
menuTitle: Limitations
weight: 45
description: >-
  AQL has restrictions with regards to the complexity of queries and the data
  they operate on, as well as design limitations to be aware of
---
## Complexity limitations

The following hard-coded limitations exist for AQL queries:

- An AQL query cannot use more than _1000_ result registers.
  One result register is needed for every named query variable and for
  internal/anonymous query variables, e.g. for intermediate results.
  Subqueries also require result registers.
- An AQL query cannot have more than _4000_ execution nodes in its initial
  query execution plan. This number includes all execution nodes of the
  initial execution plan, even if some of them could be
  optimized away later by the query optimizer during plan optimization.
- An AQL query cannot use more than _2048_ collections/shards.
  {{< tip >}}
  From version 3.10.7 onward, this limit is configurable via the
  `--query.max-collections-per-query` startup option.
  {{< /tip >}}
- Expressions in AQL queries cannot have a nesting of more than _500_ levels.
  As an example, the expression `1 + 2 + 3 + 4` is 3 levels deep
  (because it is interpreted and executed as `1 + (2 + (3 + 4))`).
- When reading any data from JSON or VelocyPack input or when serializing
  any data to JSON or VelocyPack, there is a maximum recursion depth for 
  nested arrays and objects, which is slightly below 200. Arrays or objects
  with higher nesting than this cause `Too deep nesting in Array/Object`
  exceptions.

Please note that even queries that are still below these limits may not
yield good performance, especially when they have to put together data from lots
of different collections. Please also consider that large queries (in terms of
intermediate result size or final result size) can use considerable amounts of
memory and may hit the configurable memory limits for AQL queries.

## Design limitations

The following design limitations are known for AQL queries:

- Up to v3.12.0, subqueries used inside expressions are pulled out of these
  expressions and executed beforehand. That means that subqueries do not
  participate in lazy evaluation of operands, for example in the
  [ternary operator](../operators.md#ternary-operator) or when used as
  sub-expressions that are combined with logical `AND` or `OR`.

  From v3.12.1 onward, short-circuiting is applied.

  Also see [evaluation of subqueries](subqueries.md#evaluation-of-subqueries).

- It is not possible to use a collection in a read operation after
  it was used for a write operation in the same AQL query.

- In the cluster, all collections that are accessed **dynamically** by
  [traversals working with collection sets](../graph-queries/traversals.md#working-with-collection-sets)
  (instead of named graphs) must be stated in the query's initial
  [`WITH` statement](../high-level-operations/with.md). To make the `WITH` statement
  required in single server as well (e.g. for testing a migration to cluster),
  please start the server with the option `--query.require-with`.

## Storage engine properties

{{< info >}}
The following restrictions and limitations do not apply to JavaScript Transactions
and Stream Transactions, including AQL queries that run inside such transactions.
Their intended use case is for smaller transactions with full transactional
guarantees. So the following only applies to standalone AQL queries.
{{< /info >}}

Data of ongoing transactions is stored in RAM. Transactions that get too big
(in terms of number of operations involved or the total size of data created or
modified by the transaction) are committed automatically. Effectively, this
means that big user transactions are split into multiple smaller RocksDB
transactions that are committed individually. The entire user transaction does
not necessarily have ACID properties in this case.

The following startup options can be used to control the RAM usage and automatic
intermediate commits for the RocksDB engine:

- `--rocksdb.max-transaction-size`

  Transaction size limit (in bytes). Transactions store all keys and values in
  RAM, so large transactions run the risk of causing out-of-memory situations.
  This setting allows you to ensure that does not happen by limiting the size of
  any individual transaction. Transactions whose operations would consume more
  RAM than this threshold value will abort automatically with error 32 ("resource
  limit exceeded").

- `--rocksdb.intermediate-commit-size`

  If the size of all operations in a transaction reaches this threshold, the transaction
  is committed automatically and a new transaction is started. The value is specified in bytes.

- `--rocksdb.intermediate-commit-count`

  If the number of operations in a transaction reaches this value, the transaction is
  committed automatically and a new transaction is started.

The above values can also be adjusted per query, for example, by setting the
following attributes in the call to `db._query()` in the JavaScript API:

- `maxTransactionSize`: transaction size limit in bytes
- `intermediateCommitSize`: maximum total size of operations after which an intermediate
  commit is performed automatically
- `intermediateCommitCount`: maximum number of operations after which an intermediate
  commit is performed automatically
