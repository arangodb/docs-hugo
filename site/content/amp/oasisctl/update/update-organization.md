---
title: Update Organization with `oasisctl`
menuTitle: Update Organization
weight: 11
---

Update an organization the authenticated user has access to

```
oasisctl update organization [flags]
```

## Options
```
      --description string       Description of the organization
  -h, --help                     help for organization
      --name string              Name of the organization
  -o, --organization-id string   Identifier of the organization
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl update](_index.md)	 - Update resources
* [oasisctl update organization authentication](update-organization-authentication.md)	 - Update authentication settings for an organization
* [oasisctl update organization email](update-organization-email.md)	 - Update email specific information for an organization

