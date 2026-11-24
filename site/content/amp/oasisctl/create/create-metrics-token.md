---
title: Create Metrics Token with _oasisctl_
menuTitle: Create Metrics Token
weight: 12
# This is a generated file, DO NOT MODIFY directly!
---

Create a new metrics access token

## Synopsis
Create a new metrics access token for a deployment.

The lifetime of the token is specified with the --lifetime flag, in minutes or
hours, for example:

    oasisctl create metrics token --lifetime 720h

The maximum lifetime of a metrics token is one year (365 days). Larger values are
capped at this limit. If you do not specify a lifetime, the server default is
used.


```
oasisctl create metrics token [flags]
```

## Options
```
  -d, --deployment-id string     Identifier of the deployment to create the token for
      --description string       Description of the token
  -h, --help                     help for token
      --lifetime duration        Lifetime of the token in minutes or hours, e.g. 90m or 720h (maximum 8760h = 365 days)
      --name string              Name of the token
  -o, --organization-id string   Identifier of the organization to create the token in
  -p, --project-id string        Identifier of the project to create the token in
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl create metrics](create-metrics.md)	 - Create metrics resources

