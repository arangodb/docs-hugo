---
title: Role-Based Access Control
menuTitle: RBAC
weight: 10
description: >-
  Control who can do what in the Arango Contextual Data Platform by assigning
  roles to users and scoping each role to the resources it may act on
---
Role-based access control (RBAC) governs what every user of the
Arango Contextual Data Platform is allowed to do. Instead of granting
permissions to individuals one by one, you assign **roles** to users. Where a
role supports it, you can additionally narrow the assignment with one or more
**scopes** that say which resources the role applies to.

You manage all of this from the **Access Control** section of the
**Control Panel** in the web interface of the Arango Contextual Data Platform.

## Concepts

- **User**:
  An account that authenticates against the data platform. **Nothing is
  permitted by default**, so a new user starts with no roles and no permissions.
  The exception is the built-in `root` account, which is bound to the
  all-powerful `super-admin` role automatically.

- **Role**:
  A named bundle of actions, such as `coredb-reader`, `ai-developer`, or
  `tenant-admin`. A role on its own describes *what* may be done. Users can
  hold multiple roles at the same time.

- **Scope**:
  A restriction attached to one role assignment that describes *where* the
  role applies. A scope is either **Everything** or a set of
  **specific resources**, selected per resource type as a single resource,
  several resources, or a name pattern. Not every role can be narrowed - some
  always apply everywhere.

An effective permission is therefore the combination of a user, a role, and
the scope of that assignment. Assigning the same role to two users with
different scopes gives them the same abilities over different data.

## The permission model

Users, roles, and scopes are the surface of a policy-based permission system
that the data platform evaluates on every request. You don't need to author its
objects to work with the Access Control interface, but knowing them explains
what an `Allow` and a `Deny` are, and how a scope takes effect.

Every request is reduced to who wants to do what, and where:

- The **user** the request is made on behalf of, taken from the token that
  [authenticates](authentication.md) it.
- The **action** to perform, named `<namespace>:<name>`, for example
  `db:Read` or `db:WriteData`. The `db` namespace holds the actions of the
  ArangoDB core database system.
- The **resource** to perform it on, for example a database
  (`db:database:<database>`) or a collection
  (`db:collection:<database>:<collection>`).

What may be done is expressed in **policies**. A policy is a list of
**statements**, and every statement combines an effect with the actions and the
resources it covers:

| Field | Description |
|--------|-------------|
| `effect` | Either `Allow` or `Deny`. These are the only two values |
| `actions` | The actions the statement applies to |
| `resources` | The resources the actions may be performed on |

Actions and resources both support wildcard patterns. They are matched per
`:`-separated segment, where a segment can be `*`, a prefix like `report_*`, a
suffix like `*_daily`, or an exact name. A trailing `*` segment also matches all
further segments. A `*` on its own thus matches everything, `db:*` matches every
action of the `db` namespace, and `db:collection:reports:*` matches every
collection of the `reports` database.

These objects form a chain from a user to the actions that user may perform:

1. A **policy** holds the statements.
2. A **role** is a named collection of policies. It is the unit you see in the
   web interface, such as `coredb-reader`.
3. A **role assignment** binds a role to a user and carries the **scope**. The
   scope is a policy as well.

### How a request is decided

For every request, the data platform matches the requested action and resource
against the statements that apply to the user:

1. Nothing is permitted by default. A request that no statement matches is
   denied.
2. Each assignment of the user is evaluated on its own. The statements of the
   role's policies are matched against the requested action and resource. A
   matching `Deny` denies the request for that assignment, a matching `Allow`
   grants it, and if nothing matches, the assignment contributes nothing. A
   `Deny` thus takes precedence over an `Allow` within an assignment.
3. The scope of the assignment has to allow the same action on the same
   resource. The effective permission of an assignment is the intersection of
   its role and its scope, so a role that allows an action still results in a
   denial if the scope does not cover the resource.
4. The request is permitted if at least one assignment allows it. Otherwise it
   is denied, and the service returns an error.

## Available roles

When RBAC is enabled, there is a set of **predefined roles** that you cannot
edit or delete. What you configure is which users hold which roles, and how each
of those assignments is scoped. Creating custom roles is not supported at this
time.

The predefined roles are automatically created and managed by the
ArangoDB Kubernetes Operator (`kube-arangodb`).

