---
title: AutoGraph Limitations
menuTitle: Limitations
description: >-
  Known limitations of the AutoGraph service, covering file uploads and processing
weight: 65
---
This page collects the known limitations of the AutoGraph service. They apply
to every client of the API, including the AutoGraph Studio web interface, which
is built on top of it.

## File uploads and processing

The API performs no checks when files are uploaded. Neither the file format
nor the file size is validated, and files are stored successfully regardless.
All restrictions are applied later, by the platform, during the corpus build,
and a file that cannot be processed is dropped at that point rather than
rejected on upload.

Note the following in particular:

- **No format check**: The parser identifies a file by its contents rather
  than by its name. Formats other than the [supported ones](../setup.md) are
  parsed and imported without complaint, although no downstream stage is
  designed or tested for them.
- **No size check**: A file that exceeds the maximum size is stored
  successfully and is only dropped once the build reaches it.
- **No chunked or resumable uploads**: Each file has to be transferred in a
  single request, base64-encoded in the `content` field of
  [`POST /v1/import-multiple`](importing-files.md).

### Files dropped from the build

In each of the following cases, the file is dropped from the corpus, the
remaining files continue to be processed, and the build finishes with the
status `completed`.

The build status carries the code `FILE_PARSER_PARTIAL_FAILURE` together
with a message listing the IDs of the dropped files. To detect dropped
files, poll `GET /v1/corpus/builds/{id}` and evaluate this message, as the
build itself is reported as successful.

| Case | What happens | Code |
|---|---|---|
| Files larger than 100 MiB | The file size is read from the storage metadata before the file is downloaded. | `FILE_TOO_LARGE` |
| Blank or content-free files | The file is parsed successfully but yields no text, and is then dropped from the corpus and counted with the other dropped files. Empty documents, blank scans, and slide decks of photos without words all fall into this category, as does a document whose only text is a single line repeated on every page, which is recognized as a running header and removed. | No parser code. Counted as a dropped file. |
| Very large scanned PDFs | When the file is opened, an estimate of the processing time is computed from a fixed setup cost, a per-page cost for every page without a text layer, weighted by the image density measured in the document, and a smaller per-page cost for every page that has one. The file is dropped if the estimate exceeds the processing-time budget of six hours. Densely scanned documents reach the budget at roughly half the page count of ordinary ones. | `PARSE_LIMIT_EXCEEDED` |
| Very large digital PDFs | The processing-time estimate consists of the fixed setup cost plus a per-page cost for every page carrying a text layer, and the file is dropped if it exceeds the same six-hour budget. As pages with a text layer are inexpensive, only extremely long documents are affected. This cost is applied on full GraphRAG builds. On vector-only builds, digital PDFs take a route with a flat budget, where the page count never causes a file to be dropped. | `PARSE_LIMIT_EXCEEDED` |
| PDFs with more than 100,000 pages | A cap on the page count, applied when the file is opened, independently of any time estimate. | `PARSE_LIMIT_EXCEEDED` |
| More than 200 images, or more than 512 MiB of images, in a single document | Applies only if image extraction is enabled. Both the image count and the total size accumulate while the file is parsed, so the limit is reached partway through and the file is dropped at that point rather than at the start. | `IMAGE_LIMIT_EXCEEDED` |
| Extracted text larger than 64 MiB | The importer drops a parsed document whose extracted text exceeds 64 MiB. The parser's own ceiling is higher, so the importer's limit is the one that applies. | `MARKDOWN_TOO_LARGE` |
| Files that exceed the staging budget | Each build has 256 MiB of on-disk staging space for downloaded files. Once it is exhausted, the files still awaiting download are skipped. | `STORAGE_FILE_TOO_LARGE` |

### Files imported with degraded content

The following cases never cause a failure. The file is imported, the build
succeeds, and the content is degraded. Except where noted, no warning and no
error is raised.

| Case | What happens |
|---|---|
| Scanned documents in a non-Latin script | Text recognition ships with English training data only. Scanned Japanese, Arabic, Hindi, or Russian documents produce unusable text, which is then added to the knowledge graph. Scans in a Latin script are recognized largely correctly, with degraded accents. Digital PDFs with a genuine text layer are unaffected in any language. |
| PowerPoint presentations consisting of diagrams | Charts, SmartArt, and drawn shapes are not read. Slide titles, body text, and native tables are read. |
| Word documents with content in charts | Text in charts and SmartArt is not read. Body text, tables, and embedded photographs are read. The chart itself is preserved as an extracted image if image extraction is enabled. |
| `.txt` and `.md` files in a legacy 8-bit encoding | ISO-8859-1 files retain their accented characters. Windows-1252 files lose their typographic quotation marks and dashes, which arrive as invisible control characters and are subsequently stripped. A warning that the file is not cleanly decodable is written to the service log. |

### Image extraction

Image extraction is available at the complexity levels `high` and
`very_high` and applies to FullGraphRAG clusters, for which it can be set
per cluster.

Enabling image extraction does not guarantee that images are extracted.
Whether a document releases its images is decided from a sample of at most
eight pages, and a document that fails this test returns none of its images,
on an otherwise successful parse and without a warning.

| Case | What happens |
|---|---|
| No figure covers 3% of its page | The parser only takes the route capable of extracting images if one of the sampled pages contains a single image covering at least 3% of that page's area. If none does, the entire document is processed as plain text on a route that extracts no images at all. As the threshold is a fraction of the page area, the same figure may clear it on a small page and miss it on a Letter page. Once a document qualifies, every image in it is extracted, including images far below the threshold. Requesting high fidelity does not change this behavior. |
| Figures on pages the parser does not sample | The parser examines at most eight pages when deciding how to process a document: the first three, plus five distributed evenly across the remainder. If every figure lies between the sampled pages and the sampled pages contain plain text only, the document is treated as having no images, and none are extracted from any page. Documents of eight pages or fewer are examined in full and are not affected. Requesting high fidelity does not change this behavior. |
| Images smaller than 32 pixels on a side | The images are discarded as decorative elements such as icons and bullets, together with the placeholder marking their position in the text. This applies to documents that did qualify for image extraction. |
