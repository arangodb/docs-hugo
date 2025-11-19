---
title: HTTP interface for JavaScript Transactions
menuTitle: JavaScript Transactions
weight: 10
description: >-
  The HTTP API for JavaScript Transactions lets you run a transaction that
  leverages ArangoDB's JavaScript API by submitting a single HTTP request
---
<small>Deprecated in: v3.12.0</small>

JavaScript Transactions are executed on the server. Transactions can be 
initiated by clients by sending the transaction description for execution to
the server.

JavaScript Transactions in ArangoDB do not offer separate *BEGIN*, *COMMIT* and *ROLLBACK*
operations. Instead, JavaScript Transactions are described by a JavaScript function, 
and the code inside the JavaScript function is then be executed transactionally.

At the end of the function, the transaction is automatically committed, and all
changes done by the transaction are persisted. If an exception is thrown
during transaction execution, all operations performed in the transaction are
rolled back.

For a more detailed description of how transactions work in ArangoDB please
refer to [Transactions](../../transactions/_index.md). 

## Execute a JavaScript Transaction

```openapi
paths:
  /_db/{database-name}/_api/transaction:
    post:
      operationId: executeJavaScriptTransaction
      description: |
        {{</* warning */>}}
        JavaScript Transactions are deprecated from v3.12.0 onward and will be
        removed in a future version.
        {{</* /warning */>}}

        The transaction description must be passed in the body of the POST request.

        If the transaction is fully executed and committed on the server,
        *HTTP 200* will be returned. Additionally, the return value of the
        code defined in `action` will be returned in the `result` attribute.

        For successfully committed transactions, the returned JSON object has the
        following properties:

        - `error`: boolean flag to indicate if an error occurred (`false`
          in this case)

        - `code`: the HTTP status code

        - `result`: the return value of the transaction

        If the transaction specification is either missing or malformed, the server
        will respond with *HTTP 400*.

        The body of the response will then contain a JSON object with additional error
        details. The object has the following attributes:

        - `error`: boolean flag to indicate that an error occurred (`true` in this case)

        - `code`: the HTTP status code

        - `errorNum`: the server error number

        - `errorMessage`: a descriptive error message

        If a transaction fails to commit, either by an exception thrown in the
        `action` code, or by an internal error, the server will respond with
        an error.
        Any other errors will be returned with any of the return codes
        *HTTP 400*, *HTTP 409*, or *HTTP 500*.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - collections
                - action
              properties:
                collections:
                  description: |
                    Must be a JSON object that can have one or all sub-attributes
                    `read`, `write` or `exclusive`, each being an array of collection names or a
                    single collection name as string. Collections that will be written to in the
                    transaction must be declared with the `write` or `exclusive` attribute or it
                    will fail, whereas non-declared collections from which is solely read will be
                    added lazily. The optional sub-attribute `allowImplicit` can be set to `false`
                    to let transactions fail in case of undeclared collections for reading.
                    Collections for reading should be fully declared if possible, to avoid
                    deadlocks.
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
                action:
                  description: |
                    The actual transaction operations to be executed, in the
                    form of stringified JavaScript code. The code is executed on the server
                    side, with late binding. It is thus critical that the code specified in
                    `action` properly sets up all the variables it needs.
                    If the code specified in `action` ends with a return statement, the
                    value returned is also returned by the REST API in the `result`
                    attribute if the transaction committed successfully.
                  type: string
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
                params:
                  description: |
                    Optional argument passed to `action`. Can be of any type.
                maxTransactionSize:
                  description: |
                    Transaction size limit in bytes.
                  type: integer
                  default: 18446744073709551615 # Max value of uint64_t
      responses:
        '200':
          description: |
            If the transaction is fully executed and committed on the server,
            *HTTP 200* will be returned.
        '400':
          description: |
            If the transaction specification is either missing or malformed, the server
            will respond with *HTTP 400*.
        '404':
          description: |
            If the transaction specification contains an unknown collection, the server
            will respond with *HTTP 404*.
        '500':
          description: |
            Exceptions thrown by users will make the server respond with a return code of
            *HTTP 500*
      tags:
        - Transactions
```

**Examples**

```curl
---
description: |-
  Executing a transaction on a single collection
name: RestTransactionSingle
---
var cn = "products";
db._drop(cn);
var products = db._create(cn);
var url = "/_api/transaction";
var body = {
  collections: {
    write : "products"
  },
  action: "function () { var db = require('@arangodb').db; db.products.save({});  return db.products.count(); }"
};

var response = logCurlRequest('POST', url, body);
assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Executing a transaction using multiple collections
name: RestTransactionMulti
---
var cn1 = "materials";
db._drop(cn1);
var materials = db._create(cn1);
var cn2 = "products";
db._drop(cn2);
var products = db._create(cn2);
products.save({ "a": 1});
materials.save({ "b": 1});
var url = "/_api/transaction";
var body = {
  collections: {
    write : [ "products", "materials" ]
  },
  action: (
    "function () {" +
    "var db = require('@arangodb').db;" +
    "db.products.save({});" +
    "db.materials.save({});" +
    "return 'worked!';" +
    "}"
  )
};

var response = logCurlRequest('POST', url, body);
assert(response.code === 200);

logJsonResponse(response);
db._drop(cn1);
db._drop(cn2);
```

```curl
---
description: |-
  Aborting a transaction due to an internal error
name: RestTransactionAbortInternal
---
var cn = "products";
db._drop(cn);
var products = db._create(cn);
var url = "/_api/transaction";
var body = {
  collections: {
    write : "products"
  },
  action : (
    "function () {" +
    "var db = require('@arangodb').db;" +
    "db.products.save({ _key: 'abc'});" +
    "db.products.save({ _key: 'abc'});" +
    "}"
  )
};

var response = logCurlRequest('POST', url, body);
assert(response.code === 409);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Aborting a transaction by explicitly throwing an exception
name: RestTransactionAbort
---
var cn = "products";
db._drop(cn);
var products = db._create(cn, { waitForSync: true });
products.save({ "a": 1 });
var url = "/_api/transaction";
var body = {
  collections: {
    read : "products"
  },
  action : "function () { throw 'doh!'; }"
};

var response = logCurlRequest('POST', url, body);
assert(response.code === 500);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Referring to a non-existing collection
name: RestTransactionNonExisting
---
var cn = "products";
db._drop(cn);
var url = "/_api/transaction";
var body = {
  collections: {
    read : "products"
  },
  action : "function () { return true; }"
};

var response = logCurlRequest('POST', url, body);
assert(response.code === 404);

logJsonResponse(response);
```
