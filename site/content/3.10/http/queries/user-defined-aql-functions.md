---
title: HTTP interface for user-defined AQL functions
menuTitle: User-defined AQL functions
weight: 15
description: >-
  The HTTP API for user-defined functions (UDFs) lets you add, delete, and list
  registered AQL extensions
archetype: default
---
{{< description >}}

AQL user functions are a means to extend the functionality
of ArangoDB's query language (AQL) with user-defined JavaScript code.

For an overview of over AQL user functions and their implications, please refer
to [Extending AQL](../../aql/user-functions/_index.md).

All user functions managed through this interface are stored in the
`_aqlfunctions` system collection. You should not modify the documents in this
collection directly, but only via the dedicated interfaces.

```openapi
## Create a user-defined AQL function

paths:
  /_api/aqlfunction:
    post:
      operationId: createAqlUserFunction
      description: |
        Registers a user-defined function (UDF) written in JavaScript for the use in
        AQL queries in the current database.

        In case of success, HTTP 200 is returned.
        If the function isn't valid etc. HTTP 400 including a detailed error message will be returned.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  description: |
                    the fully qualified name of the user functions.
                  type: string
                code:
                  description: |
                    a string representation of the function body.
                  type: string
                isDeterministic:
                  description: |
                    an optional boolean value to indicate whether the function
                    results are fully deterministic (function return value solely depends on
                    the input value and return value is the same for repeated calls with same
                    input). The `isDeterministic` attribute is currently not used but may be
                    used later for optimizations.
                  type: boolean
              required:
                - name
                - code
      responses:
        '200':
          description: |
            If the function already existed and was replaced by the
            call, the server will respond with *HTTP 200*.
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    description: |
                      boolean flag to indicate whether an error occurred (`false` in this case)
                    type: boolean
                  code:
                    description: |
                      the HTTP status code
                    type: integer
                  isNewlyCreated:
                    description: |
                      boolean flag to indicate whether the function was newly created (`false` in this case)
                    type: boolean
                required:
                  - error
                  - code
                  - isNewlyCreated
        '201':
          description: |
            If the function can be registered by the server, the server will respond with
            *HTTP 201*.
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    description: |
                      boolean flag to indicate whether an error occurred (`false` in this case)
                    type: boolean
                  code:
                    description: |
                      the HTTP status code
                    type: integer
                  isNewlyCreated:
                    description: |
                      boolean flag to indicate whether the function was newly created (`true` in this case)
                    type: boolean
                required:
                  - error
                  - code
                  - isNewlyCreated
        '400':
          description: |
            If the JSON representation is malformed or mandatory data is missing from the
            request, the server will respond with *HTTP 400*.
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    description: |
                      boolean flag to indicate whether an error occurred (`true` in this case)
                    type: boolean
                  code:
                    description: |
                      the HTTP status code
                    type: integer
                  errorNum:
                    description: |
                      the server error number
                    type: integer
                  errorMessage:
                    description: |
                      a descriptive error message
                    type: string
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
      tags:
        - Queries
```

**Examples**



