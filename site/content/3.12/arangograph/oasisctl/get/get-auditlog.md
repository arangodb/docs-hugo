---
archetype: default
description: Description of the oasisctl get auditlog command
title: Oasisctl Get Auditlog
menuTitle: Get Auditlog
weight: 10
---
{{< description >}}
## Synopsis
Get auditlog archive

```
oasisctl get auditlog [flags]
```

## Options
```
  -i, --auditlog-id string       Identifier of the auditlog
  -h, --help                     help for auditlog
  -o, --organization-id string   Identifier of the organization
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also
* [oasisctl get](_index.md)	 - Get information
* [oasisctl get auditlog archive](get-auditlog-archive.md)	 - Get auditlog archive
* [oasisctl get auditlog events](get-auditlog-events.md)	 - Get auditlog events

