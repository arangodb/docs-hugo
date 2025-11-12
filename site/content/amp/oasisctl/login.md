---
title: Login with `oasisctl`
menuTitle: Login
weight: 17
---

Log in to the Arango Managed Platform (AMP) using an API key

## Synopsis
To authenticate in a script environment, run:
	
	export OASIS_TOKEN=$(oasisctl login --key-id=<your-key-id> --key-secret=<your-key-secret>)


```
oasisctl login [flags]
```

## Options
```
  -h, --help                help for login
  -i, --key-id string       API key identifier
  -s, --key-secret string   API key secret
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl](options.md)	 - Arango Managed Platform (AMP)

