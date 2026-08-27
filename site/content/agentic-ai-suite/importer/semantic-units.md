---
title: Process Images and Semantic Units with the importer
menuTitle: Semantic Units
description: >-
  Extract and process images, web URLs, and multimedia content from your documents
weight: 70
---
## Overview

Semantic units capture the image and web references found in your documents, so
that retrieval can point back at them. The Importer collects every image
reference in the Markdown it processes, stores each one in the
`{project_name}_SemanticUnits` collection, and can optionally have a
vision-capable model describe what the image shows.

{{< tip >}}
Semantic units are optional and disabled by default. Enable them when you need
to extract and process multimedia references from your documents.
{{< /tip >}}

## Where the image references come from

The Importer collects image references from two places:

- **Images embedded in your documents**, which are extracted during
  [document conversion](setup.md#supported-file-formats) and referenced at the
  position they appeared in. Extraction only happens when
  `enable_semantic_units` is `true`. Not every format yields images.
- **Links that were already written into the document**, such as a Markdown
  image pointing at `https://example.com/logo.png`, which are picked up as they
  are.

Extracted images are copied into the File Manager before chunking, and the
reference is rewritten to a durable File Manager download URL. The knowledge
graph therefore points at an image for as long as that file exists. If a copy
fails, the reference is dropped from the chunk so that no broken link enters the
graph.

Links that were already in your document are never rewritten. Only extracted
images are re-hosted.

## Configuration

Semantic units are controlled by two parameters that work hierarchically, plus
one for embeddings.

### `enable_semantic_units`

- **Purpose**: Master switch for semantic units, and for extracting the images
  embedded in your documents.
- **Functionality**:
  - Collects image and web references and stores them in the
    `{project_name}_SemanticUnits` collection.
  - Requests image extraction during document conversion, then re-hosts the
    extracted images in the File Manager.
- **Stores**: `image_url`, `is_storage_url`, `source_chunk_id`, `import_number`.
- **Use cases**:
  - Document analysis with web references.
  - Content auditing and link extraction.
  - Basic multimedia content tracking.

The default value is `false`.

### `process_images`

- **Purpose**: Generates a written description of each image.
- **Functionality**:
  - When `false`: image references are collected, but no model is called and no
    description is stored. No LLM is involved at all.
  - When `true`: each image is sent to a vision-capable model and the returned
    text is stored on the semantic unit.
- **Requirements**: `enable_semantic_units` must be `true`, and a reachable
  OpenAI-compatible chat endpoint with an API key. See
  [Vision model requirements](#vision-model-requirements).
- **Result per image**:

  | Outcome | Fields on the semantic unit |
  |---------|-----------------------------|
  | Description generated | `description` holds the model's text |
  | The call was made but failed | No `description`, plus `description_generation: "failed"` |
  | No vision model configured | The semantic unit is created with neither field |

The default value is `false` and requires `enable_semantic_units` to be set to
`true`.

### `enable_semantic_unit_embeddings`

- **Purpose**: Generates vector embeddings for semantic units, so that they can
  be found by similarity search.
- **Requirements**: `enable_semantic_units` must be `true`.

The default value is `false`.

{{< warning >}}
The `store_image_data`, `crop_images`, and `store_images_to_s3` request fields
have been **removed**. Stop sending them: the service does not read them, and a
request body that still carries them may be rejected instead of being ignored.
Image extraction is now driven by `enable_semantic_units`, and descriptions by
`process_images`.
{{< /warning >}}

## Examples

### References only

This configuration collects image and web references without calling any model.

```json
{
  "file_content": "base64_encoded_content",
  "file_name": "document.md",
  "enable_semantic_units": true,
  "process_images": false
}
```

The Importer collects the image references, including those extracted from the
documents themselves, and stores each one in the `SemanticUnits` collection with
its URL, a flag showing whether it is a storage reference, and a link back to the
source chunk. No descriptions are generated, so no LLM tokens are spent.

### References with descriptions

This configuration also has a vision model describe each image.

```json
{
  "file_content": "base64_encoded_content",
  "file_name": "report.pdf",
  "enable_semantic_units": true,
  "process_images": true
}
```

Each image reference is sent to a vision-capable model, and the text it returns
is stored in the `description` field of the semantic unit. Images that could not
be described are still recorded, marked with
`description_generation: "failed"`.

### With embeddings

This configuration makes semantic units searchable by similarity.

```json
{
  "file_content": "base64_encoded_content",
  "file_name": "report.pdf",
  "enable_semantic_units": true,
  "process_images": true,
  "enable_semantic_unit_embeddings": true
}
```

### Complete request

A complete import request with semantic units enabled alongside other import
parameters:

```bash
curl -X POST https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/<SERVICE_ID_POSTFIX>/v1/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "file_content": "'$base64_content'",
    "file_name": "document.md",
    "chunk_token_size": 1024,
    "entity_types": ["person", "organization", "technology"],
    "enable_semantic_units": true,
    "process_images": true
  }'
```

The Importer extracts entities of the requested types, chunks the text into
1024-token segments, collects every image reference, and describes each image.
The resulting knowledge graph contains entity nodes, relationships, and a
`SemanticUnits` collection with one entry per image.

## Supported image sources

| Source | How it is handled |
|--------|-------------------|
| Images extracted from your documents | Copied into the File Manager and referenced by a durable download URL |
| File Manager download URLs | Always readable |
| `http://` and `https://` links in the document | Fetched only if the host is on the allowlist your operator sets with `IMAGE_FETCH_ALLOWED_HOSTS`. Without an allowlist, only File Manager URLs are fetched |
| `s3://` artifact routes | Read through the platform's storage path, not fetched by URL directly |
| Any other URL scheme | Refused |

Local image files above **20 MiB** (`MAX_LOCAL_IMAGE_BYTES`) are skipped. They
do not fail the import.

## Vision model requirements

Collecting semantic units needs no LLM at all. Describing images does, and that
call does **not** go through whatever provider builds your graph. It always goes
to an OpenAI-compatible chat completions endpoint, so what you have to configure
depends on your chat provider.

**With `chat_api_provider` set to `openai` or `custom`**

Image descriptions reuse the same client as graph building, with the same API
key, base URL (`chat_api_url`), and connection settings. For `custom`, a
non-empty `chat_api_url` is required, just as it is for graph building. The
endpoint has to be able to serve a vision-capable model. If the model you select
cannot accept image input, the call fails and the affected semantic units carry
`description_generation: "failed"`.

**With `chat_api_provider` set to `triton`**

{{< warning >}}
Triton is not used for image descriptions. They require `CHAT_API_KEY`, a
dedicated OpenAI API key, and the call goes directly to the OpenAI API. Graph
building continues to run entirely on Triton and does not use that key.

If `CHAT_API_KEY` is not set, the Importer logs a warning when the import starts
and skips the descriptions. Semantic units are still created for every image,
just without a `description`.
{{< /warning >}}

### Image description model

The model used for the description call is selected by the `MULTIMODAL_MODEL`
environment variable (Helm value `multimodal_model`, also accepted on the server
CLI as `--multimodal_model`). When unset, the Importer defaults to
`gpt-4o-mini`. It is independent of `chat_model` and has to name a
vision-capable model that the endpoint above can serve.

Description calls go through the same OpenAI-compatible chat path as the rest of
the pipeline, so they honor the chat token-budget and Responses API settings
described in the
[LLM Configuration guide](llm-configuration.md#token-budget-for-chat-models).

## Performance considerations

- **Descriptions cost one LLM call per image.** An image-dense corpus multiplies
  the number of chat calls an import makes. Leave `process_images` at `false`
  when you only need the references.
- **Embeddings add an embedding request covering the semantic units of the
  import.** Enable `enable_semantic_unit_embeddings` when you intend to search
  semantic units, not by default.

## Next Steps

- **[View all parameters](reference/parameters.md)**: Explore other configuration options.
- **[Verify your import](verify-and-explore.md)**: Check the created SemanticUnits collection.
- **[Import more files](importing-files.md)**: Start importing more documents with semantic units enabled.
