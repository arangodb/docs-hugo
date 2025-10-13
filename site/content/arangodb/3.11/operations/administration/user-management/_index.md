---
title: Managing Users
menuTitle: User Management
weight: 30
description: >-
  User management is possible in the web interface and in _arangosh_ in the
  context of the `_system` database
---
Authentication needs to be enabled on the server in order to employ user
permissions. Authentication is turned on by default in ArangoDB. You should
make sure that it was not turned off manually however. Check the configuration
file (normally named `/etc/arangodb.conf`) and make sure it contains the
following line in the `[server]` section:

```
authentication = true
```

This will make ArangoDB require authentication for every request (including
requests to Foxx apps depending on the option below). If you want to run Foxx
apps without HTTP authentication, but activate HTTP authentication for the built-in
server APIs, you can add the following line in the `[server]` section of the 
configuration:

```
authentication-system-only = true
```

The above will bypass authentication for requests to Foxx apps.

When finished making changes, you need to restart ArangoDB, e.g.:

```
service arangodb restart
```

User management is possible in the [web interface](../../../components/web-interface/users.md)
while logged on to the `_system` database and in
[arangosh](in-arangosh.md), as well as via the
[HTTP API](../../../develop/http-api/users.md).

There is a built-in user account `root` which cannot be removed. Note that it
has an empty password by default, so make sure to set a strong password
immediately. Additional users can be created and granted different actions and
access levels. ArangoDB user accounts are valid throughout a server instance
(across databases).

## Actions and Access Levels

An ArangoDB server contains a list of users. It also defines various
access levels that can be assigned to a user (for details, see below)
and that are needed to perform certain actions. These actions can be grouped
into three categories:

- server actions
- database actions
- collection actions

The **server actions** are

- **create user**: allows to create a new user.

- **update user**: allows to change the access levels and details of an existing
user.

- **drop user**: allows to delete an existing user.

- **create database**: allows to create a new database.

- **drop database**: allows to delete an existing database.

- **shutdown server**: remove server from cluster and shutdown

The **database actions** are tied to a given database, and access
levels must be set
for each database individually. For a given database the actions are

- **create collection**: allows to create a new collection in the given database.

- **update collection**: allows to update properties of an existing collection.

- **drop collection**: allows to delete an existing collection.

- **create index**: allows to create an index for an existing collection in the
given database.

- **drop index**: allows to delete an index of an existing collection in the given
database.

The **collection actions** are tied to a given collection of a given
database, and access levels must be set for each collection individually.
For a given collection the actions are

- **read document**: read a document of the given collection.

- **create document**: creates a new document in the given collection.

- **modify document**: modifies an existing document of the given collection,
this can be an update or replace operation.

- **drop document**: deletes an existing document of the given collection.

- **truncate collection**: deletes all documents of a given collection.

To perform actions on the server level the user needs at least the following
access levels. The access levels are *Administrate* and
*No access*:

| server action             | server level |
|---------------------------|--------------|
| create a database         | Administrate |
| drop a database           | Administrate |
| create a user             | Administrate |
| update a user             | Administrate |
| update user access level  | Administrate |
| drop a user               | Administrate |
| shutdown server           | Administrate | 

To perform actions in a specific database (like creating or dropping collections),
a user needs at least the following access level.
The possible access levels for databases are *Administrate*, *Access* and *No access*.
The access levels for collections are *Read/Write*, *Read Only* and *No Access*.

| database action              | database level | collection level |
|------------------------------|----------------|------------------|
| create collection            | Administrate   | Read/Write       |
| list  collections            | Access         | Read Only        |
| rename collection            | Administrate   | Read/Write       |
| modify collection properties | Administrate   | Read/Write       |
| read properties              | Access         | Read Only        |
| drop collection              | Administrate   | Read/Write       |
| create an index              | Administrate   | Read/Write       |
| drop an index                | Administrate   | Read/Write       |
| see index definition         | Access         | Read Only        |

Note that the access level *Access* for a database is always required to perform
any action on a collection in that database.

For collections a user needs the following access
levels to the given database and the given collection. The access levels for
the database are *Administrate*, *Access* and *No access*. The access levels
for the collection are *Read/Write*, *Read Only* and *No Access*.

| action                | collection level        | database level         |
|-----------------------|-------------------------|------------------------|
| read a document       | Read/Write or Read Only | Administrate or Access |
| create a document     | Read/Write              | Administrate or Access |
| modify a document     | Read/Write              | Administrate or Access |
| drop a document       | Read/Write              | Administrate or Access |
| truncate a collection | Read/Write              | Administrate or Access |

**Example**

For example, given

- a database *example*
- a collection *data* in the database *example*
- a user *JohnSmith*

