---
title: List Backups with `oasisctl`
menuTitle: List Backups
weight: 10
---

List backups

```
oasisctl list backups [flags]
```

## Options
```
      --deployment-id string   The ID of the deployment to list backups for
      --from string            Request backups that are created at or after this timestamp
  -h, --help                   help for backups
      --to string              Request backups that are created before this timestamp
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl list](_index.md)	 - List resources

