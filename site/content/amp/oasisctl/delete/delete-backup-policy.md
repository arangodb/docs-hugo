---
title: Delete Backup Policy with `oasisctl`
menuTitle: Delete Backup Policy
weight: 7
---

Delete a backup policy for a given ID.

```
oasisctl delete backup policy [flags]
```

## Options
```
  -h, --help                     help for policy
  -i, --id string                Identifier of the backup policy
  -o, --organization-id string   Identifier of the organization
  -p, --project-id string        Identifier of the project
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl delete backup](delete-backup.md)	 - Delete a backup for a given ID.

