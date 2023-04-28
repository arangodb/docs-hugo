---
title: _arangodump_
weight: 25
description: >-
  arangodump is a command-line client tool to create backups of the data and structures stored in ArangoDB
archetype: chapter
---
_arangodump_ is a command-line client tool to create backups of the data and
structures stored in ArangoDB.

Dumps are meant to be restored with [_arangorestore_](../arangorestore/_index.md).

If you want to export for external programs to formats like JSON or CSV, see
[_arangoexport_](../arangoexport/_index.md) instead. For _Hot Backups_ see
[_arangobackup_](../arangobackup/_index.md).

_arangodump_ can be used for all ArangoDB deployments modes (Single Instance, 
Active Failover, Cluster and DC2DC) and it can backup selected collections
or all collections of a database, optionally including _system_ collections. One
can backup the structure, i.e. the collections with their configuration without
any data, only the data stored in them, or both. If you are using the Enterprise
Edition, dumps can optionally be encrypted.
