---
title: Replication dump commands
menuTitle: Replication Dump
weight: 5
description: ''
archetype: default
---
## Inventory

The *inventory* method can be used to query an ArangoDB database's current
set of collections plus their indexes. Clients can use this method to get an 
overview of which collections are present in the database. They can use this information
to either start a full or a partial synchronization of data, e.g. to initiate a backup
or the incremental data synchronization.

### Get a replication inventory

```openapi
paths:
  /_api/replication/inventory:
    get:
      operationId: getReplicationInventory
      description: |
        Returns the array of collections and their indexes, and the array of Views available. These
        arrays can be used by replication clients to initiate an initial synchronization with the
        server.
        The response will contain all collections, their indexes and views in the requested database
        if `global` is not set, and all collections, indexes and views in all databases if `global`
        is set.
        In case `global` is not set, it is possible to restrict the response to a single collection
        by setting the `collection` parameter. In this case the response will contain only information
        about the requested collection in the `collections` array, and no information about views
        (i.e. the `views` response attribute will be an empty array).

        The response will contain a JSON object with the `collections`, `views`, `state` and
        `tick` attributes.

        `collections` is an array of collections with the following sub-attributes:

        - `parameters`: the collection properties

        - `indexes`: an array of the indexes of a the collection. Primary indexes and edge indexes
           are not included in this array.

        The `state` attribute contains the current state of the replication logger. It
        contains the following sub-attributes:

        - `running`: whether or not the replication logger is currently active. Note:
          since ArangoDB 2.2, the value will always be `true`

        - `lastLogTick`: the value of the last tick the replication logger has written

        - `time`: the current time on the server

        `views` is an array of available views.

        Replication clients should note the `lastLogTick` value returned. They can then
        fetch collections' data using the dump method up to the value of lastLogTick, and
        query the continuous replication log for log events after this tick value.

        To create a full copy of the collections on the server, a replication client
        can execute these steps:

        - call the `/inventory` API method. This returns the `lastLogTick` value and the
          array of collections and indexes from the server.

        - for each collection returned by `/inventory`, create the collection locally and
          call `/dump` to stream the collection data to the client, up to the value of
          `lastLogTick`.
          After that, the client can create the indexes on the collections as they were
          reported by `/inventory`.

        If the clients wants to continuously stream replication log events from the logger
        server, the following additional steps need to be carried out:

        - the client should call `/_api/wal/tail` initially to fetch the first batch of
          replication events that were logged after the client's call to `/inventory`.

          The call to `/_api/wal/tail` should use a `from` parameter with the value of the
          `lastLogTick` as reported by `/inventory`. The call to `/_api/wal/tail` will
          return the `x-arango-replication-lastincluded` header which will contain the
          last tick value included in the response.

        - the client can then continuously call `/_api/wal/tail` to incrementally fetch new
          replication events that occurred after the last transfer.

          Calls should use a `from` parameter with the value of the `x-arango-replication-lastincluded`
          header of the previous response. If there are no more replication events, the
          response will be empty and clients can go to sleep for a while and try again
          later.

        {{</* info */>}}
        On a Coordinator, this request must have a `DBserver`
        query parameter which must be an ID of a DB-Server.
        The very same request is forwarded synchronously to that DB-Server.
        It is an error if this attribute is not bound in the Coordinator case.
        {{</* /info */>}}

        {{</* info */>}}
        Using the `global` parameter the top-level object contains a key `databases`
        under which each key represents a database name, and the value conforms to the above description.
        {{</* /info */>}}
      parameters:
        - name: includeSystem
          in: query
          required: false
          description: |
            Include system collections in the result. The default value is `true`.
          schema:
            type: boolean
        - name: global
          in: query
          required: false
          description: |
            Include all databases in the response. Only works on `_system` The default value is `false`.
          schema:
            type: boolean
        - name: batchId
          in: query
          required: true
          description: |
            A valid batchId is required for this API call
          schema:
            type: number
        - name: collection
          in: query
          required: false
          description: |
            If this parameter is set, the response will be restricted to a single collection (the one
            specified), and no views will be returned. This can be used as an optimization to reduce
            the size of the response.
          schema:
            type: string
      responses:
        '200':
          description: |
            is returned if the request was executed successfully.
        '405':
          description: |
            is returned when an invalid HTTP method is used.
        '500':
          description: |
            is returned if an error occurred while assembling the response.
      tags:
        - Replication
```

