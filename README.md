# Stundenplan-Werkstatt

Eine Seite, mit der Lehrkräfte den Wochenplan ihrer Klasse zusammenklicken
und als PDF für alle Kinder ausdrucken. Kein Login, keine Installation,
kein Server nötig.

## Benutzen

**Am eigenen Rechner:** `index.html` doppelklicken. Fertig.

**Für das ganze Kollegium:** die Dateien in ein GitHub-Repository legen,
dann *Settings → Pages → Branch: main / root*. Nach ein paar Minuten liegt
die Werkstatt unter `https://<name>.github.io/<repo>/` und alle können sie
im Browser öffnen.

## Der Ablauf für eine Lehrkraft

1. Klasse auswählen — das setzt den Planeten oben rechts auf dem Plan.
2. Die Woche füllen — einfach in die Felder schreiben. Beim Klick ins Feld
   schlagen sich die üblichen Fächer vor, eintippen lässt sich aber alles.
   Ein leeres Feld ergibt einen leeren Kasten; in einer Pausenzeile heißt
   leer „gehört zum durchgehenden Streifen".
   Steht der eingetippte Text nicht im Katalog, erscheint daneben eine
   kleine Farbauswahl für diesen Kasten.
3. Die Namen der Kinder eintragen, einen pro Zeile.
4. Oben rechts das **Papierformat** wählen: A4 (Standard), A3 fürs
   Klassenzimmer, A5 fürs Heft. Das Layout bleibt identisch, es wird nur
   sauber mitskaliert.
5. **Drucken / PDF** — es entsteht eine Seite pro Kind, alle in einem PDF.
   Im Druckdialog: Ziel *Als PDF speichern*, Ränder *keine*,
   Hintergrundgrafiken *an*.

Das PDF ist im **Querformat** — das ist richtig so. Die Seite selbst ist ein
A4-Blatt, nur quer genutzt. Drucker und Kopierer erkennen das am PDF und
ziehen ein ganz normales Blatt ein.

Der Stand wird im Browser automatisch gemerkt. **Plan sichern** legt
zusätzlich eine Datei ab, die man weitergeben oder nächstes Jahr wieder
öffnen kann.

## Die Dateien

| Datei | Wofür |
|---|---|
| `index.html` | Die Bedienoberfläche |
| **`daten.js`** | **Klassen, Fächer, Farben, Standardraster — hier wird gepflegt** |
| `plan-design.js` | Das Aussehen des gedruckten Plans |
| `plan-bauen.js` | Baut aus den Daten das Blatt |
| `app.js` | Die Bedienung |
| `app.css` | Aussehen der Oberfläche |

Im Normalfall fasst du nur **`daten.js`** an. Alles darin ist Klartext
und kommentiert.

### Ein Fach hinzufügen

Die Liste `faecher` in `daten.js` ist die **Vorschlagsliste** beim Tippen —
niemand ist darauf festgelegt, sie erspart nur Tipparbeit und vergibt
automatisch die richtige Farbe. Eine Zeile ergänzen:

```js
{ name:"Schwimmen", farbe:"sport" },
```

`name` ist der Vorschlag **und** das, was gedruckt wird. `farbe` verweist
auf einen Eintrag aus `farben`. Soll auf dem Plan etwas anderes stehen als
im Vorschlag, kommt `kurz` dazu:

```js
{ name:"Freie Arbeit", kurz:"FA", farbe:"fa" },
```

### Eine Klasse hinzufügen oder entfernen

**Das ist die einzige Stelle.** Bei `klassen` in `daten.js` die Liste
anpassen — sie steuert die Klassenauswahl *und* die Planeten, die bei der
Betreuten Freizeit angeboten werden:

```js
klassen: ["merkur", "venus", "mars", "jupiter"],
```

Vorhanden sind: merkur, venus, mars, jupiter, saturn, uranus,
neptun. Ein weiterer Planet braucht ein neues Bild — kurz Bescheid sagen.

### Ein Papierformat ändern oder ergänzen

Unter `formate` in `daten.js`. `breite` und `hoehe` in Millimetern,
`seite` ist das, was der Drucker bekommt:

```js
a3: { name:"A3 quer", breite:420, hoehe:297, seite:"A3 landscape" },
```

Alle Formate sind Querformat — fünf Tage nebeneinander brauchen die Breite.
Das Blatt wird immer in A4-Maßen gebaut und in das gewählte Format
hineingerechnet, deshalb sieht es in jedem Format gleich aus.

### Das Standardraster ändern

`standardPlan` bestimmt, was eine Lehrkraft beim ersten Öffnen sieht.
Wenn eure Zeiten sich ändern, hier anpassen — dann startet jede Klasse
gleich richtig.

Es gibt drei Zeilenarten:

- `stunden` — normale Unterrichtszeile mit Von/Bis
- `band` — schmaler Streifen quer über die Woche (Frühstück, Pause).
  Ein `null` in `zellen` heißt „gehört zum Streifen"; steht dort ein
  Fach, bekommt dieser Tag einen eigenen Kasten. So entsteht Freitags
  „Pflege der Umgebung" neben dem Mittagessen-Streifen.
- `planeten` — Betreute Freizeit, zwei Planeten pro Tag

## Wenn das Logo getauscht werden soll

Das Schullogo steckt als Text in `daten.js` unter `logo`. Neues Bild
in eine Base64-Zeile umwandeln und dort ersetzen — oder kurz Bescheid
sagen, dann mache ich es.
