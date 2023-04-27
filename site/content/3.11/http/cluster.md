---
title: HTTP interface for clusters
weight: 115
description: >-
  The cluster-specific endpoints let you get information about individual
  cluster nodes and the cluster as a whole, as well as monitor and administrate
  cluster deployments
archetype: default
---
## Monitoring

```openapi
### Queries statistics of a DB-Server

paths:
  /_admin/cluster/statistics:
    get:
      operationId: getClusterStatistics
      description: |
        Queries the statistics of the given DB-Server
      parameters:
        - name: DBserver
          in: query
          required: true
          description: |
            The ID of a DB-Server.
          schema:
            type: string
      responses:
        '200':
          description: |
            is returned when everything went well.
        '400':
          description: |
            The `DBserver` parameter was not specified or is not the ID of a DB-Server.
        '403':
          description: |
            The specified server is not a DB-Server.
      tags:
        - Cluster
```
```openapi
### Queries the health of cluster for monitoring

paths:
  /_admin/cluster/health:
    get:
      operationId: getClusterHealth
      description: |
        Queries the health of the cluster for monitoring purposes. The response is a JSON object, containing the standard `code`, `error`, `errorNum`, and `errorMessage` fields as appropriate. The endpoint-specific fields are as follows:

        - `ClusterId`: A UUID string identifying the cluster
        - `Health`: An object containing a descriptive sub-object for each node in the cluster.
          - `<nodeID>`: Each entry in `Health` will be keyed by the node ID and contain the following attributes:
            - `Endpoint`: A string representing the network endpoint of the server.
            - `Role`: The role the server plays. Possible values are `"AGENT"`, `"COORDINATOR"`, and `"DBSERVER"`.
            - `CanBeDeleted`: Boolean representing whether the node can safely be removed from the cluster.
            - `Version`: Version String of ArangoDB used by that node.
            - `Engine`: Storage Engine used by that node.
            - `Status`: A string indicating the health of the node as assessed by the supervision (Agency). This should be considered primary source of truth for Coordinator and DB-Servers node health. If the node is responding normally to requests, it is `"GOOD"`. If it has missed one heartbeat, it is `"BAD"`. If it has been declared failed by the supervision, which occurs after missing heartbeats for about 15 seconds, it will be marked `"FAILED"`.

            Additionally it will also have the following attributes for:

            **Coordinators** and **DB-Servers**
            - `SyncStatus`: The last sync status reported by the node. This value is primarily used to determine the value of `Status`. Possible values include `"UNKNOWN"`, `"UNDEFINED"`, `"STARTUP"`, `"STOPPING"`, `"STOPPED"`, `"SERVING"`, `"SHUTDOWN"`.
            - `LastAckedTime`: ISO 8601 timestamp specifying the last heartbeat received.
            - `ShortName`: A string representing the shortname of the server, e.g. `"Coordinator0001"`.
            - `Timestamp`: ISO 8601 timestamp specifying the last heartbeat received. (deprecated)
            - `Host`: An optional string, specifying the host machine if known.

            **Coordinators** only
            - `AdvertisedEndpoint`: A string representing the advertised endpoint, if set. (e.g. external IP address or load balancer, optional)

            **Agents**
            - `Leader`: ID of the Agent this node regards as leader.
            - `Leading`: Whether this Agent is the leader (true) or not (false).
            - `LastAckedTime`: Time since last `acked` in seconds.
      responses:
        '200':
          description: |
            is returned when everything went well.
      tags:
        - Cluster
```

## Endpoints

```openapi
### Get information about all Coordinator endpoints

paths:
  /_api/cluster/endpoints:
    get:
      operationId: listClusterEndpoints
      description: |
        Returns an object with an attribute `endpoints`, which contains an
        array of objects, which each have the attribute `endpoint`, whose value
        is a string with the endpoint description. There is an entry for each
        Coordinator in the cluster. This method only works on Coordinators in
        cluster mode. In case of an error the `error` attribute is set to
        `true`.
      responses:
        '200':
          description: |
            is returned when everything went well.
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    description: |
                      boolean flag to indicate whether an error occurred (*true* in this case)
                    type: boolean
                  code:
                    description: |
                      the HTTP status code - 200
                    type: integer
                  endpoints:
                    description: |
                      A list of active cluster endpoints.
                    type: array
                    items:
                      type: object
                      properties:
                        endpoint:
                          description: |
                            The bind of the Coordinator, like `tcp://[::1]:8530`
                          type: string
                      required:
                        - endpoint
                required:
                  - error
                  - code
                  - endpoints
        '501':
          description: |
            server is not a Coordinator or method was not GET.
      tags:
        - Cluster
