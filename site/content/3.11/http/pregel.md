---
title: Pregel HTTP API
weight: 45
description: >-
  The HTTP API for Pregel lets you execute, cancel, and list Pregel jobs
archetype: default
---
See [Distributed Iterative Graph Processing (Pregel)](../core-topics/data-science/pregel/_index.md)
for details.

```openapi
## Start Pregel job execution

paths:
  /_api/control_pregel:
    post:
      operationId: createPregelJob
      description: |
        To start an execution you need to specify the algorithm name and a named graph
        (SmartGraph in cluster). Alternatively you can specify the vertex and edge
        collections. Additionally you can specify custom parameters which vary for each
        algorithm, see [Pregel - Available Algorithms](../core-topics/data-science/pregel/pregel-algorithms.md).
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                algorithm:
                  description: |
                    Name of the algorithm. One of:
                    - `"pagerank"` - Page Rank
                    - `"sssp"` - Single-Source Shortest Path
                    - `"connectedcomponents"` - Connected Components
                    - `"wcc"` - Weakly Connected Components
                    - `"scc"` - Strongly Connected Components
                    - `"hits"` - Hyperlink-Induced Topic Search
                    - `"effectivecloseness"` - Effective Closeness
                    - `"linerank"` - LineRank
                    - `"labelpropagation"` - Label Propagation
                    - `"slpa"` - Speaker-Listener Label Propagation
                  type: string
                graphName:
                  description: |
                    Name of a graph. Either this or the parameters `vertexCollections` and
                    `edgeCollections` are required.
                    Please note that there are special sharding requirements for graphs in order
                    to be used with Pregel.
                  type: string
                vertexCollections:
                  description: |
                    List of vertex collection names.
                    Please note that there are special sharding requirements for collections in order
                    to be used with Pregel.
                  type: array
                  items:
                    type: string
                edgeCollections:
                  description: |
                    List of edge collection names.
                    Please note that there are special sharding requirements for collections in order
                    to be used with Pregel.
                  type: array
                  items:
                    type: string
                params:
                  description: |
                    General as well as algorithm-specific options.

                    The most important general option is "store", which controls whether the results
                    computed by the Pregel job are written back into the source collections or not.

                    Another important general option is "parallelism", which controls the number of
                    parallel threads that work on the Pregel job at most. If "parallelism" is not
                    specified, a default value may be used. In addition, the value of "parallelism"
                    may be effectively capped at some server-specific value.

                    The option "useMemoryMaps" controls whether to use disk based files to store
                    temporary results. This might make the computation disk-bound, but allows you to
                    run computations which would not fit into main memory. It is recommended to set
                    this flag for larger datasets.

                    The attribute "shardKeyAttribute" specifies the shard key that edge collections are
                    sharded after (default: `"vertex"`).
                  type: object
              required:
                - algorithm
      responses:
        '200':
          description: |
            HTTP 200 is returned in case the Pregel was successfully created and the reply
            body is a string with the `id` to query for the status or to cancel the
            execution.
        '400':
          description: |
            An HTTP 400 error is returned if the set of collections for the Pregel job includes
            a system collection, or if the collections to not conform to the sharding requirements
            for Pregel jobs.
        '403':
          description: |
            An HTTP 403 error is returned if there are not sufficient privileges to access
            the collections specified for the Pregel job.
        '404':
          description: |
            An HTTP 404 error is returned if the specified "algorithm" is not found, or the
            graph specified in "graphName" is not found, or at least one the collections
            specified in "vertexCollections" or "edgeCollections" is not found.
      tags:
        - Pregel
```


