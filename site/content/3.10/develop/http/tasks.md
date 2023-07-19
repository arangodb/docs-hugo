---
title: HTTP interface for tasks
menuTitle: Tasks
weight: 85
description: >-
  The HTTP API for tasks lets you can manage the periodic or timed execution of
  server-side JavaScript code
archetype: default
---
{{< description >}}

```openapi
## List all tasks

paths:
  /_api/tasks/:
    get:
      operationId: listTasks
      description: |
        fetches all existing tasks on the server
      responses:
        '200':
          description: |
            The list of tasks
          content:
            application/json:
              schema:
                description: |
                  a list of all tasks
                type: array
                items:
                  type: object
                  properties:
                    name:
                      description: |
                        A user-friendly name for the task.
                      type: string
                    id:
                      description: |
                        A string identifying the task.
                      type: string
                    created:
                      description: |
                        The timestamp when this task was created.
                      type: number
                    type:
                      description: |
                        What type of task is this [ `periodic`, `timed`]
                          - periodic are tasks that repeat periodically
                          - timed are tasks that execute once at a specific time
                      type: string
                    period:
                      description: |
                        This task should run each `period` seconds.
                      type: number
                    offset:
                      description: |
                        Time offset in seconds from the `created` timestamp.
                      type: number
                    command:
                      description: |
                        The JavaScript function for this task.
                      type: string
                    database:
                      description: |
                        The database this task belongs to.
                      type: string
                  required:
                    - name
                    - id
                    - created
                    - type
                    - period
                    - offset
                    - command
                    - database
      tags:
        - Tasks
```

**Examples**



```curl
---
description: Fetching all tasks
version: '3.10'
render: input/output
name: RestTasksListAll
server_name: stable
type: single
---

    var url = "/_api/tasks";

    var response = logCurlRequest('GET', url);

    assert(response.code === 200);

    logJsonResponse(response);

```
```openapi
## Get a task

paths:
  /_api/tasks/{id}:
    get:
      operationId: getTask
      description: |
        fetches one existing task on the server specified by `id`
      parameters:
        - name: id
          in: path
          required: true
          description: |
            The id of the task to fetch.
          schema:
            type: string
      responses:
        '200':
          description: |
            The requested task
          content:
            application/json:
              schema:
                description: |
                  The function in question
                type: object
                properties:
                  name:
                    description: |
                      A user-friendly name for the task.
                    type: string
                  id:
                    description: |
                      A string identifying the task.
                    type: string
                  created:
                    description: |
                      The timestamp when this task was created.
                    type: number
                  type:
                    description: |
                      What type of task is this [ `periodic`, `timed`]
                        - periodic are tasks that repeat periodically
                        - timed are tasks that execute once at a specific time
                    type: string
                  period:
                    description: |
                      This task should run each `period` seconds.
                    type: number
                  offset:
                    description: |
                      Time offset in seconds from the `created` timestamp.
                    type: number
                  command:
                    description: |
                      The JavaScript function for this task.
                    type: string
                  database:
                    description: |
                      The database this task belongs to.
                    type: string
                required:
                  - name
                  - id
                  - created
                  - type
                  - period
                  - offset
                  - command
                  - database
      tags:
        - Tasks
```

**Examples**



```curl
---
description: Fetching a single task by its id
version: '3.10'
render: input/output
name: RestTasksListOne
server_name: stable
type: single
---

    var url = "/_api/tasks";
    var response = logCurlRequest('POST', url, JSON.stringify({ id: "testTask", command: "console.log('Hello from task!');", offset: 10000 }));

    var response = logCurlRequest('GET', url + "/testTask");

    assert(response.code === 200);
    logJsonResponse(response);

```


```curl
---
description: Trying to fetch a non-existing task
version: '3.10'
render: input/output
name: RestTasksListNonExisting
server_name: stable
type: single
---

    var url = "/_api/tasks/non-existing-task";

    var response = logCurlRequest('GET', url);

    assert(response.code === 404);
    logJsonResponse(response);

```
```openapi
## Create a task

paths:
  /_api/tasks:
    post:
      operationId: createTask
      description: |
        creates a new task with a generated id
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  description: |
                    The name of the task
                  type: string
                command:
                  description: |
                    The JavaScript code to be executed
                  type: string
                params:
                  description: |
                    The parameters to be passed into command
                  type: string
                period:
                  description: |
                    number of seconds between the executions
                  type: integer
                offset:
                  description: |
                    Number of seconds initial delay
                  type: integer
              required:
                - name
                - command
                - params
      responses:
        '200':
          description: |
            The task was registered
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    description: |
                      A string identifying the task
                    type: string
                  created:
                    description: |
                      The timestamp when this task was created
                    type: number
                  type:
                    description: |
                      What type of task is this [ `periodic`, `timed`]
                        - periodic are tasks that repeat periodically
                        - timed are tasks that execute once at a specific time
                    type: string
                  period:
                    description: |
                      this task should run each `period` seconds
                    type: number
                  offset:
                    description: |
                      time offset in seconds from the created timestamp
                    type: number
                  command:
                    description: |
                      the javascript function for this task
                    type: string
                  database:
                    description: |
                      the database this task belongs to
                    type: string
                  code:
                    description: |
                      The status code, 200 in this case.
                    type: number
                  error:
                    description: |
                      `false` in this case
                    type: boolean
                required:
                  - id
                  - created
                  - type
                  - period
                  - offset
                  - command
                  - database
                  - code
                  - error
        '400':
          description: |
            If the post body is not accurate, a *HTTP 400* is returned.
      tags:
        - Tasks
```