```

## Cluster node information

```openapi
### Return id of a server in a cluster

paths:
  /_admin/server/id:
    get:
      operationId: getServerId
      description: |
        Returns the id of a server in a cluster. The request will fail if the
        server is not running in cluster mode.
      responses:
        '200':
          description: |
            Is returned when the server is running in cluster mode.
        '500':
          description: |
            Is returned when the server is not running in cluster mode.
      tags:
        - Cluster
```
```openapi
### Return the role of a server in a cluster

paths:
  /_admin/server/role:
    get:
      operationId: getServerRole
      description: |
        Returns the role of a server in a cluster.
        The role is returned in the *role* attribute of the result.
        Possible return values for *role* are:
        - *SINGLE*: the server is a standalone server without clustering
        - *COORDINATOR*: the server is a Coordinator in a cluster
        - *PRIMARY*: the server is a DB-Server in a cluster
        - *SECONDARY*: this role is not used anymore
        - *AGENT*: the server is an Agency node in a cluster
        - *UNDEFINED*: in a cluster, *UNDEFINED* is returned if the server role cannot be
           determined.
      responses:
        '200':
          description: |
            Is returned in all cases.
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    description: |
                      always *false*
                    type: boolean
                  code:
                    description: |
                      the HTTP status code, always 200
                    type: integer
                  errorNum:
                    description: |
                      the server error number
                    type: integer
                  role:
                    description: |
                      one of [ *SINGLE*, *COORDINATOR*, *PRIMARY*, *SECONDARY*, *AGENT*, *UNDEFINED*]
                    type: string
                required:
                  - error
                  - code
                  - errorNum
                  - role
      tags:
        - Cluster
```

## Maintenance

```openapi
### Enable or disable the supervision maintenance mode

paths:
  /_admin/cluster/maintenance:
    put:
      operationId: setClusterMaintenance
      description: |
        This API allows to temporarily enable the supervision maintenance mode. Please be aware that no
        automatic failovers of any kind will take place while the maintenance mode is enabled.
        The cluster supervision reactivates itself automatically at some point after disabling it.

        To enable the maintenance mode the request body must contain the string `"on"`
        (Please note it _must_ be lowercase as well as include the quotes). This will enable the
        maintenance mode for 60 minutes, i.e. the supervision maintenance will reactivate itself
        after 60 minutes.

        Since ArangoDB 3.8.3 it is possible to enable the maintenance mode for a different
        duration than 60 minutes, it is possible to send the desired duration value (in seconds)
        as a string in the request body. For example, sending `"7200"`
        (including the quotes) will enable the maintenance mode for 7200 seconds, i.e. 2 hours.

        To disable the maintenance mode the request body must contain the string `"off"`
        (Please note it _must_ be lowercase as well as include the quotes).
      responses:
        '200':
          description: |
            is returned when everything went well.
        '400':
          description: |
            if the request contained an invalid body
        '501':
          description: |
            if the request was sent to a node other than a Coordinator or single-server
        '504':
          description: |
            if the request timed out while enabling the maintenance mode
      tags:
        - Cluster
```
```openapi
### Query the maintenance status of a DB-Server