```curl
---
render: input/output
name: RestPregelStartConnectedComponents
release: stable
version: '3.11'
---

  var examples = require("@arangodb/graph-examples/example-graph.js");
  print("1. Creating Pregel graph");
  var graph = examples.loadGraph("connectedComponentsGraph");

  var url = "/_api/control_pregel";
  var body = {
    algorithm: "wcc",
    graphName: "connectedComponentsGraph",
    params: {
      maxGSS: graph.components.count(),
      resultField: "component",
    }
  }
  var response = logCurlRequest("POST", url, body);

  assert(response.code === 200);

  logJsonResponse(response);

  var id = response.parsedBody;
  var url = "/_api/control_pregel/" + id;
  while (true) {
    var status = internal.arango.GET(url);
    if (["done", "canceled", "fatal error"].includes(status.state)) {
      assert(status.state == "done");
      break;
    } else {
      print(`1. Waiting for Pregel job ${id} (${status.state})...`);
      internal.sleep(0.5);
    }
  }
  examples.dropGraph("connectedComponentsGraph");

```
```openapi
## Get Pregel job execution status

paths:
  /_api/control_pregel/{id}:
    get:
      operationId: getPregelJob
      description: |
        Returns the current state of the execution, the current global superstep, the
        runtime, the global aggregator values as well as the number of sent and
        received messages.
      parameters:
        - name: id
          in: path
          required: true
          description: |
            Pregel execution identifier.
          schema:
            type: number
      responses:
        '200':
          description: |
            HTTP 200 is returned in case the job execution ID was valid and the state is
            returned along with the response.
          content:
            application/json:
              schema:
                description: |
                  The information about the Pregel job.
                type: object
                properties:
                  id:
                    description: |
                      The ID of the Pregel job, as a string.
                    type: string
                  algorithm:
                    description: |
                      The algorithm used by the job.
                    type: string
                  created:
                    description: |
                      The date and time when the job was created.
                    type: string
                  expires:
                    description: |
                      The date and time when the job results expire. The expiration date is only
                      meaningful for jobs that were completed, canceled or resulted in an error. Such jobs
                      are cleaned up by the garbage collection when they reach their expiration date/time.
                    type: string
                  ttl:
                    description: |
                      The TTL (time to live) value for the job results, specified in seconds.
                      The TTL is used to calculate the expiration date for the job's results.
                    type: number
                  state:
                    description: |
                      The state of the execution. The following values can be returned:
                      - `"none"`: The Pregel run did not yet start.
                      - `"loading"`: The graph is loaded from the database into memory before the execution of the algorithm.
                      - `"running"`: The algorithm is executing normally.
                      - `"storing"`: The algorithm finished, but the results are still being written
                        back into the collections. Occurs only if the store parameter is set to true.
                      - `"done"`: The execution is done. In version 3.7.1 and later, this means that
                        storing is also done. In earlier versions, the results may not be written back
                        into the collections yet. This event is announced in the server log (requires
                        at least info log level for the `pregel` log topic).
                      - `"canceled"`: The execution was permanently canceled, either by the user or by
                        an error.
                      - `"fatal error"`: The execution has failed and cannot recover.
                      - `"in error"`: The execution is in an error state. This can be
                        caused by DB-Servers being not reachable or being non responsive. The execution
                        might recover later, or switch to `"canceled"` if it was not able to recover
                        successfully.
                      - `"recovering"` (currently unused): The execution is actively recovering and
                        switches back to `running` if the recovery is successful.
                    type: string
                  gss:
                    description: |
                      The number of global supersteps executed.
                    type: integer
                  totalRuntime:
                    description: |
                      The total runtime of the execution up to now (if the execution is still ongoing).
                    type: number
                  startupTime:
                    description: |
                      The startup runtime of the execution.
                      The startup time includes the data loading time and can be substantial.
                    type: number
                  computationTime:
                    description: |
                      The algorithm execution time. Is shown when the computation started.
                    type: number
                  storageTime:
                    description: |
                      The time for storing the results if the job includes results storage.
                      Is shown when the storing started.
                    type: number
                  gssTimes:
                    description: |
                      Computation time of each global super step. Is shown when the computation started.
                    type: array
                    items:
                      type: number
                  reports:
                    description: |
                      This attribute is used by Programmable Pregel Algorithms (`ppa`, experimental).
                      The value is only populated once the algorithm has finished.
                    type: array
                    items:
                      type: object
                  vertexCount:
                    description: |
                      The total number of vertices processed.
                    type: integer
                  edgeCount:
                    description: |
                      The total number of edges processed.
                    type: integer
                  detail:
                    description: |
                      The Pregel run details.
                    type: object
                    properties:
                      aggregatedStatus:
                        description: |
                          The aggregated details of the full Pregel run. The values are totals of all the
                          DB-Server.
                        type: object
                        properties:
                          timeStamp:
                            description: |
                              The time at which the status was measured.
                            type: string
                          graphStoreStatus:
                            description: |
                              The status of the in memory graph.
                            type: object
                            properties:
                              verticesLoaded:
                                description: |
                                  The number of vertices that are loaded from the database into memory.
                                type: integer
                              edgesLoaded:
                                description: |
                                  The number of edges that are loaded from the database into memory.
                                type: integer
                              memoryBytesUsed:
                                description: |
                                  The number of bytes used in-memory for the loaded graph.
                                type: integer
                              verticesStored:
                                description: |
                                  The number of vertices that are written back to the database after the Pregel
                                  computation finished. It is only set if the `store` parameter is set to `true`.
                                type: integer
                          allGssStatus:
                            description: |
                              Information about the global supersteps.
                            type: object
                            properties:
                              items:
                                description: |
                                  A list of objects with details for each global superstep.
                                type: array
                                items:
                                  type: object
                                  properties:
                                    verticesProcessed:
                                      description: |
                                        The number of vertices that have been processed in this step.
                                      type: integer
                                    messagesSent:
                                      description: |
                                        The number of messages sent in this step.
                                      type: integer
                                    messagesReceived:
                                      description: |
                                        The number of messages received in this step.
                                      type: integer
                                    memoryBytesUsedForMessages:
                                      description: |
                                        The number of bytes used in memory for the messages in this step.
                                      type: integer
                        required:
                          - timeStamp
                      workerStatus:
                        description: |
                          The details of the Pregel for every DB-Server. Each object key is a DB-Server ID,

                          and each value is a nested object similar to the `aggregatedStatus` attribute.

                          In a single server deployment, there is only a single entry with an empty string as key.
                        type: object
                    required:
                      - aggregatedStatus
                      - workerStatus
                required:
                  - id
                  - algorithm
                  - created
                  - ttl
                  - state
                  - gss
                  - totalRuntime
                  - startupTime
                  - computationTime
                  - reports
                  - detail
        '404':
          description: |
            An HTTP 404 error is returned if no Pregel job with the specified execution number
            is found or the execution number is invalid.
      tags:
        - Pregel
```


