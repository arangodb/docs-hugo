---
title: HTTP interface for persistent indexes
menuTitle: Persistent
weight: 5
description: ''
---
{{< info >}}
The index types `hash` and `skiplist` are aliases for the `persistent` index
type and should no longer be used to create new indexes. The aliases will be
removed in a future version.
{{< /info >}}

## Create a persistent index

```openapi
paths:
  /_db/{database-name}/_api/index#persistent:
    post:
      operationId: createIndexPersistent
      description: |
        Creates a persistent index for the collection `collection-name`, if
        it does not already exist.

        In a sparse index all documents will be excluded from the index that do not
        contain at least one of the specified index attributes (i.e. `fields`) or that
        have a value of `null` in any of the specified index attributes. Such documents
        will not be indexed, and not be taken into account for uniqueness checks if
        the `unique` flag is set.

        In a non-sparse index, these documents will be indexed (for non-present
        indexed attributes, a value of `null` will be used) and will be taken into
        account for uniqueness checks if the `unique` flag is set.

        {{</* info */>}}
        Unique indexes on non-shard keys are not supported in cluster deployments.
        {{</* /info */>}}
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
              properties:
                type:
                  description: |
                    Must be equal to `"persistent"`.
                  type: string
                  example: persistent
                name:
                  description: |
                    An easy-to-remember name for the index to look it up or refer to it in index hints.
                    Index names are subject to the same character restrictions as collection names.
                    If omitted, a name is auto-generated so that it is unique with respect to the
                    collection, e.g. `idx_832910498`.
                  type: string
                fields:
                  description: |
                    An array of attribute paths.

                    The `.` character denotes sub-attributes in attribute paths. Attributes with
                    literal `.` in their name cannot be indexed. Attributes with the name `_id`
                    cannot be indexed either, neither as a top-level attribute nor as a sub-attribute.

                    You can expand one array attribute with `[*]`.
                  type: array
                  minItems: 1
                  items:
                    type: string
                storedValues:
                  description: |
                    The optional `storedValues` attribute can contain an array of paths to additional
                    attributes to store in the index. These additional attributes cannot be used for
                    index lookups or for sorting, but they can be used for projections. This allows an
                    index to fully cover more queries and avoid extra document lookups.
                    The maximum number of attributes in `storedValues` is 32.

                    It is not possible to create multiple indexes with the same `fields` attributes
                    and uniqueness but different `storedValues` attributes. That means the value of
                    `storedValues` is not considered by index creation calls when checking if an
                    index is already present or needs to be created.

                    In unique indexes, only the attributes in `fields` are checked for uniqueness,
                    but the attributes in `storedValues` are not checked for their uniqueness.
                    Non-existing attributes are stored as `null` values inside `storedValues`.
                  type: array
                  items:
                    type: string
                unique:
                  description: |
                    If `true`, then create a unique index. Defaults to `false`.
                    In unique indexes, only the attributes in `fields` are checked for uniqueness,
                    but the attributes in `storedValues` are not checked for their uniqueness.
                  type: boolean
                sparse:
                  description: |
                    If `true`, then create a sparse index. Defaults to `false`.
                  type: boolean
                deduplicate:
                  description: |
                    The attribute controls whether inserting duplicate index values
                    from the same document into a unique array index will lead to a unique constraint
                    error or not. The default value is `true`, so only a single instance of each
                    non-unique index value will be inserted into the index per document. Trying to
                    insert a value into the index that already exists in the index will always fail,
                    regardless of the value of this attribute.
                  type: boolean
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
                  type: boolean
                cacheEnabled:
                  description: |
                    This attribute controls whether an extra in-memory hash cache is
                    created for the index. The hash cache can be used to speed up index lookups.
                    The cache can only be used for queries that look up all index attributes via
                    an equality lookup (`==`). The hash cache cannot be used for range scans,
                    partial lookups or sorting.

                    The cache will be populated lazily upon reading data from the index. Writing data
                    into the collection or updating existing data will invalidate entries in the
                    cache. The cache may have a negative effect on performance in case index values
                    are updated more often than they are read.

                    The maximum size of cache entries that can be stored is currently 4 MB, i.e.
                    the cumulated size of all index entries for any index lookup value must be
                    less than 4 MB. This limitation is there to avoid storing the index entries
                    of "super nodes" in the cache.

                    `cacheEnabled` defaults to `false` and should only be used for indexes that
                    are known to benefit from an extra layer of caching.
                  type: boolean
                inBackground:
                  description: |
                    This attribute can be set to `true` to create the index
                    in the background, which will not write-lock the underlying collection for
                    as long as if the index is built in the foreground. The default value is `false`.
                  type: boolean
      responses:
        '200':
          description: |
            The index exists already.
        '201':
          description: |
            The index is created as there is no such existing index.
        '400':
          description: |
            You try to create a unique persistent index but there are already
            documents in the collection that violate the uniqueness requirement.
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
  Creating a persistent index
name: RestIndexCreateNewPersistent
---
var cn = "products";
db._drop(cn);
db._create(cn);

var url = "/_api/index?collection=" + cn;
var body = {
  type: "persistent",
  unique: false,
  fields: [ "a", "b" ]
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 201);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Creating a sparse persistent index
name: RestIndexCreateSparsePersistent
---
var cn = "products";
db._drop(cn);
db._create(cn);

var url = "/_api/index?collection=" + cn;
var body = {
  type: "persistent",
  unique: false,
  sparse: true,
  fields: [ "a" ]
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 201);

logJsonResponse(response);
db._drop(cn);
```