paths:
  /_admin/cluster/maintenance/{DB-Server-ID}:
    get:
      operationId: getDbserverMaintenance
      description: |
        Check whether the specified DB-Server is in maintenance mode and until when.
      parameters:
        - name: DB-Server-ID
          in: path
          required: true
          description: |
            The ID of a DB-Server.
          schema:
            type: string
      responses:
        '200':
          description: |
            The request was successful.
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    description: |
                      Whether an error occurred. `false` in this case.
                    type: boolean
                  code:
                    description: |
                      The status code. `200` in this case.
                    type: integer
                  result:
                    description: |
                      The result object with the status. This attribute is omitted if the DB-Server
                      is in normal mode.
                    type: object
                    properties:
                      Mode:
                        description: |
                          The mode of the DB-Server. The value is `"maintenance"`.
                        type: string
                      Until:
                        description: |
                          Until what date and time the maintenance mode currently lasts, in the
                          ISO 8601 date/time format.
                        type: string
                    required:
                      - Mode
                      - Until
                required:
                  - error
                  - code
        '400':
          description: |
            if the request contained an invalid body
        '412':
          description: |
            if the request was sent to an Agent node
        '504':
          description: |
            if the request timed out while enabling the maintenance mode
      tags:
        - Cluster
```
```openapi
### Enable or disable the DB-Server maintenance mode

paths:
  /_admin/cluster/maintenance/{DB-Server-ID}:
    put:
      operationId: setDbserverMaintenance
      description: |
        For rolling upgrades or rolling restarts, DB-Servers can be put into
        maintenance mode, so that no attempts are made to re-distribute the data in a
        cluster for such planned events. DB-Servers in maintenance mode are not
        considered viable failover targets because they are likely restarted soon.
      parameters:
        - name: DB-Server-ID
          in: path
          required: true
          description: |
            The ID of a DB-Server.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                mode:
                  description: |
                    The mode to put the DB-Server in. Possible values:
                    - `"maintenance"`
                    - `"normal"`
                  type: string
                timeout:
                  description: |
                    After how many seconds the maintenance mode shall automatically end.
                    You can send another request when the DB-Server is already in maintenance mode
                    to extend the timeout.
                  type: integer
              required:
                - mode
      responses:
        '200':
          description: |
            The request was successful.
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    description: |
                      Whether an error occurred. `false` in this case.
                    type: boolean
                  code:
                    description: |
                      The status code. `200` in this case.
                    type: integer
                required:
                  - error
                  - code
        '400':
          description: |
            if the request contained an invalid body
        '412':
          description: |
            if the request was sent to an Agency node
        '504':
          description: |
            if the request timed out while enabling the maintenance mode
      tags:
        - Cluster
```

## Rebalance

```openapi
### Compute the current cluster imbalance

paths:
  /_admin/cluster/rebalance:
    get:
      operationId: getClusterImbalance
      description: |
        Computes the current cluster imbalance and returns the result.
        It additionally shows the amount of ongoing and pending move shard operations.
      responses:
        '200':
          description: |
            This API returns HTTP 200.
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    description: |
                      The status code.
                    type: number
                  error:
                    description: |
                      Whether an error occurred. `false` in this case.
                    type: boolean
                  result:
                    description: |
                      The result object.
                    type: object
                    properties:
                      leader:
                        description: |
                          Information about the leader imbalance.
                        type: object
                        properties:
                          weightUsed:
                            description: |
                              The weight of leader shards per DB-Server. A leader has a weight of 1 by default
                              but it is higher if collections can only be moved together because of
                              `distributeShardsLike`.
                            type: array
                            items:
                              type: integer
                          targetWeight:
                            description: |
                              The ideal weight of leader shards per DB-Server.
                            type: array
                            items:
                              type: integer
                          numberShards:
                            description: |
                              The number of leader shards per DB-Server.
                            type: array
                            items:
                              type: integer
                          leaderDupl:
                            description: |
                              The measure of the leader shard distribution. The higher the number, the worse
                              the distribution.
                            type: array
                            items:
                              type: integer
                          totalWeight:
                            description: |
                              The sum of all weights.
                            type: integer
                          imbalance:
                            description: |
                              The measure of the total imbalance. A high value indicates a high imbalance.
                            type: integer
                          totalShards:
                            description: |
                              The sum of shards, counting leader shards only.
                            type: integer
                        required:
                          - weightUsed
                          - targetWeight
                          - numberShards
                          - leaderDupl
                          - totalWeight
                          - imbalance
                          - totalShards
                      shards:
                        description: |
                          Information about the shard imbalance.
                        type: object
                        properties:
                          sizeUsed:
                            description: |
                              The size of shards per DB-Server.
                            type: array
                            items:
                              type: integer
                          targetSize:
                            description: |
                              The ideal size of shards per DB-Server.
                            type: array
                            items:
                              type: integer
                          numberShards:
                            description: |
                              The number of leader and follower shards per DB-Server.
                            type: array
                            items:
                              type: integer
                          totalUsed:
                            description: |
                              The sum of the sizes.
                            type: integer
                          totalShards:
                            description: |
                              The sum of shards, counting leader and follower shards.
                            type: integer
                          imbalance:
                            description: |
                              The measure of the total imbalance. A high value indicates a high imbalance.
                            type: integer
                        required:
                          - sizeUsed
                          - targetSize
                          - numberShards
                          - totalUsed
                          - totalShards
                          - imbalance
                    required:
                      - leader
                      - shards
                  pendingMoveShards:
                    description: |
                      The number of pending move shard operations.
                    type: number
                  todoMoveShards:
                    description: |
                      The number of planned move shard operations.
                    type: number
                required:
                  - code
                  - error
                  - result
                  - pendingMoveShards
                  - todoMoveShards
      tags:
        - Cluster
