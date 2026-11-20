---
title: Role-based access control for AutoRAG
menuTitle: RBAC
weight: 62
description: >-
  Which roles and scopes you need to use the AutoRAG API, and which
  permissions each endpoint checks
---
{{< tag "Agentic AI Suite" >}}

If [role-based access control (RBAC)](../access-control/rbac.md) is enabled
in the Arango Contextual Data Platform, AutoRAG checks a permission for every
request, except for the health check. The permission is an **action** on the
database that the AutoRAG service is installed for, for example,
`ai:retriever.query` on `ai:database:sales`.

To use AutoRAG, you thus need:

- A predefined role that grants the action, which is `ai-user` for running
  queries and working with the query history, and `ai-developer` for also
  changing the model configuration.
- A scope for the role assignment that covers the database of the project,
  like `ai:database:sales`, or all databases.
- Read access to the database in ArangoDB, because AutoRAG reads the data with
  your token. See [Permissions in ArangoDB](#permissions-in-arangodb).

## Actions

{{% rbac-actions "retriever" %}}

The query history belongs to the AutoRAG service, not to the user who ran the
query. Runs are not attributed to users. Everyone who holds
`ai:retriever.query` on the database can list, read, and delete every run of
the AutoRAG service of that database.

The resource is always the database that the service is installed for. It is
taken from the configuration of the service and not from your request, so you
cannot direct the check to a different database. Projects are not resources of
their own, and the `{project}` path segment of the model configuration endpoint
doesn't change the resource. If you have access to a database, you have access
to all of its projects.

## Permissions per endpoint

{{% rbac-endpoints "retriever" %}}

## Permissions in ArangoDB

Unlike other AI services, AutoRAG always reads the data of a project in
ArangoDB with your token, independent of whether RBAC is also enabled for the
ArangoDB core database system
([ArangoDB RBAC](../access-control/rbac.md#access-to-the-data-in-arangodb)).
To run queries and to list or get runs, you therefore need read access to the
database in addition to the AutoRAG action:

- **ArangoDB RBAC disabled**: A
  [classic permission](../access-control/authorization.md) of read-only or
  read/write access to the project database.
- **ArangoDB RBAC enabled**: A `coredb-*` role like `coredb-reader` with a scope
  that covers the project database.

Read access is enough. AutoRAG writes the query history, the answer cache, and
the indexes and Views that a query needs with its own service identity, so you
don't need write access. AutoRAG checks your read access before it starts a
query and returns `403` if it is missing.

Deleting a run and changing the model configuration don't access the data with
your token and only require the AutoRAG action.

## Errors

| HTTP status | Cause |
|---|---|
| `401` | No `Authorization: Bearer <token>` header, or the token is invalid or expired. Also if ArangoDB rejects your token during a query |
| `403` | You lack the action on the database. The message names the action and the resource, for example `Not permitted: ai:retriever.query on ai:database:sales`. Also if you have no read access to the database in ArangoDB, with a message like `Database access denied` |
| `503` | The authorization service of the platform cannot be reached. The request is not carried out, and you can retry it |

## Example

Alice holds the `ai-user` role with a scope of the `sales` database
(`ai:database:sales`), and Bob holds the `ai-developer` role with a scope of
the `finance` database. Both have read access to their database in ArangoDB.
AutoRAG is installed for the `sales` database.

| Request | Alice | Bob |
|---|---|---|
| `POST /v1/graphrag-query` | Allowed | `403`, his scope covers a different database |
| `GET /v1/retriever-runs` | Allowed | `403` |
| `DELETE /v1/retriever-runs/{run_id}` | Allowed | `403` |
| `PUT /v1/projects/{project}/model-config/credentials` | `403`, her role doesn't grant the action | `403`, his scope doesn't cover `sales` |

For Bob to change the model configuration of this AutoRAG service, add
`ai:database:sales` to the scope of his role assignment. In the web interface,
this is the **Databases** resource type.
