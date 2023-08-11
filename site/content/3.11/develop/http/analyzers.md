---
title: HTTP interface for Analyzers
menuTitle: Analyzers
weight: 65
description: >-
  The HTTP API for Analyzers lets you create and delete Analyzers, as well as
  list all or get specific Analyzers with all their settings
archetype: default
---
{{< description >}}

The RESTful API for managing ArangoSearch Analyzers is accessible via the
`/_api/analyzer` endpoint.

See the description of [Analyzers](../../index-and-search/analyzers.md) for an
introduction and the available types, properties and features.

```openapi
## Create an Analyzer

paths:
  /_api/analyzer:
    post:
      operationId: createAnalyzer
      description: |
        Creates a new Analyzer based on the provided configuration.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  description: |
                    The Analyzer name.
                  type: string
                type:
                  description: |
                    The Analyzer type.
                  type: string
                properties:
                  description: |
                    The properties used to configure the specified Analyzer type.
                  type: object
                features:
                  description: |
                    The set of features to set on the Analyzer generated fields.
                    The default value is an empty array.
                  type: array
                  items:
                    type: string
              required:
                - name
                - type
      responses:
        '200':
          description: |
            An Analyzer with a matching name and definition already exists.
        '201':
          description: |
            A new Analyzer definition was successfully created.
        '400':
          description: |
            One or more of the required parameters is missing or one or more of the parameters
            is not valid.
        '403':
          description: |
            The user does not have permission to create and Analyzer with this configuration.
      tags:
        - Analyzers
```

**Examples**



```curl
---
description: ''
render: input/output
name: RestAnalyzerPost
---

  var analyzers = require("@arangodb/analyzers");
  var db = require("@arangodb").db;
  var analyzerName = "testAnalyzer";

  // creation
  var url = "/_api/analyzer";
  var body = {
    name: "testAnalyzer",
    type: "identity"
  };
  var response = logCurlRequest('POST', url, body);
  assert(response.code === 201);

  logJsonResponse(response);

  analyzers.remove(analyzerName, true);
```
```openapi
## Get an Analyzer definition

paths:
  /_api/analyzer/{analyzer-name}:
    get:
      operationId: getAnalyzer
      description: |
        Retrieves the full definition for the specified Analyzer name.
        The resulting object contains the following attributes:
        - `name`: the Analyzer name
        - `type`: the Analyzer type
        - `properties`: the properties used to configure the specified type
        - `features`: the set of features to set on the Analyzer generated fields
      parameters:
        - name: analyzer-name
          in: path
          required: true
          description: |
            The name of the Analyzer to retrieve.
          schema:
            type: string
      responses:
        '200':
          description: |
            The Analyzer definition was retrieved successfully.
        '404':
          description: |
            Such an Analyzer configuration does not exist.
      tags:
        - Analyzers
```

**Examples**



```curl
---
description: |-
  Retrieve an Analyzer definition:
render: input/output
name: RestAnalyzerGet
---

  var analyzers = require("@arangodb/analyzers");
  var db = require("@arangodb").db;
  var analyzerName = "testAnalyzer";
  analyzers.save(analyzerName, "identity");

  // retrieval
  var url = "/_api/analyzer/" + encodeURIComponent(analyzerName);
  var response = logCurlRequest('GET', url);
  assert(response.code === 200);

  logJsonResponse(response);

  analyzers.remove(analyzerName, true);
```
```openapi
## List all Analyzers

paths:
  /_api/analyzer:
    get:
      operationId: listAnalyzers
      description: |
        Retrieves a an array of all Analyzer definitions.
        The resulting array contains objects with the following attributes:
        - `name`: the Analyzer name
        - `type`: the Analyzer type
        - `properties`: the properties used to configure the specified type
        - `features`: the set of features to set on the Analyzer generated fields
      responses:
        '200':
          description: |
            The Analyzer definitions was retrieved successfully.
      tags:
        - Analyzers
```

**Examples**



```curl
---
description: |-
  Retrieve all Analyzer definitions:
render: input/output
name: RestAnalyzersGet
---

  // retrieval
  var url = "/_api/analyzer";
  var response = logCurlRequest('GET', url);
  assert(response.code === 200);

  logJsonResponse(response);
```
```openapi
## Remove an Analyzer

paths:
  /_api/analyzer/{analyzer-name}:
    delete:
      operationId: deleteAnalyzer
      description: |
        Removes an Analyzer configuration identified by `analyzer-name`.

        If the Analyzer definition was successfully dropped, an object is returned with
        the following attributes:
        - `error`: `false`
        - `name`: The name of the removed Analyzer
      parameters:
        - name: analyzer-name
          in: path
          required: true
          description: |
            The name of the Analyzer to remove.
          schema:
            type: string
        - name: force
          in: query
          required: false
          description: |
            The Analyzer configuration should be removed even if it is in-use.
            The default value is `false`.
          schema:
            type: boolean
      responses:
        '200':
          description: |
            The Analyzer configuration was removed successfully.
        '400':
          description: |
            The `analyzer-name` was not supplied or another request parameter was not
            valid.
        '403':
          description: |
            The user does not have permission to remove this Analyzer configuration.
        '404':
          description: |
            Such an Analyzer configuration does not exist.
        '409':
          description: |
            The specified Analyzer configuration is still in use and `force` was omitted or
            `false` specified.
      tags:
        - Analyzers
```

**Examples**



```curl
---
description: |-
  Removing without `force`:
render: input/output
name: RestAnalyzerDelete
---

  var analyzers = require("@arangodb/analyzers");
  var db = require("@arangodb").db;
  var analyzerName = "testAnalyzer";
  analyzers.save(analyzerName, "identity");

  // removal
  var url = "/_api/analyzer/" + encodeURIComponent(analyzerName);
  var response = logCurlRequest('DELETE', url);
console.error(JSON.stringify(response));
  assert(response.code === 200);

  logJsonResponse(response);
```


```curl
---
description: |-
  Removing with `force`:
render: input/output
name: RestAnalyzerDeleteForce
---

  var analyzers = require("@arangodb/analyzers");
  var db = require("@arangodb").db;
  var analyzerName = "testAnalyzer";
  analyzers.save(analyzerName, "identity");

  // create Analyzer reference
  var url = "/_api/collection";
  var body = { name: "testCollection" };
  var response = logCurlRequest('POST', url, body);
  assert(response.code === 200);
  var url = "/_api/view";
  var body = {
    name: "testView",
    type: "arangosearch",
    links: { testCollection: { analyzers: [ analyzerName ] } }
  };
  var response = logCurlRequest('POST', url, body);

  // removal (fail)
  var url = "/_api/analyzer/" + encodeURIComponent(analyzerName) + "?force=false";
  var response = logCurlRequest('DELETE', url);
  assert(response.code === 409);

  // removal
  var url = "/_api/analyzer/" + encodeURIComponent(analyzerName) + "?force=true";
  var response = logCurlRequest('DELETE', url);
  assert(response.code === 200);

  logJsonResponse(response);

  db._dropView("testView");
  db._drop("testCollection");
```
