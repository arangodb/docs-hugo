---
description: Description of the oasisctl create backup command
title: Oasisctl Create Backup
menuTitle: Create Backup
weight: 3
---
## Synopsis
Create backup ...

```
oasisctl create backup [flags]
```

## Options
```
      --auto-deleted-at int    Time (h) until auto delete of the backup
      --deployment-id string   ID of the deployment
      --description string     Description of the backup
  -h, --help                   help for backup
      --name string            Name of the deployment
      --upload                 The backup should be uploaded
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also
* [oasisctl create](_index.md)	 - Create resources
* [oasisctl create backup policy](create-backup-policy.md)	 - Create a new backup policy

