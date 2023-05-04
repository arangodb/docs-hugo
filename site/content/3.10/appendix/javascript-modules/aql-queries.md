---
title: Queries Module
weight: 20
description: >-
  Queries Module
archetype: default
---
`const queries = require('@arangodb/aql/queries')`

The query module provides the infrastructure for working with currently running AQL queries via arangosh.

## Properties

`queries.properties()` Returns the servers current query tracking configuration; we change the slow query threshold to get better results:

```js
---
name: QUERY_01_propertyOfQueries
description: ''
render: input/output
version: '3.10'
release: stable_single
---
var queries = require("@arangodb/aql/queries");
queries.properties();
queries.properties({slowQueryThreshold: 1});
queries.properties({slowStreamingQueryThreshold: 1});
```

## Currently running queries

We [create a task](tasks.md) that spawns queries, so we have nice output. Since this task
uses resources, you may want to increase `period` (and not forget to remove it... afterwards):

    |~                           return query.query === theQuery;
```js
---
name: QUERY_02_listQueries
description: ''
render: input/output
version: '3.10'
release: stable_single
---
~var queries = require("@arangodb/aql/queries");
var theQuery = 'FOR sleepLoooong IN 1..5 LET sleepLoooonger = SLEEP(1000) RETURN sleepLoooong';
var tasks = require("@arangodb/tasks");
 tasks.register({
   id: "mytask-1",
   name: "this is a sample task to spawn a slow aql query",
   command: "require('@arangodb').db._query('" + theQuery + "');"
});
 ~ while (true) {
 ~   require("internal").wait(1);
 ~   if (queries.current().filter(function(query) {
 ~   return query.query === theQuery;
 ~ }).length > 0) {
 ~ break;
 ~   }
~}
queries.current();
```

## Slow queries

The function returns the last AQL queries that exceeded the slow query threshold as an array:

```js
---
name: QUERY_03_listSlowQueries
description: ''
render: input/output
version: '3.10'
release: stable_single
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
render: input/output
version: '3.10'
release: stable_single
---
~var queries = require("@arangodb/aql/queries");
queries.clearSlow();
queries.slow();
```

## Kill

Kill a running AQL query:

    |   return query.query === theQuery;
```js
---
name: QUERY_05_killQueries
description: ''
render: input/output
version: '3.10'
release: stable_single
---
~var queries = require("@arangodb/aql/queries");
~var tasks = require("@arangodb/tasks");
~var theQuery = 'FOR sleepLoooong IN 1..5 LET sleepLoooonger = SLEEP(1000) RETURN sleepLoooong';
 var runningQueries = queries.current().filter(function(query) {
    return query.query === theQuery;
});
queries.kill(runningQueries[0].id);
```
