// Erzeugt dist/ – eine rein statische Website ohne Server-Abhängigkeit:
//  - alle Pfade relativ (in Unterordnern / auf jedem Webspace lauffähig)
//  - JS als klassisches Skript gebündelt (kein ES-Modul) + Daten als normen-data.js eingebettet
//    → index.html funktioniert sogar direkt per Doppelklick (file://)
//  - data/normen.json zusätzlich mitgeliefert (maschinenlesbar, für Nachnutzung)
//  - Service Worker für Offline-Nutzung (nur bei http/https aktiv)
import { cp, rm, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const OUT = 'dist';
const raw = await readFile('data/normen.json', 'utf8');
const data = JSON.parse(raw);
if (!Array.isArray(data.eintraege) || !data.eintraege.length) throw new Error('data/normen.json ohne Einträge');

await rm(OUT, { recursive: true, force: true });
await mkdir(`${OUT}/js`, { recursive: true });
await mkdir(`${OUT}/data`, { recursive: true });

// 1) Statische Dateien
for (const f of ['styles.css', 'icon.svg', 'manifest.webmanifest']) await cp(`public/${f}`, `${OUT}/${f}`);
await cp('data/normen.json', `${OUT}/data/normen.json`);

// 2) JS bündeln: core.js + app.js ohne import/export in eine IIFE
const strip = (s) => s
  .replace(/^import .*?;\s*$/gm, '')
  .replace(/^export (?=(async )?function|const|let|class)/gm, '');
const core = strip(await readFile('public/js/core.js', 'utf8'));
const app = strip(await readFile('public/js/app.js', 'utf8'));
if (/\bimport\s|\bexport\s/.test(core + app)) throw new Error('Bundle enthält noch import/export');
const bundle = `/* Normen-Übersicht Tiefbau Schweiz – gebündelt von scripts/build.mjs */\n(function () {\n'use strict';\n${core}\n${app}\n})();\n`;
await writeFile(`${OUT}/js/app.js`, bundle);
await writeFile(`${OUT}/js/normen-data.js`, `window.NORMEN_DATA = ${JSON.stringify(data)};\n`);

// 3) index.html: Modul-Skript durch klassische Skripte ersetzen
let html = await readFile('public/index.html', 'utf8');
const tag = '<script type="module" src="js/app.js"></script>';
if (!html.includes(tag)) throw new Error('Script-Tag in public/index.html nicht gefunden');
html = html.replace(tag, '<script src="js/normen-data.js"></script>\n  <script src="js/app.js"></script>');
await writeFile(`${OUT}/index.html`, html);

// 4) Service Worker mit Asset-Liste des Builds und Versions-Hash (neuer Cache bei jeder Datenänderung)
const assets = ['./', 'index.html', 'styles.css', 'js/app.js', 'js/normen-data.js', 'manifest.webmanifest', 'icon.svg', 'data/normen.json'];
const css = await readFile('public/styles.css', 'utf8');
const hash = createHash('sha256').update(bundle + raw + html + css).digest('hex').slice(0, 10);
let sw = await readFile('public/sw.js', 'utf8');
sw = sw.replace(/const CACHE = '[^']+';/, `const CACHE = 'normen-uebersicht-${hash}';`)
  .replace(/const ASSETS = \[[^\]]*\];/, `const ASSETS = ${JSON.stringify(assets)};`)
  .replace("url.pathname.endsWith('/data/normen.json')", "/\\/(data\\/normen\\.json|js\\/normen-data\\.js)$/.test(url.pathname)");
await writeFile(`${OUT}/sw.js`, sw);

console.log(`${OUT}/ erstellt – ${data.eintraege.length} Einträge, Stand ${data.stand}, Cache ${hash}`);
