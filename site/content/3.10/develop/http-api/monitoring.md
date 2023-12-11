---
title: Monitoring
menuTitle: Monitoring
weight: 100
description: >-
  You can observe the activity and performance of ArangoDB deployments using
  the server logs, statistics, and metrics
pageToc:
  maxHeadlineLevel: 4
archetype: default
---
## Logs

### Get the global server logs

```openapi
paths:
  /_admin/log/entries:
    get:
      operationId: getLogEntries
      description: |
        Returns fatal, error, warning or info log messages from the server's global log.
        The result is a JSON object with the following properties:

        - **total**: the total amount of log entries before pagination
        - **messages**: an array with log messages that matched the criteria

        This API can be turned off via the startup option `--log.api-enabled`. In case
        the API is disabled, all requests will be responded to with HTTP 403. If the
        API is enabled, accessing it requires admin privileges, or even superuser
        privileges, depending on the value of the `--log.api-enabled` startup option.
      parameters:
        - name: upto
          in: query
          required: false
          description: |
            Returns all log entries up to log level `upto`. Note that `upto` must be:
            - `fatal` or `0`
            - `error` or `1`
            - `warning` or `2`
            - `info` or `3`
            - `debug`  or `4`
            The default value is `info`.
          schema:
            type: string
        - name: level
          in: query
          required: false
          description: |
            Returns all log entries of log level `level`. Note that the query parameters
            `upto` and `level` are mutually exclusive.
          schema:
            type: string
        - name: start
          in: query
          required: false
          description: |
            Returns all log entries such that their log entry identifier (`lid` .)
            is greater or equal to `start`.
          schema:
            type: number
        - name: size
          in: query
          required: false
          description: |
            Restricts the result to at most `size` log entries.
          schema:
            type: number
        - name: offset
          in: query
          required: false
          description: |
            Starts to return log entries skipping the first `offset` log entries. `offset`
            and `size` can be used for pagination.
          schema:
            type: number
        - name: search
          in: query
          required: false
          description: |
            Only return the log entries containing the text specified in `search`.
          schema:
            type: string
        - name: sort
          in: query
          required: false
          description: |
            Sort the log entries either ascending (if `sort` is `asc`) or descending
            (if `sort` is `desc`) according to their `id` values. Note that the `id`
            imposes a chronological order. The default value is `asc`.
          schema:
            type: string
        - name: serverId
          in: query
          required: false
          description: |
            Returns all log entries of the specified server. All other query parameters
            remain valid. If no serverId is given, the asked server
            will reply. This parameter is only meaningful on Coordinators.
          schema:
            type: string
      responses:
        '200':
          description: |
            is returned if the request is valid.
        '400':
          description: |
            is returned if invalid values are specified for `upto` or `level`.
        '403':
          description: |
            is returned if there are insufficient privileges to access the logs.
      tags:
        - Monitoring
```

### Get the global server logs (deprecated)

