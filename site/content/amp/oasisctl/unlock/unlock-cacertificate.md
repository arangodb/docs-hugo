---
title: Unlock CA Certificate with `oasisctl`
menuTitle: Unlock CA Certificate
weight: 1
---

Unlock a CA certificate, so it can be deleted

```
oasisctl unlock cacertificate [flags]
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
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl unlock](_index.md)	 - Unlock resources

