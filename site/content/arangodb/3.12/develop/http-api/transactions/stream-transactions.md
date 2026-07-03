---
title: HTTP interface for Stream Transactions
menuTitle: Stream Transactions
weight: 5
description: >-
  Stream Transactions allow you to perform a multi-document transaction with
  individual begin and commit/abort commands
---
For an introduction to this transaction type, see
[Stream Transactions](../../transactions/stream-transactions.md).

To use a Stream Transaction, a client first sends the [configuration](#begin-a-stream-transaction)
of the transaction to the ArangoDB server.

{{< info >}}
Contrary to [JavaScript Transactions](javascript-transactions.md),
the definition of Stream Transaction must only contain the collections that are
going to be used and (optionally) the various transaction options supported by
ArangoDB. No `action` attribute is supported.
{{< /info >}}

The Stream Transaction API works in *conjunction* with other APIs in ArangoDB.
To use the transaction for a supported operation a client needs to specify
the transaction identifier in the `x-arango-trx-id` HTTP header on each request.
This automatically causes these operations to use the specified transaction.

Supported transactional API operations include:

- All operations in the [Document API](../documents.md)
- Get the number of documents via the [Collection API](../collections.md#get-the-document-count-of-a-collection)
- Truncate a collection via the [Collection API](../collections.md#truncate-a-collection)
- Create an AQL cursor via the [Cursor API](../queries/aql-queries.md#create-a-cursor)
- Handle [nodes](../graphs/named-graphs.md#nodes) and [edges](../graphs/named-graphs.md#edges)
  of managed graphs (_General Graph_ / _Gharial_ API)

## Begin a Stream Transaction

```openapi
paths:
  /_db/{database-name}/_api/transaction/begin:
    post:
      operationId: beginStreamTransaction
      description: |
        Begin a Stream Transaction that allows clients to call selected APIs over a
        short period of time, referencing the transaction ID, and have the server
        execute the operations transactionally.

        Committing or aborting a running transaction must be done by the client.
        It is bad practice to not commit or abort a transaction once you are done
        using it. It forces the server to keep resources and collection locks
        until the entire transaction times out.

        The transaction description must be passed in the body of the POST request.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: x-arango-allow-dirty-read
          in: header
          required: false
          description: |
            Set this header to `true` to allow the Coordinator to ask any shard replica for
            the data, not only the shard leader. This may result in "dirty reads".

            This header decides about dirty reads for the entire transaction. Individual
            read operations, that are performed as part of the transaction, cannot override it.
          schema:
            type: boolean
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - collections
              properties:
                collections:
                  description: |
                    Must be a JSON object that can have the sub-attributes
                    `read`, `write`, and `exclusive`, each being an array of collection names or a
                    single collection name as string. Collections that will be written to in the
                    transaction must be declared with the `write` or `exclusive` attribute or the
                    respective write operations will fail (but not automatically abort the
                    Stream Transaction), whereas non-declared collections from which is solely
                    read will be added lazily.
                  type: object
                  properties:
                    read:
                      description: |
                        A single collection or a list of collections to use in
                        the transaction in read-only mode.
                    #  type: [string, array]
                    #  items:
                    #    type: string
                    write:
                      description: |
                        A single collection or a list of collections to use in
                        the transaction in write or read mode.
                    #  type: [string, array]
                    #  items:
                    #    type: string
                    exclusive:
                      description: |
                        A single collection or a list of collections to acquire
                        exclusive write access for.
                    #  type: [string, array]
                    #  items:
                    #    type: string
                waitForSync:
                  description: |
                    An optional boolean flag that, if set, forces the
                    transaction to write all data to disk before returning.
                  type: boolean
                allowImplicit:
                  description: |
                    Allow reading from undeclared collections.
                  type: boolean
                  default: true
                lockTimeout:
                  description: |
                    The timeout in seconds for waiting on collection locks.
                    This option is only meaningful when using exclusive locks.
                    Set `lockTimeout` to `0` to make ArangoDB not time out
                    waiting for a lock.
                  type: integer
                  default: 900
                maxTransactionSize:
                  description: |
                    Transaction size limit in bytes.

                    Default: Controlled by the [`--transaction.streaming-max-transaction-size` startup option](../../../components/arangodb-server/options.md#--transactionstreaming-max-transaction-size).
                  type: integer
                skipFastLockRound:
                  description: |
                    Whether to disable fast locking for write operations.

                    Skipping the fast lock round can be faster overall if there are many concurrent
                    Stream Transactions queued that all try to lock the same collection exclusively.
                    It avoids deadlocking and retrying which can occur with the fast locking by
                    guaranteeing a deterministic locking order at the expense of each actual
                    locking operation taking longer.

                    Fast locking should not be skipped for read-only Stream Transactions because
                    it degrades performance if there are no concurrent transactions that use
                    exclusive locks on the same collection.
                  type: boolean
                  default: false
      responses:
        '201':
          description: |
            The transaction has been started on the server.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - result
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 201
                  result:
                    description: |
                      An object describing the started transaction.
                    type: object
                    required:
                      - id
                      - status
                    properties:
                      id:
                        description: |
                          The identifier of the transaction.
                        type: string
                      status:
                        description: |
                          The status of the transaction. Always `running` for a
                          successfully started transaction.
                        type: string
                        const: running
        '400':
          description: |
            The transaction specification is either missing or malformed.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            The transaction specification contains an unknown collection.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Transactions
```

**Examples**

```curl
---
description: |-
  Executing a transaction on a single collection
name: RestTransactionBeginSingle
---
const cn = "products";
db._drop(cn);
db._create(cn);
let url = "/_api/transaction/begin";
let body = {
  collections: {
    write : cn
  },
};

let response = logCurlRequest('POST', url, body);
assert(response.code === 201);
logJsonResponse(response);

url = "/_api/transaction/" + response.parsedBody.result.id;
db._connection.DELETE(url);
db._drop(cn);
```

```curl
---
description: |-
  Referring to a non-existing collection
name: RestTransactionBeginNonExisting
---
const cn = "products";
db._drop(cn);
let url = "/_api/transaction/begin";
let body = {
  collections: {
    read : "products"
  }
};

var response = logCurlRequest('POST', url, body);
assert(response.code === 404);

logJsonResponse(response);
```

## Get the status of a Stream Transaction

```openapi
paths:
  /_db/{database-name}/_api/transaction/{transaction-id}:
    get:
      operationId: getStreamTransaction
      description: |
        Retrieve the status of a Stream Transaction by its identifier.

        After a transaction is committed or aborted, the server remembers its
        final state for a limited time. During this window, querying the
        transaction returns its final status (`committed` or `aborted`). Once
        the server garbage-collects this record, the same identifier becomes
        unknown and the endpoint returns `404`.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: transaction-id
          in: path
          required: true
          description: |
            The transaction identifier.
          schema:
            type: string
      responses:
        '200':
          description: |
            The transaction is found and its status returned.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - result
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  result:
                    description: |
                      An object describing the status of the transaction.
                    type: object
                    required:
                      - id
                      - status
                    properties:
                      id:
                        description: |
                          The identifier of the transaction.
                        type: string
                      status:
                        description: |
                          The status of the transaction.
                        type: string
                        enum: [running, committed, aborted]
        '400':
          description: |
            The transaction identifier is either missing or malformed.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            No transaction was found with the specified identifier.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Transactions
```

**Examples**

```curl
---
description: |-
  Get transaction status
name: RestTransactionGet
---
db._drop("products");
db._create("products");
let body = {
  collections: {
    read : "products"
  }
};
let trx = db._createTransaction(body);
let url = "/_api/transaction/" + trx.id();

let response = logCurlRequest('GET', url);
assert(response.code === 200);

logJsonResponse(response);

trx.abort();
db._drop("products");
```

## Commit a Stream Transaction

```openapi
paths:
  /_db/{database-name}/_api/transaction/{transaction-id}:
    put:
      operationId: commitStreamTransaction
      description: |
        Commit a running server-side transaction. Committing is an idempotent operation.
        It is not an error to commit a transaction more than once.

        The server remembers a transaction's final state for a limited time after
        it ends. As a result, the response can vary depending on when you call
        this endpoint:

        - While the transaction is still tracked: committing an already-committed
          transaction returns `200` (idempotent), and committing an already-aborted
          transaction returns `400`.
        - Once the server has garbage-collected the transaction's record, the
          identifier is no longer known and the endpoint returns `404`.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: transaction-id
          in: path
          required: true
          description: |
            The transaction identifier,
          schema:
            type: string
      responses:
        '200':
          description: |
            The transaction has been committed.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - result
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  result:
                    description: |
                      An object describing the committed transaction.
                    type: object
                    required:
                      - id
                      - status
                    properties:
                      id:
                        description: |
                          The identifier of the transaction.
                        type: string
                      status:
                        description: |
                          The status of the transaction. Always `committed` for a
                          successfully committed transaction.
                        type: string
                        const: committed
        '400':
          description: |
            The transaction identifier is malformed, or the transaction is in
            a state that does not allow committing (for example, it was
            already aborted).
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            No transaction is known under the specified identifier.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Transactions
```

**Examples**

```curl
---
description: |-
  Committing a transaction:
name: RestTransactionBeginAbort
---
const cn = "products";
db._drop(cn);
db._create(cn);
let body = {
  collections: {
    read : cn
  }
};
let trx = db._createTransaction(body);
let url = "/_api/transaction/" + trx.id();

var response = logCurlRequest('PUT', url, "");
assert(response.code === 200);

logJsonResponse(response);

db._drop(cn);
```

## Abort a Stream Transaction

```openapi
paths:
  /_db/{database-name}/_api/transaction/{transaction-id}:
    delete:
      operationId: abortStreamTransaction
      description: |
        Abort a running server-side transaction. Aborting is an idempotent operation.
        It is not an error to abort a transaction more than once.

        The server remembers a transaction's final state for a limited time after
        it ends. As a result, the response can vary depending on when you call
        this endpoint:

        - While the transaction is still tracked: aborting an already-aborted
          transaction returns `200` (idempotent), and aborting an already-committed
          transaction returns `400`.
        - The first abort against an unknown identifier returns `404` and records
          it as aborted. Subsequent aborts for the same identifier return `200`
          until the record is garbage-collected, after which the identifier is
          again unknown and the next abort once more returns `404`.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: transaction-id
          in: path
          required: true
          description: |
            The transaction identifier,
          schema:
            type: string
      responses:
        '200':
          description: |
            The transaction has been aborted.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - result
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  result:
                    description: |
                      An object describing the aborted transaction.
                    type: object
                    required:
                      - id
                      - status
                    properties:
                      id:
                        description: |
                          The identifier of the transaction.
                        type: string
                      status:
                        description: |
                          The status of the transaction. Always `aborted` for a
                          successfully aborted transaction.
                        type: string
                        const: aborted
        '400':
          description: |
            The transaction identifier is malformed, or the transaction is in
            a state that does not allow aborting (for example, it was
            already committed).
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            No transaction is known under the specified identifier.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Transactions
```

**Examples**

```curl
---
description: |-
  Aborting a transaction:
name: RestTransactionBeginCommit
---
const cn = "products";
db._drop(cn);
db._create(cn);
let body = {
  collections: {
    read : cn
  }
};
let trx = db._createTransaction(body);
let url = "/_api/transaction/" + trx.id();

var response = logCurlRequest('DELETE', url);
assert(response.code === 200);

logJsonResponse(response);

db._drop(cn);
```

## List the running Stream Transactions

```openapi
paths:
  /_db/{database-name}/_api/transaction:
    get:
      operationId: listStreamTransactions
      description: |
        List the currently running Stream Transactions.
        In a cluster, the list contains the transactions from all Coordinators.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
      responses:
        '200':
          description: |
            The list of transactions can be retrieved successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - transactions
                properties:
                  transactions:
                    description: |
                      An array of currently running transactions. In a cluster, this
                      contains the transactions from all Coordinators.
                    type: array
                    items:
                      type: object
                      required:
                        - id
                        - state
                      properties:
                        id:
                          description: |
                            The identifier of the transaction.
                          type: string
                        state:
                          description: |
                            The status of the transaction. Always `running`
                            if it's in the list of running transactions.
                          type: string
                          const: running
      tags:
        - Transactions
```

**Examples**

```curl
---
description: |-
  Get currently running transactions
name: RestTransactionsGet
---
db._drop("products");
db._create("products");
let body = {
  collections: {
    read : "products"
  }
};
let trx = db._createTransaction(body);
let url = "/_api/transaction";

let response = logCurlRequest('GET', url);
assert(response.code === 200);

logJsonResponse(response);

trx.abort();
db._drop("products");
```
