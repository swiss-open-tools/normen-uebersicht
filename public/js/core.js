// Reine Funktionen (ohne DOM) – im Browser und in node:test nutzbar.

/** Kleinschreibung, Umlaute/Akzente vereinheitlichen, Leerzeichen in Normnummern ignorierbar machen. */
export function normalize(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[«»"'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Suchtext eines Eintrags (inkl. Variante der Nummer ohne Leerzeichen, z. B. "640324"). */
export function haystack(e) {
  const parts = [e.herausgeber, e.herausgeber_name, e.nummer, e.titel, e.typ, e.kanton, e.ausgabe, e.status,
    ...(e.themen || []), ...(e.stichworte || [])];
  const base = normalize(parts.filter(Boolean).join(' '));
  const compact = normalize(e.nummer || '').replace(/[\s.]/g, '');
  return `${base} ${compact}`;
}

/** Alle Suchbegriffe müssen vorkommen (UND). Nummern mit/ohne Leerzeichen/Punkt werden gefunden. */
export function matchesQuery(e, q) {
  const terms = normalize(q).split(' ').filter(Boolean);
  if (!terms.length) return true;
  const h = e._h || haystack(e);
  return terms.every((t) => h.includes(t) || h.includes(t.replace(/[.]/g, '')));
}

export function filterEntries(entries, f = {}) {
  return entries.filter((e) =>
    (!f.herausgeber || e.herausgeber === f.herausgeber) &&
    (!f.thema || (e.themen || []).includes(f.thema)) &&
    (!f.ebene || ebeneKey(e) === f.ebene) &&
    (!f.typ || e.typ === f.typ) &&
    (!f.kostenlos || e.kostenlos === true) &&
    (!f.merkliste || (f.merkIds && f.merkIds.has(e.id))) &&
    matchesQuery(e, f.q || ''));
}

/** "national" oder "kanton:TG" / "gemeinde:…" für den Ebenen-/Kantonsfilter. */
export function ebeneKey(e) {
  if (e.ebene === 'kanton') return `kanton:${e.kanton}`;
  if (e.ebene === 'gemeinde') return `gemeinde:${e.kanton}`;
  return 'national';
}

const ORDER = ['Bund', 'ASTRA', 'BAFU', 'VSS', 'SIA', 'VSA'];
export function sortEntries(list) {
  const rank = (e) => (e.ebene === 'national' ? 0 : e.ebene === 'kanton' ? 1 : 2);
  const hr = (e) => { const i = ORDER.indexOf(e.herausgeber); return i < 0 ? 99 : i; };
  return [...list].sort((a, b) => rank(a) - rank(b) || hr(a) - hr(b) ||
    String(a.herausgeber).localeCompare(String(b.herausgeber)) ||
    String(a.nummer || '~').localeCompare(String(b.nummer || '~'), 'de', { numeric: true }) ||
    a.titel.localeCompare(b.titel, 'de'));
}

/** Zählt Werte (für Filter-Optionen mit Anzahl). */
export function facet(entries, fn) {
  const m = new Map();
  for (const e of entries) for (const v of [].concat(fn(e) ?? [])) m.set(v, (m.get(v) || 0) + 1);
  return [...m.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'de'));
}

/** Merkliste als Klartext (z. B. für Mail/Notiz). */
export function merklisteText(entries) {
  return entries.map((e) =>
    `${[e.herausgeber, e.nummer].filter(Boolean).join(' ')} – ${e.titel}${e.ausgabe ? ` (${e.ausgabe})` : ''}\n${e.url}`,
  ).join('\n\n');
}

export function formatDate(iso) {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}
