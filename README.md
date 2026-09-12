# MSL – digitaler Werkzeugkasten

Kleine Werkzeuge für den Schulalltag: ausfüllen, ansehen, ausdrucken.
Kein Login, keine Installation, kein Server. Was eingegeben wird, bleibt
auf dem eigenen Gerät.

**Am eigenen Rechner:** `index.html` doppelklicken. Fertig.

**Im Netz:** <https://petersmsl.github.io/msl-werkzeugkasten/>

## Die Werkzeuge

| Werkzeug | Wofür | Zustand |
|---|---|---|
| [Stundenplan-Werkstatt](dienste/stundenplan/) | Wochenplan der Klasse, eine Seite pro Kind | fertig |
| [Sitzordnung](dienste/sitzordnung/) | Klassenzimmer stellen, Plätze auslosen | fertig |
| [Präsentationswerkstatt](dienste/praesentation/) | Folien bauen, zeigen und weitergeben | fertig |

## Was gespeichert wird

> Ausführlich: **[datenschutz.html](datenschutz.html)** — was mit
> Eingaben geschieht und warum nichts nach draußen geht.

Was du eingibst, bleibt auf deinem Gerät. Es gibt keinen Server, der es
entgegennimmt, und kein Konto. Der Browser merkt sich den letzten Stand,
damit man nach dem Schließen weitermachen kann — **Sichern** bzw.
**Zwischenstand** legt zusätzlich eine Datei bei dir ab.

Kein Werkzeug lädt Schriften, Bilder oder Skripte von fremden Adressen
nach. Das ist Absicht und sollte so bleiben: eine eingebundene
Web-Schriftart würde bei jedem Aufruf die Adresse der Lehrkraft an einen
fremden Anbieter melden.

## Ein neues Werkzeug hinzufügen

1. Ordner unter `dienste/` anlegen.
2. Darin eine `index.html`, die `../../haus/haus.css` einbindet. Damit
   sieht es von selbst wie der Rest aus.
3. In der Startseite `index.html` eine Kachel ergänzen.

Mehr ist es nicht. Wer bei Null anfängt, nimmt am besten
`dienste/stundenplan/` als Vorlage — dort steckt alles drin, was ein
Werkzeug vom Typ „eingeben, ansehen, als PDF drucken" braucht.

## Wenn das Logo getauscht werden soll

Das Schullogo steckt als Text in `haus/marke.js` und gilt für **alle**
Werkzeuge. Neues Bild in eine Base64-Zeile umwandeln und dort ersetzen —
oder kurz Bescheid sagen, dann mache ich es.

---

# Stundenplan-Werkstatt

Eine Seite, mit der Lehrkräfte den Wochenplan ihrer Klasse zusammenklicken
und als PDF für alle Kinder ausdrucken.

Zuerst kommt die Stufenauswahl, dann die Werkstatt. Wer seine Stufe direkt
ansteuern will, kann sich die Adresse mit dem Anhängsel als Lesezeichen
ablegen, zum Beispiel `…/dienste/stundenplan/werkstatt.html?stufe=1-3`.

## Die Stufen

| Stufe | Klassen heißen nach | Zustand |
|---|---|---|
| 1 – 3 | Planeten | fertig |
| 4 – 6 | Lehrkräften | in Arbeit |
| 7 / 8 | Lehrkräften | in Arbeit |

Die Kacheln der Stufenauswahl kommen aus `stufen` in
`gemeinsam/geteilt.js`. Solange dort `bereit:false` steht, ist die Kachel
zu sehen, aber nicht anklickbar.

## Der Ablauf für eine Lehrkraft

1. In der Stufenauswahl die Stufe wählen.
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

### Auf dem iPad

**Bitte nicht Safari nehmen.** Safari bekommt den Plan nicht auf eine
einzige Seite und druckt zusätzlich die Internetadresse an den
Blattrand. Mit einem anderen Browser klappt es — **Firefox** ist auf dem
iPad getestet.

Dort gibt es keinen „Als PDF speichern"-Eintrag wie am Rechner, aber
diesen Weg:

