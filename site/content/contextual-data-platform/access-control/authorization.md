---
title: Classic authorization in the data platform
menuTitle: Classic authorization
weight: 15
description: >-
  How the access levels of the ArangoDB core database system govern
  the data a user may access in deployments without RBAC
---
In deployments where [RBAC](rbac.md) is not enabled, the classic permission
system of the ArangoDB core database system decides what an authenticated user
may do. It is the traditional way of managing permissions in ArangoDB, based on
access levels that you grant per user account for databases and collections.

The services of the data platform do not come with a permission system of their
own in this case. They require every request to be
[authenticated](authentication.md), but they do not restrict what an
authenticated user may do within a service. The classic access levels still
govern every access to the database system, however, including the accesses
that data platform services perform on your behalf.

## Access levels

Every ArangoDB user account has an access level for each database and for each
collection within a database:

- **Database access levels**: *Administrate*, *Access*, and *No access*.
  *Administrate* is needed for actions that change the structure of a database,
  like creating and dropping collections and indexes. *Access* is the minimum
  for doing anything in a database at all.
- **Collection access levels**: *Read/Write*, *Read Only*, and *No access*.
  They govern reading and writing documents of a collection. The database level
  needs to be at least *Access* in addition, otherwise the collection level has
  no effect.

The server-level permissions for administrative actions like creating users and
databases are not granted separately. A user has them if and only if the access
level for the `_system` database is *Administrate*.

You can manage the access levels in the web interface, in _arangosh_, and with
the HTTP API. For the full rules and how to grant the levels, see
[Managing Users](../../arangodb/3.12/operations/administration/user-management/_index.md).

## Particularities

The classic permission system has a few characteristics that can be surprising:

- Permissions are defined per user account, not per group or role. There is no
  way to grant a set of permissions to multiple users at once.
- Instead of listing every database and collection, you can set a wildcard
  access level (`*`) that applies to all databases respectively all collections
  of a database for which no explicit level is defined. The wildcard also
  applies to databases and collections created in the future. If the level for
  the `_system` database is higher than the database wildcard, then it is used
  for the databases without an explicit level instead of the wildcard.
- Creating a collection grants the creator *Read/Write* for that collection,
  even if the collection wildcard is set to *No access*. Creating a database
  grants no explicit access level for it, however. A user needs *Administrate*
  for the `_system` database to be able to create databases at all, and it is
  this level that the new database inherits as long as no explicit level is set
  for it. If the level for `_system` is lowered later on, the access to the
  created database is reduced as well.
- The `root` user account has a wildcard access level of *Administrate* for
  databases and of *Read/Write* for collections, and it cannot be removed.

## Effect on the data platform services

The [Platform Suite](../../platform-suite/_index.md) and
[Agentic AI Suite](../../agentic-ai-suite/_index.md) services store their data
in ArangoDB and read from and write to the databases and collections you point
them at. Where a service does so with the identity of the user who made the
request, the access levels of that user account apply, even though the services
have no permission system of their own without RBAC.

This can make an operation in a service fail although the service itself does
not check any permissions, for instance if the account has no read access to
the collections a service is supposed to import from, or no write access to the
database a service wants to store its results in. If you run into errors of
this kind, check the access levels of the user account and grant the levels the
service needs.
