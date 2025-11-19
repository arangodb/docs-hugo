---
title: List Disk Performances with `oasisctl`
menuTitle: List Disk Performances
weight: 14
---

List disk performances

```
oasisctl list diskperformances [flags]
```

## Options
```
      --dbserver-disk-size int32   The disk size of DB-Servers (GiB) (default 32)
  -h, --help                       help for diskperformances
      --node-size-id string        Identifier of the node size
  -o, --organization-id string     Identifier of the organization
      --provider-id string         Identifier of the provider
  -r, --region-id string           Identifier of the region
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl list](_index.md)	 - List resources

