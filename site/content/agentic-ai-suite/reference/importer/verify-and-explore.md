---
title: Verify Imports and Explore Collections
menuTitle: Verify and Explore Collections
description: >-
  Verify import status and understand the ArangoDB collections created by the Importer
weight: 50
---

{{< info >}}
**Getting Started Path:** [Overview](./) → [Configure LLMs](llm-configuration.md) → [Import Files](importing-files.md) → [Semantic Units](semantic-units.md) (optional) → **Verify Results**
{{< /info >}}

## Verifying the Import

After importing your documents, you can verify the state of the import process through 
multiple methods.

### Using the API

You can verify the state of the import process via the following endpoint:

```
GET /ai/v1/project_by_name/<your_project>
```

For example, the `status` object found within `importerServices` may contain the following
properties:

```json
"status": {
    "status": "service_completed",
    "progress": 100,
    "message": ""
}
```

### Using ArangoDB Web Interface

Alternatively, you can also see if the import was successful by checking your ArangoDB database:

1. Connect to your ArangoDB instance.
2. Navigate to the specified database.
3. Verify that the following collections exist (where `{project_name}` is your project name):
   - `{project_name}_Documents`: Contains the original documents that were processed
   - `{project_name}_Chunks`: Contains text chunks extracted from documents
   - `{project_name}_Entities`: Contains entities extracted from the text
   - `{project_name}_Communities`: Contains thematic clusters of related entities
   - `{project_name}_Relations`: Edge collection containing relationships between nodes
   - `{project_name}_SemanticUnits`: Contains semantic units like images (only if `enable_semantic_units` is `true`)
   - Graph named `{project_name}_kg`: The graph structure connecting all collections

## What ArangoDB Collections Look Like After Import

The Importer creates several collections in ArangoDB to store different
aspects of your knowledge graph. See below a detailed explanation of each
collection. All collections are using the name of your project as a prefix.

### Documents Collection

- **Collection type**: Vertex collection.
- **Purpose**: Stores the original text documents that were processed.
- **Key Fields**:
  - `_key`: Unique identifier for the document.
  - `content`: The full text content of the document.
  - `file_name` (multi-file imports only): Original filename of the document.
  - `citable_url` (multi-file imports only): URL to be cited in inline citations.
  - `partition_id`: The partition the document belongs to.
- **Usage**: Acts as the root level container for all document-related data.

