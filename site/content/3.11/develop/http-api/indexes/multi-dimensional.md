---
title: Working with multi-dimensional indexes
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
                - fieldValueTypes
              properties:
                type:
                  description: |
                    Must be equal to `"zkd"`.
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
                    An array of attribute names used for each dimension. Array expansions are not allowed.
                  type: array
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
                    You can set this option to `true` to create the index
                    in the background, which will not write-lock the underlying collection for
                    as long as if the index is built in the foreground. The default value is `false`.
                  type: boolean
      responses:
        '200':
          description: |
            If the index already exists, then a *HTTP 200* is
            returned.
        '201':
          description: |
            If the index does not already exist and could be created, then a *HTTP 201*
            is returned.
        '404':
          description: |
            If the `collection-name` is unknown, then a *HTTP 404* is returned.
        '400':
          description: |
            If the index definition is invalid, then a *HTTP 400* is returned.
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
