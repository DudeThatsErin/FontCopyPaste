/* Static server for the built React app, run under pm2 behind nginx.
 * Dependency-free on purpose — it only has to hand out dist/. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const PORT = process.env.PORT || 5183;
const HOST = process.env.HOST || '127.0.0.1';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.woff2': 'font/woff2'
};

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let file = path.join(ROOT, decodeURIComponent(url.pathname));

  /* Refuse anything that escapes dist/ via ../ traversal. */
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(ROOT, 'index.html');
  }

  const ext = path.extname(file);
  /* Vite fingerprints assets, so they're safe to cache hard; index.html must
   * always be revalidated or a new build stays invisible. */
  const cache = file.endsWith('index.html')
    ? 'no-cache'
    : 'public, max-age=31536000, immutable';

  res.writeHead(200, {
    'Content-Type': TYPES[ext] || 'application/octet-stream',
    'Cache-Control': cache
  });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, HOST, () => {
  console.log(`fonts.erinskidds.com serving ${ROOT} on http://${HOST}:${PORT}`);
});
