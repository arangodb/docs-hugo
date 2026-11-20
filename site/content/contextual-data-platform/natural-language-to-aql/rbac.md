---
title: Role-based access control for Natural Language to AQL
menuTitle: RBAC
weight: 25
description: >-
  Which roles and scopes you need to use the Natural Language to AQL API, and
  which permissions each endpoint checks
---
{{< tag "Agentic AI Suite" "Beta" >}}

If [role-based access control (RBAC)](../access-control/rbac.md) is enabled
in the Arango Contextual Data Platform, the Natural Language to AQL service
checks a permission for every request, except for the health check. The
permission is an **action** on the database that the service is installed for,
for example, `ai:nls.query` on `ai:database:sales`.

To use the service, you thus need:

- The `ai-user` or `ai-developer` role. Both grant all actions of the service.
- A scope for the role assignment that covers the database that the service is
  installed for, like `ai:database:sales`, or all databases.
- Read access to the database in ArangoDB, because the service reads the
  schema and the data with your token. See
  [Permissions in ArangoDB](#permissions-in-arangodb).

## Actions

{{% rbac-actions "nls" %}}

The resource is always the database that the service is installed for. It is
taken from the configuration of the service and not from your request, so you
cannot direct the check to a different database.

## Permissions per endpoint

{{% rbac-endpoints "nls" %}}

The `POST /v1/process_text_stream` endpoint checks the action that matches the
mode of the request. Without a `mode`, or with any mode other than `aqlizer`,
it only sends your question to the model and requires `ai:nls.ask`. In the
`aqlizer` mode (in any letter case), it reads the schema and sample documents
of the database and requires `ai:nls.query`. The **AQLizer** tab of the web
interface uses this mode.

## Permissions in ArangoDB

The service reads the database with your token: it checks your access to the
database, reads the schema and sample documents, and runs the generated AQL
queries, which are read-only. It has no access to the database of its own. This
is the same whether or not
[ArangoDB RBAC](../access-control/rbac.md#access-to-the-data-in-arangodb)
is enabled:

- **ArangoDB RBAC disabled**: You need the classic read-only or read/write
  [permission](../access-control/authorization.md) for the database.
- **ArangoDB RBAC enabled**: You need a `coredb-*` role, like `coredb-reader`,
  with a scope that covers the database and the collections, Views, and
  Analyzers that the generated queries read.

If you have the action of the service but no read access to the database, the
request fails with `403` and the message `Database access denied`, before the
service calls the model.

The database report that the `aqlizer` mode builds, with the collections,
indexes, and sample documents, is cached per user for up to 15 minutes. Each
user only gets a report that was built with their own access. A user whose
access to the database is revoked is denied immediately, but a user whose
access to individual collections is reduced can still see the names and
samples of these collections until the cached report expires.

## Errors

| HTTP status | Cause |
|---|---|
| `400` | The question is empty |
| `401` | No `Authorization: Bearer <token>` header, or the token is invalid or expired |
| `403` | You lack the action on the database, or you have no read access to the database in ArangoDB (`Database access denied`) |
| `503` | The authorization service of the platform cannot be reached, or your token is close to expiry and cannot be renewed. The request is not carried out, and you can retry it |

The service renews your token for long-running requests if it has less than
an hour left. You don't need any additional permission for this.

## Example

Alice holds the `ai-user` role with a scope of the `sales` database
(`ai:database:sales`) and can read the `sales` database in ArangoDB. Bob holds
the `ai-developer` role with a scope of the `finance` database. The service is
installed for the `sales` database.

| Request | Alice | Bob |
|---|---|---|
| `POST /v1/process_text` | Allowed | `403`, his scope covers a different database |
| `POST /v1/translate_query` | Allowed | `403` |
| `POST /v1/process_text_stream` with `mode` set to `aqlizer` | Allowed | `403` |

If Alice loses read access to the `sales` database in ArangoDB, the requests
that read the database fail with `403` even though she still holds the role.
