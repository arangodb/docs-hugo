---
title: Community Edition to Enterprise Edition Upgrade Procedure
menuTitle: Community to Enterprise Edition
weight: 5
description: ''
---
{{< info >}}
From version 3.12.5 onward, the prepackaged binaries and official Docker images
of the Community Edition include all features of the Enterprise Edition.
See [ArangoDB Editions](../../about/features/_index.md#arangodb-editions)
for details.

To upgrade a deployment created with v3.12.5 or later from the Community Edition
to the Enterprise Edition, all you need to do is to [apply a license](../administration/license-management.md).

The rest of this page describes the upgrade procedure for Community Edition
deployments created with v3.12.4 or older.
{{< /info >}}

## Migrate between Community Edition and Enterprise Edition

While migrating from the Community Edition to the Enterprise Edition is supported, 
installing directly the Enterprise Edition package over the Community Edition
package is **not** supported. Please see below for the correct migration procedure.

Migrating from Enterprise Edition to Community Edition is, in general, **not** supported.
This is because the Community Edition does not include some features, such as 
[SmartGraphs](../../graphs/smartgraphs/_index.md), that, if used while the database
was running under the Enterprise Edition, do not make easily possible the
conversion of some database structures.

## Upgrade procedures

Upgrading from the Community to the Enterprise Edition requires uninstallation of
the Community package (can be done in a way that the database data are preserved)
and installation of the Enterprise package. The upgrade can be done in a
[_logical_](#procedure-for-a-logical-upgrade) or 
[_in-place_](#procedure-for-an-in-place-upgrade) way. Please refer to the
[Upgrade methods](_index.md#upgrade-methods) section for a general
description of the two methods. Refer to the sections below for a detailed
procedure.

The Enterprise Edition of ArangoDB requires a license to run the Enterprise Edition and activate its features.
For more information about setting a license key, see [License Management](../administration/license-management.md).

### Procedure for a *Logical* Upgrade

1. Use the tool [_arangodump_](../../components/tools/arangodump/_index.md) to **take a backup**
   of your data stored by your Community Edition installation
2. Uninstall the ArangoDB Community Edition package
3. Install the ArangoDB Enterprise Edition package
   (and start your _Single Instance_ or _Cluster_)
4. Restore the backup using the tool [_arangorestore_](../../components/tools/arangorestore/_index.md).

### Procedure for an *In-Place* Upgrade

1. Shutdown ArangoDB and make a copy of your data directory (e.g., in Linux, by
   using the _cp_ command). If you are using a setup that involves several _arangod_ processes
   (a cluster deployment), please make sure all _arangod_ processes
   are stopped and all the data directories in use are copied in a safe location 
2. Uninstall the ArangoDB Community Edition package (make sure this is done in a way that
   your database is kept on your disk, e.g. on _Debian_ systems do **not** use the
   _purge_ option of _dpkg_)
3. Install the ArangoDB Enterprise Edition package
4. If you are moving from version A to version B, where B > A, start _arangod_ on
   your data directory with the option `--database.auto-upgrade` (in addition to
   any other options you are currently using). The server will stop after a while
   (check the log file of _arangod_ as it should contain relevant information about
   the upgrade). If you use a setup that involves several _arangod_ processes
   (a cluster deployment), this step has to be repeated for all _arangod_
   processes
5. Start ArangoDB Enterprise Edition
   (in the same way you were starting ArangoDB Community Edition)
