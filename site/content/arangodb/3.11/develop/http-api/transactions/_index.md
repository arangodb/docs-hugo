---
title: HTTP interfaces for transactions
menuTitle: Transactions
weight: 50
description: >-
  The HTTP APIs for transactions support Stream Transactions and
  JavaScript Transactions
---
ArangoDB offers HTTP APIs for different types of transactions:

- AQL queries via the [Cursor API](../queries/aql-queries.md#execute-aql-queries)
  (transactional with exceptions)
- Transactions with separately submitted operations and explicit commit or abort
  via the [Stream Transactions API](stream-transactions.md)
- Transactions submitted as a single request and leveraging ArangoDB's
  JavaScript API via the [JavaScript Transaction API](javascript-transactions.md).

For a more detailed description of the transaction types, how transactions work
in ArangoDB, and what guarantees ArangoDB provide, please refer to
[Transactions](../../transactions/_index.md) in ArangoDB.

