---
title: Upgrading
menuTitle: Upgrading
weight: 220
description: >-
  You can create a backup and upgrade ArangoDB in-place, but downgrading
  is only possible with the backup or by dumping and restoring all data
---
## Upgrade methods

There are two main ways to upgrade ArangoDB:

- **_In-Place_ upgrade**: when the installed ArangoDB package is replaced with a new
  one, and the new server executable is started on the existing data directory.

  The database files typically require to be upgraded when you upgrade to a
  consecutive release, for example, from 3.9 to 3.10. The database files cannot
  be downgraded again. Take a backup before upgrading if you want to be able to
  return to the old version of your data and ArangoDB.

- **_Logical_ upgrade**: when the data is exported from the old ArangoDB version
  using [_arangodump_](../../components/tools/arangodump/_index.md) and then restored in
  the new ArangoDB version using [_arangorestore_](../../components/tools/arangorestore/_index.md).

  Depending on the size of your database, this strategy can be more time consuming,
  but might be necessary under some circumstances.

## Before the upgrade

Before upgrading, it is recommended to:

- Check the [CHANGELOG](../../release-notes/_index.md#changelogs) and the
  [list of incompatible changes](../../release-notes/_index.md#incompatible-changes)
  for API or other changes in the new version of ArangoDB, and make sure your applications
  can deal with them.
- As an extra precaution, and as a requirement if you want to [downgrade](downgrading.md),
  you might want to:
  - **Take a backup** of the old ArangoDB database using [_arangodump_](../../components/tools/arangodump/_index.md),
    as well as
  - Copy the entire "old" data directory to a safe place, after stopping the ArangoDB Server
    running on it (if you run a Cluster deployment, you will need to take a copy of their
    data directories, from all involved machines, after stopping all the running
    ArangoDB processes).
  - Keep a copy of all ArangoDB package files (executables, configuration files,
    bundled scripts, etc.) in case you want to return to the old version of
    ArangoDB.

## Upgrade paths

- It is always possible to upgrade to patch versions of the same
  general availability (GA) release, i.e from x.y.W to x.y.Z, where Z > W.

  Examples:
  - Upgrading from 3.11.0 to 3.11.1 or (directly to) 3.11.3 is supported.
  - Upgrading from 3.11.1 to 3.11.2 or (directly to) 3.11.3 is supported.

- It is possible to upgrade between two different consecutive GA releases, but it is
  not officially supported to upgrade if the two GA releases are not consecutive
  (in this case, you first have to upgrade to all intermediate releases).

  Examples:
  - Upgrading from 3.10 to 3.11 is supported.
  - Upgrading from 3.11 to 3.12 is supported.
  - Upgrading from 3.10 directly to 3.12 is not officially supported!
    The officially supported upgrade path in this case is 3.10 to 3.11, and then
    3.11 to 3.12.

  {{< info >}}
  Before upgrading between two consecutive GA releases, it is highly recommended
  to first upgrade the previous GA release to its latest patch version.

  Examples:
  - To upgrade from 3.10 to 3.11, first upgrade your 3.10 deployment to
    the latest 3.10 version, for example, from 3.10.2 to 3.10.14 and then to 3.11.x.
  - To upgrade from 3.11 to 3.12, first upgrade your 3.11 deployment to
    the latest 3.11 version, for example, from 3.11.5 to 3.11.13 and then to 3.12.x.
  {{< /info >}}

### Additional notes regarding rolling upgrades

In addition to the paragraph above, rolling upgrades via the tool _Starter_ are supported,
as documented in [Upgrading Starter Deployments](starter-deployments.md).
