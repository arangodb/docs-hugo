---
title: Install ArangoDB on-premises # TODO: distinguish between local and on-premises server deployments?
menuTitle: On-premises installation
weight: 40
description: >-
  How to download and install ArangoDB for using it locally or self-hosting it
  on your own hardware
---
## Installation

Head to [arangodb.ai/downloads/](https://arango.ai/downloads/) and download
the `tar.gz` archives of the ArangoDB server and the client tools for Linux,
or use the official container images (`arangodb/core` and
`arangodb/client-tools`).

For more in-depth information on how to install ArangoDB, as well as available
startup parameters, installation in a cluster and so on, see
[Installation](../operations/installation/_index.md) and
[Deploy](../deploy/_index.md).

<!--
By default, authentication is enabled. The default user is `root`.
Depending on the installation method used, the installation process either
prompted for the root password or the default root password is empty
(see [Securing the installation](.#securing-the-installation)).

Next you will be asked which database to use. Every server instance comes with
a `_system` database. Select this database to continue.

You should then be presented the dashboard with server statistics like this:

For a more detailed description of the interface, see [Web Interface](../components/web-interface/_index.md).
-->

## Securing the Installation

The default installation contains one database `_system` and a user
named `root`.

To set a password for the `root` user, see
[Securing your installation](../operations/installation/linux/_index.md#securing-your-installation).
If you use the container images, see
[Choosing an authentication method](../operations/installation/docker.md#choosing-an-authentication-method).

{{< warning >}}
The password that you set for the root user this way has **no effect** in case
of deployments done with the _ArangoDB Starter_.
See [Securing Starter Deployments](../operations/security/securing-starter-deployments.md) instead.
{{< /warning >}}

<!-- NOT ON-PREMISES SPECIFIC!
Authentication

ArangoDB allows you to restrict access to databases to certain users. All
users of the system database are considered administrators. During
installation a default user *root* is created, which has access to
all databases.

You should create a database for your application together with a
user that has access rights to this database. See
[Managing Users](../operations/administration/user-management/_index.md).

Use the _arangosh_ to create a new database and user.

```js
arangosh> db._useDatabase("_system");
arangosh> db._createDatabase("example");
arangosh> var users = require("@arangodb/users");
arangosh> users.save("root@example", "password");
arangosh> users.grantDatabase("root@example", "example");
```

You can now connect to the new database using the user
*root@example*.

```
shell> arangosh --server.username "root@example" --server.database example
```
-->