1. **Drucken / PDF** antippen — das Druckblatt geht auf.
2. Oben **Querformat** wählen.
3. Auf der kleinen Vorschau mit zwei Fingern **aufziehen**, bis sie
   bildschirmfüllend ist.
4. Oben rechts **Teilen → In Dateien sichern**.

Der Plan kommt dabei etwas kleiner heraus als am Rechner, mit einem
schmalen weißen Rand ringsum. Das ist so gewollt: Apple-Geräte erzwingen
beim Drucken einen Rand, den man ihnen nicht abgewöhnen kann. Ohne die
Verkleinerung liefe jedes Blatt auf zwei Seiten.

Derselbe Hinweis steht zum Aufklappen unten auf der Seite mit der
Stufenauswahl.

Der Stand wird im Browser automatisch gemerkt, für jede Stufe getrennt.
**Plan sichern** legt zusätzlich eine Datei ab, die man weitergeben oder
nächstes Jahr wieder öffnen kann.

## Die Dateien

```
index.html              Startseite des Werkzeugkastens
werkstatt.html          Weiterleitung für alte Lesezeichen

haus/
    haus.css            Hausfarben und was auf jeder Seite gleich ist
    marke.js            das Schullogo, einmal für alle Werkzeuge

dienste/
    stundenplan/
        index.html          Stufenauswahl
        werkstatt.html      Die Werkstatt – lädt die gewählte Stufe nach
        gemeinsam/
            geteilt.js      Schulname, Papierformate, Farben,
                            Wochentage, Liste der Stufen
            plan-bauen.js   Baut aus den Daten das Blatt
            app.js          Die Bedienung
            app.css         Aussehen der Oberfläche
        stufen/
            1-3/
                daten.js        Klassen, Fächer, Standardraster
                plan-design.js  Aussehen des gedruckten Plans
```

**Alle folgenden Pfade sind ab `dienste/stundenplan/` gemeint.**

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

Ab dann ist die Kachel in der Stufenauswahl anklickbar. Am Kern muss dafür
nichts geändert werden.

**Wenn die Klassen nicht nach Planeten heißen:** In `klassen` stehen die
Kennungen, in `planeten` die zugehörigen Namen und Bilder. Für eine Stufe,
deren Klassen nach Lehrkräften heißen, kommen dort einfach diese Namen
hinein. Ohne Bild bleibt das Feld oben rechts leer — sobald klar ist, wie
es dort aussehen soll, wird das sauber nachgezogen.

---

# Sitzordnung

Zuerst baust du euer Klassenzimmer nach, dann würfelt der Rechner die
Kinder auf die Plätze — und hält sich dabei an deine Regeln.

Es sind drei Schritte, oben in der Leiste. Du darfst jederzeit zwischen
ihnen hin und her springen; nichts geht dabei verloren.

## 1. Klassenzimmer

Trage ein, wie groß euer Raum ungefähr ist, und stelle die Tische:

- **Zweiertisch** — hier sitzen zwei Kinder nebeneinander. **Nur darauf
  beziehen sich die Regeln im nächsten Schritt.**
- **Einzeltisch** — ein Kind für sich, nie ein Paar.
Rechts vom Trennstrich steht die **Einrichtung**: Tafel, Tür, Regal,
Waschbecken, Leseecke, Teppich, Pflanze. Das sind keine Plätze — sie sind
dafür da, dass man auf dem ausgedruckten Blatt den eigenen Raum
wiedererkennt und weiß, wo vorn ist. Jedes Stück ist von oben gezeichnet,
so wie in einem Grundriss.

**Tafel** und **Tür** legen sich beim Schieben von selbst bündig an die
nächste Wand und drehen sich passend mit — sie gehören ja dorthin. Alles
andere bleibt stehen, wo du es hinlegst, auch mitten im Raum: ein Regal
steht schließlich auch mal quer als Trennwand. Der **Teppich** liegt unter
den Tischen, man kann sie also daraufstellen.

