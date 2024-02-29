---
description: Description of the oasisctl delete organization command
title: Oasisctl Delete Organization
menuTitle: Delete Organization
weight: 95
---
## Synopsis
Delete an organization the authenticated user has access to

```
oasisctl delete organization [flags]
```

## Options
```
  -h, --help                     help for organization
  -o, --organization-id string   Identifier of the organization
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also
* [oasisctl delete](_index.md)	 - Delete resources
* [oasisctl delete organization invite](delete-organization-invite.md)	 - Delete an organization invite the authenticated user has access to
* [oasisctl delete organization members](delete-organization-members.md)	 - Delete members from organization

