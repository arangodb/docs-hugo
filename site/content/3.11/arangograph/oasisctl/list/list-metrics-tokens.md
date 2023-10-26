---
archetype: default
description: Description of the oasisctl list metrics tokens command
title: Oasisctl List Metrics Tokens
menuTitle: List Metrics Tokens
weight: 130
---
## Synopsis
List all metrics tokens of the given deployment

```
oasisctl list metrics tokens [flags]
```

## Options
```
  -d, --deployment-id string     Identifier of the deployment
  -h, --help                     help for tokens
  -o, --organization-id string   Identifier of the organization
  -p, --project-id string        Identifier of the project
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also
* [oasisctl list metrics](list-metrics.md)	 - List metrics resources

