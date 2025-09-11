---
title: HTTP interface for user-defined AQL functions
menuTitle: User-defined AQL functions
weight: 15
description: >-
  The HTTP API for user-defined functions (UDFs) lets you add, delete, and list
  registered AQL extensions
---
AQL user functions are a means to extend the functionality
of ArangoDB's query language (AQL) with user-defined JavaScript code.

For an overview of over AQL user functions and their implications, please refer
to [Extending AQL](../../../aql/user-defined-functions.md).

All user functions managed through this interface are stored in the
`_aqlfunctions` system collection. You should not modify the documents in this
collection directly, but only via the dedicated interfaces.

## Create a user-defined AQL function

```openapi
paths:
  /_db/{database-name}/_api/aqlfunction:
    post:
      operationId: createAqlUserFunction
      description: |
        Registers a user-defined function (UDF) written in JavaScript for the use in
        AQL queries in the current database.

        In case of success, HTTP 200 is returned.
        If the function isn't valid etc. HTTP 400 including a detailed error message will be returned.
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
                - code
              properties:
                name:
                  description: |
                    The fully qualified name of the user functions.
                  type: string
                code:
                  description: |
                    A string representation of the JavaScript function definition.
                  type: string
                isDeterministic:
                  description: |
                    Whether the function results are fully deterministic, i.e.
                    the function return value solely depends on the input value
                    and the return value is the same for repeated calls with same
                    input.

                    This attribute is currently not used but may be used for
                    optimizations in the future.
                  type: boolean
                  default: false
      responses:
        '200':
          description: |
            If the function already existed and was replaced by the
            call, the server will respond with *HTTP 200*.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - isNewlyCreated
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
                  isNewlyCreated:
                    description: |
                      boolean flag to indicate whether the function was newly created (`false` in this case)
                    type: boolean
        '201':
          description: |
            If the function can be registered by the server, the server will respond with
            *HTTP 201*.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - isNewlyCreated
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
                    example: 201
                  isNewlyCreated:
                    description: |
                      boolean flag to indicate whether the function was newly created (`true` in this case)
                    type: boolean
        '400':
          description: |
            If the JSON representation is malformed or mandatory data is missing from the
            request, the server will respond with *HTTP 400*.
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
                    example: 400
                  errorNum:
                    description: |
                      the server error number
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Queries
```

**Examples**

```curl
---
description: ''
name: RestAqlfunctionCreate
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

## Remove a user-defined AQL function

```openapi
paths:
  /_db/{database-name}/_api/aqlfunction/{name}:
    delete:
      operationId: deleteAqlUserFunction
      description: |
        Deletes an existing user-defined function (UDF) or function group identified by
        `name` from the current database.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
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
            Possible values:
            - `true`: The function name provided in `name` is treated as
              a namespace prefix, and all functions in the specified namespace will be deleted.
              The returned number of deleted functions may become 0 if none matches the string.
            - `false`: The function name provided in `name` must be fully
              qualified, including any namespaces. If none matches the `name`, HTTP 404 is returned.
          schema:
            type: boolean
            default: false
      responses:
        '200':
          description: |
            If the function can be removed by the server, the server will respond with
            *HTTP 200*.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - deletedCount
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
                  deletedCount:
                    description: |
                      The number of deleted user functions, always `1` when `group` is set to `false`.
                      Any number `>= 0` when `group` is set to `true`.
                    type: integer
        '400':
          description: |
            If the user function name is malformed, the server will respond with *HTTP 400*.
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
                    example: 400
                  errorNum:
                    description: |
                      the server error number
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            If the specified user function does not exist, the server will respond with *HTTP 404*.
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
                    example: 404
                  errorNum:
                    description: |
                      the server error number
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Queries
```

**Examples**

```curl
---
description: |-
  deletes a function:
name: RestAqlfunctionDelete
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
name: RestAqlfunctionDeleteFails
---
var url = "/_api/aqlfunction/myfunction::x::y";
var response = logCurlRequest('DELETE', url);

assert(response.code === 404);

logJsonResponse(response);
```

## List the registered user-defined AQL functions

```openapi
paths:
  /_db/{database-name}/_api/aqlfunction:
    get:
      operationId: listAqlUserFunctions
      description: |
        Returns all registered user-defined functions (UDFs) for the use in AQL of the
        current database.

        The call returns a JSON array with status codes and all user functions found under `result`.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
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
                      All functions, or the ones matching the `namespace` parameter
                    type: array
                    items:
                      type: object
                      required:
                        - name
                        - code
                        - isDeterministic
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
                            Whether the function results are fully deterministic, i.e.
                            the function return value solely depends on the input value
                            and the return value is the same for repeated calls with same
                            input.

                            This attribute is currently not used but may be used for
                            optimizations in the future.
                          type: boolean
        '400':
          description: |
            If the user function name is malformed, the server will respond with *HTTP 400*.
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
                    example: 400
                  errorNum:
                    description: |
                      the server error number
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Queries
```

**Examples**

```curl
---
description: ''
name: RestAqlfunctionsGetAll
---
var url = "/_api/aqlfunction/test";

var response = logCurlRequest('GET', url);

assert(response.code === 200);

logJsonResponse(response);
```
