---
title: HTTP interface for TTL (time-to-live) indexes
menuTitle: TTL
weight: 15
description: ''
---
## Create a TTL index

```openapi
paths:
  /_db/{database-name}/_api/index#ttl:
    post:
      operationId: createIndexTtl
      description: |
        Creates a time-to-live (TTL) index for the collection `collection-name` if it
        does not already exist.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
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
              required:
                - type
                - fields
                - expireAfter
              properties:
                type:
                  description: |
                    Must be equal to `"ttl"`.
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
                    A list with exactly one attribute path.
                  type: array
                  minItems: 1
                  maxItems: 1
                  items:
                    type: string
                estimates:
                  description: |
                    This attribute controls whether index selectivity estimates are maintained for the
                    index. Not maintaining index selectivity estimates can have a slightly positive
                    impact on write performance.

                    The downside of turning off index selectivity estimates is that
                    the query optimizer is not able to determine the usefulness of different
                    competing indexes in AQL queries when there are multiple candidate indexes to
                    choose from.

                    The option has no effect on indexes other than `persistent`, `mdi`, `mdi-prefixed`, and `ttl` indexes.
                  type: boolean
                  default: true
                expireAfter:
                  description: |
                    The time interval (in seconds) from the point in time stored in the `fields`
                    attribute after which the documents count as expired. Can be set to `0` to let
                    documents expire as soon as the server time passes the point in time stored in
                    the document attribute, or to a higher number to delay the expiration.
                  type: number
                inBackground:
                  description: |
                    Set this option to `true` to keep the collection/shards available for
                    write operations by not using an exclusive write lock for the duration
                    of the index creation.
                  type: boolean
                  default: false
      responses:
        '200':
          description: |
            The index exists already.
        '201':
          description: |
            The index is created as there is no such existing index.
        '400':
          description: |
            There is already a TTL index for the collection but there can only be one.
        '404':
          description: |
            The collection is unknown.
      tags:
        - Indexes
```

**Examples**

```curl
---
description: |-
  Creating a TTL index
name: RestIndexCreateNewTtlIndex
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
db._drop(cn);
```
