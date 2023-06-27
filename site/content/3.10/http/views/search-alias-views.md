---
title: HTTP interface for search-alias Views
menuTitle: <code>search-alias</code> Views
weight: 5
description: >-
  The HTTP API for Views lets you manage `search-alias` Views, including adding
  and removing inverted indexes
archetype: default
---
```openapi
## Create a search-alias View

paths:
  /_api/view#searchalias:
    post:
      operationId: createViewSearchAlias
      description: |
        Creates a new View with a given name and properties if it does not
        already exist.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  description: |
                    The name of the View.
                  type: string
                type:
                  description: |
                    The type of the View. Must be equal to `"search-alias"`.
                    This option is immutable.
                  type: string
                indexes:
                  description: |
                    A list of inverted indexes to add to the View.
                  type: array
                  items:
                    type: object
                    properties:
                      collection:
                        description: |
                          The name of a collection.
                        type: string
                      index:
                        description: |
                          The name of an inverted index of the `collection`, or the index ID without
                          the `<collection>/` prefix.
                        type: string
                    required:
                      - collection
                      - index
              required:
                - name
                - type
      responses:
        '400':
          description: |
            If the `name` or `type` attribute are missing or invalid, then an *HTTP 400*
            error is returned.
        '409':
          description: |
            If a View called `name` already exists, then an *HTTP 409* error is returned.
      tags:
        - Views
```

**Examples**



```curl
---
description: ''
version: '3.10'
render: input/output
name: RestViewPostViewSearchAlias
server_name: stable
type: single
---

    var coll = db._create("books");
    var idx = coll.ensureIndex({ type: "inverted", name: "inv-idx", fields: [ { name: "title", analyzer: "text_en" } ] });

    var url = "/_api/view";
    var body = {
      name: "products",
      type: "search-alias",
      indexes: [
        { collection: "books", index: "inv-idx" }
      ]
    };
    var response = logCurlRequest('POST', url, body);
    assert(response.code === 201);
    logJsonResponse(response);

    db._dropView("products");
    db._drop(coll.name());
```
```openapi
## Get information about a View

paths:
  /_api/view/{view-name}:
    get:
      operationId: getView
      description: |
        The result is an object briefly describing the View with the following attributes:
        - `id`: The identifier of the View
        - `name`: The name of the View
        - `type`: The type of the View as string
      parameters:
        - name: view-name
          in: path
          required: true
          description: |
            The name of the View.
          schema:
            type: string
      responses:
        '404':
          description: |
            If the `view-name` is unknown, then a *HTTP 404* is returned.
      tags:
        - Views
```

**Examples**



```curl
---
description: |-
  Using an identifier:
version: '3.10'
render: input/output
name: RestViewGetViewIdentifierArangoSearch
server_name: stable
type: single
---

    var view = db._createView("productsView", "arangosearch");

    var url = "/_api/view/"+ view._id;
    var response = logCurlRequest('GET', url);
    assert(response.code === 200);
    logJsonResponse(response);

    db._dropView("productsView");
```


```curl
---
description: |-
  Using a name:
version: '3.10'
render: input/output
name: RestViewGetViewNameArangoSearch
server_name: stable
type: single
---

    var view = db._createView("productsView", "arangosearch");

    var url = "/_api/view/productsView";
    var response = logCurlRequest('GET', url);
    assert(response.code === 200);
    logJsonResponse(response);

    db._dropView("productsView");
```
```openapi
## Read properties of a View

paths:
  /_api/view/{view-name}/properties#searchalias:
    get:
      operationId: getViewPropertiesSearchAlias
      description: |
        Returns an object containing the definition of the View identified by *view-name*.

        The result is an object with a full description of a specific View, including
        View type dependent properties.
      parameters:
        - name: view-name
          in: path
          required: true
          description: |
            The name of the View.
          schema:
            type: string
      responses:
        '400':
          description: |
            If the *view-name* is missing, then a *HTTP 400* is returned.
        '404':
          description: |
            If the *view-name* is unknown, then a *HTTP 404* is returned.
      tags:
        - Views
```

**Examples**



```curl
---
description: |-
  Using an identifier:
version: '3.10'
render: input/output
name: RestViewGetViewPropertiesIdentifierSearchAlias
server_name: stable
type: single
---

    var coll = db._create("books");
    var idx = coll.ensureIndex({ type: "inverted", name: "inv-idx", fields: [ { name: "title", analyzer: "text_en" } ] });
    var view = db._createView("productsView", "search-alias", { indexes: [ { collection: "books", index: "inv-idx" } ] });

    var url = "/_api/view/"+ view._id + "/properties";
    var response = logCurlRequest('GET', url);
    assert(response.code === 200);
    logJsonResponse(response);

    db._dropView("productsView");
    db._drop("books");
```


