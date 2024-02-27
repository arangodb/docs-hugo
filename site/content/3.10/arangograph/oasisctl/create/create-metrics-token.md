---
description: Description of the oasisctl create metrics token command
title: Oasisctl Create Metrics Token
menuTitle: Create Metrics Token
weight: 65
---
## Synopsis
Create a new metrics access token

```
oasisctl create metrics token [flags]
```

## Options
```
  -d, --deployment-id string     Identifier of the deployment to create the token for
      --description string       Description of the token
  -h, --help                     help for token
      --lifetime duration        Lifetime of the token.
      --name string              Name of the token
  -o, --organization-id string   Identifier of the organization to create the token in
  -p, --project-id string        Identifier of the project to create the token in
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also
* [oasisctl create metrics](create-metrics.md)	 - Create metrics resources