```curl
---
render: input/output
name: RestPregelStatusConnectedComponents
release: stable
version: '3.11'
---

  var examples = require("@arangodb/graph-examples/example-graph.js");
  print("3. Creating Pregel graph");
  var graph = examples.loadGraph("connectedComponentsGraph");

  var url = "/_api/control_pregel";
  var body = {
    algorithm: "wcc",
    graphName: "connectedComponentsGraph",
    params: {
      maxGSS: graph.components.count(),
      resultField: "component"
    }
  };
  var id = internal.arango.POST(url, body);
  var url = "/_api/control_pregel/" + id;
  while (true) {
    var status = internal.arango.GET(url);
    if (status.error    ["done", "canceled", "fatal error"].includes(status.state)) {
      assert(status.state == "done");
      break;
    } else {
      print(`3. Waiting for Pregel job ${id} (${status.state})...`);
      internal.sleep(0.5);
    }
  }

  var response = logCurlRequest("GET", url);
  assert(response.code === 200);

  logJsonResponse(response);
  examples.dropGraph("connectedComponentsGraph");

```
```openapi
## Get currently running Pregel jobs

paths:
  /_api/control_pregel:
    get:
      operationId: listPregelJobs
      description: |
        Returns a list of currently running and recently finished Pregel jobs without
        retrieving their results.
      responses:
        '200':
          description: |
            Is returned when the list of jobs can be retrieved successfully.
          content:
            application/json:
              schema:
                description: |
                  A list of objects describing the Pregel jobs.
                type: array
                items:
                  type: object
                  properties:
                    id:
                      description: |
                        The ID of the Pregel job, as a string.
                      type: string
                    algorithm:
                      description: |
                        The algorithm used by the job.
                      type: string
                    created:
                      description: |
                        The date and time when the job was created.
                      type: string
                    expires:
                      description: |
                        The date and time when the job results expire. The expiration date is only
                        meaningful for jobs that were completed, canceled or resulted in an error. Such jobs
                        are cleaned up by the garbage collection when they reach their expiration date/time.
                      type: string
                    ttl:
                      description: |
                        The TTL (time to live) value for the job results, specified in seconds.
                        The TTL is used to calculate the expiration date for the job's results.
                      type: number
                    state:
                      description: |
                        The state of the execution. The following values can be returned:
                        - `"none"`: The Pregel run did not yet start.
                        - `"loading"`: The graph is loaded from the database into memory before the execution of the algorithm.
                        - `"running"`: The algorithm is executing normally.
                        - `"storing"`: The algorithm finished, but the results are still being written
                          back into the collections. Occurs only if the store parameter is set to true.
                        - `"done"`: The execution is done. In version 3.7.1 and later, this means that
                          storing is also done. In earlier versions, the results may not be written back
                          into the collections yet. This event is announced in the server log (requires
                          at least info log level for the `pregel` log topic).
                        - `"canceled"`: The execution was permanently canceled, either by the user or by
                          an error.
                        - `"fatal error"`: The execution has failed and cannot recover.
                        - `"in error"`: The execution is in an error state. This can be
                          caused by DB-Servers being not reachable or being non responsive. The execution
                          might recover later, or switch to `"canceled"` if it was not able to recover
                          successfully.
                        - `"recovering"` (currently unused): The execution is actively recovering and
                          switches back to `running` if the recovery is successful.
                      type: string
                    gss:
                      description: |
                        The number of global supersteps executed.
                      type: integer
                    totalRuntime:
                      description: |
                        The total runtime of the execution up to now (if the execution is still ongoing).
                      type: number
                    startupTime:
                      description: |
                        The startup runtime of the execution.
                        The startup time includes the data loading time and can be substantial.
                      type: number
                    computationTime:
                      description: |
                        The algorithm execution time. Is shown when the computation started.
                      type: number
                    storageTime:
                      description: |
                        The time for storing the results if the job includes results storage.
                        Is shown when the storing started.
                      type: number
                    gssTimes:
                      description: |
                        Computation time of each global super step. Is shown when the computation started.
                      type: array
                      items:
                        type: number
                    reports:
                      description: |
                        This attribute is used by Programmable Pregel Algorithms (`ppa`, experimental).
                        The value is only populated once the algorithm has finished.
                      type: array
                      items:
                        type: object
                    vertexCount:
                      description: |
                        The total number of vertices processed.
                      type: integer
                    edgeCount:
                      description: |
                        The total number of edges processed.
                      type: integer
                    detail:
                      description: |
                        The Pregel run details.
                      type: object
                      properties:
                        aggregatedStatus:
                          description: |
                            The aggregated details of the full Pregel run. The values are totals of all the
                            DB-Server.
                          type: object
                          properties:
                            timeStamp:
                              description: |
                                The time at which the status was measured.
                              type: string
                            graphStoreStatus:
                              description: |
                                The status of the in memory graph.
                              type: object
                              properties:
                                verticesLoaded:
                                  description: |
                                    The number of vertices that are loaded from the database into memory.
                                  type: integer
                                edgesLoaded:
                                  description: |
                                    The number of edges that are loaded from the database into memory.
                                  type: integer
                                memoryBytesUsed:
                                  description: |
                                    The number of bytes used in-memory for the loaded graph.
                                  type: integer
                                verticesStored:
                                  description: |
                                    The number of vertices that are written back to the database after the Pregel
                                    computation finished. It is only set if the `store` parameter is set to `true`.
                                  type: integer
                            allGssStatus:
                              description: |
                                Information about the global supersteps.
                              type: object
                              properties:
                                items:
                                  description: |
                                    A list of objects with details for each global superstep.
                                  type: array
                                  items:
                                    type: object
                                    properties:
                                      verticesProcessed:
                                        description: |
                                          The number of vertices that have been processed in this step.
                                        type: integer
                                      messagesSent:
                                        description: |
                                          The number of messages sent in this step.
                                        type: integer
                                      messagesReceived:
                                        description: |
                                          The number of messages received in this step.
                                        type: integer
                                      memoryBytesUsedForMessages:
                                        description: |
                                          The number of bytes used in memory for the messages in this step.
                                        type: integer
                          required:
                            - timeStamp
                        workerStatus:
                          description: |
                            The details of the Pregel for every DB-Server. Each object key is a DB-Server ID,

                            and each value is a nested object similar to the `aggregatedStatus` attribute.

                            In a single server deployment, there is only a single entry with an empty string as key.
                          type: object
                      required:
                        - aggregatedStatus
                        - workerStatus
                  required:
                    - id
                    - algorithm
                    - created
                    - ttl
                    - state
                    - gss
                    - totalRuntime
                    - startupTime
                    - computationTime
                    - reports
                    - detail
      tags:
        - Pregel
```


