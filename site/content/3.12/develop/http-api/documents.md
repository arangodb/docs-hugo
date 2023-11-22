---
title: HTTP interface for documents
menuTitle: Documents
weight: 30
description: >-
  The HTTP API for documents lets you create, read, update, and delete documents
  in collections, either one or multiple at a time
archetype: default
---
The basic operations for documents are mapped to the standard HTTP methods:

- Create: `POST`
- Read: `GET`
- Update: `PATCH` (partially modify)
- Replace: `PUT`
- Delete: `DELETE`
- Check: `HEAD` (test for existence and get document metadata)

## Addresses of documents

Any document can be retrieved using its unique URI:

```
http://server:port/_api/document/<document-identifier>
```

For example, assuming that the document identifier is `demo/362549736`, then the URL
of that document is:

```
http://localhost:8529/_api/document/demo/362549736
```

The above URL schema does not specify a [database name](../../concepts/data-structure/databases.md#database-names)
explicitly, so the default `_system` database is used. To explicitly specify the
database context, use the following URL schema:

```
http://server:port/_db/<database-name>/_api/document/<document-identifier>
```

For example, using the a database called `mydb`:

```
http://localhost:8529/_db/mydb/_api/document/demo/362549736
```

{{< tip >}}
Many examples in the documentation use the short URL format (and thus the
`_system` database) for brevity.
{{< /tip >}}

### Multiple documents in a single request

The document API can handle not only single documents but multiple documents in
a single request. This is crucial for performance, in particular in the cluster
situation, in which a single request can involve multiple network hops
within the cluster. Another advantage is that it reduces the overhead of
the HTTP protocol and individual network round trips between the client
and the server. The general idea to perform multiple document operations
in a single request is to use a JSON array of objects in the place of a
single document. As a consequence, document keys, identifiers and revisions
for preconditions have to be supplied embedded in the individual documents
given. Multiple document operations are restricted to a single collection
(document collection or edge collection).

<!-- TODO: The spec has been changed long ago and payloads are allowed, but there is still a lot of incompatible software -->
Note that the `GET`, `HEAD` and `DELETE` HTTP operations generally do
not allow to pass a message body. Thus, they cannot be used to perform
multiple document operations in one request. However, there are alternative
endpoints to request and delete multiple documents in one request.

### Single document operations

#### Get a document

```openapi
paths:
  /_api/document/{collection}/{key}:
    get:
      operationId: getDocument
      description: |
        Returns the document identified by the collection name and document key.
        The returned document contains three special attributes:
        - `_id`, containing the document identifier with the format `<collection-name>/<document-key>`.
        - `_key`, containing the document key that uniquely identifies a document within the collection.
        - `_rev`, containing the document revision.
      parameters:
        - name: collection
          in: path
          required: true
          description: |
            Name of the collection from which the document is to be read.
          schema:
            type: string
        - name: key
          in: path
          required: true
          description: |
            The document key.
          schema:
            type: string
        - name: If-None-Match
          in: header
          required: false
          description: |
            If the "If-None-Match" header is given, then it must contain exactly one
            ETag. The document is returned, if it has a different revision than the
            given ETag. Otherwise an *HTTP 304* is returned.
          schema:
            type: string
        - name: If-Match
          in: header
          required: false
          description: |
            If the "If-Match" header is given, then it must contain exactly one
            ETag. The document is returned, if it has the same revision as the
            given ETag. Otherwise a *HTTP 412* is returned.
          schema:
            type: string
        - name: x-arango-allow-dirty-read
          in: header
          required: false
          description: |
            Set this header to `true` to allow the Coordinator to ask any shard replica for
            the data, not only the shard leader. This may result in "dirty reads".

            The header is ignored if this operation is part of a Stream Transaction
            (`x-arango-trx-id` header). The header set when creating the transaction decides
            about dirty reads for the entire transaction, not the individual read operations.
          schema:
            type: boolean
        - name: x-arango-trx-id
          in: header
          required: false
          description: |
            To make this operation a part of a Stream Transaction, set this header to the
            transaction ID returned by the `POST /_api/transaction/begin` call.
          schema:
            type: string
      responses:
        '200':
          description: |
            is returned if the document was found
        '304':
          description: |
            is returned if the "If-None-Match" header is given and the document has
            the same version
        '404':
          description: |
            is returned if the document or collection was not found
        '412':
          description: |
            is returned if an "If-Match" header is given and the found
            document has a different version. The response will also contain the found
            document's current revision in the `_rev` attribute. Additionally, the
            attributes `_id` and `_key` will be returned.
      tags:
        - Documents
```

**Examples**

```curl
---
description: |-
  Use a document identifier:
name: RestDocumentHandlerReadDocument
---
var cn = "products";
db._drop(cn);
db._create(cn);

var document = db.products.save({"hello":"world"});
var url = "/_api/document/" + document._id;

var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Use a document identifier and an ETag:
name: RestDocumentHandlerReadDocumentIfNoneMatch
---
var cn = "products";
db._drop(cn);
db._create(cn);

var document = db.products.save({"hello":"world"});
var url = "/_api/document/" + document._id;
var headers = {"If-None-Match": "\"" + document._rev + "\""};

var response = logCurlRequest('GET', url, "", headers);

assert(response.code === 304);
db._drop(cn);
```

```curl
---
description: |-
  Unknown document identifier:
name: RestDocumentHandlerReadDocumentUnknownHandle
---
var url = "/_api/document/products/unknown-identifier";

var response = logCurlRequest('GET', url);

assert(response.code === 404);

logJsonResponse(response);
```

#### Get a document header

```openapi
paths:
  /_api/document/{collection}/{key}:
    head:
      operationId: getDocumentHeader
      description: |
        Like `GET`, but only returns the header fields and not the body. You
        can use this call to get the current revision of a document or check if
        the document was deleted.
      parameters:
        - name: collection
          in: path
          required: true
          description: |
            Name of the `collection` from which the document is to be read.
          schema:
            type: string
        - name: key
          in: path
          required: true
          description: |
            The document key.
          schema:
            type: string
        - name: If-None-Match
          in: header
          required: false
          description: |
            If the "If-None-Match" header is given, then it must contain exactly one
            ETag. If the current document revision is not equal to the specified ETag,
            an *HTTP 200* response is returned. If the current document revision is
            identical to the specified ETag, then an *HTTP 304* is returned.
          schema:
            type: string
        - name: If-Match
          in: header
          required: false
          description: |
            If the "If-Match" header is given, then it must contain exactly one
            ETag. The document is returned, if it has the same revision as the
            given ETag. Otherwise a *HTTP 412* is returned.
          schema:
            type: string
        - name: x-arango-allow-dirty-read
          in: header
          required: false
          description: |
            Set this header to `true` to allow the Coordinator to ask any shard replica for
            the data, not only the shard leader. This may result in "dirty reads".

            The header is ignored if this operation is part of a Stream Transaction
            (`x-arango-trx-id` header). The header set when creating the transaction decides
            about dirty reads for the entire transaction, not the individual read operations.
          schema:
            type: boolean
        - name: x-arango-trx-id
          in: header
          required: false
          description: |
            To make this operation a part of a Stream Transaction, set this header to the
            transaction ID returned by the `POST /_api/transaction/begin` call.
          schema:
            type: string
      responses:
        '200':
          description: |
            is returned if the document was found
        '304':
          description: |
            is returned if the "If-None-Match" header is given and the document has
            the same version
        '404':
          description: |
            is returned if the document or collection was not found
        '412':
          description: |
            is returned if an "If-Match" header is given and the found
            document has a different version. The response will also contain the found
            document's current revision in the `ETag` header.
      tags:
        - Documents
```

**Examples**

```curl
---
description: ''
name: RestDocumentHandlerReadDocumentHead
---
var cn = "products";
db._drop(cn);
db._create(cn);

var document = db.products.save({"hello":"world"});
var url = "/_api/document/" + document._id;

var response = logCurlRequest('HEAD', url);

assert(response.code === 200);
db._drop(cn);
```

#### Create a document

```openapi
paths:
  /_api/document/{collection}:
    post:
      operationId: createDocument
      description: |
        Creates a new document from the document given in the body, unless there
        is already a document with the `_key` given. If no `_key` is given, a
        new unique `_key` is generated automatically. The `_id` is automatically
        set in both cases, derived from the collection name and `_key`.

        {{</* info */>}}
        An `_id` or `_rev` attribute specified in the body is ignored.
        {{</* /info */>}}

        If the document was created successfully, then the `Location` header
        contains the path to the newly created document. The `ETag` header field
        contains the revision of the document. Both are only set in the single
        document case.

        Unless `silent` is set to `true`, the body of the response contains a
        JSON object with the following attributes:
        - `_id`, containing the document identifier with the format `<collection-name>/<document-key>`.
        - `_key`, containing the document key that uniquely identifies a document within the collection.
        - `_rev`, containing the document revision.

        If the collection parameter `waitForSync` is `false`, then the call
        returns as soon as the document has been accepted. It does not wait
        until the documents have been synced to disk.

        Optionally, the query parameter `waitForSync` can be used to force
        synchronization of the document creation operation to disk even in
        case that the `waitForSync` flag had been disabled for the entire
        collection. Thus, the `waitForSync` query parameter can be used to
        force synchronization of just this specific operations. To use this,
        set the `waitForSync` parameter to `true`. If the `waitForSync`
        parameter is not specified or set to `false`, then the collection's
        default `waitForSync` behavior is applied. The `waitForSync` query
        parameter cannot be used to disable synchronization for collections
        that have a default `waitForSync` value of `true`.

        If the query parameter `returnNew` is `true`, then, for each
        generated document, the complete new document is returned under
        the `new` attribute in the result.
      parameters:
        - name: collection
          in: path
          required: true
          description: |
            Name of the `collection` in which the document is to be created.
          schema:
            type: string
        - name: waitForSync
          in: query
          required: false
          description: |
            Wait until document has been synced to disk.
          schema:
            type: boolean
        - name: returnNew
          in: query
          required: false
          description: |
            Additionally return the complete new document under the attribute `new`
            in the result.
          schema:
            type: boolean
        - name: returnOld
          in: query
          required: false
          description: |
            Additionally return the complete old document under the attribute `old`
            in the result. Only available if the overwrite option is used.
          schema:
            type: boolean
        - name: silent
          in: query
          required: false
          description: |
            If set to `true`, an empty object is returned as response if the document operation
            succeeds. No meta-data is returned for the created document. If the
            operation raises an error, an error object is returned.

            You can use this option to save network traffic.
          schema:
            type: boolean
        - name: overwrite
          in: query
          required: false
          description: |
            If set to `true`, the insert becomes a replace-insert. If a document with the
            same `_key` already exists, the new document is not rejected with unique
            constraint violation error but replaces the old document. Note that operations
            with `overwrite` parameter require a `_key` attribute in the request payload,
            therefore they can only be performed on collections sharded by `_key`.
          schema:
            type: boolean
        - name: overwriteMode
          in: query
          required: false
          description: |
            This option supersedes `overwrite` and offers the following modes
            - `"ignore"` if a document with the specified `_key` value exists already,
              nothing is done and no write operation is carried out. The
              insert operation returns success in this case. This mode does not
              support returning the old document version using `RETURN OLD`. When using
              `RETURN NEW`, `null` is returned in case the document already existed.
            - `"replace"` if a document with the specified `_key` value exists already,
              it is overwritten with the specified document value. This mode is
              also used when no overwrite mode is specified but the `overwrite`
              flag is set to `true`.
            - `"update"` if a document with the specified `_key` value exists already,
              it is patched (partially updated) with the specified document value.
              The overwrite mode can be further controlled via the `keepNull` and
              `mergeObjects` parameters.
            - `"conflict"` if a document with the specified `_key` value exists already,
              return a unique constraint violation error so that the insert operation
              fails. This is also the default behavior in case the overwrite mode is
              not set, and the `overwrite` flag is `false` or not set either.
          schema:
            type: string
        - name: keepNull
          in: query
          required: false
          description: |
            If the intention is to delete existing attributes with the update-insert
            command, set the `keepNull` URL query parameter to `false`. This modifies the
            behavior of the patch command to remove top-level attributes and sub-attributes
            from the existing document that are contained in the patch document with an
            attribute value of `null` (but not attributes of objects that are nested inside
            of arrays). This option controls the update-insert behavior only.
          schema:
            type: boolean
        - name: mergeObjects
          in: query
          required: false
          description: |
            Controls whether objects (not arrays) are merged if present in both, the
            existing and the update-insert document. If set to `false`, the value in the
            patch document overwrites the existing document's value. If set to `true`,
            objects are merged. The default is `true`.
            This option controls the update-insert behavior only.
          schema:
            type: boolean
        - name: refillIndexCaches
          in: query
          required: false
          description: |
            Whether to add new entries to in-memory index caches if document insertions
            affect the edge index or cache-enabled persistent indexes.
          schema:
            type: boolean
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - document
              properties:
                document:
                  description: |
                    A JSON representation of a single document.
                  type: object
      responses:
        '201':
          description: |
            is returned if the documents were created successfully and
            `waitForSync` was `true`.
        '202':
          description: |
            is returned if the documents were created successfully and
            `waitForSync` was `false`.
        '400':
          description: |
            is returned if the body does not contain a valid JSON representation
            of one document. The response body contains
            an error document in this case.
        '403':
          description: |
            with the error code `1004` is returned if the specified write concern for the
            collection cannot be fulfilled. This can happen if less than the number of
            specified replicas for a shard are currently in-sync with the leader. For example,
            if the write concern is `2` and the replication factor is `3`, then the
            write concern is not fulfilled if two replicas are not in-sync.
        '404':
          description: |
            is returned if the collection specified by `collection` is unknown.
            The response body contains an error document in this case.
        '409':
          description: |
            There are two possible reasons for this error in the single document case
        '503':
          description: |
            is returned if the system is temporarily not available. This can be a system
            overload or temporary failure. In this case it makes sense to retry the request
            later.
      tags:
        - Documents
```

**Examples**

```curl
---
description: |-
  Create a document in a collection named `products`. Note that the
  revision identifier might or might not by equal to the auto-generated
  key.
name: RestDocumentHandlerPostCreate1
---
var cn = "products";
db._drop(cn);
db._create(cn, { waitForSync: true });

var url = "/_api/document/" + cn;
var body = '{ "Hello": "World" }';

var response = logCurlRequest('POST', url, body);

assert(response.code === 201);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Create a document in a collection named `products` with a collection-level
  `waitForSync` value of `false`.
name: RestDocumentHandlerPostAccept1
---
var cn = "products";
db._drop(cn);
db._create(cn, { waitForSync: false });

var url = "/_api/document/" + cn;
var body = '{ "Hello": "World" }';

var response = logCurlRequest('POST', url, body);

assert(response.code === 202);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Create a document in a collection with a collection-level `waitForSync`
  value of `false`, but using the `waitForSync` query parameter.
name: RestDocumentHandlerPostWait1
---
var cn = "products";
db._drop(cn);
db._create(cn, { waitForSync: false });

var url = "/_api/document/" + cn + "?waitForSync=true";
var body = '{ "Hello": "World" }';

var response = logCurlRequest('POST', url, body);

assert(response.code === 201);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Unknown collection name
name: RestDocumentHandlerPostUnknownCollection1
---
var cn = "products";

var url = "/_api/document/" + cn;
var body = '{ "Hello": "World" }';

var response = logCurlRequest('POST', url, body);

assert(response.code === 404);

logJsonResponse(response);
```

```curl
---
description: |-
  Illegal document
name: RestDocumentHandlerPostBadJson1
---
var cn = "products";
db._drop(cn);
db._create(cn);

var url = "/_api/document/" + cn;
var body = '{ 1: "World" }';

var response = logCurlRequest('POST', url, body);

assert(response.code === 400);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Use of returnNew:
name: RestDocumentHandlerPostReturnNew
---
var cn = "products";
db._drop(cn);
db._create(cn);

var url = "/_api/document/" + cn + "?returnNew=true";
var body = '{"Hello":"World"}';

var response = logCurlRequest('POST', url, body);

assert(response.code === 202);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: ''
name: RestDocumentHandlerPostOverwrite
---
var cn = "products";
db._drop(cn);
db._create(cn, { waitForSync: true });

var url = "/_api/document/" + cn;
var body = '{ "Hello": "World", "_key" : "lock" }';
var response = logCurlRequest('POST', url, body);
// insert
assert(response.code === 201);
logJsonResponse(response);

body = '{ "Hello": "Universe", "_key" : "lock" }';
url = "/_api/document/" + cn + "?overwrite=true";
response = logCurlRequest('POST', url, body);
// insert same key
assert(response.code === 201);
logJsonResponse(response);

db._drop(cn);
```

#### Replace a document

```openapi
paths:
  /_api/document/{collection}/{key}:
    put:
      operationId: replaceDocument
      description: |
        Replaces the specified document with the one in the body, provided there is
        such a document and no precondition is violated.

        The values of the `_key`, `_id`, and `_rev` system attributes as well as
        attributes used as sharding keys cannot be changed.

        If the `If-Match` header is specified and the revision of the
        document in the database is unequal to the given revision, the
        precondition is violated.

        If `If-Match` is not given and `ignoreRevs` is `false` and there
        is a `_rev` attribute in the body and its value does not match
        the revision of the document in the database, the precondition is
        violated.

        If a precondition is violated, an *HTTP 412* is returned.

        If the document exists and can be updated, then an *HTTP 201* or
        an *HTTP 202* is returned (depending on `waitForSync`, see below),
        the `ETag` header field contains the new revision of the document
        and the `Location` header contains a complete URL under which the
        document can be queried.

        Cluster only: The replace documents _may_ contain
        values for the collection's pre-defined shard keys. Values for the shard keys
        are treated as hints to improve performance. Should the shard keys
        values be incorrect ArangoDB may answer with a *not found* error.

        Optionally, the query parameter `waitForSync` can be used to force
        synchronization of the document replacement operation to disk even in case
        that the `waitForSync` flag had been disabled for the entire collection.
        Thus, the `waitForSync` query parameter can be used to force synchronization
        of just specific operations. To use this, set the `waitForSync` parameter
        to `true`. If the `waitForSync` parameter is not specified or set to
        `false`, then the collection's default `waitForSync` behavior is
        applied. The `waitForSync` query parameter cannot be used to disable
        synchronization for collections that have a default `waitForSync` value
        of `true`.
        
        Unless `silent` is set to `true`, the body of the response contains a
        JSON object with the following attributes:
        - `_id`, containing the document identifier with the format `<collection-name>/<document-key>`.
        - `_key`, containing the document key that uniquely identifies a document within the collection.
        - `_rev`, containing the new document revision.

        If the query parameter `returnOld` is `true`, then
        the complete previous revision of the document
        is returned under the `old` attribute in the result.

        If the query parameter `returnNew` is `true`, then
        the complete new document is returned under
        the `new` attribute in the result.

        If the document does not exist, then a *HTTP 404* is returned and the
        body of the response contains an error document.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - document
              properties:
                document:
                  description: |
                    A JSON representation of a single document.
                  type: object
      parameters:
        - name: collection
          in: path
          required: true
          description: |
            Name of the `collection` in which the document is to be replaced.
          schema:
            type: string
        - name: key
          in: path
          required: true
          description: |
            The document key.
          schema:
            type: string
        - name: waitForSync
          in: query
          required: false
          description: |
            Wait until document has been synced to disk.
          schema:
            type: boolean
        - name: ignoreRevs
          in: query
          required: false
          description: |
            By default, or if this is set to `true`, the `_rev` attributes in
            the given document is ignored. If this is set to `false`, then
            the `_rev` attribute given in the body document is taken as a
            precondition. The document is only replaced if the current revision
            is the one specified.
          schema:
            type: boolean
        - name: returnOld
          in: query
          required: false
          description: |
            Return additionally the complete previous revision of the changed
            document under the attribute `old` in the result.
          schema:
            type: boolean
        - name: returnNew
          in: query
          required: false
          description: |
            Return additionally the complete new document under the attribute `new`
            in the result.
          schema:
            type: boolean
        - name: silent
          in: query
          required: false
          description: |
            If set to `true`, an empty object is returned as response if the document operation
            succeeds. No meta-data is returned for the replaced document. If the
            operation raises an error, an error object is returned.

            You can use this option to save network traffic.
          schema:
            type: boolean
        - name: refillIndexCaches
          in: query
          required: false
          description: |
            Whether to update existing entries in in-memory index caches if documents
            replacements affect the edge index or cache-enabled persistent indexes.
          schema:
            type: boolean
        - name: If-Match
          in: header
          required: false
          description: |
            You can conditionally replace a document based on a target revision id by
            using the `if-match` HTTP header.
          schema:
            type: string
      responses:
        '201':
          description: |
            is returned if the document was replaced successfully and
            `waitForSync` was `true`.
        '202':
          description: |
            is returned if the document was replaced successfully and
            `waitForSync` was `false`.
        '400':
          description: |
            is returned if the body does not contain a valid JSON representation
            of a document. The response body contains
            an error document in this case.
        '403':
          description: |
            with the error code `1004` is returned if the specified write concern for the
            collection cannot be fulfilled. This can happen if less than the number of
            specified replicas for a shard are currently in-sync with the leader. For example,
            if the write concern is `2` and the replication factor is `3`, then the
            write concern is not fulfilled if two replicas are not in-sync.
        '404':
          description: |
            is returned if the collection or the document was not found.
        '409':
          description: |
            There are two possible reasons for this error
        '412':
          description: |
            is returned if the precondition is violated. The response also contains
            the found documents' current revisions in the `_rev` attributes.
            Additionally, the attributes `_id` and `_key` are returned.
        '503':
          description: |
            is returned if the system is temporarily not available. This can be a system
            overload or temporary failure. In this case it makes sense to retry the request
            later.
      tags:
        - Documents
```

**Examples**

```curl
---
description: |-
  Using a document identifier
name: RestDocumentHandlerUpdateDocument
---
var cn = "products";
db._drop(cn);
db._create(cn);

var document = db.products.save({"hello":"world"});
var url = "/_api/document/" + document._id;

var response = logCurlRequest('PUT', url, '{"Hello": "you"}');

assert(response.code === 202);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Unknown document identifier
name: RestDocumentHandlerUpdateDocumentUnknownHandle
---
var cn = "products";
db._drop(cn);
db._create(cn);

var document = db.products.save({"hello":"world"});
db.products.remove(document._id);
var url = "/_api/document/" + document._id;

var response = logCurlRequest('PUT', url, "{}");

assert(response.code === 404);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Produce a revision conflict
name: RestDocumentHandlerUpdateDocumentIfMatchOther
---
var cn = "products";
db._drop(cn);
db._create(cn);

var document = db.products.save({"hello":"world"});
var document2 = db.products.save({"hello2":"world"});
var url = "/_api/document/" + document._id;
var headers = {"If-Match":  "\"" + document2._rev + "\""};

var response = logCurlRequest('PUT', url, '{"other":"content"}', headers);

assert(response.code === 412);

logJsonResponse(response);
db._drop(cn);
```

#### Update a document

```openapi
paths:
  /_api/document/{collection}/{key}:
    patch:
      operationId: updateDocument
      description: |
        Partially updates the document identified by the *document ID*.
        The body of the request must contain a JSON document with the
        attributes to patch (the patch document). All attributes from the
        patch document are added to the existing document if they do not
        yet exist, and overwritten in the existing document if they do exist
        there.

        The values of the `_key`, `_id`, and `_rev` system attributes as well as
        attributes used as sharding keys cannot be changed.

        Setting an attribute value to `null` in the patch document causes a
        value of `null` to be saved for the attribute by default.

        If the `If-Match` header is specified and the revision of the
        document in the database is unequal to the given revision, the
        precondition is violated.

        If `If-Match` is not given and `ignoreRevs` is `false` and there
        is a `_rev` attribute in the body and its value does not match
        the revision of the document in the database, the precondition is
        violated.

        If a precondition is violated, an *HTTP 412* is returned.

        If the document exists and can be updated, then an *HTTP 201* or
        an *HTTP 202* is returned (depending on `waitForSync`, see below),
        the `ETag` header field contains the new revision of the document
        (in double quotes) and the `Location` header contains a complete URL
        under which the document can be queried.

        Cluster only: The patch document _may_ contain
        values for the collection's pre-defined shard keys. Values for the shard keys
        are treated as hints to improve performance. Should the shard keys
        values be incorrect ArangoDB may answer with a `not found` error

        Optionally, the query parameter `waitForSync` can be used to force
        synchronization of the updated document operation to disk even in case
        that the `waitForSync` flag had been disabled for the entire collection.
        Thus, the `waitForSync` query parameter can be used to force synchronization
        of just specific operations. To use this, set the `waitForSync` parameter
        to `true`. If the `waitForSync` parameter is not specified or set to
        `false`, then the collection's default `waitForSync` behavior is
        applied. The `waitForSync` query parameter cannot be used to disable
        synchronization for collections that have a default `waitForSync` value
        of `true`.
        
        Unless `silent` is set to `true`, the body of the response contains a
        JSON object with the following attributes:
        - `_id`, containing the document identifier with the format `<collection-name>/<document-key>`.
        - `_key`, containing the document key that uniquely identifies a document within the collection.
        - `_rev`, containing the new document revision.

        If the query parameter `returnOld` is `true`, then
        the complete previous revision of the document
        is returned under the `old` attribute in the result.

        If the query parameter `returnNew` is `true`, then
        the complete new document is returned under
        the `new` attribute in the result.

        If the document does not exist, then a *HTTP 404* is returned and the
        body of the response contains an error document.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - document
              properties:
                document:
                  description: |
                    A JSON representation of a document update as an object.
                  type: object
      parameters:
        - name: collection
          in: path
          required: true
          description: |
            Name of the `collection` in which the document is to be updated.
          schema:
            type: string
        - name: key
          in: path
          required: true
          description: |
            The document key.
          schema:
            type: string
        - name: keepNull
          in: query
          required: false
          description: |
            If the intention is to delete existing attributes with the patch
            command, set the `keepNull` URL query parameter to `false`. This modifies the
            behavior of the patch command to remove top-level attributes and sub-attributes
            from the existing document that are contained in the patch document with an
            attribute value of `null` (but not attributes of objects that are nested inside
            of arrays).
          schema:
            type: boolean
        - name: mergeObjects
          in: query
          required: false
          description: |
            Controls whether objects (not arrays) are merged if present in
            both the existing and the patch document. If set to `false`, the
            value in the patch document overwrites the existing document's
            value. If set to `true`, objects are merged. The default is
            `true`.
          schema:
            type: boolean
        - name: waitForSync
          in: query
          required: false
          description: |
            Wait until document has been synced to disk.
          schema:
            type: boolean
        - name: ignoreRevs
          in: query
          required: false
          description: |
            By default, or if this is set to `true`, the `_rev` attributes in
            the given document is ignored. If this is set to `false`, then
            the `_rev` attribute given in the body document is taken as a
            precondition. The document is only updated if the current revision
            is the one specified.
          schema:
            type: boolean
        - name: returnOld
          in: query
          required: false
          description: |
            Return additionally the complete previous revision of the changed
            document under the attribute `old` in the result.
          schema:
            type: boolean
        - name: returnNew
          in: query
          required: false
          description: |
            Return additionally the complete new document under the attribute `new`
            in the result.
          schema:
            type: boolean
        - name: silent
          in: query
          required: false
          description: |
            If set to `true`, an empty object is returned as response if the document operation
            succeeds. No meta-data is returned for the updated document. If the
            operation raises an error, an error object is returned.

            You can use this option to save network traffic.
          schema:
            type: boolean
        - name: refillIndexCaches
          in: query
          required: false
          description: |
            Whether to update existing entries in in-memory index caches if document updates
            affect the edge index or cache-enabled persistent indexes.
          schema:
            type: boolean
        - name: If-Match
          in: header
          required: false
          description: |
            You can conditionally update a document based on a target revision id by
            using the `if-match` HTTP header.
          schema:
            type: string
      responses:
        '201':
          description: |
            is returned if the document was updated successfully and
            `waitForSync` was `true`.
        '202':
          description: |
            is returned if the document was updated successfully and
            `waitForSync` was `false`.
        '400':
          description: |
            is returned if the body does not contain a valid JSON representation
            of a document. The response body contains
            an error document in this case.
        '403':
          description: |
            with the error code `1004` is returned if the specified write concern for the
            collection cannot be fulfilled. This can happen if less than the number of
            specified replicas for a shard are currently in-sync with the leader. For example,
            if the write concern is `2` and the replication factor is `3`, then the
            write concern is not fulfilled if two replicas are not in-sync.
        '404':
          description: |
            is returned if the collection or the document was not found.
        '409':
          description: |
            There are two possible reasons for this error
        '412':
          description: |
            is returned if the precondition was violated. The response also contains
            the found documents' current revisions in the `_rev` attributes.
            Additionally, the attributes `_id` and `_key` are returned.
        '503':
          description: |
            is returned if the system is temporarily not available. This can be a system
            overload or temporary failure. In this case it makes sense to retry the request
            later.
      tags:
        - Documents
```

**Examples**

```curl
---
description: |-
  Patches an existing document with new content.
name: RestDocumentHandlerPatchDocument
---
var cn = "products";
db._drop(cn);
db._create(cn);

var document = db.products.save({"one":"world"});
var url = "/_api/document/" + document._id;

var response = logCurlRequest("PATCH", url, { "hello": "world" });

assert(response.code === 202);

logJsonResponse(response);
var response2 = logCurlRequest("PATCH", url, { "numbers": { "one": 1, "two": 2, "three": 3, "empty": null } });
assert(response2.code === 202);
logJsonResponse(response2);
var response3 = logCurlRequest("GET", url);
assert(response3.code === 200);
logJsonResponse(response3);
var response4 = logCurlRequest("PATCH", url + "?keepNull=false", { "hello": null, "numbers": { "four": 4 } });
assert(response4.code === 202);
logJsonResponse(response4);
var response5 = logCurlRequest("GET", url);
assert(response5.code === 200);
logJsonResponse(response5);
db._drop(cn);
```

```curl
---
description: |-
  Merging attributes of an object using `mergeObjects`:
name: RestDocumentHandlerPatchDocumentMerge
---
var cn = "products";
db._drop(cn);
db._create(cn);

var document = db.products.save({"inhabitants":{"china":1366980000,"india":1263590000,"usa":319220000}});
var url = "/_api/document/" + document._id;

var response = logCurlRequest("GET", url);
assert(response.code === 200);
logJsonResponse(response);

var response = logCurlRequest("PATCH", url + "?mergeObjects=true", { "inhabitants": {"indonesia":252164800,"brazil":203553000 }});
assert(response.code === 202);

var response2 = logCurlRequest("GET", url);
assert(response2.code === 200);
logJsonResponse(response2);

var response3 = logCurlRequest("PATCH", url + "?mergeObjects=false", { "inhabitants": { "pakistan":188346000 }});
assert(response3.code === 202);
logJsonResponse(response3);

var response4 = logCurlRequest("GET", url);
assert(response4.code === 200);
logJsonResponse(response4);
db._drop(cn);
```

#### Remove a document

```openapi
paths:
  /_api/document/{collection}/{key}:
    delete:
      operationId: deleteDocument
      description: |
        Unless `silent` is set to `true`, the body of the response contains a
        JSON object with the following attributes:
        - `_id`, containing the document identifier with the format `<collection-name>/<document-key>`.
        - `_key`, containing the document key that uniquely identifies a document within the collection.
        - `_rev`, containing the document revision.

        If the `waitForSync` parameter is not specified or set to `false`,
        then the collection's default `waitForSync` behavior is applied.
        The `waitForSync` query parameter cannot be used to disable
        synchronization for collections that have a default `waitForSync`
        value of `true`.

        If the query parameter `returnOld` is `true`, then
        the complete previous revision of the document
        is returned under the `old` attribute in the result.
      parameters:
        - name: collection
          in: path
          required: true
          description: |
            Name of the `collection` in which the document is to be deleted.
          schema:
            type: string
        - name: key
          in: path
          required: true
          description: |
            The document key.
          schema:
            type: string
        - name: waitForSync
          in: query
          required: false
          description: |
            Wait until deletion operation has been synced to disk.
          schema:
            type: boolean
        - name: returnOld
          in: query
          required: false
          description: |
            Return additionally the complete previous revision of the changed
            document under the attribute `old` in the result.
          schema:
            type: boolean
        - name: silent
          in: query
          required: false
          description: |
            If set to `true`, an empty object is returned as response if the document operation
            succeeds. No meta-data is returned for the deleted document. If the
            operation raises an error, an error object is returned.

            You can use this option to save network traffic.
          schema:
            type: boolean
        - name: refillIndexCaches
          in: query
          required: false
          description: |
            Whether to delete existing entries from in-memory index caches and refill them
            if document removals affect the edge index or cache-enabled persistent indexes.
          schema:
            type: boolean
        - name: If-Match
          in: header
          required: false
          description: |
            You can conditionally remove a document based on a target revision id by
            using the `if-match` HTTP header.
          schema:
            type: string
      responses:
        '200':
          description: |
            is returned if the document was removed successfully and
            `waitForSync` was `true`.
        '202':
          description: |
            is returned if the document was removed successfully and
            `waitForSync` was `false`.
        '403':
          description: |
            with the error code `1004` is returned if the specified write concern for the
            collection cannot be fulfilled. This can happen if less than the number of
            specified replicas for a shard are currently in-sync with the leader. For example,
            if the write concern is `2` and the replication factor is `3`, then the
            write concern is not fulfilled if two replicas are not in-sync.
        '404':
          description: |
            is returned if the collection or the document was not found.
            The response body contains an error document in this case.
        '409':
          description: |
            is returned if locking the document key failed due to another
            concurrent operation that operates on the same document.
            This is also referred to as a _write-write conflict_.
            The response body contains an error document with the
            `errorNum` set to `1200` (`ERROR_ARANGO_CONFLICT`) in this case.
        '412':
          description: |
            is returned if a "If-Match" header or `rev` is given and the found
            document has a different version. The response also contain the found
            document's current revision in the `_rev` attribute. Additionally, the
            attributes `_id` and `_key` are returned.
        '503':
          description: |
            is returned if the system is temporarily not available. This can be a system
            overload or temporary failure. In this case it makes sense to retry the request
            later.
      tags:
        - Documents
```

**Examples**

```curl
---
description: |-
  Using document identifier:
name: RestDocumentHandlerDeleteDocument
---
var cn = "products";
db._drop(cn);
db._create(cn, { waitForSync: true });
var document = db.products.save({"hello":"world"});

var url = "/_api/document/" + document._id;

var response = logCurlRequest('DELETE', url);

assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Unknown document identifier:
name: RestDocumentHandlerDeleteDocumentUnknownHandle
---
var cn = "products";
db._drop(cn);
db._create(cn, { waitForSync: true });
var document = db.products.save({"hello":"world"});
db.products.remove(document._id);

var url = "/_api/document/" + document._id;

var response = logCurlRequest('DELETE', url);

assert(response.code === 404);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Revision conflict:
name: RestDocumentHandlerDeleteDocumentIfMatchOther
---
var cn = "products";
db._drop(cn);
db._create(cn);

var document = db.products.save({"hello":"world"});
var document2 = db.products.save({"hello2":"world"});
var url = "/_api/document/" + document._id;
var headers = {"If-Match":  "\"" + document2._rev + "\""};

var response = logCurlRequest('DELETE', url, "", headers);

assert(response.code === 412);

logJsonResponse(response);
db._drop(cn);
```

#### Document ETags

ArangoDB tries to adhere to the existing HTTP standard as far as
possible. To this end, results of single document queries have the `ETag`
HTTP header set to the [document revision](../../concepts/data-structure/documents/_index.md#document-revisions)
(the value of `_rev` document attribute) enclosed in double quotes.

You can check the revision of a document using the `HEAD` HTTP method.

If you want to query, replace, update, replace, or delete a document, then you
can use the `If-Match` header to detect conflicts. If the document has changed,
the operation is aborted and an HTTP `412 Precondition failed` status code is
returned.

If you obtain a document using `GET` and you want to check whether a newer
revision is available, then you can use the `If-None-Match` HTTP header. If the
document is unchanged (same document revision), an HTTP `412 Precondition failed`
status code is returned.

### Multiple document operations

ArangoDB supports working with documents in bulk. Bulk operations affect a
*single* collection. Using this API variant allows clients to amortize the
overhead of single requests over an entire batch of documents. Bulk operations
are **not guaranteed** to be executed serially, ArangoDB _may_ execute the
operations in parallel. This can translate into large performance improvements
especially in a cluster deployment.

ArangoDB continues to process the remaining operations should an error
occur during the processing of one operation. Errors are returned _inline_ in
the response body as an error document (see below for more details).
Additionally, the `X-Arango-Error-Codes` header is set. It contains a
map of the error codes and how often each kind of error occurred. For
example, `1200:17,1205:10` means that in 17 cases the error 1200
("revision conflict") has happened, and in 10 cases the error 1205
("illegal document handle").

Generally, the bulk operations expect an input array and the result body
contains a JSON array of the same length.

#### Get multiple documents

```openapi
paths:
  /_api/document/{collection}#get:
    put:
      operationId: getDocuments
      description: |
        {{</* warning */>}}
        The endpoint for getting multiple documents is the same as for replacing
        multiple documents but with an additional query parameter:
        `PUT /_api/document/{collection}?onlyget=true`. This is because a lot of
        software does not support payload bodies in `GET` requests.
        {{</* /warning */>}}

        Returns the documents identified by their `_key` in the body objects.
        The body of the request _must_ contain a JSON array of either
        strings (the `_key` values to lookup) or search documents.

        A search document _must_ contain at least a value for the `_key` field.
        A value for `_rev` _may_ be specified to verify whether the document
        has the same revision value, unless _ignoreRevs_ is set to false.

        Cluster only: The search document _may_ contain
        values for the collection's pre-defined shard keys. Values for the shard keys
        are treated as hints to improve performance. Should the shard keys
        values be incorrect ArangoDB may answer with a *not found* error.

        The returned array of documents contain three special attributes: 
        - `_id`, containing the document identifier with the format `<collection-name>/<document-key>`.
        - `_key`, containing the document key that uniquely identifies a document within the collection.
        - `_rev`, containing the document revision.
      parameters:
        - name: collection
          in: path
          required: true
          description: |
            Name of the `collection` from which the documents are to be read.
          schema:
            type: string
        - name: onlyget
          in: query
          required: true
          description: |
            This parameter is required to be `true`, otherwise a replace
            operation is executed!
          schema:
            type: boolean
        - name: ignoreRevs
          in: query
          required: false
          description: |
            Should the value be `true` (the default)
            If a search document contains a value for the `_rev` field,
            then the document is only returned if it has the same revision value.
            Otherwise a precondition failed error is returned.
          schema:
            type: string
        - name: x-arango-allow-dirty-read
          in: header
          required: false
          description: |
            Set this header to `true` to allow the Coordinator to ask any shard replica for
            the data, not only the shard leader. This may result in "dirty reads".

            The header is ignored if this operation is part of a Stream Transaction
            (`x-arango-trx-id` header). The header set when creating the transaction decides
            about dirty reads for the entire transaction, not the individual read operations.
          schema:
            type: boolean
        - name: x-arango-trx-id
          in: header
          required: false
          description: |
            To make this operation a part of a Stream Transaction, set this header to the
            transaction ID returned by the `POST /_api/transaction/begin` call.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - documents
              properties:
                documents:
                  description: |
                    An array of documents to retrieve.
                  type: json
      responses:
        '200':
          description: |
            is returned if no error happened
        '400':
          description: |
            is returned if the body does not contain a valid JSON representation
            of an array of documents. The response body contains
            an error document in this case.
        '404':
          description: |
            is returned if the collection was not found.
      tags:
        - Documents
```

**Examples**

```curl
---
description: |-
  Reading multiple documents identifier:
name: RestDocumentHandlerReadMultiDocument
---
var cn = "products";
db._drop(cn);
db._create(cn);

db.products.save({"_key":"doc1", "hello":"world"});
db.products.save({"_key":"doc2", "say":"hi to mom"});
var url = "/_api/document/products?onlyget=true";
var body = '["doc1", {"_key":"doc2"}]';

var response = logCurlRequest('PUT', url, body);

assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```

#### Create multiple documents

```openapi
paths:
  /_api/document/{collection}#multiple:
    post:
      operationId: createDocuments
      description: |
        Creates new documents from the documents given in the body, unless there
        is already a document with the `_key` given. If no `_key` is given, a new
        unique `_key` is generated automatically. The `_id` is automatically
        set in both cases, derived from the collection name and `_key`.

        The result body contains a JSON array of the
        same length as the input array, and each entry contains the result
        of the operation for the corresponding input. In case of an error
        the entry is a document with attributes `error` set to `true` and
        errorCode set to the error code that has happened.

        {{</* info */>}}
        Any `_id` or `_rev` attribute specified in the body is ignored.
        {{</* /info */>}}

        Unless `silent` is set to `true`, the body of the response contains an
        array of JSON objects with the following attributes:
        - `_id`, containing the document identifier with the format `<collection-name>/<document-key>`.
        - `_key`, containing the document key that uniquely identifies a document within the collection.
        - `_rev`, containing the document revision.

        If the collection parameter `waitForSync` is `false`, then the call
        returns as soon as the documents have been accepted. It does not wait
        until the documents have been synced to disk.

        Optionally, the query parameter `waitForSync` can be used to force
        synchronization of the document creation operation to disk even in
        case that the `waitForSync` flag had been disabled for the entire
        collection. Thus, the `waitForSync` query parameter can be used to
        force synchronization of just this specific operations. To use this,
        set the `waitForSync` parameter to `true`. If the `waitForSync`
        parameter is not specified or set to `false`, then the collection's
        default `waitForSync` behavior is applied. The `waitForSync` query
        parameter cannot be used to disable synchronization for collections
        that have a default `waitForSync` value of `true`.

        If the query parameter `returnNew` is `true`, then, for each
        generated document, the complete new document is returned under
        the `new` attribute in the result.

        Should an error have occurred with some of the documents,
        the `X-Arango-Error-Codes` HTTP header is set. It contains a map of the
        error codes and how often each kind of error occurred. For example,
        `1200:17,1205:10` means that in 17 cases the error 1200 ("revision conflict")
        has happened, and in 10 cases the error 1205 ("illegal document handle").
      parameters:
        - name: collection
          in: path
          required: true
          description: |
            Name of the `collection` in which the documents are to be created.
          schema:
            type: string
        - name: waitForSync
          in: query
          required: false
          description: |
            Wait until document has been synced to disk.
          schema:
            type: boolean
        - name: returnNew
          in: query
          required: false
          description: |
            Additionally return the complete new document under the attribute `new`
            in the result.
          schema:
            type: boolean
        - name: returnOld
          in: query
          required: false
          description: |
            Additionally return the complete old document under the attribute `old`
            in the result. Only available if the overwrite option is used.
          schema:
            type: boolean
        - name: silent
          in: query
          required: false
          description: |
            If set to `true`, an empty object is returned as response if all document operations
            succeed. No meta-data is returned for the created documents. If any of the
            operations raises an error, an array with the error object(s) is returned.

            You can use this option to save network traffic but you cannot map any errors
            to the inputs of your request.
          schema:
            type: boolean
        - name: overwrite
          in: query
          required: false
          description: |
            If set to `true`, the insert becomes a replace-insert. If a document with the
            same `_key` already exists, the new document is not rejected with a unique
            constraint violation error but replaces the old document. Note that operations
            with `overwrite` parameter require a `_key` attribute in the request payload,
            therefore they can only be performed on collections sharded by `_key`.
          schema:
            type: boolean
        - name: overwriteMode
          in: query
          required: false
          description: |
            This option supersedes `overwrite` and offers the following modes
            - `"ignore"` if a document with the specified `_key` value exists already,
              nothing is done and no write operation is carried out. The
              insert operation returns success in this case. This mode does not
              support returning the old document version using `RETURN OLD`. When using
              `RETURN NEW`, `null` is returned in case the document already existed.
            - `"replace"` if a document with the specified `_key` value exists already,
              it is overwritten with the specified document value. This mode is
              also used when no overwrite mode is specified but the `overwrite`
              flag is set to `true`.
            - `"update"` if a document with the specified `_key` value exists already,
              it is patched (partially updated) with the specified document value.
              The overwrite mode can be further controlled via the `keepNull` and
              `mergeObjects` parameters.
            - `"conflict"` if a document with the specified `_key` value exists already,
              return a unique constraint violation error so that the insert operation
              fails. This is also the default behavior in case the overwrite mode is
              not set, and the `overwrite` flag is `false` or not set either.
          schema:
            type: string
        - name: keepNull
          in: query
          required: false
          description: |
            If the intention is to delete existing attributes with the update-insert
            command, set the `keepNull` URL query parameter to `false`. This modifies the
            behavior of the patch command to remove top-level attributes and sub-attributes
            from the existing document that are contained in the patch document with an
            attribute value of `null` (but not attributes of objects that are nested inside
            of arrays). This option controls the update-insert behavior only.
          schema:
            type: boolean
        - name: mergeObjects
          in: query
          required: false
          description: |
            Controls whether objects (not arrays) are merged if present in both, the
            existing and the update-insert document. If set to `false`, the value in the
            patch document overwrites the existing document's value. If set to `true`,
            objects are merged. The default is `true`.
            This option controls the update-insert behavior only.
          schema:
            type: boolean
        - name: refillIndexCaches
          in: query
          required: false
          description: |
            Whether to add new entries to in-memory index caches if document insertions
            affect the edge index or cache-enabled persistent indexes.
          schema:
            type: boolean
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - documents
              properties:
                documents:
                  description: |
                    An array of documents to create.
                  type: json
      responses:
        '201':
          description: |
            is returned if `waitForSync` was `true` and operations were processed.
        '202':
          description: |
            is returned if `waitForSync` was `false` and operations were processed.
        '400':
          description: |
            is returned if the body does not contain a valid JSON representation
            of an array of documents. The response body contains
            an error document in this case.
        '403':
          description: |
            with the error code `1004` is returned if the specified write concern for the
            collection cannot be fulfilled. This can happen if less than the number of
            specified replicas for a shard are currently in-sync with the leader. For example,
            if the write concern is `2` and the replication factor is `3`, then the
            write concern is not fulfilled if two replicas are not in-sync.
        '404':
          description: |
            is returned if the collection specified by `collection` is unknown.
            The response body contains an error document in this case.
        '503':
          description: |
            is returned if the system is temporarily not available. This can be a system
            overload or temporary failure. In this case it makes sense to retry the request
            later.
      tags:
        - Documents
```

**Examples**

```curl
---
description: |-
  Insert multiple documents:
name: RestDocumentHandlerPostMulti1
---
var cn = "products";
db._drop(cn);
db._create(cn);

var url = "/_api/document/" + cn;
var body = '[{"Hello":"Earth"}, {"Hello":"Venus"}, {"Hello":"Mars"}]';

var response = logCurlRequest('POST', url, body);

assert(response.code === 202);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Use of returnNew:
name: RestDocumentHandlerPostMulti2
---
var cn = "products";
db._drop(cn);
db._create(cn);

var url = "/_api/document/" + cn + "?returnNew=true";
var body = '[{"Hello":"Earth"}, {"Hello":"Venus"}, {"Hello":"Mars"}]';

var response = logCurlRequest('POST', url, body);

assert(response.code === 202);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Partially illegal documents:
name: RestDocumentHandlerPostBadJsonMulti
---
var cn = "products";
db._drop(cn);
db._create(cn);

var url = "/_api/document/" + cn;
var body = '[{ "_key": 111 }, {"_key":"abc"}]';

var response = logCurlRequest('POST', url, body);

assert(response.code === 202);

logJsonResponse(response);
db._drop(cn);
```

#### Replace multiple documents

```openapi
paths:
  /_api/document/{collection}:
    put:
      operationId: replaceDocuments
      description: |
        Replaces multiple documents in the specified collection with the
        ones in the body, the replaced documents are specified by the `_key`
        attributes in the body documents.

        The values of the `_key`, `_id`, and `_rev` system attributes as well as
        attributes used as sharding keys cannot be changed.

        If `ignoreRevs` is `false` and there is a `_rev` attribute in a
        document in the body and its value does not match the revision of
        the corresponding document in the database, the precondition is
        violated.

        Cluster only: The replace documents _may_ contain
        values for the collection's pre-defined shard keys. Values for the shard keys
        are treated as hints to improve performance. Should the shard keys
        values be incorrect ArangoDB may answer with a `not found` error.

        Optionally, the query parameter `waitForSync` can be used to force
        synchronization of the document replacement operation to disk even in case
        that the `waitForSync` flag had been disabled for the entire collection.
        Thus, the `waitForSync` query parameter can be used to force synchronization
        of just specific operations. To use this, set the `waitForSync` parameter
        to `true`. If the `waitForSync` parameter is not specified or set to
        `false`, then the collection's default `waitForSync` behavior is
        applied. The `waitForSync` query parameter cannot be used to disable
        synchronization for collections that have a default `waitForSync` value
        of `true`.

        The body of the response contains a JSON array of the same length
        as the input array with the information about the identifier and the
        revision of the replaced documents. In each element has the following
        attributes:
        - `_id`, containing the document identifier with the format `<collection-name>/<document-key>`.
        - `_key`, containing the document key that uniquely identifies a document within the collection.
        - `_rev`, containing the new document revision.

        In case of an error or violated precondition, an error
        object with the attribute `error` set to `true` and the attribute
        `errorCode` set to the error code is built.

        If the query parameter `returnOld` is `true`, then, for each
        generated document, the complete previous revision of the document
        is returned under the `old` attribute in the result.

        If the query parameter `returnNew` is `true`, then, for each
        generated document, the complete new document is returned under
        the `new` attribute in the result.

        Note that if any precondition is violated or an error occurred with
        some of the documents, the return code is still 201 or 202, but the
        `X-Arango-Error-Codes` HTTP header is set. It contains a map of the
        error codes and how often each kind of error occurred. For example,
        `1200:17,1205:10` means that in 17 cases the error 1200 ("revision conflict")
        has happened, and in 10 cases the error 1205 ("illegal document handle").
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - documents
              properties:
                documents:
                  description: |
                    A JSON representation of an array of documents.
                    Each element has to contain a `_key` attribute.
                  type: json
      parameters:
        - name: collection
          in: path
          required: true
          description: |
            This URL parameter is the name of the collection in which the
            documents are replaced.
          schema:
            type: string
        - name: waitForSync
          in: query
          required: false
          description: |
            Wait until the new documents have been synced to disk.
          schema:
            type: boolean
        - name: ignoreRevs
          in: query
          required: false
          description: |
            By default, or if this is set to `true`, the `_rev` attributes in
            the given documents are ignored. If this is set to `false`, then
            any `_rev` attribute given in a body document is taken as a
            precondition. The document is only replaced if the current revision
            is the one specified.
          schema:
            type: boolean
        - name: returnOld
          in: query
          required: false
          description: |
            Return additionally the complete previous revision of the changed
            documents under the attribute `old` in the result.
          schema:
            type: boolean
        - name: returnNew
          in: query
          required: false
          description: |
            Return additionally the complete new documents under the attribute `new`
            in the result.
          schema:
            type: boolean
        - name: silent
          in: query
          required: false
          description: |
            If set to `true`, an empty object is returned as response if all document operations
            succeed. No meta-data is returned for the replaced documents. If at least one
            operation raises an error, an array with the error object(s) is returned.

            You can use this option to save network traffic but you cannot map any errors
            to the inputs of your request.
          schema:
            type: boolean
        - name: refillIndexCaches
          in: query
          required: false
          description: |
            Whether to update existing entries in in-memory index caches if documents
            replacements affect the edge index or cache-enabled persistent indexes.
          schema:
            type: boolean
      responses:
        '201':
          description: |
            is returned if `waitForSync` was `true` and operations were processed.
        '202':
          description: |
            is returned if `waitForSync` was `false` and operations were processed.
        '400':
          description: |
            is returned if the body does not contain a valid JSON representation
            of an array of documents. The response body contains
            an error document in this case.
        '403':
          description: |
            with the error code `1004` is returned if the specified write concern for the
            collection cannot be fulfilled. This can happen if less than the number of
            specified replicas for a shard are currently in-sync with the leader. For example,
            if the write concern is `2` and the replication factor is `3`, then the
            write concern is not fulfilled if two replicas are not in-sync.
        '404':
          description: |
            is returned if the collection was not found.
        '503':
          description: |
            is returned if the system is temporarily not available. This can be a system
            overload or temporary failure. In this case it makes sense to retry the request
            later.
      tags:
        - Documents
```

#### Update multiple documents

```openapi
paths:
  /_api/document/{collection}:
    patch:
      operationId: updateDocuments
      description: |
        Partially updates documents, the documents to update are specified
        by the `_key` attributes in the body objects. The body of the
        request must contain a JSON array of document updates with the
        attributes to patch (the patch documents). All attributes from the
        patch documents are added to the existing documents if they do
        not yet exist, and overwritten in the existing documents if they do
        exist there.

        The values of the `_key`, `_id`, and `_rev` system attributes as well as
        attributes used as sharding keys cannot be changed.
        
        Setting an attribute value to `null` in the patch documents causes a
        value of `null` to be saved for the attribute by default.

        If `ignoreRevs` is `false` and there is a `_rev` attribute in a
        document in the body and its value does not match the revision of
        the corresponding document in the database, the precondition is
        violated.

        Cluster only: The patch document _may_ contain
        values for the collection's pre-defined shard keys. Values for the shard keys
        are treated as hints to improve performance. Should the shard keys
        values be incorrect ArangoDB may answer with a *not found* error

        Optionally, the query parameter `waitForSync` can be used to force
        synchronization of the document replacement operation to disk even in case
        that the `waitForSync` flag had been disabled for the entire collection.
        Thus, the `waitForSync` query parameter can be used to force synchronization
        of just specific operations. To use this, set the `waitForSync` parameter
        to `true`. If the `waitForSync` parameter is not specified or set to
        `false`, then the collection's default `waitForSync` behavior is
        applied. The `waitForSync` query parameter cannot be used to disable
        synchronization for collections that have a default `waitForSync` value
        of `true`.

        The body of the response contains a JSON array of the same length
        as the input array with the information about the identifier and the
        revision of the updated documents. Each element has the following
        attributes:
        - `_id`, containing the document identifier with the format `<collection-name>/<document-key>`.
        - `_key`, containing the document key that uniquely identifies a document within the collection.
        - `_rev`, containing the new document revision.

        In case of an error or violated precondition, an error
        object with the attribute `error` set to `true` and the attribute
        `errorCode` set to the error code is built.

        If the query parameter `returnOld` is `true`, then, for each
        generated document, the complete previous revision of the document
        is returned under the `old` attribute in the result.

        If the query parameter `returnNew` is `true`, then, for each
        generated document, the complete new document is returned under
        the `new` attribute in the result.

        Note that if any precondition is violated or an error occurred with
        some of the documents, the return code is still 201 or 202, but the
        `X-Arango-Error-Codes` HTTP header is set. It contains a map of the
        error codes and how often each kind of error occurred. For example,
        `1200:17,1205:10` means that in 17 cases the error 1200 ("revision conflict")
        has happened, and in 10 cases the error 1205 ("illegal document handle").
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - documents
              properties:
                documents:
                  description: |
                    A JSON representation of an array of document updates as objects. 
                    Each element has to contain a `_key` attribute.
                  type: json
      parameters:
        - name: collection
          in: path
          required: true
          description: |
            Name of the `collection` in which the documents are to be updated.
          schema:
            type: string
        - name: keepNull
          in: query
          required: false
          description: |
            If the intention is to delete existing attributes with the patch
            command, set the `keepNull` URL query parameter to `false`. This modifies the
            behavior of the patch command to remove top-level attributes and sub-attributes
            from the existing document that are contained in the patch document with an
            attribute value of `null` (but not attributes of objects that are nested inside
            of arrays).
          schema:
            type: boolean
        - name: mergeObjects
          in: query
          required: false
          description: |
            Controls whether objects (not arrays) are merged if present in
            both the existing and the patch document. If set to `false`, the
            value in the patch document overwrites the existing document's
            value. If set to `true`, objects are merged. The default is
            `true`.
          schema:
            type: boolean
        - name: waitForSync
          in: query
          required: false
          description: |
            Wait until the new documents have been synced to disk.
          schema:
            type: boolean
        - name: ignoreRevs
          in: query
          required: false
          description: |
            By default, or if this is set to `true`, the `_rev` attributes in
            the given documents are ignored. If this is set to `false`, then
            any `_rev` attribute given in a body document is taken as a
            precondition. The document is only updated if the current revision
            is the one specified.
          schema:
            type: boolean
        - name: returnOld
          in: query
          required: false
          description: |
            Return additionally the complete previous revision of the changed
            documents under the attribute `old` in the result.
          schema:
            type: boolean
        - name: returnNew
          in: query
          required: false
          description: |
            Return additionally the complete new documents under the attribute `new`
            in the result.
          schema:
            type: boolean
        - name: silent
          in: query
          required: false
          description: |
            If set to `true`, an empty object is returned as response if all document operations
            succeed. No meta-data is returned for the updated documents. If at least one
            operation raises an error, an array with the error object(s) is returned.

            You can use this option to save network traffic but you cannot map any errors
            to the inputs of your request.
          schema:
            type: boolean
        - name: refillIndexCaches
          in: query
          required: false
          description: |
            Whether to update existing entries in in-memory index caches if document updates
            affect the edge index or cache-enabled persistent indexes.
          schema:
            type: boolean
      responses:
        '201':
          description: |
            is returned if `waitForSync` was `true` and operations were processed.
        '202':
          description: |
            is returned if `waitForSync` was `false` and operations were processed.
        '400':
          description: |
            is returned if the body does not contain a valid JSON representation
            of an array of documents. The response body contains
            an error document in this case.
        '403':
          description: |
            with the error code `1004` is returned if the specified write concern for the
            collection cannot be fulfilled. This can happen if less than the number of
            specified replicas for a shard are currently in-sync with the leader. For example,
            if the write concern is `2` and the replication factor is `3`, then the
            write concern is not fulfilled if two replicas are not in-sync.
        '404':
          description: |
            is returned if the collection was not found.
        '503':
          description: |
            is returned if the system is temporarily not available. This can be a system
            overload or temporary failure. In this case it makes sense to retry the request
            later.
      tags:
        - Documents
```

#### Remove multiple documents

```openapi
paths:
  /_api/document/{collection}:
    delete:
      operationId: deleteDocuments
      description: |
        The body of the request is an array consisting of selectors for
        documents. A selector can either be a string with a key or a string
        with a document identifier or an object with a `_key` attribute. This
        API call removes all specified documents from `collection`.
        If the `ignoreRevs` query parameter is `false` and the
        selector is an object and has a `_rev` attribute, it is a
        precondition that the actual revision of the removed document in the
        collection is the specified one.

        The body of the response is an array of the same length as the input
        array. For each input selector, the output contains a JSON object
        with the information about the outcome of the operation. If no error
        occurred, then such an object has the following attributes:
        - `_id`, containing the document identifier with the format `<collection-name>/<document-key>`.
        - `_key`, containing the document key that uniquely identifies a document within the collection.
        - `_rev`, containing the document revision.
        In case of an error, the object has the `error` attribute set to `true`
        and `errorCode` set to the error code.

        If the `waitForSync` parameter is not specified or set to `false`,
        then the collection's default `waitForSync` behavior is applied.
        The `waitForSync` query parameter cannot be used to disable
        synchronization for collections that have a default `waitForSync`
        value of `true`.

        If the query parameter `returnOld` is `true`, then
        the complete previous revision of the document
        is returned under the `old` attribute in the result.

        Note that if any precondition is violated or an error occurred with
        some of the documents, the return code is still 200 or 202, but the
        `X-Arango-Error-Codes` HTTP header is set. It contains a map of the
        error codes and how often each kind of error occurred. For example,
        `1200:17,1205:10` means that in 17 cases the error 1200 ("revision conflict")
        has happened, and in 10 cases the error 1205 ("illegal document handle").
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - documents
              properties:
                documents:
                  description: |
                    A JSON representation of an array of document updates as objects. 
                    Each element has to contain a `_key` attribute.
                  type: json
      parameters:
        - name: collection
          in: path
          required: true
          description: |
            Collection from which documents are removed.
          schema:
            type: string
        - name: waitForSync
          in: query
          required: false
          description: |
            Wait until deletion operation has been synced to disk.
          schema:
            type: boolean
        - name: returnOld
          in: query
          required: false
          description: |
            Return additionally the complete previous revision of the changed
            document under the attribute `old` in the result.
          schema:
            type: boolean
        - name: silent
          in: query
          required: false
          description: |
            If set to `true`, an empty object is returned as response if all document operations
            succeed. No meta-data is returned for the deleted documents. If at least one of
            the operations raises an error, an array with the error object(s) is returned.

            You can use this option to save network traffic but you cannot map any errors
            to the inputs of your request.
          schema:
            type: boolean
        - name: ignoreRevs
          in: query
          required: false
          description: |
            If set to `true`, ignore any `_rev` attribute in the selectors. No
            revision check is performed. If set to `false` then revisions are checked.
            The default is `true`.
          schema:
            type: boolean
        - name: refillIndexCaches
          in: query
          required: false
          description: |
            Whether to delete existing entries from in-memory index caches and refill them
            if document removals affect the edge index or cache-enabled persistent indexes.
          schema:
            type: boolean
      responses:
        '200':
          description: |
            is returned if `waitForSync` was `true`.
        '202':
          description: |
            is returned if `waitForSync` was `false`.
        '403':
          description: |
            with the error code `1004` is returned if the specified write concern for the
            collection cannot be fulfilled. This can happen if less than the number of
            specified replicas for a shard are currently in-sync with the leader. For example,
            if the write concern is `2` and the replication factor is `3`, then the
            write concern is not fulfilled if two replicas are not in-sync.
        '404':
          description: |
            is returned if the collection was not found.
            The response body contains an error document in this case.
        '503':
          description: |
            is returned if the system is temporarily not available. This can be a system
            overload or temporary failure. In this case it makes sense to retry the request
            later.
      tags:
        - Documents
```

**Examples**

```curl
---
description: |-
  Using document keys:
name: RestDocumentHandlerDeleteDocumentKeyMulti
---
var assertEqual = require("jsunity").jsUnity.assertions.assertEqual;
  var cn = "products";
  db._drop(cn);
  db._create(cn, { waitForSync: true });

var documents = db.products.save( [
 { "_key": "1", "type": "tv" },
 { "_key": "2", "type": "cookbook" }
  ] );

  var url = "/_api/document/" + cn;

  var body = [ "1", "2" ];
  var response = logCurlRequest('DELETE', url, body);

  assert(response.code === 200);
  assertEqual(response.parsedBody, documents);

  logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Using document identifiers:
name: RestDocumentHandlerDeleteDocumentIdentifierMulti
---
var assertEqual = require("jsunity").jsUnity.assertions.assertEqual;
  var cn = "products";
  db._drop(cn);
  db._create(cn, { waitForSync: true });

var documents = db.products.save( [
 { "_key": "1", "type": "tv" },
 { "_key": "2", "type": "cookbook" }
  ] );

  var url = "/_api/document/" + cn;

  var body = [ "products/1", "products/2" ];
  var response = logCurlRequest('DELETE', url, body);

  assert(response.code === 200);
  assertEqual(response.parsedBody, documents);

  logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Using objects with document keys:
name: RestDocumentHandlerDeleteDocumentObjectMulti
---
var assertEqual = require("jsunity").jsUnity.assertions.assertEqual;
  var cn = "products";
  db._drop(cn);
  db._create(cn, { waitForSync: true });

var documents = db.products.save( [
 { "_key": "1", "type": "tv" },
 { "_key": "2", "type": "cookbook" }
  ] );

  var url = "/_api/document/" + cn;

  var body = [ { "_key": "1" }, { "_key": "2" } ];
  var response = logCurlRequest('DELETE', url, body);

  assert(response.code === 200);
  assertEqual(response.parsedBody, documents);

  logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Unknown documents:
name: RestDocumentHandlerDeleteDocumentUnknownMulti
---
var cn = "products";
db._drop(cn);
db._drop("other");
db._create(cn, { waitForSync: true });
db._create("other", { waitForSync: true });

var documents = db.products.save( [
{ "_key": "1", "type": "tv" },
{ "_key": "2", "type": "cookbook" }
] );
db.products.remove(documents);
db.other.save( { "_key": "2" } );

var url = "/_api/document/" + cn;

var body = [ "1", "other/2" ];
var response = logCurlRequest('DELETE', url, body);

assert(response.code === 202);
response.parsedBody.forEach(function(doc) {
assert(doc.error === true);
assert(doc.errorNum === 1202);
});

logJsonResponse(response);
db._drop(cn);
db._drop("other");
```

```curl
---
description: |-
  Check revisions:
name: RestDocumentHandlerDeleteDocumentRevMulti
---
var assertEqual = require("jsunity").jsUnity.assertions.assertEqual;
  var cn = "products";
  db._drop(cn);
  db._create(cn, { waitForSync: true });

var documents = db.products.save( [
 { "_key": "1", "type": "tv" },
 { "_key": "2", "type": "cookbook" }
  ] );

  var url = "/_api/document/" + cn + "?ignoreRevs=false";
var body = [
 { "_key": "1", "_rev": documents[0]._rev },
 { "_key": "2", "_rev": documents[1]._rev }
  ];

  var response = logCurlRequest('DELETE', url, body);

  assert(response.code === 200);
  assertEqual(response.parsedBody, documents);

  logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Revision conflict:
name: RestDocumentHandlerDeleteDocumentRevConflictMulti
---
var cn = "products";
db._drop(cn);
db._create(cn, { waitForSync: true });

var documents = db.products.save( [
{ "_key": "1", "type": "tv" },
{ "_key": "2", "type": "cookbook" }
] );

var url = "/_api/document/" + cn + "?ignoreRevs=false";
var body = [
{ "_key": "1", "_rev": "non-matching revision" },
{ "_key": "2", "_rev": "non-matching revision" }
];

var response = logCurlRequest('DELETE', url, body);

assert(response.code === 202);
response.parsedBody.forEach(function(doc) {
assert(doc.error === true);
assert(doc.errorNum === 1200);
});

logJsonResponse(response);
db._drop(cn);
```

### Read from followers

{{< tag "ArangoDB Enterprise Edition" "ArangoGraph" >}}

<small>Introduced in: v3.10.0</small>

In an ArangoDB cluster, all reads and writes are performed via
the shard leaders. Shard replicas replicate all operations, but are
only on hot standby to take over in case of a failure. This is to ensure
consistency of reads and writes and allows giving a certain amount of
transactional guarantees.

If high throughput is more important than consistency and transactional
guarantees for you, then you may allow for so-called "dirty reads" or
"reading from followers", for certain read-only operations. In this case,
Coordinators are allowed to read not only from
leader shards but also from follower shards. This has a positive effect,
because the reads can scale out to all DB-Servers which have copies of
the data. Therefore, the read throughput is higher. Note however, that you
still have to go through your Coordinators. To get the desired result, you
have to have enough Coordinators, load balance your client requests
across all of them, and then allow reads from followers.

You may observe the following data inconsistencies (dirty reads) when
reading from followers:

- It is possible to see old, **obsolete revisions** of documents. More
  exactly, it is possible that documents are already updated on the leader shard
  but the updates have not yet been replicated to the follower shard
  from which you are reading.

- It is also possible to see changes to documents that
  **have already happened on a replica**, but are not yet officially
  committed on the leader shard.

When no writes are happening, allowing reading from followers is generally safe.

The following APIs support reading from followers:

- Single document reads (`GET /_api/document`)
- Batch document reads (`PUT /_api/document?onlyget=true`)
- Read-only AQL queries (`POST /_api/cursor`)
- The edge API (`GET /_api/edges`)
- Read-only Stream Transactions and their sub-operations
  (`POST /_api/transaction/begin` etc.)

The following APIs do not support reading from followers:

- The graph API (`GET /_api/gharial` etc.)
- JavaScript Transactions (`POST /_api/transaction`)

You need to set the following HTTP header in API requests to ask for reads
from followers:

```
x-arango-allow-dirty-read: true
```

This is in line with the older support to read from followers in the
[Active Failover](../../deploy/active-failover/_index.md#reading-from-followers)
deployment mode.

For single requests, you specify this header in the read request.
For Stream Transactions, the header has to be set on the request that
creates a read-only transaction.

The `POST /_api/cursor` endpoint also supports a query option that you can set
instead of the HTTP header:

```json
{ "query": "...", "options": { "allowDirtyReads": true } }
```

Every response to a request that could produce dirty reads has
the following HTTP header:

```
x-arango-potential-dirty-read: true
```
