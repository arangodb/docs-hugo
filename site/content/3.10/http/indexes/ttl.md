---
title: Working with TTL (time-to-live) indexes
weight: 15
description: ''
archetype: default
---
```openapi
## Create TTL index

paths:
  /_api/index#ttl:
    post:
      operationId: createIndexTtl
      description: |
        Creates a TTL index for the collection *collection-name* if it
        does not already exist. The call expects an object containing the index
        details.
      parameters:
        - name: collection
          in: query
          required: true
          description: |
            The collection name.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                type:
                  description: |
                    must be equal to *"ttl"*.
                  type: string
                name:
                  description: |
                    An easy-to-remember name for the index to look it up or refer to it in index hints.
                    Index names are subject to the same character restrictions as collection names.
                    If omitted, a name is auto-generated so that it is unique with respect to the
                    collection, e.g. `idx_832910498`.
                  type: string
                fields:
                  description: |
                    an array with exactly one attribute path.
                  type: array
                  items:
                    type: string
                expireAfter:
                  description: |
                    The time interval (in seconds) from the point in time stored in the `fields`
                    attribute after which the documents count as expired. Can be set to `0` to let
                    documents expire as soon as the server time passes the point in time stored in
                    the document attribute, or to a higher number to delay the expiration.
                  type: number
                inBackground:
                  description: |
                    The optional attribute **inBackground** can be set to *true* to create the index
                    in the background, which will not write-lock the underlying collection for
                    as long as if the index is built in the foreground. The default value is *false*.
                  type: boolean
              required:
                - type
                - fields
                - expireAfter
      responses:
        '200':
          description: |
            If the index already exists, then a *HTTP 200* is returned.
        '201':
          description: |
            If the index does not already exist and could be created, then a *HTTP 201*
            is returned.
        '400':
          description: |
            If the collection already contains another TTL index, then an *HTTP 400* is
            returned, as there can be at most one TTL index per collection.
        '404':
          description: |
            If the *collection-name* is unknown, then a *HTTP 404* is returned.
      tags:
        - Indexes
```


```curl
---
render: input/output
name: RestIndexCreateNewTtlIndex
server_name: stable
type: single
version: '3.10'
---
var cn = "sessions";
db._drop(cn);
db._create(cn);

var url = "/_api/index?collection=" + cn;
var body = {
  type: "ttl",
  expireAfter: 3600,
  fields : [ "createdAt" ]
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 201);

logJsonResponse(response);
  ~ db._drop(cn);
```
