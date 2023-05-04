---
title: Database Methods
weight: 5
description: >-
  View-related JavaScript methods of Database objects for arangosh and Foxx
archetype: default
---
## View

`db._view(view-name)`

Returns the view with the given name or null if no such view exists.

```js
---
name: viewDatabaseGet
description: ''
render: input/output
version: '3.11'
release: stable_single
---
~ db._createView("example", "arangosearch", {});
    view = db._view("example");
  // or, alternatively
  view = db["example"]
~ db._dropView("example");
```


`db._view(view-identifier)`

Returns the view with the given identifier or null if no such view exists.
Accessing views by identifier is discouraged for end users. End users should
access views using the view name.

**Examples**

Get a View by name:

```js
---
name: viewDatabaseNameKnown
description: ''
render: input/output
version: '3.11'
release: stable_single
---
  db._view("demoView");
```

Unknown View:

```js
---
name: viewDatabaseNameUnknown
description: ''
render: input/output
version: '3.11'
release: stable_single
---
  db._view("unknown");
```

## Create

`db._createView(name, type, properties)`

Creates a new View.

`name` is a string and the name of the View. No View or collection with the
same name may already exist in the current database. For information about the
naming constraints for Views, see [View names](_index.md#view-names).

`type` must be the string `"arangosearch"`, as it is currently the only
supported View type.

`properties` is an optional object containing View configuration specific
to each View-type.
- [`arangosearch` View definition](../../../../core-topics/indexing/arangosearch/arangosearch-views-reference.md#view-definitionmodification)
- [`search-alias` View definition](../../../../core-topics/indexing/arangosearch/search-alias-views-reference.md#view-definition)

**Examples**

```js
---
name: viewDatabaseCreate
description: ''
render: input/output
version: '3.11'
release: stable_single
---
  v = db._createView("example", "arangosearch");
  v.properties()
  db._dropView("example")
```

## All Views

`db._views()`

Returns all views of the given database.

**Examples**

List all views:

```js
---
name: viewDatabaseList
description: ''
render: input/output
version: '3.11'
release: stable_single
---
~ db._createView("exampleView", "arangosearch");
  db._views();
~ db._dropView("exampleView");
```

## Drop

`db._dropView(name)`

Drops a view named `name` and all its data. No error is thrown if there is
no such view.


`db._dropView(view-identifier)`

Drops a view identified by `view-identifier` with all its data. No error is
thrown if there is no such view.

**Examples**

Drop a view:

```js
---
name: viewDatabaseDrop
description: ''
render: input/output
version: '3.11'
release: stable_single
---
  db._createView("exampleView", "arangosearch");
  db._dropView("exampleView");
  db._view("exampleView");
```
