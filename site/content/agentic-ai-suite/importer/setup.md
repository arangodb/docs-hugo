---
title: Set up the Importer
menuTitle: Setup
weight: 10
description: >-
  Prerequisites, installation, and first import call for the Importer service
aliases:
  - /agentic-ai-suite/importer/quickstart/
---
The Importer service is available in the Arango Contextual Data Platform
through two interfaces:

- **Web interface**: A guided workflow for configuring and running the
  Importer step by step. See the
  [Contextual Data Platform web interface](../graphrag/web-interface.md).
- **HTTP API**: Full programmatic control over the Importer pipeline.

{{< tip >}}
Both interfaces produce the same result: a knowledge graph in your ArangoDB
database. Choose the web interface for a guided experience or the API for
automation.
{{< /tip >}}

## Document conversion and supported formats

The Importer does not parse documents itself. Every input that is not already
plain text or Markdown is handed to the internal **File Parser service**, which
converts it to Markdown and, where applicable, extracts the embedded images
together with the text surrounding each one (if requested). The Importer then
chunks that Markdown and builds the knowledge graph from it.

The File Parser is a data platform service installed once per environment.
It has no web interface and you do not call it directly.
[AutoGraph](../autograph/setup.md#supported-file-formats) uses the same service
for its corpus build, so both paths accept the same inputs and produce the same
Markdown.

### Format support

Text extraction is what the knowledge graph is built from, and it is reliable
for everything below. What varies between formats is image extraction, so check
the last column before you rely on [semantic units](semantic-units.md) for a
given document type.

| Format | Text | Images and media |
|--------|------|------------------|
| PDF (digital, scanned, mixed) | Full, including OCR for scanned pages | Embedded images extracted with position and surrounding text |
| DOCX, PPTX | Full | Embedded raster images extracted with position. Also see the note below |
| DOC, PPT | Full. Converted internally to the modern Office format first | Same as DOCX, PPTX |
| Markdown, TXT | Full | Not applicable |

Where images are extracted, each one is stored as a separate artifact and
referenced at its position in the Markdown, together with the text surrounding
it. That is what the Importer turns into semantic units.

{{< info >}}
**Vector graphics in Office documents**: Word and PowerPoint documents may
contain charts, drawn shapes, SmartArt, and other kinds of graphics that are not
raster images. Only raster images are extracted, vector graphics are ignored.
{{< /info >}}

Documents that legitimately contain no extractable text, such as a blank page,
succeed with empty content and a warning rather than failing.

### Tuning the File Parser for self-hosted deployments

The File Parser ships with defaults sized for a reference data platform deployment.
Deployments on the [Arango Managed Platform (AMP)](../../amp/_index.md) run
these defaults unchanged. For self-hosted clusters, the settings below are the
most relevant ones to adjust limits and resource utilization.

| Setting | Default | When to change it |
|---------|---------|-------------------|
| `workerPdf.replicas`, `workerDefault.replicas` | 10 worker pods per tier (PDF, other) | Lower it if the node pool has fewer CPUs than the fleet would claim; raise it for large ingestion batches on a bigger pool. |
| `workerPdf.resources.limits.memory` | 6Gi | The memory limit is the PDF parse memory envelope. Raise it if large or image-dense PDFs fail with a resource error. |

The worker resource limits are defined at deploy time of the service.
Changing them in an active system is discouraged as it may have adverse effects
on other components.

<!-- TODO: Once more tuning options have been tested and are considered public, we can add them here

| `FPS_MAX_FILE_SIZE_BYTES` | 104857600 (100 MB) | Raise it if your corpus contains larger single documents. |

everything prefixed with `FPS_` is a service setting, and values for those must be quoted strings.

overrides:
  config:
    FPS_MAX_FILE_SIZE_BYTES: "..."
-->

#### Applying values

The File Parser is installed once per environment as the `arangodb-file-parser`
data platform service. Put your values in that service's `overrides` block in
the platform package (`platform.yaml`), the same file you install the
data platform with, and apply the configuration using
[`arangodb_operator_platform package install`](../../contextual-data-platform/install-and-upgrade/online-setup.md#step-7-install-the-contextual-data-platform-package):

```yaml
  arangodb-file-parser:
    package: arangodb-file-parser
    overrides:
      workerPdf:
        replicas: 5
        resources:
          limits:
            memory: 8Gi
      workerDefault:
        replicas: 15
```

The package is the right place for anything you want to keep: it is re-applied
on every install and survives upgrades. Editing the running service directly
with `kubectl edit arangoplatformservice arangodb-file-parser` takes effect
immediately and is fine while you experiment, but the next package install
replaces it. Changing a value restarts the pods, and workers finish the job
they are on before stopping.

#### Checking what is applied

The pods log their effective non-default settings on startup, which is the
quickest way to confirm a change landed:

```sh
kubectl logs -n <namespace> -l app.kubernetes.io/instance=arangodb-file-parser --tail=20
```

A setting name that does not exist is reported as a warning there rather than
failing silently, so a typo is visible in the first log after a restart. To see
the full applied set instead, read the service's rendered configuration:

```sh
kubectl get cm arangodb-file-parser-config -n <namespace> -o yaml
```

If jobs queue for a long time, the fleet is too small: raise `workerPdf.replicas`
/ `workerDefault.replicas`, or give the pool more CPU. If jobs fail with resource
or timeout errors, the per-job limits are too tight for your documents.

## Prerequisites

- **Arango Contextual Data Platform 4.0+** (which ships with **ArangoDB
  3.12.9** or later).
- **LLM and embedding API access** (OpenAI-compatible or Triton-compatible
  endpoints).
- **Valid JWT** for the API (`Authorization: Bearer ...`).
- A **GraphRAG project** in the target database. Projects keep datasets and
  configurations isolated from each other. For instructions, see the
  [Projects](../../platform-suite/control-plane-acp/_index.md#projects) section in
  the Arango Control Plane (ACP) documentation.

{{< warning >}}
Because the project name is used as a prefix for ArangoDB collection names,
it must conform to ArangoDB naming rules:
- Must start with a letter or underscore.
- May only contain letters, digits, underscores (`_`), or hyphens (`-`).
- Must not exceed 256 characters (including suffixes such as `_Documents`).

If the project name is not set, the service falls back to `default_project`.
An invalid name is not validated at startup and causes collection creation
to fail at runtime.
{{< /warning >}}

## Installation

To install and start the Importer service, use the following endpoint:

{{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/_platform/acp/v1/graphragimporter" >}}

This endpoint is part of the Arango Control Plane (ACP) service, which
manages the lifecycle of all AI services in the platform. For detailed
installation, monitoring, and lifecycle management instructions, see the
[Arango Control Plane (ACP)](../../platform-suite/control-plane-acp/_index.md)
documentation.

## Get started

{{< tabs "importer-setup" >}}

{{< tab "Web Interface" >}}
The web interface lets you configure and run the Importer through a guided
workflow.

1. Navigate to **Agentic AI Suite** > **GraphRAG** in the sidebar.
2. Create a new project and upload your documents.
3. Configure your LLM provider and import settings.
4. Run the import and inspect the resulting knowledge graph.

For the full walkthrough, see the
[GraphRAG web interface](../graphrag/web-interface.md) guide.
{{< /tab >}}

{{< tab "HTTP API" >}}
You reach the Importer through the platform's API gateway on port `8529`,
which routes requests to the service (internally listening on port `8080`).
Always call the public `:8529` endpoint shown in the examples below. The
recommended call sequence is:

1. **Configure your LLM provider** at install time.
   See [LLM Configuration](llm-configuration.md).
2. **Submit an import**:
   {{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/{serviceIdPostfix}/v1/import" >}}
   or for a batch:
   {{< endpoint "POST" "https://<EXTERNAL_ENDPOINT>:8529/graphrag/importer/{serviceIdPostfix}/v1/import-multiple" >}}
3. **Monitor progress** via the platform service status (single-file imports)
   or by polling `GET /v1/jobs/{job_id}` (multi-file imports).
4. **Verify the result** in your ArangoDB database.

Authentication uses JWT Bearer tokens. For full endpoint documentation,
see the [Reference](reference/_index.md).
{{< /tab >}}

{{< /tabs >}}

## Learn more

- [Architecture](architecture.md): Knowledge graph collections, vector
  indexes, and the async-job lifecycle.
- [LLM Configuration](llm-configuration.md): Choose and configure your
  chat and embedding providers.
- [Import Files](importing-files.md): Single-file and multi-file imports
  with examples.
- [AutoGraph Integration](autograph-integration.md): How the Importer is
  driven by AutoGraph for multi-partition builds.
- [Reference](reference/_index.md): HTTP endpoints, parameters, and
  error handling.
