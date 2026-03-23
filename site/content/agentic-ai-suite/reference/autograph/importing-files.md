---
title: Import Files into Corpus Graph
menuTitle: Import Files
description: >-
  Upload multiple files into the corpus graph with module organization
weight: 20
---

## Overview

The import endpoint allows you to upload multiple files into the AutoGraph corpus. Files can be organized using module labels, which help group related documents together for analysis and processing.

Unlike the [Importer service](../importer/importing-files.md) which directly builds knowledge graphs, AutoGraph's import endpoint:
- Stores files in a corpus collection for later analysis
- Supports module-based organization
- Enables batch processing across multiple modules
- Allows incremental corpus updates

## Before you start

Before importing files, make sure you've completed these steps:

1. **Create a GraphRAG project**
   Learn how to [create and manage projects](../../../platform-suite/control-plane-acp.md#projects).

2. **Install the AutoGraph service**
   Deploy the service using the `/v1/AutoGraph` endpoint. See
   [The Arango Control Plane (ACP) service](../../../platform-suite/control-plane-acp.md)
   documentation for installation instructions.

3. **Verify service health**
   Check that the service is running using the health check endpoint.

## Import multiple files

{{< endpoint "POST" "/v1/import-multiple" >}}

## Request Parameters

### `files` (required)

An array of file objects to import. Each file object contains:

- `doc_name` (required): Document name or identifier
- `content` (required): File content as bytes (can be text or binary)
- `citable_url` (optional): URL to be cited in inline citations
- `metadata` (optional): Flexible metadata string (user-defined format, e.g., JSON)

### `module` (required)

A module label for this batch of files (e.g., "legal", "marketing", "technical").

Modules help organize documents into logical groups that can be:
- Processed together during corpus builds
- Updated incrementally without affecting other modules
- Analyzed separately for domain-specific RAG strategies

## Request Example

```bash
curl -X POST https://<your-platform-url>/v1/import-multiple \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      {
        "doc_name": "product_specs.pdf",
        "content": "'$(base64 -i product_specs.pdf)'",
        "citable_url": "https://docs.example.com/products/specs",
        "metadata": "{\"department\": \"engineering\", \"version\": \"2.1\"}"
      },
      {
        "doc_name": "user_manual.md",
        "content": "'$(base64 -i user_manual.md)'",
        "citable_url": "https://docs.example.com/manuals/user",
        "metadata": "{\"department\": \"documentation\", \"language\": \"en\"}"
      }
    ],
    "module": "technical"
  }'
```

## Response Fields

- `success` (boolean): Whether the operation succeeded
- `message` (optional, string): Success or error summary message
- `error_message` (optional, string): Detailed error message if `success` is false

## Module Organization Strategy

### Single Module Approach

Import all documents into one module for simple use cases:

```bash
curl -X POST https://<your-platform-url>/v1/import-multiple \
  -H "Content-Type: application/json" \
  -d '{
    "files": [...],
    "module": "all_docs"
  }'
```

### Multi-Module Approach

Organize documents by domain, department, or content type:

```bash
# Import legal documents
curl -X POST https://<your-platform-url>/v1/import-multiple \
  -H "Content-Type: application/json" \
  -d '{
    "files": [...],
    "module": "legal"
  }'

# Import marketing content
curl -X POST https://<your-platform-url>/v1/import-multiple \
  -H "Content-Type: application/json" \
  -d '{
    "files": [...],
    "module": "marketing"
  }'
```

{{< tip >}}
Use descriptive module names that reflect your content organization. Modules can be processed independently during corpus builds, enabling incremental updates and parallel processing.
{{< /tip >}}

## File Content

The `content` field accepts file content as bytes. Files should be encoded appropriately before sending.

## Metadata Field

The `metadata` field is optional and accepts a flexible string format that you can define based on your needs. The field is user-defined and can store any string data relevant to your documents.

## Next Steps

- **[Create Corpus Build](corpus-build.md)**: Analyze and cluster your imported documents
- **[Monitor Build Status](corpus-build.md#monitoring-build-status)**: Track corpus build progress
