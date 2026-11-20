---
title: Role-based access control for the File Manager
menuTitle: RBAC
weight: 20
description: >-
  Which roles and scopes you need to use the File Manager API, and which
  permissions each endpoint checks
---
If [role-based access control (RBAC)](../access-control/rbac.md) is enabled in
the Arango Contextual Data Platform, the File Manager checks a permission for
every request, except for the health check. The permission is an **action** on
a **resource**, and which resource depends on the kind of file:

- **RAG input files** belong to a database. They are checked on the database in
  the request path, for example, `ai:filemanager.file.read` on
  `ai:database:sales` for `GET /_db/sales/rag-input`.
- **Packages of the Container Manager** (`/global/byoc/...`) are not bound to a
  database. They are checked on the **Container Manager** shared service,
  `ai:service:arango-user-defined`, the same resource that the Arango Control
  Plane checks when you deploy a Container Manager service. A scope that covers
  the Container Manager thus lets you both manage its packages and deploy
  services from them.

To use the File Manager, you thus need:

- A predefined role that grants the action, which is `ai-user` for listing and
  downloading files and packages, and `ai-developer` for everything else.
- A scope for the role assignment that covers the database of the RAG input
  files, or the **Container Manager** shared service for packages. A scope that
  only covers databases grants nothing for packages, and vice versa.

## Actions

{{% rbac-actions "filemanager" %}}

Locking and unlocking files is a separate action from uploading and deleting
them. Files that are part of a built corpus are locked so that they cannot be
deleted, and someone who may delete files should not be able to unlock such a
file first. Both `ai:filemanager.file.manage` and `ai:filemanager.file.lock`
are granted by the `ai-developer` role, but you can limit the actions in the
scope of a role assignment with the HTTP API.

Uploading and deleting packages is a separate action from reading them, because
a package becomes a running container.

## Permissions per endpoint

{{% rbac-endpoints "filemanager" %}}

The permission is checked before the request body is read, so a denied request
fails with `403` regardless of what the body contains.

## Errors

| HTTP status | Cause |
|---|---|
| `400` | The database name in the path of a RAG input endpoint is empty or contains `:` |
| `401` | No `Authorization: Bearer <token>` header, or the token is invalid or expired |
| `403` | You lack the action on the resource |
| `503` | The authentication or authorization service of the platform cannot be reached. The request is not carried out, and you can retry it |

## Example

Alice holds the `ai-user` role and Bob the `ai-developer` role, both with a
scope of the `sales` database (`ai:database:sales`). Carol holds the
`ai-developer` role with a scope of the **Container Manager** shared service
(`ai:service:arango-user-defined`).

| Request | Alice | Bob | Carol |
|---|---|---|---|
| `GET /_db/sales/rag-input` | Allowed | Allowed | `403`, her scope doesn't cover the database |
| `POST /_db/sales/rag-input` | `403`, her role doesn't grant the action | Allowed | `403` |
| `POST /_db/sales/rag-input/safe-to-delete` | `403` | Allowed | `403` |
| `GET /global/byoc/` | `403`, her scope doesn't cover the Container Manager | `403` | Allowed |
| `POST /global/byoc/` | `403` | `403` | Allowed |