**Fehlt euch ein Möbelstück?** Die Einrichtung steht in
`dienste/sitzordnung/daten.js` unter `moebel`, jedes Stück mit Maßen in
Zentimetern und einer kleinen Zeichnung. Ein weiterer Eintrag dort
erscheint von selbst als Knopf über dem Raum — am Werkzeug ist dafür nichts
zu ändern.

Tische **schiebst** du mit dem Finger oder der Maus. Ein angetippter Tisch
bekommt eine kleine Leiste über sich:

- Am **runden blauen Knopf ziehen** dreht den Tisch — er folgt der Maus und
  rastet in 15°-Schritten ein. Mit gedrückter **Umschalttaste** geht es
  gradgenau.
- Der Knopf daneben macht aus einem **Zweiertisch einen Einzeltisch** und
  zurück.
- Dann folgen **verdoppeln** und **wegnehmen**. Die **Entf-Taste** nimmt
  das gewählte Stück ebenfalls weg.
- **Teppich**, **Regal** und **Leseecke** haben zusätzlich einen runden
  Griff an der unteren rechten Ecke: daran ziehen macht sie größer und
  kleiner. Sie wachsen um ihre Mitte herum, bleiben also liegen, wo sie
  liegen — auch schräg gedreht.

Beim Schieben rasten die Tische auf ein Raster ein, damit Reihen von
selbst gerade werden.

**Tafel und Tür docken an die Wand an.** Schiebst du sie in die Nähe einer
Wand, legen sie sich bündig daran und drehen sich passend mit — der
Türbogen zeigt dabei immer in den Raum hinein. Mitten im Raum bleiben
beide stehen, wo du sie hinlegst.

Beim allerersten Öffnen steht schon ein Klassenzimmer da — neun
Zweiertische, Tafel, Tür. Das ist als Anfang gedacht, nicht als Vorschrift.

## 2. Kinder & Regeln

Zuerst: **welche Klassenstufen** sitzen in eurer Klasse? Ins Feld
*Klassenstufen* schreibst du `1-3`, `4-6`, `7-8` — oder einzeln aufgezählt
wie `1, 2, 3`. Danach richten sich die Namensfelder darunter: für jede Stufe
eines, richtig beschriftet.

Dann die Namen, einen pro Zeile, in das Feld der jeweiligen Stufe. Neben
jeder Überschrift steht mit, wie viele schon drinstehen.

Wem die Stufe egal ist, schreibt einfach alle in dasselbe Feld. Für die
Mischung *Völlig frei* macht das keinen Unterschied.

**Beim Umstellen geht nichts verloren.** Aus `1-3` wird `4-6`: die Namen
bleiben stehen, nur die Beschriftung wechselt. Wird die Klasse kleiner, aus
`4-6` also `4-5`, wandern die Kinder der weggefallenen Stufe in ein Feld
*Ohne Stufe* — sichtbar, damit du sie neu verteilen kannst.

Darunter der Name der Klasse — der steht später oben auf dem Blatt.

## Wie gemischt wird

Betrifft nur den Zweiertisch, denn nur dort sitzen zwei nebeneinander.

- **Völlig frei** — die Stufe spielt beim Würfeln keine Rolle.
- **Die Neuen verteilen** — an keinem Zweiertisch sitzen zwei Kinder aus der
  **untersten** eurer Stufen. Jedes neue Kind bekommt also ein älteres
  daneben. Unter dem Auswahlfeld steht jeweils dazu, welche Stufe das
  gerade konkret ist.

Die zweite Mischung hat eine Obergrenze, die man kennen sollte: an jeden
Tisch passt nur **ein** Kind der untersten Stufe. Bei zehn Erstklässlern
braucht es also mindestens zehn Tische. Sind es zu wenige, sagt das Werkzeug
genau das — mit den Zahlen — statt vergeblich zu würfeln.

## 3. Verteilen

Es gibt zwei Wege. **Gewürfelt wird bei beiden gleich** — sie unterscheiden
sich nur darin, ob jemand zuschaut.

