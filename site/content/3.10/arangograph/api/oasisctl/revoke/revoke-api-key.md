---
title: Oasisctl Revoke Apikey
weight: 5
description: >-
  Description of the oasisctl revoke apikey command
archetype: default
---
Revoke an API key with given identifier

## Synopsis

Revoke an API key with given identifier

```
oasisctl revoke apikey [flags]
```

## Options

```
  -i, --apikey-id string   Identifier of the API key to revoke
  -h, --help               help for apikey
```

## Options inherited from parent commands

```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also

* [oasisctl revoke](_index.md)	 - Revoke keys & tokens
* [oasisctl revoke apikey token](revoke-api-key-token.md)	 - Revoke an API key token

