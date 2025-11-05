---
title: Views
menuTitle: Views
weight: 20
description: >-
  Views can index documents of multiple collections and enable sophisticated
  information retrieval possibilities, like full-text search with ranking by
  relevance
---
Views allows you to perform complex searches at high performance. They are
accelerated by inverted indexes that are updated near real-time.

A View is conceptually a transformation function over documents from zero or
more collections. The transformation depends on the View type and the View
configuration.

Views are powered by ArangoDB's built-in search engine.
See [ArangoSearch](../../indexes-and-search/arangosearch/_index.md) for details.

## View types

Available View types:

- The traditional [`arangosearch` Views](../../indexes-and-search/arangosearch/arangosearch-views-reference.md) to which
  you link collections to.
- The modern [`search-alias` Views](../../indexes-and-search/arangosearch/search-alias-views-reference.md)
  that can reference inverted indexes that are defined on the collection-level.

You need to specify the type when you create the View.
The type cannot be changed later.

## View names

You can give each View a name to identify and access it. The name needs to
be unique within a [database](databases.md), but not globally
for the entire ArangoDB instance.

The namespace for Views is shared with [collections](collections.md).
There cannot exist a View and a collection with the same name in the same database.

The View name needs to be a string that adheres to either the **traditional**
or the **extended** naming constraints. Whether the former or the latter is
active depends on the `--database.extended-names` startup option.
The extended naming constraints are used if enabled, allowing many special and
UTF-8 characters in database, collection, View, and index names. If set to
`false` (default), the traditional naming constraints are enforced.

{{< info >}}
The extended naming constraints are an **experimental** feature but they will
become the norm in a future version. Check if your drivers and client applications
are prepared for this feature before enabling it.
{{< /info >}}

The restrictions for View names are as follows:

- For the **traditional** naming constraints:
  - The names must only consist of the letters `A` to `Z` (both in lower 
    and upper case), the digits `0` to `9`, and underscore (`_`) and dash   (`-`)
    characters. This also means that any non-ASCII names are not allowed.
  - View names must start with a letter.
  - The maximum allowed length of a name is 256 bytes.
  - View names are case-sensitive.

