---
archetype: default
description: Description of the oasisctl delete role command
title: Oasisctl Delete Role
menuTitle: Delete Role
weight: 115
---
{{< description >}}
## Synopsis
Delete a role the authenticated user has access to

```
oasisctl delete role [flags]
```

## Options
```
  -h, --help                     help for role
  -o, --organization-id string   Identifier of the organization
  -r, --role-id string           Identifier of the role
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also
* [oasisctl delete](_index.md)	 - Delete resources