**Ziehung starten** ist die Vorführung für die Klasse. Alle Namen stecken als
Zettel in einem **Korb** oben links, und darunter steht, wie viele noch drin
sind. Dann, für jedes Kind:

1. Ein Name wird aus dem Korb gezogen und wird groß in der Mitte des Raums,
   der Rest tritt zurück.
2. Er bleibt stehen — lang genug, dass ihn auch die hinterste Reihe liest.
3. Er schwebt leicht schräg über ein paar Plätze, als suche er sich einen
   aus.
4. Er findet seinen, dreht sich gerade und setzt sich hin.

Das dauert seine Zeit: rund sechs Sekunden pro Kind, bei einer Klasse mit 20
Kindern also etwa zwei Minuten. Das ist gewollt, es ist ja der Zweck. Wenn es
schneller gehen soll, kürzt **Überspringen** über dem Raum jederzeit ab und
zeigt sofort das fertige Bild.

**Wenn statt der Vorführung sofort das fertige Bild kommt**, ist auf dem
Gerät „Animationen reduzieren" eingeschaltet — bei Windows unter
*Einstellungen → Barrierefreiheit → Visuelle Effekte*, bei Apple unter
*Bedienungshilfen → Bewegung*. Das Werkzeug hält sich daran und sagt es
auch dazu. Wer die Ziehung sehen will, schaltet es dort ab.

**Zu schnell oder zu langsam?** Die Zeiten stehen in
`dienste/sitzordnung/daten.js` unter `ziehung`, in Millisekunden und einzeln
kommentiert — `zeigen` ist die Zeit, die der Name groß stehen bleibt,
`suchen` die Dauer eines Schwebeflugs, `sucheSchritte` die Zahl der Plätze,
die er anschaut. Dort lässt sich alles ohne Programmierkenntnisse nachstellen.

**Plätze setzen** macht dasselbe ohne Vorführung: ein Klick, fertig. Für die
stille Runde zu zweit mit der Kollegin.

Gefällt das Ergebnis nicht, **noch einmal**. Jeder Wurf ist neu und hält
sich wieder an dieselben Regeln — und wiederholt den Weg, den du zuletzt
benutzt hast.

Dann oben rechts das Papierformat wählen und **Drucken / PDF**. Im
Druckdialog: Ziel *Als PDF speichern*, Ränder *keine*, Hintergrundgrafiken
*an*. Es entsteht **eine Seite** mit dem Grundriss, den Namen an ihren
Plätzen, dem Klassennamen und dem Datum.

Auf dem iPad gilt dasselbe wie beim Stundenplan: **bitte nicht Safari**,
sondern zum Beispiel Firefox.

## Auf dem Tablet

Die Sitzordnung lässt sich auf dem Tablet bedienen — quer wie hoch.

- **Quer** (iPad 1024 breit) stehen Steuerung und Grundriss nebeneinander,
  der ganze Raum ist ohne Scrollen zu sehen.
- **Hoch** (768 breit) steht alles untereinander. Beim *Klassenzimmer* und
  beim *Verteilen* liegt der Grundriss oben, weil er dort die Arbeitsfläche
  ist; bei *Kinder & Regeln* liegen die Felder oben.
- Tische und Einrichtung schiebt man mit dem Finger, dreht sie am runden
  Knopf und zieht Teppich oder Regal an der Ecke größer. Die Knöpfe und
  Felder sind auf Fingerbedienung ausgelegt.

**Eine Eigenheit beim Einrichten:** Im Schritt *Klassenzimmer* fängt der
Grundriss das Wischen ab — sonst würde die Seite scrollen, statt dass sich
ein Tisch bewegt. Zum Scrollen also den Finger neben dem Raum aufsetzen. In
den anderen beiden Schritten scrollt die Seite ganz normal, auch über dem
Grundriss.

## Was gesichert wird

Der Stand — Raum, Namen, Regeln, die letzte Verteilung — übersteht das
Neuladen der Seite. **Beim Schließen des Browsers ist er weg**, und beim
nächsten Öffnen fängst du mit einem frischen Klassenzimmer an.

