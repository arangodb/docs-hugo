---
title: AutoGraph Embed Field in Collection
menuTitle: Embeddings
description: >-
  Add embeddings to documents in any ArangoDB collection
weight: 55
---
## Embed field in collection

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/embed-field-in-collection" >}}

Add embeddings to documents in **any** ArangoDB collection you already have. This path is **independent** of import, corpus build, clustering, and the `{project}_CorpusGraph` named graph.

**Recommended path:** This endpoint works independently; no import or corpus build required. Call once per `(collection, field)` pair. Every call recomputes the candidates from the live data, so rows that were inserted after a previous successful run are embedded on the next call.

## Request

```json
{
  "collection": "products",
  "field": "description"
}
```

### Parameters

| Parameter | Type | Required | Description | Recommended value |
|-----------|------|----------|-------------|-------------------|
| `collection` | string | Yes | Fully qualified logical name of an **existing** collection in the service database. | Your business collection name (e.g. `products`, `articles`). Must match ArangoDB naming rules. |
| `field` | string | Yes | Document attribute to embed. The service appends `_embedding` automatically (e.g. `description` → `description_embedding`). | A text-heavy attribute (`description`, `body`, `content`). Pass the **source** field name, not the embedding field. |

## Behavior

The service rescans the collection on every call and sorts the documents into
three groups:

- **Candidates** have a non-null source field and a missing or **null**
  `<field>_embedding`. An explicit `null` counts as not yet embedded. These are
  the documents that get embedded.
- **Skipped** documents already have a non-null `<field>_embedding` and are left
  untouched.
- **Ineligible** documents have no source value and no embedding. They are
  neither embedded nor counted as failed.

Source values may be string or numeric (coerced to text). Truncation follows the
same rough character budget as corpus build. After a successful run, the service
ensures a **vector index** on the embedding field and an **ArangoSearch view**
on the source field when applicable.

## Response

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

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `"completed"` |
| `message` | string | Summary; may mention documents that could not be embedded |
| `collection` | string | Collection name |
| `field` | string | Source field |
| `embedding_field` | string | Name of the embedding attribute |
| `documents_updated` | integer | Documents that received embeddings in this run |
| `documents_skipped` | integer | Documents that **already had** a non-null `<field>_embedding` (unchanged by this call) |
| `documents_examined` | integer | The size of the collection. Reconcile it against your own store. |
| `documents_failed` | integer | Candidates that could not be embedded, because of an empty value or an error |
| `documents_ineligible` | integer | Documents with no source value and no embedding |

The counts are expected to add up:

```
documents_examined == documents_updated + documents_skipped
                      + documents_failed + documents_ineligible
```

A gap is logged server-side at error level. The response still returns the
counts, because the call does not abort mid-write only for a counter mismatch.

| Status Code | Meaning |
|-------------|---------|
| `200` | Success |
| `400` | Invalid `collection` or `field` |
| `401` | Authentication failed |
| `404` | Collection does not exist |
| `500` | Server error |

## HTTP Example

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"collection": "products", "field": "description"}' \
  https://<EXTERNAL_ENDPOINT>:8529/autograph/v1/embed-field-in-collection
```

## Next Steps

- **[Corpus Build](corpus-build.md)**: Learn about automatic embedding generation during builds
