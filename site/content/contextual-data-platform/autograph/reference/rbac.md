---
title: Role-based access control for AutoGraph
menuTitle: RBAC
weight: 23
description: >-
  Which roles and scopes you need to use the AutoGraph API, and which
  permissions each endpoint checks
---
{{< tag "Agentic AI Suite" >}}

If [role-based access control (RBAC)](../../access-control/rbac.md) is enabled
in the Arango Contextual Data Platform, AutoGraph checks a permission for every
request, except for the health check. The permission is an **action** on the
database that the AutoGraph service is installed for, for example,
`ai:autograph.read` on `ai:database:sales`.

To use AutoGraph, you thus need:

- A predefined role that grants the action, which is `ai-user` for reading the
  state of a project, and `ai-developer` for everything else.
- A scope for the role assignment that covers the database of the project,
  like `ai:database:sales`, or all databases.
- For starting orchestrations and changing the model configuration, a scope
  that also covers the secrets (`ai:secret:store`), because these operations
  use secret profiles.

## Actions

{{% rbac-actions "autograph" %}}

Builds, runs, and jobs belong to the project, not to the user who started them.
Everyone who holds an action on the database can read or act on every build and
run of the AutoGraph service of that database.

The resource is always the database that the service is installed for. It is
taken from the configuration of the service and not from your request, so you
cannot direct the check to a different database. Projects are not resources of
their own. If you have access to a database, you have access to all of its
projects.

## Permissions per endpoint

{{% rbac-endpoints "autograph" %}}

Some requests need further actions on top of the action of the endpoint. They
are checked after the request has been read and before anything is changed:

- **Full corpus builds**: A corpus build with `incremental` set to `false`
  deletes and rebuilds the corpus data of the categories it processes and
  therefore also requires `ai:autograph.data.manage`. A first build should be a
  full build, so a user with only `ai:autograph.build` cannot set up a project.
- **Orchestrations that override the configuration**: Setting
  `chat_secret_profile_ids`, `embedding_secret_profile_id`, or the provider,
  model, URL, or key settings in `importer_env` changes settings that all users
  of the project share and also requires `ai:autograph.config.manage`.
  Secret profiles that are equal to the saved model configuration of the
  project, as the web interface sends them with every build, are not
  overrides.
- **Secret profiles**: Every orchestration and every change to the model
  configuration requires `ai:acp.secret.read` on `ai:secret:store`. The
  `ai-developer` role grants this action, but the scope of the assignment needs
  to include the secrets.
- **Deleting a project**: The Control Plane deletes the project and its
  services on your behalf, so this also requires `ai:acp.workspace.read`,
  `ai:acp.workspace.manage`, `ai:acp.service.read`, and `ai:acp.service.manage`
  on the database. The `ai-developer` role grants all of them.

## Permissions in ArangoDB

AutoGraph reads and writes the collections and graphs of a project in
ArangoDB. Whose permissions apply to this work depends on whether RBAC is
also enabled for the ArangoDB core database system
([ArangoDB RBAC](../../access-control/rbac.md#data-platform-rbac-and-arangodb-rbac)):

- **ArangoDB RBAC disabled**: AutoGraph works in ArangoDB with your token. You
  need a [classic permission](../../access-control/authorization.md) of
  read/write access to the project database in addition to the AutoGraph
  actions. AutoGraph checks this access before it starts long-running work
  and returns `403` if it is missing. Orchestrations and reclustering also
  start Importer services through the Control Plane in your name, which
  requires `ai:acp.service.read`, `ai:acp.service.manage`, and
  `ai:acp.workspace.read` on the database.
- **ArangoDB RBAC enabled**: AutoGraph works in ArangoDB with its own service
  identity, whose permissions are limited to the collections and graphs of its
  project. You don't need any permission in ArangoDB to use AutoGraph. To
  explore the resulting graphs and collections in the web interface or with
  queries, you still need a `coredb-*` role that covers the project database.

In both cases, the AutoGraph actions are checked for every request in the same
way.

## Errors

| HTTP status | Cause |
|---|---|
| `401` | No `Authorization: Bearer <token>` header, or the token is invalid or expired |
| `403` | You lack an action on a resource. The message names the action and the resource, for example `Not permitted: ai:autograph.build on ai:database:sales`. With ArangoDB RBAC disabled, also if you have no access to the project database in ArangoDB |
| `500` | With ArangoDB RBAC enabled, ArangoDB refused the service identity of AutoGraph. This is a problem of the deployment, not of your permissions |
| `503` | The authentication or authorization service of the platform cannot be reached. The request is not carried out, and you can retry it |

## Example

Alice holds the `ai-user` role and Bob the `ai-developer` role, both with a
scope of the `sales` database (`ai:database:sales`). Carol holds the
`ai-developer` role with a scope of the `finance` database. AutoGraph is
installed for the `sales` database.

| Request | Alice | Bob | Carol |
|---|---|---|---|
| `GET /v1/projects/{project}/overview` | Allowed | Allowed | `403`, her scope covers a different database |
| `POST /v1/corpus/builds` with `incremental` set to `true` | `403`, her role doesn't grant the action | Allowed | `403` |
| `POST /v1/orchestrate` | `403` | `403`, his scope doesn't cover the secrets | `403` |
| `DELETE /v1/projects/{project}` | `403` | Allowed | `403` |

For Bob to start orchestrations, add `ai:secret:store` to the scope of his
role assignment. In the web interface, this is the **Secrets** resource type.
