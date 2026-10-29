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
  `database:read` or `collection:write`.
- The **resource** to perform it on, for example a database or a collection.

What may be done is expressed in **policies**. A policy is a list of
**statements**, and every statement combines an effect with the actions and the
resources it covers:

| Field | Description |
|--------|-------------|
| `effect` | Either `Allow` or `Deny`. These are the only two values |
| `actions` | The actions the statement applies to |
| `resources` | The resources the actions may be performed on |

Actions and resources both support wildcard patterns. A `*` matches everything,
`database:*` matches every action of the `database` namespace, and `reports-*`
matches every resource whose name starts with `reports-`.

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

- **Users**, listing every account and the roles it holds.
- **Roles**, listing every role and the users that hold it.

Both tab labels include a count, for example **Users (5)** and **Roles (10)**.
Which tab you start from only decides the direction of the assignment - both
end in the same dialog.

## The Users tab

The Users tab shows a table with a **User** column and a **Roles** column.
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

## Assign a role to a user

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

Open the details panel of a user and select the pencil icon on a role card.
The same dialog reopens as **Edit roles for `<user>`**, where you can:

- Add further roles with the **Add role** combobox.
- Change the scope of an assignment, where the role supports it.
- Remove a role from the user with the trash icon on its entry in the
  **Assigned** list.

The pencil icons in the Roles tab panel work the same way, so you can adjust a
user's assignment from either direction without switching tabs.

## Saving and enforcement

**Save changes** applies the assignment and confirms it with a **Roles updated**
notification. Permission changes are not necessarily effective immediately -
the notification states that enforcement can take up to about 30 seconds. Keep
that delay in mind when verifying a change, and when revoking access that must
take effect right away.

## The Roles tab

The Roles tab lists every role in a table with two sortable columns:

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
