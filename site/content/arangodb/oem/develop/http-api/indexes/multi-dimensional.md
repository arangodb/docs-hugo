---
title: HTTP interface for multi-dimensional indexes
menuTitle: Multi-dimensional
weight: 20
description: ''
---
## Create a multi-dimensional index

```openapi
paths:
  /_db/{database-name}/_api/index#mdi:
    post:
      operationId: createIndexZkd
      description: |
        Creates a multi-dimensional index for the collection `collection-name`, if
        it does not already exist.
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
                - fieldValueTypes
              properties:
                type:
                  description: |
                    Must be equal to `"zkd"`.
                  type: string
                  example: zkd
                name:
                  description: |
                    An easy-to-remember name for the index to look it up or refer to it in index hints.
                    Index names are subject to the same character restrictions as collection names.
                    If omitted, a name is auto-generated so that it is unique with respect to the
                    collection, e.g. `idx_832910498`.
                  type: string
                fields:
                  description: |
                    An array of attribute names used for each dimension. Array expansions are not allowed.
                  type: array
                  minItems: 1
                  uniqueItems: true
                  items:
                    type: string
                fieldValueTypes:
                  description: |
                    Must be equal to `"double"`. Currently only doubles are supported as values.
                  type: string
                unique:
                  description: |
                    if `true`, then create a unique index.
                  type: boolean
                  default: false
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
            The index definition is invalid.
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
  Creating a multi-dimensional index
name: RestIndexCreateNewZkd
---
var cn = "intervals";
db._drop(cn);
db._create(cn);

    var url = "/_api/index?collection=" + cn;
    var body = {
      type: "zkd",
      fields: [ "from", "to" ],
      fieldValueTypes: "double"
    };

    var response = logCurlRequest('POST', url, body);

    assert(response.code === 201);

    logJsonResponse(response);
db._drop(cn);
```
