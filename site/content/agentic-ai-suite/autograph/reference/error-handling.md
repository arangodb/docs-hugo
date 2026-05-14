---
title: Error Handling and Troubleshooting
menuTitle: Error Handling
description: >-
  HTTP error codes, common issues, and troubleshooting for the AutoGraph service
weight: 60
---

## Error Handling

The service returns these HTTP status codes:

| Code | Meaning |
|------|---------|
| `200` | Success. |
| `400` | Invalid request body or parameters. |
| `401` | Missing or invalid token, or the LLM provider rejected authentication. |
| `403` | Not allowed to use the database, or the LLM provider denied access. |
| `404` | Unknown build ID, or the collection in an embed request does not exist. |
| `409` | Another build or orchestration run is already in progress. |
| `429` | The LLM provider rate-limited the request or its quota is exhausted. |
| `500` | Server or configuration error. |
| `503` | Service not ready. |

Error responses are usually JSON with a `message` field (and sometimes a
`code`) that you can log or show to operators.

**Provider-failure error codes.** When a corpus build or RAG Strategizer run
fails because of an LLM or embedding provider error,
`GET /v1/corpus/builds/{id}` returns an `error_code` field that identifies
the cause, so your client can react to each one differently:

| `error_code` | Meaning | HTTP equivalent |
|--------------|---------|-----------------|
| `LLM_AUTHENTICATION_FAILED` | API key rejected by the provider | `401` |
| `LLM_PERMISSION_DENIED` | API key valid but lacks access to the model | `403` |
| `LLM_RATE_LIMITED` | Provider rate-limited the request | `429` |
| `LLM_QUOTA_EXCEEDED` | Provider quota for the key was consumed | `429` |
| `LLM_API_KEY_MISSING` | No chat/embedding key configured on the service | `401` |

**Common causes of validation or configuration errors:**

- The `files` array is empty on import.
- The `embedding_strategy` is set to a value other than `"first_chunk"`.
- The `cluster_threshold` is set to a value other than `1` or `2`.
- The RAG Strategizer was called before a corpus build finished successfully.
- An embed request is missing `collection` or `field`, or `field` ends in
  `_embedding`.
- The server has no embedding provider or no authentication configured.

## Known Limitations

### Citation handling

**Citations require manual processing.** AutoGraph preserves the `citable_url`
field throughout the pipeline (from import through the GraphRAG Importer), but
it does not yet detect or link citations automatically. The service stores
any citation URLs you provide at import and passes them on to later stages;
you have to handle these citation features yourself:

- **Citation extraction from content**: Citations inside document text
  (for example, references, footnotes, or bibliographies) are not detected
  or extracted automatically.
- **SemanticUnits linking**: The orchestrator sets `enable_semantic_units: true`
  for FullGraphRAG partitions, but citation nodes are not yet created or linked
  in the `SemanticUnits` collection.
- **Citation validation**: The service does not check whether the `citable_url`
  values you provide are valid or reachable.
- **Cross-document citation tracking**: Links between documents based on
  citations are not created automatically.

**Recommended workflow:**

1. When you import documents via `POST /v1/import-multiple`, set
   `citable_url` on each file that has a canonical URL to cite.
2. The URL is stored in the corpus graph and passed to the importer during
   orchestration.
3. To extract citations from document content, add your own processing step
   that:
   - Scans your documents for citation references.
   - Creates `SemanticUnits` nodes for cited resources.
   - Links chunks and documents to their citations.

A future release will add automatic citation detection and SemanticUnits
creation.

### VectorRAG query support

**VectorRAG partitions support a smaller set of queries.** When the RAG
Strategizer assigns **VectorRAG** to a cluster (domain), the GraphRAG
Importer creates only the `Documents`, `Chunks`, and `Relations` collections
for that partition. It does not create `Entities` or `Communities`, which
some query types need. This limits which queries you can run later.

| Query type | VectorRAG | FullGraphRAG | Notes |
|------------|:---------:|:------------:|-------|
| **Global** | Not supported | Supported | Needs `Communities` with community summaries. |
| **Local** | Not supported | Supported | Needs `Entities` and entity-relationship subgraphs. |
| **Unified** | Partial | Supported | Vector search works, but without entity context the answer quality drops. |

**Why this happens:**

- VectorRAG is a lighter strategy that skips entity extraction and
  community detection to save time and cost.
- Global queries need community-level summaries that only exist in
  FullGraphRAG partitions.
- Local queries need entity-relationship graphs extracted from text,
  which VectorRAG does not produce.
- Unified queries can search chunks with vector similarity (both strategies
  have chunks), but they miss the entity context that FullGraphRAG adds.

**Recommended approach:**

1. **For query-heavy workloads**: Set `full_graph_rag_strategy` to
  `"very high"` or `"high"` when calling `POST /v1/rag-strategizer/analyze`
  so most or all clusters use FullGraphRAG.
2. **For mixed workloads**: Accept that VectorRAG partitions only serve vector
  chunk search (unified queries with reduced quality).
3. **To change strategies**: Re-run the RAG Strategizer with a different
  `full_graph_rag_strategy` percentage, clear the `rags` collection if needed,
  then re-run orchestration for the affected partitions.
4. **For critical domains**: Review strategy assignments with
  `GET /v1/rag-strategizer/strategy`, then use the `partition_ids` parameter
  on orchestration to reprocess specific clusters with FullGraphRAG.

## Troubleshooting

- **Cannot reach ArangoDB.** Check your network and firewall, and confirm
  the ArangoDB URL your deployment is using.
- **401 Unauthorized.** Send the token as `Authorization: Bearer <token>`,
  with a space between `Bearer` and the token value.
- **Build appears stuck or fails.** Poll `GET /v1/corpus/builds/{id}` and
  inspect the `status`, `message`, and `error` fields for details.
- **RAG Strategizer fails.** Make sure a corpus build has finished and
  produced clusters before you run the Strategizer.
- **Orchestration fails.** Confirm that the `rags` collection contains
  strategies, and that platform authentication and the GraphRAG Importer
  integration are configured for your environment.
- **Embed Field endpoint fails.** The target collection must exist, the
  source field must have non-empty values, and an embedding provider must
  be configured on the service.
