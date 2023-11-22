---
title: The _view_ object of the JavaScript API
menuTitle: view object
weight: 15
description: >-
  View objects represent ArangoSearch Views and provide access to information
  and methods for executing View-related operations
archetype: default
---
The JavaScript API returns _view_ objects when you use the following methods
of the [`db` object](db-object.md) from the `@arangodb` module:

- `db._createView(...)` 
- `db._views()` 
- `db._view(...)`

{{< info >}}
Square brackets in function signatures denote optional arguments.
{{< /info >}}

## Methods

### `view.name()`

Returns the name of the View.

**Examples**

Get View name:

```js
---
name: viewName
description: ''
---
var view = db._view("demoView");
view.name();
```

### `view.type()`

Returns the type of the View.

**Examples**

Get View type:

```js
---
name: viewType
description: ''
---
var view = db._view("demoView");
view.type();
```

### `view.properties(new-properties [, partialUpdate])`

`view.properties()`

Returns the properties of the View. The format of the result is specific to
each of the supported [View Types](../../../concepts/data-structure/views.md).

**Examples**

Get View properties:

```js
---
name: viewGetProperties
description: ''
---
var view = db._view("demoView");
view.properties();
```

---

`view.properties(new-properties, partialUpdate)`

Modifies the properties of the `view`. The format of the result is specific to
each of the supported [View Types](../../../concepts/data-structure/views.md).

`partialUpdate` is an optional Boolean parameter (`true` by default) that
determines how the `new-properties` object is merged with current View properties
(adds or updates `new-properties` properties to current if `true` replaces all
properties if `false`).

For the available properties of the supported View types, see:
- [`arangosearch` View Properties](../../../index-and-search/arangosearch/arangosearch-views-reference.md#view-properties)
- [`search-alias` View Modification](../../../index-and-search/arangosearch/search-alias-views-reference.md#view-modification)

**Examples**

Modify `arangosearch` View properties:

```js
---
name: viewModifyProperties
description: ''
---
~db._createView("example", "arangosearch");
var view = db._view("example");
view.properties();

// set cleanupIntervalStep to 12
view.properties({cleanupIntervalStep: 12});

// add a link
view.properties({links: {demo: {}}})

// remove a link
view.properties({links: {demo: null}})
~db._dropView("example");
```

Add and remove inverted indexes from a `search-alias` View:

```js
---
name: viewModifyPropertiesSearchAlias
description: ''
---
~db._create("coll");
~db.coll.ensureIndex({ name: "inv1", type: "inverted", fields: ["a"] });
~db.coll.ensureIndex({ name: "inv2", type: "inverted", fields: ["b[*]"] });
~db.coll.ensureIndex({ name: "inv3", type: "inverted", fields: ["c"] });
~db._createView("example", "search-alias", { indexes: [
~{ collection: "coll", index: "inv1" },
~{ collection: "coll", index: "inv2" }
~] });
var view = db._view("example");
view.properties();

view.properties({ indexes: [
  { collection: "coll", index: "inv1", operation: "del" },
  { collection: "coll", index: "inv3" }
] });
~db._dropView("example");
~db._drop("coll");
```

### `view.rename(new-name)`

Renames a view using the `new-name`. The `new-name` must not already be used by
a different view or collection in the same database. `new-name` must also be a
valid view name. For information about the naming constraints for Views, see
[View names](../../../concepts/data-structure/views.md#view-names).

If renaming fails for any reason, an error is thrown.

{{< info >}}
The rename method is not available in clusters.
{{< /info >}}

**Examples**

```js
---
name: viewRename
description: ''
---
var view = db._createView("example", "arangosearch");
view.name();
view.rename("exampleRenamed");
view.name();
~db._dropView("exampleRenamed");
```

### `view.drop()`

Drops a View and all its data.

**Examples**

Drop a View:

```js
---
name: viewDrop
description: ''
---
var view = db._createView("example", "arangosearch");
// or
var view = db._view("example");
view.drop();
db._view("example");
```