```curl
---
render: input/output
name: RestPregelStatusAllConnectedComponents
release: stable
version: '3.11'
---

  var assertInstanceOf = require("jsunity").jsUnity.assertions.assertInstanceOf;
  var examples = require("@arangodb/graph-examples/example-graph.js");
  print("2. Creating Pregel graph");
  var graph = examples.loadGraph("connectedComponentsGraph");

  var url = "/_api/control_pregel";
  var body = {
    algorithm: "wcc",
    graphName: "connectedComponentsGraph",
    params: {
      maxGSS: graph.components.count(),
      resultField: "component"
    }
  };
  var id = internal.arango.POST(url, body);

  var url = "/_api/control_pregel/";

  var response = logCurlRequest("GET", url);
  assert(response.code === 200);
  assertInstanceOf(Array, response.parsedBody);
  assert(response.parsedBody.length > 0);

  internal.arango.DELETE(url + id);

  logJsonResponse(response);
  examples.dropGraph("connectedComponentsGraph");

```
```openapi
## Cancel Pregel job execution

paths:
  /_api/control_pregel/{id}:
    delete:
      operationId: deletePregelJob
      description: |
        Cancel an execution which is still running, and discard any intermediate
        results. This immediately frees all memory taken up by the execution, and
        makes you lose all intermediary data.

        You might get inconsistent results if you requested to store the results and
        then cancel an execution when it is already in its `"storing"` state (or
        `"done"` state in versions prior to 3.7.1). The data is written multi-threaded
        into all collection shards at once. This means there are multiple transactions
        simultaneously. A transaction might already be committed when you cancel the
        execution job. Therefore, you might see some updated documents, while other
        documents have no or stale results from a previous execution.
      parameters:
        - name: id
          in: path
          required: true
          description: |
            Pregel execution identifier.
          schema:
            type: number
      responses:
        '200':
          description: |
            HTTP 200 is returned if the job execution ID was valid.
        '404':
          description: |
            An HTTP 404 error is returned if no Pregel job with the specified execution number
            is found or the execution number is invalid.
      tags:
        - Pregel
```


