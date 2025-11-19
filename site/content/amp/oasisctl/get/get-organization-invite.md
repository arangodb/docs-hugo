---
title: Get Organization Invite with `oasisctl`
menuTitle: Get Organization Invite
weight: 21
---

Get an organization invite the authenticated user has access to

```
oasisctl get organization invite [flags]
```

## Options
```
  -h, --help                     help for invite
  -i, --invite-id string         Identifier of the organization invite
  -o, --organization-id string   Identifier of the organization
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl get organization](get-organization.md)	 - Get an organization the authenticated user is a member of

