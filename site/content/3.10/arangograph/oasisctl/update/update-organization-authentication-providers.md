---
layout: default
description: Description of the oasisctl update organization authentication providers command
title: Oasisctl Update Organization Authentication Providers
menuTitle: Update Organization Authentication Providers
weight: 70
---
## Synopsis
Update allowed authentication providers for an organization the authenticated user has access to

```
oasisctl update organization authentication providers [flags]
```

## Options
```
      --enable-github              If set, allow access from user accounts authentication through Github
      --enable-google              If set, allow access from user accounts authentication through Google
      --enable-microsoft           If set, allow access from user accounts authentication through Microsoft
      --enable-sso                 If set, allow access from user accounts authentication through single sign on (sso)
      --enable-username-password   If set, allow access from user accounts authentication through username-password
  -h, --help                       help for providers
  -o, --organization-id string     Identifier of the organization
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also
* [oasisctl update organization authentication](update-organization-authentication.md)	 - Update authentication settings for an organization

