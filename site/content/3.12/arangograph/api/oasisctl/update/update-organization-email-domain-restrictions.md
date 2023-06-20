---
title: Oasisctl Update Organization Email Domain Restrictions
weight: 80
description: >-
  Description of the oasisctl update organization email domain restrictions command
archetype: default
---
Update which domain restrictions are placed on accessing a specific organization

## Synopsis

Update which domain restrictions are placed on accessing a specific organization

```
oasisctl update organization email domain restrictions [flags]
```

## Options

```
  -d, --allowed-domain strings   Allowed email domains for users of the organization
  -h, --help                     help for restrictions
  -o, --organization-id string   Identifier of the organization
```

## Options inherited from parent commands

```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also

* [oasisctl update organization email domain](update-organization-email-domain.md)	 - Update email domain specific information for an organization

