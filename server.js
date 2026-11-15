// Minimaler statischer Server ohne Abhängigkeiten (Docker / Hostinger / lokal).
// Liefert public/ aus und zusätzlich /data/normen.json aus dem Ordner data/.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = (p) => resolve(fileURLToPath(new URL(p, import.meta.url)));
const PUBLIC = here('./public');
const DATA = here('./data');
const PORT = Number(process.env.PORT) || 3000;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.webmanifest': 'application/manifest+json', '.json': 'application/json; charset=utf-8',
};

function safeJoin(root, p) {
  const full = normalize(join(root, p));
  return full === root || full.startsWith(root + sep) ? full : null;
}

export const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    const pathname = decodeURIComponent(url.pathname);
    if (pathname === '/healthz') { res.writeHead(200).end('ok'); return; }
    let path = pathname.startsWith('/data/') ? safeJoin(DATA, pathname.slice(6)) : safeJoin(PUBLIC, pathname);
    if (!path) { res.writeHead(403).end(); return; }
    if ((await stat(path).catch(() => null))?.isDirectory()) path = join(path, 'index.html');
    const body = await readFile(path);
    const ext = extname(path);
    res.writeHead(200, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' || ext === '.json' || path.endsWith('sw.js') ? 'no-cache' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Nicht gefunden');
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, () => console.log(`Normen-Übersicht läuft auf http://localhost:${PORT}`));
}
