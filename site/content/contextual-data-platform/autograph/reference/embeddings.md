---
title: AutoGraph Embed Field in Collection
menuTitle: Embeddings
description: >-
  Add embeddings to a field of the documents in any ArangoDB collection
weight: 16
---
{{< tag "Agentic AI Suite" >}}

`POST /v1/embed-field-in-collection` adds embeddings to a field of the
documents in any ArangoDB collection that you already have. It is independent of
importing, the [corpus build](corpus-build.md), clustering, and the
`{project}_CorpusGraph` named graph, so you do not need to import files or build
a corpus first.

The endpoint is relative to the path of the project's AutoGraph service,
`https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}`.
`service_id_postfix` is the end of the service ID, such as `vyk1t` for
`arangodb-autograph-vyk1t`. The `serviceUrl` in the project metadata of
[`GET /_platform/acp/v1/project_by_name/{database}/{project}`](../../control-plane-acp/api.md#get-project-details)
ends with it, for example `.../autograph/vyk1t/`.

| Endpoint | Operation | Purpose | Call |
|----------|-----------|---------|------|
| [`POST /v1/embed-field-in-collection`](#embed-a-field-in-a-collection) | Embed | Add embeddings to the documents of a collection that do not have them yet | Synchronous |

## Embed a field in a collection

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/embed-field-in-collection" >}}

Creates embeddings for one field of the documents in an existing collection and
stores them in the same documents. The call is synchronous and returns the
counts of the run.

Call it once per collection and field. Every call works out the candidates from
the current data again, so documents that were inserted after a successful run
are embedded on the next call.

### Request

```json
{
  "collection": "products",
  "field": "description"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `collection` | string | Yes | The name of an existing collection in the service database, such as `products` or `articles`. It has to follow the ArangoDB naming rules. |
| `field` | string | Yes | The document attribute to embed, usually a text-heavy one such as `description`, `body`, or `content`. Pass the source field, not the embedding field. The service appends `_embedding` to the name of the embedding field, so `description` is embedded into `description_embedding`. |

The service scans the collection on every call and sorts the documents into
three groups:

- Candidates have a source field that is not `null` and a missing or `null`
  `<field>_embedding`. An explicit `null` counts as not embedded yet. These are
  the documents that get embedded.
- Skipped documents already have a `<field>_embedding` that is not `null`. They
  are not changed.
- Ineligible documents have no source value and no embedding. They are neither
  embedded nor counted as failed.

Source values can be strings or numbers, which are converted to text. They are
truncated to roughly the same number of characters as in a corpus build. After
a successful run, the service makes sure there is a vector index on the
embedding field, and an ArangoSearch View on the source field when this
applies.

### Response

```json
{
  "status": "completed",
  "message": "Embeddings generated for documents missing description_embedding.",
  "collection": "products",
  "field": "description",
  "embedding_field": "description_embedding",
  "documents_updated": 150,
  "documents_skipped": 20,
  "documents_examined": 175,
  "documents_failed": 2,
  "documents_ineligible": 3
}
```

| Field | Meaning |
|-------|---------|
| `status` | `completed`. |
| `message` | A summary. It can mention documents that could not be embedded. |
| `collection` | The name of the collection. |
| `field` | The source field. |
| `embedding_field` | The name of the embedding attribute. |
| `documents_updated` | The documents that received embeddings in this run. |
| `documents_skipped` | The documents that already had a `<field>_embedding` that is not `null`. This call did not change them. |
| `documents_examined` | The size of the collection. Compare it with your own count. |
| `documents_failed` | The candidates that could not be embedded, because of an empty value or an error. |
| `documents_ineligible` | The documents with no source value and no embedding. |

The counts are expected to add up:

```
documents_examined == documents_updated + documents_skipped
                      + documents_failed + documents_ineligible
```

If they do not, the service logs an error. The response still returns the
counts, because the call does not stop in the middle of writing only because a
count does not match.

| Status Code | Meaning |
|-------------|---------|
| `200` | The embeddings have been created. |
| `400` | Invalid `collection` or `field`. |
| `401` | Authentication failed. |
| `404` | The collection does not exist. |
| `500` | Server error. |

### HTTP example

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "collection": "products",
    "field": "description"
  }' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/{service_id_postfix}/v1/embed-field-in-collection
```
