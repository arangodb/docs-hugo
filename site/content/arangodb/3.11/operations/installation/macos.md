---
title: Installing ArangoDB on macOS
menuTitle: macOS
weight: 15
description: ''
---
You can run the ArangoDB client tools on macOS using _tar.gz_ archives.

{{< info >}}
Starting from version 3.11.0, ArangoDB Server binaries for macOS are not
provided anymore.
{{< /info >}}

## Installing the client tools using the archive

1. Visit the official [Download](https://arango.ai/downloads/)
   page of the ArangoDB website and download the client tools _tar.gz_ archive for macOS.

2. You may verify the download by comparing the SHA256 hash listed on the website
   to the hash of the file. For example, you can you run `openssl sha256 <filename>`
   or `shasum -a 256 <filename>` in a terminal.

3. Extract the archive by double-clicking the file.