```openapi
paths:
  /_admin/log:
    get:
      operationId: getLog
      description: |
        {{</* warning */>}}
        This endpoint should no longer be used. It is deprecated from version 3.8.0 on.
        Use `/_admin/log/entries` instead, which provides the same data in a more
        intuitive and easier to process format.
        {{</* /warning */>}}

        Returns fatal, error, warning or info log messages from the server's global log.
        The result is a JSON object with the attributes described below.

        This API can be turned off via the startup option `--log.api-enabled`. In case
        the API is disabled, all requests will be responded to with HTTP 403. If the
        API is enabled, accessing it requires admin privileges, or even superuser
        privileges, depending on the value of the `--log.api-enabled` startup option.
      parameters:
        - name: upto
          in: query
          required: false
          description: |
            Returns all log entries up to log level `upto`. Note that `upto` must be:
            - `fatal` or `0`
            - `error` or `1`
            - `warning` or `2`
            - `info` or `3`
            - `debug`  or `4`
            The default value is `info`.
          schema:
            type: string
        - name: level
          in: query
          required: false
          description: |
            Returns all log entries of log level `level`. Note that the query parameters
            `upto` and `level` are mutually exclusive.
          schema:
            type: string
        - name: start
          in: query
          required: false
          description: |
            Returns all log entries such that their log entry identifier (`lid` value)
            is greater or equal to `start`.
          schema:
            type: number
        - name: size
          in: query
          required: false
          description: |
            Restricts the result to at most `size` log entries.
          schema:
            type: number
        - name: offset
          in: query
          required: false
          description: |
            Starts to return log entries skipping the first `offset` log entries. `offset`
            and `size` can be used for pagination.
          schema:
            type: number
        - name: search
          in: query
          required: false
          description: |
            Only return the log entries containing the text specified in `search`.
          schema:
            type: string
        - name: sort
          in: query
          required: false
          description: |
            Sort the log entries either ascending (if `sort` is `asc`) or descending
            (if `sort` is `desc`) according to their `lid` values. Note that the `lid`
            imposes a chronological order. The default value is `asc`.
          schema:
            type: string
        - name: serverId
          in: query
          required: false
          description: |
            Returns all log entries of the specified server. All other query parameters
            remain valid. If no serverId is given, the asked server
            will reply. This parameter is only meaningful on Coordinators.
          schema:
            type: string
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                required:
                  - lid
                  - level
                  - timestamp
                  - text
                  - topic
                  - totalAmount
                properties:
                  lid:
                    description: |
                      a list of log entry identifiers. Each log message is uniquely
                      identified by its @LIT{lid} and the identifiers are in ascending
                      order.
                    type: array
                    items:
                      type: string
                  level:
                    description: |
                      A list of the log levels for all log entries.
                    type: string
                  timestamp:
                    description: |
                      a list of the timestamps as seconds since 1970-01-01 for all log
                      entries.
                    type: array
                    items:
                      type: string
                  text:
                    description: |
                      a list of the texts of all log entries
                    type: string
                  topic:
                    description: |
                      a list of the topics of all log entries
                    type: string
                  totalAmount:
                    description: |
                      the total amount of log entries before pagination.
                    type: integer
        '400':
          description: |
            is returned if invalid values are specified for `upto` or `level`.
        '403':
          description: |
            is returned if there are insufficient privileges to access the logs.
      tags:
        - Monitoring
```

### Get the server log levels

```openapi
paths:
  /_admin/log/level:
    get:
      operationId: getLogLevel
      description: |
        Returns the server's current log level settings.
        The result is a JSON object with the log topics being the object keys, and
        the log levels being the object values.

        This API can be turned off via the startup option `--log.api-enabled`. In case
        the API is disabled, all requests will be responded to with HTTP 403. If the
        API is enabled, accessing it requires admin privileges, or even superuser
        privileges, depending on the value of the `--log.api-enabled` startup option.
      parameters:
        - name: serverId
          in: query
          required: false
          description: |
            Forwards the request to the specified server.
          schema:
            type: string
      responses:
        '200':
          description: |
            is returned if the request is valid
        '403':
          description: |
            is returned if there are insufficient privileges to read log levels.
      tags:
        - Monitoring
```

### Set the server log levels

