---
title: Delete Group Members with `oasisctl`
menuTitle: Delete Group Members
weight: 13
---

Delete members from group

```
oasisctl delete group members [flags]
```

## Options
```
  -g, --group-id string          Identifier of the group to delete members from
  -h, --help                     help for members
  -o, --organization-id string   Identifier of the organization
  -u, --user-emails strings      A comma separated list of user email addresses
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl delete group](delete-group.md)	 - Delete a group the authenticated user has access to