```curl
---
render: input/output
name: RestPregelCancelConnectedComponents
release: stable
version: '3.11'
---

  var examples = require("@arangodb/graph-examples/example-graph.js");
  print("4. Creating Pregel graph");
  var graph = examples.loadGraph("connectedComponentsGraph");

  var url = "/_api/control_pregel";
  var body = {
    algorithm: "wcc",
    graphName: "connectedComponentsGraph",
    params: {
      maxGSS: graph.components.count(),
      store: false
    }
  };
  var id = internal.arango.POST(url, body);

  var statusUrl = "/_api/control_pregel/" + id;
  var response = logCurlRequest("DELETE", statusUrl);

  assert(response.code === 200);

  logJsonResponse(response);
  examples.dropGraph("connectedComponentsGraph");

```
```openapi
## Get the execution statistics of a Pregel job

paths:
  /_api/control_pregel/history/{id}:
    get:
      operationId: getPregelJobStatistics
      description: |
        Returns the current state of the execution, the current global superstep, the
        runtime, the global aggregator values, as well as the number of sent and
        received messages.

        The execution statistics are persisted to a system collection and kept until you
        remove them, whereas the `/_api/control_pregel/{id}` endpoint only keeps the
        information temporarily in memory.
      parameters:
        - name: id
          in: path
          required: true
          description: |
            Pregel job identifier.
          schema:
            type: number
      responses:
        '200':
          description: |
            is returned if the Pregel job ID is valid and the execution statistics are
            returned along with the response.
          content:
            application/json:
              schema:
                description: |
                  The information about the Pregel job.
                type: object
                properties:
                  id:
                    description: |
                      The ID of the Pregel job, as a string.
                    type: string
                  algorithm:
                    description: |
                      The algorithm used by the job.
                    type: string
                  created:
                    description: |
                      The date and time when the job was created.
                    type: string
                  expires:
                    description: |
                      The date and time when the job results expire. The expiration date is only
                      meaningful for jobs that were completed, canceled or resulted in an error. Such jobs
                      are cleaned up by the garbage collection when they reach their expiration date/time.
                    type: string
                  ttl:
                    description: |
                      The TTL (time to live) value for the job results, specified in seconds.
                      The TTL is used to calculate the expiration date for the job's results.
                    type: number
                  state:
                    description: |
                      The state of the execution. The following values can be returned:
                      - `"none"`: The Pregel run did not yet start.
                      - `"loading"`: The graph is loaded from the database into memory before the execution of the algorithm.
                      - `"running"`: The algorithm is executing normally.
                      - `"storing"`: The algorithm finished, but the results are still being written
                        back into the collections. Occurs only if the store parameter is set to true.
                      - `"done"`: The execution is done. In version 3.7.1 and later, this means that
                        storing is also done. In earlier versions, the results may not be written back
                        into the collections yet. This event is announced in the server log (requires
                        at least info log level for the `pregel` log topic).
                      - `"canceled"`: The execution was permanently canceled, either by the user or by
                        an error.
                      - `"fatal error"`: The execution has failed and cannot recover.
                      - `"in error"`: The execution is in an error state. This can be
                        caused by DB-Servers being not reachable or being non responsive. The execution
                        might recover later, or switch to `"canceled"` if it was not able to recover
                        successfully.
                      - `"recovering"` (currently unused): The execution is actively recovering and
                        switches back to `running` if the recovery is successful.
                    type: string
                  gss:
                    description: |
                      The number of global supersteps executed.
                    type: integer
                  totalRuntime:
                    description: |
                      The total runtime of the execution up to now (if the execution is still ongoing).
                    type: number
                  startupTime:
                    description: |
                      The startup runtime of the execution.
                      The startup time includes the data loading time and can be substantial.
                    type: number
                  computationTime:
                    description: |
                      The algorithm execution time. Is shown when the computation started.
                    type: number
                  storageTime:
                    description: |
                      The time for storing the results if the job includes results storage.
                      Is shown when the storing started.
                    type: number
                  gssTimes:
                    description: |
                      Computation time of each global super step. Is shown when the computation started.
                    type: array
                    items:
                      type: number
                  reports:
                    description: |
                      This attribute is used by Programmable Pregel Algorithms (`ppa`, experimental).
                      The value is only populated once the algorithm has finished.
                    type: array
                    items:
                      type: object
                  vertexCount:
                    description: |
                      The total number of vertices processed.
                    type: integer
                  edgeCount:
                    description: |
                      The total number of edges processed.
                    type: integer
                  detail:
                    description: |
                      The Pregel run details.
                    type: object
                    properties:
                      aggregatedStatus:
                        description: |
                          The aggregated details of the full Pregel run. The values are totals of all the
                          DB-Server.
                        type: object
                        properties:
                          timeStamp:
                            description: |
                              The time at which the status was measured.
                            type: string
                          graphStoreStatus:
                            description: |
                              The status of the in memory graph.
                            type: object
                            properties:
                              verticesLoaded:
                                description: |
                                  The number of vertices that are loaded from the database into memory.
                                type: integer
                              edgesLoaded:
                                description: |
                                  The number of edges that are loaded from the database into memory.
                                type: integer
                              memoryBytesUsed:
                                description: |
                                  The number of bytes used in-memory for the loaded graph.
                                type: integer
                              verticesStored:
                                description: |
                                  The number of vertices that are written back to the database after the Pregel
                                  computation finished. It is only set if the `store` parameter is set to `true`.
                                type: integer
                          allGssStatus:
                            description: |
                              Information about the global supersteps.
                            type: object
                            properties:
                              items:
                                description: |
                                  A list of objects with details for each global superstep.
                                type: array
                                items:
                                  type: object
                                  properties:
                                    verticesProcessed:
                                      description: |
                                        The number of vertices that have been processed in this step.
                                      type: integer
                                    messagesSent:
                                      description: |
                                        The number of messages sent in this step.
                                      type: integer
                                    messagesReceived:
                                      description: |
                                        The number of messages received in this step.
                                      type: integer
                                    memoryBytesUsedForMessages:
                                      description: |
                                        The number of bytes used in memory for the messages in this step.
                                      type: integer
                        required:
                          - timeStamp
                      workerStatus:
                        description: |
                          The details of the Pregel for every DB-Server. Each object key is a DB-Server ID,

                          and each value is a nested object similar to the `aggregatedStatus` attribute.

                          In a single server deployment, there is only a single entry with an empty string as key.
                        type: object
                    required:
                      - aggregatedStatus
                      - workerStatus
                required:
                  - id
                  - algorithm
                  - created
                  - ttl
                  - state
                  - gss
                  - totalRuntime
                  - startupTime
                  - computationTime
                  - reports
                  - detail
        '404':
          description: |
            is returned if no Pregel job with the specified ID is found or if the ID
            is invalid.
      tags:
        - Pregel
```


