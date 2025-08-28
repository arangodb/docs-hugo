---
title: ArangoDB Python driver
menuTitle: Python driver
weight: 30
description: >-
  Python-Arango is the official ArangoDB driver that provides Python
  applications with the complete range of features exposed by the server API
---
The Python-Arango driver is the recommended driver for using ArangoDB as the
database backend from Python. It is maintained by ArangoDB and the community.

- Repository: <https://github.com/arangodb/python-arango>
- Reference: <https://docs.python-arango.com/>
- [Tutorial](https://university.arangodb.com/courses/python-driver-tutorial/)
- [Releases](https://github.com/arangodb/python-arango/releases)

There is also an asyncio counterpart called `python-arango-async`.
It has a similar API and features type wrappers.

- Repository: <https://github.com/arangodb/python-arango-async>
- Reference: <https://python-arango-async.readthedocs.io/>
- [Tutorial](https://github.com/arangodb/python-arango-async/wiki/Tutorial)
- [Releases](https://github.com/arangodb/python-arango-async/releases)

## Installation

{{< tabs "python-driver" >}}

{{< tab "python-arango" >}}
The `python-arango` library can be used in any Python project that targets
Python version 3.8 or later.

To install the library using PIP, run the following command in a terminal:

```sh
pip install python-arango --upgrade
```

You can then import the library in your project as follows:

```python
from arango import ArangoClient
```
{{< /tab >}}

{{< tab "python-arango-async" >}}
The `python-arango-async` library can be used in any Python project that targets
Python version 3.10 or later.

To install the library using PIP, run the following command in a terminal:

```sh
pip install python-arango-async --upgrade
```

You can then import the library in your project as follows:

```python
from arangoasync import ArangoClient
```
{{< /tab >}}

{{< /tabs >}}



## Get started

The following example shows how to use the driver from connecting to ArangoDB,
over creating databases, collections, indexes, and documents, to retrieving
data using queries:

{{< tabs "python-driver" >}}

{{< tab "python-arango" >}}
```python
from arango import ArangoClient

# Initialize the client for ArangoDB.
client = ArangoClient(hosts="http://localhost:8529")

# Connect to "_system" database as root user.
sys_db = client.db("_system", username="root", password="passwd")

# Create a new database named "test".
sys_db.create_database("test")

# Connect to "test" database as root user.
db = client.db("test", username="root", password="passwd")

# Create a new collection named "students".
students = db.create_collection("students")

# Add a persistent index to the collection.
students.add_index({'type': 'persistent', 'fields': ['name'], 'unique': True})

# Insert new documents into the collection.
students.insert({"name": "jane", "age": 39})
students.insert({"name": "josh", "age": 18})
students.insert({"name": "judy", "age": 21})

# Execute an AQL query and iterate through the result cursor.
cursor = db.aql.execute("FOR doc IN students RETURN doc")
student_names = [document["name"] for document in cursor]
```
{{< /tab >}}

{{< tab "python-arango-async" >}}
```python
from arangoasync import ArangoClient
from arangoasync.auth import Auth

# Initialize the client for ArangoDB.
async with ArangoClient(hosts="http://localhost:8529") as client:
    auth = Auth(username="root", password="passwd")

    # Connect to "_system" database as root user.
    sys_db = await client.db("_system", auth=auth)

    # Create a new database named "test".
    await sys_db.create_database("test")

    # Connect to "test" database as root user.
    db = await client.db("test", auth=auth)

    # Create a new collection named "students".
    students = await db.create_collection("students")

    # Add a persistent index to the collection.
    await students.add_index(type="persistent", fields=["name"], options={"unique": True})

    # Insert new documents into the collection.
    await students.insert({"name": "jane", "age": 39})
    await students.insert({"name": "josh", "age": 18})
    await students.insert({"name": "judy", "age": 21})

    # Execute an AQL query and iterate through the result cursor.
    cursor = await db.aql.execute("FOR doc IN students RETURN doc")
    async with cursor:
        student_names = []
        async for doc in cursor:
            student_names.append(doc["name"])
```

You may also use the client without a context manager, but you must ensure to
close the client when done.

```python
from arangoasync import ArangoClient
from arangoasync.auth import Auth

client = ArangoClient(hosts="http://localhost:8529")
auth = Auth(username="root", password="passwd")
sys_db = await client.db("_system", auth=auth)

# Create a new database named "test".
await sys_db.create_database("test")

# Connect to "test" database as root user.
db = await client.db("test", auth=auth)

# List all collections in the "test" database.
collections = await db.collections()

# Close the client when done.
await client.close()
```
{{< /tab >}}

{{< /tabs >}}

The following example shows how to create a [named graph](../../graphs/_index.md),
populate it with vertices and edges, and query it with a graph traversal:

{{< tabs "python-driver" >}}

{{< tab "python-arango" >}}
```python
from arango import ArangoClient

# Initialize the client for ArangoDB.
client = ArangoClient(hosts="http://localhost:8529")

# Connect to "test" database as root user.
db = client.db("test", username="root", password="passwd")

# Create a new graph named "school".
graph = db.create_graph("school")

# Create a new EnterpriseGraph
eegraph = db.create_graph(
    name="school",
    smart=True)

# Create vertex collections for the graph.
students = graph.create_vertex_collection("students")
lectures = graph.create_vertex_collection("lectures")

# Create an edge definition (relation) for the graph.
edges = graph.create_edge_definition(
    edge_collection="register",
    from_vertex_collections=["students"],
    to_vertex_collections=["lectures"]
)

# Insert vertex documents into "students" (from) vertex collection.
students.insert({"_key": "01", "full_name": "Anna Smith"})
students.insert({"_key": "02", "full_name": "Jake Clark"})
students.insert({"_key": "03", "full_name": "Lisa Jones"})

# Insert vertex documents into "lectures" (to) vertex collection.
lectures.insert({"_key": "MAT101", "title": "Calculus"})
lectures.insert({"_key": "STA101", "title": "Statistics"})
lectures.insert({"_key": "CSC101", "title": "Algorithms"})

# Insert edge documents into "register" edge collection.
edges.insert({"_from": "students/01", "_to": "lectures/MAT101"})
edges.insert({"_from": "students/01", "_to": "lectures/STA101"})
edges.insert({"_from": "students/01", "_to": "lectures/CSC101"})
edges.insert({"_from": "students/02", "_to": "lectures/MAT101"})
edges.insert({"_from": "students/02", "_to": "lectures/STA101"})
edges.insert({"_from": "students/03", "_to": "lectures/CSC101"})

# Traverse the graph in outbound direction, breath-first.
query = """
    FOR v, e, p IN 1..3 OUTBOUND 'students/01' GRAPH 'school'
    OPTIONS { bfs: true, uniqueVertices: 'global' }
    RETURN {vertex: v, edge: e, path: p}
    """
cursor = db.aql.execute(query)
```
{{< /tab >}}

{{< tab "python-arango-async" >}}
```python
from arangoasync import ArangoClient
from arangoasync.auth import Auth

# Initialize the client for ArangoDB.
async with ArangoClient(hosts="http://localhost:8529") as client:
    auth = Auth(username="root", password="passwd")

    # Connect to "test" database as root user.
    db = await client.db("test", auth=auth)

    # Get the API wrapper for graph "school".
    if await db.has_graph("school"):
        graph = db.graph("school")
    else:
        graph = await db.create_graph("school")

    # Create vertex collections for the graph.
    students = await graph.create_vertex_collection("students")
    lectures = await graph.create_vertex_collection("lectures")

    # Create an edge definition (relation) for the graph.
    edges = await graph.create_edge_definition(
        edge_collection="register",
        from_vertex_collections=["students"],
        to_vertex_collections=["lectures"]
    )

    # Insert vertex documents into "students" (from) vertex collection.
    await students.insert({"_key": "01", "full_name": "Anna Smith"})
    await students.insert({"_key": "02", "full_name": "Jake Clark"})
    await students.insert({"_key": "03", "full_name": "Lisa Jones"})

    # Insert vertex documents into "lectures" (to) vertex collection.
    await lectures.insert({"_key": "MAT101", "title": "Calculus"})
    await lectures.insert({"_key": "STA101", "title": "Statistics"})
    await lectures.insert({"_key": "CSC101", "title": "Algorithms"})

    # Insert edge documents into "register" edge collection.
    await edges.insert({"_from": "students/01", "_to": "lectures/MAT101"})
    await edges.insert({"_from": "students/01", "_to": "lectures/STA101"})
    await edges.insert({"_from": "students/01", "_to": "lectures/CSC101"})
    await edges.insert({"_from": "students/02", "_to": "lectures/MAT101"})
    await edges.insert({"_from": "students/02", "_to": "lectures/STA101"})
    await edges.insert({"_from": "students/03", "_to": "lectures/CSC101"})

    # Traverse the graph in outbound direction, breath-first.
    query = """
        FOR v, e, p IN 1..3 OUTBOUND 'students/01' GRAPH 'school'
        OPTIONS { bfs: true, uniqueVertices: 'global' }
        RETURN {vertex: v, edge: e, path: p}
        """

    async with await db.aql.execute(query) as cursor:
        async for doc in cursor:
            print(doc)
```
{{< /tab >}}

{{< /tabs >}}

## Work with databases

### Connect to a database

To connect to a database, create an instance of `ArangoClient` which provides a
connection to the database server. Then call its `db` method and pass the
database name, user name, and password as parameters.

{{< tabs "python-driver" >}}

{{< tab "python-arango" >}}
```python
from arango import ArangoClient

# Initialize a client
client = ArangoClient(hosts="http://localhost:8529")

# Connect to the system database
sys_db = client.db("_system", username="root", password="passwd")
```
{{< /tab >}}

{{< tab "python-arango-async" >}}
```python
from arangoasync import ArangoClient
from arangoasync.auth import Auth

# Initialize the client for ArangoDB.
async with ArangoClient(hosts="http://localhost:8529") as client:
    auth = Auth(username="root", password="passwd")

    # Connect to "_system" database as root user.
    sys_db = await client.db("_system", auth=auth)
```
{{< /tab >}}

{{< /tabs >}}

### Retrieve a list of all databases

To retrieve a list of all databases on an ArangoDB server, connect to the
`_system` database and call the `databases()` method.

{{< tabs "python-driver" >}}

{{< tab "python-arango" >}}
```python
# Retrieve the names of all databases on the server as list of strings
db_list = sys_db.databases()
```
{{< /tab >}}

{{< tab "python-arango-async" >}}
```python
    # Retrieve the names of all databases on the server as list of strings
    db_list = await sys_db.databases()
```
{{< /tab >}}

{{< /tabs >}}

### Create a database

To create a new database, connect to the `_system` database and call
`create_database()`.


{{< tabs "python-driver" >}}

{{< tab "python-arango" >}}
```python
# Create a new database named "test".
ok = sys_db.create_database("test")

# Connect to "test" database as root user.
test_db = client.db("test", username="root", password="passwd")
```
{{< /tab >}}

{{< tab "python-arango-async" >}}
```python
    # Create a new database named "test".
    ok = await sys_db.create_database("test")

    # Connect to "test" database as root user.
    test_db = await client.db("test", auth=auth)
```
{{< /tab >}}

{{< /tabs >}}

### Delete a database

To delete an existing database, connect to the `_system` database and call
`delete_database()` passing the name of the database to be deleted as a
parameter. The `_system` database cannot be deleted. Make sure to specify
the correct database name when you are deleting databases.

{{< tabs "python-driver" >}}

{{< tab "python-arango" >}}
```python
# Delete the 'test' database
sys_db.delete_database("test")
```
{{< /tab >}}

{{< tab "python-arango-async" >}}
```python
    # Delete the 'test' database
    ok = await sys_db.delete_database("test")
```
{{< /tab >}}

{{< /tabs >}}

## Work with collections

### Retrieve a list of collections

To retrieve a list of collections in a database, connect to the database and
call `collections()`.

{{< tabs "python-driver" >}}

{{< tab "python-arango" >}}
```python
# Connect to the database
db = client.db(db_name, username=user_name, password=pass_word)

# Retrieve the list of collections
collection_list = db.collections()
```
{{< /tab >}}

{{< tab "python-arango-async" >}}
```python
    # Connect to the database
    db = await client.db(db_name, auth=Auth(username=user_name, password=pass_word))

    # Retrieve the list of collections as CollectionInfo objects
    collection_list = await db.collections()
```
{{< /tab >}}

{{< /tabs >}}

### Create a collection

To create a new collection, connect to the database and call `create_collection()`.

{{< tabs "python-driver" >}}

{{< tab "python-arango" >}}
```python
# Create a new collection for doctors
doctors_col = db.create_collection(name="doctors")

# Create another new collection for patients
patients_col = db.create_collection(name="patients")
```
{{< /tab >}}

{{< tab "python-arango-async" >}}
```python
    # Create a new collection for doctors
    doctors_col = await db.create_collection(name="doctors")

    # Create another new collection for patients
    patients_col = await db.create_collection(name="patients")
```
{{< /tab >}}

{{< /tabs >}}

### Delete a collection

To delete a collection, connect to the database and call `delete_collection()`,
passing the name of the collection to be deleted as a parameter. Make sure to
specify the correct collection name when you delete collections.

{{< tabs "python-driver" >}}

{{< tab "python-arango" >}}
```python
# Delete the 'doctors' collection
db.delete_collection(name="doctors")
```
{{< /tab >}}

{{< tab "python-arango-async" >}}
```python
    # Delete the 'doctors' collection
    ok = await db.delete_collection(name="doctors")
```
{{< /tab >}}

{{< /tabs >}}

## Work with documents

### Create a document

To create a new document, get a reference to the collection and call its
`insert()` method, passing the object/document to be created in ArangoDB as
a parameter.

{{< tabs "python-driver" >}}

{{< tab "python-arango" >}}
```python
# Get a reference to the 'patients' collection
patients_col = db.collection(name="patients")

# Insert two new documents into the 'patients' collection
meta1 = patients_col.insert({"name": "Jane", "age": 39})
meta2 = patients_col.insert({"name": "John", "age": 18})
```
{{< /tab >}}

{{< tab "python-arango-async" >}}
```python
    # Get a reference to the 'patients' collection
    patients_col = db.collection(name="patients")

    # Insert two new documents into the 'patients' collection
    meta1 = await patients_col.insert({"name": "Jane", "age": 39})
    meta2 = await patients_col.insert({"name": "John", "age": 18})
```
{{< /tab >}}

{{< /tabs >}}

In this example, John's patient record is as follows:

```json
{
  "_id": "patients/741603",
  "_rev": "_fQ2grGu---",
  "_key": "741603",
  "name": "John",
  "age": 18
}
```

### Update a document

To patch or partially update a document, call the `update()` method of the
collection and pass the object/document as a parameter. The document must have
a property named `_key` holding the unique key assigned to the document.

{{< tabs "python-driver" >}}

{{< tab "python-arango" >}}
```python
# Patch John's patient record by adding a city property to the document
meta = patients_col.update({ "_key": "741603", "city": "Cleveland" })
```
{{< /tab >}}

{{< tab "python-arango-async" >}}
```python
    # Patch John's patient record by adding a city property to the document
    meta = await patients_col.update({ "_key": "741603", "city": "Cleveland" })
```
{{< /tab >}}

{{< /tabs >}}

After the patching operation, John's document is as follows for example:

```json
{
  "_id": "patients/741603",
  "_rev": "_fQ2h4TK---",
  "_key": "741603",
  "name": "John",
  "age": 18,
  "city": "Cleveland"
}
```

Notice that the record was patched by adding a `city` property to the document.
All other properties remain the same.

### Replace a document

To replace or fully update a document, call the `replace()` method of the
collection and pass the object/document that fully replaces thee existing
document as a parameter. The document must have a property named `_key` holding
the unique key assigned to the document.

{{< tabs "python-driver" >}}

{{< tab "python-arango" >}}
```python
# Replace John's document
meta = patients_col.replace({ "_key": "741603", "fullname": "John Doe", "age": 18, "city": "Cleveland" })
```
{{< /tab >}}

{{< tab "python-arango-async" >}}
```python
    # Replace John's document
    meta = await patients_col.replace({ "_key": "741603", "fullname": "John Doe", "age": 18, "city": "Cleveland" })
```
{{< /tab >}}

{{< /tabs >}}

After the replacement operation, John's document is as follows:

```json
{
  "_id": "patients/741603",
  "_rev": "_fQ2uY3y---",
  "_key":"741603",
  "fullname": "John Doe",
  "age": 18,
  "city": "Cleveland"
}
```

Notice that the `name` property is now gone from John's document because it was
not specified in the request when the document was fully replaced.

### Delete a document

To delete a document, call the `delete()` method of the collection and pass an
document containing at least the `_key` attribute as a parameter.

{{< tabs "python-driver" >}}

{{< tab "python-arango" >}}
```python
# Delete John's document
patients_col.delete({ "_key": "741603" })
```
{{< /tab >}}

{{< tab "python-arango-async" >}}
```python
    # Delete John's document
    meta = await patients_col.delete({ "_key": "741603" })
```
{{< /tab >}}

{{< /tabs >}}

## Work with AQL

### Run AQL queries

To run a query, connect to the desired database and call `aql.execute()`.
This returns a cursor, which lets you fetch the results in batches. You can
iterate over the cursor to automatically fetch the data.

{{< tabs "python-driver" >}}

{{< tab "python-arango" >}}
```python
# Run a query
cursor = db.aql.execute('FOR i IN 1..@value RETURN i', bind_vars={'value': 3})

# Print the results
for doc in cursor:
    print(doc)
```
{{< /tab >}}

{{< tab "python-arango-async" >}}
```python
    # Run a query
    cursor = await db.aql.execute('FOR i IN 1..@value RETURN i', bind_vars={'value': 3})

    # Print the results
    async with cursor:
        async for doc in cursor:
            print(doc)
```
{{< /tab >}}

{{< /tabs >}}
