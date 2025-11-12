---
title: Delete IP Allowlist with `oasisctl`
menuTitle: Delete IP Allowlist
weight: 14
---

Delete an IP allowlist the authenticated user has access to

```
oasisctl delete ipallowlist [flags]
```

## Options
```
  -h, --help                     help for ipallowlist
  -i, --ipallowlist-id string    Identifier of the IP allowlist
  -o, --organization-id string   Identifier of the organization
  -p, --project-id string        Identifier of the project
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl delete](_index.md)	 - Delete resources

