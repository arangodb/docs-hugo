---
title: Oasisctl List Diskperformances
menuTitle: List Disk Performances
weight: 70
description: >-
  Description of the oasisctl list diskperformances command
archetype: default
---
List disk performances

## Synopsis

List disk performances

```
oasisctl list diskperformances [flags]
```

## Options

```
      --dbserver-disk-size int32   The disk size of DB-Servers (GB) (default 32)
  -h, --help                       help for diskperformances
      --node-size-id string        Identifier of the node size
  -o, --organization-id string     Identifier of the organization
      --provider-id string         Identifier of the provider
  -r, --region-id string           Identifier of the region
```

## Options inherited from parent commands

```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also

* [oasisctl list](_index.md)	 - List resources