```
```openapi
### Compute a set of move shard operations to improve balance

paths:
  /_admin/cluster/rebalance:
    post:
      operationId: computeClusterRebalancePlan
      description: |
        Compute a set of move shard operations to improve balance.
      requestBody:
        content:
          application/json:
            schema:
              description: |
                The options for the rebalance plan.
              type: object
              properties:
                version:
                  description: |
                    Must be set to `1`.
                  type: number
                maximumNumberOfMoves:
                  description: |
                    Maximum number of moves to be computed. (Default: `1000`)
                  type: number
                leaderChanges:
                  description: |
                    Allow leader changes without moving data. (Default: `true`)
                  type: boolean
                moveLeaders:
                  description: |
                    Allow moving leaders. (Default: `false`)
                  type: boolean
                moveFollowers:
                  description: |
                    Allow moving followers. (Default: `false`)
                  type: boolean
                excludeSystemCollections:
                  description: |
                    Remove system collections from the rebalance plan. (Default: `false`)
                  type: boolean
                piFactor:
                  description: |
                    (Default: `256e6`)
                  type: number
                databasesExcluded:
                  description: |
                    A list of database names to exclude from the analysis. (Default: `[]`)
                  type: array
                  items:
                    type: string
              required:
                - version
      responses:
        '200':
          description: |
            This API returns HTTP 200.
          content:
            application/json:
              schema:
                description: |
                  The rebalance plan.
                type: object
                properties:
                  code:
                    description: |
                      The status code.
                    type: number
                  error:
                    description: |
                      Whether an error occurred. `false` in this case.
                    type: boolean
                  result:
                    description: |
                      The result object.
                    type: object
                    properties:
                      imbalanceBefore:
                        description: |
                          Imbalance before the suggested move shard operations are applied.
                        type: object
                        properties:
                          leader:
                            description: |
                              Information about the leader imbalance.
                            type: object
                            properties:
                              weightUsed:
                                description: |
                                  The weight of leader shards per DB-Server. A leader has a weight of 1 by default
                                  but it is higher if collections can only be moved together because of
                                  `distributeShardsLike`.
                                type: array
                                items:
                                  type: integer
                              targetWeight:
                                description: |
                                  The ideal weight of leader shards per DB-Server.
                                type: array
                                items:
                                  type: integer
                              numberShards:
                                description: |
                                  The number of leader shards per DB-Server.
                                type: array
                                items:
                                  type: integer
                              leaderDupl:
                                description: |
                                  The measure of the leader shard distribution. The higher the number, the worse
                                  the distribution.
                                type: array
                                items:
                                  type: integer
                              totalWeight:
                                description: |
                                  The sum of all weights.
                                type: integer
                              imbalance:
                                description: |
                                  The measure of the total imbalance. A high value indicates a high imbalance.
                                type: integer
                              totalShards:
                                description: |
                                  The sum of shards, counting leader shards only.
                                type: integer
                            required:
                              - weightUsed
                              - targetWeight
                              - numberShards
                              - leaderDupl
                              - totalWeight
                              - imbalance
                              - totalShards
                          shards:
                            description: |
                              Information about the shard imbalance.
                            type: object
                            properties:
                              sizeUsed:
                                description: |
                                  The size of shards per DB-Server.
                                type: array
                                items:
                                  type: integer
                              targetSize:
                                description: |
                                  The ideal size of shards per DB-Server.
                                type: array
                                items:
                                  type: integer
                              numberShards:
                                description: |
                                  The number of leader and follower shards per DB-Server.
                                type: array
                                items:
                                  type: integer
                              totalUsed:
                                description: |
                                  The sum of the sizes.
                                type: integer
                              totalShards:
                                description: |
                                  The sum of shards, counting leader and follower shards.
                                type: integer
                              imbalance:
                                description: |
                                  The measure of the total imbalance. A high value indicates a high imbalance.
                                type: integer
                            required:
                              - sizeUsed
                              - targetSize
                              - numberShards
                              - totalUsed
                              - totalShards
                              - imbalance
                        required:
                          - leader
                          - shards
                      imbalanceAfter:
                        description: |
                          Expected imbalance after the suggested move shard operations are applied.
                        type: object
                        properties:
                          leader:
                            description: |
                              Information about the leader imbalance.
                            type: object
                            properties:
                              weightUsed:
                                description: |
                                  The weight of leader shards per DB-Server. A leader has a weight of 1 by default
                                  but it is higher if collections can only be moved together because of
                                  `distributeShardsLike`.
                                type: array
                                items:
                                  type: integer
                              targetWeight:
                                description: |
                                  The ideal weight of leader shards per DB-Server.
                                type: array
                                items:
                                  type: integer
                              numberShards:
                                description: |
                                  The number of leader shards per DB-Server.
                                type: array
                                items:
                                  type: integer
                              leaderDupl:
                                description: |
                                  The measure of the leader shard distribution. The higher the number, the worse
                                  the distribution.
                                type: array
                                items:
                                  type: integer
                              totalWeight:
                                description: |
                                  The sum of all weights.
                                type: integer
                              imbalance:
                                description: |
                                  The measure of the total imbalance. A high value indicates a high imbalance.
                                type: integer
                              totalShards:
                                description: |
                                  The sum of shards, counting leader shards only.
                                type: integer
                            required:
                              - weightUsed
                              - targetWeight
                              - numberShards
                              - leaderDupl
                              - totalWeight
                              - imbalance
                              - totalShards
                          shards:
                            description: |
                              Information about the shard imbalance.
                            type: object
                            properties:
                              sizeUsed:
                                description: |
                                  The size of shards per DB-Server.
                                type: array
                                items:
                                  type: integer
                              targetSize:
                                description: |
                                  The ideal size of shards per DB-Server.
                                type: array
                                items:
                                  type: integer
                              numberShards:
                                description: |
                                  The number of leader and follower shards per DB-Server.
                                type: array
                                items:
                                  type: integer
                              totalUsed:
                                description: |
                                  The sum of the sizes.
                                type: integer
                              totalShards:
                                description: |
                                  The sum of shards, counting leader and follower shards.
                                type: integer
                              imbalance:
                                description: |
                                  The measure of the total imbalance. A high value indicates a high imbalance.
                                type: integer
                            required:
                              - sizeUsed
                              - targetSize
                              - numberShards
                              - totalUsed
                              - totalShards
                              - imbalance
                        required:
                          - leader
                          - shards
                      moves:
                        description: |
                          The suggested move shard operations.
                        type: array
                        items:
                          type: object
                          properties:
                            from:
                              description: |
                                The server name from which to move.
                              type: string
                            to:
                              description: |
                                The ID of the destination server.
                              type: string
                            shard:
                              description: |
                                Shard ID of the shard to be moved.
                              type: string
                            collection:
                              description: |
                                Collection ID of the collection the shard belongs to.
                              type: number
                            isLeader:
                              description: |
                                True if this is a leader move shard operation.
                              type: boolean
                          required:
                            - from
                            - to
                            - shard
                            - collection
                            - isLeader
                    required:
                      - imbalanceBefore
                      - imbalanceAfter
                      - moves
                required:
                  - code
                  - error
                  - result
      tags:
        - Cluster
