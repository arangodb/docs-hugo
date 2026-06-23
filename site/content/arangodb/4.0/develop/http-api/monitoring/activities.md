---
title: HTTP interface for server activities
menuTitle: Activities
weight: 8
description: >-
  The activities API is an observability feature that shows which high-level
  processes are currently ongoing in the database system
---
The activities API lets you observe which high-level processes are currently
running on the server, such as HTTP request handlers, AQL queries, transactions,
and index creations.

Each activity has a type, creation time, an optional parent to indicate a
dependency, and type-specific data. Not all server activity is necessarily
reported.

## Get the activities (experimental)

```openapi
---
apiVersions: [experimental]
---
paths:
  /_db/{database-name}/_admin/activities:
    get:
      operationId: getActivities
      description: |
        {{</* warning */>}}
        The activities API is incomplete and thus an experimental feature.
        {{</* /warning */>}}

        Returns the list of activities currently in progress on the server.
        Each activity has an identifier, a type (e.g. `RestHandler`, `AqlQuery`,
        `TransactionActivity`), a creation time, an optional parent reference,
        and a `data` object. The structure of `data` depends on the activity type
        and may be extended in future versions.

        The permissions required to use the endpoint depend on the
        [`--activities.only-superuser-enabled` startup option](../../../components/arangodb-server/options.md#--activitiesonly-superuser-enabled).
        By default, *administrate* access for the `_system` database is
        sufficient. If the startup option is enabled, the endpoint is restricted
        to the superuser and you therefore need to authenticate with a token
        created from the JWT secret.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database and write access to the `_system` database.
          schema:
            type: string
      responses:
        '200':
          description: |
            The list of activities was returned successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - activities
                properties:
                  activities:
                    description: |
                      Array of activity objects currently in progress.
                    type: array
                    items:
                      type: object
                      required:
                        - id
                        - type
                        - created
                        - data
                      properties:
                        id:
                          description: |
                            Unique identifier of the activity.
                          type: integer
                          example: 370
                        type:
                          description: |
                            The kind of activity (e.g. `RestHandler`, `AQLQuery`).
                          type: string
                          example: "RestHandler"
                        created:
                          description: |
                            The start time of the activity (in ISO 8601 format).
                          type: string
                          format: date-time
                        parent:
                          description: |
                            The `id` of the parent activity, if any.
                          type: integer
                          example: 370
                        data:
                          description: |
                            Type-specific details for this activity. The shape of
                            this object depends on the activity type and is
                            intentionally left flexible so the feature can grow
                            without breaking the API. Do not rely on a fixed schema.
                          type: object
        '401':
          description: |
            The user account you authenticated with lacks read access for the
            specified database, the credentials are wrong, or the user account
            is inactive.
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
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '403':
          description: |
            The request is not authorized due to a lack of permissions.
            The reason depends on the setting of the
            `--activities.only-superuser-enabled` startup option:

            - `false`: The endpoint is restricted to admin users but the
              user account you authenticated with lacks write access to the
              `_system` database.
            - `true`: The endpoint is restricted to the superuser but you didn't
              authenticate with a token created from the JWT secret.
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
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '405':
          description: |
            Returned when an HTTP method other than `GET` is used.
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
                    example: 405
                  errorNum:
                    description: |
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Monitoring
```

**Examples**

{{< comment >}}
Example not generated because it changes on every run and it is difficult to control what/how many activities get included.
{{< /comment >}}

```bash
curl --header 'accept: application/json' --dump - http://localhost:8529/_arango/experimental/_admin/activities
```

{{< details summary="Show output" >}}
```json
{
  "activities": [
    {
      "id": 372,
      "type": "RestHandler",
      "created": "2026-03-26T15:43:56Z",
      "data": {
        "method": "GET",
        "url": "/_admin/activities",
        "handler": "ActivityRegistryRestHandler"
      }
    },
    {
      "id": 371,
      "type": "AqlQuery",
      "created": "2026-03-26T15:43:54Z",
      "parent": 370,
      "data": {
        "queryId": 0,
        "startTime": 20919.354783951,
        "database": "_system",
        "user": "",
        "queryString": "RETURN SLEEP(@seconds)",
        ...
      }
    },
    {
      "id": 370,
      "type": "RestHandler",
      "created": "2026-03-26T15:43:54Z",
      "data": {
        "method": "POST",
        "url": "/_api/cursor",
        "handler": "RestCursorHandler"
      }
    }
  ]
}
```
{{< /details >}}
