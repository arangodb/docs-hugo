---
title: Schema Validation
menuTitle: Schema Validation
weight: 5
description: >-
  How to enforce attributes and their data types for documents of individual
  collections using JSON Schema
---
While ArangoDB is schema-less, it allows you to enforce certain document structures
on the collection level. You can describe the desired structure in the popular
[JSON Schema](https://json-schema.org/) format (draft-4, without support for
remote schemas for security reasons). The level of validation and a custom error
message are configurable. The system attributes `_key`, `_id`, `_rev`, `_from`
and `_to` are ignored by the schema validation.

## Schema validation interfaces

The following sections show examples of how you can configure the
schema validation for collections using the APIs of ArangoDB and
the official drivers, as well as the ArangoDB Shell and the built-in web interface.

### Enable schema validation for a collection

You can define a schema when creating a collection as well as update the
properties of a collection later on to add, modify, or remove a schema.

The `schema` property of a collection expects an object with the following
attributes:

- `rule`: Must contain the JSON Schema description.
- `level`: Controls when the validation is applied.
- `message`: Defines the message that is used when validation fails.

See [Schema validation properties](#schema-validation-properties) for details.

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. If necessary, [switch to the database](../databases.md#set-the-database-context)
   that contains the desired collection.
2. Click **Collections** in the main navigation.
3. Click the name or row of the desired collection.
4. Go to the **Schema** tab.
5. Enter the desired JSON Schema. Example:
   ```json
   {
     "rule": {
       "type": "object",
       "properties": {
         "nums": {
           "type": "array",
           "items": {
             "type": "number",
             "maximum": 6
           }
         }
       },
       "additionalProperties": { "type": "string" },
       "required": [ "nums" ]
     },
     "level": "moderate",
     "message": "The document does not contain an array of numbers in attribute \"nums\", one of the numbers is greater than 6, or another top-level attribute is not a string."
   }
   ```
6. Click the **Save** button.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: arangosh_set_collection_properties_schema
description: ''
---
var schema = {
  rule: { 
    type: "object",
    properties: {
      nums: {
        type: "array",
        items: {
          type: "number",
          maximum: 6
        }
      }
    },
    additionalProperties: { type: "string" },
    required: ["nums"]
  },
  level: "moderate",
  message: "The document does not contain an array of numbers in attribute \"nums\", one of the numbers is greater than 6, or another top-level attribute is not a string."
};

/* Create a new collection with schema */
var coll = db._create("schemaCollection", { "schema": schema });

/* Update the schema of an existing collection */
db.schemaCollection.properties({ "schema": schema });
~addIgnoreCollection(coll.name());
```
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl -XPUT -d '{"schema":{"rule":{"type":"object","properties":{"nums":{"type":"array","items":{"type":"number","maximum":6}}},"additionalProperties":{"type":"string"},"required":["nums"]},"level":"moderate","message":"The document does not contain an array of numbers in attribute \"nums\", one of the numbers is greater than 6, or another top-level attribute is not a string."}}' http://localhost:8529/_db/mydb/_api/collection/coll/properties
```

See the [`GET /_db/{database-name}/_api/collection/{collection-name}/properties`](../../../develop/http-api/collections.md#get-the-properties-of-a-collection)
endpoint in the _HTTP API_ for details.
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
let coll = db.collection("coll");
const props = await coll.properties({
  schema: {
    rule: {
      type: "object",
      properties: {
        nums: {
          type: "array",
          items: {
            type: "number",
            maximum: 6
          }
        }
      },
      additionalProperties: { type: "string" },
      required: ["nums"]
    },
    level: "moderate",
    message: "The document does not contain an array of numbers in attribute \"nums\", one of the numbers is greater than 6, or another top-level attribute is not a string."
  }
});
```

See [`DocumentCollection.properties()`](https://arangodb.github.io/arangojs/latest/interfaces/collections.DocumentCollection.html#properties.properties-2)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
coll, err := db.GetCollection(ctx, "coll", nil)
err = coll.SetProperties(ctx, arangodb.SetCollectionPropertiesOptions{
  Schema: &arangodb.CollectionSchemaOptions{
    Rule: map[string]interface{}{
      "type": "object",
      "properties": map[string]interface{}{
        "nums": map[string]interface{}{
          "type": "array",
          "items": map[string]interface{}{
            "type":    "number",
            "maximum": 6,
          },
        },
      },
      "additionalProperties": map[string]interface{}{
        "type": "string",
      },
      "required": []string{
        "nums",
      },
    },
    Level:   "moderate",
    Message: `The document does not contain an array of numbers in attribute "nums", one of the numbers is greater than 6, or another top-level attribute is not a string.`,
  },
})
```

See [`Collection.SetProperties()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#Collection)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
```java
String schemaRule = (
    "{" +
        "  \"type\": \"object\"," +
        "  \"properties\": {" +
        "    \"nums\": {" +
        "      \"type\": \"array\"," +
        "      \"items\": {" +
        "        \"type\": \"number\"," +
        "        \"maximum\": 6" +
        "      }" +
        "    }" +
        "  }," +
        "  \"additionalProperties\": { \"type\": \"string\" }," +
        "  \"required\": [\"nums\"]" +
    "}");

CollectionPropertiesOptions options = new CollectionPropertiesOptions()
    .schema(new CollectionSchema()
        .setRule(schemaRule)
        .setLevel(CollectionSchema.Level.MODERATE)
        .setMessage("The document does not contain an array of numbers in attribute \"nums\", one of the numbers is greater than 6, or another top-level attribute is not a string.")
        );

ArangoCollection coll = db.collection("coll");
CollectionPropertiesEntity props = coll.changeProperties(options);
```

See [`ArangoCollection.changeProperties()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoCollection.html#changeProperties%28com.arangodb.model.CollectionPropertiesOptions%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
coll = db.collection("coll")
props = coll.configure(
  schema={
    "rule": {
      "type": "object",
      "properties": {
        "nums": {
          "type": "array",
          "items": {
            "type": "number",
            "maximum": 6
          }
        }
      },
      "additionalProperties": { "type": "string" },
      "required": [ "nums" ]
    },
    "level": "moderate",
    "message": "The document does not contain an array of numbers in attribute \"nums\", one of the numbers is greater than 6, or another top-level attribute is not a string."
  }
)
```

See [`Collection.configure()`](https://docs.python-arango.com/en/main/specs.html#arango.collection.Collection.configure)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

### Remove schema validation for a collection

To remove an existing schema from a collection, set a `schema` value of either
`null` or `{}` (empty object).

{{< tabs "interfaces" >}}

{{< tab "Web interface" >}}
1. If necessary, [switch to the database](../databases.md#set-the-database-context)
   that contains the desired collection.
2. Click **Collections** in the main navigation.
3. Click the name or row of the desired collection.
4. Go to the **Schema** tab.
5. You can temporarily disable the document validation by setting the validation
   `level` to `"none"`. To fully remove the schema from the collection, replace
   the entire configuration with `null`.
6. Click the **Save** button.
{{< /tab >}}

{{< tab "arangosh" >}}
```js
---
name: arangosh_remove_collection_properties_schema
description: ''
---
~var coll = db._collection("schemaCollection");
db.schemaCollection.properties({ "schema": null });
~removeIgnoreCollection(coll.name());
~db._drop(coll.name());
```

See [`collection.properties()`](../../../develop/javascript-api/@arangodb/collection-object.md#collectionpropertiesproperties)
in the _JavaScript API_ for details.
{{< /tab >}}

{{< tab "cURL" >}}
```sh
curl -XPUT -d '{"schema":null}' http://localhost:8529/_db/mydb/_api/collection/coll/properties
```

See the [`GET /_db/{database-name}/_api/collection/{collection-name}/properties`](../../../develop/http-api/collections.md#get-the-properties-of-a-collection)
endpoint in the _HTTP API_for details.
{{< /tab >}}

{{< tab "JavaScript" >}}
```js
let coll = db.collection("coll");
const props = await coll.properties({ schema: null });
```

See [`DocumentCollection.properties()`](https://arangodb.github.io/arangojs/latest/interfaces/collections.DocumentCollection.html#properties.properties-2)
in the _arangojs_ documentation for details.
{{< /tab >}}

{{< tab "Go" >}}
```go
ctx := context.Background()
coll, err := db.GetCollection(ctx, "coll", nil)
err = coll.SetProperties(ctx, arangodb.SetCollectionPropertiesOptions{
  Schema: &arangodb.CollectionSchemaOptions{}  // empty object
})
```

See [`Collection.SetProperties()`](https://pkg.go.dev/github.com/arangodb/go-driver/v2/arangodb#Collection)
in the _go-driver_ v2 documentation for details.
{{< /tab >}}

{{< tab "Java" >}}
```java
CollectionPropertiesOptions options = new CollectionPropertiesOptions()
    .schema(null);

ArangoCollection coll = db.collection("coll");
CollectionPropertiesEntity props = coll.changeProperties(options);
```

See [`ArangoCollection.changeProperties()`](https://www.javadoc.io/doc/com.arangodb/arangodb-java-driver/latest/com/arangodb/ArangoCollection.html#changeProperties%28com.arangodb.model.CollectionPropertiesOptions%29)
in the _arangodb-java-driver_ documentation for details.
{{< /tab >}}

{{< tab "Python" >}}
```py
coll = db.collection("coll")
props = coll.configure(schema={})
```

See [`Collection.configure()`](https://docs.python-arango.com/en/main/specs.html#arango.collection.Collection.configure)
in the _python-arango_ documentation for details.
{{< /tab >}}

{{< /tabs >}}

## Schema validation properties

### JSON Schema Rule

The `rule` must be a valid JSON Schema object as outlined in the
[specification](https://json-schema.org/specification.html).
See [Understanding JSON Schema](https://json-schema.org/understanding-json-schema/reference/object.html)
for a user guide on how to write JSON Schema descriptions.

System attributes are invisible to the schema validation, i.e. `_key`, `_rev` and `_id`
(in edge collections additionally `_from` and `_to`) do not need to be
specified in the schema. You may set `additionalProperties: false` to only
allow attributes described by the schema. System attributes do not fall under
this restriction.

Attributes with numeric values always have the type `"number"`, even if they are
whole numbers (and internally use an `integer` type). If you want to restrict an
attribute to integer values, use `"type": "number"` together with `"multipleOf": 1`.

{{< security >}}
Remote schemas are not supported for security reasons.
{{< /security >}}

### Levels

The level controls when the validation is triggered:

- `none`: The rule is inactive and validation thus turned off.
- `new`: Only newly inserted documents are validated.
- `moderate`: New and modified documents must pass validation, except for
  modified documents where the OLD value did not pass validation already.
  This level is useful if you have documents which do not match your target
  structure, but you want to stop the insertion of more invalid documents
  and prohibit that valid documents are changed to invalid documents.
- `strict`: All new and modified document must strictly pass validation.
  No exceptions are made (default).

### Error message

If the schema validation for a document fails, then a generic error is raised.
You may customize the error message via the `message` attribute to provide a
summary of what the expected document structure is or point out common mistakes.

The schema validation cannot pin-point which part of a rule made it fail because
it is difficult to determine and report for complex schemas. For example, when
using `not` and `anyOf`, this would result in trees of possible errors. You can
use tools like [jsonschemavalidator.net](https://www.jsonschemavalidator.net/)
to examine schema validation issues.

## Performance

The schema validation is executed for data-modification operations according
to the levels described above. That means that it can slow down document 
write operations, with more complex schemas typically taking more time for the 
validation than very simple schemas.

## Related AQL functions

The following AQL functions are available to work with schemas:

 - [`SCHEMA_GET()`](../../../aql/functions/miscellaneous.md#schema_get)
 - [`SCHEMA_VALIDATE()`](../../../aql/functions/miscellaneous.md#schema_validate)

## Backup and restore

Logical backups created with arangodump include the schema configuration, which
is a collection property.

When using arangorestore to restore to a collection with a defined schema,
no schema validation is executed.
