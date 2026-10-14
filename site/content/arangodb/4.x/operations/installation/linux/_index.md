---
title: Installing ArangoDB on Linux
menuTitle: Linux
weight: 10
description: >-
  Download and extract the tar.gz archives of the server and the client tools
---
You can install ArangoDB on most common Linux distributions. The basic
installation steps are:

1. Visit the official [Download](https://arango.ai/downloads/)
   page of the ArangoDB website.

2. Download the server package and, if you need them, the
   [client tools](../../../components/tools/_index.md) package for
   your processor architecture (x86-64 or ARM64). The packages are generic
   `tar.gz` archives that work across Linux distributions.

3. You may verify the integrity of a download by comparing the SHA256 hash
   listed on the website with the hash of the file. For example, you can run
   `openssl sha256 <filename>` or `sha256sum <filename>` in a terminal.

4. Unpack the archives, for example, by running `tar -xzf <filename>`, and add
   the `bin` directories of the unpacked archives to your `PATH` environment
   variable.

5. You can start ArangoDB in several ways, depending on the type of ArangoDB
   deployment you are interested in (_Single Server_, _Cluster_).
   Please refer to the [Deploy](../../../deploy/_index.md) chapter for details.

## Securing your Installation

Run `arango-secure-installation` to set the password for the `root` user,
for example:

```bash
ARANGODB_DEFAULT_ROOT_PASSWORD=NEWPASSWORD arango-secure-installation
```

{{< danger >}}
Please be aware that running `arango-secure-installation` on your ArangoDB
server will remove all current database users but root.
{{< /danger >}}