```openapi
paths:
  /_admin/log/level:
    put:
      operationId: setLogLevel
      description: |
        Modifies and returns the server's current log level settings.
        The request body must be a JSON string with a log level or a JSON object with the
        log topics being the object keys and the log levels being the object values.

        If only a JSON string is specified as input, the log level is adjusted for the
        "general" log topic only. If a JSON object is specified as input, the log levels will
        be set only for the log topic mentioned in the input object, but preserved for every
        other log topic.
        To set the log level for all log levels to a specific value, it is possible to hand
        in the special pseudo log topic "all".

        The result is a JSON object with all available log topics being the object keys, and
        the adjusted log levels being the object values.

        Possible log levels are:
        - FATAL - There will be no way out of this. ArangoDB will go down after this message.
        - ERROR - This is an error. you should investigate and fix it. It may harm your production.
        - WARNING - This may be serious application-wise, but we don't know.
        - INFO - Something has happened, take notice, but no drama attached.
        - DEBUG - output debug messages
        - TRACE - trace - prepare your log to be flooded - don't use in production.

        This API can be turned off via the startup option `--log.api-enabled`. In case
        the API is disabled, all requests will be responded to with HTTP 403. If the
        API is enabled, accessing it requires admin privileges, or even superuser
        privileges, depending on the value of the `--log.api-enabled` startup option.
      parameters:
        - name: serverId
          in: query
          required: false
          description: |
            Forwards the request to the specified server.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                all:
                  description: |
                    Pseudo-topic to address all log topics.
                  type: string
                agency:
                  description: |
                    One of the possible log topics.
                  type: string
                agencycomm:
                  description: |
                    One of the possible log topics.
                  type: string
                agencystore:
                  description: |
                    One of the possible log topics.
                  type: string
                aql:
                  description: |
                    One of the possible log topics.
                  type: string
                arangosearch:
                  description: |
                    One of the possible log topics.
                  type: string
                audit-authentication:
                  description: |
                    One of the possible log topics (_Enterprise Edition only_).
                  type: string
                audit-authorization:
                  description: |
                    One of the possible log topics (_Enterprise Edition only_).
                  type: string
                audit-collection:
                  description: |
                    One of the possible log topics (_Enterprise Edition only_).
                  type: string
                audit-database:
                  description: |
                    One of the possible log topics (_Enterprise Edition only_).
                  type: string
                audit-document:
                  description: |
                    One of the possible log topics (_Enterprise Edition only_).
                  type: string
                audit-hotbackup:
                  description: |
                    One of the possible log topics (_Enterprise Edition only_).
                  type: string
                audit-service:
                  description: |
                    One of the possible log topics (_Enterprise Edition only_).
                  type: string
                audit-view:
                  description: |
                    One of the possible log topics (_Enterprise Edition only_).
                  type: string
                authentication:
                  description: |
                    One of the possible log topics.
                  type: string
                authorization:
                  description: |
                    One of the possible log topics.
                  type: string
                backup:
                  description: |
                    One of the possible log topics.
                  type: string
                bench:
                  description: |
                    One of the possible log topics.
                  type: string
                cache:
                  description: |
                    One of the possible log topics.
                  type: string
                cluster:
                  description: |
                    One of the possible log topics.
                  type: string
                clustercomm:
                  description: |
                    One of the possible log topics.
                  type: string
                collector:
                  description: |
                    One of the possible log topics.
                  type: string
                communication:
                  description: |
                    One of the possible log topics.
                  type: string
                config:
                  description: |
                    One of the possible log topics.
                  type: string
                crash:
                  description: |
                    One of the possible log topics.
                  type: string
                development:
                  description: |
                    One of the possible log topics.
                  type: string
                dump:
                  description: |
                    One of the possible log topics.
                  type: string
                engines:
                  description: |
                    One of the possible log topics.
                  type: string
                flush:
                  description: |
                    One of the possible log topics.
                  type: string
                general:
                  description: |
                    One of the possible log topics.
                  type: string
                graphs:
                  description: |
                    One of the possible log topics.
                  type: string
                heartbeat:
                  description: |
                    One of the possible log topics.
                  type: string
                httpclient:
                  description: |
                    One of the possible log topics.
                  type: string
                ldap:
                  description: |
                    One of the possible log topics (_Enterprise Edition only_).
                  type: string
                libiresearch:
                  description: |
                    One of the possible log topics.
                  type: string
                license:
                  description: |
                    One of the possible log topics (_Enterprise Edition only_).
                  type: string
                maintenance:
                  description: |
                    One of the possible log topics.
                  type: string
                memory:
                  description: |
                    One of the possible log topics.
                  type: string
                mmap:
                  description: |
                    One of the possible log topics.
                  type: string
                performance:
                  description: |
                    One of the possible log topics.
                  type: string
                pregel:
                  description: |
                    One of the possible log topics.
                  type: string
                queries:
                  description: |
                    One of the possible log topics.
                  type: string
                replication:
                  description: |
                    One of the possible log topics.
                  type: string
                requests:
                  description: |
                    One of the possible log topics.
                  type: string
                restore:
                  description: |
                    One of the possible log topics.
                  type: string
                rocksdb:
                  description: |
                    One of the possible log topics.
                  type: string
                security:
                  description: |
                    One of the possible log topics.
                  type: string
                ssl:
                  description: |
                    One of the possible log topics.
                  type: string
                startup:
                  description: |
                    One of the possible log topics.
                  type: string
                statistics:
                  description: |
                    One of the possible log topics.
                  type: string
                supervision:
                  description: |
                    One of the possible log topics.
                  type: string
                syscall:
                  description: |
                    One of the possible log topics.
                  type: string
                threads:
                  description: |
                    One of the possible log topics.
                  type: string
                trx:
                  description: |
                    One of the possible log topics.
                  type: string
                ttl:
                  description: |
                    One of the possible log topics.
                  type: string
                validation:
                  description: |
                    One of the possible log topics.
                  type: string
                v8:
                  description: |
                    One of the possible log topics.
                  type: string
                views:
                  description: |
                    One of the possible log topics.
                  type: string
      responses:
        '200':
          description: |
            is returned if the request is valid
        '400':
          description: |
            is returned when the request body contains invalid JSON.
        '403':
          description: |
            is returned if there are insufficient privileges to adjust log levels.
        '405':
          description: |
            is returned when an invalid HTTP method is used.
      tags:
        - Monitoring
```