## Batch

The *batch* method will create a snapshot of the current state that then can be
dumped.

### Create a new dump batch

```openapi
paths:
  /_api/replication/batch:
    post:
      operationId: createReplicationBatch
      description: |
        {{</* info */>}}
        This is an internally used endpoint.
        {{</* /info */>}}

        Creates a new dump batch and returns the batch's id.

        The response is a JSON object with the following attributes:

        - `id`: the id of the batch
        - `lastTick`: snapshot tick value using when creating the batch
        - `state`: additional leader state information (only present if the
          `state` URL parameter was set to `true` in the request)

        {{</* info */>}}
        On a Coordinator, this request must have a `DBserver`
        query parameter which must be an ID of a DB-Server.
        The very same request is forwarded synchronously to that DB-Server.
        It is an error if this attribute is not bound in the Coordinator case.
        {{</* /info */>}}
      parameters:
        - name: state
          in: query
          required: false
          description: |
            setting `state` to true will make the response also contain
            a `state` attribute with information about the leader state.
            This is used only internally during the replication process
            and should not be used by client applications.
          schema:
            type: boolean
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - ttl
              properties:
                ttl:
                  description: |
                    The time-to-live for the new batch (in seconds).
                  type: integer
      responses:
        '200':
          description: |
            is returned if the batch was created successfully.
        '400':
          description: |
            is returned if the TTL value is invalid or if the `DBserver` attribute
            is not specified or illegal on a Coordinator.
        '405':
          description: |
            is returned when an invalid HTTP method is used.
      tags:
        - Replication
```

### Delete an existing dump batch

```openapi
paths:
  /_api/replication/batch/{id}:
    delete:
      operationId: deleteReplicationBatch
      description: |
        {{</* info */>}}
        This is an internally used endpoint.
        {{</* /info */>}}

        Deletes the existing dump batch, allowing compaction and cleanup to resume.

        {{</* info */>}}
        On a Coordinator, this request must have a `DBserver`
        query parameter which must be an ID of a DB-Server.
        The very same request is forwarded synchronously to that DB-Server.
        It is an error if this attribute is not bound in the Coordinator case.
        {{</* /info */>}}
      parameters:
        - name: id
          in: path
          required: true
          description: |
            The id of the batch.
          schema:
            type: string
      responses:
        '204':
          description: |
            is returned if the batch was deleted successfully.
        '400':
          description: |
            is returned if the batch was not found.
        '405':
          description: |
            is returned when an invalid HTTP method is used.
      tags:
        - Replication
```

### Extend the TTL of a dump batch

```openapi
paths:
  /_api/replication/batch/{id}:
    put:
      operationId: extendReplicationBatch
      description: |
        {{</* info */>}}
        This is an internally used endpoint.
        {{</* /info */>}}

        Extends the time-to-live (TTL) of an existing dump batch, using the batch's ID and
        the provided TTL value.

        If the batch's TTL can be extended successfully, the response is empty.

        {{</* info */>}}
        On a Coordinator, this request must have a `DBserver`
        query parameter which must be an ID of a DB-Server.
        The very same request is forwarded synchronously to that DB-Server.
        It is an error if this attribute is not bound in the Coordinator case.
        {{</* /info */>}}
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - ttl
              properties:
                ttl:
                  description: |
                    the time-to-live for the new batch (in seconds)
                  type: integer
      parameters:
        - name: id
          in: path
          required: true
          description: |
            The id of the batch.
          schema:
            type: string
      responses:
        '204':
          description: |
            is returned if the batch's ttl was extended successfully.
        '400':
          description: |
            is returned if the ttl value is invalid or the batch was not found.
        '405':
          description: |
            is returned when an invalid HTTP method is used.
      tags:
        - Replication
```

