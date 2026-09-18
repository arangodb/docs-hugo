---
title: Activities HTTP API
menuTitle: Activities
weight: 8
description: >-
  The HTTP interface for server activities is an observability feature that
  shows which high-level processes are currently ongoing in the database system
---
<small>Introduced in: v3.12.8</small>

The activities API lets you observe which high-level processes are currently
running on the server, such as HTTP request handlers, AQL queries, transactions,
index creations, and the background consolidation of ArangoSearch index data.

Each activity has a type, creation time, an optional parent to indicate a
dependency, and type-specific data. Not all server activity is necessarily
reported.

Every server keeps track of its own activities. In a cluster, you can either
ask a specific server, or retrieve the activities of
[all servers at once](#get-the-activities-of-all-servers-experimental).

## Get the activities (experimental)

```openapi
---
apiVersions: [experimental]
---
paths:
  /_db/{database-name}/_admin/activities:
    get:
      operationId: getActivities
      description: |
        {{</* warning */>}}
        The activities API is incomplete and thus an experimental feature.
        {{</* /warning */>}}

        Returns the list of activities currently in progress on the server.
        Each activity has an identifier, a type (e.g. `RestHandler`, `AqlQuery`,
        `TransactionActivity`), a creation time, an optional parent reference,
        and a `data` object. The structure of `data` depends on the activity type
        and may be extended in future versions.

        The permissions required to use the endpoint depend on the
        [`--activities.only-superuser-enabled` startup option](../../../components/arangodb-server/options.md#--activitiesonly-superuser-enabled).
        By default, *administrate* access for the `_system` database is
        sufficient. If the startup option is enabled, the endpoint is restricted
        to the superuser and you therefore need to authenticate with a token
        created from the JWT secret.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database and write access to the `_system` database.
          schema:
            type: string
        # TODO: Forwarding broken in v3.12.11
        #- name: serverId
        #  in: query
        #  required: false
        #  description: |
        #    Returns the activities of the specified server (`CRDN-...`,
        #    `PRMR-...`, or `AGNT-...`). If no `serverId` is specified, the asked
        #    server replies. This parameter is only meaningful on Coordinators.
        #  schema:
        #    type: string
      responses:
        '200':
          description: |
            The list of activities was returned successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - activities
                properties:
                  activities:
                    description: |
                      Array of activity objects currently in progress.
                    type: array
                    items:
                      type: object
                      required:
                        - id
                        - type
                        - created
                        - data
                      properties:
                        id:
                          description: |
                            Unique identifier of the activity.
                          type: integer
                          example: 370
                        type:
                          description: |
                            The kind of activity (e.g. `RestHandler`, `AQLQuery`).
                          type: string
                          example: "RestHandler"
                        created:
                          description: |
                            The start time of the activity (in ISO 8601 format).
                          type: string
                          format: date-time
                        parent:
                          description: |
                            The `id` of the parent activity, if any.
                          type: integer
                          example: 370
                        threads:
                          description: |
                            <small>Introduced in: v3.12.10</small>

                            The threads that currently execute this activity.
                            The list is empty for activities that no thread
                            claims, like background maintenance activities.
                          type: array
                          items:
                            type: object
                            required:
                              - LWPID
                              - name
                            properties:
                              LWPID:
                                description: |
                                  The identifier of the light-weight process
                                  (thread) as assigned by the operating system.
                                type: integer
                              name:
                                description: |
                                  The name of the thread.
                                type: string
                        data:
                          description: |
                            Type-specific details for this activity. The shape of
                            this object depends on the activity type and is
                            intentionally left flexible so the feature can grow
                            without breaking the API. Do not rely on a fixed schema.

                            See [the `ArangoSearchConsolidation` type](#arangosearchconsolidation)
                            for the details reported by activities of type
                            `ArangoSearchConsolidation`.
                          type: object
                          # TODO: describe the shape per activity type here once
                          # the docs tooling can render composition
                          #oneOf:
                          #  - title: ArangoSearchConsolidation
                          #    type: object
                          #    properties:
                          #      segments:
                          #        type: array
                          #        items:
                          #          type: object
                          #          properties:
                          #            name:
                          #              type: string
                          #            byteSize:
                          #              type: number
                          #            docsCount:
                          #              type: number
                          #            liveDocsCount:
                          #              type: number
        '401':
          description: |
            The credentials are wrong or the user account is inactive.
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
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '403':
          description: |
            The request is not authorized due to a lack of permissions.
            The reason depends on the setting of the
            `--activities.only-superuser-enabled` startup option:

            - `false`: The endpoint is restricted to admin users but the
              user account you authenticated with lacks write access to the
              `_system` database.
            - `true`: The endpoint is restricted to the superuser but you didn't
              authenticate with a token created from the JWT secret.
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
                    example: 403
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          # TODO
          # , or the server
          # specified by the `serverId` query parameter is not known in the
          # cluster.
          description: |
            The specified database doesn't exist, or the user account you
            authenticate with has no access to this database.

            Up to v3.12.10, a lack of database access resulted in an HTTP `401`
            error with the `ERROR_FORBIDDEN` (`11`) error number instead of an
            HTTP `404` error with the `ERROR_ARANGO_DATABASE_NOT_FOUND` (`1228`)
            error number.
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
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '405':
          description: |
            Returned when an HTTP method other than `GET` is used.
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
                    example: 405
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Monitoring
```

**Examples**

{{< comment >}}
Example not generated because it changes on every run and it is difficult to control what/how many activities get included.
{{< /comment >}}

```bash
curl --header 'accept: application/json' --dump - http://localhost:8529/_arango/experimental/_admin/activities
```

{{< details summary="Show output" >}}
```json
{
  "activities": [
    {
      "id": 372,
      "type": "RestHandler",
      "created": "2026-03-26T15:43:56Z",
      "data": {
        "method": "GET",
        "url": "/_admin/activities",
        "handler": "ActivityRegistryRestHandler"
      }
    },
    {
      "id": 371,
      "type": "AqlQuery",
      "created": "2026-03-26T15:43:54Z",
      "parent": 370,
      "data": {
        "queryId": 0,
        "startTime": 20919.354783951,
        "database": "_system",
        "user": "",
        "queryString": "RETURN SLEEP(@seconds)",
        ...
      }
    },
    {
      "id": 370,
      "type": "RestHandler",
      "created": "2026-03-26T15:43:54Z",
      "data": {
        "method": "POST",
        "url": "/_api/cursor",
        "handler": "RestCursorHandler"
      }
    }
  ]
}
```
{{< /details >}}

## Get the activities of all servers (experimental)

```openapi
---
apiVersions: [experimental]
---
paths:
  /_db/{database-name}/_admin/activities/all:
    get:
      operationId: getActivitiesAllServers
      description: |
        {{</* warning */>}}
        The activities API is incomplete and thus an experimental feature.
        {{</* /warning */>}}

        <small>Introduced in: v3.12.10</small>

        Returns the activities that are currently in progress on every server of
        a cluster deployment, grouped by server. The Coordinator you call this
        endpoint on asks all other Coordinators, the DB-Servers, and the Agents
        for their activities, and adds its own.

        You need to call this endpoint on a Coordinator. It is not available on
        single servers, which only ever report their own activities via the
        [`GET /_admin/activities` endpoint](#get-the-activities-experimental).

        The endpoint is useful for activities that only occur on particular
        servers, like the [ArangoSearch consolidation](#arangosearchconsolidation)
        that DB-Servers perform.

        The permissions required to use the endpoint depend on the
        [`--activities.only-superuser-enabled` startup option](../../../components/arangodb-server/options.md#--activitiesonly-superuser-enabled).
        By default, *administrate* access for the `_system` database is
        sufficient. If the startup option is enabled, the endpoint is restricted
        to the superuser and you therefore need to authenticate with a token
        created from the JWT secret.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database and write access to the `_system` database.
          schema:
            type: string
      responses:
        '200':
          description: |
            The activities of all servers were returned successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - activities_per_server
                properties:
                  activities_per_server:
                    description: |
                      An object with the server IDs as the attribute keys
                      (`CRDN-...` for Coordinators, `PRMR-...` for DB-Servers,
                      and `AGNT-...` for Agents). The attribute value is the
                      array of activity objects of the respective server, using
                      the same format as the
                      [`GET /_admin/activities` endpoint](#get-the-activities-experimental).

                      If the activities of a server cannot be retrieved, for
                      instance because the server doesn't respond in time, the
                      attribute value is an object with a `number` attribute
                      (the ArangoDB error number) and a `message` attribute
                      (a descriptive error message) instead.
                    type: object
                    additionalProperties:
                      description: |
                        The activities of one server, or an error object if they
                        cannot be retrieved.
                      type: array
                      items:
                        type: object
        '401':
          description: |
            The user account you authenticated with lacks read access for the
            specified database, the credentials are wrong, or the user account
            is inactive.
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
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '403':
          description: |
            The request is not authorized. The possible reasons are the
            following:

            - You called the endpoint on a server other than a Coordinator.
            - The `--activities.only-superuser-enabled` startup option is
              `false` and the user account you authenticated with lacks write
              access to the `_system` database.
            - The `--activities.only-superuser-enabled` startup option is `true`
              and you didn't authenticate with a token created from the
              JWT secret.
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
                    example: 403
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '405':
          description: |
            Returned when an HTTP method other than `GET` is used.
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
                    example: 405
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Monitoring
```

## Activity types

The `data` object of an activity holds details that are specific to the activity
`type`. The following types report such type-specific data.

Some activity types report their `data` as a flat object with string values
only. Numbers are encoded as strings in these objects, like `"job_id": "42"`.

### AqlQuery

<small>Introduced in: v3.12.9</small>

An AQL query that is currently executing.

The `data` object has the following attributes:

- `queryId` (number): The identifier of the query.
- `startTime` (number): The start time of the query as a steady clock value in
  seconds. This is not a wall-clock timestamp. It is only meaningful for
  calculating how long the query has been running relative to other steady
  clock values.
- `database` (string): The name of the database the query runs in.
- `user` (string): The name of the user who started the query.
- `queryString` (string): The AQL query string.
- `options` (object): The effective query options, like `memoryLimit`,
  `maxRuntime`, `profile`, and the optimizer rules.
- `bindParameters` (object, _optional_): The bind parameters of the query.
  Only reported if the query has bind parameters.
- `plan` (object, _optional_): The execution plan of the query.

In a cluster, queries that a Coordinator distributes to DB-Servers report the
following additional attributes. They mirror the internal query setup request:

- `querySlice` (object, _optional_): The query definition.
- `collections` (array, _optional_): The collections involved in the query.
- `variables` (array, _optional_): The variables of the query.
- `snippets` (object, _optional_): The query snippets to execute.
- `traverserEngines` (array, _optional_): The traversal engines of the query.
- `fastPathLocking` (boolean, _optional_): Whether the fast lock round is used
  for acquiring the collection locks.

### ArangoSearchConsolidation

<small>Introduced in: v3.12.11</small>

A [consolidation](../../../indexes-and-search/arangosearch/arangosearch-views-reference.md#segments-commits-and-consolidation)
of the index segments of an `arangosearch` View or an inverted index.

Every consolidation is reported as an activity for as long as it runs, from the
point at which the segments to merge have been selected until the merge is
complete. The activities are created by single servers and DB-Servers because
they store and maintain the index data. In a cluster, you therefore need to
either ask the DB-Servers directly using the `serverId` query parameter, or
retrieve the activities of
[all servers at once](#get-the-activities-of-all-servers-experimental).

The `data` object has the following attributes:

- `segments` (array): The index segments that have been selected for the merge.
  Each element is an object with the following attributes:
  - `name` (string): The name of the index segment.
  - `byteSize` (number): The size of the index segment in bytes.
  - `docsCount` (number): The total number of documents in the index segment,
    including documents that are marked as deleted.
  - `liveDocsCount` (number): The number of documents in the index segment that
    are not marked as deleted.

### CreateCollections

<small>Introduced in: v3.12.9</small>

The creation of one or more collections.

The `data` object has the following attributes:

- `collectionNames` (string): The names of the collections to create, as a
  comma-separated string.

### EnsureIndex

<small>Introduced in: v3.12.9</small>

The creation of an index, as triggered by a user request.

Note that DB-Servers additionally report a
[maintenance action](#maintenance-actions) of the same name but with a
different `data` object.

The `data` object has the following attributes:

- `collection` (string): The name of the collection to create the index for.
- `parameters` (string): The index definition as a JSON string.

### InternalRequest

<small>Introduced in: v3.12.10</small>

A request that a server sends to another server of the deployment, for instance
a Coordinator asking a DB-Server for data.

The `data` object has the following attributes:

- `destination` (string): The server the request is sent to, either as a
  `server:<server-id>` string or as an endpoint.
- `method` (string): The HTTP method of the request, like `Get`, `Post`, or
  `Delete`. Note that the values are capitalized.
- `path` (string): The path of the endpoint that is called.
- `hasPayload` (boolean): Whether the request has a body.
- `options` (object): The request options, like the `database`, the `timeout`
  in seconds, the query `parameters`, and the `apiVersion`.
- `header` (object): The HTTP headers of the request as an object with the
  header names as attribute keys and the header values as attribute values.
- `retryCount` (number, _optional_): How often the request has been retried.

### Maintenance actions

<small>Introduced in: v3.12.9</small>

A cluster maintenance action that a DB-Server executes to bring the local state
in line with the plan, like creating a shard or synchronizing a follower.

Unlike the other activity types, the activity `type` is the name of the
respective action. It can be one of the following:
`CreateCollection`, `CreateDatabase`, `DropCollection`, `DropDatabase`,
`DropIndex`, `EnsureIndex`, `ResignShardLeadership`, `SynchronizeShard`,
`TakeoverShardLeadership`, `UpdateCollection`, and `UpdateReplicatedLog`.

The `data` object has the following attributes:

- `discriminatoryProperties` (object): The properties that identify the action,
  like the `database`, `collection`, and `shard` it applies to. Two actions with
  the same discriminatory properties are considered duplicates.
- `nonDiscriminatoryProperties` (object): Additional properties of the action
  that are not used for identifying it.
- `priority` (number): The scheduling priority of the action.
- `runEvenIfDuplicate` (boolean): Whether the action is executed even if an
  identical action is already queued or running.

### RestHandler

An HTTP request that the server is currently handling.

The `data` object has the following attributes:

- `handler` (string): The name of the internal request handler, like
  `RestCursorHandler`.
- `url` (string): The path of the endpoint that is called, including the query
  parameters.
- `method` (string): The HTTP method of the request, like `GET` or `POST`.
- `headers` (object): The HTTP headers of the request as an object with the
  header names as attribute keys and the header values as attribute values.
- `connectionInfo` (object): Details about the underlying connection, with the
  following attributes:
  - `serverAddress` (string): The address the server listens on.
  - `serverPort` (number): The port the server listens on.
  - `clientAddress` (string): The address of the client that sent the request.
  - `clientPort` (number): The port of the client that sent the request.
  - `endpoint` (string): The endpoint the request was received on.
  - `endpointType` (string): The domain type of the endpoint. Can be `IPV4`,
    `IPV6`, `UNIX`, `SRV`, or `UNKNOWN`.
  - `encryptionType` (string): Whether the connection is encrypted.
    Can be `SSL` or `NONE`.

### RocksDBCompaction

<small>Introduced in: v3.12.10</small>

A compaction of the underlying RocksDB storage engine.

The `data` object has the following attributes:

- `job_id` (string): The identifier of the compaction job.
- `column_family` (string): The name of the RocksDB column family that is
  compacted.
- `base_input_level` (string): The level the input files are read from.
- `output_level` (string): The level the compacted files are written to.
- `input_files` (string): The number of files that are compacted.
- `reason` (string): What triggered the compaction, like `LevelL0FilesNum`.

### RocksDBDump

<small>Introduced in: v3.12.9</small>

A dump of collection data via the internal dump API that _arangodump_ uses,
for the duration of the dump context.

The `data` object has the following attributes:

- `id` (string): The identifier of the dump context.
- `user` (string): The name of the user who started the dump.
- `database` (string): The name of the database the dump is taken from.

### RocksDBDumpNext

<small>Introduced in: v3.12.10</small>

The retrieval of a single batch of a running [dump](#rocksdbdump).

The `data` object has the following attributes:

- `id` (string): The identifier of the dump context the batch belongs to.

### TransactionActivity

<small>Introduced in: v3.12.9</small>

A transaction that is currently in progress.

The `data` object has the following attributes:

- `user` (string): The name of the user who started the transaction.
- `database` (string): The name of the database the transaction runs in.
- `tid` (number): The identifier of the transaction.
- `status` (string): The state of the transaction. Can be `undefined`,
  `created`, `running`, `committed`, or `aborted`.
- `collections` (array): The collections the transaction uses. Each element is
  an object with the following attributes:
  - `name` (string): The name of the collection.
  - `cid` (number): The identifier of the collection.
  - `accessType` (string): How the transaction accesses the collection.
    Can be `none`, `read`, `write`, or `exclusive`.
  - `lockStatus` (string): Whether the transaction holds the required lock.
    Can be `not_holding`, `acquiring`, `holding`, or `failed`.

### TransactionContext

<small>Introduced in: v3.12.10</small>

The context a transaction runs in. It is created for every operation that needs
a transaction, including single-document operations and the transactions that
AQL queries use internally.

The `data` object has the following attributes:

- `origin` (string): A description of what created the transaction, like
  `executing query`, `inserting document(s)`, or `building index`.
