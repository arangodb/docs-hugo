---
title: AutoGraph Limitations
menuTitle: Limitations
description: >-
  Known limitations of the AutoGraph API
weight: 65
---
## File uploads and processing

The API performs no checks when files are uploaded, where as the data platform
web interface does. The API neither validates the file format nor the file size,
and files are stored successfully regardless.
All restrictions are applied later during the corpus build, and a file that
cannot be processed is dropped at that point rather than rejected on upload.

- **No format check**: The parser identifies a file by its contents rather
  than by its name. Formats other than the [supported ones](../setup.md) are
  parsed and imported without complaint, although no downstream stage is
  designed or tested for them.
- **No size check**: A file that exceeds the maximum size is stored
  successfully and is only dropped once the build reaches it.
- **No chunked or resumable uploads**: Each file has to be transferred to the
  [File Manager](../../../platform-suite/file-manager/_index.md) in a single
  `multipart/form-data` request.
- **Only one upload path**: Files reach a build through the File Manager, and a
  build selects them with the category labels in `categories`. Selecting them by
  `file_ids` still works but is deprecated in favor of `categories`. The
  direct upload with `POST /v1/import-multiple` is deprecated as well and cannot
  carry an upload on its own, as a call deletes what the previous one staged and
  a staged file only reaches the build if it also exists in the File Manager
  under an ID of its own. See [Import Files](importing-files.md).

### Files dropped from the build

In each of the following cases, the file is dropped from the corpus, the
remaining files continue to be processed, and the build finishes with the
status `completed`. The `GET /v1/corpus/builds/{id}` endpoint reports the build
as successful, and only the `error_code` and the `message` of the build status
reveal that files were dropped.

#### Files rejected by the parser

The `error_code` of the build is `FILE_PARSER_PARTIAL_FAILURE`. The `message`
names the first five rejected files in the form
`<filename> (ID: <id>): <error>`, and the error text carries the per-file code
of the following table. These per-file codes come from the parser and never
appear in `error_code` themselves.

| Case | What happens | Per-file code |
|---|---|---|
| Files larger than 100 MiB | The file size is read from the storage metadata before the file is downloaded. | `FILE_TOO_LARGE` |
| Password-protected files | The password cannot be supplied and the file is rejected as soon as it is opened. PDFs are recognized by the password error the PDF engine raises. Word, PowerPoint, and Excel files are recognized before their format is determined, as an encrypted Office document is wrapped in a legacy container carrying the encryption streams, including the modern `.docx`, `.pptx`, and `.xlsx` formats. OpenDocument files declare their encrypted parts in a manifest that remains readable. | `ENCRYPTED_FILE` |
| Files that cannot be opened | A PDF that the engine refuses to load, a `.docx`, `.pptx`, or EPUB file whose archive is damaged or whose mandatory parts are missing, and a legacy Office file whose container signature is gone. The damage is detected when the file is opened, so nothing of the file reaches the corpus. | `CORRUPTED_FILE` |
| UTF-16 or UTF-32 text files without a byte order mark | The format is determined from the first few kilobytes of the file. A byte order mark identifies the encoding, but without one, the null bytes of these encodings are indistinguishable from binary data, and the file is rejected before it is parsed. A byte order mark makes the file decode correctly. For the 8-bit legacy encodings, see [Files imported with degraded content](#files-imported-with-degraded-content). | `UNSUPPORTED_FORMAT` |
| Blank or content-free files | The file is parsed successfully but yields no text, and is then dropped from the corpus and counted with the other dropped files. Empty documents, blank scans, and slide decks of photos without words all fall into this category, as does a document whose only text is a single line repeated on every page, which is recognized as a running header and removed. | None. The failure is reported as `document yielded no extractable content`. |
| Very large scanned PDFs | When the file is opened, the processing time is estimated from a fixed setup time plus a time for every page, and the file is dropped if the estimate exceeds the budget of six hours. A page that has to be read by text recognition, because it has no text layer, is estimated at ten times the processing time of a page that has one, so a fully scanned document reaches the budget at around 1,400 pages. The estimate rises further if the pages carry more image data than a single full-page scan, which is the case when several images are stacked on a page: at twice the image area, the budget is reached at around 700 pages. In a document that mixes scanned and digital pages, only the scanned pages are estimated at the higher per-page time. | `PARSE_LIMIT_EXCEEDED` |
| Very large digital PDFs | Every page carries a text layer and is therefore estimated at the low per-page time, so the same six-hour budget is only reached at around 14,000 pages. This estimate is applied on full GraphRAG builds. On vector-only builds, digital PDFs take a route with a flat budget, where the page count never causes a file to be dropped. | `PARSE_LIMIT_EXCEEDED` |
| PDFs with more than 100,000 pages | A cap on the page count, applied when the file is opened, independently of any time estimate. | `PARSE_LIMIT_EXCEEDED` |
| More than 200 images, or more than 512 MiB of images, in a single document | Applies only if image extraction is enabled. Both the image count and the total size accumulate while the file is parsed, so the limit is reached partway through and the file is dropped at that point rather than at the start. | `IMAGE_LIMIT_EXCEEDED` |
| Extracted text larger than 64 MiB | The importer drops a parsed document whose extracted text exceeds 64 MiB. The parser's own ceiling is higher, so the importer's limit is the one that applies. | `MARKDOWN_TOO_LARGE` |

#### Files skipped before parsing

Each build has 256 MiB of on-disk staging space for downloaded files by
default. The files are downloaded in waves: a wave fills the staging space and
stops, the files it downloaded are processed and then deleted, and the next
wave continues with the remaining files. Exhausting the staging space is thus
the normal course of a large build and drops nothing. A build of several
gigabytes fills and frees the space many times over.

A file is skipped only if a wave downloads nothing at all and no space can be
reclaimed, which in practice means a single file larger than the entire staging
space that can never fit. Such files never reach the parser and therefore have
no per-file code. The `error_code` of the build is `STORAGE_FILE_TOO_LARGE`,
and the `message` names the first five skipped files by File Manager ID.

If a build has rejected files as well as skipped files, then the `error_code`
is `FILE_PARSER_PARTIAL_FAILURE`, which takes precedence, and the `message`
carries both texts. Therefore, evaluate the `message` and not the `error_code`
alone.

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

At `high`, only the top 75% of the clusters are assigned FullGraphRAG, ranked
by the complexity of their content. The remaining clusters return no images
although image extraction is enabled. How many clusters this affects depends on
their total number because the cutoff is rounded, but it is roughly 25%.
At `very_high`, every cluster is a FullGraphRAG cluster and none are left out.

Enabling image extraction does not guarantee that images are extracted. A
document from which the parser can extract no image is imported without any, on
an otherwise successful parse and without a warning.

Images smaller than 32 pixels on a side are discarded as decorative elements
such as icons and bullets, together with the placeholder marking their position
in the text.
