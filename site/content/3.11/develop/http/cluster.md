---
title: HTTP interface for clusters
menuTitle: Cluster
weight: 115
description: >-
  The cluster-specific endpoints let you get information about individual
  cluster nodes and the cluster as a whole, as well as monitor and administrate
  cluster deployments
archetype: default
---
## Monitoring

### Get the statistics of a DB-Server

```openapi
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

### Get the cluster health

```openapi
paths:
  /_admin/cluster/health:
    get:
      operationId: getClusterHealth
      description: |
        Queries the health of the cluster as assessed by the supervision (Agency) for
        monitoring purposes. The response is a JSON object, containing the standard
        `code`, `error`, `errorNum`, and `errorMessage` fields as appropriate.
        The endpoint-specific fields are as follows:

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

### List all Coordinator endpoints

```openapi
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
                required:
                  - error
                  - code
                  - endpoints
                properties:
                  error:
                    description: |
                      boolean flag to indicate whether an error occurred (`true` in this case)
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
                      required:
                        - endpoint
                      properties:
                        endpoint:
                          description: |
                            The bind of the Coordinator, like `tcp://[::1]:8530`
                          type: string
        '501':
          description: |
            server is not a Coordinator or method was not GET.
      tags:
        - Cluster
```

## Cluster node information

### Get the server ID

```openapi
paths:
  /_admin/server/id:
    get:
      operationId: getServerId
      description: |
        Returns the ID of a server in a cluster. The request will fail if the
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

### Get the server role

```openapi
paths:
  /_admin/server/role:
    get:
      operationId: getServerRole
      description: |
        Returns the role of a server in a cluster.
        The server role is returned in the `role` attribute of the result.
      responses:
        '200':
          description: |
            Is returned in all cases.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - role
                properties:
                  error:
                    description: |
                      always `false`
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
                      The server role. Possible values:
                      - `SINGLE`: the server is a standalone server without clustering
                      - `COORDINATOR`: the server is a Coordinator in a cluster
                      - `PRIMARY`: the server is a DB-Server in a cluster
                      - `SECONDARY`: this role is not used anymore
                      - `AGENT`: the server is an Agency node in a cluster
                      - `UNDEFINED`: in a cluster, this is returned if the server role cannot be
                         determined.
                    type: string
      tags:
        - Cluster
```

## Maintenance

### Set the cluster maintenance mode

```openapi
paths:
  /_admin/cluster/maintenance:
    put:
      operationId: setClusterMaintenance
      description: |
        Enable or disable the cluster supervision (Agency) maintenance mode.

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

### Get the maintenance status of a DB-Server

```openapi
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
                required:
                  - error
                  - code
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
                    required:
                      - Mode
                      - Until
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

### Set the maintenance status of a DB-Server

