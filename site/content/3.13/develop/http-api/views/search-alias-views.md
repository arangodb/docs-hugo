---
title: HTTP interface for search-alias Views
menuTitle: '`search-alias` Views'
weight: 5
description: >-
  The HTTP API for Views lets you manage `search-alias` Views, including adding
  and removing inverted indexes
---
## Create a search-alias View

```openapi
paths:
  /_db/{database-name}/_api/view#searchalias:
    post:
      operationId: createViewSearchAlias
      description: |
        Creates a new View with a given name and properties if it does not
        already exist.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required:
                - name
                - type
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
                    required:
                      - collection
                      - index
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
      responses:
        '201':
          description: |
            The View has been created.
          content:
            application/json:
              schema:
                type: object
                required:
                  - name
                  - type
                  - id
                  - globallyUniqueId
                  - indexes
                properties:
                  name:
                    description: |
                      The name of the View.
                    type: string
                  type:
                    description: |
                      The type of the View (`"search-alias"`).
                    type: string
                  id:
                    description: |
                      A unique identifier of the View (deprecated).
                    type: string
                  globallyUniqueId:
                    description: |
                      A unique identifier of the View. This is an internal property.
                    type: string
                  indexes:
                    description: |
                      The list of the View's inverted indexes.
                    type: array
                    items:
                      type: object
                      required:
                        - collection
                        - index
                      properties:
                        collection:
                          description: |
                            The name of a collection.
                          type: string
                        index:
                          description: |
                            The name of an inverted index of the `collection`.
                          type: string
        '400':
          description: |
            The `name` or `type` attribute or one of the `collection` or `index`
            attributes is missing or invalid.
            error is returned.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '409':
          description: |
            A View called `name` already exists.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 409
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Views
```

**Examples**

```curl
---
description: ''
name: RestViewPostViewSearchAlias
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

## Get information about a View

```openapi
paths:
  /_db/{database-name}/_api/view/{view-name}:
    get:
      operationId: getView
      description: |
        Returns the basic information about a specific View.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: view-name
          in: path
          required: true
          description: |
            The name of the View.
          schema:
            type: string
      responses:
        '200':
          description: |
            The basic information about the View.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - name
                  - type
                  - id
                  - globallyUniqueId
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  name:
                    description: |
                      The name of the View.
                    type: string
                    example: coll
                  type:
                    description: |
                      The type of the View (`"search-alias"`).
                    type: integer
                    example: search-alias
                  id:
                    description: |
                      A unique identifier of the View (deprecated).
                    type: string
                  globallyUniqueId:
                    description: |
                      A unique identifier of the View. This is an internal property.
                    type: string
        '404':
          description: |
            A View called `view-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string

      tags:
        - Views
```

**Examples**

```curl
---
description: |-
  Using an identifier:
name: RestViewGetViewIdentifierArangoSearch
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
name: RestViewGetViewNameArangoSearch
---
var view = db._createView("productsView", "arangosearch");

var url = "/_api/view/productsView";
var response = logCurlRequest('GET', url);
assert(response.code === 200);
logJsonResponse(response);

db._dropView("productsView");
```

## Read properties of a View

```openapi
paths:
  /_db/{database-name}/_api/view/{view-name}/properties#searchalias:
    get:
      operationId: getViewPropertiesSearchAlias
      description: |
        Returns an object containing the definition of the View identified by `view-name`.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: view-name
          in: path
          required: true
          description: |
            The name of the View.
          schema:
            type: string
      responses:
        '200':
          description: |
            An object with a full description of the specified View, including
            `search-alias` View type-dependent properties.
          content:
            application/json:
              schema:
                type: object
                required:
                  - name
                  - type
                  - id
                  - globallyUniqueId
                  - indexes
                properties:
                  name:
                    description: |
                      The name of the View.
                    type: string
                  type:
                    description: |
                      The type of the View (`"search-alias"`).
                    type: string
                  id:
                    description: |
                      A unique identifier of the View (deprecated).
                    type: string
                  globallyUniqueId:
                    description: |
                      A unique identifier of the View. This is an internal property.
                    type: string
                  indexes:
                    description: |
                      The list of the View's inverted indexes.
                    type: array
                    items:
                      type: object
                      required:
                        - collection
                        - index
                      properties:
                        collection:
                          description: |
                            The name of a collection.
                          type: string
                        index:
                          description: |
                            The name of an inverted index of the `collection`.
                          type: string
        '400':
          description: |
            The `view-name` parameter is missing or invalid.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A View called `view-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Views
