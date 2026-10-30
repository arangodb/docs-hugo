---
title: _arangoexport_ Examples
menuTitle: Examples
weight: 5
description: >-
  How to export data in JSON, CSV, or XML formats from ArangoDB on the
  command-line with _arangoexport_
---
## Export a collection

To export a collection of the `_system` database, run _arangoexport_ with the
name of the collection and an output directory:

```
arangoexport --collection test --output-directory "dump"
```

Without further startup options, _arangoexport_ connects to the ArangoDB server
at the default endpoint `http://127.0.0.1:8529` as the `root` user and prompts
you for the password. It exports the `test` collection into the `dump`
directory. Every line of the output is a JSON object that corresponds to one
document from the collection, without a specific order.

To export more than one collection at a time, specify multiple `--collection`
options. The default output directory is `export`.

You can also specify the output directory as a [positional argument](../../../operations/administration/configuration.md#command-line-options)
without `--output-directory`:

```
arangoexport --collection test dump
```

When _arangoexport_ has finished, it prints out a summary line with some aggregate
statistics about what it did, for example:

```
Processed 2 collection(s), wrote 9031763 Byte(s), 78 HTTP request(s)
```

## Connect and authenticate

To connect to a different server, database, or as a different user, use the
following startup options:

- `--server.endpoint <string>`: The endpoint to connect to. In a cluster,
  specify a Coordinator.
- `--server.database <string>`: The name of the database to export from.
- `--server.username <string>`: The username.
- `--server.password <string>`: The password or access token. If you omit it,
  you are prompted for the password.
- `--server.authentication <bool>`: Whether to authenticate. Set it to
  `false` if authentication is disabled on the server.

For example, to export a collection from a
[database](../../../concepts/data-structure/databases.md#database-names)
of a server at a non-standard endpoint as the `backup` user:

```bash
arangoexport \
  --server.endpoint http://192.168.173.13:8531 \
  --server.username backup \
  --server.database mydb \
  --collection test \
  --output-directory "my-export"
```

The user needs **Read only** / `ro` access to the collections you want to export.

From v3.12.13 onward, _arangoexport_ exchanges the username and password for a
JWT when it starts and renews the token automatically before it expires, so
that long-running exports don't fail with an HTTP `401 Unauthorized` error.
For details about the authentication, how to avoid exposing credentials in the
process list, and how the token renewal works, see
[Connect to an ArangoDB server](../_index.md#connect-to-an-arangodb-server).

## Export JSONL

```
arangoexport --type jsonl --collection test
```

This exports the `test` collection into the `export` output directory as [JSONL](http://jsonlines.org).
Every line in the export is one document from the `test` collection as a JSON object.

## Export JSON

```
arangoexport --type json --collection test
```

This exports the `test` collection into the `export` output directory as one JSON array.
Every array entry is one document from the `test` collection as a JSON object.

## Export CSV

```
arangoexport --type csv --collection test --fields _key,_id,_rev
```

This exports the `test` collection into the `export` output directory as CSV. The first
line contains the header with all field names. Each line is one document represented as
CSV and separated with a comma. Objects and arrays are represented as a JSON string.

Starting with ArangoDB version 3.8.5, string values in the CSV output are enclosed in 
double quotes. If any string value starts with one of the following characters: `+`, `=`, `@`, `-`,
it is treated as a potential formula and is prefixed by an extra single quote.
This is done to prevent formula injection attacks in spreadsheet programs such as Microsoft Excel or
LibreOffice Calc. If you don't want to use this functionality, you can turn it off via 
the `--escape-csv-formulae` option.

## Export XML

```
arangoexport --type xml --collection test
```

This exports the `test` collection into the `export` output directory as generic XML.
The root element of the generated XML file is named `collection`.
Each document in the collection is exported in a `doc` XML attribute.
Each document attribute is exported as a generic `att` element, which has a
`name` attribute with the attribute name, a `type` attribute indicating the
attribute value type, and a `value` attribute containing the attribute's value.

## Export XGMML

[XGMML](https://en.wikipedia.org/wiki/XGMML) is an XML application
based on [GML](https://en.wikipedia.org/wiki/Graph_Modelling_Language).
To view the XGMML file you can use for example [Cytoscape](http://cytoscape.org).

{{< warning >}}
If you export all attributes (`--xgmml-label-only false`), attribute
types have to be the same for all documents. For example, if you have an
attribute named `rank`, which is a string in one document and an integer in another,
it does not work.

Incorrect:

```js
{ "rank": 1 }   // doc1
{ "rank": "2" } // doc2
```

Correct:

```js
{ "rank": 1 } // doc1
{ "rank": 2 } // doc2
```
{{< /warning >}}

**XGMML-specific options**

- `--xgmml-label-attribute`: specifies the name of the attribute that becomes the
  label in the XGMML file.

- `--xgmml-label-only`: set to `true`, only export the label without any
  attributes in edges or nodes.

**Export based on collections**

```bash
arangoexport \
  --type xgmml \
  --graph-name mygraph \
  --collection node \
  --collection edge
```

This exports an unnamed graph with the node collection named `node` and the edge collection
named `edge` into the `mygraph.xgmml` XGMML file.

**Export based on a named graph**

```
arangoexport --type xgmml --graph-name mygraph
```

This exports the named graph `mygraph` into the `mygraph.xgmml` XGMML file.

**Export XGMML without attributes**

```
arangoexport --type xgmml --graph-name mygraph --xgmml-label-only true
```

This exports the named graph mygraph into the `mygraph.xgmml` XGMML file without the `<att>` tag in nodes and edges.

**Export XGMML with a specific label**

```
arangoexport --type xgmml --graph-name mygraph --xgmml-label-attribute name
```

This exports the named graph mygraph into the `mygraph.xgmml` XGMML file with a
label from documents attribute `name` instead of the default attribute `label`.

## Export via AQL query

Exporting via an AQL query allows you to export the returned data as the type
specified with `--type`.

The example exports all books as JSONL that are sold more than 100 times:

```bash
arangoexport \
    --type jsonl \
    --custom-query "FOR book IN books FILTER book.sold > 100 RETURN book"
```

For CSV exports, a `--fields` list is required. You can use an AQL query to produce
these fields. For example, you can de-normalize document structures like arrays and
nested objects to a tabular form as demonstrated below:

```bash
arangoexport \
  --type csv \
  --fields title,category1,category2 \
  --custom-query "FOR book IN books RETURN { title: book.title, category1: book.categories[0], category2: book.categories[1] }"
```

The `--custom-query-bindvars` option lets you set bind variables that you can
use in the `--custom-query` option:

```bash
arangoexport \
  --type jsonl \
  --custom-query 'FOR book IN @@@@collectionName FILTER book.sold > @@sold RETURN book' \
  --custom-query-bindvars '{"@@collectionName": "books", "sold": 100}'
```

Note that you need to escape at signs in command-lines by doubling them (see
[Environment variables as parameters](../../../operations/administration/configuration.md#environment-variables-as-parameters)).

You can save a query to a file and use it as a custom query with the
`--custom-query-file` option. It is mutually exclusive with the `--custom-query`
option:

```aql
// example.aql
FOR book IN @@collectionName
  FILTER book.sold > @sold
  RETURN book
```

```
arangoexport --custom-query-file example.aql
```

You can optionally limit the query runtime via the `--custom-query-max-runtime`
option. Specify the maximum query runtime in seconds. Set it to `0` for no limit,
to override the default `--query.max-runtime` of the server (if set).

```bash
arangoexport \
  --type jsonl \
  --custom-query-max-runtime 10 \
  --custom-query "FOR book IN books FILTER book.sold > 100 RETURN book"
```
