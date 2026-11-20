---
title: Role-based access control for the Importer
menuTitle: RBAC
weight: 88
description: >-
  Which roles and scopes you need to use the Importer API, and which
  permissions each endpoint checks
---
{{< tag "Agentic AI Suite" >}}

If [role-based access control (RBAC)](../../access-control/rbac.md) is enabled
in the Arango Contextual Data Platform, the Importer checks a permission for
every request, except for the health check. The permission is an **action** on
the database that the Importer service is installed for, for example,
`ai:importer.import` on `ai:database:sales`.

To use the Importer directly, you thus need:

- A predefined role that grants the action, which is `ai-user` for reading the
  status of import jobs, and `ai-developer` for importing, reclustering, and
  retiring imports.
- A scope for the role assignment that covers the database of the project,
  like `ai:database:sales`, or all databases.

When AutoGraph runs the Importer for you, AutoGraph checks your permissions
instead. See [Role-based access control for AutoGraph](../reference/rbac.md).

## Actions

{{% rbac-actions "importer" %}}

Import jobs are not attributed to a user. Everyone who holds
`ai:importer.read` on the database can read every job of the Importer
service of that database, and everyone who holds `ai:importer.data.manage`
can retire it.

The resource is always the database that the service is installed for. It is
taken from the configuration of the service and not from your request, so you
cannot direct the check to a different database. Projects are not resources of
their own. If you have access to a database, you have access to all of its
projects.

## Permissions per endpoint

{{% rbac-endpoints "importer" %}}

## Permissions in ArangoDB

The Importer writes the collections and the graph of a project in ArangoDB.
Whose permissions apply to this work depends on whether RBAC is also enabled
for the ArangoDB core database system
([ArangoDB RBAC](../../access-control/rbac.md#access-to-the-data-in-arangodb)):

- **ArangoDB RBAC disabled**: The Importer works in ArangoDB with your token.
  For importing, reclustering, and retiring imports, you need a
  [classic permission](../../access-control/authorization.md) of read/write
  access to the project database in addition to the Importer actions. The
  Importer opens the database before it starts the work and returns `403` if
  you have no access at all. With read-only access, the request is accepted,
  but the job fails on its first write. For long-running jobs, the Importer
  renews your token automatically.
- **ArangoDB RBAC enabled**: The Importer works in ArangoDB with its own service
  identity, whose permissions are limited to the collections and the graph of
  its project. You don't need any permission in ArangoDB to use the Importer.
  To explore the resulting knowledge graph in the web interface or with
  queries, you still need a `coredb-*` role that covers the project database.

Reading the status of jobs doesn't access the database with your token in
either case, and calls to the File Manager and the File Parser always use the
service identity of the Importer.

## Errors

| HTTP status | Cause |
|---|---|
| `401` | No `Authorization: Bearer <token>` header, or the token is invalid or expired. With ArangoDB RBAC disabled, also if your token is close to expiry and cannot be renewed |
| `403` | You lack the action on the database. The message names the action and the resource, for example `Not permitted: ai:importer.import on ai:database:sales`. With ArangoDB RBAC disabled, also if you have no access to the project database in ArangoDB (`Database access denied`) |
| `500` | With ArangoDB RBAC enabled, ArangoDB refused the service identity of the Importer. This is a problem of the deployment, not of your permissions |
| `503` | The authentication or authorization service of the platform cannot be reached. The request is not carried out, and you can retry it |

`POST /v1/import-multiple` reports missing access to the project database in
ArangoDB with `HTTP 200`, `"success": false`, and a message that starts with
`Database access denied`, like other failures of this endpoint.

## Example

Alice holds the `ai-user` role and Bob the `ai-developer` role, both with a
scope of the `sales` database (`ai:database:sales`). Carol holds the
`ai-developer` role with a scope of the `finance` database. The Importer is
installed for the `sales` database.

| Request | Alice | Bob | Carol |
|---|---|---|---|
| `GET /v1/jobs`, `GET /v1/jobs/{job_id}` | Allowed | Allowed | `403`, her scope covers a different database |
| `POST /v1/import`, `POST /v1/import-multiple` | `403`, her role doesn't grant the action | Allowed | `403` |
| `POST /v1/recluster` | `403` | Allowed | `403` |
