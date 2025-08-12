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

Note that the official asyncio counterpart is `python-arango-async`.

- Repository: <https://github.com/arangodb/python-arango-async>
- Reference: <https://python-arango-async.readthedocs.io/en/latest/>
- [Tutorial](https://github.com/arangodb/python-arango-async/wiki/Tutorial)
- [Releases](https://github.com/arangodb/python-arango-async/releases)

## Installation

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

## Get started

The following example shows how to use the driver from connecting to ArangoDB,
over creating databases, collections, indexes, and documents, to retrieving
data using queries:

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

The following example shows how to create a [named graph](../../graphs/_index.md),
populate it with vertices and edges, and query it with a graph traversal:

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

## Work with databases

### Connect to a database

To connect to a database, create an instance of `ArangoClient` which provides a
connection to the database server. Then call its `db` method and pass the
database name, user name, and password as parameters.

```python
from arango import ArangoClient

# Initialize a client
client = ArangoClient(hosts="http://localhost:8529")

# Connect to the system database
sys_db = client.db("_system", username="root", password="qwerty")
```

### Retrieve a list of all databases

To retrieve a list of all databases on an ArangoDB server, connect to the
`_system` database and call the `databases()` method.

```python
# Retrieve the names of all databases on the server as list of strings
db_list = sys_db.databases()
```

### Create a database

To create a new database, connect to the `_system` database and call
`create_database()`.

```python
# Create a new database named "test".
sys_db.create_database("test")

# Connect to "test" database as root user.
test_db = client.db("test", username="root", password="qwerty")
```

### Delete a database

To delete an existing database, connect to the `_system` database and call
`delete_database()` passing the name of the database to be deleted as a
parameter. The `_system` database cannot be deleted. Make sure to specify
the correct database name when you are deleting databases.

```python
# Delete the 'test' database
sys_db.delete_database("test")
```

## Work with collections

### Retrieve a list of collections

To retrieve a list of collections in a database, connect to the database and
call `collections()`.

```python
# Connect to the database
db = client.db(db_name, username=user_name, password=pass_word)

# Retrieve the list of collections
collection_list = db.collections()
```

### Create a collection

To create a new collection, connect to the database and call `create_collection()`.

```python
# Create a new collection for doctors
doctors_col = db.create_collection(name="doctors")

# Create another new collection for patients
patients_col = db.create_collection(name="patients")
```

### Delete a collection

To delete a collection, connect to the database and call `delete_collection()`,
passing the name of the collection to be deleted as a parameter. Make sure to
specify the correct collection name when you delete collections.

```python
# Delete the 'doctors' collection
db.delete_collection(name="doctors")
```

## Work with documents

### Create a document

To create a new document, get a reference to the collection and call its
`insert()` method, passing the object/document to be created in ArangoDB as
a parameter.

```python
# Get a reference to the 'patients' collection
patients_col = db.collection(name="patients")

# Insert two new documents into the 'patients' collection
patients_col.insert({"name": "Jane", "age": 39})
patients_col.insert({"name": "John", "age": 18})
```

John's patient record is:

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

```python
# Patch John's patient record by adding a city property to the document
patients_col.update({ "_key": "741603", "city": "Cleveland" })
```

After the patching operation, John's document is as follows:

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

Notice that the record was patched by adding a `city` property to the document
 All other properties remain the same.

### Replace a document

To replace or fully update a document, call the `replace()` method of the
collection and pass the object/document that fully replaces thee existing
document as a parameter. The document must have a property named `_key` holding
the unique key assigned to the document.

```python
# Replace John's document
patients_col.replace({ "_key": "741603", "fullname": "John Doe", "age": 18, "city": "Cleveland" })
```

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

```python
# Delete John's document
patients_col.delete({ "_key": "741603" })
```

## Work with AQL

### Run AQL queries

To run a query, connect to the desired database and call `aql.execute()`.
This returns a cursor, which lets you fetch the results in batches. You can
iterate over the cursor to automatically fetch the data.

```python
# Run a query
cursor = db.aql.execute('FOR i IN 1..@value RETURN i', bind_vars={'value': 3})

# Print the results
for doc in cursor:
  print(doc)
```
