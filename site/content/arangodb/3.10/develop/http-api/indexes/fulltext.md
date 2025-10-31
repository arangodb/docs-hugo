---
title: Working with full-text indexes
menuTitle: Fulltext
weight: 30
description: ''
---
## Create a full-text index

```openapi
paths:
  /_api/index#fulltext:
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
                    must be equal to `"fulltext"`.
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
                    an array of attribute names. Currently, the array is limited
                    to exactly one attribute.
                  type: array
                  items:
                    type: string
                minLength:
                  description: |
                    Minimum character length of words to index. Will default
                    to a server-defined value if unspecified. It is thus recommended to set
                    this value explicitly when creating the index.
                  type: integer
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
