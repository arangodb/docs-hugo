---
title: Role-based access control for the Reasoner
menuTitle: RBAC
weight: 25
description: >-
  Which roles and scopes you need to use the Reasoner API and its MCP server,
  and which permissions each endpoint checks
---
{{< tag "Agentic AI Suite" "Beta" >}}

If [role-based access control (RBAC)](../access-control/rbac.md) is enabled
in the Arango Contextual Data Platform, the Reasoner checks a permission for
every request, except for the health checks. The permission is an **action** on
the database that the Reasoner is installed for, for example,
`ai:reasoner.query` on `ai:database:sales`.

The Reasoner accesses the database through its MCP server, and it passes your
token on to it. This MCP server is managed by the Reasoner and is not the same
as the public [ArangoDB MCP Server](../../ecosystem/arangodb-mcp-server.md).
It checks permissions of its own, so you need permissions for both layers:

- The `ai-user` or `ai-developer` role. Both grant the actions to use the
  Reasoner and its MCP server. Saving queries as templates requires
  `ai-developer`.
- A scope for the role assignment that covers the database that the Reasoner
  and its MCP server are installed for, like `ai:database:sales`, or all
  databases.
- Access to the data in ArangoDB, because the tools of the MCP server work
  with your token. See [Permissions in ArangoDB](#permissions-in-arangodb).

## Actions

The actions of the Reasoner:

{{% rbac-actions "reasoner" %}}

The actions of its MCP server:

{{% rbac-actions "mcp" %}}

The resource is always the database that the Reasoner or the MCP server is
installed for. It is taken from the configuration of the service and not from
your request, so you cannot direct the check to a different database. The MCP
server also refuses tool calls that name a different database.

## Permissions per endpoint

{{% rbac-endpoints "reasoner" %}}

A request to `POST /query` or `POST /txt2aql` is checked twice: the Reasoner
checks `ai:reasoner.query` before it starts the run, and the MCP server checks
`ai:mcp.query` for every tool call of the run. Saving a query as a template
with `add_template` set to `true` also requires `ai:mcp.template.manage`,
because the MCP server writes the template. The Reasoner itself only checks
`ai:reasoner.query` for this.

## Permissions in ArangoDB

The tools of the MCP server read the database, and save templates, with your
token. What they can access is therefore decided by your own permissions in
ArangoDB, whether or not
[ArangoDB RBAC](../access-control/rbac.md#access-to-the-data-in-arangodb)
is enabled:

- **ArangoDB RBAC disabled**: You need the classic
  [permissions](../access-control/authorization.md) for the database and its
  collections, and write access to the `Tools` collection to save templates.
- **ArangoDB RBAC enabled**: You need a `coredb-*` role with a scope that covers
  the database and the collections that the queries read, like
  `coredb-reader`, and a role that lets you write to the `Tools` collection to
  save templates, like `coredb-developer`.

## Errors

| HTTP status | Cause |
|---|---|
| `401` | No `Authorization: Bearer <token>` header, or the token is invalid or expired |
| `403` | You lack the action on the database |
| `503` | The authentication or authorization service of the platform cannot be reached, or your token is close to expiry and cannot be renewed. The request is not carried out, and you can retry it |

Permission errors of the MCP server during a run, for example, a missing
`ai:mcp.template.manage` action when saving a template, are reported as errors
of the run.

The Reasoner renews your token for long-running requests if it has less than
15 minutes left. You don't need any additional permission for this.

## Example

Alice holds the `ai-user` role and Bob the `ai-developer` role, both with a
scope of the `sales` database (`ai:database:sales`). Both can read the `sales`
database in ArangoDB. The Reasoner and its MCP server are installed for the
`sales` database.

| Request | Alice | Bob |
|---|---|---|
| `POST /query` | Allowed | Allowed |
| `POST /txt2aql` | Allowed | Allowed |
| `POST /txt2aql` with `add_template` set to `true` | The request ends with the `Can not add template` error, because her role doesn't grant `ai:mcp.template.manage` | Allowed, if he can write to the `Tools` collection |
| `GET /health/mcp` | `403`, her role doesn't grant `ai:reasoner.config.manage` | Allowed |
