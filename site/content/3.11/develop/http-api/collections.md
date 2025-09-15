---
title: HTTP interface for collections
menuTitle: Collections
weight: 25
description: >-
  The HTTP API for collections lets you create and delete collections, get
  information about collections, and modify certain properties of existing
  collections
---
## Addresses of collections

All collections in ArangoDB have a unique identifier and a unique
name. To access a collection, use the collection name to refer to it:

```
http://server:port/_api/collection/<collection-name>
```

For example, assume that the collection identifier is `7254820` and
the collection name is `demo`, then the URL of that collection is:

```
http://localhost:8529/_api/collection/demo
```

## Get information about collections

### List all collections

```openapi
paths:
  /_db/{database-name}/_api/collection:
    get:
      operationId: listCollections
      description: |
        Returns basic information for all collections in the current database,
        optionally excluding system collections.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: excludeSystem
          in: query
          required: false
          description: |
            Whether system collections should be excluded from the result.
          schema:
            type: boolean
            default: false
      responses:
        '200':
          description: |
            The list of collections.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - result
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  result:
                    description: |
                      A list with every item holding basic collection metadata.
                    type: array
                    items:
                      type: object
                      required:
                        - id
                        - name
                        - status
                        - type
                        - isSystem
                        - globallyUniqueId
                      properties:
                        id:
                          description: |
                            A unique identifier of the collection (deprecated).
                          type: string
                        name:
                          description: |
                            The name of the collection.
                          type: string
                          example: coll
                        status:
                          description: |
                            The status of the collection.
                            - `3`: loaded
                            - `5`: deleted

                            Every other status indicates a corrupted collection.
                          type: integer
                          example: 3
                        type:
                          description: |
                            The type of the collection:
                            - `0`: "unknown"
                            - `2`: regular document collection
                            - `3`: edge collection
                          type: integer
                          example: 2
                        isSystem:
                          description: |
                            Whether the collection is a system collection. Collection names that starts with
                            an underscore are usually system collections.
                          type: boolean
                          example: false
                        globallyUniqueId:
                          description: |
                            A unique identifier of the collection. This is an internal property.
                          type: string
      tags:
        - Collections
```

**Examples**

```curl
---
description: |-
  Return information about all collections:
name: RestCollectionGetAllCollections
---
var url = "/_api/collection";

var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
```

### Get the collection information

```openapi
paths:
  /_db/{database-name}/_api/collection/{collection-name}:
    get:
      operationId: getCollection
      description: |
        Returns the basic information about a specific collection.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: collection-name
          in: path
          required: true
          description: |
            The name of the collection.

            {{</* warning */>}}
            Accessing collections by their numeric ID is deprecated from version 3.4.0 on.
            You should reference them via their names instead.
            {{</* /warning */>}}
          schema:
            type: string
      responses:
        '200':
          description: |
            The basic information about a collection.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - id
                  - name
                  - status
                  - type
                  - isSystem
                  - globallyUniqueId
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  id:
                    description: |
                      A unique identifier of the collection (deprecated).
                    type: string
                  name:
                    description: |
                      The name of the collection.
                    type: string
                    example: coll
                  status:
                    description: |
                      The status of the collection.
                      - `3`: loaded
                      - `5`: deleted

                      Every other status indicates a corrupted collection.
                    type: integer
                    example: 3
                  type:
                    description: |
                      The type of the collection:
                      - `0`: "unknown"
                      - `2`: regular document collection
                      - `3`: edge collection
                    type: integer
                    example: 2
                  isSystem:
                    description: |
                      Whether the collection is a system collection. Collection names that starts with
                      an underscore are usually system collections.
                    type: boolean
                    example: false
                  globallyUniqueId:
                    description: |
                      A unique identifier of the collection. This is an internal property.
                    type: string
        '404':
          description: |
            The specified collection is unknown.
          content:
            application/json:
              schema:
                type: object
                required:
                  - code
                  - error
                  - errorMessage
                  - errorNum
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                    example: 1203
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Collections
```

### Get the properties of a collection

```openapi
paths:
  /_db/{database-name}/_api/collection/{collection-name}/properties:
    get:
      operationId: getCollectionProperties
      description: |
        Returns all properties of the specified collection.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: collection-name
          in: path
          required: true
          description: |
            The name of the collection.

            {{</* warning */>}}
            Accessing collections by their numeric ID is deprecated from version 3.4.0 on.
            You should reference them via their names instead.
            {{</* /warning */>}}
          schema:
            type: string
      responses:
        '200':
          description: |
            All the collection properties.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - name
                  - type
                  - status
                  - statusString
                  - isSystem
                  - id
                  - globallyUniqueId
                  - waitForSync
                  - keyOptions
                  - schema
                  - computedValues
                  - cacheEnabled
                  - syncByRevision
                  # Purposefully undocumented:
                  #   internalValidatorType (internal)
                  #   isSmartChild (internal)
                  #   minReplicationFactor (now writeConcern)
                  #   shadowCollections (internal)
                  #   usesRevisionsAsDocumentIds (internal)
                  # For backward compatibility:
                  #   status (legacy)
                  #   statusString (legacy)
                properties:
                  status:
                    description: |
                      The status of the collection (deprecated).
                      - `3`: loaded
                      - `5`: deleted

                      Every other status indicates a corrupted collection.
                    type: integer
                    example: 3
                  statusString:
                    description: |
                      The status of the collection as a descriptive string (deprecated).
                    type: string
                    enum: [loaded, deleted]
                    example: loaded
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  waitForSync:
                    description: |
                      If `true`, creating, changing, or removing
                      documents waits until the data has been synchronized to disk.
                    type: boolean
                  schema:
                    description: |
                      The configuration of the collection-level schema validation for documents.
                    type: object
                    required:
                      - rule
                      - level
                      - message
                      - type
                    properties:
                      rule:
                        description: |
                          A [JSON Schema](https://json-schema.org/specification-links#draft-4)
                          object (draft-4, without remote schemas).

                          See [Document Schema Validation](../../concepts/data-structure/documents/schema-validation.md)
                          for details.
                        type: object
                      level:
                        description: |
                          The level controls when the validation is triggered:
                          - `"none"`: The rule is inactive and validation thus turned off.
                          - `"new"`: Only newly inserted documents are validated.
                          - `"moderate"`: New and modified documents must pass validation,
                            except for modified documents where the OLD value did not pass
                            validation already. This level is useful if you have documents
                            which do not match your target structure, but you want to stop
                            the insertion of more invalid documents and prohibit that valid
                            documents are changed to invalid documents.
                          - `"strict"`: All new and modified document must strictly pass
                            validation. No exceptions are made.
                        type: string
                        enum: [none, new, moderate, strict]
                        default: strict
                      message:
                        description: |
                          The error message to raise if the schema validation fails
                          for a document.
                        type: string
                      type:
                        description: |
                          The schema validation type. Only JSON Schema is supported.
                        type: string
                        enum: [json]
                  computedValues:
                    description: |
                      A list of objects, each representing a computed value.
                    type: array
                    items:
                      type: object
                      required:
                        - name
                        - expression
                        - overwrite
                      properties:
                        name:
                          description: |
                            The name of the target attribute.
                          type: string
                        expression:
                          description: |
                            An AQL `RETURN` operation with an expression that computes the desired value.
                          type: string
                        overwrite:
                          description: |
                            Whether the computed value takes precedence over a user-provided or
                            existing attribute.
                          type: boolean
                        computeOn:
                          description: |
                            An array of strings that defines on which write operations the value is
                            computed.
                          type: array
                          uniqueItems: true
                          items:
                            type: string
                            enum: [insert, update, replace]
                          example: ["insert", "update", "replace"]
                        keepNull:
                          description: |
                            Whether the target attribute is set if the expression evaluates to `null`.
                          type: boolean
                        failOnWarning:
                          description: |
                            Whether the write operation fails if the expression produces a warning.
                          type: boolean
                  keyOptions:
                    description: |
                      An object which contains key generation options.
                    type: object
                    required:
                      - type
                      - allowUserKeys
                    properties:
                      type:
                        description: |
                          Specifies the type of the key generator.
                        type: string
                        enum: [traditional, autoincrement, uuid, padded]
                      allowUserKeys:
                        description: |
                          If set to `true`, then you are allowed to supply
                          own key values in the `_key` attribute of a document. If set to
                          `false`, then the key generator is solely responsible for
                          generating keys and an error is raised if you supply own key values in the
                          `_key` attribute of documents.

                          {{</* warning */>}}
                          You should not use both user-specified and automatically generated document keys
                          in the same collection in cluster deployments for collections with more than a
                          single shard. Mixing the two can lead to conflicts because Coordinators that
                          auto-generate keys in this case are not aware of all keys which are already used.
                          {{</* /warning */>}}
                        type: boolean
                      increment:
                        description: |
                          The increment value for the `autoincrement` key generator.
                          Not used by other key generator types.
                        type: integer
                      offset:
                        description: |
                          The initial offset value for the `autoincrement` key generator.
                          Not used by other key generator types.
                        type: integer
                      lastValue:
                        description: |
                          The offset value of the `autoincrement` or `padded` key generator.
                          This is an internal property for restoring dumps properly.
                        type: integer
                  cacheEnabled:
                    description: |
                      Whether the in-memory hash cache for documents is enabled for this
                      collection.
                    type: boolean
                  numberOfShards:
                    description: |
                      The number of shards of the collection. _(cluster only)_
                    type: integer
                  shardKeys:
                    description: |
                      Contains the names of document attributes that are used to
                      determine the target shard for documents. _(cluster only)_
                    type: array
                    items:
                      type: string
                  replicationFactor:
                    description: |
                      Contains how many copies of each shard are kept on different DB-Servers.
                      It is an integer number in the range of 1-10 or the string `"satellite"`
                      for SatelliteCollections (Enterprise Edition only). _(cluster only)_
                    type: integer
                  writeConcern:
                    description: |
                      Determines how many copies of each shard are required to be
                      in-sync on the different DB-Servers. If there are less than these many copies
                      in the cluster, a shard refuses to write. Writes to shards with enough
                      up-to-date copies succeed at the same time, however. The value of
                      `writeConcern` cannot be greater than `replicationFactor`.

                      If `distributeShardsLike` is set, the `writeConcern`
                      is that of the prototype collection.
                      For SatelliteCollections, the `writeConcern` is automatically controlled to
                      equal the number of DB-Servers and has a value of `0`.
                      Otherwise, the default value is controlled by the current database's
                      default `writeConcern`, which uses the `--cluster.write-concern`
                      startup option as default, which defaults to `1`. _(cluster only)_
                    type: integer
                  shardingStrategy:
                    description: |
                      The sharding strategy selected for the collection. _(cluster only)_
                    type: string
                    enum:
                      - community-compat
                      - enterprise-compat
                      - enterprise-smart-edge-compat
                      - hash
                      - enterprise-hash-smart-edge
                      - enterprise-hex-smart-vertex
                  distributeShardsLike:
                    description: |
                      The name of another collection. This collection uses the `replicationFactor`,
                      `numberOfShards`, `shardingStrategy`, and `writeConcern` properties of the other collection and
                      the shards of this collection are distributed in the same way as the shards of
                      the other collection.
                    type: string
                  isSmart:
                    description: |
                      Whether the collection is used in a SmartGraph or EnterpriseGraph (Enterprise Edition only).
                      This is an internal property. _(cluster only)_
                    type: boolean
                  isDisjoint:
                    description: |
                      Whether the SmartGraph or EnterpriseGraph this collection belongs to is disjoint
                      (Enterprise Edition only). This is an internal property. _(cluster only)_
                    type: boolean
                  smartGraphAttribute:
                    description: |
                      The attribute that is used for sharding: vertices with the same value of
                      this attribute are placed in the same shard. All vertices are required to
                      have this attribute set and it has to be a string. Edges derive the
                      attribute from their connected vertices (Enterprise Edition only). _(cluster only)_
                    type: string
                  smartJoinAttribute:
                    description: |
                      Determines an attribute of the collection that must contain the shard key value
                      of the referred-to SmartJoin collection (Enterprise Edition only). _(cluster only)_
                    type: string
                  name:
                    description: |
                      The name of this collection.
                    type: string
                  id:
                    description: |
                      A unique identifier of the collection (deprecated).
                    type: string
                  type:
                    description: |
                      The type of the collection:
                        - `0`: "unknown"
                        - `2`: regular document collection
                        - `3`: edge collection
                    type: integer
                  isSystem:
                    description: |
                      Whether the collection is a system collection. Collection names that starts with
                      an underscore are usually system collections.
                    type: boolean
                  syncByRevision:
                    description: |
                      Whether the newer revision-based replication protocol is
                      enabled for this collection. This is an internal property.
                    type: boolean
                  globallyUniqueId:
                    description: |
                      A unique identifier of the collection. This is an internal property.
                    type: string
        '400':
          description: |
            The `name` attribute is missing or has an invalid value.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A collection called `collection-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Collections
```

**Examples**

```curl
---
description: |-
  Using an identifier:
name: RestCollectionGetCollectionIdentifier
---
var cn = "products";
db._drop(cn);
var coll = db._create(cn, { waitForSync: true });
var url = "/_api/collection/"+ coll._id + "/properties";

var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Using a name:
name: RestCollectionGetCollectionName
---
var cn = "products";
db._drop(cn);
db._create(cn, { waitForSync: true });
var url = "/_api/collection/products/properties";

