---
title: Delete Audit Log with `oasisctl`
menuTitle: Delete Audit Log
weight: 2
---

Delete an auditlog

```
oasisctl delete auditlog [flags]
```

## Options
```
  -i, --auditlog-id string       Identifier of the auditlog to delete.
  -h, --help                     help for auditlog
  -o, --organization-id string   Identifier of the organization
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl delete](_index.md)	 - Delete resources
* [oasisctl delete auditlog archive](delete-auditlog-archive.md)	 - Delete an auditlog archive
* [oasisctl delete auditlog destination](delete-auditlog-destination.md)	 - Delete a destination from an auditlog