### Get the structured log settings

```openapi
paths:
  /_admin/log/structured:
    get:
      operationId: getStructuredLog
      description: |
        Returns the server's current structured log settings.
        The result is a JSON object with the log parameters being the object keys, and
        `true` or `false` being the object values, meaning the parameters are either
        enabled or disabled.

        This API can be turned off via the startup option `--log.api-enabled`. In case
        the API is disabled, all requests will be responded to with HTTP 403. If the
        API is enabled, accessing it requires admin privileges, or even superuser
        privileges, depending on the value of the `--log.api-enabled` startup option.
      responses:
        '200':
          description: |
            is returned if the request is valid
        '403':
          description: |
            is returned if there are insufficient privileges to read structured log
            parameters.
        '405':
          description: |
            is returned when an invalid HTTP method is used.
      tags:
        - Monitoring
```

### Set the structured log settings

```openapi
paths:
  /_admin/log/structured:
    put:
      operationId: setStructuredLog
      description: |
        Modifies and returns the server's current structured log settings.
        The request body must be a JSON object with the structured log parameters
        being the object keys and `true` or `false` object values, for either
        enabling or disabling the parameters.

        The result is a JSON object with all available structured log parameters being
        the object keys, and `true` or `false` being the object values, meaning the
        parameter in the object key is either enabled or disabled.

        This API can be turned off via the startup option `--log.api-enabled`. In case
        the API is disabled, all requests will be responded to with HTTP 403. If the
        API is enabled, accessing it requires admin privileges, or even superuser
        privileges, depending on the value of the `--log.api-enabled` startup option.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                database:
                  description: |
                    One of the possible log parameters.
                  type: boolean
                username:
                  description: |
                    One of the possible log parameters.
                  type: boolean
                url:
                  description: |
                    One of the possible log parameters.
                  type: boolean
      responses:
        '200':
          description: |
            is returned if the request is valid
        '403':
          description: |
            is returned if there are insufficient privileges to adjust log levels.
        '405':
          description: |
            is returned when an invalid HTTP method is used.
      tags:
        - Monitoring
```

## Statistics

### Get the statistics