```openapi
paths:
  /_admin/cluster/maintenance/{DB-Server-ID}:
    put:
      operationId: setDbserverMaintenance
      description: |
        Enable or disable the maintenance mode of a DB-Server.

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
              required:
                - mode
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
      responses:
        '200':
          description: |
            The request was successful.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                properties:
                  error:
                    description: |
                      Whether an error occurred. `false` in this case.
                    type: boolean
                  code:
                    description: |
                      The status code. `200` in this case.
                    type: integer
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

As of version 3.10, ArangoDB has built-in capabilities to rebalance the
distribution of shards. This might become necessary since imbalances
can lead to uneven disk usage across the DBServers (data
unbalance) or to uneven load distribution across the DBServers
(leader imbalance).

If the data is distributed relatively evenly across the DBServers, then
the leader imbalance can usually be adjusted relatively cheaply, since
you only have to transfer leadership for a number of shards to a
different replica, which already has the data. This is not true in all
cases, but as a rule of thumb it is true.

If, however, data needs to be moved between DBServers, then this is a
costly and potentially lengthy operation. This is inevitable, but it has
been made in this way so that this operation is done in the background and
does not lead to service interruption.

Nevertheless, data movement requires I/O, CPU, and network resources and
thus it always puts an additional load on the cluster.

Rebalancing shards is a rather complex optimization problem, in
particular if there are many shards in the system. Fortunately, in most
situations it is relatively easy to find operations to make good
progress towards a better state, but "perfection" is hard, and finding
a "cheap" way to get there is even harder.

The APIs described here try to help with the following approach: There
is an "imbalance score" which is computed on a given shard distribution, which
basically says how "imbalanced" the cluster is. This score involves
leader imbalance as well as data imbalance. Higher score means more
imbalance, the actual numerical value does not have any meaning.

The `GET` API call can be used to evaluate this score and give back how
imbalanced the cluster currently is. The `POST` API call does the same
and additionally computes a list of shard movements which the system 
suggests to lower the imbalance score. A variant of the `POST` API call
can then take this (or another) suggestion and execute it in the
background. For convenience, you can use the `PUT` API call to do all at
once: compute the score, suggest moves, and execute them right away.
Since the execution can take some time, the `GET` API call also
tells you how many of the moves are still outstanding.

There are three types of moves:

1. Switch leadership of one shard from the leader to a follower, which
   is currently in sync. This is a fast move.
2. Move the data of a leader to a new DBServer and make it the new leader.
   This is a slow move, since it needs to copy the data over the network
   and then switch the leadership.
3. Move the data of a follower to a new DBServer and make it a new
   follower, then drop the data on the previous follower. This is a slow
   move, since it needs to copy the data over the network.

The suggestion engine behind the `POST` and `PUT` API calls has three
switches to activate/deactivate these three types of moves
independently. If a type of move is activated, the engine considers
all possible such moves, if it is deactivated, no such moves are
considered. The three flags are:

1. `leaderChanges` (default `true`): consider moves of type 1.
2. `moveLeaders` (default `false`): consider moves of type 2.
3. `moveFollowers` (default `false`): consider moves of type 3.

The engine then enumerates all possible moves of the various types.
The first choice is the one which improves the imbalance
the most. After that move, it reevaluates the imbalance score and
again look for the move which improves the imbalance score the most.
It altogether suggests up to `maximumNumberOfMoves` moves and
then stops. The default value for this maximum is `1000` and it is capped at
`5000` to avoid overly long optimization computations.
It is conceivable that for large clusters, `1000` or even `5000` might not be
enough to achieve a full balancing. In such cases, you simply have to
repeat the API calls potentially multiple times.

**Other considerations**

First, in the case of smart graphs or one shard databases, not all shards can
be moved freely. Rather, some shards are "coupled" and can only move
their place in the cluster or even their leadership together. This
severely limits the possibilities of shard movement and sometimes makes a
good balance impossible. A prominent example here is a single one shard
database in the cluster. In this case, **all** leaders **have to** reside
on the same server, so no good leader distribution is possible at all.

Secondly, the current implementation does not take actual shard sizes
into account. It essentially works on the number of shards and tries
to distribute the numbers evenly. It computes weights on the grounds of
how many shards are "coupled" together, but it does not take actual data
size into account. This means that it is possible that we get a "good"
data distribution w.r.t. number of shards, but not with respect to their
disk size usage.

Thirdly, the current implementation does not take compute load on
different collections and shards into account. Therefore, it is possible
that we end up with a shard distribution which distributes the
**leader numbers** evenly across the cluster, even though the actual compute
load is then unevenly distributed, since some collections/shard simply are
hit by more queries than others.

**How to use the rebalancing API**

By far, the easiest way to rebalance a cluster is to simply call the
`PUT` variant of the API, which analyzes the situation, comes up with a
plan to balance things out, and directly schedules it. To rebalance
leaders, you can use `curl` like this:

```
curl -X PUT https://<endpoint>:<port>/_admin/cluster/rebalance -d '{"version":1}' --user root:<rootpassword>
```

You need admin rights, so you should use the user `root` or another user
with write permissions on the `_system` database. Alternatively, you can
use a header with a valid JWT token (for superuser access).

{{< info >}}
Note that this API call only triggers the rebalancing operation, the API
call returns before the actual rebalancing is finished!
{{< /info >}}

Since the default value for `leaderChanges` is `true` and for `moveLeaders`
and `moveFollowers` is `false`, this **only** schedules cheap leader
changes. So it can address leader imbalance, but not data imbalance.

You can monitor progress with this command:

```
curl https://<endpoint>:<port>/_admin/cluster/rebalance --user root:<rootpassword>
```

The resulting object looks roughly like this:

```json
{
  "error": false,
  "code": 200,
  "result": {
    "leader": {
      "weightUsed": [
        51,
        54,
        53
      ],
      "targetWeight": [
        52.666666666666664,
        52.666666666666664,
        52.666666666666664
      ],
      "numberShards": [
        31,
        54,
        21
      ],
      ...
      "imbalance": 1920000004.6666667
    },
    "shards": {
      "sizeUsed": [
        60817408,
        106954752,
        54525952
      ],
      "targetSize": [
        74099370.66666666,
        74099370.66666666,
        74099370.66666666
      ],
      "numberShards": [
        58,
        102,
        52
      ],
      ...
      "imbalance": 1639005333138090.8
    },
    "pendingMoveShards": 0,
    "todoMoveShards": 0
  }
}
```

Of particular relevance are the two attributes `pendingMoveShards` and
`todoMoveShards`. These show how many move operations are still to do
(scheduled, but not begun), and how many are pending (scheduled,
started, but not yet finished). Once these two numbers have reached 0,
the rebalancing operation is finished.

In the `leader` section you see stats about the distribution of the
leader shards, in the `shards` section you see stats about the
distribution of the data (leader shards and follower shards). In both
sections, we see numbers for `numberShards` and for the current
distribution (`weightUsed` for leaders and `sizeUsed` for shards), as
well as for the target distribution. Finally, the `imbalance` number is
the "imbalance score", its absolute value is not meaningful, but the
smaller the score, the better the balance is.

If you actually want to allow the system to move data to improve the
data distribution, use this command:

```
curl -X PUT https://<endpoint>:<port>/_admin/cluster/rebalance -d '{"version":1, "moveLeaders": true, "moveFollowers": true}' --user root:<rootpassword>
```

{{< info >}}
Note that this API call only triggers the rebalancing operation,
the API call returns before the actual rebalancing is finished!
{{< /info >}}

This operation is monitored with the same `GET` request as above, it is
expected that it takes considerably longer to finish.

There are a few more knobs to turn in this, but these should usually not
be necessary and are intended only for expert use.

Note that both these API calls only ever schedules up to 1000 move shard jobs.
For large data sets, you might want to repeat the call after completion.

### Get the current cluster imbalance

```openapi
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
                required:
                  - code
                  - error
                  - result
                  - pendingMoveShards
                  - todoMoveShards
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
                    required:
                      - leader
                      - shards
                    properties:
                      leader:
                        description: |
                          Information about the leader imbalance.
                        type: object
                        required:
                          - weightUsed
                          - targetWeight
                          - numberShards
                          - leaderDupl
                          - totalWeight
                          - imbalance
                          - totalShards
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
                      shards:
                        description: |
                          Information about the shard imbalance.
                        type: object
                        required:
                          - sizeUsed
                          - targetSize
                          - numberShards
                          - totalUsed
                          - totalShards
                          - totalShardsFromSystemCollections
                          - imbalance
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
                          totalShardsFromSystemCollections:
                            description: |
                              The sum of system collection shards, counting leader shards only.
                            type: integer
                          imbalance:
                            description: |
                              The measure of the total imbalance. A high value indicates a high imbalance.
                            type: integer
                  pendingMoveShards:
                    description: |
                      The number of pending move shard operations.
                    type: number
                  todoMoveShards:
                    description: |
                      The number of planned move shard operations.
                    type: number
      tags:
        - Cluster