If the user *JohnSmith* is assigned the access level *Access* for the database
*example* and the level *Read/Write* for the collection *data*, then the user
is allowed to read, create, modify or delete documents in the collection
*data*. But the user is, for example, not allowed to create indexes for the
collection *data* nor create new collections in the database *example*.

## Granting Access Levels

Access levels can be managed via the [web interface](../../../components/web-interface/users.md)
or in [arangosh](in-arangosh.md).

In order to grant an access level to a user, you can assign one of
three access levels for each database and one of three levels for each
collection in a database. The server access level for the user follows
from the database access level in the `_system` database, it is
*Administrate* if and only if the database access level is
*Administrate*. Note that this means that database access level
*Access* does not grant a user server access level *Administrate*.

### Initial Access Levels

When a user creates a database, the access level of the user for that database
is set to *Administrate*. The same is true for creating a collection, in this
case the user gets *Read/Write* access to the collection.

### Wildcard Database Access Level

With the above definition, one must define the database access level for
all database/user pairs in the server, which would be very tedious. In
order to simplify this process, it is possible to define a wildcard
database access level for a user. This wildcard is used if the database
access level is *not* explicitly defined for a certain database. Each new
created user has an initial database wildcard of *No Access*.

Changing the wildcard database access level for a user will change the
access level for all databases that have no explicitly defined
access level. Note that this includes databases which will be created
in the future and for which no explicit access levels are set for that
user!

If you delete the wildcard, the default access level is defined as *No Access*.

The `root` user has an initial database wildcard of *Administrate*.

If a user has the access level *Access* or *Administrate* for the `_system`
database but a lower wildcard database access level, then the `_system` database
access level is granted for all databases that do not have an explicit
access level defined.

