---
title: Oasisctl Auditlog Attach
weight: 5
description: >-
  Description of the oasisctl auditlog attach command
archetype: default
---
Attach a project to an audit log

## Synopsis

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

## Options inherited from parent commands

```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also

* [oasisctl auditlog](_index.md)	 - AuditLog resources

