---
title: Role-based access control for the Arango Control Plane
menuTitle: RBAC
weight: 20
description: >-
  Which roles and scopes you need to manage projects, services, and secrets
  with the Arango Control Plane (ACP), and which permissions each endpoint
  checks
---
{{< tag "Platform Suite" >}}

If [role-based access control (RBAC)](../access-control/rbac.md) is enabled in
the Arango Contextual Data Platform, the Arango Control Plane (ACP) checks a
permission for every request. The permission is an **action** on one or more
**resources**, for example, `ai:acp.service.manage` on `ai:database:sales` to
install an AutoGraph service for the `sales` database. Every resource of a
request needs to be allowed.

What resource a request is checked on depends on what it is about:

- **Projects** are checked on their database, `ai:database:<database>`.
  A project is not a resource of its own. Its data is stored in collections of
  its database, so if you have access to a database, you have access to all of
  its projects.
- **Database services** are checked on the database they are installed for,
  `ai:database:<database>`.
- **Shared services** are checked on their service type,
  `ai:service:<service-type>`.
- **Secrets** are checked on the secret store as a whole, `ai:secret:store`.
  You can either access all secrets or none of them.

## Database services and shared services

The type of a service decides whether it is a database service or a
shared service:

| Kind | Service types | Resource |
|---|---|---|
| Database service | `arangodb-graphrag-importer` (Importer), `arangodb-graphrag-retriever` (AutoRAG), `arangodb-autograph` (AutoGraph), `arangodb-graph-rag` (Natural Language to AQL), `arangodb-mcp-server` (MCP Server), `arangodb-reasoner` (Reasoner) | `ai:database:<db_name>` |
| Shared service | `arangodb-notebook-images` (Notebook servers), `arango-user-defined` (Container Manager), `arangodb-gral` (Graph Analytics), and every other type | `ai:service:<service-type>` |

- A database service belongs to its database. Installing it requires the
  `db_name` setting, and you can manage it if your scope covers that database.
  You don't need any shared service in your scope for this.
- A shared service is not bound to a database. Your scope needs to cover the
  service type, independent of which data the service works with later.
  Shared services access ArangoDB with the permissions of the user who uses
  them. For example, a Graph Analytics engine loads a graph with your own
  ArangoDB permissions. Access to a shared service thus doesn't grant access
  to any database.
- Services of the Container Manager are always shared services, including
  services that you install for a specific database by setting `db_name`.
  The `db_name` only determines the URL of the service, not the permission
  check.
- A Reasoner accesses its database through an MCP Server. Installing or
  upgrading a Reasoner is therefore also checked on the database of that MCP
  Server.

The `ai-user` and `ai-developer` roles only grant actions on the shared
services that you can start from the web interface: Notebook servers,
Container Manager, and Graph Analytics. Other shared service types are
installed by the data platform itself and can only be managed by the `root`
user.

## Actions

{{% rbac-actions "acp" %}}

## Permissions per endpoint

{{% rbac-endpoints "acp" %}}

### Installed services

The status, upgrade, and uninstall endpoints are checked on the same resource
as the installation of the service: the database for a database service, the
service type for a shared service. The Control Plane determines both from the
installed service, not from your request.

- If no service with the given ID exists, the request is only allowed with a
  scope that covers all databases and all shared services. Otherwise, you get
  `403`, so you cannot find out whether a service ID exists that you have no
  access to.
- An upgrade cannot move a service to a different database or project.
  If you leave out `db_name` or `genai_project_name` in the `env` of the
  request, the installed values are kept. A different value is rejected
  with `400`.

### Listing services

The `POST /v1/list_services` endpoint doesn't fail if you lack access to some
services. It checks every service on its own resource and only returns the
services that you are allowed to see. If you are not allowed to see any, you
get an empty list, not an error.

## Errors

| HTTP status | Cause |
|---|---|
| `400` | The request doesn't name a resource that can be checked, for example, a database service without a `db_name`, or a name that contains `:` or `*` |
| `401` | No `Authorization: Bearer <token>` header, or the token is invalid or expired |
| `403` | You lack the action on a resource. The message names the action and the resource, like `Not permitted: ai:acp.service.manage on ai:database:sales`, or the service ID for an installed service, like `Not permitted: ai:acp.service.read on service <id>` |
| `503` | The authorization service of the platform or the service scheduler cannot be reached. The request is not carried out, and you can retry it |

## Example

Alice holds the `ai-developer` role with a scope of the `sales` database
(`ai:database:sales`) and the Notebook servers
(`ai:service:arangodb-notebook-images`). Bob holds the `ai-developer` role with
a scope of all shared services (`ai:service:*`).

| Request | Alice | Bob |
|---|---|---|
| `GET /v1/all_projects/sales` | Allowed | `403` |
| `POST /v1/project` for the `sales` database | Allowed | `403` |
| `POST /v1/graphragretriever` with `db_name` set to `sales` | Allowed | `403` |
| `POST /v1/graphragretriever` with `db_name` set to `finance` | `403` | `403` |
| `POST /v1/notebook` | Allowed | Allowed |
| `POST /v1/uds` with `db_name` set to `sales` | `403`, Container Manager is not in her scope | Allowed |
| `POST /v1/graphanalytics` | `403` | Allowed |
| `POST /v1/list_services` | The services of the `sales` database and the notebooks | All notebooks, Container Manager services, and Graph Analytics engines |
| `GET /v1/secrets` | `403`, the secrets are not in her scope | `403` |
