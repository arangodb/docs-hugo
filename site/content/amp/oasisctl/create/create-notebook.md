---
title: Create Notebook with `oasisctl`
menuTitle: Create Notebook
weight: 13
---

Create a new notebook

```
oasisctl create notebook [flags]
```

## Options
```
  -d, --deployment-id string     Identifier of the deployment that the notebook has to run next to
      --description string       Description of the notebook
  -s, --disk-size int32          Disk size in GiB that has to be attached to given notebook
  -h, --help                     help for notebook
  -n, --name string              Name of the notebook
  -m, --notebook-model string    Identifier of the notebook model that the notebook has to use
  -o, --organization-id string   Identifier of the organization to create the notebook in
  -p, --project-id string        Identifier of the project to create the notebook in
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl create](_index.md)	 - Create resources

