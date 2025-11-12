---
title: Update Backup with `oasisctl`
menuTitle: Update Backup
weight: 2
---

Update a backup

```
oasisctl update backup [flags]
```

## Options
```
      --auto-deleted-at int   Time (h) until auto delete of the backup
  -d, --backup-id string      Identifier of the backup
      --description string    Description of the backup
  -h, --help                  help for backup
      --name string           Name of the backup
      --upload                The backups should be uploaded
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl update](_index.md)	 - Update resources
* [oasisctl update backup policy](update-backup-policy.md)	 - Update a backup policy