See [Permission Resolution](#permission-resolution) for details.

**Example**

Assume user *JohnSmith* has the following database access levels:

|                    | Access level |
|--------------------|--------------|
| database `_system` | No Access    |
| database `shop1`   | Administrate |
| database `shop2`   | No Access    |
| database `*`       | Access       |

This gives the user *JohnSmith* the following database level access:

- database `_system`: *No Access*
- database `shop1`: *Administrate*
- database `shop2`: *No Access*
- database `something`: *Access*

If the wildcard `*` is changed from *Access* to *No Access*, then the
permissions change as follows:

- database `_system`: *No Access*
- database `shop1`: *Administrate*
- database `shop2`: *No Access*
- database `something`: *No Access*

If the `_system` database access level is changed from *No Access*  to
*Administrate*, then the permissions change again for databases with no
explicitly defined access level:

- database `_system`: *Administrate*
- database `shop1`: *Administrate*
- database `shop2`: *No Access*
- database `something`: *Administrate*

### Wildcard Collection Access Level

For each user and database, there is a wildcard collection access level.
This level is used for all collections of a database without an explicitly
defined collection access level. Note that this includes collections
which will be created in the future and for which no explicit access
levels are set for a that user! Each new created user has an initial
collection wildcard of *No Access*.

If you delete the wildcard, the system defaults to *No Access*.

The `root` user has an initial collection wildcard of *Read/Write* in every database.

When creating a user through
[`db._createDatabase()`](../../../develop/javascript-api/@arangodb/db-object.md#db_createdatabasename--options--users),
the access level of the user for this database is set to *Administrate* and the
wildcard for all collections within this database are set to *Read/Write*.

If a user has the access level *Access* or *Administrate* for the `_system`
database but a lower wildcard database access level or wildcard collection
access level, then the `_system` database access level is granted for all
collections that do not have an explicit access level defined.

See [Permission Resolution](#permission-resolution) for details.

{{< security >}}
It is recommended to use explicitly defined access levels for all databases and
collections instead of wildcard grants to avoid accidentally granting more
permissions than intended.
{{< /security >}}

**Examples**

Assume user *JohnSmith* has the following database access levels:

|                    | Access level |
|--------------------|--------------|
| database `_system` | No Access    |
| database `*`       | Access       |

And the following collection access levels:

|                                         | Access level |
|-----------------------------------------|--------------|
| database `*`, collection `*`            | Read/Write   |
| database `shop1`, collection `products` | Read-Only    |
| database `shop1`, collection `*`        | No Access    |
| database `shop2`, collection `reviews`  | No Access    |

Then the user *JohnSmith* gets the following collection access levels:

- database `shop1`, collection `products`: *Read-Only*
- database `shop1`, collection `customers`: *Read/Write*
- database `shop2`, collection `reviews`: *No Access*

Explanation:

Database `shop1`, collection `products` directly matches a defined
collection access level and the database access level is higher
than *No Access*, leading to *Read-Only* access for the collection.

Database `shop1`, collection `customers` does not match a defined access
level. There is a wildcard collection access level of *No Access*, but it cannot
lower the access level granted by the wildcard combination of database `*`,
collection `*`, leading to *Read/Write* access for the collection.

Database `shop2` does not match a defined access level. However, the database
matches the database wildcard access level of *Access*. The access level for all
collections with no defined access level would be *Read/Write* because of the
wildcard combination of database `*`, collection `*`, but the `reviews`
collection has a defined access level of *No Access*, leading to no access for
this collection.

Assume user *JohnSmith* has the following database access levels:

|                    | Access level |
|--------------------|--------------|
| database `_system` | Access       |
| database `shop2`   | Administrate |
| database `*`       | No Access    |

And the following collection access levels:

|                                          | Access level |
|------------------------------------------|--------------|
| database `shop1`, collection `customers` | No Access    |
| database `shop1`, collection `*`         | No Access    |

Then the user *JohnSmith* gets the following collection access levels:

- database `shop1`, collection `products`: *Read-Only*
- database `shop1`, collection `customers`: *No Access*
- database `shop2`, collection `reviews`: *Read/Write*

Explanation:

Database `shop1`, collection `products` does not match a defined access
level. There is a wildcard collection access level of *No Access*, but it cannot
lower the access level granted via the `_system` database, leading to *Read-Only*
access for the collection.

Database `shop1`, collection `customers` directly matches a defined
collection access level. The database access level is higher than *No Access*
but the explicitly defined collection access level of *No Access* leads to no
access for the collection.

Database `shop2` has a defined access level of *Administrate*. No access level
is defined for its collections, which is equal to a wildcard collection
access level of *No Access*.  However, the *Administrate* database access level
leads to *Read-Write* access for all collections in the database, including the
`reviews` collection.

### Permission Resolution

The access levels for databases and collections are resolved in the following way:

For a database "*foo*":
1. Check if there is a specific database grant for *foo*.
   If yes, use the granted access level.
2. Choose the higher access level of:
  - A wildcard database grant (like `grantDatabase('user', '*', 'rw')`).
  - A database grant on the `_system` database.

For a collection named "*bar*" in a database "*foo*":
1. Check whether the effective access level for the database *foo* is higher than
   *No Access* (see above). If not, then you cannot access the collection *bar*.
2. Check if there is a specific collection grant for *bar*.
   If yes, use the granted collection access level for *bar*.
3. Choose the higher access level of:
  - A wildcard collection grant in the same database
    (like `grantCollection('user', 'foo', '*', 'rw')`).
  - A wildcard database grant (like `grantDatabase('user', '*', 'rw')`).
  - The access level for the current database (like `grantDatabase('user', 'foo', 'rw'`).
  - The access level for the `_system` database.

An exception to this are system collections, where only the access level for the
database is used.

### System Collections

The access level for system collections cannot be changed. They follow
different rules than user defined collections and may change without further
notice. The system collections follow these rules:

| Collection                           | Access level |
|--------------------------------------|--------------|
| `_users` (in the `_system` database) | No Access    |
| `_queues`                            | Read-Only    |
| `_frontend`                          | Read/Write   |
| `*` (default)                        | *based on the current database* |

All other system collections have access level *Read/Write* if the
user has *Administrate* access to the database. They have access level
*Read/Only* if the user has *Access* to the database.

To modify these system collections, you should always use the
specialized APIs provided by ArangoDB. For example,
no user has access to the `_users` collection in the `_system`
database. All changes to the access levels must be done using the
[`@arangodb/users` module of the JavaScript API](in-arangosh.md),
the [`/_api/user` HTTP API endpoints](../../../develop/http-api/users.md),
or the web interface.

### LDAP Users

{{< tag "ArangoDB Enterprise Edition" "ArangoGraph" >}}

ArangoDB supports LDAP as an external authentication system. For detailed
information please have look into the
[LDAP configuration guide](../../../components/arangodb-server/ldap.md).

There are a few differences to *normal* ArangoDB users:
- ArangoDB does not "*know*" LDAP users before they first authenticate.
  Calls to various APIs using endpoints in `_api/users/*` will **fail** until
  the user first logs-in.
- Access levels of each user are periodically updated. This will happen by
  default every *5 minutes*.
- It is not possible to change permissions on LDAP users directly, only on **roles**
- LDAP users cannot store configuration data per user
  (affects for example custom settings in the graph viewer).

To grant access for an LDAP user you will need to create *roles* within the
ArangoDB server. A role is just a user with the `:role:` prefix in its name.
Role users cannot login as database users, the `:role:` prefix ensures this.
Your LDAP users will need to have at least one role; once users log in they
will be automatically granted the union of all access rights of all their roles.
Note that a lower right grant in one role will be overwritten by a higher
access grant in a different role.
