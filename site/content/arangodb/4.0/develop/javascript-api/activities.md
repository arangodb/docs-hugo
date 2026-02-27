---
title: The `@arangodb/activities` module of the JavaScript API
menuTitle: '@arangodb/activities'
weight: 12
description: >-
  The `@arangodb/activities` module lets you pretty-print the current server
  activities
# Purposefully undocumented:
#   - get_snapshot_bare
#   - pretty_print
#   - createForest
#   - DFS
#   - Forest
---
`const activities = require('@arangodb/activities')`

For information about the server-side activities API, see the
[HTTP interface for server activities](../http-api/monitoring/activities.md).

## `get_snapshot()`

This method lets you pretty-print the high-level processes that are currently
running on the server, such as HTTP request handlers and AQL queries, in a
tree-like format.

You need to have the necessary permissions to access the activities API of the
server.

**Examples**

```js
const activities = require("@arangodb/activities");
activities.get_snapshot();
```

```
 ── RestHandler: {"method":"POST","url":"/_api/cursor","handler":"RestCursorHandler"}
    └── AQLQuery: {"query":"RETURN SLEEP(@seconds)"}
 ── RestHandler: {"method":"GET","url":"/_admin/activities","handler":"ActivityRegistryRestHandler"}
```
