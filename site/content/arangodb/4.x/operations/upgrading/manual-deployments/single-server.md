---
title: Manually upgrading single server deployments on Linux
menuTitle: Single server
weight: 5
description: >-
  How to upgrade a single server deployment that you started manually
aliases:
  - ../os-specific-information/linux # 3.11 -> 3.12
---
To upgrade a single server that you started manually, you replace the
ArangoDB executables with the ones of the new version, upgrade the database
directory, and then start the server again.

{{< warning >}}
It is highly recommended to take a backup of your data before upgrading ArangoDB
using [arangodump](../../../components/tools/arangodump/_index.md).
{{< /warning >}}

## Upgrade a `.tar.gz` installation

1. Download the server package of the new version from
   [arango.ai/downloads/](https://arango.ai/downloads/) and extract the archive
   in a different location than the current installation.

2. Stop the running _arangod_ process gracefully, for example, by sending it a
   `SIGTERM` signal.

3. Upgrade the database directory by starting the new _arangod_ executable once
   with the same startup options as before and additionally
   [`--database.auto-upgrade true`](../../../components/arangodb-server/options.md#--databaseauto-upgrade).
   The server upgrades the data and then shuts down:

   ```sh
   /path/to/new/installation/bin/arangod --configuration /path/to/arangod.conf --database.auto-upgrade true
   ```

4. Start the new _arangod_ executable as usual, without the
   `--database.auto-upgrade` startup option.

After verifying that the upgraded server is working, you can remove the
directory of the old installation.

## Upgrade a Docker container

1. Stop and remove the container of the old version. Your data needs to be
   stored outside of the container, for example, in a named volume or a host
   directory, see [Install with Docker](../../installation/docker.md).

2. Upgrade the database directory by running a container of the new
   `arangodb/core` image once with the same volume, the same environment
   variables, and the `--database.auto-upgrade true` startup option. The
   container stops after the upgrade:

   ```sh
   docker run --rm -v arangodb-data:/var/lib/arangodb4 arangodb/core:4.0.1 --database.auto-upgrade true
   ```

3. Start a container of the new image with the same volume and settings as
   before.
