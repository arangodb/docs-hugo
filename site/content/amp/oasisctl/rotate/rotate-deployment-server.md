---
title: Rotate Deployment Server with `oasisctl`
menuTitle: Rotate Deployment Server
weight: 2
---

Rotate a single server of a deployment

```
oasisctl rotate deployment server [flags]
```

## Options
```
  -d, --deployment-id string     Identifier of the deployment
  -h, --help                     help for server
  -o, --organization-id string   Identifier of the organization
  -p, --project-id string        Identifier of the project
  -s, --server-id strings        Identifier of the deployment server
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl rotate deployment](rotate-deployment.md)	 - Rotate deployment resources

