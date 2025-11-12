---
title: Get Organization with `oasisctl`
menuTitle: Get Organization
weight: 15
---

Get an organization the authenticated user is a member of

```
oasisctl get organization [flags]
```

## Options
```
  -h, --help                     help for organization
  -o, --organization-id string   Identifier of the organization
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl get](_index.md)	 - Get information
* [oasisctl get organization authentication](get-organization-authentication.md)	 - Get authentication specific information for an organization
* [oasisctl get organization email](get-organization-email.md)	 - Get email specific information for an organization
* [oasisctl get organization invite](get-organization-invite.md)	 - Get an organization invite the authenticated user has access to

