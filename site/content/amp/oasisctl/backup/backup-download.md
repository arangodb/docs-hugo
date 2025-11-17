---
title: Backup Download with `oasisctl`
menuTitle: Backup Download
weight: 2
---

Download a backup

## Synopsis
Download a backup from the cloud storage to the local deployment disks, so it can be restored.

```
oasisctl backup download [flags]
```

## Options
```
  -h, --help        help for download
  -i, --id string   Identifier of the backup
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl backup](_index.md)	 - Backup commands

