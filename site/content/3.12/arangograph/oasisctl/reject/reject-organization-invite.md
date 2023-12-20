---
archetype: default
description: Description of the oasisctl reject organization invite command
title: Oasisctl Reject Organization Invite
menuTitle: Reject Organization Invite
weight: 15
---
## Synopsis
Reject an organization invite the authenticated user has access to

```
oasisctl reject organization invite [flags]
```

## Options
```
  -h, --help                     help for invite
  -i, --invite-id string         Identifier of the organization invite
  -o, --organization-id string   Identifier of the organization
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also
* [oasisctl reject organization](reject-organization.md)	 - Reject organization related invites

