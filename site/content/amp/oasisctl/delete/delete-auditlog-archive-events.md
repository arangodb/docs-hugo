---
title: Delete Audit Log Archive Events with _oasisctl_
menuTitle: Delete Audit Log Archive Events
weight: 4
# This is a generated file, DO NOT MODIFY directly!
---

Delete auditlog archive events

```
oasisctl delete auditlog archive events [flags]
```

## Options
```
  -i, --auditlog-archive-id string   Identifier of the auditlog archive to delete events from.
  -h, --help                         help for events
      --to string                    Remove events created before this timestamp.
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl delete auditlog archive](delete-auditlog-archive.md)	 - Delete an auditlog archive

