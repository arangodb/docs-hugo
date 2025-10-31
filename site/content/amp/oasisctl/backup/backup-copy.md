---
title: Oasisctl Backup Copy
menuTitle: Backup Copy
weight: 1
---
## oasisctl backup copy

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
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also
* [oasisctl backup](_index.md)	 - Backup commands

