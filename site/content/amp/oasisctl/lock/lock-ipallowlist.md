---
title: Lock IP Allowlist with `oasisctl`
menuTitle: Lock IP Allowlist
weight: 3
---

Lock an IP allowlist, so it cannot be deleted

```
oasisctl lock ipallowlist [flags]
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
* [oasisctl lock](_index.md)	 - Lock resources