```

**Examples**

```curl
---
description: |-
  Using an identifier:
name: RestViewGetViewPropertiesIdentifierSearchAlias
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
name: RestViewGetViewPropertiesNameSearchAlias
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

## List all Views

```openapi
paths:
  /_db/{database-name}/_api/view:
    get:
      operationId: listViews
      description: |
        Returns an object containing a listing of all Views in the current database,
        regardless of their type.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
      responses:
        '200':
          description: |
            The list of Views.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - result
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  result:
                    description: |
                      The result object.
                    type: array
                    items:
                      type: object
                      required:
                        - name
                        - type
                        - id
                        - globallyUniqueId
                      properties:
                        name:
                          description: |
                            The name of the View.
                          type: string
                          example: coll
                        type:
                          description: |
                            The type of the View.
                          type: string
                          enum:
                            - arangosearch
                            - search-alias
                        id:
                          description: |
                            A unique identifier of the View (deprecated).
                          type: string
                        globallyUniqueId:
                          description: |
                            A unique identifier of the View. This is an internal property.
                          type: string
      tags:
        - Views
```

**Examples**

```curl
---
description: |-
  Return information about all Views:
name: RestViewGetAllViews
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

## Replace the properties of a search-alias View

```openapi
paths:
  /_db/{database-name}/_api/view/{view-name}/properties#searchalias:
    put:
      operationId: replaceViewPropertiesSearchAlias
      description: |
        Replaces the list of indexes of a `search-alias` View.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
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
                    required:
                      - collection
                      - index
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
      responses:
        '200':
          description: |
            The View has been updated successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - name
                  - type
                  - id
                  - globallyUniqueId
                  - indexes
                properties:
                  name:
                    description: |
                      The name of the View.
                    type: string
                  type:
                    description: |
                      The View type (`"search-alias"`).
                    type: string
                  id:
                    description: |
                      The identifier of the View.
                    type: string
                  globallyUniqueId:
                    description: |
                      A unique identifier of the View. This is an internal property.
                    type: string
                  indexes:
                    description: |
                      The list of inverted indexes that are part of the View.
                    type: array
                    items:
                      type: object
                      required:
                        - collection
                        - index
                      properties:
                        collection:
                          description: |
                            The name of a collection.
                          type: string
                        index:
                          description: |
                            The name of an inverted index of the `collection`.
                          type: string
        '400':
          description: |
            The `view-name` parameter is missing or invalid.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A View called `view-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Views
```

**Examples**

```curl
---
description: ''
name: RestViewPutPropertiesSearchAlias
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

## Update the properties of a search-alias View

```openapi
paths:
  /_db/{database-name}/_api/view/{view-name}/properties#searchalias:
    patch:
      operationId: updateViewPropertiesSearchAlias
      description: |
        Updates the list of indexes of a `search-alias` View.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
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
                    required:
                      - collection
                      - index
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
                        type: string
                        enum:
                          - add
                          - del
                        default: add
      responses:
        '200':
          description: |
            The View has been updated successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - name
                  - type
                  - id
                  - globallyUniqueId
                  - indexes
                properties:
                  name:
                    description: |
                      The name of the View.
                    type: string
                  type:
                    description: |
                      The View type (`"search-alias"`).
                    type: string
                  id:
                    description: |
                      The identifier of the View.
                    type: string
                  globallyUniqueId:
                    description: |
                      A unique identifier of the View. This is an internal property.
                    type: string
                  indexes:
                    description: |
                      The list of inverted indexes that are part of the View.
                    type: array
                    items:
                      type: object
                      required:
                        - collection
                        - index
                      properties:
                        collection:
                          description: |
                            The name of a collection.
                          type: string
                        index:
                          description: |
                            The name of an inverted index of the `collection`.
                          type: string
        '400':
          description: |
            The `view-name` parameter is missing or invalid.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A View called `view-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string.
      tags:
        - Views
```

