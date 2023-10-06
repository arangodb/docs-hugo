---
layout: default
description: Description of the oasisctl delete cacertificate command
title: Oasisctl Delete Cacertificate
menuTitle: Delete Cacertificate
weight: 45
---
## Synopsis
Delete a CA certificate the authenticated user has access to

```
oasisctl delete cacertificate [flags]
```

## Options
```
  -c, --cacertificate-id string   Identifier of the CA certificate
  -h, --help                      help for cacertificate
  -o, --organization-id string    Identifier of the organization
  -p, --project-id string         Identifier of the project
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also
* [oasisctl delete](_index.md)	 - Delete resources

