---
title: The "db" Object
weight: 5
description: >-
  The "db" Object
archetype: default
---
The `db` object is available in [arangosh](../../core-topics/programs-and-tools/arangodb-shell/_index.md) by
default, and can also be imported and used in Foxx services.

*db.name* returns a [collection object](collection.md) for the collection *name*.

The following methods exist on the *_db* object:

*Database*

* [db._createDatabase(name, options, users)](../../getting-started/getting-started/data-model-and-concepts/databases/database-methods.md#create-database)
* [db._databases()](../../getting-started/getting-started/data-model-and-concepts/databases/database-methods.md#list-databases)
* [db._dropDatabase(name, options, users)](../../getting-started/getting-started/data-model-and-concepts/databases/database-methods.md#drop-database)
* [db._useDatabase(name)](../../getting-started/getting-started/data-model-and-concepts/databases/database-methods.md#use-database)

*Indexes*

* [db._index(index)](../../core-topics/indexing/working-with-indexes/_index.md#fetching-an-index-by-identifier)
* [db._dropIndex(index)](../../core-topics/indexing/working-with-indexes/_index.md#dropping-an-index-via-a-database-object)

*Properties*

* [db._id()](../../getting-started/getting-started/data-model-and-concepts/databases/database-methods.md#id)
* [db._isSystem()](../../getting-started/getting-started/data-model-and-concepts/databases/database-methods.md#issystem)
* [db._name()](../../getting-started/getting-started/data-model-and-concepts/databases/database-methods.md#name)
* [db._path()](../../getting-started/getting-started/data-model-and-concepts/databases/database-methods.md#path)
* [db._properties()](../../getting-started/getting-started/data-model-and-concepts/databases/database-methods.md#properties)

*Collection*

* [db._collection(name)](../../getting-started/getting-started/data-model-and-concepts/collections/database-methods.md#collection)
* [db._collections()](../../getting-started/getting-started/data-model-and-concepts/collections/database-methods.md#all-collections)
* [db._create(name)](../../getting-started/getting-started/data-model-and-concepts/collections/database-methods.md#create)
* [db._drop(name)](../../getting-started/getting-started/data-model-and-concepts/collections/database-methods.md#drop)
* [db._truncate(name)](../../getting-started/getting-started/data-model-and-concepts/collections/database-methods.md#truncate)

*AQL*

* [db._createStatement(query)](../../aql/how-to-invoke-aql/with-arangosh.md#with-db_createstatement-arangostatement)
* [db._query(query)](../../aql/how-to-invoke-aql/with-arangosh.md#with-db_query)
* [db._explain(query)](../../aql/execution-and-performance/explaining-queries.md)
* [db._parse(query)](../../aql/how-to-invoke-aql/with-arangosh.md#query-validation-with-db_parse)

*Document*

* [db._document(object)](../../getting-started/getting-started/data-model-and-concepts/documents/database-methods.md#document)
* [db._exists(object)](../../getting-started/getting-started/data-model-and-concepts/documents/database-methods.md#exists)
* [db._remove(selector)](../../getting-started/getting-started/data-model-and-concepts/documents/database-methods.md#remove)
* [db._replace(selector,data)](../../getting-started/getting-started/data-model-and-concepts/documents/database-methods.md#replace)
* [db._update(selector,data)](../../getting-started/getting-started/data-model-and-concepts/documents/database-methods.md#update)

*Views*

* [db._view(name)](../../getting-started/getting-started/data-model-and-concepts/views/database-methods.md#view)
* [db._views()](../../getting-started/getting-started/data-model-and-concepts/views/database-methods.md#all-views)
* [db._createView(name, type, properties)](../../getting-started/getting-started/data-model-and-concepts/views/database-methods.md#create)
* [db._dropView(name)](../../getting-started/getting-started/data-model-and-concepts/views/database-methods.md#drop)

*Global*

* [db._compact()](../../getting-started/getting-started/data-model-and-concepts/databases/database-methods.md#compact)
* [db._engine()](../../getting-started/getting-started/data-model-and-concepts/databases/database-methods.md#engine)
* [db._engineStats()](../../getting-started/getting-started/data-model-and-concepts/databases/database-methods.md#engine-statistics)
* [db._createTransaction()](../../core-topics/transactions/stream-transactions.md#create-transaction)
* [db._executeTransaction()](../../core-topics/transactions/javascript-transactions.md#execute-transaction)
* [db._version()](../../getting-started/getting-started/data-model-and-concepts/databases/database-methods.md#get-the-version-of-arangodb)

*License*

* [db._getLicense()](../../operations/administration/license-management.md#managing-your-license)]
* [db._setLicense(data)](../../operations/administration/license-management.md#initial-installation)]
