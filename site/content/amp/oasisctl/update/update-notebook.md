---
title: Update Notebook with `oasisctl`
menuTitle: Update Notebook
weight: 10
---

Update notebook

```
oasisctl update notebook [flags]
```

## Options
```
  -d, --description string      Description of the notebook
  -s, --disk-size int32         Notebook disk size in GiB
  -h, --help                    help for notebook
      --name string             Name of the notebook
  -n, --notebook-id string      Identifier of the notebook
  -m, --notebook-model string   Identifier of the notebook model
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl update](_index.md)	 - Update resources

