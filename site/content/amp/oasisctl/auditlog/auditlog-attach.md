---
title: Audit Log Attach with `oasisctl`
menuTitle: Audit Log Attach
weight: 1
---

Attach a project to an audit log

```
oasisctl auditlog attach [flags]
```

## Options
```
  -i, --auditlog-id string       Identifier of the auditlog to attach to.
  -h, --help                     help for attach
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
* [oasisctl auditlog](_index.md)	 - AuditLog resources