```openapi
paths:
  /_admin/statistics:
    get:
      operationId: getStatistics
      description: |
        {{</* warning */>}}
        This endpoint should no longer be used. It is deprecated from version 3.8.0 on.
        Use `/_admin/metrics/v2` instead, which provides the data exposed by this API
        and a lot more.
        {{</* /warning */>}}

        Returns the statistics information. The returned object contains the
        statistics figures grouped together according to the description returned by
        `/_admin/statistics-description`. For instance, to access a figure `userTime`
        from the group `system`, you first select the sub-object describing the
        group stored in `system` and in that sub-object the value for `userTime` is
        stored in the attribute of the same name.

        In case of a distribution, the returned object contains the total count in
        `count` and the distribution list in `counts`. The sum (or total) of the
        individual values is returned in `sum`.

        The transaction statistics show the local started, committed and aborted
        transactions as well as intermediate commits done for the server queried. The
        intermediate commit count will only take non zero values for the RocksDB
        storage engine. Coordinators do almost no local transactions themselves in
        their local databases, therefor cluster transactions (transactions started on a
        Coordinator that require DB-Servers to finish before the transactions is
        committed cluster wide) are just added to their local statistics. This means
        that the statistics you would see for a single server is roughly what you can
        expect in a cluster setup using a single Coordinator querying this Coordinator.
        Just with the difference that cluster transactions have no notion of
        intermediate commits and will not increase the value.
      responses:
        '200':
          description: |
            Statistics were returned successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - time
                  - errorMessage
                  - enabled
                  - system
                  - client
                  - http
                  - server
                properties:
                  error:
                    description: |
                      boolean flag to indicate whether an error occurred (`false` in this case)
                    type: boolean
                  code:
                    description: |
                      the HTTP status code - 200 in this case
                    type: integer
                  time:
                    description: |
                      the current server timestamp
                    type: integer
                  errorMessage:
                    description: |
                      a descriptive error message
                    type: string
                  enabled:
                    description: |
                      `true` if the server has the statistics module enabled. If not, don't expect any values.
                    type: boolean
                  system:
                    description: |
                      metrics gathered from the system about this process; may depend on the host OS
                    type: object
                    required:
                      - minorPageFaults
                      - majorPageFaults
                      - userTime
                      - systemTime
                      - numberOfThreads
                      - residentSize
                      - residentSizePercent
                      - virtualSize
                    properties:
                      minorPageFaults:
                        description: |
                          pagefaults
                        type: integer
                      majorPageFaults:
                        description: |
                          pagefaults
                        type: integer
                      userTime:
                        description: |
                          the user CPU time used by the server process
                        type: number
                      systemTime:
                        description: |
                          the system CPU time used by the server process
                        type: number
                      numberOfThreads:
                        description: |
                          the number of threads in the server
                        type: integer
                      residentSize:
                        description: |
                          RSS of process
                        type: integer
                      residentSizePercent:
                        description: |
                          RSS of process in %
                        type: number
                      virtualSize:
                        description: |
                          VSS of the process
                        type: integer
                  client:
                    description: |
                      information about the connected clients and their resource usage
                    type: object
                    required:
                      - connectionTime
                      - totalTime
                      - requestTime
                      - queueTime
                      - ioTime
                      - bytesSent
                      - bytesReceived
                      - httpConnections
                    properties:
                      connectionTime:
                        description: |
                          total connection times
                        type: object
                        required:
                          - sum
                          - count
                          - counts
                        properties:
                          sum:
                            description: |
                              summarized value of all counts
                            type: number
                          count:
                            description: |
                              number of values summarized
                            type: integer
                          counts:
                            description: |
                              array containing the values
                            type: array
                            items:
                              type: integer
                      totalTime:
                        description: |
                          the system time
                        type: object
                        required:
                          - sum
                          - count
                          - counts
                        properties:
                          sum:
                            description: |
                              summarized value of all counts
                            type: number
                          count:
                            description: |
                              number of values summarized
                            type: integer
                          counts:
                            description: |
                              array containing the values
                            type: array
                            items:
                              type: integer
                      requestTime:
                        description: |
                          the request times
                        type: object
                        required:
                          - sum
                          - count
                          - counts
                        properties:
                          sum:
                            description: |
                              summarized value of all counts
                            type: number
                          count:
                            description: |
                              number of values summarized
                            type: integer
                          counts:
                            description: |
                              array containing the values
                            type: array
                            items:
                              type: integer
                      queueTime:
                        description: |
                          the time requests were queued waiting for processing
                        type: object
                        required:
                          - sum
                          - count
                          - counts
                        properties:
                          sum:
                            description: |
                              summarized value of all counts
                            type: number
                          count:
                            description: |
                              number of values summarized
                            type: integer
                          counts:
                            description: |
                              array containing the values
                            type: array
                            items:
                              type: integer
                      ioTime:
                        description: |
                          IO Time
                        type: object
                        required:
                          - sum
                          - count
                          - counts
                        properties:
                          sum:
                            description: |
                              summarized value of all counts
                            type: number
                          count:
                            description: |
                              number of values summarized
                            type: integer
                          counts:
                            description: |
                              array containing the values
                            type: array
                            items:
                              type: integer
                      bytesSent:
                        description: |
                          number of bytes sent to the clients
                        type: object
                        required:
                          - sum
                          - count
                          - counts
                        properties:
                          sum:
                            description: |
                              summarized value of all counts
                            type: number
                          count:
                            description: |
                              number of values summarized
                            type: integer
                          counts:
                            description: |
                              array containing the values
                            type: array
                            items:
                              type: integer
                      bytesReceived:
                        description: |
                          number of bytes received from the clients
                        type: object
                        required:
                          - sum
                          - count
                          - counts
                        properties:
                          sum:
                            description: |
                              summarized value of all counts
                            type: number
                          count:
                            description: |
                              number of values summarized
                            type: integer
                          counts:
                            description: |
                              array containing the values
                            type: array
                            items:
                              type: integer
                      httpConnections:
                        description: |
                          the number of open http connections
                        type: integer
                  http:
                    description: |
                      the numbers of requests by Verb
                    type: object
                    required:
                      - requestsTotal
                      - requestsAsync
                      - requestsGet
                      - requestsHead
                      - requestsPost
                      - requestsPut
                      - requestsPatch
                      - requestsDelete
                      - requestsOptions
                      - requestsOther
                    properties:
                      requestsTotal:
                        description: |
                          total number of http requests
                        type: integer
                      requestsAsync:
                        description: |
                          total number of asynchronous http requests
                        type: integer
                      requestsGet:
                        description: |
                          No of requests using the GET-verb
                        type: integer
                      requestsHead:
                        description: |
                          No of requests using the HEAD-verb
                        type: integer
                      requestsPost:
                        description: |
                          No of requests using the POST-verb
                        type: integer
                      requestsPut:
                        description: |
                          No of requests using the PUT-verb
                        type: integer
                      requestsPatch:
                        description: |
                          No of requests using the PATCH-verb
                        type: integer
                      requestsDelete:
                        description: |
                          No of requests using the DELETE-verb
                        type: integer
                      requestsOptions:
                        description: |
                          No of requests using the OPTIONS-verb
                        type: integer
                      requestsOther:
                        description: |
                          No of requests using the none of the above identified verbs
                        type: integer
                  server:
                    description: |
                      statistics of the server
                    type: object
                    required:
                      - uptime
                      - physicalMemory
                      - transactions
                      - v8Context
                      - threads
                    properties:
                      uptime:
                        description: |
                          time the server is up and running
                        type: integer
                      physicalMemory:
                        description: |
                          available physical memory on the server
                        type: integer
                      transactions:
                        description: |
                          Statistics about transactions
                        type: object
                        required:
                          - started
                          - committed
                          - aborted
                          - intermediateCommits
                        properties:
                          started:
                            description: |
                              the number of started transactions
                            type: integer
                          committed:
                            description: |
                              the number of committed transactions
                            type: integer
                          aborted:
                            description: |
                              the number of aborted transactions
                            type: integer
                          intermediateCommits:
                            description: |
                              the number of intermediate commits done
                            type: integer
                      v8Context:
                        description: |
                          Statistics about the V8 javascript contexts
                        type: object
                        required:
                          - available
                          - busy
                          - dirty
                          - free
                          - max
                          - min
                          - memory
                        properties:
                          available:
                            description: |
                              the number of currently spawned V8 contexts
                            type: integer
                          busy:
                            description: |
                              the number of currently active V8 contexts
                            type: integer
                          dirty:
                            description: |
                              the number of contexts that were previously used, and should now be garbage collected before being re-used
                            type: integer
                          free:
                            description: |
                              the number of V8 contexts that are free to use
                            type: integer
                          max:
                            description: |
                              the maximum number of V8 concurrent contexts we may spawn as configured by --javascript.v8-contexts
                            type: integer
                          min:
                            description: |
                              the minimum number of V8 contexts that are spawned as configured by --javascript.v8-contexts-minimum
                            type: integer
                          memory:
                            description: |
                              a list of V8 memory / garbage collection watermarks; Refreshed on every garbage collection run;
                              Preserves min/max memory used at that time for 10 seconds
                            type: array
                            items:
                              type: object
                              required:
                                - contextId
                                - tMax
                                - countOfTimes
                                - heapMax
                                - heapMin
                              properties:
                                contextId:
                                  description: |
                                    ID of the context this set of memory statistics is from
                                  type: integer
                                tMax:
                                  description: |
                                    the timestamp where the 10 seconds interval started
                                  type: number
                                countOfTimes:
                                  description: |
                                    how many times was the garbage collection run in these 10 seconds
                                  type: integer
                                heapMax:
                                  description: |
                                    High watermark of all garbage collection runs in 10 seconds
                                  type: integer
                                heapMin:
                                  description: |
                                    Low watermark of all garbage collection runs in these 10 seconds
                                  type: integer
                      threads:
                        description: |
                          Statistics about the server worker threads (excluding V8 specific or jemalloc specific threads and system threads)
                        type: object
                        required:
                          - scheduler-threads
                          - in-progress
                          - queued
                        properties:
                          scheduler-threads:
                            description: |
                              The number of spawned worker threads
                            type: integer
                          in-progress:
                            description: |
                              The number of currently busy worker threads
                            type: integer
                          queued:
                            description: |
                              The number of jobs queued up waiting for worker threads becoming available
                            type: integer
        '404':
          description: |
            Statistics are disabled on the instance.
      tags:
        - Monitoring
```

