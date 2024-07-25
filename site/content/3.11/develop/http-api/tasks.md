---
title: HTTP interface for tasks
menuTitle: Tasks
weight: 85
description: >-
  The HTTP API for tasks lets you can manage the periodic or timed execution of
  server-side JavaScript code
---
## List all tasks

```openapi
paths:
  /_db/{database-name}/_api/tasks/:
    get:
      operationId: listTasks
      description: |
        fetches all existing tasks on the server
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
            The list of tasks
          content:
            application/json:
              schema:
                description: |
                  a list of all tasks
                type: array
                items:
                  type: object
                  required:
                    - name
                    - id
                    - created
                    - type
                    - period
                    - offset
                    - command
                    - database
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
      tags:
        - Tasks
```

**Examples**

```curl
---
description: Fetching all tasks
name: RestTasksListAll
---
var url = "/_api/tasks";

var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);

```

## Get a task

```openapi
paths:
  /_db/{database-name}/_api/tasks/{id}:
    get:
      operationId: getTask
      description: |
        fetches one existing task on the server specified by `id`
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
                required:
                  - name
                  - id
                  - created
                  - type
                  - period
                  - offset
                  - command
                  - database
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
      tags:
        - Tasks
```

**Examples**

```curl
---
description: Fetching a single task by its id
name: RestTasksListOne
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
name: RestTasksListNonExisting
---
var url = "/_api/tasks/non-existing-task";

var response = logCurlRequest('GET', url);

assert(response.code === 404);
logJsonResponse(response);

```

## Create a task

```openapi
paths:
  /_db/{database-name}/_api/tasks:
    post:
      operationId: createTask
      description: |
        creates a new task with a generated id
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - name
                - command
                - params
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
      responses:
        '200':
          description: |
            The task was registered
          content:
            application/json:
              schema:
                type: object
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
name: RestTasksCreate
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
curlRequest('DELETE', url + response.parsedBody.id);
```

## Create a task with ID

```openapi
paths:
  /_db/{database-name}/_api/tasks/{id}:
    put:
      operationId: createTaskWithId
      description: |
        Registers a new task with the specified ID.

        Not compatible with load balancers.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
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
              required:
                - name
                - command
                - params
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
name: RestTasksPutWithId
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

## Delete a task

```openapi
paths:
  /_db/{database-name}/_api/tasks/{id}:
    delete:
      operationId: deleteTask
      description: |
        Deletes the task identified by `id` on the server.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has administrate access
            to this database.
          schema:
            type: string
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
                required:
                  - code
                  - error
                properties:
                  code:
                    description: |
                      The status code, 200 in this case.
                    type: number
                  error:
                    description: |
                      `false` in this case
                    type: boolean
        '404':
          description: |
            If the task `id` is unknown, then an *HTTP 404* is returned.
          content:
            application/json:
              schema:
                type: object
                required:
                  - code
                  - error
                  - errorMessage
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
      tags:
        - Tasks
```

**Examples**

```curl
---
description: |-
  Try to delete a non-existent task:
name: RestTasksDeleteFail
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
name: RestTasksDelete
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
