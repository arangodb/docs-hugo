---
title: Update Organization Email Domain Restrictions with `oasisctl`
menuTitle: Update Organization Email Domain Restrictions
weight: 16
---

Update which domain restrictions are placed on accessing a specific organization

```
oasisctl update organization email domain restrictions [flags]
```

## Options
```
  -d, --allowed-domain strings   Allowed email domains for users of the organization
  -h, --help                     help for restrictions
  -o, --organization-id string   Identifier of the organization
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl update organization email domain](update-organization-email-domain.md)	 - Update email domain specific information for an organization

