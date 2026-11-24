---
title: View HTTP API
menuTitle: Views
weight: 60
description: >-
  The HTTP interface for Views lets you manage Views of any type
---
## Addresses of Views

All Views in ArangoDB have a name that is unique within a database.
To access a View, use the View name to refer to it:

```
http://server:port/_db/<database-name>/_api/view/<view-name>
```

For example, assume ArangoDB runs locally, the View name is `demo`, and it is
in the `mydb` database. The URL of that View is the following:

```
http://localhost:8529/_db/mydb/_api/view/demo
```

## View types

ArangoDB supports the following types of Views and they share endpoints in the
HTTP API but the behavior is different for each:

- [`arangosearch` Views](arangosearch-views.md)
- [`search-alias` Views](search-alias-views.md)
