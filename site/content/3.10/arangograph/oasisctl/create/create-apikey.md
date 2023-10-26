---
archetype: default
description: Description of the oasisctl create apikey command
title: Oasisctl Create Apikey
menuTitle: Create Apikey
weight: 10
---
## Synopsis
Create a new API key

```
oasisctl create apikey [flags]
```

## Options
```
  -h, --help                     help for apikey
  -o, --organization-id string   If set, the newly created API key will grant access to this organization only
      --readonly                 If set, the newly created API key will grant readonly access only
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also
* [oasisctl create](_index.md)	 - Create resources

