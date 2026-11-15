"""Validiert data/normen.json gegen data/normen.schema.json (JSON Schema 2020-12) + Zusatzregeln.

Aufruf:  python3 scripts/validate.py      (benötigt: pip install jsonschema)
Exit-Code 0 = alles gut, 1 = Fehler.
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parent.parent
schema = json.loads((ROOT / "data/normen.schema.json").read_text(encoding="utf-8"))
data = json.loads((ROOT / "data/normen.json").read_text(encoding="utf-8"))

errors = []
v = Draft202012Validator(schema, format_checker=FormatChecker())
for err in sorted(v.iter_errors(data), key=lambda e: list(e.path)):
    errors.append(f"Schema: {'/'.join(map(str, err.path))}: {err.message}")

entries = data.get("eintraege", [])
seen_id, seen_nr = {}, {}
today = date.today().isoformat()
for i, e in enumerate(entries):
    where = f"eintraege[{i}] ({e.get('id')})"
    if e.get("id") in seen_id:
        errors.append(f"{where}: doppelte id")
    seen_id[e.get("id")] = i
    key = (e.get("herausgeber"), e.get("nummer"), e.get("ausgabe"))
    if e.get("nummer") and key in seen_nr:
        errors.append(f"{where}: gleiche Nummer+Ausgabe wie eintraege[{seen_nr[key]}]")
    seen_nr[key] = i
    if e.get("ebene") in ("kanton", "gemeinde") and not e.get("kanton"):
        errors.append(f"{where}: ebene={e.get('ebene')} verlangt kanton")
    if e.get("ebene") == "national" and e.get("kanton"):
        errors.append(f"{where}: nationale Einträge haben kein kanton-Feld")
    q = e.get("quelle", {})
    if q.get("geprueft_am", "") > today:
        errors.append(f"{where}: geprueft_am liegt in der Zukunft")
    if e.get("ausgabe") and e["ausgabe"][:10] > today:
        errors.append(f"{where}: ausgabe liegt in der Zukunft")
    # Urheberrechts-Leitplanke: keine langen Freitexte (keine Normauszüge)
    for field in ("bemerkung",):
        if len(e.get(field, "")) > 300:
            errors.append(f"{where}: {field} zu lang (nur formale Hinweise erlaubt)")
    if re.search(r"\b(Zitat|Auszug|Abschnitt \d|Ziffer \d)\b", e.get("bemerkung", "")):
        errors.append(f"{where}: bemerkung scheint Norminhalte zu zitieren")

if errors:
    print("\n".join(errors))
    print(f"\n✗ {len(errors)} Fehler in {len(entries)} Einträgen")
    sys.exit(1)
print(f"✓ data/normen.json gültig – {len(entries)} Einträge, Stand {data['stand']}")
