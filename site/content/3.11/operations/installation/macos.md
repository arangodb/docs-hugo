---
title: Installing ArangoDB on macOS
menuTitle: macOS
weight: 15
description: >-
  You can use ArangoDB on macOS via Docker images, and run client tools using tar.gz archives
---
You can use ArangoDB on macOS with [Docker images](#docker) and run the client
tools using [_tar.gz_ archives](#installing-the-client-tools-using-the-archive).

{{< tip >}}
Starting from version 3.10.0, ArangoDB has native support for the ARM
architecture and can run on Apple silicon (e.g. M1 chips).
{{< /tip >}}

{{< info >}}
Running production environments on macOS is not supported.
{{< /info >}}

{{< info >}}
Starting from version 3.11.0, ArangoDB Server binaries for macOS are not
provided anymore.
{{< /info >}}

## Docker

The recommended way of using ArangoDB on macOS is to use the
[ArangoDB Docker images](https://www.arangodb.com/download-major/docker/)
with, for instance, [Docker Desktop](https://www.docker.com/products/docker-desktop/).

See the documentation on [Docker Hub](https://hub.docker.com/_/arangodb),
as well as the [Deployments](../../deploy/deployment/_index.md) section about
different deployment modes and methods including Docker containers.

## Installing the client tools using the archive

1. Visit the official [Download](https://www.arangodb.com/download)
   page of the ArangoDB website and download the client tools _tar.gz_ archive for macOS.

2. You may verify the download by comparing the SHA256 hash listed on the website
   to the hash of the file. For example, you can you run `openssl sha256 <filename>`
   or `shasum -a 256 <filename>` in a terminal.

3. Extract the archive by double-clicking the file.