```curl
---
description: |-
  Using a name:
version: '3.10'
render: input/output
name: RestViewGetViewPropertiesNameSearchAlias
server_name: stable
type: single
---

    var coll = db._create("books");
    var idx = coll.ensureIndex({ type: "inverted", name: "inv-idx", fields: [ { name: "title", analyzer: "text_en" } ] });
    var view = db._createView("productsView", "search-alias", { indexes: [ { collection: "books", index: "inv-idx" } ] });

    var url = "/_api/view/productsView/properties";
    var response = logCurlRequest('GET', url);
    assert(response.code === 200);
    logJsonResponse(response);

    db._dropView("productsView");
    db._drop("books");
```
```openapi
## List all Views

paths:
  /_api/view:
    get:
      operationId: listViews
      description: |
        Returns an object containing a listing of all Views in a database, regardless
        of their type. It is an array of objects with the following attributes:
        - `id`
        - `name`
        - `type`
      responses:
        '200':
          description: |
            The list of Views
      tags:
        - Views
```

**Examples**



```curl
---
description: |-
  Return information about all Views:
version: '3.10'
render: input/output
name: RestViewGetAllViews
server_name: stable
type: single
---

    var viewSearchAlias = db._createView("productsView", "search-alias");
    var viewArangoSearch = db._createView("reviewsView", "arangosearch");

    var url = "/_api/view";
    var response = logCurlRequest('GET', url);
    assert(response.code === 200);
    logJsonResponse(response);

    db._dropView("productsView");
    db._dropView("reviewsView");
```
```openapi
## Replace the properties of a search-alias View

paths:
  /_api/view/{view-name}/properties#searchalias:
    put:
      operationId: replaceViewPropertiesSearchAlias
      description: |
        Replaces the list of indexes of a `search-alias` View.
      parameters:
        - name: view-name
          in: path
          required: true
          description: |
            The name of the View.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                indexes:
                  description: |
                    A list of inverted indexes for the View.
                  type: array
                  items:
                    type: object
                    properties:
                      collection:
                        description: |
                          The name of a collection.
                        type: string
                      index:
                        description: |
                          The name of an inverted index of the `collection`, or the index ID without
                          the `<collection>/` prefix.
                        type: string
                    required:
                      - collection
                      - index
      responses:
        '200':
          description: |
            On success, an object with the following attributes is returned
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    description: |
                      The identifier of the View.
                    type: string
                  name:
                    description: |
                      The name of the View.
                    type: string
                  type:
                    description: |
                      The View type (`"search-alias"`).
                    type: string
                  indexes:
                    description: |
                      The list of inverted indexes that are part of the View.
                    type: array
                    items:
                      type: object
                      properties:
                        collection:
                          description: |
                            The name of a collection.
                          type: string
                        index:
                          description: |
                            The name of an inverted index of the `collection`.
                          type: string
                      required:
                        - collection
                        - index
                required:
                  - id
                  - name
                  - type
                  - indexes
        '400':
          description: |
            If the `view-name` is missing, then a *HTTP 400* is returned.
        '404':
          description: |
            If the `view-name` is unknown, then a *HTTP 404* is returned.
      tags:
        - Views
```

**Examples**



```curl
---
description: ''
version: '3.10'
render: input/output
name: RestViewPutPropertiesSearchAlias
server_name: stable
type: single
---

    var coll = db._create("books");
    coll.ensureIndex({ type: "inverted", name: "inv_title", fields: ["title"] });
    coll.ensureIndex({ type: "inverted", name: "inv_descr", fields: ["description"] });

    var view = db._createView("productsView", "search-alias", {
      indexes: [ { collection: coll.name(), index: "inv_title" } ] });

    var url = "/_api/view/"+ view.name() + "/properties";
    var response = logCurlRequest('PUT', url, {
      "indexes": [ { collection: coll.name(), index: "inv_descr" } ] });
    assert(response.code === 200);
    logJsonResponse(response);

    db._dropView(view.name());
    db._drop(coll.name());
```
```openapi
## Update the properties of a search-alias View

paths:
  /_api/view/{view-name}/properties#searchalias:
    patch:
      operationId: updateViewPropertiesSearchAlias
      description: |
        Updates the list of indexes of a `search-alias` View.
      parameters:
        - name: view-name
          in: path
          required: true
          description: |
            The name of the View.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                indexes:
                  description: |
                    A list of inverted indexes to add to or remove from the View.
                  type: array
                  items:
                    type: object
                    properties:
                      collection:
                        description: |
                          The name of a collection.
                        type: string
                      index:
                        description: |
                          The name of an inverted index of the `collection`, or the index ID without
                          the `<collection>/` prefix.
                        type: string
                      operation:
                        description: |
                          Whether to add or remove the index to the stored `indexes` property of the View.
                          Possible values: `"add"`, `"del"`. The default is `"add"`.
                        type: string
                    required:
                      - collection
                      - index
      responses:
        '200':
          description: |
            On success, an object with the following attributes is returned
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    description: |
                      The identifier of the View.
                    type: string
                  name:
                    description: |
                      The name of the View.
                    type: string
                  type:
                    description: |
                      The View type (`"search-alias"`).
                    type: string
                  indexes:
                    description: |
                      The list of inverted indexes that are part of the View.
                    type: array
                    items:
                      type: object
                      properties:
                        collection:
                          description: |
                            The name of a collection.
                          type: string
                        index:
                          description: |
                            The name of an inverted index of the `collection`.
                          type: string
                      required:
                        - collection
                        - index
                required:
                  - id
                  - name
                  - type
                  - indexes
        '400':
          description: |
            If the `view-name` is missing, then a *HTTP 400* is returned.
        '404':
          description: |
            If the `view-name` is unknown, then a *HTTP 404* is returned.
      tags:
        - Views
```

