---
title: Backup Copy with `oasisctl`
menuTitle: Backup Copy
weight: 1
---

Copy a backup from source backup to given region

```
oasisctl backup copy [flags]
```

## Options
```
  -h, --help                      help for copy
      --region-id string          Identifier of the region where the new backup is to be created
      --source-backup-id string   Identifier of the source backup
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl backup](_index.md)	 - Backup commands

