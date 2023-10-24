---
title: Installation
menuTitle: Installation
weight: 210
description: >-
  To install ArangoDB, as first step, please download the package for your OperatingSystem from the official Download page of the ArangoDB web site
archetype: chapter
---
To install ArangoDB, as first step, please download a package for your operating
system from the official [Download](https://www.arangodb.com/download)
page of the ArangoDB web site.

You can find packages for various operating systems, including _RPM_ and _Debian_
packages for Linux, including `tar.gz` archives. For macOS, only client tools `tar.gz`
packages are available. For Windows, _Installers_ and `zip` archives are available.

- [Linux](linux/_index.md)
- [macOS](macos.md)
- [Windows](windows.md)

{{< tip >}}
You can also use the official [Docker images](https://hub.docker.com/_/arangodb/)
to run ArangoDB in containers on Linux, macOS, and Windows. For more information,
see the [Docker](docker.md) section.
{{< /tip >}}

If you prefer to compile ArangoDB from source, please refer to the [Compiling](compiling/_index.md)
section.

For detailed information on how to deploy ArangoDB, once it has been installed,
please refer to the [Deployment](../../deploy/deployment/_index.md) chapter.

## Supported platforms and architectures

Work with ArangoDB on Linux, macOS, and Windows, and run it in production on Linux.

{{< info >}}
ArangoDB requires systems with Little Endian byte order.
{{< /info >}}

{{< tip >}}
[ArangoGraph Insights Platform](https://cloud.arangodb.com/)
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

## macOS

{{< info >}}
Starting with version 3.11.0, ArangoDB Server binaries for macOS are not
provided anymore.
{{< /info >}}

Client tools are available for the following architectures:

- **x86-64**: The processor(s) must support the **x86-64** architecture with the
  **SSE 4.2** and **AVX** instruction set extensions (Intel Sandy Bridge or better,
  AMD Bulldozer or better, etc.).
- **ARM**: The processor(s) must be 64-bit Apple silicon (**M1** or later) based on
  ARM (**AArch64**). 

## Windows  

ArangoDB is available for the following architectures:

- **x86-64**: The processor(s) must support the **x86-64** architecture with the
  **SSE 4.2** and **AVX** instruction set extensions (Intel Sandy Bridge or better,
  AMD Bulldozer or better, etc.).
  