**Examples**



```curl
---
description: ''
version: '3.10'
render: input/output
name: RestTasksCreate
server_name: stable
type: single
---

    var url = "/_api/tasks/";

    // Note: prints stuff if server is running in non-daemon mode.
    var sampleTask = {
      name: "SampleTask",
      command: "(function(params) { require('@arangodb').print(params); })(params)",
      params: { "foo": "bar", "bar": "foo"},
      period: 2
    }
    var response = logCurlRequest('POST', url,
                                  sampleTask);

    assert(response.code === 200);

    logJsonResponse(response);

    // Cleanup:
    logCurlRequest('DELETE', url + response.parsedBody.id);

```
```openapi
## Create a task with ID

paths:
  /_api/tasks/{id}:
    put:
      operationId: createTaskWithId
      description: |
        Registers a new task with the specified ID.

        Not compatible with load balancers.
      parameters:
        - name: id
          in: path
          required: true
          description: |
            The id of the task to create
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  description: |
                    The name of the task
                  type: string
                command:
                  description: |
                    The JavaScript code to be executed
                  type: string
                params:
                  description: |
                    The parameters to be passed into command
                  type: string
                period:
                  description: |
                    number of seconds between the executions
                  type: integer
                offset:
                  description: |
                    Number of seconds initial delay
                  type: integer
              required:
                - name
                - command
                - params
      responses:
        '400':
          description: |
            If the task `id` already exists or the rest body is not accurate, *HTTP 400* is returned.
      tags:
        - Tasks
```

**Examples**



```curl
---
description: ''
version: '3.10'
render: input/output
name: RestTasksPutWithId
server_name: stable
type: single
---

    var url = "/_api/tasks/";

    // Note: prints stuff if server is running in non-daemon mode.
    var sampleTask = {
      id: "SampleTask",
      name: "SampleTask",
      command: "(function(params) { require('@arangodb').print(params); })(params)",
      params: { "foo": "bar", "bar": "foo"},
      period: 2
    }
    var response = logCurlRequest('PUT', url + 'sampleTask',
                                  sampleTask);
    assert(response.code === 200);

    logJsonResponse(response);

    // Cleanup:
    curlRequest('DELETE', url + 'sampleTask');
```
```openapi
## Delete a task

paths:
  /_api/tasks/{id}:
    delete:
      operationId: deleteTask
      description: |
        Deletes the task identified by `id` on the server.
      parameters:
        - name: id
          in: path
          required: true
          description: |
            The id of the task to delete.
          schema:
            type: string
      responses:
        '200':
          description: |
            If the task was deleted, *HTTP 200* is returned.
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    description: |
                      The status code, 200 in this case.
                    type: number
                  error:
                    description: |
                      `false` in this case
                    type: boolean
                required:
                  - code
                  - error
        '404':
          description: |
            If the task `id` is unknown, then an *HTTP 404* is returned.
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    description: |
                      The status code, 404 in this case.
                    type: number
                  error:
                    description: |
                      `true` in this case
                    type: boolean
                  errorMessage:
                    description: |
                      A plain text message stating what went wrong.
                    type: string
                required:
                  - code
                  - error
                  - errorMessage
      tags:
        - Tasks
```

**Examples**



```curl
---
description: |-
  Try to delete a non-existent task:
version: '3.10'
render: input/output
name: RestTasksDeleteFail
server_name: stable
type: single
---

    var url = "/_api/tasks/NoTaskWithThatName";

    var response = logCurlRequest('DELETE', url);

    assert(response.code === 404);

    logJsonResponse(response);
```


```curl
---
description: |-
  Remove existing task:
version: '3.10'
render: input/output
name: RestTasksDelete
server_name: stable
type: single
---

    var url = "/_api/tasks/";

    var sampleTask = {
      id: "SampleTask",
      name: "SampleTask",
      command: "2+2;",
      period: 2
    }
    // Ensure it's really not there:
    curlRequest('DELETE', url + sampleTask.id, null, null, [404,200]);
    // put in something we may delete:
    curlRequest('PUT', url + sampleTask.id,
                sampleTask);

    var response = logCurlRequest('DELETE', url + sampleTask.id);

    assert(response.code === 200);
    logJsonResponse(response);

```
