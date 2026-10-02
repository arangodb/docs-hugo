---
title: Document conversion and the File Parser
menuTitle: Document Conversion
weight: 30
description: >-
  How the File Parser turns PDF, Office, and text files into the Markdown that
  AutoGraph and the Importer work with, what it extracts from each format, and
  how to size it on a self-hosted cluster
aliases:
  - /agentic-ai-suite/importer/setup/
  - /agentic-ai-suite/importer/quickstart/
---
{{< tag "Agentic AI Suite" >}}

Neither the AutoGraph corpus build nor the [Importer](importer/_index.md) parses
documents itself. Both hand every input that is not already plain text or
Markdown to the internal **File Parser service**, which converts it to
Markdown. This page describes what the parser accepts, what it extracts from
each format, and how to tune it for a self-hosted deployment.

## Document conversion and supported formats

The File Parser converts a document to Markdown and, where applicable, extracts
the embedded images together with the text surrounding each one (if requested).
The Importer then chunks that Markdown and builds the knowledge graph from it.

The File Parser is a data platform service installed once per environment.
It has no web interface and you do not call it directly.
[AutoGraph](_index.md#supported-file-formats) uses the same service
for its corpus build, so both paths accept the same inputs. The Markdown they
get back differs: a corpus build only needs enough text to cluster a document,
so it requests a truncated sample and never images, whereas an import converts
the document in full.

### Format support

Text extraction is what the knowledge graph is built from, and it is reliable
for everything below. What varies between formats is image extraction, so check
the last column before you rely on [semantic units](importer/semantic-units.md) for a
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
Deployments on the [Arango Managed Platform (AMP)](../../../amp/_index.md) run
these defaults unchanged. For self-hosted clusters, the settings below are the
most relevant ones to adjust limits and resource utilization.

| Setting | Default | When to change it |
|---------|---------|-------------------|
| `workerPdf.replicas`, `workerDefault.replicas` | 3 worker pods per tier (PDF, other) | PDF workers consume considerably more resources than the default workers. Lower it if the node pool has fewer CPUs than the fleet would claim; raise it for large ingestion batches on a bigger pool. |
| `workerPdf.resources.limits.memory` | 6Gi | The memory limit is the PDF parse memory envelope. Raise it if large or image-dense PDFs fail with a resource error. |
| `workerPdf.resources.limits.cpu` | 4 | The CPU limit caps how much parallel work a single PDF worker pod can do. Raise it to speed up the parsing of large documents; lower it if the node pool cannot satisfy the total request across all replicas. |

Consider the combined resource footprint of the PDF workers. With the default
settings, three PDF worker pods request 3 CPUs and 12 GiB of memory in total,
and are limited to 12 CPUs and 18 GiB. The node pool must satisfy the requests
for the pods to be scheduled, and the limits for all three to run at full
capacity at the same time. Adjust the replica count and the per-pod limits
together, based on the resources available in your cluster.

The worker resource limits are defined at deploy time of the service.
Changing them in an active system is discouraged as it may have adverse effects
on other components.

{{< comment >}}
TODO: Once more tuning options have been tested and are considered public, we can add them here

| `FPS_MAX_FILE_SIZE_BYTES` | 104857600 (100 MB) | Raise it if your corpus contains larger single documents. |

everything prefixed with `FPS_` is a service setting, and values for those must be quoted strings.

overrides:
  config:
    FPS_MAX_FILE_SIZE_BYTES: "..."
{{< /comment >}}

#### Applying values

The File Parser is installed once per environment as the `arangodb-file-parser`
data platform service. Put your values in that service's `overrides` block in
the platform package (`platform.yaml`), the same file you install the
data platform with, and apply the configuration using
[`arangodb_operator_platform package install`](../../install-and-upgrade/online-setup.md#step-7-install-the-contextual-data-platform-package):

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

## Related

- [The AutoGraph service](_index.md#supported-file-formats): The formats the
  corpus build accepts.
- [The Importer](importer/_index.md): The worker that consumes the converted
  Markdown.
- [Semantic Units](importer/semantic-units.md): What the Importer does with the
  extracted images.
- [Install and upgrade](../../install-and-upgrade/_index.md): Where the
  platform package lives.
