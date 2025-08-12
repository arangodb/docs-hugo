---
title: HTTP interface for full-text indexes
menuTitle: Fulltext
weight: 30
description: ''
---
## Create a full-text index

```openapi
paths:
  /_db/{database-name}/_api/index#fulltext:
    post:
      operationId: createIndexFulltext
      description: |
        {{</* warning */>}}
        The fulltext index type is deprecated from version 3.10 onwards.
        {{</* /warning */>}}

        Creates a fulltext index for the collection `collection-name`, if
        it does not already exist. The call expects an object containing the index
        details.
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
                - minLength
              properties:
                type:
                  description: |
                    Must be equal to `"fulltext"`.
                  type: string
                  example: fulltext
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
                minLength:
                  description: |
                    Minimum character length of words to index. The default is
                    low, thus it is recommended to set this value explicitly
                    when creating the index.
                  type: integer
                  default: 2
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
  Creating a fulltext index
name: RestIndexCreateNewFulltext
---
var cn = "products";
db._drop(cn);
db._create(cn);

var url = "/_api/index?collection=" + cn;
var body = {
  type: "fulltext",
  fields: [ "text" ]
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 201);

logJsonResponse(response);
db._drop(cn);
```