## Dump

The *dump* method can be used to fetch data from a specific collection. As the
results of the dump command can be huge, *dump* may not return all data from a collection
at once. Instead, the dump command may be called repeatedly by replication clients
until there is no more data to fetch. The dump command will not only return the
current documents in the collection, but also document updates and deletions.

Note that the *dump* method will only return documents, updates, and deletions
from a collection's journals and datafiles. Operations that are stored in the write-ahead
log only will not be returned. In order to ensure that these operations are included
in a dump, the write-ahead log must be flushed first. 

To get to an identical state of data, replication clients should apply the individual
parts of the dump results in the same order as they are provided.

### Get a replication dump

```openapi
paths:
  /_api/replication/dump:
    get:
      operationId: getReplicationDump
      description: |
        Returns the data from a collection for the requested range.

        The `chunkSize` query parameter can be used to control the size of the result.
        It must be specified in bytes. The `chunkSize` value will only be honored
        approximately. Otherwise a too low `chunkSize` value could cause the server
        to not be able to put just one entry into the result and return it.
        Therefore, the `chunkSize` value will only be consulted after an entry has
        been written into the result. If the result size is then greater than
        `chunkSize`, the server will respond with as many entries as there are
        in the response already. If the result size is still less than `chunkSize`,
        the server will try to return more data if there's more data left to return.

        If `chunkSize` is not specified, some server-side default value will be used.

        The `Content-Type` of the result is `application/x-arango-dump`. This is an
        easy-to-process format, with all entries going onto separate lines in the
        response body.

        Each line itself is a JSON object, with at least the following attributes:

        - `tick`: the operation's tick attribute

        - `key`: the key of the document/edge or the key used in the deletion operation

        - `rev`: the revision id of the document/edge or the deletion operation

        - `data`: the actual document/edge data for types 2300 and 2301. The full
          document/edge data will be returned even for updates.

        - `type`: the type of entry. Possible values for `type` are:

          - 2300: document insertion/update

          - 2301: edge insertion/update

          - 2302: document/edge deletion

        {{</* info */>}}
        There will be no distinction between inserts and updates when calling this method.
        {{</* /info */>}}
      parameters:
        - name: collection
          in: query
          required: true
          description: |
            The name or id of the collection to dump.
          schema:
            type: string
        - name: chunkSize
          in: query
          required: false
          description: |
            Approximate maximum size of the returned result.
          schema:
            type: number
        - name: batchId
          in: query
          required: true
          description: |
            The id of the snapshot to use
          schema:
            type: number
      responses:
        '200':
          description: |
            is returned if the request was executed successfully and data was returned. The header
            `x-arango-replication-lastincluded` is set to the tick of the last document returned.
        '204':
          description: |
            is returned if the request was executed successfully, but there was no content available.
            The header `x-arango-replication-lastincluded` is `0` in this case.
        '404':
          description: |
            is returned when the collection could not be found.
        '405':
          description: |
            is returned when an invalid HTTP method is used.
        '500':
          description: |
            is returned if an error occurred while assembling the response.
      tags:
        - Replication
```

### Get the replication revision tree

