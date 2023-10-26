---
archetype: default
description: Description of the oasisctl accept organization invite command
title: Oasisctl Accept Organization Invite
menuTitle: Accept Organization Invite
weight: 15
---
## Synopsis
Accept an organization invite the authenticated user has access to

```
oasisctl accept organization invite [flags]
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
* [oasisctl accept organization](accept-organization.md)	 - Accept organization related invites