```

### Compute a set of move shard operations to improve balance

```openapi
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
              required:
                - version
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
                    Ignore system collections in the rebalance plan. (Default: `false`)
                  type: boolean
                piFactor:
                  description: |
                    A weighting factor that should remain untouched. (Default: `256e6`)

                    If a collection has more shards than there are DB-Servers, there can be a subtle
                    form of leader imbalance. Some DB-Servers may be responsible for more shards as
                    leader than others. The `piFactor` adjusts how much weight such imbalances get
                    in the overall imbalance score.
                  type: number
                databasesExcluded:
                  description: |
                    A list of database names to exclude from the analysis. (Default: `[]`)
                  type: array
                  items:
                    type: string
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
                required:
                  - code
                  - error
                  - result
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
                    required:
                      - imbalanceBefore
                      - imbalanceAfter
                      - moves
                    properties:
                      imbalanceBefore:
                        description: |
                          Imbalance before the suggested move shard operations are applied.
                        type: object
                        required:
                          - leader
                          - shards
                        properties:
                          leader:
                            description: |
                              Information about the leader imbalance.
                            type: object
                            required:
                              - weightUsed
                              - targetWeight
                              - numberShards
                              - leaderDupl
                              - totalWeight
                              - imbalance
                              - totalShards
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
                          shards:
                            description: |
                              Information about the shard imbalance.
                            type: object
                            required:
                              - sizeUsed
                              - targetSize
                              - numberShards
                              - totalUsed
                              - totalShards
                              - totalShardsFromSystemCollections
                              - imbalance
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
                              totalShardsFromSystemCollections:
                                description: |
                                  The sum of system collection shards, counting leader shards only.
                                type: integer
                              imbalance:
                                description: |
                                  The measure of the total imbalance. A high value indicates a high imbalance.
                                type: integer
                      imbalanceAfter:
                        description: |
                          Expected imbalance after the suggested move shard operations are applied.
                        type: object
                        required:
                          - leader
                          - shards
                        properties:
                          leader:
                            description: |
                              Information about the leader imbalance.
                            type: object
                            required:
                              - weightUsed
                              - targetWeight
                              - numberShards
                              - leaderDupl
                              - totalWeight
                              - imbalance
                              - totalShards
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
                          shards:
                            description: |
                              Information about the shard imbalance.
                            type: object
                            required:
                              - sizeUsed
                              - targetSize
                              - numberShards
                              - totalUsed
                              - totalShards
                              - totalShardsFromSystemCollections
                              - imbalance
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
                              totalShardsFromSystemCollections:
                                description: |
                                  The sum of system collection shards, counting leader shards only.
                                type: integer
                              imbalance:
                                description: |
                                  The measure of the total imbalance. A high value indicates a high imbalance.
                                type: integer
                      moves:
                        description: |
                          The suggested move shard operations.
                        type: array
                        items:
                          type: object
                          required:
                            - from
                            - to
                            - shard
                            - collection
                            - isLeader
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
      tags:
        - Cluster