{{< info >}}
When using [multi-file imports](importing-files.md#multi-file-import), the `file_name`
and `citable_url` fields are stored in the Documents collection, allowing you to track
which file each document came from and provide citable URLs for inline citations at
retrieval. Single file imports do not include these fields.
{{< /info >}}

### Chunks Collection

- **Collection type**: Vertex collection.
- **Purpose**: Stores text chunks extracted from documents for better processing and analysis.
- **Key Fields**:
  - `_key`: Unique identifier for the chunk.
  - `content`: The text content of the chunk.
  - `tokens`: Number of tokens in the chunk.
  - `chunk_order_index`: Position of the chunk in the original document.
  - `partition_id`: The partition the document belongs to.
- **Usage**: Enables granular analysis of document content and maintains document structure.

### Entities Collection

- **Collection type**: Vertex collection.
- **Purpose**: Stores entities extracted from the text, such as persons, organizations, concepts, etc.
- **Key Fields**:
  - `_key`: Unique identifier for the entity.
  - `entity_name`: Name of the entity.
  - `entity_type`: Type of entity (e.g., person, organization).
  - `description`: Description of the entity.
  - `embedding`: Vector representation of the entity for similarity search.
  - `clusters`: Community clusters the entity belongs to.
  - `partition_id`: The partition the document belongs to.
- **Usage**: Enables entity-based querying and semantic search.

### Communities Collection

- **Collection type**: Vertex collection.
- **Purpose**: Stores thematic clusters of related entities that form meaningful
  communities within your documents. Each community represents a cohesive group
  of concepts, characters, or themes that are closely related and interact with
  each other. These communities help identify and analyze the main narrative
  threads, character relationships, and thematic elements in your documents.
- **Key Fields**:
  - `_key`: Unique identifier for the community.
  - `title`: Cluster ID to which this community belongs to.
  - `report_string`: A detailed markdown-formatted analysis that explains the
    community's theme, key relationships, and significance. This includes
    sections on main characters, their roles, relationships, and the impact of key events or locations.
  - `report_json`: Structured data containing:
    - `title`: The main theme or focus of the community.
    - `summary`: A concise overview of the community's central narrative.
    - `rating`: A numerical score indicating the community's significance (the higher, the better).
    - `rating_explanation`: Justification for the rating.
    - `findings`: An array of detailed analyses, each containing a summary and explanation of key aspects.
  - `level`: The hierarchical level of the community (e.g., `1` for top-level communities).
  - `occurrence`: A normalized score (ranging from `0` to `1`) showing the relative frequency with which this community is mentioned or identified throughout your documents. A value close to 1 means this community is very common in your data and a value near `0` means it is rare.
  - `sub_communities`: References to more specific sub-communities that are part of this larger community.
  - `embedding`: Vector representation of the community for similarity search (when `enable_community_embeddings` is `true`).
  - `partition_id`: The partition the document belongs to.
- **Usage**: Enables you to:
  - Identify and analyze major narrative threads and themes.
  - Understand complex relationships between characters and concepts.
  - Track the significance and impact of different story elements.
  - Navigate through hierarchical relationships between themes.
  - Discover patterns and recurring elements in your documents.

### Relations Collection

- **Collection type**: Edge collection.
- **Purpose**: Stores relationships between different nodes in the graph.
- **Key Fields**:
  - `_from`: Source node reference.
  - `_to`: Target node reference.
  - `type`: Type of relationship (e.g., **PART_OF**, **MENTIONED_IN**, **RELATED_TO**, **IN_COMMUNITY**).
  - Additional metadata depending on relationship type (Entity to Entity):
    - `weight`: Relationship strength (the higher, the better).
    - `description`: Description of the relationship.
    - `source_id`: Source of the relationship.
    - `order`: Order of the relationship.
  - `partition_id`: The partition the document belongs to.
- **Usage**: Enables traversal and analysis of relationships between different elements.

### Semantic Units Collection

- **Collection type**: Vertex collection.
- **Purpose**: Stores semantic units extracted from documents, including image
  references and web URLs. This collection is only created when `enable_semantic_units`
  is set to `true`.
- **Key Fields**:
  - `_key`: Unique identifier for the semantic unit.
  - `type`: Type of semantic unit (always "image" for image references).
  - `image_url`: URL or reference to the image/web resource.
  - `is_storage_url`: Boolean indicating if the URL is a storage URL (base64/S3) or web URL.
  - `import_number`: Import batch number for tracking.
  - `source_chunk_id`: Reference to the chunk where this semantic unit was found.

{{< info >}}
Learn more about semantic units in the [Semantic Units guide](semantic-units.md).
{{< /info >}}

## Understanding Relationship Types

The system creates several types of relationships between nodes:

1. **PART_OF**: Links chunks to their parent documents.
2. **MENTIONED_IN**: Connects entities to the chunks where they are mentioned.
3. **RELATED_TO**: Shows relationships between different entities.
4. **IN_COMMUNITY**: Associates entities with their community groups.

### Relationship Diagram

```
Document
  └─[PART_OF]─> Chunk
                  └─[MENTIONED_IN]─> Entity
                                       ├─[RELATED_TO]─> Entity
                                       └─[IN_COMMUNITY]─> Community
```

## Vector Search Capabilities

The system automatically creates vector indexes on the `embedding` field in collections where embeddings are enabled (Entities, Chunks, Edges, and Communities), enabling:
- Semantic similarity search
- Nearest neighbor queries
- Efficient vector-based retrieval

These vector indexes are automatically configured and optimized for the embedding model 
you selected during [LLM configuration](llm-configuration.md). You can customize the vector 
index behavior using parameters like `vector_index_metric`, `vector_index_use_hnsw`, and 
`vector_index_n_lists`. See the [Parameters guide](parameters.md#vector-index-configuration) 
for more details.

## Next Steps

Now that you've successfully imported and verified your knowledge graph:

- **Query your data**: Use the [Retriever service](../retriever.md) to perform semantic search and retrieval
- **Visualize relationships**: Explore your graph using the [Graph Visualizer](../../../data-platform/graph-visualizer.md)
- **Import more documents**: Return to the [Import Files guide](importing-files.md) to add more data
- **Optimize parameters**: Review the [Parameters guide](parameters.md) to fine-tune your imports