```
```openapi
### Execute a set of move shard operations

paths:
  /_admin/cluster/rebalance/execute:
    post:
      operationId: executeClusterRebalancePlan
      description: |
        Execute the given set of move shard operations. You can use the
        `POST /_admin/cluster/rebalance` endpoint to calculate these operations to improve
        the balance of shards, leader shards, and follower shards.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                version:
                  description: |
                    Must be set to `1`.
                  type: number
                moves:
                  description: |
                    A set of move shard operations to execute.
                  type: array
                  items:
                    type: object
                    properties:
                      from:
                        description: |
                          The server name from which to move.
                        type: string
                      to:
                        description: |
                          The ID of the destination server.
                        type: string
                      shard:
                        description: |
                          Shard ID of the shard to be moved.
                        type: string
                      collection:
                        description: |
                          Collection ID of the collection the shard belongs to.
                        type: number
                      isLeader:
                        description: |
                          True if this is a leader move shard operation.
                        type: boolean
                    required:
                      - from
                      - to
                      - shard
                      - collection
                      - isLeader
              required:
                - version
                - moves
      responses:
        '200':
          description: |
            This API returns HTTP 200 if no operations are provided.
        '202':
          description: |
            This API returns HTTP 202 if the operations have been accepted and scheduled for execution.
      tags:
        - Cluster
