# Stundenplan-Werkstatt

Eine Seite, mit der Lehrkräfte den Wochenplan ihrer Klasse zusammenklicken
und als PDF für alle Kinder ausdrucken. Kein Login, keine Installation,
kein Server nötig.

## Benutzen

**Am eigenen Rechner:** `index.html` doppelklicken. Fertig.

**Im Netz:** <https://petersmsl.github.io/StundenplanWerkstatt/>

Zuerst kommt die Startseite mit der Stufenauswahl, dann die Werkstatt.
Wer seine Stufe direkt ansteuern will, kann sich die Adresse mit dem
Anhängsel als Lesezeichen ablegen, zum Beispiel
`…/werkstatt.html?stufe=1-3`.

## Die Stufen

| Stufe | Klassen heißen nach | Zustand |
|---|---|---|
| 1 – 3 | Planeten | fertig |
| 4 – 6 | Lehrkräften | in Arbeit |
| 7 / 8 | Lehrkräften | in Arbeit |

Die Kacheln auf der Startseite kommen aus `stufen` in
`gemeinsam/geteilt.js`. Solange dort `bereit:false` steht, ist die Kachel
zu sehen, aber nicht anklickbar.

## Der Ablauf für eine Lehrkraft

1. Auf der Startseite die Stufe wählen.
2. Klasse auswählen — in Stufe 1–3 setzt das den Planeten oben rechts.
3. Die Woche füllen — einfach in die Felder schreiben. Beim Klick ins Feld
   schlagen sich die üblichen Fächer vor, eintippen lässt sich aber alles.
   Ein leeres Feld ergibt einen leeren Kasten; in einer Pausenzeile heißt
   leer „gehört zum durchgehenden Streifen".
   Steht der eingetippte Text nicht im Katalog, erscheint daneben eine
   kleine Farbauswahl für diesen Kasten.
4. Die Namen der Kinder eintragen, einen pro Zeile.
5. Oben rechts das **Papierformat** wählen: A4 (Standard), A3 fürs
   Klassenzimmer, A5 fürs Heft. Das Layout bleibt identisch, es wird nur
   sauber mitskaliert.
6. **Drucken / PDF** — es entsteht eine Seite pro Kind, alle in einem PDF.
   Im Druckdialog: Ziel *Als PDF speichern*, Ränder *keine*,
   Hintergrundgrafiken *an*.

Das PDF ist im **Querformat** — das ist richtig so. Die Seite selbst ist ein
A4-Blatt, nur quer genutzt. Drucker und Kopierer erkennen das am PDF und
ziehen ein ganz normales Blatt ein.

Der Stand wird im Browser automatisch gemerkt, für jede Stufe getrennt.
**Plan sichern** legt zusätzlich eine Datei ab, die man weitergeben oder
nächstes Jahr wieder öffnen kann.

## Die Dateien

```
index.html              Startseite mit der Stufenauswahl
start.css               Aussehen der Startseite
werkstatt.html          Die Werkstatt – lädt die gewählte Stufe nach

gemeinsam/
    geteilt.js          Schulname, Logo, Papierformate, Farben,
                        Wochentage, Liste der Stufen
    plan-bauen.js       Baut aus den Daten das Blatt
    app.js              Die Bedienung
    app.css             Aussehen der Oberfläche

stufen/
    1-3/
        daten.js        Klassen, Fächer, Standardraster dieser Stufe
        plan-design.js  Aussehen des gedruckten Plans dieser Stufe
```

Was für **alle** Stufen gilt, steht in `gemeinsam/geteilt.js`.
Was nur eine Stufe betrifft, steht in ihrem Ordner unter `stufen/`.
Im Normalfall fasst du nur `stufen/<deine Stufe>/daten.js` an.
Alles darin ist Klartext und kommentiert.

### Ein Fach hinzufügen

Die Liste `faecher` in `stufen/1-3/daten.js` ist die **Vorschlagsliste**
beim Tippen — niemand ist darauf festgelegt, sie erspart nur Tipparbeit
und vergibt automatisch die richtige Farbe. Eine Zeile ergänzen:

```js
{ name:"Schwimmen", farbe:"sport" },
```

`name` ist der Vorschlag **und** das, was gedruckt wird. `farbe` verweist
auf einen Eintrag aus `farben` in `gemeinsam/geteilt.js`. Soll auf dem Plan
etwas anderes stehen als im Vorschlag, kommt `kurz` dazu:

```js
{ name:"Freie Arbeit", kurz:"FA", farbe:"fa" },
```

### Eine Klasse hinzufügen oder entfernen

**Das ist die einzige Stelle.** Bei `klassen` in `stufen/1-3/daten.js` die
Liste anpassen — sie steuert die Klassenauswahl *und* die Planeten, die bei
der Betreuten Freizeit angeboten werden:

```js
klassen: ["merkur", "venus", "mars", "jupiter"],
```

Vorhanden sind: merkur, venus, mars, jupiter, saturn, uranus,
neptun. Ein weiterer Planet braucht ein neues Bild — kurz Bescheid sagen.

### Das Standardraster ändern

`standardPlan` in `stufen/1-3/daten.js` bestimmt, was eine Lehrkraft beim
ersten Öffnen sieht. Wenn eure Zeiten sich ändern, hier anpassen — dann
startet jede Klasse gleich richtig.

Es gibt drei Zeilenarten:

- `stunden` — normale Unterrichtszeile mit Von/Bis
- `band` — schmaler Streifen quer über die Woche (Frühstück, Pause).
  Ein `null` in `zellen` heißt „gehört zum Streifen"; steht dort ein
  Fach, bekommt dieser Tag einen eigenen Kasten. So entsteht Freitags
  „Pflege der Umgebung" neben dem Mittagessen-Streifen.
- `planeten` — Betreute Freizeit, zwei Planeten pro Tag

Nach jeder Änderung an `faecher`, `klassen` oder `standardPlan` bitte das
Datum bei `stand` hochsetzen. Wer noch einen älteren Stand im Browser
liegen hat, bekommt dann einen Hinweis statt veralteter Werte.

### Ein Papierformat ändern oder ergänzen

Unter `formate` in `gemeinsam/geteilt.js` — das gilt für alle Stufen.
`breite` und `hoehe` in Millimetern, `seite` ist das, was der Drucker
bekommt:

```js
a3: { name:"A3 quer", breite:420, hoehe:297, seite:"A3 landscape" },
```

Alle Formate sind Querformat — fünf Tage nebeneinander brauchen die Breite.
Das Blatt wird immer in A4-Maßen gebaut und in das gewählte Format
hineingerechnet, deshalb sieht es in jedem Format gleich aus.

### Eine neue Stufe scharf schalten

1. Ordner `stufen/4-6/` anlegen.
2. `daten.js` hineinlegen. Am einfachsten eine Kopie von
   `stufen/1-3/daten.js` nehmen und `klassen`, `faecher` und
   `standardPlan` ersetzen. Der Rahmen muss
   `Object.assign(KATALOG, { … });` bleiben.
3. `plan-design.js` hineinlegen — zunächst eine Kopie von
   `stufen/1-3/plan-design.js`, später nach Belieben ändern.
4. In `gemeinsam/geteilt.js` bei dieser Stufe `bereit:true` setzen.

Ab dann ist die Kachel auf der Startseite anklickbar. Am Kern muss dafür
nichts geändert werden.

**Wenn die Klassen nicht nach Planeten heißen:** In `klassen` stehen die
Kennungen, in `planeten` die zugehörigen Namen und Bilder. Für eine Stufe,
deren Klassen nach Lehrkräften heißen, kommen dort einfach diese Namen
hinein. Ohne Bild bleibt das Feld oben rechts leer — sobald klar ist, wie
es dort aussehen soll, wird das sauber nachgezogen.

## Wenn das Logo getauscht werden soll

Das Schullogo steckt als Text in `gemeinsam/geteilt.js` unter `logo` und
gilt für alle Stufen. Neues Bild in eine Base64-Zeile umwandeln und dort
ersetzen — oder kurz Bescheid sagen, dann mache ich es.