Das ist Absicht: auf einem Rechner, den sich mehrere Lehrkräfte teilen,
sollen nicht die Namen der letzten Klasse herumliegen.

Willst du dein Klassenzimmer behalten, drücke **Sichern**. Das legt eine
Datei bei dir ab, die du weitergeben oder nächstes Jahr wieder **Öffnen**
kannst — Raum, Namen und Regeln vollständig.

Kindernamen verlassen dein Gerät nicht. Es gibt keinen Server, der sie
entgegennimmt.

## Wenn eure Tische anders sind

In `dienste/sitzordnung/daten.js` stehen die Maße in Zentimetern, so wie man
sie im Klassenzimmer nachmisst:

```js
zweier: { name:"Zweiertisch", breite:130, tiefe:55, plaetze:2 },
einzel: { name:"Einzeltisch", breite: 65, tiefe:55, plaetze:1 },
```

Dort lässt sich auch einstellen, wie fein die Tische einrasten (`raster`,
in Zentimetern) und in welchen Winkelschritten sie sich drehen lassen
(`drehschritt`, in Grad). Alles darin ist Klartext und kommentiert.


---

# Präsentationswerkstatt

Folien für den Kurs, den Elternabend oder die interne Fortbildung —
zusammengeklickt statt zusammengeschoben. Du wählst aus, was für eine Folie
es werden soll, füllst Felder aus und siehst sofort, wie sie aussieht. Alles
im Schullayout, ohne dass du dich um Schrift, Farben oder Abstände kümmern
musst.

Drei Schritte, oben in der Leiste. Du darfst jederzeit zwischen ihnen hin
und her springen; nichts geht dabei verloren.

## 1. Anlass & Rahmen

Vier Angaben, die auf **jeder** Folie landen:

| Feld | Wo es erscheint |
|---|---|
| **Anlass** | oben rechts in der blauen Leiste — und unten links noch einmal |
| **Wer hält sie** | unten in der Mitte |
| **Wann** | unten in der Mitte, hinter dem Namen |
| **Name der Präsentation** | nirgends auf der Folie — nur der Dateiname |

Rechts in der Vorschau steht eine **Musterfolie**, die zeigt, wo das alles
sitzt. Sie gehört nicht zur Präsentation; sie verschwindet, sobald du zu
den Folien wechselst.

Es ist **nichts vorbelegt**. Die Werkstatt dient Kursen, Elternabenden und
Fortbildungen gleichermaßen — ein fertiger Foliensatz würde immer einen
davon nahelegen und wäre für die anderen im Weg. Wenn du einen Aufbau hast,
den du regelmäßig brauchst, legst du ihn einmal an und sicherst ihn als
**Vorlage** (Schritt 3).

## 2. Folien

Beim ersten Mal ist hier alles leer. **+ Folie** oben links öffnet die
Auswahl: du siehst alle Folienarten als Skizze und suchst dir aus, was
passt. Danach stehen links deine Folien, in der Mitte die Felder der
gewählten, rechts die Vorschau.

Eine neue Folie kommt immer **hinter die gerade gewählte**. Mit den
Pfeilen in der Liste lässt sich alles umsortieren.

| Folienart | Wofür |
|---|---|
| **Titelfolie** | die dunkle erste Folie mit großem Titel und Logo |
| **Karten** | zwei oder drei Spalten mit Karten — die Arbeitsform für fast alles |
| **Zwei Spalten** | links ein Stapel Karten, rechts einer; für Gegenüberstellungen |
| **Text und Aufzählung** | ein Absatz, darunter Punkte |
| **Bild groß** | ein Bild, so groß wie die Folie es zulässt |
| **Bild und Text** | Bild auf der einen Seite, Text auf der anderen |
| **Video** | ein Film, groß auf der Folie |
| **Merksatz** | ein breiter blauer Block quer über die Folie |
| **Zitat** | ein Zitat mit Quelle |
| **Abschlussfolie** | die dunkle letzte Folie mit einem großen Satz |
| **Eigenes HTML** | der Notausgang für die eine Folie, die in keine Form passt |

