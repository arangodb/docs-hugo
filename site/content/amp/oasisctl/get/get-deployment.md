---
title: Get Deployment with `oasisctl`
menuTitle: Get Deployment
weight: 7
---

Get a deployment the authenticated user has access to

```
oasisctl get deployment [flags]
```

## Options
```
  -d, --deployment-id string     Identifier of the deployment
  -h, --help                     help for deployment
  -o, --organization-id string   Identifier of the organization
  -p, --project-id string        Identifier of the project
      --show-root-password       show the root password of the database
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl get](_index.md)	 - Get information

