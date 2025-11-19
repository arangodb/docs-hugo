---
title: Update Policy Add Binding with `oasisctl`
menuTitle: Update Policy Add Binding
weight: 19
---

Add a role binding to a policy

```
oasisctl update policy add binding [flags]
```

## Options
```
      --group-id strings   Identifiers of the groups to add bindings for
  -h, --help               help for binding
  -r, --role-id string     Identifier of the role to bind to
  -u, --url string         URL of the resource to update the policy for
      --user-id strings    Identifiers of the users to add bindings for
```

## Options Inherited From Parent Commands
```
      --endpoint string   API endpoint of the Arango Managed Platform (AMP) (default "api.cloud.arangodb.com")
      --format string     Output format (table|json) (default "table")
      --token string      Token used to authenticate at the Arango Managed Platform (AMP)
```

## See also
* [oasisctl update policy add](update-policy-add.md)	 - Add to a policy