- For the **extended** naming constraints:
  - Names can consist of most UTF-8 characters, such as Japanese or Arabic
    letters, emojis, letters with accentuation. Some ASCII characters are
    disallowed, but less compared to the  _traditional_ naming constraints.
  - Names cannot contain the characters `/` or `:` at any position, nor any
    control characters (below ASCII code 32), such as `\n`, `\t`, `\r`, and `\0`.
  - Spaces are accepted, but only in between characters of the name. Leading
    or trailing spaces are not allowed.
  - `.` (dot), `_` (underscore) and the numeric digits `0`-`9` are not allowed
    as first character, but at later positions.
  - View names are case-sensitive.
  - View names containing UTF-8 characters must be 
    [NFC-normalized](https://en.wikipedia.org/wiki/Unicode_equivalence#Normal_forms).
    Non-normalized names are rejected by the server.
  - The maximum length for a View name is 256 bytes after normalization. 
    As a UTF-8 character may consist of multiple bytes, this does not necessarily 
    equate to 256 characters.

  Example View names that can be used with the _extended_ naming constraints:
  `España`, `😀`, `犬`, `كلب`, `@abc123`, `København`, `München`, `Бишкек`, `abc? <> 123!`

{{< warning >}}
While it is possible to change the value of the
`--database.extended-names` option from `false` to `true` to enable
extended names, the reverse is not true. Once the extended names have been
enabled, they remain permanently enabled so that existing databases,
collections, Views, and indexes with extended names remain accessible.

Please be aware that dumps containing extended names cannot be restored
into older versions that only support the traditional naming constraints. In a
cluster setup, it is required to use the same naming constraints for all
Coordinators and DB-Servers of the cluster. Otherwise, the startup is
refused.
{{< /warning >}}

You can rename Views (except in cluster deployments). This changes the
View name, but not the View identifier.

## View identifiers

A View identifier lets you refer to a View in a database, similar to
the name. It is a string value and is unique within a database. Unlike
View names, ArangoDB assigns View IDs automatically and you have no
control over them.

ArangoDB internally uses View IDs to look up Views. However, you
should use the View name to access a View instead of its identifier.

ArangoDB uses 64-bit unsigned integer values to maintain View IDs
internally. When returning View IDs to clients, ArangoDB returns them as
strings to ensure the identifiers are not clipped or rounded by clients that do
not support big integers. Clients should treat the View IDs returned by
ArangoDB as opaque strings when they store or use them locally.

## View interfaces

The following sections show examples of how you can use the APIs of ArangoDB and
the official drivers, as well as the ArangoDB Shell and the built-in web interface,
to perform common operations related to Views. For less common operations
and other drivers, see the corresponding reference documentation.

The examples are limited to the basic usage of the View interfaces.
See the following for more details about the different View types and their
configuration:

- [`arangosearch` Views](../../indexes-and-search/arangosearch/arangosearch-views-reference.md)
- [`search-alias` Views](../../indexes-and-search/arangosearch/search-alias-views-reference.md)

### Create a View

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. Click **Views** in the main navigation.
2. Click the **Add view** button.
3. Enter a **Name** for the View that isn't already used by a collection or View.
4. Select the **Type** for the View.
5. You can optionally specify additional settings:
   - For a `search-alias` View, you can add inverted indexes to the View now,
     but you can also do so later.
   - For an `arangosearch` View, you can configure the immutable settings that
     you can only set on View creation and not modify later.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: viewUsage_01
render: input
description: |
  Create a View with default properties:
---
~db._createView("myView", "search-alias");
viewSearch = db._createView("myArangoSearchView", "arangosearch");
viewAlias = db._createView("mySearchAliasView", "search-alias");
~addIgnoreView("myView");
~addIgnoreView("myArangoSearchView");
~addIgnoreView("mySearchAliasView");
```

See [`db._createView()`](../../develop/javascript-api/@arangodb/db-object.md#db_createviewname-type--properties)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl -d '{"name":"myView","type":"arangosearch"}' http://localhost:8529/_db/mydb/_api/view
curl -d '{"name":"mySearchAliasView","type":"search-alias"}' http://localhost:8529/_db/mydb/_api/view
```

See the `POST /_db/{database-name}/_api/view` endpoint in the _HTTP API_ for details:
- [`arangosearch` View](../../develop/http-api/views/arangosearch-views.md#create-an-arangosearch-view)
- [`search-alias` View](../../develop/http-api/views/search-alias-views.md#create-a-search-alias-view)
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
let viewSearch = await db.createView("myView", { type: "arangosearch" });
let viewAlias  = await db.createView("mySearchAliasView",  { type: "search-alias" });
```

See [`Database.createView()`](https://arangodb.github.io/arangojs/latest/classes/databases.Database.html#createView)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
viewSearch, err := db.CreateArangoSearchView(ctx, "myView", nil)
if err != nil {
  fmt.Println(err)
} else {
  fmt.Println(viewSearch.Type())
}

viewAlias, err := db.CreateArangoSearchAliasView(ctx, "mySearchAliasView", nil)
if err != nil {
  fmt.Println(err)
} else {
  fmt.Println(viewAlias.Type())
}
```

See `DatabaseView.CreateArangoSearchView()` and `DatabaseView.CreateArangoSearchAliasView()`
in the [_go-driver_ v2 documentation](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#DatabaseView)
for details.
{{< /tab >}}

{{< tab "Java" >}}
```java
ViewEntity viewSearch = db.createView("myView1", ViewType.ARANGO_SEARCH);
ViewEntity viewAlias = db.createView("myView2", ViewType.SEARCH_ALIAS);
// -- or --
ViewEntity viewSearch = db.createArangoSearch("myView", null);
ViewEntity viewAlias  = db.createSearchAlias("mySearchAliasView", null);
```

See `ArangoDatabase.createView()`, `ArangoDatabase.createArangoSearch()`, and
`ArangoDatabase.createSearchAlias()` in the
[_arangodb-java-driver_ documentation](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoDatabase.html)
for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
info = db.create_view("myView", "arangosearch")
info = db.create_view("mySearchAliasView", "search-alias")
```

See [`StandardDatabase.create_view()`](https://docs.python-arango.com/en/main/specs.html#arango.database.StandardDatabase.create_view)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

### Get a View

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. If necessary, [switch to the database](databases.md#set-the-database-context)
   that contains the desired View.
2. Click **Views** in the main navigation.
3. Click the name or row of the desired View.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: viewUsage_02
description: |
  Get the View called `myView` by its name:
---
view = db._view("myView");
```

See [`db._view()`](../../develop/javascript-api/@arangodb/db-object.md#db_viewview)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl http://localhost:8529/_db/mydb/_api/view/myView
curl http://localhost:8529/_db/mydb/_api/view/mySearchAliasView
```

See the [`GET /_db/{database-name}/_api/view/{view-name}`](../../develop/http-api/views/_index.md)
endpoint in the _HTTP API_ for details.
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
let viewSearch = db.view("myView");
let info = await viewSearch.get();

let viewAlias = db.view("mySearchAliasView");
info = await viewAlias.get();
```

See [`Database.view()`](https://arangodb.github.io/arangojs/latest/classes/databases.Database.html#view)
in the _arangojs_ documentation
for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
for _, viewName := range []string{"myView", "mySearchAliasView"} {
  view, err := db.View(ctx, viewName)
  if err != nil {
    fmt.Println(err)
  } else {
    switch view.Type() {
    case arangodb.ViewTypeArangoSearch:
      {
        viewSearch, err := view.ArangoSearchView()
        if err != nil {
          fmt.Println(err)
        } else {
          fmt.Printf("%s: %s\n", viewSearch.Name(), viewSearch.Type())
        }
      }
    case arangodb.ViewTypeSearchAlias:
      {
        viewAlias, err := view.ArangoSearchViewAlias()
        if err != nil {
          fmt.Println(err)
        } else {
          fmt.Printf("%s: %s\n", viewAlias.Name(), viewAlias.Type())
        }
      }
    default:
      panic("Unsupported View type")
    }
  }
}
```

See [`DatabaseView.View()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#DatabaseView)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
```java
ArangoView view = db.view("myView");
ViewEntity viewInfo = view.getInfo();

ArangoSearch viewSearch = db.arangoSearch("myView");
ViewEntity viewSearchInfo = viewSearch.getInfo();

SearchAlias viewAlias = db.searchAlias("mySearchAliasView");
ViewEntity viewAliasInfo = viewAlias.getInfo();
```

See `ArangoDatabase.view(String name)`, `ArangoDatabase.arangoSearch(String name)`,
and `ArangoDatabase.searchAlias(String name)` in the
[_arangodb-java-driver_ documentation](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoDatabase.html)
for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
info = db.view_info("myView")
info = db.view_info("mySearchAliasView")
```

See [`StandardDatabase.view()`](https://docs.python-arango.com/en/main/specs.html#arango.database.StandardDatabase.view)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

### Get the View properties

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. If necessary, [switch to the database](databases.md#set-the-database-context)
   that contains the desired View.
2. Click **Views** in the main navigation.
3. Click the name or row of the desired View.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: viewUsage_03
description: ''
---
var view = db._view("myView");
view.properties();
```

See [`view.properties()`](../../develop/javascript-api/@arangodb/view-object.md#viewpropertiesnew-properties--partialupdate)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl http://localhost:8529/_db/mydb/_api/view/myView/properties
curl http://localhost:8529/_db/mydb/_api/view/mySearchAliasView/properties
```

See the `GET /_db/{database-name}/_api/view/{view-name}/properties` endpoint in
the _HTTP API_ for details:
- [`arangosearch` View](../../develop/http-api/views/arangosearch-views.md#get-the-properties-of-a-view)
- [`search-alias` View](../../develop/http-api/views/search-alias-views.md#get-information-about-a-view)
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
let viewSearch = db.view("myView");
let props = await viewSearch.properties();

let viewAlias = db.view("mySearchAliasView");
props = await viewAlias.properties();
```

See [`View.properties()`](https://arangodb.github.io/arangojs/latest/classes/views.View.html#properties)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
for _, viewName := range []string{"myView", "mySearchAliasView"} {
  view, err := db.View(ctx, viewName)
  if err != nil {
    fmt.Println(err)
  } else {
    switch view.Type() {
    case arangodb.ViewTypeArangoSearch:
      {
        viewSearch, err := view.ArangoSearchView()
        if err != nil {
          fmt.Println(err)
        } else {
          props, err := viewSearch.Properties(ctx)
          if err != nil {
            fmt.Println(err)
          } else {
            fmt.Printf("%+v\n", props)
          }
        }
      }
    case arangodb.ViewTypeSearchAlias:
      {
        viewAlias, err := view.ArangoSearchViewAlias()
        if err != nil {
          fmt.Println(err)
        } else {
          props, err := viewAlias.Properties(ctx)
          if err != nil {
            fmt.Println(err)
          } else {
            fmt.Printf("%+v\n", props)
          }
        }
      }
    default:
      panic("Unsupported View type")
    }
  }
}
```

See [`ArangoSearchView.Properties()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#ArangoSearchView)
and [`ArangoSearchViewAlias.Properties()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#ArangoSearchViewAlias)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
```java
ArangoSearch viewSearch = db.arangoSearch("myView");
ArangoSearchPropertiesEntity viewSearchProps = viewSearch.getProperties();

SearchAlias viewAlias = db.searchAlias("mySearchAliasView");
SearchAliasPropertiesEntity viewAliasProps = viewAlias.getProperties();
```

See [`ArangoSearch.getProperties()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoSearch.html#getProperties%28%29)
and [`SearchAlias.getProperties()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/SearchAlias.html#getProperties%28%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
props = db.view("myView")
props = db.view("mySearchAliasView")
```

See [`StandardDatabase.view()`](https://docs.python-arango.com/en/main/specs.html#arango.database.StandardDatabase.view)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

### Set View properties

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. If necessary, [switch to the database](databases.md#set-the-database-context)
   that contains the desired View.
2. Click **Views** in the main navigation.
3. Click the name or row of the desired View.
4. Adjust the configuration using the form or the JSON editor.
5. Click the **Save view** button.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: viewUsage_04
description: ''
---
~db._create("coll");
var viewSearch = db._view("myArangoSearchView");
viewSearch.properties({
  cleanupIntervalStep: 12,
  links: {
    coll: {
      includeAllFields: true
    }
  }
}, /*partialUpdate*/ true);
~db._dropView("myArangoSearchView");

~db.coll.ensureIndex({ type: "inverted", name: "idx", fields: [ "attr" ] });
var viewAlias = db._view("mySearchAliasView");
viewAlias.properties({
  indexes: [
    { collection: "coll", index: "idx" },
  ]
}, /*partialUpdate*/ true);
~viewSearch.properties({ links: { coll: null } });
~viewAlias.properties({ indexes: [] }, false);
~db._drop("coll");
```

See [`view.properties()`](../../develop/javascript-api/@arangodb/view-object.md#viewpropertiesnew-properties--partialupdate)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl -XPATCH -d '{"cleanupIntervalStep":12,"links":{"coll":{"includeAllFields":true}}}' http://localhost:8529/_db/mydb/_api/view/myView/properties
curl -XPATCH -d '{"indexes":[{"collection":"coll","index":"idx"}]}' http://localhost:8529/_db/mydb/_api/view/mySearchAliasView/properties
```

See the `PATCH /_db/{database-name}/_api/view/{view-name}/properties` endpoint
in the _HTTP API_ for details:
- [`arangosearch` View](../../develop/http-api/views/arangosearch-views.md#update-the-properties-of-an-arangosearch-view)
- [`search-alias` View](../../develop/http-api/views/search-alias-views.md#update-the-properties-of-a-search-alias-view)
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
let viewSearch = db.view("myView");
let props = await viewSearch.updateProperties({
  cleanupIntervalStep: 12,
  links: {
    coll: {
      includeAllFields: true
    }
  }
});

let viewAlias = db.view("mySearchAliasView");
props = await viewAlias.updateProperties({
  indexes: [
    { collection: "coll", index: "idx" }
  ]
});
```

See [`View.updateProperties()`](https://arangodb.github.io/arangojs/latest/classes/views.View.html#updateProperties)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
view1, err := db.View(ctx, "myView")
if err != nil {
  fmt.Println(err)
} else {
  viewSearch, err := view1.ArangoSearchView()
  if err != nil {
    fmt.Println(err)
  } else {
    err = viewSearch.SetProperties(ctx, arangodb.ArangoSearchViewProperties{
      CleanupIntervalStep: utils.NewType(int64(12)),
      Links: arangodb.ArangoSearchLinks{
        "coll": arangodb.ArangoSearchElementProperties{
          IncludeAllFields: utils.NewType(true),
        },
      },
    })
    if err != nil {
      fmt.Println(err)
    }
  }
}

view2, err := db.View(ctx, "mySearchAliasView")
if err != nil {
  fmt.Println(err)
} else {
  viewAlias, err := view2.ArangoSearchViewAlias()
  if err != nil {
    fmt.Println(err)
  } else {
    err := viewAlias.SetProperties(ctx, arangodb.ArangoSearchAliasViewProperties{
      Indexes: []arangodb.ArangoSearchAliasIndex{
        {
          Collection: "coll",
          Index:      "idx",  // An inverted index with this name needs to exist
        },
      },
    })
    if err != nil {
      fmt.Println(err)
    }
  }
}
```

See [`ArangoSearchView.SetProperties()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#ArangoSearchView)
and [`ArangoSearchViewAlias.SetProperties()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#ArangoSearchViewAlias)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
```java
ArangoSearch viewSearch = db.arangoSearch("myView");
ArangoSearchPropertiesEntity viewSearchProps = viewSearch.updateProperties(
        new ArangoSearchPropertiesOptions()
                .cleanupIntervalStep(12L)
                .link(CollectionLink.on("coll")
                        .includeAllFields(true)
                )
);

SearchAlias viewAlias = db.searchAlias("mySearchAliasView");
SearchAliasPropertiesEntity viewAliasProps = viewAlias.updateProperties(
        new SearchAliasPropertiesOptions()
                .indexes(new SearchAliasIndex("coll", "idx"))
);
```

See [`ArangoSearch.updateProperties()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoSearch.html#updateProperties%28com.arangodb.model.arangosearch.ArangoSearchPropertiesOptions%29)
and [`SearchAlias.updateProperties()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/SearchAlias.html#updateProperties%28com.arangodb.model.arangosearch.SearchAliasPropertiesOptions%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
props = db.update_view("myView", {
  "cleanupIntervalStep": 12,
  "links": {
    "coll": {
      "includeAllFields": True
    }
  }
})

props = db.update_view("mySearchAliasView", {
  "indexes": [
    { "collection": "coll", "index": "idx"}
  ]
})
```

See [`StandardDatabase.update_view()`](https://docs.python-arango.com/en/main/specs.html#arango.database.StandardDatabase.update_view)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

### Drop a View

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. If necessary, [switch to the database](databases.md#set-the-database-context)
   that contains the desired View.
2. Click **Views** in the main navigation.
3. Click the name or row of the desired View.
4. Click the **Delete** button and confirm the deletion.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: viewUsage_08
description: ''
---
~removeIgnoreView("myView");
~removeIgnoreView("myArangoSearchView");
~removeIgnoreView("mySearchAliasView");
db._dropView("myView");
~db._dropView("myArangoSearchView");
~db._dropView("mySearchAliasView");
```

See [`db._dropView()`](../../develop/javascript-api/@arangodb/view-object.md#viewdrop)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl -XDELETE http://localhost:8529/_db/mydb/_api/view/myView
curl -XDELETE http://localhost:8529/_db/mydb/_api/view/mySearchAliasView
```

See the `DELETE /_db/{database-name/_api/view/{view-name}` endpoint in the
_HTTP API_ for details:
- [`arangosearch` View](../../develop/http-api/views/arangosearch-views.md#drop-a-view)
- [`search-alias` View](../../develop/http-api/views/search-alias-views.md#drop-a-view)
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
let viewSearch = db.view("myView");
let ok = await viewSearch.drop();

let viewAlias = db.view("mySearchAliasView");
ok = await viewAlias.drop();
```

See [`View.drop()`](https://arangodb.github.io/arangojs/latest/classes/views.View.html#drop)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
for _, viewName := range []string{"myView", "mySearchAliasView"} {
  view, err := db.View(ctx, viewName)
  if err != nil {
    fmt.Println(err)
  } else {
    err = view.Remove(ctx)
    if err != nil {
      fmt.Println(err)
    }
  }
}
```

See [`View.Remove()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#View)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
```java
ArangoView view = db.view("myView");
view.drop();
// -- or --
ArangoSearch viewSearch = db.arangoSearch("myView");
viewSearch.drop();

SearchAlias viewAlias = db.searchAlias("mySearchAliasView");
viewAlias.drop();
```

See [`ArangoView.drop()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoView.html#drop%28%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
ok = db.delete_view("myView")
ok = db.delete_view("mySearchAliasView")
```

See [`StandardDatabase.delete_view()`](https://docs.python-arango.com/en/main/specs.html#arango.database.StandardDatabase.delete_view)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}
