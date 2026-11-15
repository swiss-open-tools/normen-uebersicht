import { haystack, filterEntries, sortEntries, facet, ebeneKey, merklisteText, formatDate } from './core.js';

const $ = (id) => document.getElementById(id);
const MERK_KEY = 'normen-merkliste-v1';
const EBENE_LABEL = (k) => (k === 'national' ? 'National (Bund, Verbände)' : k.replace('kanton:', 'Kanton ').replace('gemeinde:', 'Gemeinden '));
const STATUS_CLASS = { 'gültig': 'st-gueltig', ersetzt: 'st-ersetzt', Entwurf: 'st-entwurf', 'in Überarbeitung': 'st-ueberarbeitung' };

let all = [];
let merk = new Set(JSON.parse(localStorage.getItem(MERK_KEY) || '[]'));
const state = { q: '', herausgeber: '', thema: '', ebene: '', typ: '', kostenlos: false, merkliste: false };

function saveMerk() { localStorage.setItem(MERK_KEY, JSON.stringify([...merk])); }

function fillSelect(sel, pairs, label = (v) => v) {
  for (const [v, n] of pairs) sel.append(new Option(`${label(v)} (${n})`, v));
}

function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  for (const k of Object.keys(state)) {
    if (!p.has(k)) continue;
    state[k] = typeof state[k] === 'boolean' ? p.get(k) === '1' : p.get(k);
  }
}
function writeHash() {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(state)) if (v) p.set(k, v === true ? '1' : v);
  const h = p.toString();
  history.replaceState(null, '', h ? `#${h}` : location.pathname + location.search);
}

function syncControls() {
  $('q').value = state.q;
  $('fHerausgeber').value = state.herausgeber;
  $('fThema').value = state.thema;
  $('fEbene').value = state.ebene;
  $('fTyp').value = state.typ;
  $('fKostenlos').checked = state.kostenlos;
  $('btnMerk').setAttribute('aria-pressed', String(state.merkliste));
}

function render() {
  const list = sortEntries(filterEntries(all, { ...state, merkIds: merk }));
  const ul = $('list');
  const tpl = $('tplItem');
  const frag = document.createDocumentFragment();
  for (const e of list) {
    const li = tpl.content.firstElementChild.cloneNode(true);
    li.querySelector('.pub').textContent = e.herausgeber;
    li.querySelector('.pub').title = e.herausgeber_name;
    li.querySelector('.num').textContent = e.nummer || '';
    const a = li.querySelector('.title a');
    a.textContent = e.titel;
    a.href = e.url;
    const meta = li.querySelector('.meta');
    const add = (lbl, val, cls) => {
      if (!val) return;
      const s = document.createElement('span');
      s.innerHTML = `${lbl}: <b></b>`;
      s.querySelector('b').textContent = val;
      if (cls) s.querySelector('b').className = cls;
      meta.append(s);
    };
    add('Typ', e.typ);
    add('Ausgabe', formatDate(e.ausgabe));
    add('Status', e.status, STATUS_CLASS[e.status]);
    if (e.ebene !== 'national') add('Gültig für', EBENE_LABEL(ebeneKey(e)));
    const tags = li.querySelector('.tags');
    for (const t of e.themen || []) {
      const s = document.createElement('span'); s.className = 'tag'; s.textContent = t; tags.append(s);
    }
    if (e.kostenlos === true || e.kostenlos === false) {
      const s = document.createElement('span');
      s.className = `tag ${e.kostenlos ? 'free' : 'paid'}`;
      s.textContent = e.kostenlos ? 'kostenlos' : 'kostenpflichtig';
      tags.append(s);
    }
    const chk = li.querySelector('.checked');
    chk.append(`Zuletzt geprüft am ${formatDate(e.quelle.geprueft_am)} · `);
    const qa = document.createElement('a');
    qa.href = e.quelle.url; qa.target = '_blank'; qa.rel = 'noopener'; qa.textContent = 'Quelle der Angaben';
    chk.append(qa);
    const star = li.querySelector('.star');
    const on = merk.has(e.id);
    star.setAttribute('aria-pressed', String(on));
    star.textContent = on ? '★' : '☆';
    star.setAttribute('aria-label', on ? `${e.titel} von Merkliste entfernen` : `${e.titel} merken`);
    star.dataset.id = e.id;
    frag.append(li);
  }
  ul.replaceChildren(frag);
  $('empty').hidden = list.length > 0;
  $('count').textContent = `${list.length} von ${all.length} Einträgen`;
  $('merkCount').textContent = merk.size;
  $('merkActions').hidden = !(state.merkliste && merk.size);
  const n = ['herausgeber', 'thema', 'ebene', 'typ', 'kostenlos'].filter((k) => state[k]).length;
  $('activeFilters').textContent = n ? `(${n} aktiv)` : '';
  writeHash();
}