Every predefined role is named under the reserved `managed:predefined:` prefix,
for example `managed:predefined:coredb-reader`. The web interface lists the
short name, `coredb-reader`, whereas the API and the Kubernetes resources
expect the fully qualified name.

| Role | Purpose |
|------|---------|
| `super-admin` | Full access. Reserved - bound automatically to the `root` user and not assignable |
| `tenant-admin` | Manages users and role bindings |
| `coredb-reader` | Read-only database operations on scoped resources |
| `coredb-developer` | Read and write database operations on scoped resources |
| `coredb-admin` | Manages the structure and lifecycle of scoped resources |
| `ai-user` | Executes AI workflows and reads outputs on scoped resources |
| `ai-developer` | Builds, configures, manages, and executes AI workflows on scoped resources |
| `platform-operator` | Operates the data platform and bundled services, views observability, starts containers |
| `secret-admin` | Manages secrets on scoped resources |

{{< info >}}
`super-admin` is reserved. `kube-arangodb` binds it to the deployment's `root`
user automatically and rejects any attempt to assign it to somebody else, so
it appears in the lists with `root` as its holder but cannot be handed out.
{{< /info >}}

For the endpoints of the ArangoDB core database system, the
[HTTP API documentation](../../arangodb/4.x/develop/http-api/_index.md) lists
which predefined roles grant access to each endpoint, under
**Predefined roles (RBAC)**.

