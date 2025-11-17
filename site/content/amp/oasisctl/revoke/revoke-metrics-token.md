---
title: Revoke Metrics Token with `oasisctl`
menuTitle: Revoke Metrics Token
weight: 4
---

Revoke a metrics token for a deployment

```
oasisctl revoke metrics token [flags]
```

## Options
```
  -d, --deployment-id string     Identifier of the deployment
  -h, --help                     help for token
  -o, --organization-id string   Identifier of the organization
  -p, --project-id string        Identifier of the project
  -t, --token-id string          Identifier of the metrics token
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl revoke metrics](revoke-metrics.md)	 - Revoke keys & tokens

