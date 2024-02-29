---
title: Working with multi-dimensional indexes
menuTitle: Multi-dimensional
weight: 20
description: ''
---
## Create a multi-dimensional index

```openapi
paths:
  /_api/index#mdi:
    post:
      operationId: createIndexMdi
      description: |
        Creates a multi-dimensional index for the collection `collection-name`, if
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
                - fieldValueTypes
              properties:
                type:
                  description: |
                    must be equal to `"mdi"` or `"mdi-prefixed"`.
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
                    must be equal to `"double"`. Currently only doubles are supported as values.
                  type: string
                prefixFields:
                  description: |
                    Requires `type` to be `"mdi-prefixed"`, and `prefixFields` needs to be set in this case.

                    An array of attribute names used as search prefix. Array expansions are not allowed.
                  type: array
                  items:
                    type: string
                storedValues:
                  description: |
                    The optional `storedValues` attribute can contain an array of paths to additional
                    attributes to store in the index. These additional attributes cannot be used for
                    index lookups or for sorting, but they can be used for projections. This allows an
                    index to fully cover more queries and avoid extra document lookups.

                    You can have the same attributes in `storedValues` and `fields` as the attributes
                    in `fields` cannot be used for projections, but you can also store additional
                    attributes that are not listed in `fields`.
                    Attributes in `storedValues` cannot overlap with the attributes specified in
                    `prefixFields`. There is no reason to store them in the index because you need
                    to specify them in queries in order to use `mdi-prefixed` indexes.

                    You cannot create multiple multi-dimensional indexes with the same `sparse`,
                    `unique`, `fields` and (for `mdi-prefixed` indexes) `prefixFields` attributes
                    but different `storedValues` settings. That means the value of `storedValues` is
                    not considered by index creation calls when checking if an index is already
                    present or needs to be created.

                    In unique indexes, only the index attributes in `fields` and (for `mdi-prefixed`
                    indexes) `prefixFields` are checked for uniqueness. The index attributes in
                    `storedValues` are not checked for their uniqueness.

                    Non-existing attributes are stored as `null` values inside `storedValues`.

                    The maximum number of attributes in `storedValues` is 32.
                  type: array
                  items:
                    type: string
                unique:
                  description: |
                    if `true`, then create a unique index.
                  type: boolean
                  default: false
                sparse:
                  description: |
                    If `true`, then create a sparse index.
                  type: boolean
                  default: false
                estimates:
                  description: |
                    This attribute controls whether index selectivity estimates are maintained for the
                    index. Not maintaining index selectivity estimates can have a slightly positive
                    impact on write performance.

                    The downside of turning off index selectivity estimates is that
                    the query optimizer is not able to determine the usefulness of different
                    competing indexes in AQL queries when there are multiple candidate indexes to
                    choose from.

                    The `estimates` attribute is optional and defaults to `true` if not set.
                    It has no effect on indexes other than `persistent`, `mdi`, and `mdi-prefixed`.
                    It cannot be disabled for non-unique `mdi` indexes because they have a fixed
                    selectivity estimate of `1`.
                  type: boolean
                  default: true
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
name: RestIndexCreateNewMdi
---
var cn = "intervals";
db._drop(cn);
db._create(cn);

    var url = "/_api/index?collection=" + cn;
    var body = {
      type: "mdi",
      fields: [ "from", "to" ],
      fieldValueTypes: "double"
    };

    var response = logCurlRequest('POST', url, body);

    assert(response.code === 201);

    logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Creating a prefixed multi-dimensional index
name: RestIndexCreateNewMdiPrefixed
---
var cn = "intervals";
db._drop(cn);
db._create(cn);

    var url = "/_api/index?collection=" + cn;
    var body = {
      type: "mdi-prefixed",
      fields: [ "from", "to" ],
      fieldValueTypes: "double",
      prefixFields: ["year", "month"]
    };

    var response = logCurlRequest('POST', url, body);

    assert(response.code === 201);

    logJsonResponse(response);
db._drop(cn);
```
