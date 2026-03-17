---
title: HTTP interfaces for transactions
menuTitle: Transactions
weight: 50
description: >-
  ArangoDB supports an API for Stream Transactions that you can use in
  conjunction with supported operations for transactions
---
ArangoDB offers HTTP APIs for different types of transactions:

- AQL queries via the [Cursor API](../queries/aql-queries.md#execute-aql-queries)
  (transactional with exceptions)
- Transactions with separately submitted operations and explicit commit or abort
  via the [Stream Transactions API](stream-transactions.md)

For a more detailed description of the transaction types, how transactions work
in ArangoDB, and what guarantees ArangoDB provide, please refer to
[Transactions in ArangoDB](../../transactions/_index.md). 
