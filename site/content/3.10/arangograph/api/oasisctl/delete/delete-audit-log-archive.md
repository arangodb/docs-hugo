---
title: Oasisctl Delete Auditlog Archive
weight: 15
description: >-
  Description of the oasisctl delete auditlog archive command
archetype: default
---
Delete an auditlog archive

## Synopsis

Delete an auditlog archive

```
oasisctl delete auditlog archive [flags]
```

## Options

```
  -i, --auditlog-archive-id string   Identifier of the auditlog archive to delete.
  -h, --help                         help for archive
```

## Options inherited from parent commands

```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also

* [oasisctl delete auditlog](delete-audit-log.md)	 - Delete an auditlog
* [oasisctl delete auditlog archive events](delete-audit-log-archive-events.md)	 - Delete auditlog archive events