```openapi
paths:
  /_api/replication/revisions/tree:
    get:
      operationId: getReplicationRevisionTree
      description: |
        {{</* warning */>}}
        This revision-based replication endpoint will only work with collections
        created in ArangoDB v3.8.0 or later.
        {{</* /warning */>}}

        Returns the Merkle tree associated with the specified collection.

        The result will be JSON/VelocyPack in the following format:
        ```
        {
          version: <Number>,
          branchingFactor: <Number>
          maxDepth: <Number>,
          rangeMin: <String, revision>,
          rangeMax: <String, revision>,
          nodes: [
            { count: <Number>, hash: <String, revision> },
            { count: <Number>, hash: <String, revision> },
            ...
            { count: <Number>, hash: <String, revision> }
          ]
        }
        ```

        At the moment, there is only one version, 1, so this can safely be ignored for
        now.

        Each `<String, revision>` value type is a 64-bit value encoded as a string of
        11 characters, using the same encoding as our document `_rev` values. The
        reason for this is that 64-bit values cannot necessarily be represented in full
        in JavaScript, as it handles all numbers as floating point, and can only
        represent up to `2^53-1` faithfully.

        The node count should correspond to a full tree with the given `maxDepth` and
        `branchingFactor`. The nodes are laid out in level-order tree traversal, so the
        root is at index `0`, its children at indices `[1, branchingFactor]`, and so
        on.
      parameters:
        - name: collection
          in: query
          required: true
          description: |
            The name or id of the collection to query.
          schema:
            type: string
        - name: batchId
          in: query
          required: true
          description: |
            The id of the snapshot to use
          schema:
            type: number
      responses:
        '200':
          description: |
            is returned if the request was executed successfully and data was returned.
        '401':
          description: |
            is returned if necessary parameters are missing
        '404':
          description: |
            is returned when the collection or snapshot could not be found.
        '405':
          description: |
            is returned when an invalid HTTP method is used.
        '500':
          description: |
            is returned if an error occurred while assembling the response.
        '501':
          description: |
            is returned if called on a collection which doesn't support sync-by-revision
      tags:
        - Replication
```

### Rebuild the replication revision tree

```openapi
paths:
  /_api/replication/revisions/tree:
    post:
      operationId: rebuildReplicationRevisionTree
      description: |
        {{</* warning */>}}
        This revision-based replication endpoint will only work with collections
        created in ArangoDB v3.8.0 or later.
        {{</* /warning */>}}

        Rebuilds the Merkle tree for a collection.

        If successful, there will be no return body.
      parameters:
        - name: collection
          in: query
          required: true
          description: |
            The name or id of the collection to query.
          schema:
            type: string
      responses:
        '204':
          description: |
            is returned if the request was executed successfully.
        '401':
          description: |
            is returned if necessary parameters are missing
        '404':
          description: |
            is returned when the collection or could not be found.
        '405':
          description: |
            is returned when an invalid HTTP method is used.
        '500':
          description: |
            is returned if an error occurred while assembling the response.
        '501':
          description: |
            is returned if called on a collection which doesn't support sync-by-revision
      tags:
        - Replication
```

### List document revision IDs within requested ranges

