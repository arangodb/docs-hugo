---
layout: default
description: Description of the oasisctl create auditlog command
title: Oasisctl Create Auditlog
menuTitle: Create Auditlog
weight: 15
---
## Synopsis
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
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also
* [oasisctl create](_index.md)	 - Create resources

