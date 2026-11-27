---
title: Role-based access control for the AQLizer
menuTitle: RBAC
weight: 25
description: >-
  Which roles and scopes you need to use the AQLizer API, and which
  permissions each endpoint checks
---
{{< tag "Agentic AI Suite" "Beta" >}}

If [role-based access control (RBAC)](../access-control/rbac.md) is enabled
in the Arango Contextual Data Platform, the AQLizer checks a permission for
every request, except for the health checks. The permission is an **action** on
the database that the AQLizer is installed for, for example,
`ai:reasoner.query` on `ai:database:sales`.

You need the following:

- The `ai-user` or `ai-developer` role. Both grant the action to use the
  AQLizer.
- A scope for the role assignment that covers the database that the AQLizer
  is installed for, like `ai:database:sales`, or all databases.
- Access to the data in ArangoDB, because the AQLizer works with your token.
  See [Permissions in ArangoDB](#permissions-in-arangodb).

## Actions

{{% rbac-actions "reasoner" %}}

The resource is always the database that the AQLizer is installed for. It is
taken from the configuration of the service and not from your request, so you
cannot direct the check to a different database.

## Permissions per endpoint

{{% rbac-endpoints "reasoner" %}}

## Permissions in ArangoDB

The AQLizer reads the database, and saves templates, with your token. What it
can access is therefore decided by your own permissions in ArangoDB, whether
or not
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

The AQLizer renews your token for long-running requests if it has less than
15 minutes left. You don't need any additional permission for this.

## Example

Alice holds the `ai-user` role and Bob the `ai-developer` role, both with a
scope of the `sales` database (`ai:database:sales`). Alice can read the
`sales` database in ArangoDB, and Bob can also write to its `Tools`
collection. The AQLizer is installed for the `sales` database.

| Request | Alice | Bob |
|---|---|---|
| `POST /txt2aql` | Allowed | Allowed |
| `POST /query` | Allowed | Allowed |
| `POST /txt2aql` with `add_template` set to `true` | The request ends with the `Can not add template` error, because she can't write to the `Tools` collection | Allowed |