**Examples**

```curl
---
description: ''
name: RestAdminStatistics1
---
var url = "/_admin/statistics";
var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
```

### Get the statistics description

```openapi
paths:
  /_admin/statistics-description:
    get:
      operationId: getStatisticsDescription
      description: |
        {{</* warning */>}}
        This endpoint should no longer be used. It is deprecated from version 3.8.0 on.
        Use `/_admin/metrics/v2` instead, which provides the data exposed by the
        statistics API and a lot more.
        {{</* /warning */>}}

        Returns a description of the statistics returned by `/_admin/statistics`.
        The returned objects contains an array of statistics groups in the attribute
        `groups` and an array of statistics figures in the attribute `figures`.

        A statistics group is described by

        - `group`: The identifier of the group.
        - `name`: The name of the group.
        - `description`: A description of the group.

        A statistics figure is described by

        - `group`: The identifier of the group to which this figure belongs.
        - `identifier`: The identifier of the figure. It is unique within the group.
        - `name`: The name of the figure.
        - `description`: A description of the figure.
        - `type`: Either `current`, `accumulated`, or `distribution`.
        - `cuts`: The distribution vector.
        - `units`: Units in which the figure is measured.
      responses:
        '200':
          description: |
            Description was returned successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - groups
                  - figures
                  - code
                  - error
                properties:
                  groups:
                    description: |
                      A statistics group
                    type: array
                    items:
                      type: object
                      required:
                        - group
                        - name
                        - description
                      properties:
                        group:
                          description: |
                            The identifier of the group.
                          type: string
                        name:
                          description: |
                            The name of the group.
                          type: string
                        description:
                          description: |
                            A description of the group.
                          type: string
                  figures:
                    description: |
                      A statistics figure
                    type: array
                    items:
                      type: object
                      required:
                        - group
                        - identifier
                        - name
                        - description
                        - type
                        - cuts
                        - units
                      properties:
                        group:
                          description: |
                            The identifier of the group to which this figure belongs.
                          type: string
                        identifier:
                          description: |
                            The identifier of the figure. It is unique within the group.
                          type: string
                        name:
                          description: |
                            The name of the figure.
                          type: string
                        description:
                          description: |
                            A description of the figure.
                          type: string
                        type:
                          description: |
                            Either `current`, `accumulated`, or `distribution`.
                          type: string
                        cuts:
                          description: |
                            The distribution vector.
                          type: string
                        units:
                          description: |
                            Units in which the figure is measured.
                          type: string
                  code:
                    description: |
                      the HTTP status code
                    type: integer
                  error:
                    description: |
                      the error, `false` in this case
                    type: boolean
      tags:
        - Monitoring
```