```openapi
paths:
  /_api/replication/revisions/ranges:
    put:
      operationId: listReplicationRevisionRanges
      description: |
        {{</* warning */>}}
        This revision-based replication endpoint will only work with the RocksDB
        engine, and with collections created in ArangoDB v3.8.0 or later.
        {{</* /warning */>}}

        Returns the revision IDs of documents within the requested ranges.

        The body of the request should be JSON/VelocyPack and should consist of an
        array of pairs of string-encoded revision IDs:

        ```
        [
          [<String, revision>, <String, revision>],
          [<String, revision>, <String, revision>],
          ...
          [<String, revision>, <String, revision>]
        ]
        ```

        In particular, the pairs should be non-overlapping, and sorted in ascending
        order of their decoded values.

        The result will be JSON/VelocyPack in the following format:
        ```
        {
          ranges: [
            [<String, revision>, <String, revision>, ... <String, revision>],
            [<String, revision>, <String, revision>, ... <String, revision>],
            ...,
            [<String, revision>, <String, revision>, ... <String, revision>]
          ]
          resume: <String, revision>
        }
        ```

        The `resume` field is optional. If specified, then the response is to be
        considered partial, only valid through the revision specified. A subsequent
        request should be made with the same request body, but specifying the `resume`
        URL parameter with the value specified. The subsequent response will pick up
        from the appropriate request pair, and omit any complete ranges or revisions
        which are less than the requested resume revision. As an example (ignoring the
        string-encoding for a moment), if ranges `[1, 3], [5, 9], [12, 15]` are
        requested, then a first response may return `[], [5, 6]` with a resume point of
        `7` and a subsequent response might be `[8], [12, 13]`.

        If a requested range contains no revisions, then an empty array is returned.
        Empty ranges will not be omitted.

        Each `<String, revision>` value type is a 64-bit value encoded as a string of
        11 characters, using the same encoding as our document `_rev` values. The
        reason for this is that 64-bit values cannot necessarily be represented in full
        in JavaScript, as it handles all numbers as floating point, and can only
        represent up to `2^53-1` faithfully.
      parameters:
        - name: collection
          in: query
          required: true
          description: |
            The name or id of the collection to query.
          schema:
            type: string
        - name: batchId
          in: query
          required: true
          description: |
            The id of the snapshot to use
          schema:
            type: number
        - name: resume
          in: query
          required: false
          description: |
            The revision at which to resume, if a previous request was truncated
          schema:
            type: string
      responses:
        '200':
          description: |
            is returned if the request was executed successfully and data was returned.
        '401':
          description: |
            is returned if necessary parameters are missing or incorrect
        '404':
          description: |
            is returned when the collection or snapshot could not be found.
        '405':
          description: |
            is returned when an invalid HTTP method is used.
        '500':
          description: |
            is returned if an error occurred while assembling the response.
        '501':
          description: |
            is returned if called on a collection which doesn't support sync-by-revision
      tags:
        - Replication
```

### Get documents by revision

```openapi
paths:
  /_api/replication/revisions/documents:
    put:
      operationId: listReplicationRevisionDocuments
      description: |
        {{</* warning */>}}
        This revision-based replication endpoint will only work with collections
        created in ArangoDB v3.8.0 or later.
        {{</* /warning */>}}

        Returns documents by revision for replication.

        The body of the request should be JSON/VelocyPack and should consist of an
        array of string-encoded revision IDs:

        ```
        [
          <String, revision>,
          <String, revision>,
          ...
          <String, revision>
        ]
        ```

        In particular, the revisions should be sorted in ascending order of their
        decoded values.

        The result will be a JSON/VelocyPack array of document objects. If there is no
        document corresponding to a particular requested revision, an empty object will
        be returned in its place.

        The response may be truncated if it would be very long. In this case, the
        response array length will be less than the request array length, and
        subsequent requests can be made for the omitted documents.

        Each `<String, revision>` value type is a 64-bit value encoded as a string of
        11 characters, using the same encoding as our document `_rev` values. The
        reason for this is that 64-bit values cannot necessarily be represented in full
        in JavaScript, as it handles all numbers as floating point, and can only
        represent up to `2^53-1` faithfully.
      parameters:
        - name: collection
          in: query
          required: true
          description: |
            The name or id of the collection to query.
          schema:
            type: string
        - name: batchId
          in: query
          required: true
          description: |
            The id of the snapshot to use
          schema:
            type: number
      responses:
        '200':
          description: |
            is returned if the request was executed successfully and data was returned.
        '401':
          description: |
            is returned if necessary parameters are missing or incorrect
        '404':
          description: |
            is returned when the collection or snapshot could not be found.
        '405':
          description: |
            is returned when an invalid HTTP method is used.
        '500':
          description: |
            is returned if an error occurred while assembling the response.
        '501':
          description: |
            is returned if called on a collection which doesn't support sync-by-revision
      tags:
        - Replication
```

### Start replication from a remote endpoint

