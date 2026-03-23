---
title: Incompatible changes in ArangoDB 4.0
menuTitle: Incompatible changes in 4.0
weight: 15
description: >-
  Check the following list of potential breaking changes **before** upgrading to
  this ArangoDB version and adjust any client applications if necessary
---
## 



## HTTP RESTful API

### Batch request endpoint removed

<small>Removed in: v3.12.3</small>

The `/_api/batch` endpoints that let you send multiple operations in a single
HTTP request was deprecated in v3.8.0 and has now been removed.

To send multiple documents at once to an ArangoDB instance, please use the
[HTTP interface for documents](../../develop/http-api/documents.md#multiple-document-operations)
that can insert, update, replace, or remove arrays of documents.

## JavaScript API



## Startup options

### Log topic changes and removals

The only remaining use of the `bench` log topic (due to the removal of
_arangobench_) was for the log message with ID `bafc2`, used by _arangoexport_
to report a JSON format error related to the `--custom-query-bindvars`
startup option. It has been changed to the `config` log topic.

The `bench` log topic has been removed.
Attempts to set the log level for this topic logs a warning, for example, using
a startup option like `--log.level bench=debug`.

## Client tools

### arangobench removed

The benchmark and test tool _arangobench_ has been removed.

It was originally used internally in the development of ArangoDB for performance
and server function testing, but lost its relevance over time and became
unmaintained.
