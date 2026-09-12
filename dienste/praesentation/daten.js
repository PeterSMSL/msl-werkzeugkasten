/* ============================================================
   DATEN.JS  –  die Vorgaben der Präsentationswerkstatt.

   Hier steht, welche Folienarten es gibt und welche Felder jede
   von ihnen hat. Die Eingabemaske baut sich daraus von selbst –
   eine neue Folienart ist ein Eintrag hier und eine Funktion in
   bausteine.js, sonst nichts.

   Diese Datei darfst du bearbeiten. Regel: Kommas zwischen den
   Einträgen nicht vergessen.
   ============================================================ */

const VORTRAG = {

  schule: "MSL",
  schulname: "Montessori-Schule Landau",

  /* Das Schullogo steht in haus/marke.js – eine Stelle für alle
     Werkzeuge. Diese Datei muss vorher geladen sein.          */
  logo: MSL_LOGO,

  /* ---- Papierformate ------------------------------------------
     Eine Folie ist 16:9 (1280 x 720). Auf A4 quer bleibt deshalb
     oben und unten ein weißer Streifen von gut zwei Zentimetern –
     das ist kein Fehler, sondern der Unterschied der Formate.
     Wer die Folie randlos will, nimmt "16:9 randlos": dort ist
     das Papier genauso geschnitten wie die Folie.

     breite/hoehe in Millimetern, seite = was der Drucker bekommt. */
  formate: {
    a4quer:  { name:"A4 quer  ·  Standard",        breite:297, hoehe:210, seite:"A4 landscape" },
    a3quer:  { name:"A3 quer  ·  für den Aushang", breite:420, hoehe:297, seite:"A3 landscape" },
    folie169:{ name:"16:9 randlos  ·  genau die Folie",
               breite:338, hoehe:190, seite:"338mm 190mm" }
  },

  /* ---- Was mit eingefügten Bildern geschieht ------------------

     Ein Bild aus einer Handykamera hat gut 4000 Bildpunkte Breite
     und wiegt drei Megabyte. Auf einer Folie von 1280 Punkten
     Breite sieht man davon nichts – gespeichert werden müsste es
     trotzdem, und beim Doppelklick von der Festplatte hat der
     Browser dafür nur rund fünf Megabyte insgesamt.

     Deshalb wird verkleinert. 1600 Punkte sind mehr als die Folie
     braucht (auch auf A3 gedruckt), und aus drei Megabyte werden
     dabei etwa zweihundert Kilobyte.

     Zwei Ausnahmen, beide mit Grund:
       SVG   ist eine Zeichnung und kein Foto – verkleinern würde
             sie unscharf machen, und klein ist sie ohnehin.
       PNG   kann durchsichtig sein (Logos, Diagramme). Solange es
             klein genug ist, bleibt es unangetastet; als JPEG
             würde aus der Durchsicht ein weißer Kasten.        */
  bilder: {
    hoechstensPunkte: 1600,
    guete: 0.82,
    /* Bis zu dieser Größe bleibt ein PNG, wie es ist (in Byte). */
    pngUnberuehrtBis: 400 * 1024
  },

  /* ---- Die Farben einer Karte ---------------------------------
     Mehr braucht es nicht: vier Abstufungen reichen, um eine
     Folie zu gliedern, und fünf wären schon Dekoration.       */
  kartenfarben: [
    { id:"weiss",  name:"Weiß" },
    { id:"blau",   name:"Blau getönt" },
    { id:"orange", name:"Orange getönt" },
    { id:"voll",   name:"Blau gefüllt" }
  ],

  /* ============================================================
     DIE FOLIENARTEN

     Jede hat:
       id        wie sie in der gesicherten Datei heißt
       name      wie sie in der Auswahl heißt
       was       ein Satz zur Erklärung, steht unter der Skizze
       skizze    ein kleines SVG für die Auswahl – so wie die
                 Möbelbilder in der Sitzordnung
       felder    was die Lehrkraft ausfüllt (siehe unten)

     Feldarten:
       text     eine Zeile
       absatz   mehrere Zeilen Fließtext
       zeilen   eine Aufzählung, ein Punkt pro Zeile
       wahl     Auswahl aus "werte"
       schalter Häkchen
       karten   eine Reihe von Karten, jede mit den Feldern aus
                kartenfelder weiter unten
       bild     ein Bild von der Festplatte. Es wird beim Einfügen
                verkleinert und liegt danach IN der Präsentation –
                die gesicherte Datei bringt es also mit.
     ============================================================ */

  bausteine: [

    { id:"titel", name:"Titelfolie",
      was:"Die dunkle erste Folie mit großem Titel und Logo.",
      skizze:`<svg viewBox="0 0 80 45"><rect width="80" height="45" rx="3" fill="#00538F"/>
        <rect x="8" y="13" width="16" height="3" rx="1.5" fill="#F09018"/>
        <rect x="8" y="20" width="34" height="5" rx="2" fill="#fff" opacity=".9"/>
        <rect x="8" y="28" width="24" height="3" rx="1.5" fill="#fff" opacity=".5"/>
        <rect x="54" y="0" width="26" height="45" fill="#fff" opacity=".08"/>
        <rect x="59" y="15" width="16" height="15" rx="4" fill="#fff"/></svg>`,
      felder: [
        { schluessel:"augenbraue", name:"Kleine Zeile darüber", art:"text",
          platzhalter:"Die kleine Zeile über dem Titel" },
        { schluessel:"titel", name:"Titel", art:"absatz", zeilen:2,
          hinweis:"Zeilenumbruch, wo der Titel umbrechen soll.",
          platzhalter:"Titel der\nPräsentation" },
        { schluessel:"unter", name:"Unterzeile", art:"text", platzhalter:"Willkommen!" },
        { schluessel:"marken", name:"Pillen darunter", art:"zeilen", zeilen:3,
          hinweis:"Eine pro Zeile. Für Datum, Raum, Gruppe …",
          platzhalter:"eine Angabe je Zeile" }
      ] },

    { id:"karten", name:"Karten",
      was:"Zwei oder drei Spalten mit Karten. Die Arbeitsform für fast alles.",
      skizze:`<svg viewBox="0 0 80 45"><rect width="80" height="45" rx="3" fill="#fff" stroke="#DDE4EC"/>
        <rect x="0" y="0" width="80" height="6" fill="#00538F"/>
        <rect x="8" y="11" width="30" height="3.5" rx="1.75" fill="#00538F"/>
        <rect x="8" y="20" width="20" height="18" rx="2" fill="#E7F0F8" stroke="#C4DFF2"/>
        <rect x="30" y="20" width="20" height="18" rx="2" fill="#E7F0F8" stroke="#C4DFF2"/>
        <rect x="52" y="20" width="20" height="18" rx="2" fill="#FDF0DD" stroke="#F3DCAF"/></svg>`,
      felder: [
        { schluessel:"augenbraue", name:"Kleine Zeile darüber", art:"text",
          platzhalter:"Ablauf" },
        { schluessel:"titel", name:"Überschrift", art:"text",
          platzhalter:"Worum geht es hier?" },
        { schluessel:"spalten", name:"Spalten", art:"wahl",
          werte:[ {id:"2", name:"zwei nebeneinander"}, {id:"3", name:"drei nebeneinander"} ] },
        { schluessel:"karten", name:"Die Karten", art:"karten" },
        { schluessel:"schrittweise", name:"Beim Vorführen nacheinander aufdecken",
          art:"schalter" }
      ] },

    { id:"spalten", name:"Zwei Spalten",
      was:"Links ein Stapel Karten, rechts einer. Für Gegenüberstellungen.",
      skizze:`<svg viewBox="0 0 80 45"><rect width="80" height="45" rx="3" fill="#fff" stroke="#DDE4EC"/>
        <rect x="0" y="0" width="80" height="6" fill="#00538F"/>
        <rect x="8" y="11" width="30" height="3.5" rx="1.75" fill="#00538F"/>
        <rect x="8" y="19" width="30" height="9" rx="2" fill="#E7F0F8" stroke="#C4DFF2"/>
        <rect x="8" y="30" width="30" height="9" rx="2" fill="#fff" stroke="#DDE4EC"/>
        <rect x="42" y="19" width="30" height="20" rx="2" fill="#FDF0DD" stroke="#F3DCAF"/></svg>`,
      felder: [
        { schluessel:"augenbraue", name:"Kleine Zeile darüber", art:"text" },
        { schluessel:"titel", name:"Überschrift", art:"text",
          platzhalter:"Die Überschrift der Folie" },
        { schluessel:"links", name:"Linke Spalte", art:"karten" },
        { schluessel:"rechts", name:"Rechte Spalte", art:"karten" },
        { schluessel:"schrittweise", name:"Beim Vorführen nacheinander aufdecken",
          art:"schalter" }
      ] },

    { id:"text", name:"Text und Aufzählung",
      was:"Ein Absatz, darunter Punkte. Die schlichte Folie.",
      skizze:`<svg viewBox="0 0 80 45"><rect width="80" height="45" rx="3" fill="#fff" stroke="#DDE4EC"/>
        <rect x="0" y="0" width="80" height="6" fill="#00538F"/>
        <rect x="8" y="11" width="30" height="3.5" rx="1.75" fill="#00538F"/>
        <rect x="8" y="19" width="58" height="2.5" rx="1.25" fill="#5C6B7A" opacity=".35"/>
        <rect x="8" y="24" width="44" height="2.5" rx="1.25" fill="#5C6B7A" opacity=".35"/>
        <rect x="8" y="32" width="3" height="3" rx="1" fill="#F09018"/>
        <rect x="14" y="32" width="40" height="2.5" rx="1.25" fill="#5C6B7A" opacity=".5"/>
        <rect x="8" y="38" width="3" height="3" rx="1" fill="#F09018"/>
        <rect x="14" y="38" width="34" height="2.5" rx="1.25" fill="#5C6B7A" opacity=".5"/></svg>`,
      felder: [
        { schluessel:"augenbraue", name:"Kleine Zeile darüber", art:"text" },
        { schluessel:"titel", name:"Überschrift", art:"text" },
        { schluessel:"einleitung", name:"Einleitender Absatz", art:"absatz", zeilen:3 },
        { schluessel:"punkte", name:"Aufzählung", art:"zeilen", zeilen:7,
          hinweis:"Ein Punkt pro Zeile." },
        { schluessel:"farbe", name:"Als Karte", art:"wahl",
          werte:[ {id:"keine", name:"ohne Rahmen"}, {id:"weiss", name:"Weiße Karte"},
                  {id:"blau", name:"Blau getönt"}, {id:"orange", name:"Orange getönt"},
                  {id:"voll", name:"Blau gefüllt"} ] },
        { schluessel:"schrittweise", name:"Beim Vorführen nacheinander aufdecken",
          art:"schalter" }
      ] },

    { id:"bild", name:"Bild groß",
      was:"Ein Bild, so groß wie die Folie es zulässt – mit einer Zeile darunter.",
      skizze:`<svg viewBox="0 0 80 45"><rect width="80" height="45" rx="3" fill="#fff" stroke="#DDE4EC"/>
        <rect x="0" y="0" width="80" height="6" fill="#00538F"/>
        <rect x="8" y="10" width="64" height="26" rx="2" fill="#E7F0F8" stroke="#C4DFF2"/>
        <circle cx="24" cy="19" r="3.5" fill="#F09018"/>
        <path d="M12 34l12-11 9 8 8-7 27 10z" fill="#7FA6C8"/>
        <rect x="8" y="39" width="32" height="2.5" rx="1.25" fill="#5C6B7A" opacity=".4"/></svg>`,
      felder: [
        { schluessel:"augenbraue", name:"Kleine Zeile darüber", art:"text" },
        { schluessel:"titel", name:"Überschrift", art:"text" },
        { schluessel:"bild", name:"Das Bild", art:"bild" },
        { schluessel:"passform", name:"Wie es eingepasst wird", art:"wahl",
          werte:[ {id:"ganz", name:"ganz zeigen – nichts wird abgeschnitten"},
                  {id:"fuellen", name:"Fläche füllen – Ränder werden beschnitten"} ] },
        { schluessel:"unterschrift", name:"Zeile unter dem Bild", art:"text",
          hinweis:"Zum Beispiel, woher das Bild stammt." }
      ] },

    { id:"bildtext", name:"Bild und Text",
      was:"Ein Bild auf der einen Seite, Text und Aufzählung auf der anderen.",
      skizze:`<svg viewBox="0 0 80 45"><rect width="80" height="45" rx="3" fill="#fff" stroke="#DDE4EC"/>
        <rect x="0" y="0" width="80" height="6" fill="#00538F"/>
        <rect x="8" y="11" width="30" height="3.5" rx="1.75" fill="#00538F"/>
        <rect x="8" y="19" width="32" height="20" rx="2" fill="#E7F0F8" stroke="#C4DFF2"/>
        <circle cx="16" cy="25" r="2.5" fill="#F09018"/>
        <path d="M10 37l8-7 6 5 6-5 10 7z" fill="#7FA6C8"/>
        <rect x="45" y="20" width="27" height="2.5" rx="1.25" fill="#5C6B7A" opacity=".35"/>
        <rect x="45" y="25" width="20" height="2.5" rx="1.25" fill="#5C6B7A" opacity=".35"/>
        <rect x="45" y="32" width="3" height="3" rx="1" fill="#F09018"/>
        <rect x="51" y="32" width="21" height="2.5" rx="1.25" fill="#5C6B7A" opacity=".5"/></svg>`,
      felder: [
        { schluessel:"augenbraue", name:"Kleine Zeile darüber", art:"text" },
        { schluessel:"titel", name:"Überschrift", art:"text" },
        { schluessel:"bild", name:"Das Bild", art:"bild" },
        { schluessel:"seite", name:"Das Bild steht", art:"wahl",
          werte:[ {id:"links", name:"links"}, {id:"rechts", name:"rechts"} ] },
        { schluessel:"text", name:"Text daneben", art:"absatz", zeilen:4 },
        { schluessel:"punkte", name:"Aufzählung daneben", art:"zeilen", zeilen:5,
          hinweis:"Ein Punkt pro Zeile." },
        { schluessel:"unterschrift", name:"Zeile unter dem Bild", art:"text" }
      ] },

    { id:"merksatz", name:"Merksatz",
      was:"Ein breiter blauer Block quer über die Folie. Für das eine, was hängen bleiben soll.",
      skizze:`<svg viewBox="0 0 80 45"><rect width="80" height="45" rx="3" fill="#fff" stroke="#DDE4EC"/>
        <rect x="0" y="0" width="80" height="6" fill="#00538F"/>
        <rect x="8" y="11" width="30" height="3.5" rx="1.75" fill="#00538F"/>
        <rect x="8" y="19" width="64" height="18" rx="2.5" fill="#00538F"/>
        <rect x="13" y="24" width="30" height="3" rx="1.5" fill="#fff" opacity=".9"/>
        <rect x="13" y="30" width="50" height="2.5" rx="1.25" fill="#fff" opacity=".5"/></svg>`,
      felder: [
        { schluessel:"augenbraue", name:"Kleine Zeile darüber", art:"text" },
        { schluessel:"titel", name:"Überschrift", art:"text" },
        { schluessel:"kopf", name:"Überschrift im Block", art:"text",
          platzhalter:"Der eine Satz, der hängen bleiben soll" },
        { schluessel:"satz", name:"Der Satz", art:"absatz", zeilen:4,
          hinweis:"*Sternchen* macht fett, _Unterstriche_ heben mit Farbe hervor." },
        { schluessel:"nachsatz", name:"Kleine Zeile darunter", art:"text" }
      ] },

    { id:"zitat", name:"Zitat",
      was:"Ein Zitat mit Quelle, auf heller Folie.",
      skizze:`<svg viewBox="0 0 80 45"><rect width="80" height="45" rx="3" fill="#fff" stroke="#DDE4EC"/>
        <rect x="0" y="0" width="80" height="6" fill="#00538F"/>
        <rect x="8" y="11" width="30" height="3.5" rx="1.75" fill="#00538F"/>
        <rect x="10" y="20" width="3" height="18" rx="1.5" fill="#F09018"/>
        <rect x="18" y="22" width="48" height="3.5" rx="1.75" fill="#00538F" opacity=".7"/>
        <rect x="18" y="28" width="38" height="3.5" rx="1.75" fill="#00538F" opacity=".7"/>
        <rect x="18" y="35" width="20" height="2.5" rx="1.25" fill="#5C6B7A" opacity=".5"/></svg>`,
      felder: [
        { schluessel:"augenbraue", name:"Kleine Zeile darüber", art:"text" },
        { schluessel:"titel", name:"Überschrift", art:"text" },
        { schluessel:"zitat", name:"Das Zitat", art:"absatz", zeilen:3 },
        { schluessel:"quelle", name:"Wer hat es gesagt", art:"text",
          platzhalter:"wer es gesagt hat" }
      ] },

    { id:"abschluss", name:"Abschlussfolie",
      was:"Die dunkle letzte Folie: ein großer Satz, Logo, Pillen darunter.",
      skizze:`<svg viewBox="0 0 80 45"><rect width="80" height="45" rx="3" fill="#00538F"/>
        <circle cx="40" cy="12" r="5" fill="#fff" opacity=".9"/>
        <rect x="20" y="21" width="40" height="4" rx="2" fill="#fff" opacity=".9"/>
        <rect x="27" y="28" width="26" height="4" rx="2" fill="#fff" opacity=".9"/>
        <rect x="36" y="35" width="8" height="2" rx="1" fill="#F09018"/></svg>`,
      felder: [
        { schluessel:"satz", name:"Der große Satz", art:"absatz", zeilen:3,
          hinweis:"Zeilenumbruch, wo umgebrochen werden soll.",
          platzhalter:"Der Satz, mit dem\nalle rausgehen sollen." },
        { schluessel:"quelle", name:"Quelle", art:"text", platzhalter:"wer es gesagt hat" },
        { schluessel:"marken", name:"Pillen darunter", art:"zeilen", zeilen:3,
          platzhalter:"eine Angabe je Zeile" }
      ] },

    { id:"frei", name:"Eigenes HTML",
      was:"Der Notausgang für die eine Folie, die in keine Form passt. " +
          "Setzt HTML-Kenntnisse voraus.",
      skizze:`<svg viewBox="0 0 80 45"><rect width="80" height="45" rx="3" fill="#fff" stroke="#DDE4EC" stroke-dasharray="4 3"/>
        <rect x="0" y="0" width="80" height="6" fill="#00538F"/>
        <text x="40" y="30" text-anchor="middle" font-family="monospace" font-size="13"
              fill="#5C6B7A">&lt;/&gt;</text></svg>`,
      felder: [
        { schluessel:"augenbraue", name:"Kleine Zeile darüber", art:"text" },
        { schluessel:"titel", name:"Überschrift", art:"text" },
        { schluessel:"html", name:"HTML", art:"absatz", zeilen:12, schrift:"fest",
          hinweis:"Kommt unverändert in die Folie. Die Klassen aus " +
                  "folien-design.js stehen zur Verfügung: karte, raster s2, " +
                  "liste, zitat, nummer …" }
      ] }
  ],

  /* ---- Die Felder EINER Karte --------------------------------
     Gelten für jede Kartenreihe, egal in welchem Baustein sie
     steht. Deshalb stehen sie hier einmal und nicht dreimal.   */
  kartenfelder: [
    { schluessel:"marke", name:"Nummer oder Symbol", art:"text", breite:"schmal",
      hinweis:"Eine Zahl wird zur orangen Kachel, alles andere " +
              "(zum Beispiel ein Symbol) steht groß darüber." },
    { schluessel:"kopf", name:"Überschrift", art:"text" },
    { schluessel:"text", name:"Text", art:"absatz", zeilen:3 },
    { schluessel:"punkte", name:"Aufzählung", art:"zeilen", zeilen:4,
      hinweis:"Ein Punkt pro Zeile." },
    { schluessel:"farbe", name:"Farbe", art:"wahl", breite:"schmal" }
  ],

  /* ---- Womit eine neue Präsentation anfängt -------------------

     MIT NICHTS. Und das ist eine Entscheidung, keine Lücke.

     Hier stand zuerst ein fertiges Gerüst für eine Kursvorstellung,
     damit der erste Blick nicht auf eine leere Fläche fällt. Peters
     Urteil war eindeutig: diese Werkstatt dient Kursen, Elternabenden
     UND internen Fortbildungen. Ein vorausgefüllter Foliensatz legt
     immer einen dieser Anlässe nahe und ist für die anderen beiden
     im Weg – man müsste erst wegräumen, bevor man anfangen kann.

     Der Einstieg ist stattdessen die Auswahl der Folienart: „+ Folie"
     zeigt, was es gibt, und legt die erste an. Sichtbar leer ist
     besser als falsch vorbelegt.

     Deshalb steht hier auch nur der leere Rahmen. Wer für sich einen
     festen Aufbau will, legt ihn als VORLAGE ab (Schritt 3) – das
     ist die Stelle dafür.                                        */
  leererVortrag: {
    rahmen: { titel:"", anlass:"", datum:"", lehrkraft:"" },
    folien: []
  },

  /* Dateiformat der gesicherten Präsentation. Wird hochgesetzt,
     wenn sich der Aufbau der Datei ändert.                     */
  version: 1
};
