---
archetype: default
description: Description of the oasisctl delete auditlog archive command
title: Oasisctl Delete Auditlog Archive
menuTitle: Delete Audit Log Archive
weight: 20
---
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

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also
* [oasisctl delete auditlog](delete-auditlog.md)	 - Delete an auditlog
* [oasisctl delete auditlog archive events](delete-auditlog-archive-events.md)	 - Delete auditlog archive events

