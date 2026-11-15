# Mitmachen – Einträge ergänzen oder korrigieren

Danke fürs Mithelfen! Dieses Verzeichnis ist nur so gut wie seine Quellen. Darum gelten drei Regeln:

1. **Nur Metadaten.** Herausgeber, Nummer, Titel, Ausgabe, Status, Link. **Keine** Normtexte,
   Auszüge, Tabellen oder Zusammenfassungen (siehe [docs/URHEBERRECHT.md](docs/URHEBERRECHT.md)).
2. **Nur Belegtes.** Jeder Eintrag braucht eine öffentlich abrufbare Quelle (`quelle.url`), die
   Nummer, Titel und gegebenenfalls Ausgabe zeigt. Was die Quelle nicht zeigt, bleibt `null`.
   Lieber ein Feld leer lassen als raten.
3. **Offizielle Quelle bevorzugen.** Also Herausgeber, Bund, Kanton oder Gemeinde. Sekundärquellen
   (z. B. Hochschulen) nur, wenn es keine Primärquelle gibt, und dann in `quelle.notiz` vermerken.

## Ablauf

1. `data/normen.json` bearbeiten (Eintrag ins Array `eintraege` einfügen; die Reihenfolge spielt keine Rolle,
   die App sortiert selbst).
2. `stand` oben in der Datei auf das heutige Datum setzen.
3. Prüfen:
   ```bash
   pip install jsonschema        # einmalig
   npm run validate              # Schema + Zusatzregeln
   npm test                      # Unit-, Build- und Server-Tests
   ```
4. Pull Request mit kurzer Beschreibung: *was* ergänzt oder korrigiert wurde und *woher* die Angabe stammt.

Kein Git? Dann ein Issue mit Nummer, Titel, Ausgabe und Quell-Link eröffnen. Wir tragen es ein.

## Felder (Schema: `data/normen.schema.json`)

| Feld | Pflicht | Beispiel | Hinweis |
|---|---|---|---|
| `id` | ja | `vss-40-324`, `tg-tba-237-441` | klein, Bindestriche, eindeutig und stabil (nie umbenennen) |
| `herausgeber` | ja | `VSS`, `SIA`, `VSA`, `ASTRA`, `Bund`, `TBA TG`, `AfU TG` | Kurzzeichen (max. 12 Zeichen), in der App als Filter |
| `herausgeber_name` | ja | `Kantonales Tiefbauamt Thurgau` | ausgeschrieben |
| `ebene` | ja | `national` / `kanton` / `gemeinde` | |
| `kanton` | bei kanton/gemeinde | `TG` | amtliches Kürzel; bei `national` weglassen oder `null` |
| `gemeinde` | optional | `Frauenfeld` | nur bei `ebene: gemeinde` |
| `typ` | ja | `Norm`, `Richtlinie`, `Normalie`, `Merkblatt`, `Weisung`, `Vollzugshilfe`, `Leitfaden`, `Empfehlung`, `Reglement`, `Gesetz`, `Verordnung`, `Fachhandbuch`, `Dokumentation`, `Musterpflichtenheft`, `Checkliste`, `Vorlage`, `Verzeichnis` | |
| `nummer` | ja (`null` erlaubt) | `SN 640 535`, `VSS 40 324`, `SIA 118`, `SR 814.20`, `237.441` | Schreibweise wie beim Herausgeber |
| `titel` | ja | `Grabarbeiten; Ausführungsvorschriften` | wörtlich wie in der Quelle |
| `ausgabe` | ja (`null` erlaubt) | `2019`, `2024-10`, `2025-02-27` | nur so genau, wie die Quelle es angibt |
| `status` | ja (`null` erlaubt) | `gültig`, `ersetzt`, `Entwurf`, `in Überarbeitung` | nur wenn die Quelle es **ausdrücklich** sagt |
| `themen` | ja (min. 1) | `["Entwässerung", "Leitungsbau"]` | feste Liste, siehe Schema; neue Themen per Issue vorschlagen |
| `stichworte` | optional | `["Schacht", "GEP"]` | eigene Suchbegriffe, keine Normzitate |
| `url` | ja | Shop- oder Downloadseite | `https://` |
| `kostenlos` | ja | `true` / `false` / `null` | `null` = unklar |
| `quelle.url` | ja | Seite oder PDF, das die Angaben belegt | darf gleich `url` sein |
| `quelle.geprueft_am` | ja | `2026-11-15` | Datum, an dem du die Quelle selbst angeschaut hast |
| `quelle.notiz` | optional | `VSS 41 001:2024-10` | z. B. Name oder Stand des Verzeichnisses |
| `bemerkung` | optional | `Ersetzt durch … (2019)` | max. 300 Zeichen, nur formal |

### Beispiel

```json
{
  "id": "tg-tba-237-441",
  "herausgeber": "TBA TG",
  "herausgeber_name": "Kantonales Tiefbauamt Thurgau",
  "ebene": "kanton",
  "kanton": "TG",
  "typ": "Normalie",
  "nummer": "237.441",
  "titel": "Schachtabdeckungen",
  "ausgabe": "2022-03-15",
  "status": null,
  "themen": ["Entwässerung"],
  "url": "https://tiefbauamt.tg.ch/downloads/normen.html/4337/dcategory/5689",
  "kostenlos": true,
  "quelle": {
    "url": "https://tiefbauamt.tg.ch/public/upload/assets/157350/237.400%20Inhaltsverzeichnis.pdf?fp=1",
    "geprueft_am": "2026-11-01"
  }
}
```

## Einträge nachprüfen (Pflege)

Normen ändern sich. Bitte beim Nachprüfen:

- Ausgabe/Status mit der Quelle vergleichen, `quelle.geprueft_am` aktualisieren.
- Ersetzte Ausgabe **nicht löschen**, sondern `status: "ersetzt"` setzen und eine `bemerkung` mit dem
  Nachfolger ergänzen. Der Nachfolger bekommt einen eigenen Eintrag.
- `npm run linkcheck` zeigt Links mit 404/410 (Netzwerkzugang nötig).

## Neue Kantone oder Gemeinden

Gerne! Kürzel für den Herausgeber nach dem Muster `TBA ZH`, `AWEL ZH` oder `Stadt SG` wählen,
`ebene` und `kanton` setzen. Der Filter «Ebene / Kanton» erscheint dann automatisch.

## Wunsch eines Herausgebers

Möchte ein Herausgeber, dass ein Eintrag geändert oder entfernt wird, setzen wir das umgehend um.
