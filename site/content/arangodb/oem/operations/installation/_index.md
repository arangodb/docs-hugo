---
title: Installation
menuTitle: Installation
weight: 210
description: >-
  You can install ArangoDB by downloading and running the official packages,
  as well as run ArangoDB using Docker images
aliases:
  - installation/macos # 3.11 -> OEM
---
To install ArangoDB OEM / Embedded, as a first step, please download a package
for your operating system using the links provided by the Arango team.

- [Linux](linux/_index.md)
- [macOS](macos.md)
- [Windows](windows.md)

{{< tip >}}
You can also use the official [Docker images](https://hub.docker.com/_/arangodb/)
to run ArangoDB in containers on Linux, macOS, and Windows. For more information,
see the [Docker](docker.md) section.
{{< /tip >}}

For detailed information on how to deploy ArangoDB, once it has been installed,
please refer to the [Deploy](../../deploy/_index.md) chapter.

## Supported platforms and architectures

The OEM / Embedded variant of ArangoDB is supported for the Linux and Windows
operating systems, and client tools are available for macOS.

{{< info >}}
ArangoDB requires systems with Little Endian byte order.
{{< /info >}}

### Linux

You can run ArangoDB on Linux, including production environments, on the
x86-64 CPU architecture. Running ArangoDB on ARM architectures is suitable for
testing and evaluation purposes.

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

Client tools are available for the following CPU architectures:

- **x86-64**: The processor(s) must support the **x86-64** architecture with the
  **SSE 4.2** and **AVX** instruction set extensions (Intel Sandy Bridge or better,
  AMD Bulldozer or better, etc.).
- **ARM**: The processor(s) must be 64-bit Apple silicon (**M1** or later) based on
  ARM (**AArch64**).

## Windows  

ArangoDB is available for the following CPU architecture:

- **x86-64**: The processor(s) must support the **x86-64** architecture with the
  **SSE 4.2** and **AVX** instruction set extensions (Intel Sandy Bridge or better,
  AMD Bulldozer or better, etc.).
