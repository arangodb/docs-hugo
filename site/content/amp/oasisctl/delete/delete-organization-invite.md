---
title: Delete Organization Invite with `oasisctl`
menuTitle: Delete Organization Invite
weight: 19
---

Delete an organization invite the authenticated user has access to

```
oasisctl delete organization invite [flags]
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
* [oasisctl delete organization](delete-organization.md)	 - Delete an organization the authenticated user has access to