```
```openapi
### Compute and execute a set of move shard operations to improve balance

paths:
  /_admin/cluster/rebalance:
    put:
      operationId: startClusterRebalance
      description: |
        Compute a set of move shard operations to improve balance.
        These moves are then immediately executed.
      requestBody:
        content:
          application/json:
            schema:
              description: |
                The options for the rebalancing.
              type: object
              properties:
                version:
                  description: |
                    Must be set to `1`.
                  type: number
                maximumNumberOfMoves:
                  description: |
                    Maximum number of moves to be computed. (Default: `1000`)
                  type: number
                leaderChanges:
                  description: |
                    Allow leader changes without moving data. (Default: `true`)
                  type: boolean
                moveLeaders:
                  description: |
                    Allow moving leaders. (Default: `false`)
                  type: boolean
                moveFollowers:
                  description: |
                    Allow moving followers. (Default: `false`)
                  type: boolean
                excludeSystemCollections:
                  description: |
                    Remove system collections from the rebalance plan. (Default: `false`)
                  type: boolean
                piFactor:
                  description: |
                    (Default: `256e6`)
                  type: number
                databasesExcluded:
                  description: |
                    A list of database names to exclude from the analysis. (Default: `[]`)
                  type: array
                  items:
                    type: string
              required:
                - version
      responses:
        '200':
          description: |
            This API returns HTTP 200.
          content:
            application/json:
              schema:
                description: |
                  The executed move shard operations.
                type: object
                properties:
                  code:
                    description: |
                      The status code.
                    type: number
                  error:
                    description: |
                      Whether an error occurred. `false` in this case.
                    type: boolean
                  result:
                    description: |
                      The result object.
                    type: object
                    properties:
                      imbalanceBefore:
                        description: |
                          Imbalance before the suggested move shard operations are applied.
                        type: object
                        properties:
                          leader:
                            description: |
                              Information about the leader imbalance.
                            type: object
                            properties:
                              weightUsed:
                                description: |
                                  The weight of leader shards per DB-Server. A leader has a weight of 1 by default
                                  but it is higher if collections can only be moved together because of
                                  `distributeShardsLike`.
                                type: array
                                items:
                                  type: integer
                              targetWeight:
                                description: |
                                  The ideal weight of leader shards per DB-Server.
                                type: array
                                items:
                                  type: integer
                              numberShards:
                                description: |
                                  The number of leader shards per DB-Server.
                                type: array
                                items:
                                  type: integer
                              leaderDupl:
                                description: |
                                  The measure of the leader shard distribution. The higher the number, the worse
                                  the distribution.
                                type: array
                                items:
                                  type: integer
                              totalWeight:
                                description: |
                                  The sum of all weights.
                                type: integer
                              imbalance:
                                description: |
                                  The measure of the total imbalance. A high value indicates a high imbalance.
                                type: integer
                              totalShards:
                                description: |
                                  The sum of shards, counting leader shards only.
                                type: integer
                            required:
                              - weightUsed
                              - targetWeight
                              - numberShards
                              - leaderDupl
                              - totalWeight
                              - imbalance
                              - totalShards
                          shards:
                            description: |
                              Information about the shard imbalance.
                            type: object
                            properties:
                              sizeUsed:
                                description: |
                                  The size of shards per DB-Server.
                                type: array
                                items:
                                  type: integer
                              targetSize:
                                description: |
                                  The ideal size of shards per DB-Server.
                                type: array
                                items:
                                  type: integer
                              numberShards:
                                description: |
                                  The number of leader and follower shards per DB-Server.
                                type: array
                                items:
                                  type: integer
                              totalUsed:
                                description: |
                                  The sum of the sizes.
                                type: integer
                              totalShards:
                                description: |
                                  The sum of shards, counting leader and follower shards.
                                type: integer
                              imbalance:
                                description: |
                                  The measure of the total imbalance. A high value indicates a high imbalance.
                                type: integer
                            required:
                              - sizeUsed
                              - targetSize
                              - numberShards
                              - totalUsed
                              - totalShards
                              - imbalance
                        required:
                          - leader
                          - shards
                      imbalanceAfter:
                        description: |
                          Expected imbalance after the suggested move shard operations are applied.
                        type: object
                        properties:
                          leader:
                            description: |
                              Information about the leader imbalance.
                            type: object
                            properties:
                              weightUsed:
                                description: |
                                  The weight of leader shards per DB-Server. A leader has a weight of 1 by default
                                  but it is higher if collections can only be moved together because of
                                  `distributeShardsLike`.
                                type: array
                                items:
                                  type: integer
                              targetWeight:
                                description: |
                                  The ideal weight of leader shards per DB-Server.
                                type: array
                                items:
                                  type: integer
                              numberShards:
                                description: |
                                  The number of leader shards per DB-Server.
                                type: array
                                items:
                                  type: integer
                              leaderDupl:
                                description: |
                                  The measure of the leader shard distribution. The higher the number, the worse
                                  the distribution.
                                type: array
                                items:
                                  type: integer
                              totalWeight:
                                description: |
                                  The sum of all weights.
                                type: integer
                              imbalance:
                                description: |
                                  The measure of the total imbalance. A high value indicates a high imbalance.
                                type: integer
                              totalShards:
                                description: |
                                  The sum of shards, counting leader shards only.
                                type: integer
                            required:
                              - weightUsed
                              - targetWeight
                              - numberShards
                              - leaderDupl
                              - totalWeight
                              - imbalance
                              - totalShards
                          shards:
                            description: |
                              Information about the shard imbalance.
                            type: object
                            properties:
                              sizeUsed:
                                description: |
                                  The size of shards per DB-Server.
                                type: array
                                items:
                                  type: integer
                              targetSize:
                                description: |
                                  The ideal size of shards per DB-Server.
                                type: array
                                items:
                                  type: integer
                              numberShards:
                                description: |
                                  The number of leader and follower shards per DB-Server.
                                type: array
                                items:
                                  type: integer
                              totalUsed:
                                description: |
                                  The sum of the sizes.
                                type: integer
                              totalShards:
                                description: |
                                  The sum of shards, counting leader and follower shards.
                                type: integer
                              imbalance:
                                description: |
                                  The measure of the total imbalance. A high value indicates a high imbalance.
                                type: integer
                            required:
                              - sizeUsed
                              - targetSize
                              - numberShards
                              - totalUsed
                              - totalShards
                              - imbalance
                        required:
                          - leader
                          - shards
                      moves:
                        description: |
                          The suggested move shard operations.
                        type: array
                        items:
                          type: object
                          properties:
                            from:
                              description: |
                                The server name from which to move.
                              type: string
                            to:
                              description: |
                                The ID of the destination server.
                              type: string
                            shard:
                              description: |
                                Shard ID of the shard to be moved.
                              type: string
                            collection:
                              description: |
                                Collection ID of the collection the shard belongs to.
                              type: number
                            isLeader:
                              description: |
                                True if this is a leader move shard operation.
                              type: boolean
                          required:
                            - from
                            - to
                            - shard
                            - collection
                            - isLeader
                    required:
                      - imbalanceBefore
                      - imbalanceAfter
                      - moves
                required:
                  - code
                  - error
                  - result
      tags:
        - Cluster
```