**In fast allen Textfeldern gilt:**

- `*Sternchen*` macht ein Wort **fett**,
- `_Unterstriche_` legen einen orangen Textmarker darunter.

**Nummer oder Symbol:** Jede Karte hat oben ein kleines Feld. Steht dort
eine Zahl, wird daraus die orange Nummernkachel. Steht dort etwas anderes —
zum Beispiel ein Symbol —, steht es groß über der Karte. Leer lassen geht
auch.

**Nacheinander aufdecken:** Ist das Häkchen gesetzt, erscheinen die Karten
beim Vorführen einzeln, eine je Tastendruck. Auf dem Ausdruck und in der
Vorschau ist immer alles zu sehen.

**Bilder** wählst du von der Festplatte. Sie werden beim Einfügen
verkleinert und liegen danach **in** der Präsentation — die gesicherte
Datei bringt sie also mit, es muss nichts danebenliegen. JPG, PNG und SVG
gehen.

**Eine Seite aus einem PDF** geht denselben Weg: Beim Bild einfach ein PDF
wählen statt eines Fotos. Hat es mehrere Seiten, siehst du sie als
Miniaturen und suchst dir eine aus. Sie wird dann zu einem ganz
gewöhnlichen Bild — sie druckt, sie reist in der gesicherten Datei mit,
und das PDF wird nicht mehr gebraucht.

**Videos** sind der eine Fall, der anders läuft. Ein Film von 50 MB würde
eine HTML-Datei ergeben, die kein Browser mehr vernünftig öffnet. Deshalb
bleibt er eine eigene Datei:

- In der Präsentation steckt nur ein **Standbild** aus dem Film und sein
  Dateiname.
- Beim **Vorführen** läuft der Film trotzdem — solange die Werkstatt
  offen ist, kennt sie deine Datei.
- Beim **Als HTML sichern** kommt ein **ZIP** heraus (nur wenn ein Film
  dabei ist, sonst wie immer eine einzelne HTML-Datei). Einmal entpacken
  — Rechtsklick, *Alle extrahieren* —, und alles steht richtig
  beieinander:

  ```
  Elternabend_8b.html
  medien/
      Einstieg.mp4
  ```

  Danach die HTML-Datei doppelklicken. Beides zusammen lassen: der Ordner
  gehört daneben.
- Auf dem **Ausdruck** erscheint das Standbild — ein Film auf Papier ist
  nun einmal ein Bild.

**Nach einem Neuladen** hängt es davon ab, woher du die Werkstatt
geöffnet hast:

- Über die **Schuladresse im Netz** merkt sich der Browser deine Filme —
  es ist nichts zu tun.
- Beim **Doppelklick von der Festplatte** kann er das nicht. Dann steht
  im Schritt *Ausgeben* unter „Was drin ist" ein Hinweis mit einem Knopf:
  ein Klick, Datei wählen, und der Film ist wieder dabei.

Solange er fehlt, zeigt die Folie in der Werkstatt eine **leere Fläche**
mit dem Hinweis „Videodatei fehlt" — nicht das Standbild. Das ist Absicht:
sonst sähe alles tadellos aus, und du merktest es erst am Beamer. Auf dem
**Ausdruck** erscheint weiterhin das Standbild, denn dafür wird die Datei
ja nicht gebraucht.

Ausgegeben wird dann eine schlichte HTML-Datei statt eines ZIP. Die
Werkstatt verspricht nie ein Paket mit einem Film, der nicht dabei ist.

## 3. Ausgeben

Ganz oben steht, **was drin ist** — Folien, Bilder, Filme. Darunter drei
Wege hinaus, und bei jedem siehst du vorher, was dabei herauskommt.

### 1 · Zeigen

**Vorführen** (auch oben rechts in der Leiste) zeigt die Präsentation
formatfüllend in diesem Fenster.