```curl
---
render: input/output
name: RestPregelConnectedComponentsStatisticsId
release: stable
version: '3.11'
---

  var examples = require("@arangodb/graph-examples/example-graph.js");
  print("6. Creating Pregel graph");
  var graph = examples.loadGraph("connectedComponentsGraph");

  var url = "/_api/control_pregel";
  var body = {
    algorithm: "wcc",
    graphName: "connectedComponentsGraph",
    params: {
      maxGSS: graph.components.count(),
      resultField: "component"
    }
  };
  var id = internal.arango.POST(url, body);

  const statusUrl = `${url}/${id}`;
  while (true) {
    var status = internal.arango.GET(statusUrl);
    if (status.error    ["done", "canceled", "fatal error"].includes(status.state)) {
      assert(status.state == "done");
      break;
    } else {
      print(`6. Waiting for Pregel job ${id} (${status.state})...`);
      internal.sleep(0.5);
    }
  }

  const historyUrl = `/_api/control_pregel/history/${id}`;
  var response = logCurlRequest("GET", historyUrl);
  assert(response.code === 200);

  logJsonResponse(response);
  examples.dropGraph("connectedComponentsGraph");

```
```openapi
## Get the execution statistics of all Pregel jobs

paths:
  /_api/control_pregel/history:
    get:
      operationId: listPregelJobsStatisics
      description: |
        Returns a list of currently running and finished Pregel jobs without retrieving
        their results.

        The execution statistics are persisted to a system collection and kept until you
        remove them, whereas the `/_api/control_pregel` endpoint only keeps the
        information temporarily in memory.
      responses:
        '200':
          description: |
            is returned if the list of jobs can be retrieved successfully.
          content:
            application/json:
              schema:
                description: |
                  A list of objects describing the Pregel jobs.
                type: array
                items:
                  type: object
                  properties:
                    id:
                      description: |
                        The ID of the Pregel job, as a string.
                      type: string
                    algorithm:
                      description: |
                        The algorithm used by the job.
                      type: string
                    created:
                      description: |
                        The date and time when the job was created.
                      type: string
                    expires:
                      description: |
                        The date and time when the job results expire. The expiration date is only
                        meaningful for jobs that were completed, canceled or resulted in an error. Such jobs
                        are cleaned up by the garbage collection when they reach their expiration date/time.
                      type: string
                    ttl:
                      description: |
                        The TTL (time to live) value for the job results, specified in seconds.
                        The TTL is used to calculate the expiration date for the job's results.
                      type: number
                    state:
                      description: |
                        The state of the execution. The following values can be returned:
                        - `"none"`: The Pregel run did not yet start.
                        - `"loading"`: The graph is loaded from the database into memory before the execution of the algorithm.
                        - `"running"`: The algorithm is executing normally.
                        - `"storing"`: The algorithm finished, but the results are still being written
                          back into the collections. Occurs only if the store parameter is set to true.
                        - `"done"`: The execution is done. In version 3.7.1 and later, this means that
                          storing is also done. In earlier versions, the results may not be written back
                          into the collections yet. This event is announced in the server log (requires
                          at least info log level for the `pregel` log topic).
                        - `"canceled"`: The execution was permanently canceled, either by the user or by
                          an error.
                        - `"fatal error"`: The execution has failed and cannot recover.
                        - `"in error"`: The execution is in an error state. This can be
                          caused by DB-Servers being not reachable or being non responsive. The execution
                          might recover later, or switch to `"canceled"` if it was not able to recover
                          successfully.
                        - `"recovering"` (currently unused): The execution is actively recovering and
                          switches back to `running` if the recovery is successful.
                      type: string
                    gss:
                      description: |
                        The number of global supersteps executed.
                      type: integer
                    totalRuntime:
                      description: |
                        The total runtime of the execution up to now (if the execution is still ongoing).
                      type: number
                    startupTime:
                      description: |
                        The startup runtime of the execution.
                        The startup time includes the data loading time and can be substantial.
                      type: number
                    computationTime:
                      description: |
                        The algorithm execution time. Is shown when the computation started.
                      type: number
                    storageTime:
                      description: |
                        The time for storing the results if the job includes results storage.
                        Is shown when the storing started.
                      type: number
                    gssTimes:
                      description: |
                        Computation time of each global super step. Is shown when the computation started.
                      type: array
                      items:
                        type: number
                    reports:
                      description: |
                        This attribute is used by Programmable Pregel Algorithms (`ppa`, experimental).
                        The value is only populated once the algorithm has finished.
                      type: array
                      items:
                        type: object
                    vertexCount:
                      description: |
                        The total number of vertices processed.
                      type: integer
                    edgeCount:
                      description: |
                        The total number of edges processed.
                      type: integer
                    detail:
                      description: |
                        The Pregel run details.
                      type: object
                      properties:
                        aggregatedStatus:
                          description: |
                            The aggregated details of the full Pregel run. The values are totals of all the
                            DB-Server.
                          type: object
                          properties:
                            timeStamp:
                              description: |
                                The time at which the status was measured.
                              type: string
                            graphStoreStatus:
                              description: |
                                The status of the in memory graph.
                              type: object
                              properties:
                                verticesLoaded:
                                  description: |
                                    The number of vertices that are loaded from the database into memory.
                                  type: integer
                                edgesLoaded:
                                  description: |
                                    The number of edges that are loaded from the database into memory.
                                  type: integer
                                memoryBytesUsed:
                                  description: |
                                    The number of bytes used in-memory for the loaded graph.
                                  type: integer
                                verticesStored:
                                  description: |
                                    The number of vertices that are written back to the database after the Pregel
                                    computation finished. It is only set if the `store` parameter is set to `true`.
                                  type: integer
                            allGssStatus:
                              description: |
                                Information about the global supersteps.
                              type: object
                              properties:
                                items:
                                  description: |
                                    A list of objects with details for each global superstep.
                                  type: array
                                  items:
                                    type: object
                                    properties:
                                      verticesProcessed:
                                        description: |
                                          The number of vertices that have been processed in this step.
                                        type: integer
                                      messagesSent:
                                        description: |
                                          The number of messages sent in this step.
                                        type: integer
                                      messagesReceived:
                                        description: |
                                          The number of messages received in this step.
                                        type: integer
                                      memoryBytesUsedForMessages:
                                        description: |
                                          The number of bytes used in memory for the messages in this step.
                                        type: integer
                          required:
                            - timeStamp
                        workerStatus:
                          description: |
                            The details of the Pregel for every DB-Server. Each object key is a DB-Server ID,

                            and each value is a nested object similar to the `aggregatedStatus` attribute.

                            In a single server deployment, there is only a single entry with an empty string as key.
                          type: object
                      required:
                        - aggregatedStatus
                        - workerStatus
                  required:
                    - id
                    - algorithm
                    - created
                    - ttl
                    - state
                    - gss
                    - totalRuntime
                    - startupTime
                    - computationTime
                    - reports
                    - detail
      tags:
        - Pregel
```


