---
title: Statistics
menuTitle: Statistics
weight: 10
description: >-
  Server statistics let you monitor the system but they are superseded by
  the more detailed server metrics
---
## Get the statistics

```openapi
paths:
  /_db/{database-name}/_admin/statistics:
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
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database. If the `--server.harden` startup option is enabled,
            administrate access to the `_system` database is required.
          schema:
            type: string
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

## Get the statistics description

```openapi
paths:
  /_db/{database-name}/_admin/statistics-description:
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
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database. If the `--server.harden` startup option is enabled,
            administrate access to the `_system` database is required.
          schema:
            type: string
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
