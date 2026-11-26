---
title: Role-based access control for Graph Analytics
menuTitle: RBAC
weight: 30
description: >-
  Which roles and scopes you need to use Graph Analytics engines, and which
  permissions each endpoint checks
---
{{< tag "Agentic AI Suite" >}}

If [role-based access control (RBAC)](../access-control/rbac.md) is enabled
in the Arango Contextual Data Platform, a Graph Analytics engine checks a
permission for the requests to its Engine API before it does any work. The
permission is the `ai:gral.execute` **action** on the Graph Analytics shared
service, `ai:service:arangodb-gral`.

To use a Graph Analytics engine, you thus need:

- The `ai-user` or `ai-developer` role. Both grant `ai:gral.execute`. Starting
  and stopping an engine requires `ai-developer`.
- A scope for the role assignment that covers the Graph Analytics shared
  service (`ai:service:arangodb-gral`), or all shared services. A scope that
  only covers a database is not enough.
- Access to the data in ArangoDB, because the engine loads graphs and stores
  results as your user. See
  [Permissions in ArangoDB](#permissions-in-arangodb).

## Actions

{{% rbac-actions "gral" %}}

The resource is always the Graph Analytics shared service. There is no
resource per engine or per database.

You start, list, and stop engines via the Arango Control Plane (ACP), which
checks its own actions. See
[Role-based access control for the Arango Control Plane](../control-plane-acp/rbac.md).

{{< warning >}}
Graphs and jobs in an engine don't belong to the user who created them. Anyone
who holds `ai:gral.execute` can read, run algorithms on, store the results of,
and delete the graphs and jobs of other users of the same engine. The data in
ArangoDB remains protected, because the engine accesses it as the user who
sends the request.
{{< /warning >}}

## Permissions per endpoint

{{% rbac-endpoints "gral" %}}

## Permissions in ArangoDB

`ai:gral.execute` only decides whether you can use an engine. It doesn't grant
access to data. The engine loads graphs and stores results with a short-lived
token of your user, so ArangoDB applies your own permissions:

- **ArangoDB RBAC disabled**: You need the classic read-only
  [permission](../access-control/authorization.md) for the database to load
  data, and read/write to store results.
- **ArangoDB RBAC enabled**: You need a `coredb-*` role that grants `db:Read`
  to load data and `db:WriteData` to store results, with a scope that covers
  the database, its collections, and its graphs. The graphs are needed
  because loading a graph by name reads the graph definition first.

If you lack these permissions, the load or store job fails with an error from
ArangoDB, for example, `403`, or `404` with `graph not found` if you cannot see
the graph.

## Errors

| HTTP status | Cause |
|---|---|
| `401` | No `Authorization: Bearer <token>` header, the token is invalid or expired, or the authentication service of the platform cannot be reached |
| `403` | You lack `ai:gral.execute` on `ai:service:arangodb-gral`. The message names the action and the resource, for example `Not permitted: ai:gral.execute on ai:service:arangodb-gral: Permission denied` |
| `503` | The authorization service of the platform cannot be reached. The request is not carried out |

## Example

Alice holds the `ai-user` role and Bob the `ai-developer` role, both with a
scope of all shared services. Carol holds the `ai-user` role with a scope of
the `sales` database (`ai:database:sales`). All three can read and write the
`sales` database in ArangoDB.

| Request | Alice | Bob | Carol |
|---|---|---|---|
| `POST /_platform/acp/v1/graphanalytics` (start an engine) | `403`, her role doesn't grant `ai:acp.service.manage` | Allowed | `403` |
| `POST /v1/loaddata` with a graph of the `sales` database | Allowed | Allowed | `403`, her scope doesn't cover `ai:service:arangodb-gral` |
| `POST /v1/pagerank` | Allowed | Allowed | `403` |
| `POST /v1/storeresults` into the `sales` database | Allowed | Allowed | `403` |