```curl
---
render: input/output
name: RestPregelConnectedComponentsStatistics
release: stable
version: '3.11'
---

  var assertInstanceOf = require("jsunity").jsUnity.assertions.assertInstanceOf;
  var examples = require("@arangodb/graph-examples/example-graph.js");
  print("5. Creating Pregel graph");
  var graph = examples.loadGraph("connectedComponentsGraph");

  var url = "/_api/control_pregel";
  var body = {
    algorithm: "wcc",
    graphName: "connectedComponentsGraph",
    params: {
      maxGSS: graph.components.count(),
      resultField: "component"
    }
  };

  const id = internal.arango.POST(url, body);
  const historyUrl = `/_api/control_pregel/history`;

  var response = logCurlRequest("GET", historyUrl);
  assert(response.code === 200);
  assertInstanceOf(Array, response.parsedBody);
  assert(response.parsedBody.length > 0);

  internal.arango.DELETE(url + id);

  logJsonResponse(response);
  examples.dropGraph("connectedComponentsGraph");

```
```openapi
## Remove the execution statistics of a past Pregel job

paths:
  /_api/control_pregel/history/{id}:
    delete:
      operationId: deletePregelJobStatistics
      description: |
        Removes the persisted execution statistics of a finished Pregel job.
      parameters:
        - name: id
          in: path
          required: true
          description: |
            The Pregel job identifier.
          schema:
            type: number
      responses:
        '200':
          description: |
            is returned if the Pregel job ID is valid.
        '404':
          description: |
            is returned if no Pregel job with the specified ID is found or if the ID
            is invalid.
      tags:
        - Pregel
```


