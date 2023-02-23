---
fileID: foxx-guides-files
title: File access in Foxx
weight: 1100
description: 
layout: default
---
Files within the service folder should always be considered read-only.
You should not expect to be able to write to your service folder or
modify any existing files.

ArangoDB is primarily a database. In most cases the best place to store data
is therefore inside the database, not on the file system.

## Serving files

The most flexible way to serve files in your Foxx service is to simply
pass them through in your router using
the [context object's `fileName` method](../reference/foxx-reference-context#filename) and
the [response object's `sendFile` method](../reference/routers/foxx-reference-routers-response#sendfile):

{{< tabs >}}
{{% tab name="js" %}}
```js
router.get("/some/filename.png", function(req, res) {
  const filePath = module.context.fileName("some-local-filename.png");
  res.sendFile(filePath);
});
```
{{% /tab %}}
{{< /tabs >}}

While allowing for greater control of how the file should be sent to
the client and who should be able to access it,
doing this for all your static assets can get tedious.

Alternatively you can specify file assets that should be served by your
Foxx service directly in the [service manifest](../reference/foxx-reference-manifest)
using the `files` attribute:

{{< tabs >}}
{{% tab name="json" %}}
```json
"files": {
  "/some/filename.png": {
    "path": "some-local-filename.png",
    "type": "image/png",
    "gzip": false
  },
  "/favicon.ico": "bookmark.ico",
  "/static": "my-assets-folder"
}
```
{{% /tab %}}
{{< /tabs >}}

## Writing files

It is almost always an extremely bad idea to attempt to modify
the filesystem from within a service:

- The service folder itself is considered an implementation artefact and
  **may be discarded and replaced without warning**.
  ArangoDB maintains a canonical copy of each service internally to
  detect missing or damaged services and restore them automatically.

- ArangoDB uses multiple V8 contexts to allow handling multiple
  Foxx requests in parallel. Writing to the same file in a request handler
  may therefore cause race conditions and **result in corrupted data**.

- Writing to files outside the service folder introduces external state. In
  a cluster this will result in Coordinators no longer being interchangeable.

- Writing to files during setup is unreliable because the setup script may
  be executed several times or not at all. In a cluster the setup script
  will only be executed on a single Coordinator.

Therefore it is almost always a better option to store files using a
specialized, external file storage service
and handle file uploads outside Foxx itself.

However in some cases it may be feasible to store smaller files directly in
ArangoDB documents by using a separate collection.


{{% hints/danger %}}
  Due to the way ArangoDB stores documents internally, you should not store
file contents alongside other attributes that might be updated independently.
Additionally, large file sizes will impact performance for operations
involving the document and may affect overall database performance.
{{% /hints/danger %}}


{{% hints/warning %}}
  In production, you should avoid storing any files in ArangoDB or handling file
uploads in Foxx. The following example will work for moderate amounts of small
files but is not recommended for large files or frequent uploads or
modifications.
{{% /hints/warning %}}

To store files in a document you can simply convert the file contents
as a `Buffer` to a base64-encoded string:

{{< tabs >}}
{{% tab name="js" %}}
```js
router.post('/avatars/:filename', (req, res) => {
  collection.save({
    filename: req.pathParams.filename,
    data: req.body.toString('base64')
  });
  res.status('no content');
});
router.get('/avatars/:filename', (req, res) => {
  const doc = collection.firstExample({
    filename: req.pathParams.filename
  });
  if (!doc) res.throw('not found');
  const data = new Buffer(doc.data, 'base64');
  res.set('content-type', 'image/png');
  res.set('content-length', data.length);
  res.write(data);
});
```
{{% /tab %}}
{{< /tabs >}}
