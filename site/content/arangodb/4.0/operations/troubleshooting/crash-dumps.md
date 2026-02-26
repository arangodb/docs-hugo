---
title: The crash dumps feature of the ArangoDB server
menuTitle: Crash dumps
weight: 12
description: >-
  The _arangod_ server process can write diagnostic data to disk on crash and
  offers a management API for crash dumps
---
On crash, the server can write diagnostic data such as recent API calls and
AQL queries, a backtrace, and system info into separate files on disk (e.g.
`backtrace.txt`, `system_info.txt`, `ApiRecording.json`, `AsyncRegistry.json`).

This data can be helpful to analyze why _arangod_ encountered a fatal error
and you may want to share it with the Arango support and development teams.

You can disable the creation of crash dumps as well as the HTTP API for
managing crash dumps by setting the
[`--crash-handler.enable-dumps` startup option](../../components/arangodb-server/options.md#--crash-handlerenable-dumps)
to `false`.

## Crash dump location on disk

Each crash dump is saved to a new folder under a path like
`<database-directory>/crashes/<uuid>/`.

- The root path is controlled by the `--database.directory` startup option.
- The UUID is a randomly generated identifier like `281ac6d7-2e13-4554-b1ac-4ce619c9c03e`.

The most recent 10 crash dumps are kept. Older ones are removed at startup.

## API for managing crash dumps

The HTTP API for managing crash dumps has the following endpoints:

- `GET /_admin/crashes`: List all crash dump directory identifiers (UUIDs).
- `GET /_admin/crashes/{id}`: Get the contents of a specific crash dump as stored
  in `<database-directory>/crashes/<uuid>/` encoded in JSON.
- `DELETE /_admin/crashes/{id}`: Delete a specific crash dump.

**Example**

```bash
UUID=$(curl -sS http://localhost:8529/_admin/crashes | jq -r ".result | last // empty")
if [ -n "$UUID" ]; then
  curl -sS http://localhost:8529/_admin/crashes/$UUID
  curl -sS -XDELETE http://localhost:8529/_admin/crashes/$UUID
fi
```

See [HTTP interface for server administration](../../develop/http-api/administration.md#crash-dump-management)
for details.
