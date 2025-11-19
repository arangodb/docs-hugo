---
title: Delete CA Certificate with `oasisctl`
menuTitle: Delete CA Certificate
weight: 8
---

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
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl delete](_index.md)	 - Delete resources

