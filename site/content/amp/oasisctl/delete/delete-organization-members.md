---
title: Delete Organization Members with `oasisctl`
menuTitle: Delete Organization Members
weight: 20
---

Delete members from organization

```
oasisctl delete organization members [flags]
```

## Options
```
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
* [oasisctl delete organization](delete-organization.md)	 - Delete an organization the authenticated user has access to

