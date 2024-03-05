---
title: Installation
menuTitle: Installation
weight: 210
description: >-
  You can install ArangoDB by downloading and running the official packages,
  as well as run ArangoDB using Docker images
---
To install ArangoDB, as a first step, please download a package for your operating
system from the official [Download](https://www.arangodb.com/download)
page of the ArangoDB website.

There are different packages available, such as _RPM_ and _Debian_ packages for Linux,
including `tar.gz` archives.

{{< tip >}}
You can also use the official [Docker images](https://hub.docker.com/_/arangodb/)
to run ArangoDB in containers on Linux, macOS, and Windows. For more information,
see the [Docker](docker.md) section.
{{< /tip >}}

If you prefer to compile ArangoDB from source, please refer to the [Compiling](compiling/_index.md)
section.

For detailed information on how to deploy ArangoDB, once it has been installed,
please refer to the [Deploy](../../deploy/_index.md) chapter.

## Supported platforms and architectures

{{< tip >}}
Run ArangoDB on Linux using the production-ready packages for the x86-64 architecture.
{{< /tip >}}

Starting with v3.12, ArangoDB packages for Windows and macOS are not provided
anymore. You can use the official [Docker images](https://hub.docker.com/_/arangodb/)
instead.

{{< info >}}
Running ArangoDB on ARM architectures is suitable for testing and evaluation purposes.
{{< /info >}}

{{< info >}}
ArangoDB requires systems with Little Endian byte order.
{{< /info >}}

{{< tip >}}
[ArangoGraph Insights Platform](https://dashboard.arangodb.cloud/home?utm_source=docs&utm_medium=cluster_pages&utm_campaign=docs_traffic)
is a fully-managed service and requires no installation. It's the easiest way
to run ArangoDB in the cloud.
{{< /tip >}}

### Linux

ArangoDB is available for the following architectures:

- **x86-64**: The processor(s) must support the **x86-64** architecture with the
  **SSE 4.2** and **AVX** instruction set extensions (Intel Sandy Bridge or better,
  AMD Bulldozer or better, etc.).
- **ARM**: The processor(s) must be 64-bit ARM chips (**AArch64**). The minimum
  requirement is **ARMv8** with **Neon** (SIMD extension).

The official Linux release executables of ArangoDB require the operating system
to use a page size of **4096 bytes** or less.