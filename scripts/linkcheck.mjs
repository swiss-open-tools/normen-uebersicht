// Prüft alle url- und quelle.url-Links aus data/normen.json (HEAD, Fallback GET).
// Aufruf: node scripts/linkcheck.mjs [--json bericht.json]
// Exit 1, wenn mindestens ein Link definitiv kaputt ist (HTTP 404/410).
// Netzwerkfehler/Timeouts/403 (Bot-Schutz) werden nur gemeldet – das ist bei Behörden-Websites häufig.
import { readFile, writeFile } from 'node:fs/promises';

const data = JSON.parse(await readFile('data/normen.json', 'utf8'));
const urls = new Map();
for (const e of data.eintraege) for (const u of [e.url, e.quelle.url]) {
  if (!urls.has(u)) urls.set(u, []);
  urls.get(u).push(e.id);
}

async function check(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'normen-uebersicht-linkcheck/1.0 (+https://github.com/swiss-open-tools/normen-uebersicht)' } });
      if (method === 'HEAD' && (res.status === 405 || res.status === 403 || res.status === 501)) continue;
      return { status: res.status };
    } catch (err) {
      if (method === 'GET') return { status: 0, error: String(err.cause?.code || err.name || err) };
    }
  }
  return { status: 0, error: 'unbekannt' };
}

const results = [];
const list = [...urls.keys()];
const CONC = 6;
for (let i = 0; i < list.length; i += CONC) {
  const chunk = list.slice(i, i + CONC);
  const r = await Promise.all(chunk.map(async (u) => ({ url: u, ids: urls.get(u), ...(await check(u)) })));
  results.push(...r);
}

const ok = results.filter((r) => r.status >= 200 && r.status < 400);
const broken = results.filter((r) => r.status === 404 || r.status === 410);
const unclear = results.filter((r) => !ok.includes(r) && !broken.includes(r));
for (const r of broken) console.log(`KAPUTT ${r.status}  ${r.url}  (${r.ids.join(', ')})`);
for (const r of unclear) console.log(`UNKLAR ${r.status || r.error}  ${r.url}`);
console.log(`\n${results.length} eindeutige Links: ${ok.length} ok, ${broken.length} kaputt, ${unclear.length} unklar (Netzwerk/Bot-Schutz)`);

const i = process.argv.indexOf('--json');
if (i > 0) await writeFile(process.argv[i + 1], JSON.stringify({ geprueft: new Date().toISOString(), results }, null, 2));
process.exit(broken.length ? 1 : 0);
