---
title: Oasisctl Lock
weight: 80
description: >-
  Description of the oasisctl lock command
archetype: chapter
---
Lock resources

## Synopsis

Lock resources

```
oasisctl lock [flags]
```

## Options

```
  -h, --help   help for lock
```

## Options inherited from parent commands

```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also

* [oasisctl](../options.md)	 - ArangoGraph Insights Platform
* [oasisctl lock cacertificate](lock-ca-certificate.md)	 - Lock a CA certificate, so it cannot be deleted
* [oasisctl lock deployment](lock-deployment.md)	 - Lock a deployment, so it cannot be deleted
* [oasisctl lock ipallowlist](lock-ip-allowlist.md)	 - Lock an IP allowlist, so it cannot be deleted
* [oasisctl lock organization](lock-organization.md)	 - Lock an organization, so it cannot be deleted
* [oasisctl lock policy](lock-policy.md)	 - Lock a backup policy
* [oasisctl lock project](lock-project.md)	 - Lock a project, so it cannot be deleted

