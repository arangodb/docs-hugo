---
title: Wait Deployment with `oasisctl`
menuTitle: Wait Deployment
weight: 1
---

Wait for a deployment to reach the ready status

```
oasisctl wait deployment [flags]
```

## Options
```
  -d, --deployment-id string     Identifier of the deployment
  -h, --help                     help for deployment
  -o, --organization-id string   Identifier of the organization
  -p, --project-id string        Identifier of the project
  -t, --timeout duration         How long to wait for the deployment to reach the ready status (default 20m0s)
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl wait](_index.md)	 - Wait for a status change

