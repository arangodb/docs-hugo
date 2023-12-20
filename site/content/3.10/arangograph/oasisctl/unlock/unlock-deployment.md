---
archetype: default
description: Description of the oasisctl unlock deployment command
title: Oasisctl Unlock Deployment
menuTitle: Unlock Deployment
weight: 15
---
## Synopsis
Unlock a deployment, so it can be deleted

```
oasisctl unlock deployment [flags]
```

## Options
```
  -d, --deployment-id string     Identifier of the deployment
  -h, --help                     help for deployment
  -o, --organization-id string   Identifier of the organization
  -p, --project-id string        Identifier of the project
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also
* [oasisctl unlock](_index.md)	 - Unlock resources

