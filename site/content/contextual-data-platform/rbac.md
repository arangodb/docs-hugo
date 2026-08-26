---
title: Role-Based Access Control
menuTitle: RBAC
weight: 40
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
**Control Panel** in the platform web interface.

## Concepts

- **User**:
  An account that authenticates against the platform. Every user starts with
  no roles and therefore no permissions, except for the built-in `root`
  account, which holds all roles.

- **Role**:
  A named bundle of actions, such as `coredb-reader`, `ai-developer`, or
  `tenant-admin`. A role on its own describes *what* may be done. Users can
  hold multiple roles at the same time.

- **Scope**:
  A restriction attached to one role assignment that describes *where* the
  role applies. A scope is either **Everything** or a set of
  **specific resources**. Not every role can be narrowed - some always apply
  everywhere.

An effective permission is therefore the combination of a user, a role, and
the scope of that assignment. Assigning the same role to two users with
different scopes gives them the same abilities over different data.

## Available roles

The platform ships with a fixed set of predefined roles, named after the area
they govern:

- `coredb-reader`, `coredb-developer`, `coredb-admin` - the ArangoDB database
  system
- `ai-user`, `ai-developer` - the Agentic AI Suite
- `secret-admin` - the Secrets Manager
- `tenant-admin` - the tenant
- `platform-operator` - platform operations
- `super-admin` - the entire platform

The set of roles is fixed - the interface offers no way to create or delete
one. What you configure is which users hold which roles, and how each of those
assignments is scoped.

Alongside these, the platform generates a role per operator-managed identity,
named `managed:operator:<uuid>`. These appear in the Access Control lists like
any other role, together with the service accounts that hold them, such as
`operator-arango-control-plane-token-<id>`. They are maintained by the platform,
so leave them untouched.

## Open the Access Control interface

1. Open the **Control Panel** in the platform web interface.
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
