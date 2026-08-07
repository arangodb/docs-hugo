---
title: Installation
menuTitle: Installation
weight: 210
description: >-
  You can install ArangoDB on Linux by downloading and running the official
  packages, as well as run ArangoDB in containers on multiple operating systems
---
To install ArangoDB on Linux, as a first step, please download a package from
the official [Download](https://arango.ai/downloads/) page of the ArangoDB
website.

There are different packages available, such as _RPM_ and _Debian_ packages for
different Linux distributions, as well as generic `tar.gz` archives.

{{< tip >}}
You can also use the official [Docker images](https://hub.docker.com/_/arangodb/)
to run ArangoDB in containers on Linux, macOS, and Windows. For more information,
see the [Docker](docker.md) section.
{{< /tip >}}

If you prefer to compile ArangoDB from source, please refer to the
[Contributing guidelines](https://github.com/arangodb/arangodb/blob/devel/CONTRIBUTING.md).

For detailed information on how to deploy ArangoDB, once it has been installed,
please refer to the [Deploy](../../deploy/_index.md) chapter.

## Supported platforms and architectures

ArangoDB requires systems with **Little Endian** byte order.

You can run ArangoDB on Linux directly (bare metal) or in containers.

Starting with version 3.12, ArangoDB packages for Windows and macOS are not provided
anymore. You can use the official [Docker images](https://hub.docker.com/_/arangodb/)
instead.

{{< warning >}}
Running production environments with Windows or macOS as the host
operating system is not supported.
{{< /warning >}}

### Linux

You can run ArangoDB on Linux, including production environments, on the
x86-64 and ARM architectures.

- **x86-64**: The processor(s) must support the **x86-64** / **AMD64** architecture
  with the **SSE 4.2**, **AVX**, **AVX2**, **BMI1**, **BMI2**, **FMA3**, **ABM**,
  **PCLMUL**, **CX16**, **F16C**, and **MOVBE** instruction set extensions.
  That is, CPU microarchitectures Intel Haswell (2013) or better,
  AMD Excavator (2015) or better, etc.

- **ARM**: The processor(s) must be 64-bit ARM chips (**AArch64**). The minimum
  requirement is **ARMv8.2-A** with **NEON** (SIMD extension), **FP16**,
  **LSE** (Large System Extensions), **Crypto** extension, ARMv8.3 **RCPC**,
  and ARMv8.4 **dot product** (SDOT/UDOT). That is, CPUs like AWS Graviton2
  with ARM Neoverse N1 cores.

The official Linux release executables of ArangoDB require the operating system
to use a page size of **4096 bytes** or less.

{{< tip >}}
[Arango Managed Platform (AMP)](https://dashboard.arangodb.cloud/home?utm_source=docs&utm_medium=cluster_pages&utm_campaign=docs_traffic)
is a fully-managed service and requires no installation. It's the easiest way
to run ArangoDB in the cloud.
{{< /tip >}}