var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```

### Get the document count of a collection

```openapi
paths:
  /_db/{database-name}/_api/collection/{collection-name}/count:
    get:
      operationId: getCollectionCount
      description: |
        Get the number of documents in a collection.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: collection-name
          in: path
          required: true
          description: |
            The name of the collection.

            {{</* warning */>}}
            Accessing collections by their numeric ID is deprecated from version 3.4.0 on.
            You should reference them via their names instead.
            {{</* /warning */>}}
          schema:
            type: string
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
            All properties of the collection but additionally the document `count`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - count
                  - error
                  - code
                  - name
                  - type
                  - status
                  - statusString
                  - isSystem
                  - id
                  - globallyUniqueId
                  - waitForSync
                  - keyOptions
                  - schema
                  - computedValues
                  - cacheEnabled
                  - syncByRevision
                  # Purposefully undocumented:
                  #   internalValidatorType (internal)
                  #   isSmartChild (internal)
                  #   minReplicationFactor (now writeConcern)
                  #   shadowCollections (internal)
                  #   usesRevisionsAsDocumentIds (internal)
                  # For backward compatibility:
                  #   status (legacy)
                  #   statusString (legacy)
                properties:
                  count:
                    description: |
                      The number of documents currently present in the collection.
                    type: integer
                  status:
                    description: |
                      The status of the collection (deprecated).
                      - `3`: loaded
                      - `5`: deleted

                      Every other status indicates a corrupted collection.
                    type: integer
                    example: 3
                  statusString:
                    description: |
                      The status of the collection as a descriptive string (deprecated).
                    type: string
                    enum: [loaded, deleted]
                    example: loaded
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  waitForSync:
                    description: |
                      If `true`, creating, changing, or removing
                      documents waits until the data has been synchronized to disk.
                    type: boolean
                  schema:
                    description: |
                      The configuration of the collection-level schema validation for documents.
                    type: object
                    required:
                      - rule
                      - level
                      - message
                      - type
                    properties:
                      rule:
                        description: |
                          A [JSON Schema](https://json-schema.org/specification-links#draft-4)
                          object (draft-4, without remote schemas).

                          See [Document Schema Validation](../../concepts/data-structure/documents/schema-validation.md)
                          for details.
                        type: object
                      level:
                        description: |
                          The level controls when the validation is triggered:
                          - `"none"`: The rule is inactive and validation thus turned off.
                          - `"new"`: Only newly inserted documents are validated.
                          - `"moderate"`: New and modified documents must pass validation,
                            except for modified documents where the OLD value did not pass
                            validation already. This level is useful if you have documents
                            which do not match your target structure, but you want to stop
                            the insertion of more invalid documents and prohibit that valid
                            documents are changed to invalid documents.
                          - `"strict"`: All new and modified document must strictly pass
                            validation. No exceptions are made.
                        type: string
                        enum: [none, new, moderate, strict]
                        default: strict
                      message:
                        description: |
                          The error message to raise if the schema validation fails
                          for a document.
                        type: string
                      type:
                        description: |
                          The schema validation type. Only JSON Schema is supported.
                        type: string
                        enum: [json]
                  computedValues:
                    description: |
                      A list of objects, each representing a computed value.
                    type: array
                    items:
                      type: object
                      required:
                        - name
                        - expression
                        - overwrite
                      properties:
                        name:
                          description: |
                            The name of the target attribute.
                          type: string
                        expression:
                          description: |
                            An AQL `RETURN` operation with an expression that computes the desired value.
                          type: string
                        overwrite:
                          description: |
                            Whether the computed value takes precedence over a user-provided or
                            existing attribute.
                          type: boolean
                        computeOn:
                          description: |
                            An array of strings that defines on which write operations the value is
                            computed.
                          type: array
                          uniqueItems: true
                          items:
                            type: string
                            enum: [insert, update, replace]
                          example: ["insert", "update", "replace"]
                        keepNull:
                          description: |
                            Whether the target attribute is set if the expression evaluates to `null`.
                          type: boolean
                        failOnWarning:
                          description: |
                            Whether the write operation fails if the expression produces a warning.
                          type: boolean
                  keyOptions:
                    description: |
                      An object which contains key generation options.
                    type: object
                    required:
                      - type
                      - allowUserKeys
                    properties:
                      type:
                        description: |
                          Specifies the type of the key generator.
                        type: string
                        enum: [traditional, autoincrement, uuid, padded]
                      allowUserKeys:
                        description: |
                          If set to `true`, then you are allowed to supply
                          own key values in the `_key` attribute of a document. If set to
                          `false`, then the key generator is solely responsible for
                          generating keys and an error is raised if you supply own key values in the
                          `_key` attribute of documents.

                          {{</* warning */>}}
                          You should not use both user-specified and automatically generated document keys
                          in the same collection in cluster deployments for collections with more than a
                          single shard. Mixing the two can lead to conflicts because Coordinators that
                          auto-generate keys in this case are not aware of all keys which are already used.
                          {{</* /warning */>}}
                        type: boolean
                      increment:
                        description: |
                          The increment value for the `autoincrement` key generator.
                          Not used by other key generator types.
                        type: integer
                      offset:
                        description: |
                          The initial offset value for the `autoincrement` key generator.
                          Not used by other key generator types.
                        type: integer
                      lastValue:
                        description: |
                          The offset value of the `autoincrement` or `padded` key generator.
                          This is an internal property for restoring dumps properly.
                        type: integer
                  cacheEnabled:
                    description: |
                      Whether the in-memory hash cache for documents is enabled for this
                      collection.
                    type: boolean
                  numberOfShards:
                    description: |
                      The number of shards of the collection. _(cluster only)_
                    type: integer
                  shardKeys:
                    description: |
                      Contains the names of document attributes that are used to
                      determine the target shard for documents. _(cluster only)_
                    type: array
                    items:
                      type: string
                  replicationFactor:
                    description: |
                      Contains how many copies of each shard are kept on different DB-Servers.
                      It is an integer number in the range of 1-10 or the string `"satellite"`
                      for SatelliteCollections (Enterprise Edition only). _(cluster only)_
                    type: integer
                  writeConcern:
                    description: |
                      Determines how many copies of each shard are required to be
                      in-sync on the different DB-Servers. If there are less than these many copies
                      in the cluster, a shard refuses to write. Writes to shards with enough
                      up-to-date copies succeed at the same time, however. The value of
                      `writeConcern` cannot be greater than `replicationFactor`.

                      If `distributeShardsLike` is set, the `writeConcern`
                      is that of the prototype collection.
                      For SatelliteCollections, the `writeConcern` is automatically controlled to
                      equal the number of DB-Servers and has a value of `0`.
                      Otherwise, the default value is controlled by the current database's
                      default `writeConcern`, which uses the `--cluster.write-concern`
                      startup option as default, which defaults to `1`. _(cluster only)_
                    type: integer
                  shardingStrategy:
                    description: |
                      The sharding strategy selected for the collection. _(cluster only)_
                    type: string
                    enum:
                      - community-compat
                      - enterprise-compat
                      - enterprise-smart-edge-compat
                      - hash
                      - enterprise-hash-smart-edge
                      - enterprise-hex-smart-vertex
                  distributeShardsLike:
                    description: |
                      The name of another collection. This collection uses the `replicationFactor`,
                      `numberOfShards`, `shardingStrategy`, and `writeConcern` properties of the other collection and
                      the shards of this collection are distributed in the same way as the shards of
                      the other collection.
                    type: string
                  isSmart:
                    description: |
                      Whether the collection is used in a SmartGraph or EnterpriseGraph (Enterprise Edition only).
                      This is an internal property. _(cluster only)_
                    type: boolean
                  isDisjoint:
                    description: |
                      Whether the SmartGraph or EnterpriseGraph this collection belongs to is disjoint
                      (Enterprise Edition only). This is an internal property. _(cluster only)_
                    type: boolean
                  smartGraphAttribute:
                    description: |
                      The attribute that is used for sharding: vertices with the same value of
                      this attribute are placed in the same shard. All vertices are required to
                      have this attribute set and it has to be a string. Edges derive the
                      attribute from their connected vertices (Enterprise Edition only). _(cluster only)_
                    type: string
                  smartJoinAttribute:
                    description: |
                      Determines an attribute of the collection that must contain the shard key value
                      of the referred-to SmartJoin collection (Enterprise Edition only). _(cluster only)_
                    type: string
                  name:
                    description: |
                      The name of this collection.
                    type: string
                  id:
                    description: |
                      A unique identifier of the collection (deprecated).
                    type: string
                  type:
                    description: |
                      The type of the collection:
                        - `0`: "unknown"
                        - `2`: regular document collection
                        - `3`: edge collection
                    type: integer
                  isSystem:
                    description: |
                      Whether the collection is a system collection. Collection names that starts with
                      an underscore are usually system collections.
                    type: boolean
                  syncByRevision:
                    description: |
                      Whether the newer revision-based replication protocol is
                      enabled for this collection. This is an internal property.
                    type: boolean
                  globallyUniqueId:
                    description: |
                      A unique identifier of the collection. This is an internal property.
                    type: string
        '400':
          description: |
            The `collection-name` parameter is missing.
        '404':
          description: |
            The collection cannot be found.

            This error also occurs if you try to run this operation as part of a
            Stream Transaction but the transaction ID specified in the
            `x-arango-trx-id` header is unknown to the server.
        '410':
          description: |
            This error occurs if you try to run this operation as part of a
            Stream Transaction that has just been canceled or timed out.
      tags:
        - Collections
```

**Examples**

```curl
---
description: |-
  Requesting the number of documents:
name: RestCollectionGetCollectionCount
---
var cn = "products";
db._drop(cn);
var coll = db._create(cn, { waitForSync: true });
for(var i=0;i<100;i++) {
   coll.save({"count" :  i });
}
var url = "/_api/collection/"+ coll.name() + "/count";

var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```

### Get the collection statistics

```openapi
paths:
  /_db/{database-name}/_api/collection/{collection-name}/figures:
    get:
      operationId: getCollectionFigures
      description: |
        Get the number of documents and additional statistical information
        about the collection.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: collection-name
          in: path
          required: true
          description: |
            The name of the collection.

            {{</* warning */>}}
            Accessing collections by their numeric ID is deprecated from version 3.4.0 on.
            You should reference them via their names instead.
            {{</* /warning */>}}
          schema:
            type: string
        - name: details
          in: query
          required: false
          description: |
            Setting `details` to `true` will return extended storage engine-specific
            details to the figures. The details are intended for debugging ArangoDB itself
            and their format is subject to change. By default, `details` is set to `false`,
            so no details are returned and the behavior is identical to previous versions
            of ArangoDB.
            Please note that requesting `details` may cause additional load and thus have
            an impact on performance.
          schema:
            type: boolean
            default: false
      responses:
        '200':
          description: |
            All properties of the collection but additionally the document `count`
            and collection `figures`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - count
                  - figures
                  - error
                  - code
                  - name
                  - type
                  - status
                  - statusString
                  - isSystem
                  - id
                  - globallyUniqueId
                  - waitForSync
                  - keyOptions
                  - schema
                  - computedValues
                  - cacheEnabled
                  - syncByRevision
                  # Purposefully undocumented:
                  #   internalValidatorType (internal)
                  #   isSmartChild (internal)
                  #   minReplicationFactor (now writeConcern)
                  #   shadowCollections (internal)
                  #   usesRevisionsAsDocumentIds (internal)
                  # For backward compatibility:
                  #   status (legacy)
                  #   statusString (legacy)
                properties:
                  count:
                    description: |
                      The number of documents currently present in the collection.
                    type: integer
                  figures:
                    description: |
                      The metrics of the collection.
                    type: object
                    required:
                      - indexes
                    properties:
                      indexes:
                        description: |
                          The coarse index metrics.
                        type: object
                        required:
                          - count
                          - size
                        properties:
                          count:
                            description: |
                              The total number of indexes defined for the collection, including the pre-defined
                              indexes (e.g. primary index).
                            type: integer
                          size:
                            description: |
                              The total memory allocated for indexes in bytes.
                            type: integer
                      documentsSize:
                        description: |
                          The approximate on-disk size of the documents in bytes.
                        type: integer
                      cacheInUse:
                        description: |
                          Whether the document cache is enabled for this collection.
                        type: boolean
                      cacheSize:
                        description: |
                          The total memory usage of the document cache in bytes.
                        type: integer
                      cacheUsage:
                        description: |
                          The current data memory usage of the document cache in bytes.
                        type: integer
                      cacheLifeTimeHitRate:
                        description: |
                          The overall cache hit ratio in percent. In cluster deployments,
                          it is the sum of percentages of all shards.
                          
                          The attribute is only present if `cacheInUse` is `true`.
                        type: number
                      cacheWindowedHitRate:
                        description: |
                          The cache hit ratio of the past several thousand find
                          operations in percent. In cluster deployments,
                          it is the sum of percentages of all shards.

                          The attribute is only present if `cacheInUse` is `true`.
                        type: number
                      engine:
                        description: |
                          Extended, storage-engine specific figures.
                          Only included if the `details` query parameter is set to `true`.
                        type: object
                        properties:
                          documents:
                            description: |
                              The number of documents determined by iterating over all
                              RocksDB keys in range of the column family and counting them.
                            type: integer
                          indexes:
                            description: |
                              The detailed index metrics with the number of entries per index.
                            type: array
                            items:
                              type: object
                              properties:
                                type:
                                  description: |
                                    The index type.
                                    A `persistent` index is reported as `rocksdb-persistent`.
                                  type: string
                                id:
                                  description: |
                                    The identifier of the index.
                                  type: integer
                                count:
                                  description: |
                                    The number of index entries.
                                  type: integer
                  status:
                    description: |
                      The status of the collection (deprecated).
                      - `3`: loaded
                      - `5`: deleted

                      Every other status indicates a corrupted collection.
                    type: integer
                    example: 3
                  statusString:
                    description: |
                      The status of the collection as a descriptive string (deprecated).
                    type: string
                    enum: [loaded, deleted]
                    example: loaded
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  waitForSync:
                    description: |
                      If `true`, creating, changing, or removing
                      documents waits until the data has been synchronized to disk.
                    type: boolean
                  schema:
                    description: |
                      The configuration of the collection-level schema validation for documents.
                    type: object
                    required:
                      - rule
                      - level
                      - message
                      - type
                    properties:
                      rule:
                        description: |
                          A [JSON Schema](https://json-schema.org/specification-links#draft-4)
                          object (draft-4, without remote schemas).

                          See [Document Schema Validation](../../concepts/data-structure/documents/schema-validation.md)
                          for details.
                        type: object
                      level:
                        description: |
                          The level controls when the validation is triggered:
                          - `"none"`: The rule is inactive and validation thus turned off.
                          - `"new"`: Only newly inserted documents are validated.
                          - `"moderate"`: New and modified documents must pass validation,
                            except for modified documents where the OLD value did not pass
                            validation already. This level is useful if you have documents
                            which do not match your target structure, but you want to stop
                            the insertion of more invalid documents and prohibit that valid
                            documents are changed to invalid documents.
                          - `"strict"`: All new and modified document must strictly pass
                            validation. No exceptions are made.
                        type: string
                        enum: [none, new, moderate, strict]
                        default: strict
                      message:
                        description: |
                          The error message to raise if the schema validation fails
                          for a document.
                        type: string
                      type:
                        description: |
                          The schema validation type. Only JSON Schema is supported.
                        type: string
                        enum: [json]
                  computedValues:
                    description: |
                      A list of objects, each representing a computed value.
                    type: array
                    items:
                      type: object
                      required:
                        - name
                        - expression
                        - overwrite
                      properties:
                        name:
                          description: |
                            The name of the target attribute.
                          type: string
                        expression:
                          description: |
                            An AQL `RETURN` operation with an expression that computes the desired value.
                          type: string
                        overwrite:
                          description: |
                            Whether the computed value takes precedence over a user-provided or
                            existing attribute.
                          type: boolean
                        computeOn:
                          description: |
                            An array of strings that defines on which write operations the value is
                            computed.
                          type: array
                          uniqueItems: true
                          items:
                            type: string
                            enum: [insert, update, replace]
                          example: ["insert", "update", "replace"]
                        keepNull:
                          description: |
                            Whether the target attribute is set if the expression evaluates to `null`.
                          type: boolean
                        failOnWarning:
                          description: |
                            Whether the write operation fails if the expression produces a warning.
                          type: boolean
                  keyOptions:
                    description: |
                      An object which contains key generation options.
                    type: object
                    required:
                      - type
                      - allowUserKeys
                    properties:
                      type:
                        description: |
                          Specifies the type of the key generator.
                        type: string
                        enum: [traditional, autoincrement, uuid, padded]
                      allowUserKeys:
                        description: |
                          If set to `true`, then you are allowed to supply
                          own key values in the `_key` attribute of a document. If set to
                          `false`, then the key generator is solely responsible for
                          generating keys and an error is raised if you supply own key values in the
                          `_key` attribute of documents.

                          {{</* warning */>}}
                          You should not use both user-specified and automatically generated document keys
                          in the same collection in cluster deployments for collections with more than a
                          single shard. Mixing the two can lead to conflicts because Coordinators that
                          auto-generate keys in this case are not aware of all keys which are already used.
                          {{</* /warning */>}}
                        type: boolean
                      increment:
                        description: |
                          The increment value for the `autoincrement` key generator.
                          Not used by other key generator types.
                        type: integer
                      offset:
                        description: |
                          The initial offset value for the `autoincrement` key generator.
                          Not used by other key generator types.
                        type: integer
                      lastValue:
                        description: |
                          The offset value of the `autoincrement` or `padded` key generator.
                          This is an internal property for restoring dumps properly.
                        type: integer
                  cacheEnabled:
                    description: |
                      Whether the in-memory hash cache for documents is enabled for this
                      collection.
                    type: boolean
                  numberOfShards:
                    description: |
                      The number of shards of the collection. _(cluster only)_
                    type: integer
                  shardKeys:
                    description: |
                      Contains the names of document attributes that are used to
                      determine the target shard for documents. _(cluster only)_
                    type: array
                    items:
                      type: string
                  replicationFactor:
                    description: |
                      Contains how many copies of each shard are kept on different DB-Servers.
                      It is an integer number in the range of 1-10 or the string `"satellite"`
                      for SatelliteCollections (Enterprise Edition only). _(cluster only)_
                    type: integer
                  writeConcern:
                    description: |
                      Determines how many copies of each shard are required to be
                      in-sync on the different DB-Servers. If there are less than these many copies
                      in the cluster, a shard refuses to write. Writes to shards with enough
                      up-to-date copies succeed at the same time, however. The value of
                      `writeConcern` cannot be greater than `replicationFactor`.

                      If `distributeShardsLike` is set, the `writeConcern`
                      is that of the prototype collection.
                      For SatelliteCollections, the `writeConcern` is automatically controlled to
                      equal the number of DB-Servers and has a value of `0`.
                      Otherwise, the default value is controlled by the current database's
                      default `writeConcern`, which uses the `--cluster.write-concern`
                      startup option as default, which defaults to `1`. _(cluster only)_
                    type: integer
                  shardingStrategy:
                    description: |
                      The sharding strategy selected for the collection. _(cluster only)_
                    type: string
                    enum:
                      - community-compat
                      - enterprise-compat
                      - enterprise-smart-edge-compat
                      - hash
                      - enterprise-hash-smart-edge
                      - enterprise-hex-smart-vertex
                  distributeShardsLike:
                    description: |
                      The name of another collection. This collection uses the `replicationFactor`,
                      `numberOfShards`, `shardingStrategy`, and `writeConcern` properties of the other collection and
                      the shards of this collection are distributed in the same way as the shards of
                      the other collection.
                    type: string
                  isSmart:
                    description: |
                      Whether the collection is used in a SmartGraph or EnterpriseGraph (Enterprise Edition only).
                      This is an internal property. _(cluster only)_
                    type: boolean
                  isDisjoint:
                    description: |
                      Whether the SmartGraph or EnterpriseGraph this collection belongs to is disjoint
                      (Enterprise Edition only). This is an internal property. _(cluster only)_
                    type: boolean
                  smartGraphAttribute:
                    description: |
                      The attribute that is used for sharding: vertices with the same value of
                      this attribute are placed in the same shard. All vertices are required to
                      have this attribute set and it has to be a string. Edges derive the
                      attribute from their connected vertices (Enterprise Edition only). _(cluster only)_
                    type: string
                  smartJoinAttribute:
                    description: |
                      Determines an attribute of the collection that must contain the shard key value
                      of the referred-to SmartJoin collection (Enterprise Edition only). _(cluster only)_
                    type: string
                  name:
                    description: |
                      The name of this collection.
                    type: string
                  id:
                    description: |
                      A unique identifier of the collection (deprecated).
                    type: string
                  type:
                    description: |
                      The type of the collection:
                        - `0`: "unknown"
                        - `2`: regular document collection
                        - `3`: edge collection
                    type: integer
                  isSystem:
                    description: |
                      Whether the collection is a system collection. Collection names that starts with
                      an underscore are usually system collections.
                    type: boolean
                  syncByRevision:
                    description: |
                      Whether the newer revision-based replication protocol is
                      enabled for this collection. This is an internal property.
                    type: boolean
                  globallyUniqueId:
                    description: |
                      A unique identifier of the collection. This is an internal property.
                    type: string
        '400':
          description: |
            The `collection-name` parameter is missing.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A collection called `collection-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Collections
```

**Examples**

```curl
---
description: |-
  Using an identifier and requesting the figures of the collection:
name: RestCollectionGetCollectionFigures
---
var cn = "products";
db._drop(cn);
var coll = db._create(cn);
coll.save({"test":"hello"});
require("internal").wal.flush(true, true);
var url = "/_api/collection/"+ coll.name() + "/figures";

var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: ''
name: RestCollectionGetCollectionFiguresDetails
---
var cn = "products";
db._drop(cn);
var coll = db._create(cn);
coll.save({"test":"hello"});
require("internal").wal.flush(true, true);
var url = "/_api/collection/"+ coll.name() + "/figures?details=true";

var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```

### Get the responsible shard for a document

```openapi
paths:
  /_db/{database-name}/_api/collection/{collection-name}/responsibleShard:
    put:
      operationId: getResponsibleShard
      description: |
        Returns the ID of the shard that is responsible for the given document
        (if the document exists) or that would be responsible if such document
        existed.

        The request must body must contain a JSON document with at least the
        collection's shard key attributes set to some values.

        The response is a JSON object with a `shardId` attribute, which will
        contain the ID of the responsible shard.

        {{</* info */>}}
        This method is only available in cluster deployments on Coordinators.
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
        - name: collection-name
          in: path
          required: true
          description: |
            The name of the collection.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              description: |
                The request body must be a JSON object with at least the shard key
                attributes set to some values, but it may also be a full document.
              type: object
      responses:
        '200':
          description: |
            Returns the ID of the responsible shard.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - shardId
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  shardId:
                    description: |
                      The ID of the responsible shard
                    type: string
        '400':
          description: |
            The `collection-name` parameter is missing or not all of the
            collection's shard key attributes are present in the input document.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A collection called `collection-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '501':
          description: |
            The method has been called on a single server.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 501
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Collections
```

**Examples**

```curl
---
description: ''
name: RestGetResponsibleShardExample
type: cluster
---
var cn = "testCollection";
db._drop(cn);
db._create(cn, { numberOfShards: 3, shardKeys: ["_key"] });

var body = { _key: "testkey", value: 23 };
var response = logCurlRequest('PUT', "/_api/collection/" + cn + "/responsibleShard", body);

assert(response.code === 200);
assert(response.parsedBody.hasOwnProperty("shardId"));

logJsonResponse(response);
db._drop(cn);
```

### Get the shard IDs of a collection

```openapi
paths:
  /_db/{database-name}/_api/collection/{collection-name}/shards:
    get:
      operationId: getCollectionShards
      description: |
        The response contains a list of the collection's shard IDs.
        
        If the `details` parameter is set to `true`, it returns an object instead
        of a list, with the shard IDs as object attribute keys, and an array with
        the responsible servers for each shard mapped to them as attribute values.
        The first element of each array is the leader shard.

        {{</* info */>}}
        This method is only available in cluster deployments on Coordinators.
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
        - name: collection-name
          in: path
          required: true
          description: |
            The name of the collection.
          schema:
            type: string
        - name: details
          in: query
          required: false
          description: |
            If set to true, the return value also contains the responsible servers for the collections' shards.
          schema:
            type: boolean
            default: false
      responses:
        '200':
          description: |
            All collection properties but additionally the `shards` of the collection.
          content:
            application/json:
              schema:
                type: object
                required:
                  - shards
                  - error
                  - code
                  - name
                  - type
                  - status
                  - statusString
                  - isSystem
                  - id
                  - globallyUniqueId
                  - waitForSync
                  - keyOptions
                  - schema
                  - computedValues
                  - cacheEnabled
                  - syncByRevision
                  # Purposefully undocumented:
                  #   internalValidatorType (internal)
                  #   isSmartChild (internal)
                  #   minReplicationFactor (now writeConcern)
                  #   shadowCollections (internal)
                  #   usesRevisionsAsDocumentIds (internal)
                  # For backward compatibility:
                  #   status (legacy)
                  #   statusString (legacy)
                properties:
                  shards:
                    description: |
                      The type and value depend on the setting of the `details` parameter:
                      - `false`: An array of the collection shard IDs.
                      - `true`: An object where the keys are shard IDs and the
                        values are arrays with the responsible DB-Server names
                        (shard leader first).
                    # TODO: polymorphic structural description? Complex to render
                    #type: [array, object]
                    #items:
                    #  type: string
                    #  pattern: "^s\\d+$"
                    #patternProperties:
                    #  "^s\\d+$":
                    #    type: array
                    #    items:
                    #      type: string
                    # --- or ---
                    #oneOf:
                    #  - type: array
                    #    items:
                    #      type: string
                    #      pattern: "^s\\d+$"
                    #  - type: object
                    #    patternProperties:
                    #      "^s\\d+$":
                    #        type: array
                    #        items:
                    #          type: string
                  status:
                    description: |
                      The status of the collection (deprecated).
                      - `3`: loaded
                      - `5`: deleted

                      Every other status indicates a corrupted collection.
                    type: integer
                    example: 3
                  statusString:
                    description: |
                      The status of the collection as a descriptive string (deprecated).
                    type: string
                    enum: [loaded, deleted]
                    example: loaded
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  waitForSync:
                    description: |
                      If `true`, creating, changing, or removing
                      documents waits until the data has been synchronized to disk.
                    type: boolean
                  schema:
                    description: |
                      The configuration of the collection-level schema validation for documents.
                    type: object
                    required:
                      - rule
                      - level
                      - message
                      - type
                    properties:
                      rule:
                        description: |
                          A [JSON Schema](https://json-schema.org/specification-links#draft-4)
                          object (draft-4, without remote schemas).

                          See [Document Schema Validation](../../concepts/data-structure/documents/schema-validation.md)
                          for details.
                        type: object
                      level:
                        description: |
                          The level controls when the validation is triggered:
                          - `"none"`: The rule is inactive and validation thus turned off.
                          - `"new"`: Only newly inserted documents are validated.
                          - `"moderate"`: New and modified documents must pass validation,
                            except for modified documents where the OLD value did not pass
                            validation already. This level is useful if you have documents
                            which do not match your target structure, but you want to stop
                            the insertion of more invalid documents and prohibit that valid
                            documents are changed to invalid documents.
                          - `"strict"`: All new and modified document must strictly pass
                            validation. No exceptions are made.
                        type: string
                        enum: [none, new, moderate, strict]
                        default: strict
                      message:
                        description: |
                          The error message to raise if the schema validation fails
                          for a document.
                        type: string
                      type:
                        description: |
                          The schema validation type. Only JSON Schema is supported.
                        type: string
                        enum: [json]
                  computedValues:
                    description: |
                      A list of objects, each representing a computed value.
                    type: array
                    items:
                      type: object
                      required:
                        - name
                        - expression
                        - overwrite
                      properties:
                        name:
                          description: |
                            The name of the target attribute.
                          type: string
                        expression:
                          description: |
                            An AQL `RETURN` operation with an expression that computes the desired value.
                          type: string
                        overwrite:
                          description: |
                            Whether the computed value takes precedence over a user-provided or
                            existing attribute.
                          type: boolean
                        computeOn:
                          description: |
                            An array of strings that defines on which write operations the value is
                            computed.
                          type: array
                          uniqueItems: true
                          items:
                            type: string
                            enum: [insert, update, replace]
                          example: ["insert", "update", "replace"]
                        keepNull:
                          description: |
                            Whether the target attribute is set if the expression evaluates to `null`.
                          type: boolean
                        failOnWarning:
                          description: |
                            Whether the write operation fails if the expression produces a warning.
                          type: boolean
                  keyOptions:
                    description: |
                      An object which contains key generation options.
                    type: object
                    required:
                      - type
                      - allowUserKeys
                    properties:
                      type:
                        description: |
                          Specifies the type of the key generator.
                        type: string
                        enum: [traditional, autoincrement, uuid, padded]
                      allowUserKeys:
                        description: |
                          If set to `true`, then you are allowed to supply
                          own key values in the `_key` attribute of a document. If set to
                          `false`, then the key generator is solely responsible for
                          generating keys and an error is raised if you supply own key values in the
                          `_key` attribute of documents.

                          {{</* warning */>}}
                          You should not use both user-specified and automatically generated document keys
                          in the same collection in cluster deployments for collections with more than a
                          single shard. Mixing the two can lead to conflicts because Coordinators that
                          auto-generate keys in this case are not aware of all keys which are already used.
                          {{</* /warning */>}}
                        type: boolean
                      increment:
                        description: |
                          The increment value for the `autoincrement` key generator.
                          Not used by other key generator types.
                        type: integer
                      offset:
                        description: |
                          The initial offset value for the `autoincrement` key generator.
                          Not used by other key generator types.
                        type: integer
                      lastValue:
                        description: |
                          The offset value of the `autoincrement` or `padded` key generator.
                          This is an internal property for restoring dumps properly.
                        type: integer
                  cacheEnabled:
                    description: |
                      Whether the in-memory hash cache for documents is enabled for this
                      collection.
                    type: boolean
                  numberOfShards:
                    description: |
                      The number of shards of the collection. _(cluster only)_
                    type: integer
                  shardKeys:
                    description: |
                      Contains the names of document attributes that are used to
                      determine the target shard for documents. _(cluster only)_
                    type: array
                    items:
                      type: string
                  replicationFactor:
                    description: |
                      Contains how many copies of each shard are kept on different DB-Servers.
                      It is an integer number in the range of 1-10 or the string `"satellite"`
                      for SatelliteCollections (Enterprise Edition only). _(cluster only)_
                    type: integer
                  writeConcern:
                    description: |
                      Determines how many copies of each shard are required to be
                      in-sync on the different DB-Servers. If there are less than these many copies
                      in the cluster, a shard refuses to write. Writes to shards with enough
                      up-to-date copies succeed at the same time, however. The value of
                      `writeConcern` cannot be greater than `replicationFactor`.

                      If `distributeShardsLike` is set, the `writeConcern`
                      is that of the prototype collection.
                      For SatelliteCollections, the `writeConcern` is automatically controlled to
                      equal the number of DB-Servers and has a value of `0`.
                      Otherwise, the default value is controlled by the current database's
                      default `writeConcern`, which uses the `--cluster.write-concern`
                      startup option as default, which defaults to `1`. _(cluster only)_
                    type: integer
                  shardingStrategy:
                    description: |
                      The sharding strategy selected for the collection. _(cluster only)_
                    type: string
                    enum:
                      - community-compat
                      - enterprise-compat
                      - enterprise-smart-edge-compat
                      - hash
                      - enterprise-hash-smart-edge
                      - enterprise-hex-smart-vertex
                  distributeShardsLike:
                    description: |
                      The name of another collection. This collection uses the `replicationFactor`,
                      `numberOfShards`, `shardingStrategy`, and `writeConcern` properties of the other collection and
                      the shards of this collection are distributed in the same way as the shards of
                      the other collection.
                    type: string
                  isSmart:
                    description: |
                      Whether the collection is used in a SmartGraph or EnterpriseGraph (Enterprise Edition only).
                      This is an internal property. _(cluster only)_
                    type: boolean
                  isDisjoint:
                    description: |
                      Whether the SmartGraph or EnterpriseGraph this collection belongs to is disjoint
                      (Enterprise Edition only). This is an internal property. _(cluster only)_
                    type: boolean
                  smartGraphAttribute:
                    description: |
                      The attribute that is used for sharding: vertices with the same value of
                      this attribute are placed in the same shard. All vertices are required to
                      have this attribute set and it has to be a string. Edges derive the
                      attribute from their connected vertices (Enterprise Edition only). _(cluster only)_
                    type: string
                  smartJoinAttribute:
                    description: |
                      Determines an attribute of the collection that must contain the shard key value
                      of the referred-to SmartJoin collection (Enterprise Edition only). _(cluster only)_
                    type: string
                  name:
                    description: |
                      The name of this collection.
                    type: string
                  id:
                    description: |
                      A unique identifier of the collection (deprecated).
                    type: string
                  type:
                    description: |
                      The type of the collection:
                        - `0`: "unknown"
                        - `2`: regular document collection
                        - `3`: edge collection
                    type: integer
                  isSystem:
                    description: |
                      Whether the collection is a system collection. Collection names that starts with
                      an underscore are usually system collections.
                    type: boolean
                  syncByRevision:
                    description: |
                      Whether the newer revision-based replication protocol is
                      enabled for this collection. This is an internal property.
                    type: boolean
                  globallyUniqueId:
                    description: |
                      A unique identifier of the collection. This is an internal property.
                    type: string
        '400':
          description: |
            The `collection-name` parameter is missing.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A collection called `collection-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '501':
          description: |
            The method has been called on a single server.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 501
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Collections
```

**Examples**

```curl
---
description: |-
  Retrieves the list of shards:
name: RestGetShards
type: cluster
---
var cn = "testCollection";
db._drop(cn);
db._create(cn, { numberOfShards: 3 });

var response = logCurlRequest('GET', "/_api/collection/" + cn + "/shards");

assert(response.code === 200);
assert(response.parsedBody.hasOwnProperty("shards"));
logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Retrieves the list of shards with the responsible servers:
name: RestGetShardsWithDetails
type: cluster
---
var cn = "testCollection";
db._drop(cn);
db._create(cn, { numberOfShards: 3 });

var response = logCurlRequest('GET', "/_api/collection/" + cn + "/shards?details=true");

assert(response.code === 200);
assert(response.parsedBody.hasOwnProperty("shards"));
logJsonResponse(response);
db._drop(cn);
```

### Get the collection revision ID

```openapi
paths:
  /_db/{database-name}/_api/collection/{collection-name}/revision:
    get:
      operationId: getCollectionRevision
      description: |
        The response contains the collection's latest used revision ID.
        The revision ID is a server-generated string that clients can use to
        check whether data in a collection has changed since the last revision check.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: collection-name
          in: path
          required: true
          description: |
            The name of the collection.

            {{</* warning */>}}
            Accessing collections by their numeric ID is deprecated from version 3.4.0 on.
            You should reference them via their names instead.
            {{</* /warning */>}}
          schema:
            type: string
      responses:
        '200':
          description: |
            All collection properties but additionally the `revision` of the collection.
          content:
            application/json:
              schema:
                type: object
                required:
                  - revision
                  - error
                  - code
                  - name
                  - type
                  - status
                  - statusString
                  - isSystem
                  - id
                  - globallyUniqueId
                  - waitForSync
                  - keyOptions
                  - schema
                  - computedValues
                  - cacheEnabled
                  - syncByRevision
                  # Purposefully undocumented:
                  #   internalValidatorType (internal)
                  #   isSmartChild (internal)
                  #   minReplicationFactor (now writeConcern)
                  #   shadowCollections (internal)
                  #   usesRevisionsAsDocumentIds (internal)
                  # For backward compatibility:
                  #   status (legacy)
                  #   statusString (legacy)
                properties:
                  revision:
                    description: |
                      The collection revision ID as a string.
                    type: string
                  status:
                    description: |
                      The status of the collection (deprecated).
                      - `3`: loaded
                      - `5`: deleted

                      Every other status indicates a corrupted collection.
                    type: integer
                    example: 3
                  statusString:
                    description: |
                      The status of the collection as a descriptive string (deprecated).
                    type: string
                    enum: [loaded, deleted]
                    example: loaded
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  waitForSync:
                    description: |
                      If `true`, creating, changing, or removing
                      documents waits until the data has been synchronized to disk.
                    type: boolean
                  schema:
                    description: |
                      The configuration of the collection-level schema validation for documents.
                    type: object
                    required:
                      - rule
                      - level
                      - message
                      - type
                    properties:
                      rule:
                        description: |
                          A [JSON Schema](https://json-schema.org/specification-links#draft-4)
                          object (draft-4, without remote schemas).

                          See [Document Schema Validation](../../concepts/data-structure/documents/schema-validation.md)
                          for details.
                        type: object
                      level:
                        description: |
                          The level controls when the validation is triggered:
                          - `"none"`: The rule is inactive and validation thus turned off.
                          - `"new"`: Only newly inserted documents are validated.
                          - `"moderate"`: New and modified documents must pass validation,
                            except for modified documents where the OLD value did not pass
                            validation already. This level is useful if you have documents
                            which do not match your target structure, but you want to stop
                            the insertion of more invalid documents and prohibit that valid
                            documents are changed to invalid documents.
                          - `"strict"`: All new and modified document must strictly pass
                            validation. No exceptions are made.
                        type: string
                        enum: [none, new, moderate, strict]
                        default: strict
                      message:
                        description: |
                          The error message to raise if the schema validation fails
                          for a document.
                        type: string
                      type:
                        description: |
                          The schema validation type. Only JSON Schema is supported.
                        type: string
                        enum: [json]
                  computedValues:
                    description: |
                      A list of objects, each representing a computed value.
                    type: array
                    items:
                      type: object
                      required:
                        - name
                        - expression
                        - overwrite
                      properties:
                        name:
                          description: |
                            The name of the target attribute.
                          type: string
                        expression:
                          description: |
                            An AQL `RETURN` operation with an expression that computes the desired value.
                          type: string
                        overwrite:
                          description: |
                            Whether the computed value takes precedence over a user-provided or
                            existing attribute.
                          type: boolean
                        computeOn:
                          description: |
                            An array of strings that defines on which write operations the value is
                            computed.
                          type: array
                          uniqueItems: true
                          items:
                            type: string
                            enum: [insert, update, replace]
                          example: ["insert", "update", "replace"]
                        keepNull:
                          description: |
                            Whether the target attribute is set if the expression evaluates to `null`.
                          type: boolean
                        failOnWarning:
                          description: |
                            Whether the write operation fails if the expression produces a warning.
                          type: boolean
                  keyOptions:
                    description: |
                      An object which contains key generation options.
                    type: object
                    required:
                      - type
                      - allowUserKeys
                    properties:
                      type:
                        description: |
                          Specifies the type of the key generator.
                        type: string
                        enum: [traditional, autoincrement, uuid, padded]
                      allowUserKeys:
                        description: |
                          If set to `true`, then you are allowed to supply
                          own key values in the `_key` attribute of a document. If set to
                          `false`, then the key generator is solely responsible for
                          generating keys and an error is raised if you supply own key values in the
                          `_key` attribute of documents.

                          {{</* warning */>}}
                          You should not use both user-specified and automatically generated document keys
                          in the same collection in cluster deployments for collections with more than a
                          single shard. Mixing the two can lead to conflicts because Coordinators that
                          auto-generate keys in this case are not aware of all keys which are already used.
                          {{</* /warning */>}}
                        type: boolean
                      increment:
                        description: |
                          The increment value for the `autoincrement` key generator.
                          Not used by other key generator types.
                        type: integer
                      offset:
                        description: |
                          The initial offset value for the `autoincrement` key generator.
                          Not used by other key generator types.
                        type: integer
                      lastValue:
                        description: |
                          The offset value of the `autoincrement` or `padded` key generator.
                          This is an internal property for restoring dumps properly.
                        type: integer
                  cacheEnabled:
                    description: |
                      Whether the in-memory hash cache for documents is enabled for this
                      collection.
                    type: boolean
                  numberOfShards:
                    description: |
                      The number of shards of the collection. _(cluster only)_
                    type: integer
                  shardKeys:
                    description: |
                      Contains the names of document attributes that are used to
                      determine the target shard for documents. _(cluster only)_
                    type: array
                    items:
                      type: string
                  replicationFactor:
                    description: |
                      Contains how many copies of each shard are kept on different DB-Servers.
                      It is an integer number in the range of 1-10 or the string `"satellite"`
                      for SatelliteCollections (Enterprise Edition only). _(cluster only)_
                    type: integer
                  writeConcern:
                    description: |
                      Determines how many copies of each shard are required to be
                      in-sync on the different DB-Servers. If there are less than these many copies
                      in the cluster, a shard refuses to write. Writes to shards with enough
                      up-to-date copies succeed at the same time, however. The value of
                      `writeConcern` cannot be greater than `replicationFactor`.

                      If `distributeShardsLike` is set, the `writeConcern`
                      is that of the prototype collection.
                      For SatelliteCollections, the `writeConcern` is automatically controlled to
                      equal the number of DB-Servers and has a value of `0`.
                      Otherwise, the default value is controlled by the current database's
                      default `writeConcern`, which uses the `--cluster.write-concern`
                      startup option as default, which defaults to `1`. _(cluster only)_
                    type: integer
                  shardingStrategy:
                    description: |
                      The sharding strategy selected for the collection. _(cluster only)_
                    type: string
                    enum:
                      - community-compat
                      - enterprise-compat
                      - enterprise-smart-edge-compat
                      - hash
                      - enterprise-hash-smart-edge
                      - enterprise-hex-smart-vertex
                  distributeShardsLike:
                    description: |
                      The name of another collection. This collection uses the `replicationFactor`,
                      `numberOfShards`, `shardingStrategy`, and `writeConcern` properties of the other collection and
                      the shards of this collection are distributed in the same way as the shards of
                      the other collection.
                    type: string
                  isSmart:
                    description: |
                      Whether the collection is used in a SmartGraph or EnterpriseGraph (Enterprise Edition only).
                      This is an internal property. _(cluster only)_
                    type: boolean
                  isDisjoint:
                    description: |
                      Whether the SmartGraph or EnterpriseGraph this collection belongs to is disjoint
                      (Enterprise Edition only). This is an internal property. _(cluster only)_
                    type: boolean
                  smartGraphAttribute:
                    description: |
                      The attribute that is used for sharding: vertices with the same value of
                      this attribute are placed in the same shard. All vertices are required to
                      have this attribute set and it has to be a string. Edges derive the
                      attribute from their connected vertices (Enterprise Edition only). _(cluster only)_
                    type: string
                  smartJoinAttribute:
                    description: |
                      Determines an attribute of the collection that must contain the shard key value
                      of the referred-to SmartJoin collection (Enterprise Edition only). _(cluster only)_
                    type: string
                  name:
                    description: |
                      The name of this collection.
                    type: string
                  id:
                    description: |
                      A unique identifier of the collection (deprecated).
                    type: string
                  type:
                    description: |
                      The type of the collection:
                        - `0`: "unknown"
                        - `2`: regular document collection
                        - `3`: edge collection
                    type: integer
                  isSystem:
                    description: |
                      Whether the collection is a system collection. Collection names that starts with
                      an underscore are usually system collections.
                    type: boolean
                  syncByRevision:
                    description: |
                      Whether the newer revision-based replication protocol is
                      enabled for this collection. This is an internal property.
                    type: boolean
                  globallyUniqueId:
                    description: |
                      A unique identifier of the collection. This is an internal property.
                    type: string
        '400':
          description: |
            The `collection-name` parameter is missing.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A collection called `collection-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string

      tags:
        - Collections
```

**Examples**

```curl
---
description: |-
  Retrieving the revision of a collection
name: RestCollectionGetCollectionRevision
---
var cn = "products";
db._drop(cn);
var coll = db._create(cn, { waitForSync: false });
var url = "/_api/collection/"+ coll.name() + "/revision";

var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```

### Get the collection checksum

```openapi
paths:
  /_db/{database-name}/_api/collection/{collection-name}/checksum:
    get:
      operationId: getCollectionChecksum
      description: |
        Calculates a checksum of the meta-data (keys and optionally revision ids) and
        optionally the document data in the collection.

        The checksum can be used to compare if two collections on different ArangoDB
        instances contain the same contents. The current revision of the collection is
        returned too so one can make sure the checksums are calculated for the same
        state of data.

        By default, the checksum is only calculated on the `_key` system attribute
        of the documents contained in the collection. For edge collections, the system
        attributes `_from` and `_to` are also included in the calculation.

        By setting the optional query parameter `withRevisions` to `true`, then revision
        IDs (`_rev` system attributes) are included in the checksumming.

        By providing the optional query parameter `withData` with a value of `true`,
        the user-defined document attributes are included in the calculation, too.
        
        {{</* info */>}}
        Including user-defined attributes will make the checksumming slower.
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
        - name: collection-name
          in: path
          required: true
          description: |
            The name of the collection.

            {{</* warning */>}}
            Accessing collections by their numeric ID is deprecated from version 3.4.0 on.
            You should reference them via their names instead.
            {{</* /warning */>}}
          schema:
            type: string
        - name: withRevisions
          in: query
          required: false
          description: |
            Whether to include document revision ids in the checksum calculation.
          schema:
            type: boolean
            default: false
        - name: withData
          in: query
          required: false
          description: |
            Whether to include document body data in the checksum calculation.
          schema:
            type: boolean
            default: false
      responses:
        '200':
          description: |
            The basic information about the collection but additionally the
            collection `checksum` and `revision`.
          content:
            application/json:
              schema:
                type: object
                required:
                  - checksum
                  - revision
                  - error
                  - code
                  - id
                  - name
                  - status
                  - type
                  - isSystem
                  - globallyUniqueId
                properties:
                  checksum:
                    description: |
                      The calculated checksum as a number.
                  revision:
                    description: |
                      The collection revision id as a string.
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  id:
                    description: |
                      A unique identifier of the collection (deprecated).
                    type: string
                  name:
                    description: |
                      The name of the collection.
                    type: string
                    example: coll
                  status:
                    description: |
                      The status of the collection.
                      - `3`: loaded
                      - `5`: deleted

                      Every other status indicates a corrupted collection.
                    type: integer
                    example: 3
                  type:
                    description: |
                      The type of the collection:
                      - `0`: "unknown"
                      - `2`: regular document collection
                      - `3`: edge collection
                    type: integer
                    example: 2
                  isSystem:
                    description: |
                      Whether the collection is a system collection. Collection names that starts with
                      an underscore are usually system collections.
                    type: boolean
                    example: false
                  globallyUniqueId:
                    description: |
                      A unique identifier of the collection. This is an internal property.
                    type: string
        '400':
          description: |
            If the `collection-name` placeholder is missing, then a *HTTP 400* is
            returned.
        '404':
          description: |
            If the collection is unknown, then a *HTTP 404*
            is returned.
      tags:
        - Collections
```

**Examples**

```curl
---
description: |-
  Retrieving the checksum of a collection:
name: RestCollectionGetCollectionChecksum
---
var cn = "products";
db._drop(cn);
var coll = db._create(cn);
coll.save({ foo: "bar" });
var url = "/_api/collection/" + coll.name() + "/checksum";

var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```

```curl
---
description: |-
  Retrieving the checksum of a collection including the collection data,
  but not the revisions:
name: RestCollectionGetCollectionChecksumNoRev
---
var cn = "products";
db._drop(cn);
var coll = db._create(cn);
coll.save({ foo: "bar" });
var url = "/_api/collection/" + coll.name() + "/checksum?withRevisions=false&withData=true";

var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```

## Create and delete collections

### Create a collection

```openapi
paths:
  /_db/{database-name}/_api/collection:
    post:
      operationId: createCollection
      description: |
        Creates a new collection with a given name. The request must contain an
        object with the following attributes.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: waitForSyncReplication
          in: query
          required: false
          description: |
            The default is `true`, which means the server only reports success back to the
            client when all replicas have created the collection. Set it to `false` if you want
            faster server responses and don't care about full replication.
          schema:
            type: boolean
            default: true
        - name: enforceReplicationFactor
          in: query
          required: false
          description: |
            The default is `true`, which means the server checks if there are enough replicas
            available at creation time and bail out otherwise. Set it to `false` to disable
            this extra check.
          schema:
            type: boolean
            default: true
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - name
              properties:
                name:
                  description: |
                    The name of the collection.
                  type: string
                waitForSync:
                  description: |
                    If set to `true`, then the data is synchronized to disk before returning from a
                    document create, update, replace or removal operation.
                  type: boolean
                  default: false
                isSystem:
                  description: |
                    If `true`, create a system collection. In this case, the `collection-name`
                    should start with an underscore. End-users should normally create non-system
                    collections only. API implementors may be required to create system
                    collections in very special occasions, but normally a regular collection will do.
                  type: boolean
                  default: false
                schema:
                  description: |
                    The configuration of the collection-level schema validation for documents.
                  type: object
                  required:
                    - rule
                  properties:
                    rule:
                      description: |
                        A [JSON Schema](https://json-schema.org/specification-links#draft-4)
                        object (draft-4, without remote schemas).

                        See [Document Schema Validation](../../concepts/data-structure/documents/schema-validation.md)
                        for details.
                      type: object
                    level:
                      description: |
                        The level controls when the validation is triggered:
                        - `"none"`: The rule is inactive and validation thus turned off.
                        - `"new"`: Only newly inserted documents are validated.
                        - `"moderate"`: New and modified documents must pass validation,
                          except for modified documents where the OLD value did not pass
                          validation already. This level is useful if you have documents
                          which do not match your target structure, but you want to stop
                          the insertion of more invalid documents and prohibit that valid
                          documents are changed to invalid documents.
                        - `"strict"`: All new and modified document must strictly pass
                          validation. No exceptions are made.
                      type: string
                      enum: [none, new, moderate, strict]
                      default: strict
                    message:
                      description: |
                        The error message to raise if the schema validation fails
                        for a document.
                      type: string
                computedValues:
                  description: |
                    An optional list of objects, each representing a computed value.
                  type: array
                  items:
                    type: object
                    required:
                      - name
                      - expression
                      - overwrite
                    properties:
                      name:
                        description: |
                          The name of the target attribute. Can only be a top-level attribute, but you
                          may return a nested object. Cannot be `_key`, `_id`, `_rev`, `_from`, `_to`,
                          or a shard key attribute.
                        type: string
                      expression:
                        description: |
                          An AQL `RETURN` operation with an expression that computes the desired value.
                          See [Computed Value Expressions](../../concepts/data-structure/documents/computed-values.md#computed-value-expressions) for details.
                        type: string
                      overwrite:
                        description: |
                          Whether the computed value shall take precedence over a user-provided or
                          existing attribute.
                        type: boolean
                      computeOn:
                        description: |
                          An array of strings to define on which write operations the value shall be
                          computed.
                        type: array
                        uniqueItems: true
                        items:
                          type: string
                          enum: [insert, update, replace]
                        default: ["insert", "update", "replace"]
                      keepNull:
                        description: |
                          Whether the target attribute shall be set if the expression evaluates to `null`.
                          You can set the option to `false` to not set (or unset) the target attribute if
                          the expression returns `null`.
                        type: boolean
                        default: true
                      failOnWarning:
                        description: |
                          Whether to let the write operation fail if the expression produces a warning.
                        type: boolean
                        default: false
                keyOptions:
                  description: |
                    additional options for key generation. If specified, then `keyOptions`
                    should be a JSON object containing the following attributes:
                  type: object
                  properties:
                    type:
                      description: |
                        specifies the type of the key generator. The currently available generators are
                        `traditional`, `autoincrement`, `uuid` and `padded`.

                        - The `traditional` key generator generates numerical keys in ascending order.
                          The sequence of keys is not guaranteed to be gap-free.

                        - The `autoincrement` key generator generates numerical keys in ascending order,
                          the initial offset and the spacing can be configured (**note**: `autoincrement`
                          is only supported for non-sharded collections).
                          The sequence of generated keys is not guaranteed to be gap-free, because a new key
                          will be generated on every document insert attempt, not just for successful
                          inserts.

                        - The `padded` key generator generates keys of a fixed length (16 bytes) in
                          ascending lexicographical sort order. This is ideal for the RocksDB storage engine,
                          which will slightly benefit keys that are inserted in lexicographically
                          ascending order. The key generator can be used in a single-server or cluster.
                          The sequence of generated keys is not guaranteed to be gap-free.

                        - The `uuid` key generator generates universally unique 128 bit keys, which
                          are stored in hexadecimal human-readable format. This key generator can be used
                          in a single-server or cluster to generate "seemingly random" keys. The keys
                          produced by this key generator are not lexicographically sorted.

                        Please note that keys are only guaranteed to be truly ascending in single
                        server deployments and for collections that only have a single shard (that includes
                        collections in a OneShard database).
                        The reason is that for collections with more than a single shard, document keys
                        are generated on Coordinator(s). For collections with a single shard, the document
                        keys are generated on the leader DB-Server, which has full control over the key
                        sequence.
                      type: string
                      default: traditional
                    allowUserKeys:
                      description: |
                        If set to `true`, then you are allowed to supply own key values in the
                        `_key` attribute of documents. If set to `false`, then the key generator
                        is solely responsible for generating keys and an error is raised if you
                        supply own key values in the `_key` attribute of documents.


                        {{</* warning */>}}
                        You should not use both user-specified and automatically generated document keys
                        in the same collection in cluster deployments for collections with more than a
                        single shard. Mixing the two can lead to conflicts because Coordinators that
                        auto-generate keys in this case are not aware of all keys which are already used.
                        {{</* /warning */>}}
                      type: boolean
                      default: true
                    increment:
                      description: |
                        The increment value for the `autoincrement` key generator.
                        Not allowed for other key generator types.
                      type: integer
                      default: 1
                    offset:
                      description: |
                        The initial offset value for the `autoincrement` key generator.
                        Not allowed for other key generator types.
                      type: integer
                      default: 0
                type:
                  description: |
                    The type of the collection to create.
                    The following values for `type` are valid:

                    - `2`: document collection
                    - `3`: edge collection
                  type: integer
                  default: 2
                cacheEnabled:
                  description: |
                    Whether the in-memory hash cache for documents should be enabled for this
                    collection. Can be controlled globally with the `--cache.size`
                    startup option. The cache can speed up repeated reads of the same documents via
                    their document keys. If the same documents are not fetched often or are
                    modified frequently, then you may disable the cache to avoid the maintenance
                    costs.
                  type: boolean
                  default: false
                numberOfShards:
                  description: |
                    In a cluster, this value determines the
                    number of shards to create for the collection.
                  type: integer
                  default: 1
                shardKeys:
                  description: |
                    In a cluster, this attribute determines
                    which document attributes are used to determine the target shard for documents.
                    Documents are sent to shards based on the values of their shard key attributes.
                    The values of all shard key attributes in a document are hashed,
                    and the hash value is used to determine the target shard.

                    {{</* info */>}}
                    Values of shard key attributes cannot be changed once set.
                    {{</* /info */>}}
                  type: string
                  default: [ "_key" ]
                replicationFactor:
                  description: |
                    In a cluster, this attribute determines how many copies
                    of each shard are kept on different DB-Servers. The value 1 means that only one
                    copy (no synchronous replication) is kept. A value of k means that k-1 replicas
                    are kept. For SatelliteCollections, it needs to be the string `"satellite"`,
                    which matches the replication factor to the number of DB-Servers
                    (Enterprise Edition only).

                    Any two copies reside on different DB-Servers. Replication between them is
                    synchronous, that is, every write operation to the "leader" copy will be replicated
                    to all "follower" replicas, before the write operation is reported successful.

                    If a server fails, this is detected automatically and one of the servers holding
                    copies take over, usually without an error being reported.

                    Default: The `replicationFactor` defined by the database.
                  type: integer
                writeConcern:
                  description: |
                    Determines how many copies of each shard are required to be
                    in sync on the different DB-Servers. If there are less than these many copies
                    in the cluster, a shard refuses to write. Writes to shards with enough
                    up-to-date copies succeed at the same time, however. The value of
                    `writeConcern` cannot be greater than `replicationFactor`.

                    If `distributeShardsLike` is set, the `writeConcern`
                    is that of the prototype collection.
                    For SatelliteCollections, the `writeConcern` is automatically controlled to
                    equal the number of DB-Servers and has a value of `0`.
                    Otherwise, the default value is controlled by the current database's
                    default `writeConcern`, which uses the `--cluster.write-concern`
                    startup option as default, which defaults to `1`. _(cluster only)_
                  type: integer
                shardingStrategy:
                  description: |
                    This attribute specifies the name of the sharding strategy to use for
                    the collection. There are different sharding strategies
                    to select from when creating a new collection. The selected `shardingStrategy`
                    value remains fixed for the collection and cannot be changed afterwards.
                    This is important to make the collection keep its sharding settings and
                    always find documents already distributed to shards using the same
                    initial sharding algorithm.

                    The available sharding strategies are:
                    - `community-compat`: default sharding used by ArangoDB
                      Community Edition before version 3.4
                    - `enterprise-compat`: default sharding used by ArangoDB
                      Enterprise Edition before version 3.4
                    - `enterprise-smart-edge-compat`: default sharding used by smart edge
                      collections in ArangoDB Enterprise Edition before version 3.4
                    - `hash`: default sharding used for new collections starting from version 3.4
                      (excluding smart edge collections)
                    - `enterprise-hash-smart-edge`: default sharding used for new
                      smart edge collections starting from version 3.4
                    - `enterprise-hex-smart-vertex`: sharding used for vertex collections of
                      EnterpriseGraphs

                    If no sharding strategy is specified, the default is `hash` for
                    all normal collections, `enterprise-hash-smart-edge` for all smart edge
                    collections, and `enterprise-hex-smart-vertex` for EnterpriseGraph
                    vertex collections (the latter two require the *Enterprise Edition* of ArangoDB).
                    Manually overriding the sharding strategy does not yet provide a
                    benefit, but it may later in case other sharding strategies are added.
                  type: string
                distributeShardsLike:
                  description: |
                    The name of another collection. If this property is set in a cluster, the
                    collection copies the `replicationFactor`, `numberOfShards`, `shardingStrategy`, and `writeConcern`
                    properties from the specified collection (referred to as the _prototype collection_)
                    and distributes the shards of this collection in the same way as the shards of
                    the other collection. In an Enterprise Edition cluster, this data co-location is
                    utilized to optimize queries.

                    You need to use the same number of `shardKeys` as the prototype collection, but
                    you can use different attributes.

                    {{</* info */>}}
                    Using this parameter has consequences for the prototype
                    collection. It can no longer be dropped, before the sharding-imitating
                    collections are dropped. Equally, backups and restores of imitating
                    collections alone generate warnings (which can be overridden)
                    about a missing sharding prototype.
                    {{</* /info */>}}
                  type: string
                  default: ""
                isSmart:
                  description: |
                    Whether the collection is for a SmartGraph or EnterpriseGraph
                    (Enterprise Edition only). This is an internal property.
                  type: boolean
                isDisjoint:
                  description: |
                    Whether the collection is for a Disjoint SmartGraph
                    (Enterprise Edition only). This is an internal property.
                  type: boolean
                smartGraphAttribute:
                  description: |
                    The attribute that is used for sharding: vertices with the same value of
                    this attribute are placed in the same shard. All vertices are required to
                    have this attribute set and it has to be a string. Edges derive the
                    attribute from their connected vertices.

                    This feature can only be used in the *Enterprise Edition*.
                  type: string
                smartJoinAttribute:
                  description: |
                    In an *Enterprise Edition* cluster, this attribute determines an attribute
                    of the collection that must contain the shard key value of the referred-to
                    SmartJoin collection. Additionally, the shard key for a document in this
                    collection must contain the value of this attribute, followed by a colon,
                    followed by the actual primary key of the document.

                    This feature can only be used in the *Enterprise Edition* and requires the
                    `distributeShardsLike` attribute of the collection to be set to the name
                    of another collection. It also requires the `shardKeys` attribute of the
                    collection to be set to a single shard key attribute, with an additional `:`
                    at the end.
                    A further restriction is that whenever documents are stored or updated in the
                    collection, the value stored in the `smartJoinAttribute` must be a string.
                  type: string
      responses:
        '200':
          description: |
            The collection has been created.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - name
                  - type
                  - status
                  - statusString
                  - isSystem
                  - id
                  - globallyUniqueId
                  - waitForSync
                  - keyOptions
                  - schema
                  - computedValues
                  - cacheEnabled
                  - syncByRevision
                  # Purposefully undocumented:
                  #   internalValidatorType (internal)
                  #   isSmartChild (internal)
                  #   minReplicationFactor (now writeConcern)
                  #   shadowCollections (internal)
                  #   usesRevisionsAsDocumentIds (internal)
                  # For backward compatibility:
                  #   status (legacy)
                  #   statusString (legacy)
                properties:
                  status:
                    description: |
                      The status of the collection (deprecated).
                      - `3`: loaded
                      - `5`: deleted

                      Every other status indicates a corrupted collection.
                    type: integer
                    example: 3
                  statusString:
                    description: |
                      The status of the collection as a descriptive string (deprecated).
                    type: string
                    enum: [loaded, deleted]
                    example: loaded
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  waitForSync:
                    description: |
                      If `true`, creating, changing, or removing
                      documents waits until the data has been synchronized to disk.
                    type: boolean
                  schema:
                    description: |
                      The configuration of the collection-level schema validation for documents.
                    type: object
                    required:
                      - rule
                      - level
                      - message
                      - type
                    properties:
                      rule:
                        description: |
                          A [JSON Schema](https://json-schema.org/specification-links#draft-4)
                          object (draft-4, without remote schemas).

                          See [Document Schema Validation](../../concepts/data-structure/documents/schema-validation.md)
                          for details.
                        type: object
                      level:
                        description: |
                          The level controls when the validation is triggered:
                          - `"none"`: The rule is inactive and validation thus turned off.
                          - `"new"`: Only newly inserted documents are validated.
                          - `"moderate"`: New and modified documents must pass validation,
                            except for modified documents where the OLD value did not pass
                            validation already. This level is useful if you have documents
                            which do not match your target structure, but you want to stop
                            the insertion of more invalid documents and prohibit that valid
                            documents are changed to invalid documents.
                          - `"strict"`: All new and modified document must strictly pass
                            validation. No exceptions are made.
                        type: string
                        enum: [none, new, moderate, strict]
                        default: strict
                      message:
                        description: |
                          The error message to raise if the schema validation fails
                          for a document.
                        type: string
                      type:
                        description: |
                          The schema validation type. Only JSON Schema is supported.
                        type: string
                        enum: [json]
                  computedValues:
                    description: |
                      A list of objects, each representing a computed value.
                    type: array
                    items:
                      type: object
                      required:
                        - name
                        - expression
                        - overwrite
                      properties:
                        name:
                          description: |
                            The name of the target attribute.
                          type: string
                        expression:
                          description: |
                            An AQL `RETURN` operation with an expression that computes the desired value.
                          type: string
                        overwrite:
                          description: |
                            Whether the computed value takes precedence over a user-provided or
                            existing attribute.
                          type: boolean
                        computeOn:
                          description: |
                            An array of strings that defines on which write operations the value is
                            computed.
                          type: array
                          uniqueItems: true
                          items:
                            type: string
                            enum: [insert, update, replace]
                          example: ["insert", "update", "replace"]
                        keepNull:
                          description: |
                            Whether the target attribute is set if the expression evaluates to `null`.
                          type: boolean
                        failOnWarning:
                          description: |
                            Whether the write operation fails if the expression produces a warning.
                          type: boolean
                  keyOptions:
                    description: |
                      An object which contains key generation options.
                    type: object
                    required:
                      - type
                      - allowUserKeys
                    properties:
                      type:
                        description: |
                          Specifies the type of the key generator.
                        type: string
                        enum: [traditional, autoincrement, uuid, padded]
                      allowUserKeys:
                        description: |
                          If set to `true`, then you are allowed to supply
                          own key values in the `_key` attribute of a document. If set to
                          `false`, then the key generator is solely responsible for
                          generating keys and an error is raised if you supply own key values in the
                          `_key` attribute of documents.

                          {{</* warning */>}}
                          You should not use both user-specified and automatically generated document keys
                          in the same collection in cluster deployments for collections with more than a
                          single shard. Mixing the two can lead to conflicts because Coordinators that
                          auto-generate keys in this case are not aware of all keys which are already used.
                          {{</* /warning */>}}
                        type: boolean
                      increment:
                        description: |
                          The increment value for the `autoincrement` key generator.
                          Not used by other key generator types.
                        type: integer
                      offset:
                        description: |
                          The initial offset value for the `autoincrement` key generator.
                          Not used by other key generator types.
                        type: integer
                      lastValue:
                        description: |
                          The offset value for the `autoincrement` or `padded` key generator.
                          This is an internal property for restoring dumps properly.
                        type: integer
                  cacheEnabled:
                    description: |
                      Whether the in-memory hash cache for documents is enabled for this
                      collection.
                    type: boolean
                  numberOfShards:
                    description: |
                      The number of shards of the collection. _(cluster only)_
                    type: integer
                  shardKeys:
                    description: |
                      Contains the names of document attributes that are used to
                      determine the target shard for documents. _(cluster only)_
                    type: array
                    items:
                      type: string
                  replicationFactor:
                    description: |
                      Contains how many copies of each shard are kept on different DB-Servers.
                      It is an integer number in the range of 1-10 or the string `"satellite"`
                      for SatelliteCollections (Enterprise Edition only). _(cluster only)_
                    type: integer
                  writeConcern:
                    description: |
                      Determines how many copies of each shard are required to be
                      in-sync on the different DB-Servers. If there are less than these many copies
                      in the cluster, a shard refuses to write. Writes to shards with enough
                      up-to-date copies succeed at the same time, however. The value of
                      `writeConcern` cannot be greater than `replicationFactor`.

                      If `distributeShardsLike` is set, the `writeConcern`
                      is that of the prototype collection.
                      For SatelliteCollections, the `writeConcern` is automatically controlled to
                      equal the number of DB-Servers and has a value of `0`.
                      Otherwise, the default value is controlled by the current database's
                      default `writeConcern`, which uses the `--cluster.write-concern`
                      startup option as default, which defaults to `1`. _(cluster only)_
                    type: integer
                  shardingStrategy:
                    description: |
                      The sharding strategy selected for the collection. _(cluster only)_
                    type: string
                    enum:
                      - community-compat
                      - enterprise-compat
                      - enterprise-smart-edge-compat
                      - hash
                      - enterprise-hash-smart-edge
                      - enterprise-hex-smart-vertex
                  distributeShardsLike:
                    description: |
                      The name of another collection. This collection uses the `replicationFactor`,
                      `numberOfShards`, `shardingStrategy`, and `writeConcern` properties of the other collection and
                      the shards of this collection are distributed in the same way as the shards of
                      the other collection.
                    type: string
                  isSmart:
                    description: |
                      Whether the collection is used in a SmartGraph or EnterpriseGraph (Enterprise Edition only).
                      This is an internal property. _(cluster only)_
                    type: boolean
                  isDisjoint:
                    description: |
                      Whether the SmartGraph or EnterpriseGraph this collection belongs to is disjoint
                      (Enterprise Edition only). This is an internal property. _(cluster only)_
                    type: boolean
                  smartGraphAttribute:
                    description: |
                      The attribute that is used for sharding: vertices with the same value of
                      this attribute are placed in the same shard. All vertices are required to
                      have this attribute set and it has to be a string. Edges derive the
                      attribute from their connected vertices (Enterprise Edition only). _(cluster only)_
                    type: string
                  smartJoinAttribute:
                    description: |
                      Determines an attribute of the collection that must contain the shard key value
                      of the referred-to SmartJoin collection (Enterprise Edition only). _(cluster only)_
                    type: string
                  name:
                    description: |
                      The name of this collection.
                    type: string
                  id:
                    description: |
                      A unique identifier of the collection (deprecated).
                    type: string
                  type:
                    description: |
                      The type of the collection:
                        - `0`: "unknown"
                        - `2`: regular document collection
                        - `3`: edge collection
                    type: integer
                  isSystem:
                    description: |
                      Whether the collection is a system collection. Collection names that starts with
                      an underscore are usually system collections.
                    type: boolean
                  syncByRevision:
                    description: |
                      Whether the newer revision-based replication protocol is
                      enabled for this collection. This is an internal property.
                    type: boolean
                  globallyUniqueId:
                    description: |
                      A unique identifier of the collection. This is an internal property.
                    type: string
        '400':
          description: |
            The `name` or another required attribute is missing or an attribute
            has an invalid value.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Collections
```

**Examples**

```curl
---
description: ''
name: RestCollectionCreateCollection
---
var url = "/_api/collection";
var body = {
  name: "testCollectionBasics"
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 200);

logJsonResponse(response);
body = {
  name: "testCollectionEdges",
  type : 3
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 200);
logJsonResponse(response);

db._flushCache();
db._drop("testCollectionBasics");
db._drop("testCollectionEdges");
```

```curl
---
description: ''
name: RestCollectionCreateKeyopt
---
var url = "/_api/collection";
var body = {
  name: "testCollectionUsers",
  keyOptions : {
    type : "autoincrement",
    increment : 5,
    allowUserKeys : true
  }
};

var response = logCurlRequest('POST', url, body);

assert(response.code === 200);
logJsonResponse(response);

db._flushCache();
db._drop("testCollectionUsers");
```

### Drop a collection

```openapi
paths:
  /_db/{database-name}/_api/collection/{collection-name}:
    delete:
      operationId: deleteCollection
      description: |
        Delete the collection identified by `collection-name` and all its documents.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: collection-name
          in: path
          required: true
          description: |
            The name of the collection to drop.

            {{</* warning */>}}
            Accessing collections by their numeric ID is deprecated from version 3.4.0 on.
            You should reference them via their names instead.
            {{</* /warning */>}}
          schema:
            type: string
        - name: isSystem
          in: query
          required: false
          description: |
            Whether the collection to drop is a system collection. This parameter
            must be set to `true` in order to drop a system collection.
          schema:
            type: boolean
            default: false
      responses:
        '200':
          description: |
            Dropping the collection has been successful.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - id
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  id:
                    description: |
                      The identifier of the dropped collection.
                    type: string
        '400':
          description: |
            The `collection-name` parameter is missing.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A collection called `collection-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Collections
```

**Examples**

```curl
---
description: |-
  Using an identifier:
name: RestCollectionDeleteCollectionIdentifier
---
var cn = "products1";
var coll = db._create(cn, { waitForSync: true });
var url = "/_api/collection/"+ coll._id;

var response = logCurlRequest('DELETE', url);
db[cn] = undefined;

assert(response.code === 200);

logJsonResponse(response);
```

```curl
---
description: |-
  Using a name:
name: RestCollectionDeleteCollectionName
---
var cn = "products1";
db._drop(cn);
db._create(cn);
var url = "/_api/collection/products1";

var response = logCurlRequest('DELETE', url);
db[cn] = undefined;

assert(response.code === 200);

logJsonResponse(response);
```

```curl
---
description: |-
  Dropping a system collection
name: RestCollectionDeleteCollectionSystem
---
var cn = "_example";
db._drop(cn, { isSystem: true });
db._create(cn, { isSystem: true });
var url = "/_api/collection/_example?isSystem=true";

var response = logCurlRequest('DELETE', url);
db[cn] = undefined;

assert(response.code === 200);

logJsonResponse(response);
```

### Truncate a collection

```openapi
paths:
  /_db/{database-name}/_api/collection/{collection-name}/truncate:
    put:
      operationId: truncateCollection
      description: |
        Removes all documents from the collection, but leaves the indexes intact.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: collection-name
          in: path
          required: true
          description: |
            The name of the collection.

            {{</* warning */>}}
            Accessing collections by their numeric ID is deprecated from version 3.4.0 on.
            You should reference them via their names instead.
            {{</* /warning */>}}
          schema:
            type: string
        - name: waitForSync
          in: query
          required: false
          description: |
            If set to `true`, the data is synchronized to disk before returning from the
            truncate operation.
          schema:
            type: boolean
            default: false
        - name: compact
          in: query
          required: false
          description: |
            If set to `true`, the storage engine is told to start a compaction
            in order to free up disk space. This can be resource intensive. If the only
            intention is to start over with an empty collection, specify `false`.
          schema:
            type: boolean
            default: true
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
            Truncating the collection was successful.
            Returns the basic information about the collection.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - id
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  id:
                    description: |
                      A unique identifier of the collection (deprecated).
                    type: string
        '400':
          description: |
            The `collection-name` parameter is missing.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            The collection cannot be found.

            This error also occurs if you try to run this operation as part of a
            Stream Transaction but the transaction ID specified in the
            `x-arango-trx-id` header is unknown to the server.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '410':
          description: |
            This error occurs if you try to run this operation as part of a
            Stream Transaction that has just been canceled or timed out.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 410
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Collections
```

**Examples**

```curl
---
description: ''
name: RestCollectionIdentifierTruncate
---
var cn = "products";
db._drop(cn);
var coll = db._create(cn, { waitForSync: true });
var url = "/_api/collection/"+ coll.name() + "/truncate";

var response = logCurlRequest('PUT', url, '');

assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```

## Modify collections

### Change the properties of a collection

```openapi
paths:
  /_db/{database-name}/_api/collection/{collection-name}/properties:
    put:
      operationId: updateCollectionProperties
      description: |
        Changes the properties of a collection. Only the provided attributes are
        updated. Collection properties **cannot be changed** once a collection is
        created except for the listed properties, as well as the collection name via
        the rename endpoint (but not in clusters).
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: collection-name
          in: path
          required: true
          description: |
            The name of the collection.

            {{</* warning */>}}
            Accessing collections by their numeric ID is deprecated from version 3.4.0 on.
            You should reference them via their names instead.
            {{</* /warning */>}}
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                waitForSync:
                  description: |
                    If set to `true`, the data is synchronized to disk before returning from a
                    document create, update, replace or removal operation.
                  type: boolean
                cacheEnabled:
                  description: |
                    Whether the in-memory hash cache for documents should be enabled for this
                    collection. Can be controlled globally with the `--cache.size`
                    startup option. The cache can speed up repeated reads of the same documents via
                    their document keys. If the same documents are not fetched often or are
                    modified frequently, then you may disable the cache to avoid the maintenance
                    costs.
                  type: boolean
                schema:
                  description: |
                    The configuration of the collection-level schema validation for documents.
                  type: object
                  required:
                    - rule
                  properties:
                    rule:
                      description: |
                        A [JSON Schema](https://json-schema.org/specification-links#draft-4)
                        object (draft-4, without remote schemas).

                        See [Document Schema Validation](../../concepts/data-structure/documents/schema-validation.md)
                        for details.
                      type: object
                    level:
                      description: |
                        The level controls when the validation is triggered:
                        - `"none"`: The rule is inactive and validation thus turned off.
                        - `"new"`: Only newly inserted documents are validated.
                        - `"moderate"`: New and modified documents must pass validation,
                          except for modified documents where the OLD value did not pass
                          validation already. This level is useful if you have documents
                          which do not match your target structure, but you want to stop
                          the insertion of more invalid documents and prohibit that valid
                          documents are changed to invalid documents.
                        - `"strict"`: All new and modified document must strictly pass
                          validation. No exceptions are made.
                      type: string
                      enum: [none, new, moderate, strict]
                      default: strict
                    message:
                      description: |
                        The error message to raise if the schema validation fails
                        for a document.
                      type: string
                computedValues:
                  description: |
                    An optional list of objects, each representing a computed value.
                  type: array
                  items:
                    type: object
                    required:
                      - name
                      - expression
                      - overwrite
                    properties:
                      name:
                        description: |
                          The name of the target attribute. Can only be a top-level attribute, but you
                          may return a nested object. Cannot be `_key`, `_id`, `_rev`, `_from`, `_to`,
                          or a shard key attribute.
                        type: string
                      expression:
                        description: |
                          An AQL `RETURN` operation with an expression that computes the desired value.
                          See [Computed Value Expressions](../../concepts/data-structure/documents/computed-values.md#computed-value-expressions) for details.
                        type: string
                      overwrite:
                        description: |
                          Whether the computed value shall take precedence over a user-provided or
                          existing attribute.
                        type: boolean
                      computeOn:
                        description: |
                          An array of strings to define on which write operations the value shall be
                          computed.
                        type: array
                        uniqueItems: true
                        items:
                          type: string
                          enum: [insert, update, replace]
                        example: ["insert", "update", "replace"]
                      keepNull:
                        description: |
                          Whether the target attribute shall be set if the expression evaluates to `null`.
                          You can set the option to `false` to not set (or unset) the target attribute if
                          the expression returns `null`.
                        type: boolean
                        default: true
                      failOnWarning:
                        description: |
                          Whether to let the write operation fail if the expression produces a warning.
                        type: boolean
                        default: false
                replicationFactor:
                  description: |
                    In a cluster, this attribute determines how many copies
                    of each shard are kept on different DB-Servers. The value 1 means that only one
                    copy (no synchronous replication) is kept. A value of k means that k-1 replicas
                    are kept. For SatelliteCollections, it needs to be the string `"satellite"`,
                    which matches the replication factor to the number of DB-Servers
                    (Enterprise Edition only).

                    Any two copies reside on different DB-Servers. Replication between them is
                    synchronous, that is, every write operation to the "leader" copy will be replicated
                    to all "follower" replicas, before the write operation is reported successful.

                    If a server fails, this is detected automatically and one of the servers holding
                    copies take over, usually without an error being reported.
                  type: integer
                writeConcern:
                  description: |
                    Determines how many copies of each shard are required to be
                    in sync on the different DB-Servers. If there are less than these many copies
                    in the cluster, a shard refuses to write. Writes to shards with enough
                    up-to-date copies succeed at the same time, however. The value of
                    `writeConcern` cannot be greater than `replicationFactor`.

                    If `distributeShardsLike` is set, the `writeConcern`
                    is that of the prototype collection.
                    For SatelliteCollections, the `writeConcern` is automatically controlled to
                    equal the number of DB-Servers and has a value of `0`.
                    Otherwise, the default value is controlled by the current database's
                    default `writeConcern`, which uses the `--cluster.write-concern`
                    startup option as default, which defaults to `1`. _(cluster only)_
                  type: integer
      responses:
        '200':
          description: |
            The collection has been updated successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - name
                  - type
                  - status
                  - statusString
                  - isSystem
                  - id
                  - globallyUniqueId
                  - waitForSync
                  - keyOptions
                  - schema
                  - computedValues
                  - cacheEnabled
                  - syncByRevision
                  # Purposefully undocumented:
                  #   internalValidatorType (internal)
                  #   isSmartChild (internal)
                  #   minReplicationFactor (now writeConcern)
                  #   shadowCollections (internal)
                  #   usesRevisionsAsDocumentIds (internal)
                  # For backward compatibility:
                  #   status (legacy)
                  #   statusString (legacy)
                properties:
                  status:
                    description: |
                      The status of the collection (deprecated).
                      - `3`: loaded
                      - `5`: deleted

                      Every other status indicates a corrupted collection.
                    type: integer
                    example: 3
                  statusString:
                    description: |
                      The status of the collection as a descriptive string (deprecated).
                    type: string
                    enum: [loaded, deleted]
                    example: loaded
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  waitForSync:
                    description: |
                      If `true`, creating, changing, or removing
                      documents waits until the data has been synchronized to disk.
                    type: boolean
                  schema:
                    description: |
                      The configuration of the collection-level schema validation for documents.
                    type: object
                    required:
                      - rule
                      - level
                      - message
                      - type
                    properties:
                      rule:
                        description: |
                          A [JSON Schema](https://json-schema.org/specification-links#draft-4)
                          object (draft-4, without remote schemas).

                          See [Document Schema Validation](../../concepts/data-structure/documents/schema-validation.md)
                          for details.
                        type: object
                      level:
                        description: |
                          The level controls when the validation is triggered:
                          - `"none"`: The rule is inactive and validation thus turned off.
                          - `"new"`: Only newly inserted documents are validated.
                          - `"moderate"`: New and modified documents must pass validation,
                            except for modified documents where the OLD value did not pass
                            validation already. This level is useful if you have documents
                            which do not match your target structure, but you want to stop
                            the insertion of more invalid documents and prohibit that valid
                            documents are changed to invalid documents.
                          - `"strict"`: All new and modified document must strictly pass
                            validation. No exceptions are made.
                        type: string
                        enum: [none, new, moderate, strict]
                        default: strict
                      message:
                        description: |
                          The error message to raise if the schema validation fails
                          for a document.
                        type: string
                      type:
                        description: |
                          The schema validation type. Only JSON Schema is supported.
                        type: string
                        enum: [json]
                  computedValues:
                    description: |
                      A list of objects, each representing a computed value.
                    type: array
                    items:
                      type: object
                      required:
                        - name
                        - expression
                        - overwrite
                      properties:
                        name:
                          description: |
                            The name of the target attribute.
                          type: string
                        expression:
                          description: |
                            An AQL `RETURN` operation with an expression that computes the desired value.
                          type: string
                        overwrite:
                          description: |
                            Whether the computed value takes precedence over a user-provided or
                            existing attribute.
                          type: boolean
                        computeOn:
                          description: |
                            An array of strings that defines on which write operations the value is
                            computed.
                          type: array
                          uniqueItems: true
                          items:
                            type: string
                            enum: [insert, update, replace]
                          example: ["insert", "update", "replace"]
                        keepNull:
                          description: |
                            Whether the target attribute is set if the expression evaluates to `null`.
                          type: boolean
                        failOnWarning:
                          description: |
                            Whether the write operation fails if the expression produces a warning.
                          type: boolean
                  keyOptions:
                    description: |
                      An object which contains key generation options.
                    type: object
                    required:
                      - type
                      - allowUserKeys
                    properties:
                      type:
                        description: |
                          Specifies the type of the key generator.
                        type: string
                        enum: [traditional, autoincrement, uuid, padded]
                      allowUserKeys:
                        description: |
                          If set to `true`, then you are allowed to supply
                          own key values in the `_key` attribute of a document. If set to
                          `false`, then the key generator is solely responsible for
                          generating keys and an error is raised if you supply own key values in the
                          `_key` attribute of documents.

                          {{</* warning */>}}
                          You should not use both user-specified and automatically generated document keys
                          in the same collection in cluster deployments for collections with more than a
                          single shard. Mixing the two can lead to conflicts because Coordinators that
                          auto-generate keys in this case are not aware of all keys which are already used.
                          {{</* /warning */>}}
                        type: boolean
                      increment:
                        description: |
                          The increment value for the `autoincrement` key generator.
                          Not used by other key generator types.
                        type: integer
                      offset:
                        description: |
                          The initial offset value for the `autoincrement` key generator.
                          Not used by other key generator types.
                        type: integer
                      lastValue:
                        description: |
                          The offset value of the `autoincrement` or `padded` key generator.
                          This is an internal property for restoring dumps properly.
                        type: integer
                  cacheEnabled:
                    description: |
                      Whether the in-memory hash cache for documents is enabled for this
                      collection.
                    type: boolean
                  numberOfShards:
                    description: |
                      The number of shards of the collection. _(cluster only)_
                    type: integer
                  shardKeys:
                    description: |
                      Contains the names of document attributes that are used to
                      determine the target shard for documents. _(cluster only)_
                    type: array
                    items:
                      type: string
                  replicationFactor:
                    description: |
                      Contains how many copies of each shard are kept on different DB-Servers.
                      It is an integer number in the range of 1-10 or the string `"satellite"`
                      for SatelliteCollections (Enterprise Edition only). _(cluster only)_
                    type: integer
                  writeConcern:
                    description: |
                      Determines how many copies of each shard are required to be
                      in-sync on the different DB-Servers. If there are less than these many copies
                      in the cluster, a shard refuses to write. Writes to shards with enough
                      up-to-date copies succeed at the same time, however. The value of
                      `writeConcern` cannot be greater than `replicationFactor`.

                      If `distributeShardsLike` is set, the `writeConcern`
                      is that of the prototype collection.
                      For SatelliteCollections, the `writeConcern` is automatically controlled to
                      equal the number of DB-Servers and has a value of `0`.
                      Otherwise, the default value is controlled by the current database's
                      default `writeConcern`, which uses the `--cluster.write-concern`
                      startup option as default, which defaults to `1`. _(cluster only)_
                    type: integer
                  shardingStrategy:
                    description: |
                      The sharding strategy selected for the collection. _(cluster only)_
                    type: string
                    enum:
                      - community-compat
                      - enterprise-compat
                      - enterprise-smart-edge-compat
                      - hash
                      - enterprise-hash-smart-edge
                      - enterprise-hex-smart-vertex
                  distributeShardsLike:
                    description: |
                      The name of another collection. This collection uses the `replicationFactor`,
                      `numberOfShards`, `shardingStrategy`, and `writeConcern` properties of the other collection and
                      the shards of this collection are distributed in the same way as the shards of
                      the other collection.
                    type: string
                  isSmart:
                    description: |
                      Whether the collection is used in a SmartGraph or EnterpriseGraph (Enterprise Edition only).
                      This is an internal property. _(cluster only)_
                    type: boolean
                  isDisjoint:
                    description: |
                      Whether the SmartGraph or EnterpriseGraph this collection belongs to is disjoint
                      (Enterprise Edition only). This is an internal property. _(cluster only)_
                    type: boolean
                  smartGraphAttribute:
                    description: |
                      The attribute that is used for sharding: vertices with the same value of
                      this attribute are placed in the same shard. All vertices are required to
                      have this attribute set and it has to be a string. Edges derive the
                      attribute from their connected vertices (Enterprise Edition only). _(cluster only)_
                    type: string
                  smartJoinAttribute:
                    description: |
                      Determines an attribute of the collection that must contain the shard key value
                      of the referred-to SmartJoin collection (Enterprise Edition only). _(cluster only)_
                    type: string
                  name:
                    description: |
                      The name of this collection.
                    type: string
                  id:
                    description: |
                      A unique identifier of the collection (deprecated).
                    type: string
                  type:
                    description: |
                      The type of the collection:
                        - `0`: "unknown"
                        - `2`: regular document collection
                        - `3`: edge collection
                    type: integer
                  isSystem:
                    description: |
                      Whether the collection is a system collection. Collection names that starts with
                      an underscore are usually system collections.
                    type: boolean
                  syncByRevision:
                    description: |
                      Whether the newer revision-based replication protocol is
                      enabled for this collection. This is an internal property.
                    type: boolean
                  globallyUniqueId:
                    description: |
                      A unique identifier of the collection. This is an internal property.
                    type: string
        '400':
          description: |
            The `collection-name` parameter is missing.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A collection called `collection-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Collections
```

**Examples**

```curl
---
description: ''
name: RestCollectionIdentifierPropertiesSync
---
var cn = "products";
db._drop(cn);
var coll = db._create(cn, { waitForSync: true });
var url = "/_api/collection/"+ coll.name() + "/properties";

var response = logCurlRequest('PUT', url, {"waitForSync" : true });

assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```

### Load collection indexes into memory

```openapi
paths:
  /_db/{database-name}/_api/collection/{collection-name}/loadIndexesIntoMemory:
    put:
      operationId: loadCollectionIndexes
      description: |
        You can call this endpoint to try to cache this collection's index entries in
        the main memory. Index lookups served from the memory cache can be much faster
        than lookups not stored in the cache, resulting in a performance boost.

        The endpoint iterates over suitable indexes of the collection and stores the
        indexed values (not the entire document data) in memory. This is implemented for
        edge indexes only.

        The endpoint returns as soon as the index warmup has been scheduled. The index
        warmup may still be ongoing in the background, even after the return value has
        already been sent. As all suitable indexes are scanned, it may cause significant
        I/O activity and background load.

        This feature honors memory limits. If the indexes you want to load are smaller
        than your memory limit, this feature guarantees that most index values are
        cached. If the index is greater than your memory limit, this feature fills
        up values up to this limit. You cannot control which indexes of the collection
        should have priority over others.

        It is guaranteed that the in-memory cache data is consistent with the stored
        index data at all times.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: collection-name
          in: path
          required: true
          description: |
            The name of the collection.

            {{</* warning */>}}
            Accessing collections by their numeric ID is deprecated from version 3.4.0 on.
            You should reference them via their names instead.
            {{</* /warning */>}}
          schema:
            type: string
      responses:
        '200':
          description: |
            The index loading has been scheduled for all suitable indexes.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - result
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  result:
                    description: |
                      The value `true`.
                    type: boolean
                    example: true
        '400':
          description: |
            The `collection-name` parameter is missing.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A collection called `collection-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Collections
```

**Examples**

```curl
---
description: ''
name: RestCollectionIdentifierLoadIndexesIntoMemory
---
var cn = "products";
db._drop(cn);
var coll = db._create(cn);
var url = "/_api/collection/"+ coll.name() + "/loadIndexesIntoMemory";

var response = logCurlRequest('PUT', url, '');

assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```

### Rename a collection

```openapi
paths:
  /_db/{database-name}/_api/collection/{collection-name}/rename:
    put:
      operationId: renameCollection
      description: |
        Renames a collection.

        {{</* info */>}}
        Renaming collections is not supported in cluster deployments.
        {{</* /info */>}}

        If renaming the collection succeeds, then the collection is also renamed in
        all graph definitions inside the `_graphs` collection in the current database.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: collection-name
          in: path
          required: true
          description: |
            The name of the collection to rename.

            {{</* warning */>}}
            Accessing collections by their numeric ID is deprecated from version 3.4.0 on.
            You should reference them via their names instead.
            {{</* /warning */>}}
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - name
              properties:
                name:
                  description: |
                    The new collection name.
                  type: string
      responses:
        '200':
          description: |
            The collection has been renamed successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - name
                  - type
                  - status
                  - statusString
                  - isSystem
                  - id
                  - globallyUniqueId
                  - waitForSync
                  - keyOptions
                  - schema
                  - computedValues
                  - cacheEnabled
                  - syncByRevision
                  # Purposefully undocumented:
                  #   internalValidatorType (internal)
                  #   isSmartChild (internal)
                  #   minReplicationFactor (now writeConcern)
                  #   shadowCollections (internal)
                  #   usesRevisionsAsDocumentIds (internal)
                  # For backward compatibility:
                  #   status (legacy)
                  #   statusString (legacy)
                properties:
                  status:
                    description: |
                      The status of the collection (deprecated).
                      - `3`: loaded
                      - `5`: deleted

                      Every other status indicates a corrupted collection.
                    type: integer
                    example: 3
                  statusString:
                    description: |
                      The status of the collection as a descriptive string (deprecated).
                    type: string
                    enum: [loaded, deleted]
                    example: loaded
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  waitForSync:
                    description: |
                      If `true`, creating, changing, or removing
                      documents waits until the data has been synchronized to disk.
                    type: boolean
                  schema:
                    description: |
                      The configuration of the collection-level schema validation for documents.
                    type: object
                    required:
                      - rule
                      - level
                      - message
                      - type
                    properties:
                      rule:
                        description: |
                          A [JSON Schema](https://json-schema.org/specification-links#draft-4)
                          object (draft-4, without remote schemas).

                          See [Document Schema Validation](../../concepts/data-structure/documents/schema-validation.md)
                          for details.
                        type: object
                      level:
                        description: |
                          The level controls when the validation is triggered:
                          - `"none"`: The rule is inactive and validation thus turned off.
                          - `"new"`: Only newly inserted documents are validated.
                          - `"moderate"`: New and modified documents must pass validation,
                            except for modified documents where the OLD value did not pass
                            validation already. This level is useful if you have documents
                            which do not match your target structure, but you want to stop
                            the insertion of more invalid documents and prohibit that valid
                            documents are changed to invalid documents.
                          - `"strict"`: All new and modified document must strictly pass
                            validation. No exceptions are made.
                        type: string
                        enum: [none, new, moderate, strict]
                        default: strict
                      message:
                        description: |
                          The error message to raise if the schema validation fails
                          for a document.
                        type: string
                      type:
                        description: |
                          The schema validation type. Only JSON Schema is supported.
                        type: string
                        enum: [json]
                  computedValues:
                    description: |
                      A list of objects, each representing a computed value.
                    type: array
                    items:
                      type: object
                      required:
                        - name
                        - expression
                        - overwrite
                      properties:
                        name:
                          description: |
                            The name of the target attribute.
                          type: string
                        expression:
                          description: |
                            An AQL `RETURN` operation with an expression that computes the desired value.
                          type: string
                        overwrite:
                          description: |
                            Whether the computed value takes precedence over a user-provided or
                            existing attribute.
                          type: boolean
                        computeOn:
                          description: |
                            An array of strings that defines on which write operations the value is
                            computed.
                          type: array
                          uniqueItems: true
                          items:
                            type: string
                            enum: [insert, update, replace]
                          example: ["insert", "update", "replace"]
                        keepNull:
                          description: |
                            Whether the target attribute is set if the expression evaluates to `null`.
                          type: boolean
                        failOnWarning:
                          description: |
                            Whether the write operation fails if the expression produces a warning.
                          type: boolean
                  keyOptions:
                    description: |
                      An object which contains key generation options.
                    type: object
                    required:
                      - type
                      - allowUserKeys
                    properties:
                      type:
                        description: |
                          Specifies the type of the key generator.
                        type: string
                        enum: [traditional, autoincrement, uuid, padded]
                      allowUserKeys:
                        description: |
                          If set to `true`, then you are allowed to supply
                          own key values in the `_key` attribute of a document. If set to
                          `false`, then the key generator is solely responsible for
                          generating keys and an error is raised if you supply own key values in the
                          `_key` attribute of documents.

                          {{</* warning */>}}
                          You should not use both user-specified and automatically generated document keys
                          in the same collection in cluster deployments for collections with more than a
                          single shard. Mixing the two can lead to conflicts because Coordinators that
                          auto-generate keys in this case are not aware of all keys which are already used.
                          {{</* /warning */>}}
                        type: boolean
                      increment:
                        description: |
                          The increment value for the `autoincrement` key generator.
                          Not used by other key generator types.
                        type: integer
                      offset:
                        description: |
                          The initial offset value for the `autoincrement` key generator.
                          Not used by other key generator types.
                        type: integer
                      lastValue:
                        description: |
                          The offset value of the `autoincrement` or `padded` key generator.
                          This is an internal property for restoring dumps properly.
                        type: integer
                  cacheEnabled:
                    description: |
                      Whether the in-memory hash cache for documents is enabled for this
                      collection.
                    type: boolean
                  numberOfShards:
                    description: |
                      The number of shards of the collection. _(cluster only)_
                    type: integer
                  shardKeys:
                    description: |
                      Contains the names of document attributes that are used to
                      determine the target shard for documents. _(cluster only)_
                    type: array
                    items:
                      type: string
                  replicationFactor:
                    description: |
                      Contains how many copies of each shard are kept on different DB-Servers.
                      It is an integer number in the range of 1-10 or the string `"satellite"`
                      for SatelliteCollections (Enterprise Edition only). _(cluster only)_
                    type: integer
                  writeConcern:
                    description: |
                      Determines how many copies of each shard are required to be
                      in-sync on the different DB-Servers. If there are less than these many copies
                      in the cluster, a shard refuses to write. Writes to shards with enough
                      up-to-date copies succeed at the same time, however. The value of
                      `writeConcern` cannot be greater than `replicationFactor`.

                      If `distributeShardsLike` is set, the default `writeConcern`
                      is that of the prototype collection.
                      For SatelliteCollections, the `writeConcern` is automatically controlled to
                      equal the number of DB-Servers and has a value of `0`.
                      Otherwise, the default value is controlled by the current database's
                      default `writeConcern`, which uses the `--cluster.write-concern`
                      startup option as default, which defaults to `1`. _(cluster only)_
                    type: integer
                  shardingStrategy:
                    description: |
                      The sharding strategy selected for the collection. _(cluster only)_
                    type: string
                    enum:
                      - community-compat
                      - enterprise-compat
                      - enterprise-smart-edge-compat
                      - hash
                      - enterprise-hash-smart-edge
                      - enterprise-hex-smart-vertex
                  distributeShardsLike:
                    description: |
                      The name of another collection. This collection uses the `replicationFactor`,
                      `numberOfShards` and `shardingStrategy` properties of the other collection and
                      the shards of this collection are distributed in the same way as the shards of
                      the other collection.
                    type: string
                  isSmart:
                    description: |
                      Whether the collection is used in a SmartGraph or EnterpriseGraph (Enterprise Edition only).
                      This is an internal property. _(cluster only)_
                    type: boolean
                  isDisjoint:
                    description: |
                      Whether the SmartGraph or EnterpriseGraph this collection belongs to is disjoint
                      (Enterprise Edition only). This is an internal property. _(cluster only)_
                    type: boolean
                  smartGraphAttribute:
                    description: |
                      The attribute that is used for sharding: vertices with the same value of
                      this attribute are placed in the same shard. All vertices are required to
                      have this attribute set and it has to be a string. Edges derive the
                      attribute from their connected vertices (Enterprise Edition only). _(cluster only)_
                    type: string
                  smartJoinAttribute:
                    description: |
                      Determines an attribute of the collection that must contain the shard key value
                      of the referred-to SmartJoin collection (Enterprise Edition only). _(cluster only)_
                    type: string
                  name:
                    description: |
                      The name of this collection.
                    type: string
                    example: coll
                  id:
                    description: |
                      A unique identifier of the collection (deprecated).
                    type: string
                  type:
                    description: |
                      The type of the collection:
                      - `0`: "unknown"
                      - `2`: regular document collection
                      - `3`: edge collection
                    type: integer
                    example: 2
                  isSystem:
                    description: |
                      Whether the collection is a system collection. Collection names that starts with
                      an underscore are usually system collections.
                    type: boolean
                    example: false
                  syncByRevision:
                    description: |
                      Whether the newer revision-based replication protocol is
                      enabled for this collection. This is an internal property.
                    type: boolean
                  globallyUniqueId:
                    description: |
                      A unique identifier of the collection. This is an internal property.
                    type: string
        '400':
          description: |
            The `collection-name` parameter or the `name` attribute is missing.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A collection called `collection-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Collections
```

**Examples**

```curl
---
description: ''
name: RestCollectionIdentifierRename
---
var cn = "products1";
var cnn = "newname";
db._drop(cn);
db._drop(cnn);
var coll = db._create(cn);
var url = "/_api/collection/" + coll.name() + "/rename";

var response = logCurlRequest('PUT', url, { name: cnn });

assert(response.code === 200);
db._flushCache();
db._drop(cnn);

logJsonResponse(response);
```

### Recalculate the document count of a collection

```openapi
paths:
  /_db/{database-name}/_api/collection/{collection-name}/recalculateCount:
    put:
      operationId: recalculateCollectionCount
      description: |
        Recalculates the document count of a collection, if it ever becomes inconsistent.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: collection-name
          in: path
          required: true
          description: |
            The name of the collection.
          schema:
            type: string
      responses:
        '200':
          description: |
            The document count has been recalculated successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - result
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  result:
                    type: boolean
                    example: true
                  count:
                    description: |
                      The recalculated document count.
                      This attribute is not present when using a cluster.
                    type: integer
        '400':
          description: |
            The `collection-name` parameter is missing.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A collection called `collection-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Collections
```

### Compact a collection

```openapi
paths:
  /_db/{database-name}/_api/collection/{collection-name}/compact:
    put:
      operationId: compactCollection
      description: |
        Compacts the data of a collection in order to reclaim disk space.
        The operation will compact the document and index data by rewriting the
        underlying .sst files and only keeping the relevant entries.

        Under normal circumstances, running a compact operation is not necessary, as
        the collection data will eventually get compacted anyway. However, in some
        situations, e.g. after running lots of update/replace or remove operations,
        the disk data for a collection may contain a lot of outdated data for which the
        space shall be reclaimed. In this case the compaction operation can be used.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: collection-name
          in: path
          required: true
          description: |
            Name of the collection to compact
          schema:
            type: string
      responses:
        '200':
          description: |
            The compaction has been started successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - name
                  - type
                  - isSystem
                  - status
                  - id
                  - globallyUniqueId
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  name:
                    description: |
                      The name of the collection.
                    type: string
                    example: coll
                  type:
                    description: |
                      The type of the collection:
                      - `0`: "unknown"
                      - `2`: regular document collection
                      - `3`: edge collection
                    type: integer
                    example: 2
                  isSystem:
                    description: |
                      Whether the collection is a system collection. Collection names that starts with
                      an underscore are usually system collections.
                    type: boolean
                    example: false
                  status:
                    description: |
                      The status of the collection.
                      - `3`: loaded
                      - `5`: deleted

                      Every other status indicates a corrupted collection.
                    type: integer
                    example: 3
                  id:
                    description: |
                      A unique identifier of the collection (deprecated).
                    type: string
                  globallyUniqueId:
                    description: |
                      A unique identifier of the collection. This is an internal property.
                    type: string
        '401':
          description: |
            If the request was not authenticated as a user with sufficient rights.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 401
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Collections
```

**Examples**

```curl
---
description: ''
name: RestApiCollectionCompact
---
var cn = "testCollection";
db._drop(cn);
db._create(cn);

var response = logCurlRequest('PUT', '/_api/collection/' + cn + '/compact', '');

assert(response.code === 200);

logJsonResponse(response);

db._drop(cn);
```

### Load a collection

```openapi
paths:
  /_db/{database-name}/_api/collection/{collection-name}/load:
    put:
      operationId: loadCollection
      description: |
        {{</* warning */>}}
        The load function is deprecated from version 3.8.0 onwards and is a no-op
        from version 3.9.0 onwards. It should no longer be used, as it may be removed
        in a future version of ArangoDB.
        {{</* /warning */>}}

        Since ArangoDB version 3.9.0 this API does nothing. Previously, it used to
        load a collection into memory.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: collection-name
          in: path
          required: true
          description: |
            The name of the collection.

            {{</* warning */>}}
            Accessing collections by their numeric ID is deprecated from version 3.4.0 on.
            You should reference them via their names instead.
            {{</* /warning */>}}
          schema:
            type: string
      responses:
        '200':
          description: |
            Returns the basic collection properties for compatibility reasons.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - name
                  - type
                  - isSystem
                  - status
                  - id
                  - globallyUniqueId
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  name:
                    description: |
                      The name of the collection.
                    type: string
                    example: coll
                  type:
                    description: |
                      The type of the collection:
                      - `0`: "unknown"
                      - `2`: regular document collection
                      - `3`: edge collection
                    type: integer
                    example: 2
                  isSystem:
                    description: |
                      Whether the collection is a system collection. Collection names that starts with
                      an underscore are usually system collections.
                    type: boolean
                    example: false
                  status:
                    description: |
                      The status of the collection.
                      - `3`: loaded
                      - `5`: deleted

                      Every other status indicates a corrupted collection.
                    type: integer
                    example: 3
                  id:
                    description: |
                      A unique identifier of the collection (deprecated).
                    type: string
                  globallyUniqueId:
                    description: |
                      A unique identifier of the collection. This is an internal property.
                    type: string
                  count:
                    description: |
                      The number of documents currently present in the collection.
                    type: integer
        '400':
          description: |
            The `collection-name` parameter or the `name` attribute is missing.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A collection called `collection-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Collections
```

**Examples**

```curl
---
description: ''
name: RestCollectionIdentifierLoad
---
var cn = "products";
db._drop(cn);
var coll = db._create(cn, { waitForSync: true });
var url = "/_api/collection/"+ coll.name() + "/load";

var response = logCurlRequest('PUT', url, '');

assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```

### Unload a collection

```openapi
paths:
  /_db/{database-name}/_api/collection/{collection-name}/unload:
    put:
      operationId: unloadCollection
      description: |
        {{</* warning */>}}
        The unload function is deprecated from version 3.8.0 onwards and is a no-op
        from version 3.9.0 onwards. It should no longer be used, as it may be removed
        in a future version of ArangoDB.
        {{</* /warning */>}}

        Since ArangoDB version 3.9.0 this API does nothing. Previously it used to
        unload a collection from memory, while preserving all documents.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: collection-name
          in: path
          required: true
          description: |
            The name of the collection.

            {{</* warning */>}}
            Accessing collections by their numeric ID is deprecated from version 3.4.0 on.
            You should reference them via their names instead.
            {{</* /warning */>}}
          schema:
            type: string
      responses:
        '200':
          description: |
            Returns the basic collection properties for compatibility reasons.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - name
                  - type
                  - isSystem
                  - status
                  - id
                  - globallyUniqueId
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  name:
                    description: |
                      The name of the collection.
                    type: string
                    example: coll
                  type:
                    description: |
                      The type of the collection:
                      - `0`: "unknown"
                      - `2`: regular document collection
                      - `3`: edge collection
                    type: integer
                    example: 2
                  isSystem:
                    description: |
                      Whether the collection is a system collection. Collection names that starts with
                      an underscore are usually system collections.
                    type: boolean
                    example: false
                  status:
                    description: |
                      The status of the collection.
                      - `3`: loaded
                      - `5`: deleted

                      Every other status indicates a corrupted collection.
                    type: integer
                    example: 3
                  id:
                    description: |
                      A unique identifier of the collection (deprecated).
                    type: string
                  globallyUniqueId:
                    description: |
                      A unique identifier of the collection. This is an internal property.
                    type: string
        '400':
          description: |
            The `collection-name` parameter or the `name` attribute is missing.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A collection called `collection-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Collections
```

**Examples**

```curl
---
description: ''
name: RestCollectionIdentifierUnload
---
var cn = "products";
db._drop(cn);
var coll = db._create(cn, { waitForSync: true });
var url = "/_api/collection/"+ coll.name() + "/unload";

var response = logCurlRequest('PUT', url, '');

assert(response.code === 200);

logJsonResponse(response);
db._drop(cn);
```
