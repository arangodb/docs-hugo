---
title: Oasisctl Unlock Cacertificate
menuTitle: Unlock CA Certificate
weight: 5
description: >-
  Description of the oasisctl unlock cacertificate command
archetype: default
---
Unlock a CA certificate, so it can be deleted

## Synopsis

Unlock a CA certificate, so it can be deleted

```
oasisctl unlock cacertificate [flags]
```

## Options

```
  -c, --cacertificate-id string   Identifier of the CA certificate
  -h, --help                      help for cacertificate
  -o, --organization-id string    Identifier of the organization
  -p, --project-id string         Identifier of the project
```

## Options inherited from parent commands

```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also

* [oasisctl unlock](_index.md)	 - Unlock resources

