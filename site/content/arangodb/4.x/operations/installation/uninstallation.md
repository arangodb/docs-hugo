---
title: Uninstallation
menuTitle: Uninstallation
weight: 30
description: >-
  You can uninstall ArangoDB from a system and keep your data
---
To uninstall ArangoDB, follow these high-level steps:

- Removal of the files and folders that were unpacked from the `tar.gz` archives.
  A data directory might exist in a subdirectory of the root folder.
- Optional removal of the leftover files (database directory and/or
  configuration files) stored in a different place

If you run ArangoDB in containers, remove the containers and, optionally, the
volumes or host directories that hold the data.

{{< info >}} 
If the ArangoDB _Starter_ was used to deploy ArangoDB, there will be an
additional manual step:

- Removal of the data directory created by the _Starter_
  (the path used for the option `--starter.data-dir`).
{{< /info >}}
