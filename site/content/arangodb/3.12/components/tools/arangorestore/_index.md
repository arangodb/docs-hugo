---
title: _arangorestore_
menuTitle: arangorestore
weight: 20
description: >-
  _arangorestore_ is a command-line client tool to restore backups to ArangoDB servers
---
_arangorestore_ can restore dumps created by [arangodump](../arangodump/_index.md)
and is therefore its counterpart.

If you want to import data in formats like JSON or CSV, see
[arangoimport](../arangoimport/_index.md) instead.

_arangorestore_ can restore selected collections or all collections of a backup,
optionally including _system_ collections. One can restore the structure, i.e.
the collections with their configuration with or without data.
Views can also be dumped or restored (either all of them or selectively).
