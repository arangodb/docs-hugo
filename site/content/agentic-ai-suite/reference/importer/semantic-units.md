---
title: Process Images and Semantic Units
menuTitle: Semantic Units
description: >-
  Extract and process images, web URLs, and multimedia content from your documents
weight: 40
---

{{< info >}}
**Getting Started Path:** [Overview](./) → [Configure LLMs](llm-configuration.md) → [Import Files](importing-files.md) → **Semantic Units** → [Verify Results](verify-and-explore.md)
{{< /info >}}

## Overview

The Importer service includes advanced capabilities for processing multimedia
content and web references through semantic units. This feature allows you to
extract and analyze images, web URLs, and other semantic elements from your documents.

{{< tip >}}
Semantic units are optional and disabled by default. Enable them when you need to 
extract and process multimedia references from your documents.
{{< /tip >}}

## Configuration

The semantic units functionality is controlled by three related parameters that work 
hierarchically - each requires the previous one to be enabled.

### `enable_semantic_units`

- **Purpose**: Enables basic semantic unit processing.
- **Functionality**: Extracts web URLs and image references from markdown content.
- **Collection Created**: `{project_name}_SemanticUnits`.
- **Processes**: Only web URLs (https://, http://).
- **Stores**: `image_url`, `is_storage_url`, `source_chunk_id`, `import_number`.
- **Use Cases**:
  - Document analysis with web references.
  - Content auditing and link extraction.
  - Basic multimedia content tracking.

The default value is `false`.

### `process_images` 

- **Purpose**: Enables processing of storage URLs (base64/S3 images).
- **Functionality**:
  - When `false`: Only processes web URLs (https://, http://).
  - When `true`: Processes both web URLs AND storage URLs (base64/S3).
- **Requirements**: `enable_semantic_units` must be `true`.
- **Use Cases**:
  - Document analysis with embedded base64 images.
  - Processing S3 image references.
  - Complete URL extraction from documents.

The default value is `false` and requires `enable_semantic_units` to be set to `true`.

### `store_image_data`

- **Purpose**: Controls whether actual image data is stored for storage URLs.
- **Functionality**:
  - For web URLs: No effect (always stores only metadata).
  - For storage URLs: When `true`, stores the actual image data in the `image_data` field.
- **Requirements**: `process_images` must be `true`.
- **Use Cases**:
  - Offline access to base64-encoded images.
  - Data archival and backup.
  - Complete multimedia document storage.

The default value is `false` and requires `process_images` to be set to `true`.

## Examples

### Web URLs only

This configuration extracts only web-based image URLs (https:// and http://) from your markdown documents.

```json
{
  "file_content": "base64_encoded_content",
  "file_name": "document.md",
  "enable_semantic_units": true,
  "process_images": false,
  "store_image_data": false
}
```

In this example, the Importer extracts web image references from markdown syntax (like `![alt](https://example.com/image.jpg)`) and stores them in the `SemanticUnits` collection. Each entry includes the image URL, a flag indicating it's a web URL, and references to the source chunk. Base64 and S3 URLs are ignored.

### Storage URLs (metadata only)

This configuration processes both web URLs and storage URLs (base64/S3) but stores only the metadata.

```json
{
  "file_content": "base64_encoded_content",
  "file_name": "document.md",
  "enable_semantic_units": true,
  "process_images": true,
  "store_image_data": false
}
```

In this example, the Importer extracts all image references including base64-encoded images and S3 URLs. For each image, it stores the URL/reference and metadata in the `SemanticUnits` collection, but the actual image data is not stored. This keeps your database size smaller while maintaining references to all images.

### Storage URLs (with image data)

This configuration processes all image types and stores the actual image data for storage URLs.

```json
{
  "file_content": "base64_encoded_content",
  "file_name": "document.md",
  "enable_semantic_units": true,
  "process_images": true,
  "store_image_data": true
}
```

In this example, the Importer extracts all image references and stores complete information in the `SemanticUnits` collection. For web URLs, only metadata is stored. For base64 and S3 URLs, both the reference and the actual image data are stored in the `image_data` field, enabling offline access and complete document archival.

### Complete request

Here's a complete import request with semantic units enabled alongside other import parameters:

```bash
curl -X POST https://<your-platform-url>/v1/import \
  -H "Content-Type: application/json" \
  -d '{
    "file_content": "'$base64_content'",
    "file_name": "document.md",
    "chunk_token_size": 1200,
    "entity_types": ["person", "organization", "technology"],
    "enable_semantic_units": true,
    "process_images": true,
    "store_image_data": false
  }'
```

In this example, the Importer processes the markdown document by extracting entities (person, organization, technology), chunking the text into 1200-token segments, and extracting all image references (web URLs and storage URLs). The resulting Knowledge Graph includes entity nodes, relationships, and a `SemanticUnits` collection containing image metadata without storing the actual image data.

## Supported Content Types

The semantic units feature supports:

- **Web URLs**: `https://example.com/image.jpg`
- **Base64 Images**: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`
- **S3 URLs**: `s3://bucket/path/image.jpg`
- **Markdown Image Syntax**: `![Alt text](https://example.com/image.jpg)`

## Performance Considerations

### Size Guidelines

- **Small Documents** (< 1MB): All features enabled with minimal impact.
- **Medium Documents** (1-10MB): Consider disabling `store_image_data` for large images.
- **Large Documents** (> 10MB): Use `enable_semantic_units=true, process_images=false, store_image_data=false` for basic URL extraction.

### LLM Compatibility

The semantic units processing works with all LLM providers:
- **OpenAI**: GPT-4o, GPT-4o-mini (all models supported).
- **OpenRouter**: Gemini Flash, Claude Sonnet (all models supported).
- **Triton**: Mistral-Nemo-Instruct (all models supported).

## Next Steps

- **[View all parameters](parameters.md)**: Explore other configuration options.
- **[Verify your import](verify-and-explore.md)**: Check the created SemanticUnits collection.
- **[Import more files](importing-files.md)**: Start importing more documents with semantic units enabled.