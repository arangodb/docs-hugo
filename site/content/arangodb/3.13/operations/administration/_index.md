---
title: Administration
menuTitle: Administration
weight: 225
description: >-
  How to configure ArangoDB, manage users accounts and backups, and what tools
  you can use to administrate deployments
---
## Tools

Deployments of ArangoDB servers can be managed with the following tools:

- [**Web interface**](../../components/web-interface/_index.md):
  [_arangod_](../../components/arangodb-server/_index.md) serves a graphical web interface to
  be accessed with a browser via the server port. It provides basic and advanced
  functionality to interact with the server and its data.
  
  {{% comment %}}TODO: In case of a cluster, the web interface can be reached via any of the Coordinators. What about other deployment modes?{{% /comment %}}

- **ArangoShell**: [_arangosh_](../../components/tools/arangodb-shell/_index.md) is a V8 shell to
  interact with any local or remote ArangoDB server through a JavaScript
  interface. It can be used to automate tasks. Some developers may prefer it over
  the web interface, especially for simple CRUD. It is not to be confused with
  general command lines like Bash or PowerShell.

- **RESTful API**: _arangod_ has an [HTTP interface](../../develop/http-api/_index.md) through
  which it can be fully managed. The official client tools including _arangosh_ and
  the Web interface talk to this bare metal interface. It is also relevant for
  [driver](../../../../ecosystem/drivers/_index.md) developers.

- [**ArangoDB Starter**](../../components/tools/arangodb-starter/_index.md): This deployment tool
  helps to start _arangod_ instances, like for a Cluster setup.
  
For a full list of tools, please refer to the [Programs & Tools](../../components/tools/_index.md) chapter.

## Deployment Administration

- [Cluster](../../deploy/cluster/administration.md)
- [ArangoDB Starter Administration](arangodb-starter/_index.md)

## Other Topics

- [Configuration](configuration.md)
- [License Management](license-management.md)
- [Backup & Restore](../backup-and-restore.md)
- [Import & Export](import-and-export.md)
- [User Management](user-management/_index.md)