The data platform denies everything by default. A role grants nothing until it
is assigned to a user together with a scope, and a user's effective permissions
are the union of all of their assignments, evaluated as described in
[The permission model](#the-permission-model).

Alongside the predefined catalog, the data platform generates a role per
Kubernetes operator-managed identity, named `managed:operator:<uuid>`. These
appear in the Access Control lists like any other role, together with the service
accounts that hold them, such as `operator-arango-control-plane-token-<id>`.
They are maintained by the data platform, so leave them untouched.

## Open the Access Control interface

1. Open the **Control Panel** in the data platform web interface.
2. Select **Access Control**.

The page has two tabs that show the same information from two directions:

- **Users**, listing every account and the roles it holds. See
  [List the roles of a user](#list-the-roles-of-a-user).
- **Roles**, listing every role and the users that hold it. See
  [List the roles](#list-the-roles).

Both tab labels include a count, for example **Users (5)** and **Roles (10)**.
Which tab you start from only decides the direction of the assignment - both
end in the same dialog.

## List the roles of a user

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
The **Users** tab shows a table with a **User** column and a **Roles** column.
Both carry a sort toggle next to the header label. Each row lists the roles of
that user as chips:

- A user with no roles shows a dash (`–`).
- A user that holds every role, such as `root`, shows **All roles** instead of
  the individual chips.

Above the table you get a **Search** field for user names and a
**Filter by roles** dropdown that narrows the list to the holders of the
selected roles.

Select a row to open the details panel for that user on the right-hand side.
The panel is headed by the user name and an **Assign role** button, and lists
one card per assigned role. Each card has a pencil icon that opens the role
for editing, and a chevron that expands the card to show the scope of the
assignment.

If the user has no roles yet, the panel shows an empty state instead, headed
*No roles assigned to this user*, with an **Assign role** button.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl -H "Authorization: Bearer <JWT>" \
  https://<EXTERNAL_ENDPOINT>:8529/_management/permissions/user/alice/role
```

The response lists the role assignments of the user, each with its scope:

```json
{
  "bindings": [
    {
      "role": "managed:predefined:coredb-reader",
      "scope": {
        "statements": [
          {
            "effect": "Allow",
            "resources": ["db:apiversion:*", "db:database:reports", "db:*:reports:*"],
            "actions": ["*"],
            "description": ""
          }
        ],
        "description": ""
      }
    }
  ]
}
```

See the [`GET /_management/permissions/user/{user}/role`](#get-the-role-assignments-of-a-user)
endpoint in the HTTP API reference for details.
{{< /tab >}}

{{< /tabs >}}

## Assign a role to a user

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. In the **Users** tab, select the user to open the details panel.
2. Select **Assign role**. The **Assign roles to `<user>`** dialog opens.
3. Pick a role from the **Add role** combobox. It is added to the
   **Assigned** list on the left, together with any roles the user already
   holds.
4. Select an entry in the **Assigned** list to configure it on the right.
   Depending on the role, you either
   [scope the assignment](#scope-a-role-assignment) or see a notice that the
   role applies everywhere.
5. Repeat for as many roles as the user needs, then select **Save changes**.

Each entry in the **Assigned** list shows the role name with a summary of its
scope underneath, for example `Everything`. The trash icon next to an entry
removes that role from the assignment.

**Cancel** discards every change made in the dialog.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl -X POST -H "Authorization: Bearer <JWT>" \
  https://<EXTERNAL_ENDPOINT>:8529/_management/permissions/user/alice/role/managed:predefined:coredb-reader \
  -d '{"scope":{"statements":[{"effect":"Allow","actions":["*"],"resources":["db:apiversion:*","db:database:reports","db:*:reports:*"]}]}}'
```

This assigns the `coredb-reader` role to the user `alice` and limits it to the
`reports` database and everything in it. See
[Scopes in the HTTP API](#scopes-in-the-http-api) for how to express a scope.

See the [`POST /_management/permissions/user/{user}/role/{role}`](#create-a-role-assignment)
endpoint in the HTTP API reference for details.
{{< /tab >}}

{{< /tabs >}}

## Assign a user to a role

Working from the Roles tab reverses the direction and adds a user-picking step
in front:

1. In the **Roles** tab, select the role to open the details panel.
2. Select **Assign user**. The **Assign a user** dialog opens, prompting you to
   *Pick the user to give this role to. You can define its scope in the next
   step.*
3. Choose an account from the **Search users** combobox. It lists only users
   that do not already hold this role. **Next** stays disabled until you pick
   one.
4. Select **Next**. The **Assign roles to `<user>`** dialog opens with the role
   already in the **Assigned** list, and the flow continues exactly as in
   [Assign a role to a user](#assign-a-role-to-a-user).

This is only a different way to get to the same dialog. The result is the same
role assignment, so there is no separate HTTP API endpoint for it.

## Scope a role assignment

With a role selected in the **Assigned** list, the right-hand side of the
dialog shows what that assignment can be narrowed to.

Some roles cannot be narrowed at all. For those, the panel shows the notice
*This role applies everywhere. It cannot be narrowed to specific resources.*
and the assignment covers all resources. This is the case for the
`managed:operator:<uuid>` roles and for the Agentic AI Suite roles.

For a role that supports scoping, choose between:

- **Everything**: the role applies to all resources.
- **Specific resources**: the role applies only to the resources you list,
  defined as one or more scopes.

With **Specific resources** selected, use **+ Add scope** to add a scope card.
A new card is titled **New scope** until you choose a **Resource type**, after
which it takes the name of that type. The available resource types are
`Database`, `Collections`, `Views`, `Graphs`, `Analyser`, and
`Name pattern (advanced)`. Each card can be collapsed with the chevron and
removed with the trash icon.

### Select collections

For the `Collections` resource type, the scope card shows a collection picker:

- **All collections in all databases** selects everything at once.
- A **Search collections** field filters the list.
- Collections are grouped per database, for example
  **From "_system" database**, each group starting with an
  **All collections in this database** checkbox followed by the individual
  collections.

Selecting a whole group or all databases is reflected as a partially selected
state on the parent checkboxes.

### Match resources by name pattern

The `Name pattern (advanced)` resource type replaces the picker with a single
text field where you enter a pattern such as `analytics/report_*`. Below the
field, the dialog previews what the pattern currently resolves to, for example:

```
Matches 312 collections
analytics/report_daily
analytics/report_weekly
analytics/report_hourly
+309
```

Patterns are evaluated continuously rather than expanded once, so
**all future matches are included automatically**. Use this when the set of
resources grows over time and you do not want to revisit the assignment for
every new collection.

### Validation

The dialog does not let you save incomplete assignments:

- A role with no scope is flagged with a warning icon in the **Assigned**
  list. Hovering it shows *Add scope and resources, or remove this role*.
- A scope card without any selected resource is outlined in red and shows the
  inline error *Add resources to this scope, or remove it.*

Resolve every flagged item, or delete it, before saving.

## Edit or remove an assignment

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
Open the details panel of a user and select the pencil icon on a role card.
The same dialog reopens as **Edit roles for `<user>`**, where you can:

- Add further roles with the **Add role** combobox.
- Change the scope of an assignment, where the role supports it.
- Remove a role from the user with the trash icon on its entry in the
  **Assigned** list.

The pencil icons in the Roles tab panel work the same way, so you can adjust a
user's assignment from either direction without switching tabs.
{{< /tab >}}

{{< tab "cURL" >}}
To change the scope of an existing assignment, replace it as a whole:

```sh
curl -X PUT -H "Authorization: Bearer <JWT>" \
  https://<EXTERNAL_ENDPOINT>:8529/_management/permissions/user/alice/role/managed:predefined:coredb-reader \
  -d '{"scope":{"statements":[{"effect":"Allow","actions":["*"],"resources":["*"]}]}}'
```

To remove a role from a user:

```sh
curl -X DELETE -H "Authorization: Bearer <JWT>" \
  https://<EXTERNAL_ENDPOINT>:8529/_management/permissions/user/alice/role/managed:predefined:coredb-reader
```

See the [`PUT /_management/permissions/user/{user}/role/{role}`](#replace-the-scope-of-a-role-assignment)
and [`DELETE /_management/permissions/user/{user}/role/{role}`](#delete-a-role-assignment)
endpoints in the HTTP API reference for details.
{{< /tab >}}

{{< /tabs >}}

## Saving and enforcement

**Save changes** applies the assignment and confirms it with a **Roles updated**
notification. Permission changes are not necessarily effective immediately -
the notification states that enforcement can take up to about 30 seconds. Keep
that delay in mind when verifying a change, and when revoking access that must
take effect right away.

## List the roles

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
The **Roles** tab lists every role in a table with two sortable columns:

| Column | Description |
|--------|-------------|
| `Roles` | The role name |
| `Users` | How many users hold the role, for example `1 user`, or `–` if nobody does |

A **Search** field above the table filters by role name. Unlike the Users tab,
there is no filter dropdown here.

Select a row to open the details panel for that role. It is headed by the role
name and an **Assign user** button, and lists the users that hold the role,
each with the number of roles that user has in total, for example
`testuser - 1 role`. The pencil icon on a user card opens the assignment dialog
for that user, and the chevron expands the card.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl -H "Authorization: Bearer <JWT>" \
  https://<EXTERNAL_ENDPOINT>:8529/_management/permissions/role
```

The response contains the fully qualified role names, including the
`managed:operator:<uuid>` roles, and the total number of roles:

```json
{
  "names": [
    "managed:operator:3f6c0d2e-8a1b-4c5d-9e7f-1a2b3c4d5e6f",
    "managed:predefined:ai-developer",
    "managed:predefined:ai-user",
    "managed:predefined:coredb-admin",
    "managed:predefined:coredb-developer",
    "managed:predefined:coredb-reader",
    "managed:predefined:platform-operator",
    "managed:predefined:secret-admin",
    "managed:predefined:super-admin",
    "managed:predefined:tenant-admin"
  ],
  "page": {
    "items": 10,
    "page": 1
  }
}
```

The HTTP API has no endpoint for listing the users that hold a role.

See the [`GET /_management/permissions/role`](#get-all-roles) endpoint in the
HTTP API reference for details.
{{< /tab >}}

{{< /tabs >}}

## Troubleshoot denied access

The data platform's services do not silently drop actions a user is not allowed
to perform - they return an actionable error. If somebody reports being denied,
check two things in Access Control:

1. That a role granting the action is actually assigned to them.
2. That the **scope** of that assignment covers the resource they are working
   on. A correct role with too narrow a scope is the more common cause.

Remember that an assignment grants only what its role and its scope allow at
the same time, so a role that covers the action is still not enough if the
scope leaves the resource out. Also give a recent change time to propagate, as
[enforcement](#saving-and-enforcement) can lag by up to about 30 seconds.

Users can check whether they are allowed to perform an action on a resource
with the HTTP API, using their own session token. No particular role is
required for this:

```sh
curl -X POST -H "Authorization: Bearer <JWT>" \
  https://<EXTERNAL_ENDPOINT>:8529/_management/permissions/validate \
  -d '{"action":"db:WriteData","resource":"db:collection:reports:orders"}'
```

```json
{
  "message": "rpc error: code = PermissionDenied desc = Permission denied",
  "effect": "Deny"
}
```

Note that this checks a single action on a single resource, whereas a request
to the ArangoDB core database system involves multiple checks. For example,
writing a document into the `orders` collection of the `reports` database also
requires `db:UseApiVersion` on `db:apiversion:<version>` and `db:Read` on
`db:database:reports` and `db:collection:reports:orders`. An `Allow` for one
of them doesn't guarantee that the request succeeds. See the
[`POST /_management/permissions/validate`](#check-a-permission) endpoint in the
HTTP API reference for details.

## HTTP API

You can manage role assignments with the HTTP API of the authorization service
of the data platform, which is what the web interface uses, too. Its endpoints
are available under `/_management/permissions/` on the data platform endpoint,
for example
`https://<EXTERNAL_ENDPOINT>:8529/_management/permissions/role`.

- **Authentication**: Send a [session token](authentication.md#obtain-a-session-token)
  in the `Authorization: Bearer <JWT>` HTTP header.
- **Permissions**: Of the predefined roles, only `super-admin` grants access
  to these endpoints, so use a session token of the `root` user (or a
  [superuser token](authentication.md#superuser-tokens)).
  {{< comment >}}
  Every endpoint requires an action of the `rbac` namespace, such as
  `rbac:AssignUserRole`, which only `super-admin` grants. The
  `POST /_management/permissions/validate` endpoint requires none.
  {{< /comment >}}
- **Role names**: The endpoints expect the fully qualified role names, such as
  `managed:predefined:coredb-reader`. The authorization service does not check
  whether a role exists when you assign it, so double-check the spelling.
- **Propagation**: Changes are enforced after up to about 30 seconds, as
  described in [Saving and enforcement](#saving-and-enforcement).
- **Errors**: Error responses have a JSON body with a numeric `code`, a
  `message`, and a `details` array. The `code` is a gRPC status code, not the
  HTTP status code.

### Scopes in the HTTP API

The scope of a role assignment is a policy, an object with a `statements` array.
Each statement has an `effect`, a list of `actions`, and a list of `resources`.
A role assignment grants an action on a resource only if both the role and the
scope allow it. The scope can therefore restrict the actions as well as the
resources, but you typically allow all actions in the scope and restrict the
resources:

```json
{
  "statements": [
    {
      "effect": "Allow",
      "actions": ["*"],
      "resources": ["db:apiversion:*", "db:database:reports", "db:*:reports:*"]
    }
  ]
}
```

- Set the `effect` explicitly. If you omit it, it defaults to `Deny`.
- **Everything** corresponds to `"actions": ["*"]` and `"resources": ["*"]`.
- The ArangoDB core database system checks the `db:UseApiVersion` action on the
  `db:apiversion:<version>` resource for every request. Include
  `db:apiversion:*` in every scope for the `coredb-*` and `tenant-admin` roles,
  or the scope denies all ArangoDB requests.
- Access to anything in a database also requires the database itself, for
  example `db:database:reports`. `db:*:reports:*` covers the collections,
  Views, Analyzers, and graphs of the `reports` database, and
  `db:collection:reports:orders` a single collection.
- User accounts are resources of the form `db:user:<username>`.
- Administrative actions, such as creating backups, do not operate on a
  specific resource. Only a scope with the `*` resource covers them.

### Get all roles

```openapi
---
service: rbac
---
paths:
  /_management/permissions/role:
    get:
      operationId: listRbacRoles
      # Hidden until the rbac:* actions are documented: requires the rbac:ListRole action
      description: |
        Returns the names of all roles, including the predefined roles and the
        roles that the data platform maintains for its own identities.
      parameters:
        - name: page
          in: query
          required: false
          description: |
            The page of results to return, starting at `1`. If you set it to
            `0`, the response contains no role names but only the total number
            of roles.
          schema:
            type: integer
            default: 1
        - name: items_per_page
          in: query
          required: false
          description: |
            The maximum number of role names per page.
          schema:
            type: integer
            default: 128
      responses:
        '200':
          description: |
            The role names.
          content:
            application/json:
              schema:
                type: object
                properties:
                  names:
                    description: |
                      The fully qualified names of the roles on the requested page.
                    type: array
                    items:
                      type: string
                  page:
                    description: |
                      Information about the pagination.
                    type: object
                    properties:
                      items:
                        description: |
                          The total number of roles.
                        type: integer
                      page:
                        description: |
                          The returned page.
                        type: integer
        '401':
          description: |
            The request does not contain a valid token.
        '403':
          description: |
            The user of the token is not permitted to use this endpoint.
        '503':
          description: |
            The authorization service is not ready.
```

### Get the role assignments of a user

```openapi
---
service: rbac
---
paths:
  /_management/permissions/user/{user}/role:
    get:
      operationId: listRbacUserRoleBindings
      # Hidden until the rbac:* actions are documented: requires the rbac:ListUserRoleBinding action
      description: |
        Returns the roles assigned to a user, together with the scope of each
        assignment.
      parameters:
        - name: user
          in: path
          required: true
          description: |
            The name of the user.
          schema:
            type: string
      responses:
        '200':
          description: |
            The role assignments of the user. The list is empty if the user has
            no roles or doesn't exist.
          content:
            application/json:
              schema:
                type: object
                properties:
                  bindings:
                    description: |
                      The role assignments.
                    type: array
                    items:
                      type: object
                      properties:
                        role:
                          description: |
                            The fully qualified name of the role.
                          type: string
                        scope:
                          description: |
                            The scope of the assignment.
                          type: object
                          properties:
                            statements:
                              description: |
                                The statements of the scope.
                              type: array
                              items:
                                type: object
                                properties:
                                  effect:
                                    description: |
                                      Whether the statement allows or denies.
                                    type: string
                                    enum: [Allow, Deny]
                                  actions:
                                    description: |
                                      The action patterns.
                                    type: array
                                    items:
                                      type: string
                                  resources:
                                    description: |
                                      The resource patterns.
                                    type: array
                                    items:
                                      type: string
                                  description:
                                    description: |
                                      An optional description of the statement.
                                    type: string
                            description:
                              description: |
                                An optional description of the scope.
                              type: string
        '400':
          description: |
            The user name is empty.
        '401':
          description: |
            The request does not contain a valid token.
        '403':
          description: |
            The user of the token is not permitted to use this endpoint.
        '503':
          description: |
            The authorization service is not ready.
```

### Create a role assignment

```openapi
---
service: rbac
---
paths:
  /_management/permissions/user/{user}/role/{role}:
    post:
      operationId: createRbacUserRoleBinding
      # Hidden until the rbac:* actions are documented: requires the rbac:AssignUserRole action
      description: |
        Assigns a role to a user, restricted to the given scope.
      parameters:
        - name: user
          in: path
          required: true
          description: |
            The name of the user.
          schema:
            type: string
        - name: role
          in: path
          required: true
          description: |
            The fully qualified name of the role, for example
            `managed:predefined:coredb-reader`.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - scope
              properties:
                scope:
                  description: |
                    The scope of the assignment. See
                    [Scopes in the HTTP API](#scopes-in-the-http-api).
                  type: object
                  required:
                    - statements
                  properties:
                    statements:
                      description: |
                        The statements of the scope. An empty list grants
                        nothing.
                      type: array
                      items:
                        type: object
                        required:
                          - effect
                          - actions
                          - resources
                        properties:
                          effect:
                            description: |
                              Whether the statement allows or denies the actions
                              on the resources. Defaults to `Deny` if omitted.
                            type: string
                            enum: [Allow, Deny]
                          actions:
                            description: |
                              The action patterns, `*` or `<namespace>:<name>`,
                              for example `db:Read` or `db:*`.
                            type: array
                            items:
                              type: string
                          resources:
                            description: |
                              The resource patterns, for example
                              `db:database:reports` or `*`.
                            type: array
                            items:
                              type: string
                          description:
                            description: |
                              An optional description of the statement.
                            type: string
                    description:
                      description: |
                        An optional description of the scope.
                      type: string
      responses:
        '200':
          description: |
            The role has been assigned.
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    description: |
                      The name of the user.
                    type: string
                  role:
                    description: |
                      The fully qualified name of the role.
                    type: string
                  scope:
                    description: |
                      The scope of the assignment.
                    type: object
                  index:
                    description: |
                      The sequence number of the change.
                    type: integer
        '400':
          description: |
            The scope is missing or contains an invalid action or resource.
        '401':
          description: |
            The request does not contain a valid token.
        '403':
          description: |
            The user of the token is not permitted to use this endpoint.
        '409':
          description: |
            The role is already assigned to the user. Use the `PUT` method to
            change the scope.
        '503':
          description: |
            The authorization service is not ready.
```

### Replace the scope of a role assignment

```openapi
---
service: rbac
---
paths:
  /_management/permissions/user/{user}/role/{role}:
    put:
      operationId: replaceRbacUserRoleBinding
      # Hidden until the rbac:* actions are documented: requires the rbac:ReplaceUserRoleScope action
      description: |
        Replaces the scope of an existing role assignment.
      parameters:
        - name: user
          in: path
          required: true
          description: |
            The name of the user.
          schema:
            type: string
        - name: role
          in: path
          required: true
          description: |
            The fully qualified name of the role, for example
            `managed:predefined:coredb-reader`.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - scope
              properties:
                scope:
                  description: |
                    The new scope of the assignment, in the same format as for
                    [creating a role assignment](#create-a-role-assignment).
                    It replaces the previous scope entirely.
                  type: object
      responses:
        '200':
          description: |
            The scope has been replaced. The response has the same format as
            for creating a role assignment.
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    description: |
                      The name of the user.
                    type: string
                  role:
                    description: |
                      The fully qualified name of the role.
                    type: string
                  scope:
                    description: |
                      The new scope of the assignment.
                    type: object
                  index:
                    description: |
                      The sequence number of the change.
                    type: integer
        '400':
          description: |
            The scope is missing or contains an invalid action or resource.
        '401':
          description: |
            The request does not contain a valid token.
        '403':
          description: |
            The user of the token is not permitted to use this endpoint.
        '404':
          description: |
            The role is not assigned to the user. Use the `POST` method to
            assign it.
        '503':
          description: |
            The authorization service is not ready.
```

### Delete a role assignment

```openapi
---
service: rbac
---
paths:
  /_management/permissions/user/{user}/role/{role}:
    delete:
      operationId: deleteRbacUserRoleBinding
      # Hidden until the rbac:* actions are documented: requires the rbac:RemoveUserRole action
      description: |
        Removes a role from a user.
      parameters:
        - name: user
          in: path
          required: true
          description: |
            The name of the user.
          schema:
            type: string
        - name: role
          in: path
          required: true
          description: |
            The fully qualified name of the role, for example
            `managed:predefined:coredb-reader`.
          schema:
            type: string
      responses:
        '200':
          description: |
            The role has been removed from the user.
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    description: |
                      The name of the user.
                    type: string
                  role:
                    description: |
                      The fully qualified name of the role.
                    type: string
                  scope:
                    description: |
                      Always `null`.
                    type: 'null'
                  index:
                    description: |
                      The sequence number of the change.
                    type: integer
        '401':
          description: |
            The request does not contain a valid token.
        '403':
          description: |
            The user of the token is not permitted to use this endpoint.
        '404':
          description: |
            The role is not assigned to the user.
        '503':
          description: |
            The authorization service is not ready.
```

### Check a permission

```openapi
---
service: rbac
---
paths:
  /_management/permissions/validate:
    post:
      operationId: validateRbacPermission
      description: |
        Checks whether the user of the token is allowed to perform an action on
        a resource, based on the role assignments of the user.

        This evaluates a single action on a single resource. Requests to the
        ArangoDB core database system involve multiple such checks.
      # No rbac:* action required
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - action
                - resource
              properties:
                action:
                  description: |
                    The action to check, for example `db:Read`.
                  type: string
                resource:
                  description: |
                    The resource to check, for example
                    `db:collection:reports:orders`.
                  type: string
      responses:
        '200':
          description: |
            The result of the check. This status code is also returned if the
            action is denied.
          content:
            application/json:
              schema:
                type: object
                properties:
                  effect:
                    description: |
                      Whether the action is allowed on the resource.
                    type: string
                    enum: [Allow, Deny]
                  message:
                    description: |
                      The reason for a denial. Empty if the action is allowed.
                    type: string
        '401':
          description: |
            The request does not contain a valid token.
        '503':
          description: |
            The authorization service is not ready.
```
