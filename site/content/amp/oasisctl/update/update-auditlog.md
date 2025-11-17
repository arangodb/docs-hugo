---
title: Update Audit Log with `oasisctl`
menuTitle: Update Audit Log
weight: 1
---

Update an auditlog

```
oasisctl update auditlog [flags]
```

## Options
```
  -i, --auditlog-id string       Identifier of the auditlog to update.
      --default                  If set, this AuditLog is the default for the organization.
      --description string       Description of the audit log.
  -h, --help                     help for auditlog
      --name string              Name of the audit log.
  -o, --organization-id string   Identifier of the organization
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl update](_index.md)	 - Update resources

