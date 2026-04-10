---
title: Cypher to AQL Translation Service
menuTitle: Cypher to AQL
weight: 28
description: >-
  Translate Cypher queries to AQL for use with ArangoDB using the
  `arango-cypher2aql` service, available for the Arango Contextual Data Platform
---
{{< warning >}}
The Cypher to AQL service is **experimental**. The API and supported Cypher
subset may change in future releases.
{{< /warning >}}

The `arango-cypher2aql` service translates [Cypher](https://neo4j.com/docs/cypher-manual/current/)
queries into [AQL](../arangodb/3.12/aql/_index.md) (ArangoDB Query Language).
You send a Cypher query to the service and receive the equivalent AQL query,
which you can then run against your ArangoDB deployment.

## Purpose

- **Bridge to AQL**: Get executable AQL that runs on ArangoDB, so you can reuse
  existing Cypher knowledge or scripts without rewriting them manually.
- **Single read-query flow**: The service focuses on read-only query translation
  (e.g. `MATCH ... RETURN`). It does not execute the query; you run the returned
  AQL yourself against ArangoDB.
- **API use only**: The translation service can be used via an HTTP API but not
  the web interface of the Contextual Data Platform.

## High-level workflow

1. **Start the service**:\
   Use the Arango Control Plane (ACP) to start an instance of the Cypher to AQL
   service (`arango-cypher2aql`) in your data platform deployment.
2. **Determine the API path**:\
   The platform exposes the service at a base URL (`/cypher2aql/<SERVICE_ID>/v1`).
3. **Send a Cypher query**:\
   Send a `POST` request to the translate endpoint (`/cypher2aql`) with a JSON
   body containing your Cypher query string
   <!-- TODO: Currently unused:
   and optionally a database name -->
4. **Receive AQL query**:\
   The response contains both the original Cypher query as well as the translated
   AQL query in the `cypher` and `AQL` attributes when translation succeeds.
   If the Cypher is unsupported or invalid, the response includes an error flag
   and message.
5. **Validate the query**:\
   Review the generated AQL query and adjust it if needed.
5. **Run the query**:\
   Execute the returned AQL query against your ArangoDB database.

## HTTP API

The service exposes a small HTTP API under the versioned path `/v1/`. In the
examples, replace `<EXTERNAL_ENDPOINT>` with your data platform endpoint
(e.g. `data-platform.example.org`).

All requests and responses use JSON and the `application/json` content type.

{{< info >}}
If your deployment uses a self-signed certificate, you may need to specify the
`-k` or `--insecure` option of cURL.
{{< /info >}}

### Deploy an `arango-cypher2aql` service

Use the ACP service to create a generic service.

```openapi
---
service: cypher2aql
---
paths:
  /_platform/acp/v1/service:
    post:
      operationId: createService
      description: |
        Deploy an `arango-cypher2aql` service with the Arango Control Plane (ACP)
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - service_name
              properties:
                service_name:
                  description: |
                    The name of the service to deploy, here `"arango-cypher2aql"`.
                  type: string
                  const: arango-cypher2aql
      responses:
        '200':
          description: |
            Successfully deployed the service. It may not be ready immediately
            for responding to requests.
          content:
            application/json:
              schema:
                type: object
                properties:
                  serviceInfo:
                    description: |
                      Information about the deployed service.
                    type: object
                    properties:
                      serviceId:
                        description: |
                          The unique identifier assigned to the service.
                        type: string
                        example: arango-cypher2aql-z8fue
                      description:
                        description: |
                          A human-readable status message about the deployment.
                        type: string
                        example: Install complete
                      status:
                        description: |
                          The deployment status of the service.
                        type: string
                        example: DEPLOYED
                      namespace:
                        description: |
                          The namespace in which the service is deployed.
                        type: string
                      managingEntity:
                        description: |
                          The entity managing the service.
                        type: string
                        example: ACP
        '400':
          description: |
            The request body has invalid JSON syntax.
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    description: |
                      The gRPC status code. `3` corresponds to `INVALID_ARGUMENT`.
                    type: integer
                    example: 3
                  message:
                    description: |
                      A message describing the syntax error.
                    type: string
                  details:
                    description: |
                      Additional error details (typically empty).
                    type: array
                    items:
                      type: object
        '401':
          description: |
            The data platform has authentication enabled but the request misses
            or contains invalid credentials.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    description: |
                      An error message indicating that the request is unauthorized.
                    type: string
                    example: Unauthorized
        '500':
          description: |
            An internal server error occurred, for example, because the
            service could not be found or a required field is missing.
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    description: |
                      The gRPC status code. `13` corresponds to `INTERNAL`.
                    type: integer
                    example: 13
                  message:
                    description: |
                      A message describing the internal error.
                    type: string
                  details:
                    description: |
                      Additional error details (typically empty).
                    type: array
                    items:
                      type: object
```

**Example**

```bash
curl -s "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/service" \
  -H "Authorization: bearer <YOUR_TOKEN>" \
  -d '{"service_name":"arango-cypher2aql"}'
```

{{< details summary="Show output" >}}
```json
{
  "serviceInfo": {
    "serviceId": "arango-cypher2aql-z8fue",
    "description": "Install complete",
    "status": "DEPLOYED",
    "namespace": "arango",
    "managingEntity": "ACP"
  }
}
```
{{< /details >}}

### Translate Cypher to AQL

```openapi
---
service: cypher2aql
---
paths:
  /cypher2aql/{serviceId}/v1/cypher2aql:
    post:
      operationId: translateCypherToAql
      description: |
        Translates a query string from Cypher to AQL.
      parameters:
        - name: serviceId
          in: path
          required: true
          description: |
            The ID of the Cypher to AQL service that runs in the data platform.
          schema:
            type: string
            example: arango-cypher2aql-z8fue
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - cypher
              properties:
                cypher:
                  description: |
                    The Cypher query to translate.
                  type: string
                database:
                  description: |
                    Reserved for future use; can be omitted.
                  type: string
      responses:
        '200':
          description: |
            Translation result. When translation succeeds, `error` is `false`.
            When the Cypher query is invalid or uses unsupported features, the
            service still returns the HTTP status code `200` but sets `error`
            to `true`, `errorCode` to 422, and `errorMessage` to an explanation
            of the problem.
          content:
            application/json:
              schema:
                type: object
                properties:
                  cypher:
                    description: |
                      The original Cypher query.
                    type: string
                  AQL:
                    description: |
                      The translated AQL query when successful; empty on translation failure.
                    type: string
                  error:
                    description: |
                      `false` on success; `true` when translation failed or request was invalid.
                    type: boolean
                  errorMessage:
                    description: |
                      Empty on success; short explanation of the error otherwise.
                    type: string
                  errorCode:
                    description: |
                      `0` on success; `422` on translation failure; `400` on client error.
                    type: number
        '400':
          description: |
            The request body is missing, not valid JSON, or cannot be read.
          content:
            application/json:
              schema:
                type: object
                properties:
                  cypher:
                    description: |
                      Empty string.
                    type: string
                  AQL:
                    description: |
                      Empty string.
                    type: string
                  error:
                    description: |
                      Always `true` for this status code.
                    type: boolean
                    example: true
                  errorMessage:
                    description: |
                      A message describing why the request body could not be parsed.
                    type: string
                  errorCode:
                    description: |
                      Always `400` for this status code.
                    type: number
                    example: 400
        '401':
          description: |
            The data platform has authentication enabled but the request misses
            or contains invalid credentials.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    description: |
                      An error message indicating that the request is unauthorized.
                    type: string
                    example: Unauthorized
```

**Example: successful translation**

```bash
curl -s -X POST "https://<EXTERNAL_ENDPOINT>:8529/cypher2aql/<SERVICE_ID>/v1/cypher2aql" \
  -H "Content-Type: application/json" \
  -H "Authorization: bearer <YOUR_TOKEN>" \
  -d '{"cypher":"MATCH (n:Person) RETURN n"}'
```

{{< details summary="Show output" >}}
```json
{
  "cypher": "MATCH (n:Person) RETURN n",
  "AQL": "FOR n IN person FILTER n != null RETURN n",
  "error": false,
  "errorMessage": "",
  "errorCode": 0
}
```
{{< /details >}}

### Get the service version

```openapi
---
service: cypher2aql
---
paths:
  /cypher2aql/{serviceId}/v1/version:
    get:
      operationId: getVersion
      description: |
        Returns the service version.
      parameters:
        - name: serviceId
          in: path
          required: true
          description: |
            The ID of the Cypher to AQL service that runs in the data platform.
          schema:
            type: string
            example: arango-cypher2aql-z8fue
      responses:
        '200':
          description: |
            Version identifier of the service.
          content:
            application/json:
              schema:
                type: object
                properties:
                  version:
                    description: |
                      Version identifier of the service.
                    type: string
                    example: "0.9.5"
        '401':
          description: |
            The data platform has authentication enabled but the request misses
            or contains invalid credentials.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    description: |
                      An error message indicating that the request is unauthorized.
                    type: string
                    example: Unauthorized
```

**Example**

```bash
curl -s "https://<EXTERNAL_ENDPOINT>:8529/cypher2aql/<SERVICE_ID>/v1/version" \
  -H "Authorization: bearer <YOUR_TOKEN>"
```

{{< details summary="Show output" >}}
```json
{
  "version": "0.9.5"
}
```
{{< /details >}}

### Check the service health

```openapi
---
service: cypher2aql
---
paths:
  /cypher2aql/{serviceId}/v1/health:
    get:
      operationId: getHealth
      description: |
        Returns a simple health status.
      parameters:
        - name: serviceId
          in: path
          required: true
          description: |
            The ID of the Cypher to AQL service that runs in the data platform.
          schema:
            type: string
            example: arango-cypher2aql-z8fue
      responses:
        '200':
          description: |
            The health status.
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    description: |
                      The service is healthy.
                    type: string
                    example: ok
        '401':
          description: |
            The data platform has authentication enabled but the request misses
            or contains invalid credentials.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    description: |
                      An error message indicating that the request is unauthorized.
                    type: string
                    example: Unauthorized
```

**Example**

```bash
curl -s "https://<EXTERNAL_ENDPOINT>:8529/cypher2aql/<SERVICE_ID>/v1/health" \
  -H "Authorization: bearer <YOUR_TOKEN>"
```

{{< details summary="Show output" >}}
```json
{
  "status": "ok"
}
```
{{< /details >}}

### Uninstall a `arango-cypher2aql` service

Use the ACP service to delete the service.

```openapi
---
service: cypher2aql
---
paths:
  /_platform/acp/v1/service/{serviceId}:
    delete:
      operationId: deleteService
      description: |
        Stop a service using the Arango Control Plane (ACP).
      parameters:
        - name: serviceId
          in: path
          required: true
          description: |
            The ID of the service to stop, here the ID of an
            `arango-cypher2aql` service.
          schema:
            type: string
            example: arango-cypher2aql-z8fue
      responses:
        '200':
          description: |
            The service was successfully stopped.
          content:
            application/json:
              schema:
                type: object
                properties:
                  serviceInfo:
                    description: |
                      Information about the uninstalled service.
                    type: object
                    properties:
                      serviceId:
                        description: |
                          The unique identifier of the service.
                        type: string
                        example: arango-cypher2aql-z8fue
                      description:
                        description: |
                          A human-readable status message about the uninstallation.
                        type: string
                        example: Uninstallation complete
                      status:
                        description: |
                          The status of the service after deletion.
                        type: string
                        example: UNINSTALLED
                      namespace:
                        description: |
                          The namespace the service was deployed in.
                        type: string
                      managingEntity:
                        description: |
                          The entity that managed the service.
                        type: string
                        example: ACP
        '401':
          description: |
            The data platform has authentication enabled but the request misses
            or contains invalid credentials.
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    description: |
                      An error message indicating that the request is unauthorized.
                    type: string
                    example: Unauthorized
        '500':
          description: |
            An internal server error occurred, for example, because the
            service ID is unknown or missing from the request path.
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    description: |
                      The gRPC status code. `13` corresponds to `INTERNAL`.
                    type: integer
                    example: 13
                  message:
                    description: |
                      A message describing the internal error.
                    type: string
                  details:
                    description: |
                      Additional error details (typically empty).
                    type: array
                    items:
                      type: object
```

**Example**

```bash
curl -s -X DELETE "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/service/<SERVICE_ID>" \
  -H "Authorization: bearer <YOUR_TOKEN>"
```

{{< details summary="Show output" >}}
```json
{
  "serviceInfo": {
    "serviceId": "arango-cypher2aql-z8fue",
    "description": "Uninstallation complete",
    "status": "UNINSTALLED",
    "namespace": "arango",
    "managingEntity": "ACP"
  }
}
```
{{< /details >}}

## Supported Cypher subset and limitations

The translator supports a subset of Cypher focused on read-only query patterns:

**Supported**:

- Single-statement queries with `MATCH`,
  optionally `WHERE`, `ORDER BY`, `SKIP`, `LIMIT`, `WITH`, and `RETURN`.
- Node and relationship patterns are constrained (e.g. no variable-length
  relationships, no `OPTIONAL MATCH`).
- The pattern graph must be connected and acyclic.
- Only simple label expressions for nodes and relationship types
  (no union/intersection-style expressions).
- Aggregations are limited to standard aggregation functions.

**Not supported**:

- Schema changes
- Write statements (`CREATE`, `DELETE`, etc.)
- `UNION`
- `OPTIONAL MATCH`
- `SHORTEST_PATH`
- Variable-length relationships
- More complex label or type expressions

If you send unsupported or invalid Cypher, the service returns an `errorMessage`
describing the issue. Use that message to adjust your query or fall back to
writing AQL directly.
