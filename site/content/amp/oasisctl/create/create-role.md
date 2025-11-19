---
title: Create Role with `oasisctl`
menuTitle: Create Role
weight: 20
---

Create a new role

```
oasisctl create role [flags]
```

## Options
```
      --description string       Description of the role
  -h, --help                     help for role
      --name string              Name of the role
  -o, --organization-id string   Identifier of the organization to create the role in
  -p, --permission strings       Permissions granted by the role
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl create](_index.md)	 - Create resources

