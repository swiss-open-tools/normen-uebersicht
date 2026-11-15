# Urheberrecht und Normen – Abklärung (keine Rechtsberatung)

Stand der Recherche: 15.11.2026. Das hier ist eine kurze Recherche-Notiz, **keine Rechtsberatung**.
Vor einer kommerziellen Nutzung oder bei Rückfragen eines Herausgebers: Fachperson beiziehen
oder beim Herausgeber nachfragen.

## Ergebnis in einem Satz

Ein Verzeichnis mit **Nummer, Titel, Ausgabe, Herausgeber und Link** ist nach unserer Einschätzung
unproblematisch. Heikel wäre erst, **Inhalte** von Normen zu übernehmen, also Texte, Tabellen,
Abbildungen, Auszüge oder Zusammenfassungen. Genau das macht dieses Projekt nicht.

## Grundlagen

| Punkt | Quelle | Bedeutung für das Projekt |
|---|---|---|
| Werke sind «geistige Schöpfungen der Literatur und Kunst» mit individuellem Charakter (Art. 2 Abs. 1 URG) | URG-Text, z. B. [ccdigitallaw.ch – URG_de.pdf](https://www.ccdigitallaw.ch/wp-content/uploads/2023/01/URG_de.pdf) (Stand 1.1.2017) | Normnummern und Ausgabedaten sind Fakten und keine Werke. Kurze, beschreibende Titel wie «Grabarbeiten; Ausführungsvorschriften» haben kaum individuellen Charakter. |
| Nicht geschützt sind «Gesetze, Verordnungen, völkerrechtliche Verträge und andere amtliche Erlasse» sowie «Entscheidungen, Protokolle und Berichte von Behörden» (Art. 5 Abs. 1 lit. a und c URG) | dito | Bundes- und Kantonserlasse (GSchG, SSV, StrWG TG …) sind frei. Für amtliche Dokumente wie Richtlinien des Tiefbauamts TG oder des ASTRA gilt das je nach Charakter ebenfalls. Verlinkt wird trotzdem nur, es wird nichts kopiert. |
| Nach herrschender Lehre sind private Normen urheberrechtlich geschützt, «so lange [...] das staatliche Recht nicht auf sie verweist». Erst mit einem Verweis fallen sie unter Art. 5 URG. | N. Gili, *Selbstregulierung und ihre Krux mit der Publikation*, sui generis 2019 – [sui-generis.ch/article/view/sg.92/1028](https://sui-generis.ch/article/view/sg.92/1028) | VSS-, SIA- und VSA-Normen gelten als **geschützt**. Darum gibt es keine Inhalte, Auszüge oder Zusammenfassungen, auch keine «Kernaussagen». |
| SIA- und VSS-Normen sind private Regelwerke («Privatkodifikationen»). Vertragsnormen wie SIA 118 gelten nur, wenn sie ausdrücklich übernommen werden. | [law.ch – Baunormen](https://law.ch/lawinfo/werkvertrag/erscheinungsformen/bauwerkvertrag/baunormen/) (Bürgi Nägeli Rechtsanwälte) | Die Bezugsquelle ist immer der Herausgeber. Die App verlinkt den Shop bzw. die Downloadseite. |
| Die Herausgeber publizieren ihre Verzeichnisse selbst gratis: VSS 41 001 (Gesamt-Normenverzeichnis) und die SIA-Publikationsliste | [VSS 41 001 (PDF)](https://mobilityplatform.ch/fileadmin/mobilityplatform/normenpool/1184640_VSS-41001_Gesamt-Normenverzeichnis_nach_Nummern_2024-10.pdf), [SIA Publikationen (PDF)](https://cms.sia.ch/de/api/getMedia/674) | Nummern und Titel sind also bewusst öffentlich. Wir übernehmen nur einzelne Angaben und nicht das ganze Verzeichnis 1:1. |

## Leitplanken, die im Projekt umgesetzt sind

1. **Nur Metadaten.** Das Schema (`data/normen.schema.json`) kennt kein Feld für Inhalte.
   `bemerkung` ist auf 300 Zeichen begrenzt und nur für formale Hinweise da, z. B. «ersetzt durch …».
   `scripts/validate.py` schlägt Alarm bei Wörtern wie «Zitat», «Auszug» oder «Ziffer n».
2. **Eigene Einordnung statt Normtext.** Die Themen-Tags (z. B. «Entwässerung») sind unsere eigene
   Klassierung und keine Wiedergabe aus der Norm.
3. **Keine Logos und Marken-Grafiken** von VSS, SIA, VSA oder ASTRA. Herausgeber erscheinen nur
   als Textkürzel.
4. **Keine PDFs spiegeln.** Auch frei verfügbare Dokumente (ASTRA, Kanton TG) werden nur verlinkt,
   nicht hochgeladen. So bleibt die Quelle massgebend und aktuell.
5. **Entfernen auf Anfrage.** README und CONTRIBUTING sagen, dass Einträge auf Wunsch eines
   Herausgebers entfernt oder korrigiert werden.

## Offene Restrisiken

- Rechtsprechung, ob reine Normtitel geschützt sind, haben wir in der Schweiz **nicht gefunden**.
  Die Einschätzung stützt sich auf Art. 2 und Art. 5 URG und auf die Lehre.
- Die **Datenbank als Ganzes** übernimmt nicht das VSS- oder SIA-Verzeichnis vollständig.
  Würde man das Verzeichnis komplett nachbauen, wäre vorher beim Verband nachzufragen.
- Bei einer **kommerziellen Nutzung** (z. B. Abo-Modell) sollte vorher eine Fachperson
  (z. B. IGE-Auskunft oder eine Anwältin) die Lage beurteilen.