**Examples**

```curl
---
description: ''
name: RestViewPatchPropertiesSearchAlias
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

## Rename a View

```openapi
paths:
  /_db/{database-name}/_api/view/{view-name}/rename:
    put:
    # The PATCH method can be used as an alias
      operationId: renameView
      description: |
        Renames a View.

        {{</* info */>}}
        Renaming Views is not supported in cluster deployments.
        {{</* /info */>}}
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: view-name
          in: path
          required: true
          description: |
            The name of the View to rename.
          schema:
            type: string
      responses:
        '200':
          description: |
            The View has been renamed successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - name
                  - type
                  - id
                  - globallyUniqueId
                  - indexes
                properties:
                  name:
                    description: |
                      The name of the View.
                    type: string
                  type:
                    description: |
                      The View type (`"search-alias"`).
                    type: string
                  id:
                    description: |
                      The identifier of the View.
                    type: string
                  globallyUniqueId:
                    description: |
                      A unique identifier of the View. This is an internal property.
                    type: string
                  indexes:
                    description: |
                      The list of inverted indexes that are part of the View.
                    type: array
                    items:
                      type: object
                      required:
                        - collection
                        - index
                      properties:
                        collection:
                          description: |
                            The name of a collection.
                          type: string
                        index:
                          description: |
                            The name of an inverted index of the `collection`.
                          type: string
        '400':
          description: |
            The `view-name` parameter is missing or invalid.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A View called `view-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string.
      tags:
        - Views
```

**Examples**

```curl
---
description: ''
name: RestViewPutRename
---
var view = db._createView("productsView", "arangosearch");

var url = "/_api/view/" + view.name() + "/rename";
var response = logCurlRequest('PUT', url, { name: "catalogView" });
assert(response.code === 200);
logJsonResponse(response);

db._dropView("catalogView");
```

## Drop a View

```openapi
paths:
  /_db/{database-name}/_api/view/{view-name}:
    delete:
      operationId: deleteView
      description: |
        Deletes the View identified by `view-name`.
      parameters:
        - name: database-name
          in: path
          required: true
          example: _system
          description: |
            The name of the database.
          schema:
            type: string
        - name: view-name
          in: path
          required: true
          description: |
            The name of the View to drop.
          schema:
            type: string
      responses:
        '200':
          description: |
            The View has been dropped successfully.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - result
                properties:
                  error:
                    description: |
                      A flag indicating that no error occurred.
                    type: boolean
                    example: false
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 200
                  result:
                    description: |
                      The value `true`.
                    type: boolean
                    example: true
        '400':
          description: |
            The `view-name` path parameter is missing or invalid.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 400
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
        '404':
          description: |
            A View called `view-name` could not be found.
          content:
            application/json:
              schema:
                type: object
                required:
                  - error
                  - code
                  - errorNum
                  - errorMessage
                properties:
                  error:
                    description: |
                      A flag indicating that an error occurred.
                    type: boolean
                    example: true
                  code:
                    description: |
                      The HTTP response status code.
                    type: integer
                    example: 404
                  errorNum:
                    description: |
                      ArangoDB error number for the error that occurred.
                    type: integer
                  errorMessage:
                    description: |
                      A descriptive error message.
                    type: string
      tags:
        - Views
```

**Examples**

```curl
---
description: |-
  Using an identifier:
name: RestViewDeleteViewIdentifierArangoSearch
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
name: RestViewDeleteViewNameArangoSearch
---
var view = db._createView("productsView", "arangosearch");

var url = "/_api/view/productsView";
var response = logCurlRequest('DELETE', url);
assert(response.code === 200);
logJsonResponse(response);
```
