---
title: Create IP Allowlist with `oasisctl`
menuTitle: Create IP Allowlist
weight: 10
---

Create a new IP allowlist

```
oasisctl create ipallowlist [flags]
```

## Options
```
      --cidr-range strings          List of CIDR ranges from which deployments are accessible
      --description string          Description of the IP allowlist
  -h, --help                        help for ipallowlist
      --name string                 Name of the IP allowlist
  -o, --organization-id string      Identifier of the organization to create the IP allowlist in
  -p, --project-id string           Identifier of the project to create the IP allowlist in
      --remote-inspection-allowed   If set, remote connectivity checks by the Arango Managed Platform are allowed
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl create](_index.md)	 - Create resources