```curl
---
render: input/output
name: RestPregelConnectedComponentsRemoveStatisticsId
release: stable
version: '3.11'
---

  var examples = require("@arangodb/graph-examples/example-graph.js");
  print("8. Creating graph");
  var graph = examples.loadGraph("connectedComponentsGraph");

  var url = "/_api/control_pregel";
  var body = {
    algorithm: "wcc",
    graphName: "connectedComponentsGraph",
    params: {
      maxGSS: graph.components.count(),
      store: false
    }
  };
  var id = internal.arango.POST(url, body);

  const statusUrl = `${url}/${id}`;
  while (true) {
    var status = internal.arango.GET(statusUrl);
    if (status.error    ["done", "canceled", "fatal error"].includes(status.state)) {
      assert(status.state == "done");
      break;
    } else {
      print(`8. Waiting for Pregel job ${id} (${status.state})...`);
      internal.sleep(0.5);
    }
  }

  const historyUrl = `/_api/control_pregel/history/${id}`
  var response = logCurlRequest("DELETE", historyUrl);
  assert(response.code === 200);

  logJsonResponse(response);
  examples.dropGraph("connectedComponentsGraph");

```
```openapi
## Remove the execution statistics of all past Pregel jobs

paths:
  /_api/control_pregel/history:
    delete:
      operationId: deleteAllPregelJobStatistics
      description: |
        Removes the persisted execution statistics of all past Pregel jobs.
      responses:
        '200':
          description: |
            is returned if all persisted execution statistics have been successfully deleted.
      tags:
        - Pregel
```


```curl
---
render: input/output
name: RestPregelConnectedComponentsRemoveStatistics
release: stable
version: '3.11'
---

  var examples = require("@arangodb/graph-examples/example-graph.js");
  print("7. Creating Pregel graph");
  var graph = examples.loadGraph("connectedComponentsGraph");

  var url = "/_api/control_pregel";
  var body = {
    algorithm: "wcc",
    graphName: "connectedComponentsGraph",
    params: {
      maxGSS: graph.components.count(),
      store: false
    }
  };
  var id = internal.arango.POST(url, body);

  const statusUrl = `${url}/${id}`;
  while (true) {
    var status = internal.arango.GET(statusUrl);
    if (status.error    ["done", "canceled", "fatal error"].includes(status.state)) {
      assert(status.state == "done");
      break;
    } else {
      print(`7. Waiting for Pregel job ${id} (${status.state})...`);
      internal.sleep(0.5);
    }
  }

  const deleteUrl = "/_api/control_pregel/history";
  var response = logCurlRequest("DELETE", deleteUrl);
  assert(response.code === 200);

  logJsonResponse(response);
  examples.dropGraph("connectedComponentsGraph");

```
