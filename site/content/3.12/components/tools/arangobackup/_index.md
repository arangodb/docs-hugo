---
title: _arangobackup_ client tool
menuTitle: arangobackup
weight: 25
description: >-
  `arangobackup` is a command-line client tool to create global hot backups of
  ArangoDB deployments
archetype: chapter
---
{{< tag "ArangoDB Enterprise Edition" >}}

{{< tip >}}
In the Community Edition, use [_arangodump_](../arangodump/_index.md) and
[_arangorestore_](../arangorestore/_index.md) for
[logical backups](../../../operations/backup-and-restore.md#logical-backups).
{{< /tip >}}

_arangobackup_ creates instantaneous and consistent
[hot backups](../../../operations/backup-and-restore.md#hot-backups) of the data
and structures stored in ArangoDB.

Hot backups rely on hard link magic performed on the database's
persistence layer.

_arangobackup_ can be used for all ArangoDB deployment modes
(Single Instance, Cluster). It always creates what
is most readily described as a persistence layer consistent snapshot
of the entire instance. Therefore, no such thing as database or
collection level hot backup exists. Consequently, unlike with
_arangodump_/_arangorestore_, one may only restore a hot backup set to
the same layout, for example one can only restore a single server hot backup 
to a single server instance and a 3 _DB-Server_ cluster's hot backup to a 3
_DB-Server_ instance.

Snapshots can be uploaded to or downloaded from remote repositories.

{{< info >}}
Please review the
[requirements and limitations](../../../operations/backup-and-restore.md#hot-backup-limitations)
of hot backups, specifically regarding storage engine, deployment, scope
and storage space.
{{< /info >}}
