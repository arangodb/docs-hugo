---
title: HTTP interface for server activities
menuTitle: Activities
weight: 8
description: >-
  The activities API is an observability feature that shows which high-level
  processes are currently ongoing in the database system
---
The activities API lets you observe which high-level processes are currently
running on the server, such as HTTP request handlers and AQL queries. Each
activity has a type, an optional parent (for nesting), and type-specific
metadata.

The permissions required to use the `/_admin/activities` endpoint depend on
the [`--activities.only-superuser-enabled` startup option](../../../components/arangodb-server/options.md#--activitiesonly-superuser-enabled).
By default, administrate access to the `_system` database is sufficient. If the
startup option is enabled, the endpoint requires a superuser authenticated with
a token created from the JWT secret.

## Get the activities

```openapi
paths:
  /_db/{database-name}/_admin/activities:
    get:
      operationId: getActivities
      description: |
        Returns the list of activities currently in progress on the server.
        Each activity has an identifier, a type (e.g. `RestHandler`, `AQLQuery`),
        an optional parent reference, and a `metadata` object. The structure of
        `metadata` depends on the activity type and may be extended in future
        versions.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of a database. Which database you use doesn't matter as long
            as the user account you authenticate with has at least read access
            to this database and administrate access to the `_system` database.
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
                        - parent
                        - metadata
                      properties:
                        id:
                          description: |
                            Unique identifier of the activity (opaque string).
                          type: string
                          example: "0x7ec9c067a7c0"
                        type:
                          description: |
                            The kind of activity (e.g. `RestHandler`, `AQLQuery`).
                          type: string
                          example: "RestHandler"
                        parent:
                          description: |
                            The parent activity, if any. Use `id` to correlate
                            with another entry in the list. The value `"0x0"` means no parent.
                          type: object
                          required:
                            - id
                          properties:
                            id:
                              description: |
                                Identifier of the parent activity.
                              type: string
                              example: "0x0"
                        metadata:
                          description: |
                            Type-specific details for this activity. The shape of
                            this object depends on the activity type and is
                            intentionally left flexible so the feature can grow
                            without breaking the API. Do not rely on a fixed schema.
                          type: object
        '401':
          description: |
            The request is not authorized because the user account you authenticated
            with lacks read access for the specified database.
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
                      The ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '403':
          description: |
            The request is not authorized. By default, administrate access to
            the `_system` database is required. If the `--activities.only-superuser-enabled`
            startup option is enabled, a superuser authenticated with a token created
            from the JWT secret is required.
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

```bash
curl --header 'accept: application/json' --dump - http://localhost:8529/_admin/activities
```

{{< details summary="Show output" >}}
```bash
{
  "activities": [
    {
      "id": "0x7ec9c067a7c0",
      "type": "RestHandler",
      "parent": {
        "id": "0x0"
      },
      "metadata": {
        "method": "GET",
        "url": "/_admin/activities",
        "handler": "ActivityRegistryRestHandler"
      }
    },
    {
      "id": "0x7ec9c067a040",
      "type": "RestHandler",
      "parent": {
        "id": "0x0"
      },
      "metadata": {
        "method": "POST",
        "url": "/_api/cursor",
        "handler": "RestCursorHandler"
      }
    },
    {
      "id": "0x7ec9c022f3c0",
      "type": "AQLQuery",
      "parent": {
        "id": "0x7ec9c067a040"
      },
      "metadata": {
        "query": "RETURN SLEEP(@seconds)"
      }
    }
  ]
}
```
{{< /details >}}
