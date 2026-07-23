---
title: Replication logger commands
menuTitle: Replication Logger
weight: 10
description: ''
---
All data-modification operations are written to the server's write-ahead log and are
not handled by a separate replication logger.

You can query the current state of the logger and fetch the latest changes
written by the logger with the `logger-state` method. The operations return the
state and data from the write-ahead log.

To query the "recent" operations from the write-ahead log, the HTTP interface
also provides the `/_api/wal/tail` endpoint. It should be used by
replication clients to incrementally fetch updates from the server.

## Get the replication logger state

```openapi
paths:
  /_db/{database-name}/_api/replication/logger-state:
    get:
      operationId: getReplicationLoggerState
      description: |
        Returns the current state of the server's replication logger. The state will
        include information about whether the logger is running and about the last
        logged tick value. This tick value is important for incremental fetching of
        data.

        The body of the response contains a JSON object with the following
        attributes:

        - `state`: the current logger state as a JSON object with the following
          sub-attributes:

          - `running`: whether or not the logger is running

          - `lastLogTick`: the tick value of the latest tick the logger has logged.
            This value can be used for incremental fetching of log data.

          - `totalEvents`: total number of events logged since the server was started.
            The value is not reset between multiple stops and re-starts of the logger.

          - `time`: the current date and time on the logger server

        - `server`: a JSON object with the following sub-attributes:

          - `version`: the logger server's version

          - `serverId`: the logger server's id

        - `clients`: returns the last fetch status by replication clients connected to
          the logger. Each client is returned as a JSON object with the following attributes:

          - `syncerId`: id of the client syncer

          - `serverId`: server id of client

          - `lastServedTick`: last tick value served to this client via the WAL tailing API

          - `time`: date and time when this client last called the WAL tailing API
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
      responses:
        '200':
          description: |
            is returned if the logger state could be determined successfully.
        '405':
          description: |
            is returned when an invalid HTTP method is used.
        '500':
          description: |
            is returned if the logger state could not be determined.
      tags:
        - Replication
```

**Examples**

```curl
---
description: |-
  Returns the state of the replication logger.
name: RestReplicationLoggerStateActive
---
var re = require("@arangodb/replication");

var url = "/_api/replication/logger-state";

var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
```
