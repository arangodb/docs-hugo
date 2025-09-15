---
title: HTTP interface for server logs
menuTitle: Logs
weight: 5
description: >-
  Server events and errors are logged depending on the defined log levels for
  the available log topics
---
Whether events are logged to a file, syslog, or only an attached terminal depends
on the [log startup options](../../../components/arangodb-server/options.md#log).

See [Log levels](../../../operations/administration/log-levels.md) for a detailed
description of the `FATAL`, `ERROR`, and other levels of log messages.

The permissions required to use the `/_admin/log*` endpoints depends on the
setting of the [`--log.api-enabled` startup option](../../../components/arangodb-server/options.md#--logapi-enabled).

## Get the global server logs

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
            - `debug` or `4`
            - `trace` or `5`
          schema:
            #type: [string, integer]
            default: info
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
            Returns all log entries such that their log entry identifier (`id` value)
            is greater or equal to `start`.
          schema:
            type: number
            default: 0
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
            default: 0
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
            imposes a chronological order.
          schema:
            type: string
            default: asc
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

## Get the global server logs (deprecated)

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
            - `debug` or `4`
            - `trace` or `5`
          schema:
            #type: [string, integer]
            default: info
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
            default: 0
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
            default: 0
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
            imposes a chronological order.
          schema:
            type: string
            default: asc
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

## Get the server log levels

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
        - name: withAppenders
          in: query
          required: false
          description: |
            Set this option to `true` to return the individual log level settings
            of all log outputs (`appenders`) as well as the `global` settings.

            The response structure is as follows:

            ```json
            {
              "global": {
                "agency": "INFO",
                "agencycomm": "INFO",
                "agencystore": "WARNING",
                ...
              },
              "appenders": {
                "-": {
                  "agency": "INFO",
                  "agencycomm": "INFO",
                  "agencystore": "WARNING",
                  ...
                },
                "file:///path/to/file": {
                  "agency": "INFO",
                  "agencycomm": "INFO",
                  "agencystore": "WARNING",
                  ...
                },
                ...
              }
            }
            ```
          schema:
            type: boolean
            default: false
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

## Set the server log levels

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
        - `FATAL` - Only critical errors are logged after which the _arangod_
          process terminates.
        - `ERROR` - Only errors are logged. You should investigate and fix errors
          as they may harm your production.
        - `WARNING` - Errors and warnings are logged. Warnings may be serious
          application-wise and can indicate issues that might lead to errors
          later on.
        - `INFO` - Errors, warnings, and general information is logged.
        - `DEBUG` - Outputs debug messages used in the development of ArangoDB
          in addition to the above.
        - `TRACE` - Logs detailed tracing of operations in addition to the above.
          This can flood the log. Don't use this log level in production.

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
        - name: withAppenders
          in: query
          required: false
          description: |
            Set this option to `true` to set individual log level settings
            for log outputs (`appenders`). The request and response structure is
            as follows:

            ```json
            {
              "global": {
                "agency": "INFO",
                "agencycomm": "INFO",
                "agencystore": "WARNING",
                ...
              },
              "appenders": {
                "-": {
                  "agency": "INFO",
                  "agencycomm": "INFO",
                  "agencystore": "WARNING",
                  ...
                },
                "file:///path/to/file": {
                  "agency": "INFO",
                  "agencycomm": "INFO",
                  "agencystore": "WARNING",
                  ...
                },
                ...
              }
            }
            ```

            Changing the `global` settings affects all outputs and is the same
            as setting a log level with this option turned off.
          schema:
            type: boolean
            default: false
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
                    Agents use this log topic to inform about any activity
                    including the RAFT consensus gossip.
                  type: string
                agencycomm:
                  description: |
                    DB-Servers and Coordinators log the requests they send to the
                    Agency.
                  type: string
                agencystore:
                  description: |
                    Optional verbose logging of Agency write operations.
                  type: string
                aql:
                  description: |
                    Logs information about the AQL query optimization and
                    execution. DB-Servers and Coordinators log the cluster-internal
                    communication around AQL queries. It also reports the AQL
                    memory limit on startup.
                  type: string
                arangosearch:
                  description: |
                    Logs information related to ArangoSearch including Analyzers,
                    the column cache, and the commit and consolidation threads.
                  type: string
                audit-authentication:
                  description: |
                    Controls whether events such as successful logins and
                    missing or wrong credentials are written to the audit log.
                  type: string
                audit-authorization:
                  description: |
                    Controls whether events such as users trying to access databases
                    without the necessary permissions are written to the audit log.
                  type: string
                audit-collection:
                  description: |
                    Controls whether events about collections creation, truncation,
                    and deletion are written to the audit log.
                  type: string
                audit-database:
                  description: |
                    Controls whether events about database creation and deletion
                    are written to the audit log.
                  type: string
                audit-document:
                  description: |
                    Controls whether document read and write events are written
                    to the audit log.
                  type: string
                audit-hotbackup:
                  description: |
                    Controls whether the Hot Backup creation, restore, and delete
                    events are written to the audit log.
                  type: string
                audit-service:
                  description: |
                    Controls whether the start and stop events of the audit
                    service are written to the audit log.
                  type: string
                audit-view:
                  description: |
                    Controls whether events about View creation and deletion
                    are written to the audit log.
                  type: string
                authentication:
                  description: |
                    Logs events related to authentication, for example, when a
                    JWT secret is generated or a token is validated against a secret.
                  type: string
                authorization:
                  description: |
                    Logs when a user has insufficient permissions for a request.
                  type: string
                backup:
                  description: |
                    Logs events related to Hot Backup.
                  type: string
                bench:
                  description: |
                    Logs events related to benchmarking with _arangobench_.
                  type: string
                cache:
                  description: |
                    Logs events related to caching documents and index entries
                    as well as the cache configuration on startup.
                  type: string
                cluster:
                  description: |
                    Logs information related to the cluster-internal communication
                    as well as cluster operations. This includes changes to the
                    state and readiness of DB-Servers and connectivity checks
                    on Coordinators.
                  type: string
                communication:
                  description: |
                    Logs lower-level network connection and communication events.
                  type: string
                config:
                  description: |
                    Logs information related to the startup options and server
                    configuration.
                  type: string
                crash:
                  description: |
                    Logs information about a fatal error including a backtrace
                    before the process terminates.
                  type: string
                deprecation:
                  description: |
                    Warns about deprecated features and the usage of options that
                    will not be allowed or have no effect in a future version.
                  type: string
                development:
                  description: |
                    This log topic is reserved for the development of ArangoDB.
                  type: string
                dump:
                  description: |
                    Logs events related to dumping data with _arangodump_.
                  type: string
                engines:
                  description: |
                    Logs various information related to ArangoDB's use of the
                    RocksDB storage engine, like the initialization and
                    file operations.
                    
                    RocksDB's internal log messages are passed through using the
                    `rocksdb` log topic.
                  type: string
                flush:
                  description: |
                    Logs events related to flushing data from memory to disk.
                  type: string
                general:
                  description: |
                    Logs all messages of general interest and that don't fit
                    under any of the other log topics. For example, it reports
                    the ArangoDB version and the detected operating system and
                    memory on startup.
                  type: string
                graphs:
                  description: |
                    Logs information related to graph operations including
                    graph traversal and path search tracing.
                  type: string
                heartbeat:
                  description: |
                    Logs everything related to the cluster heartbeat for
                    monitoring the intra-connectivity.
                  type: string
                httpclient:
                  description: |
                    Logs the activity of the HTTP request subsystem that is used
                    in replication, client tools, and V8.
                  type: string
                libiresearch:
                  description: |
                    Logs the internal log messages of IResearch, the underlying
                    library of ArangoSearch.
                  type: string
                license:
                  description: |
                    Logs events related to the license management like the
                    expiration of a license.
                  type: string
                maintenance:
                  description: |
                    Logs the operations of the cluster maintenance including
                    shard locking and collection creation.
                  type: string
                memory:
                  description: |
                    Logs the memory configuration on startup and reports
                    problems with memory alignment and operating system settings.
                  type: string
                queries:
                  description: |
                    Logs slow queries as well as internal details about the
                    execution of AQL queries at low log levels.
                  type: string
                replication:
                  description: |
                    Logs information related to the data replication within a cluster.
                  type: string
                requests:
                  description: |
                    Logs the handling of internal and external requests and
                    can include IP addresses, endpoints, and HTTP headers and
                    bodies when using low log levels.

                    It overlaps with the network `communication` log topic.
                  type: string
                restore:
                  description: |
                    This log topic is only used by _arangorestore_.
                  type: string
                rocksdb:
                  description: |
                    Logs RocksDB's internal log messages as well RocksDB
                    background errors.

                    Information related to ArangoDB's use of the
                    RocksDB storage engine uses the `engines` log topic.
                  type: string
                security:
                  description: |
                    Logs the security configuration for V8.
                  type: string
                ssl:
                  description: |
                    Logs information related to the in-transit encryption of
                    network communication using SSL/TLS.
                  type: string
                startup:
                  description: |
                    Logs information related to the startup and shutdown of a
                    server process as well as anything related to upgrading the
                    database directory.
                  type: string
                statistics:
                  description: |
                    Logs events related to processing server statistics.
                    This is independent of server metrics.
                  type: string
                supervision:
                  description: |
                    Logs information related to the Agency's cluster supervision.
                  type: string
                syscall:
                  description: |
                    Logs events related to calling operating system functions.
                    It reports problems related to file descriptors and the
                    server process monitoring.
                  type: string
                threads:
                  description: |
                    Logs information related to the use of operating system
                    threads and the threading configuration of ArangoDB.
                  type: string
                trx:
                  description: |
                    Logs information about transaction management.
                  type: string
                ttl:
                  description: |
                    Logs the activity of the background thread for
                    time-to-live (TTL) indexes.
                  type: string
                validation:
                  description: |
                    Logs when the schema validation fails for a document.
                  type: string
                v8:
                  description: |
                    Logs various information related to ArangoDB's use of the
                    V8 JavaScript engine, like the initialization as well as
                    entering and exiting contexts.
                  type: string
                views:
                  description: |
                    Logs certain events related to ArangoSearch Views.
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

## Reset the server log levels

<small>Introduced in: v3.12.1</small>

```openapi
paths:
  /_admin/log/level:
    delete:
      operationId: resetLogLevel
      description: |
        Revert the server's log level settings to the values they had at startup,
        as determined by the startup options specified on the command-line, a
        configuration file, and the factory defaults.

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
            The log levels have been reset successfully.
        '403':
          description: |
            You have insufficient privileges to reset the log levels.
      tags:
        - Monitoring
```

## Get the structured log settings

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

## Set the structured log settings

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

## Get recent API calls

```openapi
paths:
  /_db/{database-name}/_admin/server/api-calls:
    get:
      operationId: getRecentApiCalls
      description: |
        Get a list of the most recent requests with a timestamp and the endpoint.
        This feature is for debugging purposes.

        You can control how much memory is used to record API calls with the
        `--server.api-recording-memory-limit` startup option.

        You can disable this endpoint
        with the `--log.recording-api-enabled` startup option.

        Whether API calls are recorded is independently controlled by the
        `--server.api-call-recording` startup option.
        The endpoint returns an empty list of calls if turned off.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database.
          schema:
            type: string
      responses:
        '200':
          description: |
            Returns the recorded API calls.
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
                      The request result.
                    type: object
                    required:
                      - calls
                    properties:
                      calls:
                        description: |
                          A list of the recent API calls. Empty if API call recording is disabled.
                        type: array
                        items:
                          type: object
                          properties:
                            timeStamp:
                              description: |
                                The date and time of the request in ISO 8601 format.
                              type: string
                              format: date-time
                            requestType:
                              description: |
                                The HTTP request method.
                              type: string
                              enum: [GET, PATCH, PUT, DELETE, HEAD]
                            path:
                              description: |
                                The HTTP request path excluding the database prefix (`/_db/<database-name>`).
                              type: string
                            database:
                              description: |
                                The database name.
                              type: string
        '401':
          description: |
            The user account has insufficient permissions for the selected database.
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
        '403':
          description: |
            The recording API has been disabled.
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
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '501':
          description: |
            The method has not been called on a Coordinator or single server.
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
        - Monitoring
```

{{< comment >}}
Example not generated because it changes on every run and returns up to 25MB of data.
{{< /comment >}}

```bash
curl --header 'accept: application/json' --dump - http://localhost:8529/_admin/server/api-calls
```

{{< details summary="Show output" >}}
```bash
HTTP/1.1 200 OK
X-Arango-Queue-Time-Seconds: 0.000000
Strict-Transport-Security: max-age=31536000 ; includeSubDomains
Expires: 0
Pragma: no-cache
Cache-Control: no-cache, no-store, must-revalidate, pre-check=0, post-check=0, max-age=0, s-maxage=0
Content-Security-Policy: frame-ancestors 'self'; form-action 'self';
X-Content-Type-Options: nosniff
Server: ArangoDB
Connection: Keep-Alive
Content-Type: application/json; charset=utf-8
Content-Length: 257

{
  "error": false,
  "code": 200,
  "result": {
    "calls": [
      {
        "timeStamp": "2025-06-11T14:41:53Z",
        "requestType": "GET",
        "path": "/_admin/server/api-calls",
        "database": "_system"
      },
      {
        "timeStamp": "2025-06-11T14:41:51Z",
        "requestType": "GET",
        "path": "/_api/version",
        "database": "myDB"
      }
    ]
  }
}
```
{{< /details >}}
