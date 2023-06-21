---
title: HTTP interface for Stream Transactions
menuTitle: Stream Transactions
weight: 5
description: >-
  Stream Transactions allow you to perform a multi-document transaction with
  individual begin and commit/abort commands
archetype: default
---
For an introduction to this transaction type, see
[Stream Transactions](../../develop/transactions/stream-transactions.md).

To use a Stream Transaction, a client first sends the [configuration](#begin-a-stream-transaction)
of the transaction to the ArangoDB server.

{{< info >}}
Contrary to [**JavaScript Transactions**](javascript-transactions.md),
the definition of Stream Transaction must only contain the collections that are
going to be used and (optionally) the various transaction options supported by
ArangoDB. No `action` attribute is supported.
{{< /info >}}

The Stream Transaction API works in *conjunction* with other APIs in ArangoDB.
To use the transaction for a supported operation a client needs to specify
the transaction identifier in the `x-arango-trx-id` HTTP header on each request.
This will automatically cause these operations to use the specified transaction.

Supported transactional API operations include:

- All operations in the [Document API](../documents.md)
- Number of documents via the [Collection API](../collections.md#get-the-document-count-of-a-collection)
- Truncate a collection via the [Collection API](../collections.md#truncate-a-collection)
- Create an AQL cursor via the [Cursor API](../queries/aql-queries.md#create-a-cursor)
- Handle [vertices](../graphs/named-graphs.md#vertices) and [edges](../graphs/named-graphs.md#edges)
  of managed graphs (_General Graph_ / _Gharial_ API)

```openapi
## Begin transaction

paths:
  /_api/transaction/begin:
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
        If the transaction can be started on the server, *HTTP 201* will be returned.

        For successfully started transactions, the returned JSON object has the
        following properties:

        - *error*: boolean flag to indicate if an error occurred (*false*
          in this case)

        - *code*: the HTTP status code

        - *result*: result containing
            - *id*: the identifier of the transaction
            - *status*: containing the string 'running'

        If the transaction specification is either missing or malformed, the server
        will respond with *HTTP 400* or *HTTP 404*.

        The body of the response will then contain a JSON object with additional error
        details. The object has the following attributes:

        - *error*: boolean flag to indicate that an error occurred (*true* in this case)

        - *code*: the HTTP status code

        - *errorNum*: the server error number

        - *errorMessage*: a descriptive error message
      parameters:
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
              properties:
                collections:
                  description: |
                    *collections* must be a JSON object that can have one or all sub-attributes
                    *read*, *write* or *exclusive*, each being an array of collection names or a
                    single collection name as string. Collections that will be written to in the
                    transaction must be declared with the *write* or *exclusive* attribute or it
                    will fail, whereas non-declared collections from which is solely read will be
                    added lazily.
                  type: string
                waitForSync:
                  description: |
                    an optional boolean flag that, if set, will force the
                    transaction to write all data to disk before returning.
                  type: boolean
                allowImplicit:
                  description: |
                    Allow reading from undeclared collections.
                  type: boolean
                lockTimeout:
                  description: |
                    an optional numeric value that can be used to set a
                    timeout in seconds for waiting on collection locks. This option is only
                    meaningful when using exclusive locks. If not specified, a default
                    value will be used. Setting *lockTimeout* to *0* will make ArangoDB
                    not time out waiting for a lock.
                  type: integer
                maxTransactionSize:
                  description: |
                    Transaction size limit in bytes.
                  type: integer
              required:
                - collections
      responses:
        '201':
          description: |
            If the transaction is running on the server,
            *HTTP 201* will be returned.
        '400':
          description: |
            If the transaction specification is either missing or malformed, the server
            will respond with *HTTP 400*.
        '404':
          description: |
            If the transaction specification contains an unknown collection, the server
            will respond with *HTTP 404*.
      tags:
        - Transactions
```


```curl
---
description: |-
  Executing a transaction on a single collection
version: '3.10'
render: input/output
name: RestTransactionBeginSingle
server_name: stable
type: single
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
render: input/output
name: RestTransactionBeginNonExisting
server_name: stable
type: single
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
```openapi
## Get transaction status

paths:
  /_api/transaction/{transaction-id}:
    get:
      operationId: getStreamTransaction
      description: |
        The result is an object describing the status of the transaction.
        It has at least the following attributes:

        - *id*: the identifier of the transaction

        - *status*: the status of the transaction. One of "running", "committed" or "aborted".
      parameters:
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
            If the transaction is fully executed and committed on the server,
            *HTTP 200* will be returned.
        '400':
          description: |
            If the transaction identifier specified is either missing or malformed, the server
            will respond with *HTTP 400*.
        '404':
          description: |
            If the transaction was not found with the specified identifier, the server
            will respond with *HTTP 404*.
      tags:
        - Transactions
```


```curl
---
description: |-
  Get transaction status
version: '3.10'
render: input/output
name: RestTransactionGet
server_name: stable
type: single
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

  ~ trx.abort();
  ~ db._drop("products");
```
```openapi
## Commit transaction

paths:
  /_api/transaction/{transaction-id}:
    put:
      operationId: commitStreamTransaction
      description: |
        Commit a running server-side transaction. Committing is an idempotent operation.
        It is not an error to commit a transaction more than once.

        If the transaction can be committed, *HTTP 200* will be returned.
        The returned JSON object has the following properties:

        - *error*: boolean flag to indicate if an error occurred (*false*
          in this case)

        - *code*: the HTTP status code

        - *result*: result containing
            - *id*: the identifier of the transaction
            - *status*: containing the string 'committed'

        If the transaction cannot be found, committing is not allowed or the
        transaction was aborted, the server
        will respond with *HTTP 400*, *HTTP 404* or *HTTP 409*.

        The body of the response will then contain a JSON object with additional error
        details. The object has the following attributes:

        - *error*: boolean flag to indicate that an error occurred (*true* in this case)

        - *code*: the HTTP status code

        - *errorNum*: the server error number

        - *errorMessage*: a descriptive error message
      parameters:
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
            If the transaction was committed,
            *HTTP 200* will be returned.
        '400':
          description: |
            If the transaction cannot be committed, the server
            will respond with *HTTP 400*.
        '404':
          description: |
            If the transaction was not found, the server
            will respond with *HTTP 404*.
        '409':
          description: |
            If the transaction was already aborted, the server
            will respond with *HTTP 409*.
      tags:
        - Transactions
```


```curl
---
description: |-
  Committing a transaction:
version: '3.10'
render: input/output
name: RestTransactionBeginAbort
server_name: stable
type: single
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

  ~ db._drop(cn);
```
```openapi
## Abort transaction

paths:
  /_api/transaction/{transaction-id}:
    delete:
      operationId: abortStreamTransaction
      description: |
        Abort a running server-side transaction. Aborting is an idempotent operation.
        It is not an error to abort a transaction more than once.

        If the transaction can be aborted, *HTTP 200* will be returned.
        The returned JSON object has the following properties:

        - *error*: boolean flag to indicate if an error occurred (*false*
          in this case)

        - *code*: the HTTP status code

        - *result*: result containing
            - *id*: the identifier of the transaction
            - *status*: containing the string 'aborted'

        If the transaction cannot be found, aborting is not allowed or the
        transaction was already committed, the server
        will respond with *HTTP 400*, *HTTP 404* or *HTTP 409*.

        The body of the response will then contain a JSON object with additional error
        details. The object has the following attributes:

        - *error*: boolean flag to indicate that an error occurred (*true* in this case)

        - *code*: the HTTP status code

        - *errorNum*: the server error number

        - *errorMessage*: a descriptive error message
      parameters:
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
            If the transaction was aborted,
            *HTTP 200* will be returned.
        '400':
          description: |
            If the transaction cannot be aborted, the server
            will respond with *HTTP 400*.
        '404':
          description: |
            If the transaction was not found, the server
            will respond with *HTTP 404*.
        '409':
          description: |
            If the transaction was already committed, the server
            will respond with *HTTP 409*.
      tags:
        - Transactions
```


```curl
---
description: |-
  Aborting a transaction:
version: '3.10'
render: input/output
name: RestTransactionBeginCommit
server_name: stable
type: single
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

  ~ db._drop(cn);
```
```openapi
## Get currently running transactions

paths:
  /_api/transaction:
    get:
      operationId: listStreamTransactions
      description: |
        The result is an object with the attribute *transactions*, which contains
        an array of transactions.
        In a cluster the array will contain the transactions from all Coordinators.

        Each array entry contains an object with the following attributes:

        - *id*: the transaction's id
        - *state*: the transaction's status
      responses:
        '200':
          description: |
            If the list of transactions can be retrieved successfully, *HTTP 200* will be returned.
      tags:
        - Transactions
```


```curl
---
description: |-
  Get currently running transactions
version: '3.10'
render: input/output
name: RestTransactionsGet
server_name: stable
type: single
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

  ~ trx.abort();
  ~ db._drop("products");
```
