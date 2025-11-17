---
title: Create Audit Log with `oasisctl`
menuTitle: Create Audit Log
weight: 2
---

Create an auditlog

```
oasisctl create auditlog [flags]
```

## Options
```
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
* [oasisctl create](_index.md)	 - Create resources