```

### Execute a set of move shard operations

```openapi
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
              required:
                - version
                - moves
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
                    required:
                      - from
                      - to
                      - shard
                      - collection
                      - isLeader
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

### Compute and execute a set of move shard operations to improve balance

```openapi
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
              required:
                - version
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
                    Ignore system collections in the rebalance plan. (Default: `false`)
                  type: boolean
                piFactor:
                  description: |
                    A weighting factor that should remain untouched. (Default: `256e6`)

                    If a collection has more shards than there are DB-Servers, there can be a subtle
                    form of leader imbalance. Some DB-Servers may be responsible for more shards as
                    leader than others. The `piFactor` adjusts how much weight such imbalances get
                    in the overall imbalance score.
                  type: number
                databasesExcluded:
                  description: |
                    A list of database names to exclude from the analysis. (Default: `[]`)
                  type: array
                  items:
                    type: string
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
                required:
                  - code
                  - error
                  - result
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
                    required:
                      - imbalanceBefore
                      - imbalanceAfter
                      - moves
                    properties:
                      imbalanceBefore:
                        description: |
                          Imbalance before the suggested move shard operations are applied.
                        type: object
                        required:
                          - leader
                          - shards
                        properties:
                          leader:
                            description: |
                              Information about the leader imbalance.
                            type: object
                            required:
                              - weightUsed
                              - targetWeight
                              - numberShards
                              - leaderDupl
                              - totalWeight
                              - imbalance
                              - totalShards
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
                          shards:
                            description: |
                              Information about the shard imbalance.
                            type: object
                            required:
                              - sizeUsed
                              - targetSize
                              - numberShards
                              - totalUsed
                              - totalShards
                              - totalShardsFromSystemCollections
                              - imbalance
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
                              totalShardsFromSystemCollections:
                                description: |
                                  The sum of system collection shards, counting leader shards only.
                                type: integer
                              imbalance:
                                description: |
                                  The measure of the total imbalance. A high value indicates a high imbalance.
                                type: integer
                      imbalanceAfter:
                        description: |
                          Expected imbalance after the suggested move shard operations are applied.
                        type: object
                        required:
                          - leader
                          - shards
                        properties:
                          leader:
                            description: |
                              Information about the leader imbalance.
                            type: object
                            required:
                              - weightUsed
                              - targetWeight
                              - numberShards
                              - leaderDupl
                              - totalWeight
                              - imbalance
                              - totalShards
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
                          shards:
                            description: |
                              Information about the shard imbalance.
                            type: object
                            required:
                              - sizeUsed
                              - targetSize
                              - numberShards
                              - totalUsed
                              - totalShards
                              - totalShardsFromSystemCollections
                              - imbalance
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
                              totalShardsFromSystemCollections:
                                description: |
                                  The sum of system collection shards, counting leader shards only.
                                type: integer
                              imbalance:
                                description: |
                                  The measure of the total imbalance. A high value indicates a high imbalance.
                                type: integer
                      moves:
                        description: |
                          The suggested move shard operations.
                        type: array
                        items:
                          type: object
                          required:
                            - from
                            - to
                            - shard
                            - collection
                            - isLeader
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
      tags:
        - Cluster
```
