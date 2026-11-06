// Static file server for the built site, like Netlify for what the tests need:
// directory URLs serve index.html, URLs without a trailing slash redirect to
// it, and unknown paths serve 404.html with status 404.
//
// Usage: node serve.js [site-dir] [port]

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(process.argv[2] || path.join(__dirname, "../../site/public"));
const port = Number(process.argv[3] || process.env.PORT || 8090);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
};

if (!fs.existsSync(path.join(root, "index.html"))) {
  console.error(`No built site in ${root}, build it first (see README.md)`);
  process.exit(1);
}

function send(res, status, file) {
  res.writeHead(status, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch (e) {
    pathname = url.pathname;
  }
  const file = path.join(root, pathname);
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  let stat = fs.statSync(file, { throwIfNoEntry: false });
  if (stat && stat.isDirectory()) {
    if (!pathname.endsWith("/")) {
      res.writeHead(301, { Location: pathname + "/" + url.search }).end();
      return;
    }
    const index = path.join(file, "index.html");
    if (fs.existsSync(index)) {
      send(res, 200, index);
      return;
    }
    stat = null;
  }
  if (stat) {
    send(res, 200, file);
  } else {
    send(res, 404, path.join(root, "404.html"));
  }
}).listen(port, "127.0.0.1", () => console.log(`Serving ${root} on http://127.0.0.1:${port}/`));
