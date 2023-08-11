---
title: Oasisctl List Effective Permissions
menuTitle: List Effective Permissions
weight: 80
description: >-
  Description of the oasisctl list effective permissions command
archetype: default
---
List the effective permissions, the authenticated user has for a given URL

## Synopsis

List the effective permissions, the authenticated user has for a given URL

```
oasisctl list effective permissions [flags]
```

## Options

```
  -h, --help         help for permissions
  -u, --url string   URL of resource to get effective permissions for
```

## Options inherited from parent commands

```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also

* [oasisctl list effective](list-effective.md)	 - List effective information

