---
title: Embed Field in Collection
menuTitle: Embeddings
description: >-
  Add embeddings to documents in any ArangoDB collection
weight: 55
aliases:
  - ../../../reference/autograph/embeddings/
---

## Embed field in collection

{{< endpoint "POST" "/v1/embed-field-in-collection" >}}

Add embeddings to documents in **any** ArangoDB collection you already have. This path is **independent** of import, corpus build, clustering, and the `{project}_CorpusGraph` named graph.

**Recommended path:** This endpoint works independently — no import or corpus build required. Call once per `(collection, field)` pair; repeated calls only process documents still missing the embedding.

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

Only documents **without** `<field>_embedding` are updated. Values may be string or numeric (coerced to text). Truncation follows the same rough character budget as corpus build. After a successful run, the service ensures a **vector index** on the embedding field and an **ArangoSearch view** on the source field when applicable. Rows that fail validation or embedding appear only in the **`message`** text; **`documents_skipped`** counts docs that **already had** an embedding and were not re-processed.

## Response

```json
{
  "status": "completed",
  "message": "Embeddings generated for documents missing description_embedding.",
  "collection": "products",
  "field": "description",
  "embedding_field": "description_embedding",
  "documents_updated": 150,
  "documents_skipped": 20
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `"completed"` |
| `message` | string | Summary; may mention counts if some documents could not be embedded |
| `collection` | string | Collection name |
| `field` | string | Source field |
| `embedding_field` | string | Name of the embedding attribute |
| `documents_updated` | integer | Documents that received embeddings in this run |
| `documents_skipped` | integer | Documents that **already had** `<field>_embedding` (unchanged by this call) |

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
  http://localhost:8080/v1/embed-field-in-collection
```

## Next Steps

- **[Corpus Build](corpus-build.md)**: Learn about automatic embedding generation during builds
