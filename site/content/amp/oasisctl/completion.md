---
title: Completion with `oasisctl`
menuTitle: Completion
weight: 7
---

Generates bash completion scripts

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
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl](options.md)	 - Arango Managed Platform (AMP)

