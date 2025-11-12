---
title: Create API Key with `oasisctl`
menuTitle: Create API Key
weight: 1
---

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
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl create](_index.md)	 - Create resources