```curl
---
description: ''
version: '3.10'
render: input/output
name: RestAqlfunctionCreate
server_name: stable
type: single
---

  var url = "/_api/aqlfunction";
  var body = {
    name: "myfunctions::temperature::celsiustofahrenheit",
    code : "function (celsius) { return celsius * 1.8 + 32; }",
    isDeterministic: true
  };

  var response = logCurlRequest('POST', url, body);

  assert(response.code === 200 || response.code === 201 || response.code === 202);

  logJsonResponse(response);
```
```openapi
## Remove a user-defined AQL function

paths:
  /_api/aqlfunction/{name}:
    delete:
      operationId: deleteAqlUserFunction
      description: |
        Deletes an existing user-defined function (UDF) or function group identified by
        `name` from the current database.
      parameters:
        - name: name
          in: path
          required: true
          description: |
            the name of the AQL user function.
          schema:
            type: string
        - name: group
          in: query
          required: false
          description: |
            - `true` The function name provided in `name` is treated as
              a namespace prefix, and all functions in the specified namespace will be deleted.
              The returned number of deleted functions may become 0 if none matches the string.
            - `false` The function name provided in `name` must be fully
              qualified, including any namespaces. If none matches the `name`, HTTP 404 is returned.
          schema:
            type: string
      responses:
        '200':
          description: |
            If the function can be removed by the server, the server will respond with
            *HTTP 200*.
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    description: |
                      boolean flag to indicate whether an error occurred (`false` in this case)
                    type: boolean
                  code:
                    description: |
                      the HTTP status code
                    type: integer
                  deletedCount:
                    description: |
                      The number of deleted user functions, always `1` when `group` is set to `false`.
                      Any number `>= 0` when `group` is set to `true`.
                    type: integer
                required:
                  - error
                  - code
                  - deletedCount
        '400':
          description: |
            If the user function name is malformed, the server will respond with *HTTP 400*.
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    description: |
                      boolean flag to indicate whether an error occurred (`true` in this case)
                    type: boolean
                  code:
                    description: |
                      the HTTP status code
                    type: integer
                  errorNum:
                    description: |
                      the server error number
                    type: integer
                  errorMessage:
                    description: |
                      a descriptive error message
                    type: string
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
        '404':
          description: |
            If the specified user function does not exist, the server will respond with *HTTP 404*.
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    description: |
                      boolean flag to indicate whether an error occurred (`true` in this case)
                    type: boolean
                  code:
                    description: |
                      the HTTP status code
                    type: integer
                  errorNum:
                    description: |
                      the server error number
                    type: integer
                  errorMessage:
                    description: |
                      a descriptive error message
                    type: string
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
      tags:
        - Queries
```

**Examples**



```curl
---
description: |-
  deletes a function:
version: '3.10'
render: input/output
name: RestAqlfunctionDelete
server_name: stable
type: single
---

  var url = "/_api/aqlfunction/square::x::y";

  var body = {
    name : "square::x::y",
    code : "function (x) { return x*x; }"
  };

  db._connection.POST("/_api/aqlfunction", body);
  var response = logCurlRequest('DELETE', url);

  assert(response.code === 200);

  logJsonResponse(response);
```


```curl
---
description: |-
  function not found:
version: '3.10'
render: input/output
name: RestAqlfunctionDeleteFails
server_name: stable
type: single
---

  var url = "/_api/aqlfunction/myfunction::x::y";
  var response = logCurlRequest('DELETE', url);

  assert(response.code === 404);

  logJsonResponse(response);
```
```openapi
## List the registered user-defined AQL functions

paths:
  /_api/aqlfunction:
    get:
      operationId: listAqlUserFunctions
      description: |
        Returns all registered user-defined functions (UDFs) for the use in AQL of the
        current database.

        The call returns a JSON array with status codes and all user functions found under `result`.
      parameters:
        - name: namespace
          in: query
          required: false
          description: |
            Returns all registered AQL user functions from the specified namespace.
          schema:
            type: string
      responses:
        '200':
          description: |
            on success *HTTP 200* is returned.
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    description: |
                      boolean flag to indicate whether an error occurred (`false` in this case)
                    type: boolean
                  code:
                    description: |
                      the HTTP status code
                    type: integer
                  result:
                    description: |
                      All functions, or the ones matching the `namespace` parameter
                    type: array
                    items:
                      type: object
                      properties:
                        name:
                          description: |
                            The fully qualified name of the user function
                          type: string
                        code:
                          description: |
                            A string representation of the function body
                          type: string
                        isDeterministic:
                          description: |
                            an optional boolean value to indicate whether the function
                            results are fully deterministic (function return value solely depends on
                            the input value and return value is the same for repeated calls with same
                            input). The `isDeterministic` attribute is currently not used but may be
                            used later for optimizations.
                          type: boolean
                      required:
                        - name
                        - code
                        - isDeterministic
                required:
                  - error
                  - code
                  - result
        '400':
          description: |
            If the user function name is malformed, the server will respond with *HTTP 400*.
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    description: |
                      boolean flag to indicate whether an error occurred (`true` in this case)
                    type: boolean
                  code:
                    description: |
                      the HTTP status code
                    type: integer
                  errorNum:
                    description: |
                      the server error number
                    type: integer
                  errorMessage:
                    description: |
                      a descriptive error message
                    type: string
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
      tags:
        - Queries
```

**Examples**



```curl
---
description: ''
version: '3.10'
render: input/output
name: RestAqlfunctionsGetAll
server_name: stable
type: single
---

  var url = "/_api/aqlfunction/test";

  var response = logCurlRequest('GET', url);

  assert(response.code === 200);

  logJsonResponse(response);
```
