---
title: ArangoDB Server Options
menuTitle: Options
weight: 5
description: >-
  ArangoDB Server Options
pageToc:
  maxHeadlineLevel: 2
archetype: default
---
Usage: `arangod [<options>]`

To list the commonly used startup options with a description of each option, run
the server executable in a command-line with the `--help` (or `-h`) option:

```
arangod --help
```

To list **all** available startup options and their descriptions, use:

```
arangod --help-all
```

You can specify the database directory for the server as a positional (unnamed)
parameter:

```
arangod /path/to/datadir
```

You can also be explicit by using a named parameter:

```
arangod --database.directory /path/to/datadir
```

All other startup options need to be passed as named parameters, using two
hyphens (`--`), followed by the option name, an equals sign (`=`) or a space,
and the option value. The value needs to be wrapped in double quote marks (`"`)
if the value contains whitespace characters. Extra whitespace around `=` is
allowed:

```
arangod --database.directory = "/path with spaces/to/datadir"
```

See [Configuration](../../operations/administration/configuration.md)
if you want to translate startup options set  to configuration files
and to learn more about startup options in general.

See
[Fetch Current Configuration Options](../../operations/administration/configuration.md#fetch-current-configuration-options)
if you want to query the `arangod` server for the current settings at runtime.

{{% program-options name="arangod" %}}
