---
description: Description of the oasisctl completion command
title: Oasisctl Completion
menuTitle: Completion
weight: 7
---
## Synopsis
To load completion run

    . <(oasisctl completion [bash|fish|powershell|zsh])

To configure your bash shell to load completions for each session add to your bashrc

    # ~/.bashrc or ~/.profile
    . <(oasisctl completion bash)


```
oasisctl completion [flags]
```

## Options
```
  -h, --help   help for completion
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the ArangoDB Oasis (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at ArangoDB Oasis
```

## See also
* [oasisctl](options.md)	 - ArangoGraph Insights Platform

