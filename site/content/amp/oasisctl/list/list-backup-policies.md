---
title: List Backup Policies with `oasisctl`
menuTitle: List Backup Policies
weight: 9
---

List backup policies

```
oasisctl list backup policies [flags]
```

## Options
```
      --deployment-id string   The ID of the deployment to list backup policies for
  -h, --help                   help for policies
      --include-deleted        If set, the result includes all backup policies, including those who set to deleted, however are not removed from the system currently
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl list backup](list-backup.md)	 - A list command for various backup resources