**Examples**



```curl
---
description: ''
version: '3.10'
render: input/output
name: RestViewPatchPropertiesSearchAlias
server_name: stable
type: single
---

    var coll = db._create("books");
    coll.ensureIndex({ type: "inverted", name: "inv_title", fields: ["title"] });
    coll.ensureIndex({ type: "inverted", name: "inv_descr", fields: ["description"] });

    var view = db._createView("productsView", "search-alias", {
      indexes: [ { collection: coll.name(), index: "inv_title" } ] });

    var url = "/_api/view/"+ view.name() + "/properties";
    var response = logCurlRequest('PATCH', url, {
      "indexes": [ { collection: coll.name(), index: "inv_descr" } ] });
    assert(response.code === 200);
    logJsonResponse(response);

    db._dropView(view.name());
    db._drop(coll.name());
```
```openapi
## Rename a View

paths:
  /_api/view/{view-name}/rename:
    put:
      operationId: renameView
      description: |
        Renames a View. Expects an object with the attribute(s)
        - `name`: The new name

        It returns an object with the attributes
        - `id`: The identifier of the View.
        - `name`: The new name of the View.
        - `type`: The View type.

        **Note**: This method is not available in a cluster.
      parameters:
        - name: view-name
          in: path
          required: true
          description: |
            The name of the View to rename.
          schema:
            type: string
      responses:
        '400':
          description: |
            If the `view-name` is missing, then a *HTTP 400* is returned.
        '404':
          description: |
            If the `view-name` is unknown, then a *HTTP 404* is returned.
      tags:
        - Views
```

**Examples**



```curl
---
description: ''
version: '3.10'
render: input/output
name: RestViewPutRename
server_name: stable
type: single
---

    var view = db._createView("productsView", "arangosearch");

    var url = "/_api/view/" + view.name() + "/rename";
    var response = logCurlRequest('PUT', url, { name: "catalogView" });
    assert(response.code === 200);
    logJsonResponse(response);

    db._dropView("catalogView");
```
```openapi
## Drop a View

paths:
  /_api/view/{view-name}:
    delete:
      operationId: deleteView
      description: |
        Drops the View identified by `view-name`.

        If the View was successfully dropped, an object is returned with
        the following attributes:
        - `error`: `false`
        - `id`: The identifier of the dropped View
      parameters:
        - name: view-name
          in: path
          required: true
          description: |
            The name of the View to drop.
          schema:
            type: string
      responses:
        '400':
          description: |
            If the `view-name` is missing, then a *HTTP 400* is returned.
        '404':
          description: |
            If the `view-name` is unknown, then a *HTTP 404* is returned.
      tags:
        - Views
```

**Examples**



```curl
---
description: |-
  Using an identifier:
version: '3.10'
render: input/output
name: RestViewDeleteViewIdentifierArangoSearch
server_name: stable
type: single
---

    var view = db._createView("productsView", "arangosearch");

    var url = "/_api/view/"+ view._id;
    var response = logCurlRequest('DELETE', url);
    assert(response.code === 200);
    logJsonResponse(response);
```


```curl
---
description: |-
  Using a name:
version: '3.10'
render: input/output
name: RestViewDeleteViewNameArangoSearch
server_name: stable
type: single
---

    var view = db._createView("productsView", "arangosearch");

    var url = "/_api/view/productsView";
    var response = logCurlRequest('DELETE', url);
    assert(response.code === 200);
    logJsonResponse(response);
```
