---
description: Description of the oasisctl backup download command
title: Oasisctl Backup Download
menuTitle: Backup Download
weight: 2
---
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
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also
* [oasisctl backup](_index.md)	 - Backup commands

