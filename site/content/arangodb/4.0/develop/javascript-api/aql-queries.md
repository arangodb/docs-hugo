---
title: The `@arangodb/aql/queries` module of the JavaScript API
menuTitle: '@arangodb/aql/queries'
weight: 20
description: >-
  The query module provides the infrastructure for working with currently
  running AQL queries via arangosh
---
`const queries = require('@arangodb/aql/queries')`

## Properties

`queries.properties()` Returns the servers current query tracking configuration; we change the slow query threshold to get better results:

```js
---
name: QUERY_01_propertyOfQueries
description: ''
---
var queries = require("@arangodb/aql/queries");
queries.properties();
queries.properties({slowQueryThreshold: 1});
queries.properties({slowStreamingQueryThreshold: 1});
```

## Currently running queries

```js
---
name: QUERY_02_listQueries
description: |
  The example code starts a query in a non-blocking fashion before calling
  `queries.current()` so that it returns something.
---
~var queries = require("@arangodb/aql/queries");
var theQuery = "FOR sleepLong IN 1..5 LET sleepLonger = SLEEP(1) RETURN sleepLong";
arango.POST("/_api/cursor", {query: theQuery}, {"X-Arango-Async":true});
~while (true) {
~  if (queries.current().filter(q => q.query === theQuery).length > 0) {
~    break;
~  }
~  internal.sleep(0.25);
~}
queries.current();
```

## Slow queries

The function returns the last AQL queries that exceeded the slow query threshold as an array:

```js
---
name: QUERY_03_listSlowQueries
description: ''
---
~var queries = require("@arangodb/aql/queries");
queries.slow();
```

## Clear slow queries

Clear the list of slow AQL queries:

```js
---
name: QUERY_04_clearSlowQueries
description: ''
---
~var queries = require("@arangodb/aql/queries");
queries.clearSlow();
queries.slow();
```

## Kill

Kill a running AQL query:

```js
---
name: QUERY_05_killQueries
description: ''
---
~var queries = require("@arangodb/aql/queries");
~var theQuery = "FOR sleepLong IN 1..4 LET sleepLonger = SLEEP(1) RETURN sleepLong";
~arango.POST("/_api/cursor", {query: theQuery}, {"X-Arango-Async":true});
~while (true) {
~  if (queries.current().filter(q => q.query === theQuery).length > 0) {
~    break;
~  }
~  internal.sleep(0.25);
~}
var runningQueries = queries.current().filter(q => q.query === theQuery);
queries.kill(runningQueries[0].id);
```