async function init() {
  // Statischer Build bettet die Daten als normen-data.js ein (funktioniert auch per file://),
  // im Entwicklungsmodus werden sie per fetch geladen.
  const data = window.NORMEN_DATA || await (await fetch('data/normen.json')).json();
  all = data.eintraege.map((e) => ({ ...e, _h: haystack(e) }));
  $('dataStand').textContent = formatDate(data.stand);
  $('dataTotal').textContent = all.length;

  fillSelect($('fHerausgeber'), facet(all, (e) => e.herausgeber));
  fillSelect($('fThema'), facet(all, (e) => e.themen));
  fillSelect($('fEbene'), facet(all, ebeneKey).sort((a, b) => (a[0] === 'national' ? -1 : b[0] === 'national' ? 1 : 0)), EBENE_LABEL);
  fillSelect($('fTyp'), facet(all, (e) => e.typ));
  if (matchMedia('(max-width: 480px)').matches) $('filterBox').open = false;

  readHash();
  syncControls();

  let t;
  $('q').addEventListener('input', (ev) => { clearTimeout(t); t = setTimeout(() => { state.q = ev.target.value; render(); }, 120); });
  for (const [id, key] of [['fHerausgeber', 'herausgeber'], ['fThema', 'thema'], ['fEbene', 'ebene'], ['fTyp', 'typ']]) {
    $(id).addEventListener('change', (ev) => { state[key] = ev.target.value; render(); });
  }
  $('fKostenlos').addEventListener('change', (ev) => { state.kostenlos = ev.target.checked; render(); });
  $('btnReset').addEventListener('click', () => {
    Object.assign(state, { herausgeber: '', thema: '', ebene: '', typ: '', kostenlos: false });
    syncControls(); render();
  });
  $('btnMerk').addEventListener('click', () => { state.merkliste = !state.merkliste; syncControls(); render(); });
  $('list').addEventListener('click', (ev) => {
    const b = ev.target.closest('.star');
    if (!b) return;
    const id = b.dataset.id;
    if (merk.has(id)) merk.delete(id); else merk.add(id);
    saveMerk(); render();
  });
  $('btnCopyMerk').addEventListener('click', async () => {
    const txt = merklisteText(sortEntries(all.filter((e) => merk.has(e.id))));
    try { await navigator.clipboard.writeText(txt); $('btnCopyMerk').textContent = 'Kopiert ✓'; } catch { prompt('Merkliste:', txt); }
    setTimeout(() => { $('btnCopyMerk').textContent = 'Merkliste kopieren'; }, 1500);
  });
  $('btnClearMerk').addEventListener('click', () => {
    if (confirm('Merkliste wirklich leeren?')) { merk = new Set(); saveMerk(); render(); }
  });
  window.addEventListener('hashchange', () => { readHash(); syncControls(); render(); });
  render();
}

init().catch((err) => {
  $('count').textContent = 'Daten konnten nicht geladen werden.';
  console.error(err);
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
