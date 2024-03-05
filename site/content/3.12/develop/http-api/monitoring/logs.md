---
title: Logs
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