```openapi
paths:
  /_api/replication/sync:
    put:
      operationId: startReplicationSync
      description: |
        Starts a full data synchronization from a remote endpoint into the local
        ArangoDB database.

        The *sync* method can be used by replication clients to connect an ArangoDB database
        to a remote endpoint, fetch the remote list of collections and indexes, and collection
        data. It will thus create a local backup of the state of data at the remote ArangoDB
        database. *sync* works on a per-database level.

        *sync* will first fetch the list of collections and indexes from the remote endpoint.
        It does so by calling the *inventory* API of the remote database. It will then purge
        data in the local ArangoDB database, and after start will transfer collection data
        from the remote database to the local ArangoDB database. It will extract data from the
        remote database by calling the remote database's *dump* API until all data are fetched.

        In case of success, the body of the response is a JSON object with the following
        attributes:

        - *collections*: an array of collections that were transferred from the endpoint

        - *lastLogTick*: the last log tick on the endpoint at the time the transfer
          was started. Use this value as the *from* value when starting the continuous
          synchronization later.

        WARNING: calling this method will synchronize data from the collections found
        on the remote endpoint to the local ArangoDB database. All data in the local
        collections will be purged and replaced with data from the endpoint.

        Use with caution!

        {{</* info */>}}
        This method is not supported on Coordinators in cluster deployments.
        {{</* /info */>}}
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - endpoint
                - password
              properties:
                endpoint:
                  description: |
                    the leader endpoint to connect to (e.g. "tcp://192.168.173.13:8529").
                  type: string
                database:
                  description: |
                    the database name on the leader (if not specified, defaults to the
                    name of the local current database).
                  type: string
                username:
                  description: |
                    an optional ArangoDB username to use when connecting to the endpoint.
                  type: string
                password:
                  description: |
                    the password to use when connecting to the endpoint.
                  type: string
                includeSystem:
                  description: |
                    whether or not system collection operations will be applied
                  type: boolean
                incremental:
                  description: |
                    if set to *true*, then an incremental synchronization method will be used
                    for synchronizing data in collections. This method is useful when
                    collections already exist locally, and only the remaining differences need
                    to be transferred from the remote endpoint. In this case, the incremental
                    synchronization can be faster than a full synchronization.
                    The default value is *false*, meaning that the complete data from the remote
                    collection will be transferred.
                  type: boolean
                restrictType:
                  description: |
                    an optional string value for collection filtering. When
                    specified, the allowed values are *include* or *exclude*.
                  type: string
                restrictCollections:
                  description: |
                    an optional array of collections for use with
                    *restrictType*. If *restrictType* is *include*, only the specified collections
                    will be synchronized. If *restrictType* is *exclude*, all but the specified
                    collections will be synchronized.
                  type: array
                  items:
                    type: string
                initialSyncMaxWaitTime:
                  description: |
                    the maximum wait time (in seconds) that the initial synchronization will
                    wait for a response from the leader when fetching initial collection data.
                    This wait time can be used to control after what time the initial synchronization
                    will give up waiting for a response and fail.
                    This value will be ignored if set to *0*.
                  type: integer
      responses:
        '200':
          description: |
            is returned if the request was executed successfully.
        '400':
          description: |
            is returned if the configuration is incomplete or malformed.
        '405':
          description: |
            is returned when an invalid HTTP method is used.
        '500':
          description: |
            is returned if an error occurred during synchronization.
        '501':
          description: |
            is returned when this operation is called on a Coordinator in a cluster deployment.
      tags:
        - Replication
```

### Get the cluster collections and indexes

```openapi
paths:
  /_api/replication/clusterInventory:
    get:
      operationId: getReplicationClusterInventory
      description: |
        Returns the array of collections and indexes available on the cluster.

        The response will be an array of JSON objects, one for each collection.
        Each collection contains exactly two keys, `parameters` and `indexes`.
        This information comes from `Plan/Collections/{DB-Name}/*` in the Agency,
        just that the `indexes` attribute there is relocated to adjust it to
        the data format of arangodump.
      parameters:
        - name: includeSystem
          in: query
          required: false
          description: |
            Include system collections in the result. The default value is `true`.
          schema:
            type: boolean
      responses:
        '200':
          description: |
            is returned if the request was executed successfully.
        '405':
          description: |
            is returned when an invalid HTTP method is used.
        '500':
          description: |
            is returned if an error occurred while assembling the response.
      tags:
        - Replication
```

