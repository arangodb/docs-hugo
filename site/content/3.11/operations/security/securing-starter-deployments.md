---
title: Securing Starter Deployments
menuTitle: Securing Starter Deployments
weight: 25
description: >-
  You should enable authentication for deployments you create with the
  ArangoDB Starter before starting them the first time
archetype: default
---
The password that is set for the _root_ user during the installation of the ArangoDB
package has no effect in case of deployments done with the tool _ArangoDB Starter_,
as this tool creates new database directories and configuration files that are
separate from those created by the stand-alone installation.

Assuming you have enabled authentication in your _Starter_ deployment (using `--auth.jwt-secret=<secret-file>`), by default
the _root_ user will be created with an _empty_ password.

In order to the change the password of the _root_ user, you can:

- Open the ArangoDB web interface and change the password from there. [More information](../../components/web-interface/users.md).
- Open _arangosh_ and use the [`users.replace()` function](../administration/user-management/in-arangosh.md#replace).

In case you would like to automate the _root_ password change, you might use the 
`--javascript.execute-string` option of the _arangosh_ binary, e.g.:

```bash
arangosh --server.endpoint your-server-endpoint \
    --server.password "" \
    --javascript.execute-string 'require("@arangodb/users").update("root", "mypwd");'
```

where "mypwd" is the new password you want to set.

If your _Starter_ deployment has authentication turned off, it is suggested to
turn it on using a _JWT secret_ file. For more information on this topic, please
refer to the _Starter_ [Option](../../components/tools/arangodb-starter/options.md#authentication-options) page.

Note that you cannot easily turn authentication on/off once your deployment
has started for the first time. It is possible to stop all _Starters_ and then
manually modify all the `arangod.conf` files in yor data directory, but this is not recommended.
