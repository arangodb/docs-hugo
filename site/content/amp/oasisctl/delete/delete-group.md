---
title: Delete Group with `oasisctl`
menuTitle: Delete Group
weight: 12
---

Delete a group the authenticated user has access to

```
oasisctl delete group [flags]
```

## Options
```
  -g, --group-id string          Identifier of the group
  -h, --help                     help for group
  -o, --organization-id string   Identifier of the organization
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl delete](_index.md)	 - Delete resources
* [oasisctl delete group members](delete-group-members.md)	 - Delete members from group