| Taste | Was passiert |
|---|---|
| **→**, **Leertaste**, Klick | weiter (erst die Karten, dann die nächste Folie) |
| **←** | zurück |
| **F** | Vollbild an und aus |
| **O** | Übersicht aller Folien zum Anspringen |
| **Esc** | Übersicht schließen, noch einmal: Vorführung beenden |

Filme laufen mit — solange die Werkstatt offen ist, kennt sie deine Datei.

### 2 · Weitergeben

Eine Datei, die überall per Doppelklick läuft: ohne Internet, ohne
Programm, auch auf einem fremden Rechner. Der Kasten darüber zeigt, was du
bekommst:

Der Knopf heißt, was er tut: **Als HTML-Datei ausgeben** oder **Als ZIP
ausgeben**.

- **Ohne Film** eine einzige HTML-Datei. Verschicken, doppelklicken, fertig.
- **Mit Film** ein ZIP. Einmal entpacken (Rechtsklick → *Alle
  extrahieren*), dann steht alles richtig beieinander — die HTML-Datei und
  daneben ein Ordner `medien` mit dem Film. Beides zusammen lassen.

### 3 · Drucken

Papierformat wählen, dann drucken. Unter dem Format steht, wie viel weißer
Rand dabei entsteht: eine Folie ist 16:9, ein A4-Blatt nicht. Wer keinen
Rand will, nimmt **16:9 randlos** — dort ist das Papier genauso
geschnitten wie die Folie.

Im Druckdialog: Ziel **Als PDF speichern**, Ränder **keine**,
**Hintergrundgrafiken** anhaken. Filme erscheinen als Standbild.

Auf dem iPad zum Drucken bitte **Firefox** nehmen, nicht Safari. Warum,
steht oben bei der Stundenplan-Werkstatt.

## Vorlagen

Die Werkstatt fängt bewusst leer an. Wenn du einen Aufbau hast, den du
immer wieder brauchst — einen Elternabend, eine Kursvorstellung, eine
Fortbildung —, dann lege ihn einmal an und sichere ihn mit **Als Vorlage
sichern**.

Eine Vorlage ist eine **Datei** bei dir, dort wo du sie ablegst. Beim
nächsten Mal holst du sie mit **Vorlage öffnen** zurück und überschreibst
nur noch die Texte.

Warum eine Datei und nicht im Browser: keine Größengrenze, sie überlebt
das Aufräumen des Browsers, und du kannst sie einer Kollegin schicken.

Eingefügte Bilder sind in der Vorlage enthalten — mit vielen Bildern wird
die Datei entsprechend groß. Filme sind es nicht; die bleiben eigene
Dateien und werden beim Öffnen einer Vorlage neu ausgewählt.

## Was gespeichert wird

Auf deinem Rechner, in deinem Browser — und sonst nirgends. Kein Server,
kein Konto.

Der Browser merkt sich den Stand nur, damit du nach dem Schließen
weitermachen kannst. **Verlass dich nicht darauf:** was bleiben soll,
gehört als Datei zu dir — *Zwischenstand* zum Weiterarbeiten, *Ausgeben*
zum Weitergeben, *Als Vorlage sichern* für das nächste Mal.

Ein Hinweis für den Fall, dass du die Werkstatt **von der Festplatte** aus
benutzt (Doppelklick statt Schuladresse): Der Browser darf dort nur etwa
fünf Megabyte behalten, also ungefähr zwanzig Bilder. Die Werkstatt sagt
Bescheid, wenn es eng wird. Bitte dann **Sichern** benutzen — die Datei hat
diese Grenze nicht. Über die Schuladresse im Netz gibt es sie ebenfalls
nicht.

## Wenn etwas anders aussehen soll

In `dienste/praesentation/daten.js` stehen die Folienarten mit ihren
Feldern, die Papierformate und die Vorgaben fürs Verkleinern von Bildern.
Das Aussehen der Folie selbst — Farben, Schriftgrößen, Abstände — steht in
`dienste/praesentation/folien-design.js`. Beides ist Klartext und
kommentiert.
