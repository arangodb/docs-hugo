---
title: Cypher to AQL Translation Service
menuTitle: Cypher to AQL
weight: 25
description: >-
  Translate Cypher queries to AQL for use with ArangoDB with the `cypher2aql`
  service for the Data Platform
---
{{< warning >}}
The Cypher to AQL service is **experimental**. The API and supported Cypher
subset may change in future releases.
{{< /warning >}}

The **Cypher to AQL** service translates [Cypher](https://neo4j.com/docs/cypher-manual/current/)
queries into [AQL](../arangodb/3.12/aql/_index.md) (ArangoDB Query Language).
You send a Cypher query to the service and receive the equivalent AQL query,
which you can then run against your ArangoDB deployment.

## Purpose

<!--
- **Adopt Cypher syntax**: Use Cypher-style `MATCH` patterns and `RETURN` clauses when you prefer that notation or when integrating with tooling that speaks Cypher.
-->
- **Bridge to AQL**: Get executable AQL that runs on ArangoDB, so you can reuse
  existing Cypher knowledge or scripts without rewriting them manually.
- **Single read-query flow**: The service focuses on read-only query translation
  (e.g. `MATCH ... RETURN`). It does not execute the query; you run the returned
  AQL yourself against ArangoDB.
- **API use only**: The translation service can be used via an HTTP API but not
  the web interface of the Data Platform.

## High-level workflow

1. **Start the service**:
   Use the Arango Control Plane (ACP) to start an instance of the Cypher to AQL
   service (`arango-cypher2aql`) in your Contextual Data Platform deployment.<!-- TODO: Start via container manager? -->
2. **Determine the API path**: 
   The platform exposes the service at a base URL (`/cypher2aql/<SERVICE_ID>/v1`).
3. **Send a Cypher query**:
   Send a `POST` request to the translate endpoint (`/cypher2aql`) with a JSON
   body containing your Cypher query string (and optionally a database name for
   future use). <!-- TODO: db name?! -->
4. **Receive AQL query**:
   The response contains both the original Cypher query as well as the translated
   AQL query in the `cypher` and `AQL` attributes when translation succeeds.
   If the Cypher is unsupported or invalid, the response includes an error flag
   and message.
5. **Validate the query**:
   Review the generated AQL query and adjust it if needed.
5. **Run the query**:
   Execute the returned AQL query against your ArangoDB database.

## HTTP API

The service exposes a small HTTP API under the versioned path `/v1/`. In the examples, replace `<EXTERNAL_ENDPOINT>` with your Data Platform endpoint (e.g. `data-platform.example.org`) and `<SERVICE_ID>` with the Cypher to AQL service ID from your platform (the suffix assigned when the service is started).

All requests and responses use JSON and the `application/json` content type. Authentication is required when the platform has it enabled; use the same credentials (e.g. JWT or basic auth) that you use for other platform services.

{{< info >}}
If your deployment uses a self-signed certificate, you may need to use `-k` or `--insecure` with cURL for testing.
{{< /info >}}

### Deploy an `arango-cypher2aql` service

Use the ACP service to create a generic service

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
```

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
            The ID of the Cypher to AQL service instance that runs in the data platform.
          schema:
            type: string
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
            When the Cypher is invalid or uses unsupported features, the service
            still returns HTTP 200 but sets `error` to `true`, `errorCode` to 422,
            and `errorMessage` with an explanation.
          content:
            application/json:
              schema:
                type: object
                properties:
                  cypher:
                    description: The original Cypher query.
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
                    description: Empty on success; short explanation of the error otherwise.
                    type: string
                  errorCode:
                    description: `0` on success; `422` on translation failure; `400` on client error.
                    type: number
        '400':
          description: |
            The request body is missing, not valid JSON, or cannot be read.
            The body is still a JSON object with `error`, `errorMessage`, and `errorCode`.
        '401':
          description: |
            The platform has authentication enabled and the request is missing or invalid credentials.
```

**Example: successful translation**

```bash
curl -s -X POST "https://<EXTERNAL_ENDPOINT>:8529/cypher2aql/<SERVICE_ID>/v1/cypher2aql" \
  -H "Content-Type: application/json" \
  -H "Authorization: bearer <YOUR_TOKEN>" \
  -d '{"cypher":"MATCH (n:Person) RETURN n"}'
```

Example response:

```json
{
  "cypher": "MATCH (n:Person) RETURN n",
  "AQL": "FOR n IN person FILTER n != null RETURN n",
  "error": false,
  "errorMessage": "",
  "errorCode": 0
}
```

**Example: with optional database field**

```bash
curl -s -X POST "https://<EXTERNAL_ENDPOINT>:8529/cypher2aql/<SERVICE_ID>/v1/cypher2aql" \
  -H "Content-Type: application/json" \
  -H "Authorization: bearer <YOUR_TOKEN>" \
  -d '{"cypher":"MATCH (n) RETURN n LIMIT 10", "database": "mydb"}'
```

### Service version

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
            The ID of the Cypher to AQL service instance that runs in the data platform.
          schema:
            type: string
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
                    description: Version identifier of the service.
                    type: string
```

**Example**

```bash
curl -s "https://<EXTERNAL_ENDPOINT>:8529/cypher2aql/<SERVICE_ID>/v1/version" \
  -H "Authorization: bearer <YOUR_TOKEN>"
```

Example response:

```json
{
  "version": "0.1.0"
}
```

### Health check

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
            The ID of the Cypher to AQL service instance that runs in the data platform.
          schema:
            type: string
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
```

**Example**

```bash
curl -s "https://<EXTERNAL_ENDPOINT>:8529/cypher2aql/<SERVICE_ID>/v1/health" \
  -H "Authorization: bearer <YOUR_TOKEN>"
```

Example response:

```json
{
  "status": "ok"
}
```

### Uninstall the `arango-cypher2aql` service

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
        Stop a service instance using the Arango Control Plane (ACP).
      parameters:
        - name: serviceId
          in: path
          required: true
          description: |
            The ID of the service to stop, here the ID of a
            `arango-cypher2aql` service instance.
          schema:
            type: string
      responses:
        '200':
          description: |
            The service instance was successfully stopped.
```

## Supported Cypher and limitations

The translator supports a subset of Cypher focused on read-only query patterns:

- **Supported**: Single-statement queries with `MATCH`, optional `WHERE`, `ORDER BY`, `SKIP`, `LIMIT`, `WITH`, and `RETURN`. Node and relationship patterns are constrained (e.g. no variable-length relationships, no `OPTIONAL MATCH`). The pattern graph must be connected and acyclic. Only simple label expressions for nodes and relationship types are supported (no union/intersection-style expressions). Aggregations are limited to standard aggregation functions.
- **Not supported**: Schema changes, write statements (`CREATE`, `DELETE`, etc.), `UNION`, `OPTIONAL MATCH`, variable-length relationships, `SHORTEST_PATH`, and more complex label or type expressions.

If you send unsupported or invalid Cypher, the service returns HTTP 200 with `error: true`, `errorCode: 422`, and an `errorMessage` describing the issue. Use that message to adjust your query or fall back to writing AQL directly.
