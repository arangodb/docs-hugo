---
title: Logs with `oasisctl`
menuTitle: Logs
weight: 18
---

Get logs of the servers of a deployment the authenticated user has access to

```
oasisctl logs [flags]
```

## Options
```
  -d, --deployment-id string     Identifier of the deployment
      --end string               End fetching logs at this timestamp (pass timestamp or duration before now)
      --format string            Formatting of the log output. It can be one of two: text, json. Text is the default value. (default "text")
  -h, --help                     help for logs
  -l, --limit int                Limit the number of log lines
  -o, --organization-id string   Identifier of the organization
  -p, --project-id string        Identifier of the project
  -r, --role string              Limit logs to servers with given role only (agents|coordinators|dbservers)
      --start string             Start fetching logs from this timestamp (pass timestamp or duration before now)
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl](options.md)	 - Arango Managed Platform (AMP)