**Examples**

```curl
---
description: ''
name: RestAdminStatisticsDescription1
---
var url = "/_admin/statistics-description";
var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
```

## Metrics

_arangod_ exports metrics in the
[Prometheus format](https://prometheus.io/docs/instrumenting/exposition_formats/).
You can use these metrics to monitor the healthiness and performance of the
system. The thresholds for alerts are also described for relevant metrics.

{{< warning >}}
The list of exposed metrics is subject to change in every minor version.
While they should stay backwards compatible for the most part, some metrics are
coupled to specific internals that may be replaced by other mechanisms in the
future.
{{< /warning >}}

### Metrics API v2

#### Get the metrics

```openapi
paths:
  /_admin/metrics/v2:
    get:
      operationId: getMetricsV2
      description: |
        Returns the instance's current metrics in Prometheus format. The
        returned document collects all instance metrics, which are measured
        at any given time and exposes them for collection by Prometheus.

        The document contains different metrics and metrics groups dependent
        on the role of the queried instance. All exported metrics are
        published with the prefix `arangodb_` or `rocksdb_` to distinguish them from
        other collected data.

        The API then needs to be added to the Prometheus configuration file
        for collection.
      parameters:
        - name: serverId
          in: query
          required: false
          description: |
            Returns metrics of the specified server. If no serverId is given, the asked
            server will reply. This parameter is only meaningful on Coordinators.
          schema:
            type: string
      responses:
        '200':
          description: |
            Metrics were returned successfully.
        '404':
          description: |
            The metrics API may be disabled using `--server.export-metrics-api false`
            setting in the server. In this case, the result of the call indicates the API
            to be not found.
      tags:
        - Monitoring
```

**Examples**

```curl
---
description: ''
name: RestAdminMetricsV2
---
var url = "/_admin/metrics/v2";
var response = logCurlRequest('GET', url);

assert(response.code === 200);

logPlainResponse(response);
```

{{% metrics %}}

### Metrics API

#### Get the metrics (deprecated)

```openapi
paths:
  /_admin/metrics:
    get:
      operationId: getMetrics
      description: |
        {{</* warning */>}}
        This endpoint should no longer be used. It is deprecated from version 3.8.0 on.
        Use `/_admin/metrics/v2` instead. From version 3.10.0 onward, `/_admin/metrics`
        returns the same metrics as `/_admin/metrics/v2`.
        {{</* /warning */>}}

        Returns the instance's current metrics in Prometheus format. The
        returned document collects all instance metrics, which are measured
        at any given time and exposes them for collection by Prometheus.

        The document contains different metrics and metrics groups dependent
        on the role of the queried instance. All exported metrics are
        published with the `arangodb_` or `rocksdb_` string to distinguish
        them from other collected data.

        The API then needs to be added to the Prometheus configuration file
        for collection.
      parameters:
        - name: serverId
          in: query
          required: false
          description: |
            Returns metrics of the specified server. If no serverId is given, the asked
            server will reply. This parameter is only meaningful on Coordinators.
          schema:
            type: string
      responses:
        '200':
          description: |
            Metrics were returned successfully.
        '404':
          description: |
            The metrics API may be disabled using `--server.export-metrics-api false`
            setting in the server. In this case, the result of the call indicates the API
            to be not found.
      tags:
        - Monitoring
```

**Examples**

```curl
---
description: ''
name: RestAdminMetrics
---
var url = "/_admin/metrics";
var response = logCurlRequest('GET', url);

assert(response.code === 200);

logPlainResponse(response);
```
