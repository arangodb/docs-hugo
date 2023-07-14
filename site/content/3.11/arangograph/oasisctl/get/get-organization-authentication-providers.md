---
title: Oasisctl Get Organization Authentication Providers
menuTitle: Get Organization Authentication Providers
weight: 85
description: >-
  Description of the oasisctl get organization authentication providers command
archetype: default
---
Get which authentication providers are allowed for accessing a specific organization

## Synopsis

Get which authentication providers are allowed for accessing a specific organization

```
oasisctl get organization authentication providers [flags]
```

## Options

```
  -h, --help                     help for providers
  -o, --organization-id string   Identifier of the organization
```

## Options inherited from parent commands

```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also

* [oasisctl get organization authentication](get-organization-authentication.md)	 - Get authentication specific information for an organization

