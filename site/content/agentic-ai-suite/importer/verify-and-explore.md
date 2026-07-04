---
title: Verify Imports and Explore Collections
menuTitle: Verify and Explore Collections
description: >-
  Verify that an import succeeded and inspect the resulting ArangoDB collections
weight: 60
---

After an import finishes, you can confirm success and inspect the resulting
knowledge graph in two ways: through the Importer / platform APIs, and
directly in your ArangoDB database.

For the schema of each collection (Documents, Chunks, Entities, Communities,
Relations, SemanticUnits), the relationship-type diagram, and the vector
indexes that are created, see [Architecture](architecture.md).

## Verifying via the API

### Project status

You can verify the state of the Importer service deployed for a project via
the Arango Control Plane (ACP):

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/project_by_name/{project_name}" >}}

The `status` object inside `importerServices` looks like this when the
import completes successfully:

```json
"status": {
    "status": "service_completed",
    "progress": 100,
    "message": ""
}
```

For the full list of status values and what they mean, see
[Architecture](architecture.md#asynchronous-import-lifecycle) and
[Error Handling](reference/error-handling.md#asynchronous-failure-markers).

### Multi-file job status

When you submitted the import via `POST /v1/import-multiple`, you can poll
the job directly:

{{< endpoint "GET" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/{serviceIdPostfix}/v1/jobs/{job_id}" >}}

See [Monitoring jobs](importing-files.md#monitoring-jobs) for details.

## Verifying via the ArangoDB web interface

1. Connect to your ArangoDB instance.
2. Navigate to the database where the Importer wrote.
3. Confirm the following collections exist (where `{project_name}` is your
   project name):
   - `{project_name}_Documents` - original documents.
   - `{project_name}_Chunks` - text chunks.
   - `{project_name}_Entities` - extracted entities (Full GraphRAG only).
   - `{project_name}_Communities` - thematic clusters (Full GraphRAG only).
   - `{project_name}_Relations` - edge collection.
   - `{project_name}_SemanticUnits` - present only if `enable_semantic_units`
     was set to `true`.
4. Confirm that the graph `{project_name}_kg` exists and contains the vertex
   and edge definitions above.

## Querying the knowledge graph

Once collections are populated, you can:

- Run [AQL queries](../../arangodb/3.12/aql/) directly against the collections.
- Traverse the graph using ArangoDB's graph functions.
- Filter by `partition_id` to scope queries to a specific partition.
- Use the [Retriever service](../retriever/) for question-answering with
  citations against the imported documents.

## Next steps

- **Query your data**: Use the [Retriever service](../retriever/) for
  semantic search and Q&A.
- **Visualize relationships**: Explore your graph with the
  [Graph Visualizer](../../platform-suite/graph-visualizer.md).
- **Import more documents**: Return to [Import Files](importing-files.md) to
  add more data.
- **Optimize parameters**: Review the
  [Parameter Reference](reference/parameters.md) to fine-tune your imports.
