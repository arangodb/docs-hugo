---
archetype: default
description: Description of the oasisctl delete auditlog destination command
title: Oasisctl Delete Auditlog Destination
menuTitle: Delete Audit Log Destination
weight: 30
---
## Synopsis
Delete a destination from an auditlog

```
oasisctl delete auditlog destination [flags]
```

## Options
```
  -i, --auditlog-id string       Identifier of the auditlog to delete.
  -h, --help                     help for destination
      --index int                Index of the destination to remove. Only one delete option can be specified. (default -1)
  -o, --organization-id string   Identifier of the organization.
      --type string              Type of the destination to remove. This will remove ALL destinations with that type.
      --url string               An optional URL which will be used to delete a single destination instead of all.
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also
* [oasisctl delete auditlog](delete-auditlog.md)	 - Delete an auditlog

