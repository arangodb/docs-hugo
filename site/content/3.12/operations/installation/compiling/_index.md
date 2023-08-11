---
title: Compiling ArangoDB from Source
menuTitle: Compiling
weight: 25
description: >-
  ArangoDB can be compiled directly from source code
archetype: chapter
---
ArangoDB can be compiled directly from source. It will compile on most Linux
and macOS systems, as well as on Windows.

We assume that you use the GNU C/C++ compiler or clang/clang++ to compile the
source. ArangoDB has been tested with these compilers, but should be able to
compile with any Posix-compliant, C++14-enabled compiler. For our Windows
builds we use Microsoft's Visual C++ 2017 compiler.

By default, cloning the GitHub repository will checkout the _devel_ branch.
This branch contains the development version of the ArangoDB. Use this branch
if you want to make changes to the ArangoDB source.

- [Compile on Debian](compile-on-debian.md)

- [Compile on Windows](compile-on-windows.md)

- [Running Custom Build](running-custom-build.md)

- [Recompiling jemalloc](recompiling-jemalloc.md)
