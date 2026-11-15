import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { normalize, haystack, matchesQuery, filterEntries, sortEntries, ebeneKey, merklisteText, formatDate } from '../public/js/core.js';

const data = JSON.parse(await readFile(new URL('../data/normen.json', import.meta.url), 'utf8'));
const all = data.eintraege.map((e) => ({ ...e, _h: haystack(e) }));

test('normalize: Umlaute und Akzente', () => {
  assert.equal(normalize('Grabenprofil Überführung'), 'grabenprofil ueberfuehrung');
  assert.equal(normalize('  Évacuation  '), 'evacuation');
});

test('Suche findet Normnummern mit und ohne Leerzeichen', () => {
  const a = all.filter((e) => matchesQuery(e, '40 324'));
  const b = all.filter((e) => matchesQuery(e, '40324'));
  assert.ok(a.some((e) => e.id === 'vss-40-324'));
  assert.ok(b.some((e) => e.id === 'vss-40-324'));
  assert.ok(all.filter((e) => matchesQuery(e, '237.441')).some((e) => e.id === 'tg-tba-237-441'));
});

test('Suche: mehrere Begriffe = UND, Umlaut-tolerant', () => {
  const r = all.filter((e) => matchesQuery(e, 'strassenentwaesserung drainage'));
  assert.ok(r.length >= 1);
  assert.ok(r.every((e) => e._h.includes('drainage')));
  assert.ok(all.filter((e) => matchesQuery(e, 'Rückhaltesysteme')).length >= 2);
});

test('Filter Herausgeber / Thema / Kanton / kostenlos / Merkliste', () => {
  assert.ok(filterEntries(all, { herausgeber: 'SIA' }).every((e) => e.herausgeber === 'SIA'));
  assert.ok(filterEntries(all, { thema: 'Entwässerung' }).every((e) => e.themen.includes('Entwässerung')));
  const tg = filterEntries(all, { ebene: 'kanton:TG' });
  assert.ok(tg.length > 0 && tg.every((e) => e.kanton === 'TG'));
  assert.ok(filterEntries(all, { kostenlos: true }).every((e) => e.kostenlos === true));
  const merk = filterEntries(all, { merkliste: true, merkIds: new Set(['sia-118', 'vss-40-324']) });
  assert.deepEqual(merk.map((e) => e.id).sort(), ['sia-118', 'vss-40-324']);
});

test('Sortierung: national vor kantonal, Nummern numerisch', () => {
  const s = sortEntries(all);
  const firstKanton = s.findIndex((e) => e.ebene === 'kanton');
  assert.ok(s.slice(firstKanton).every((e) => e.ebene !== 'national'));
  const tg = s.filter((e) => e.herausgeber === 'TBA TG' && e.nummer).map((e) => e.nummer);
  assert.ok(tg.indexOf('222.401') < tg.indexOf('237.441'));
});

test('Hilfsfunktionen', () => {
  assert.equal(ebeneKey({ ebene: 'kanton', kanton: 'TG' }), 'kanton:TG');
  assert.equal(formatDate('2025-02-27'), '27.02.2025');
  assert.equal(formatDate('2019'), '2019');
  const t = merklisteText([all.find((e) => e.id === 'sia-118')]);
  assert.match(t, /SIA 118 – Allgemeine Bedingungen für Bauarbeiten \(2013\)/);
});

test('Datenqualität: jede Quelle https, jede ID eindeutig, Pflichtfelder', () => {
  const ids = new Set();
  for (const e of data.eintraege) {
    assert.ok(!ids.has(e.id), `doppelte id ${e.id}`); ids.add(e.id);
    assert.match(e.url, /^https:\/\//);
    assert.match(e.quelle.url, /^https:\/\//);
    assert.match(e.quelle.geprueft_am, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(e.titel.length >= 3);
  }
  assert.ok(data.eintraege.length >= 40, 'mindestens 40 verifizierte Einträge');
});

test('JSON-Schema-Validierung (Python jsonschema)', () => {
  const out = execFileSync('python3', ['scripts/validate.py'], { cwd: new URL('..', import.meta.url).pathname, encoding: 'utf8' });
  assert.match(out, /gültig/);
});

test('Statischer Build: dist/ mit relativen Pfaden, ohne ES-Module', async () => {
  const root = new URL('..', import.meta.url).pathname;
  execFileSync('node', ['scripts/build.mjs'], { cwd: root });
  const html = await readFile(`${root}dist/index.html`, 'utf8');
  assert.ok(!html.includes('type="module"'));
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const ref = m[1];
    if (/^(https?:|#|mailto:)/.test(ref)) continue;
    assert.ok(!ref.startsWith('/'), `absoluter Pfad in dist/index.html: ${ref}`);
    await stat(`${root}dist/${ref}`);
  }
  const bundle = await readFile(`${root}dist/js/app.js`, 'utf8');
  assert.doesNotThrow(() => new Function(bundle));
  const dj = await readFile(`${root}dist/js/normen-data.js`, 'utf8');
  assert.ok(dj.startsWith('window.NORMEN_DATA = {'));
});

test('Server-Smoke-Test: /, /healthz, /data/normen.json, Pfad-Ausbruch blockiert', async () => {
  const { server } = await import('../server.js');
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const home = await fetch(`${base}/`);
    assert.equal(home.status, 200);
    assert.match(await home.text(), /Normen-Übersicht Tiefbau/);
    assert.equal(await (await fetch(`${base}/healthz`)).text(), 'ok');
    const j = await (await fetch(`${base}/data/normen.json`)).json();
    assert.equal(j.eintraege.length, data.eintraege.length);
    const evil = await fetch(`${base}/data/..%2f..%2fpackage.json`);
    assert.notEqual(evil.status, 200);
  } finally { server.close(); }
});
