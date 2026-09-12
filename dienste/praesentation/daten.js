/* ============================================================
   DATEN.JS  –  die Vorgaben der Folienwerkstatt.

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
          platzhalter:"Kickoff · Schuljahr 2026/27" },
        { schluessel:"titel", name:"Titel", art:"absatz", zeilen:2,
          hinweis:"Zeilenumbruch, wo der Titel umbrechen soll.",
          platzhalter:"Mathematik\nLeistungskurs" },
        { schluessel:"unter", name:"Unterzeile", art:"text", platzhalter:"Willkommen!" },
        { schluessel:"marken", name:"Pillen darunter", art:"zeilen", zeilen:3,
          hinweis:"Eine pro Zeile. Für Jahrgang, Abiturjahr, Raum …",
          platzhalter:"Abi 2029\nJahrgang MSS 11" }
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
          platzhalter:"Unser Fahrplan für heute" },
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
          platzhalter:"So läuft es ab" },
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
          platzhalter:"Ehrlich bleiben – das ist die Grundlage" },
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
          platzhalter:"Georg Cantor, 1883" }
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
          platzhalter:"Das Wesen der Mathematik\nliegt in ihrer Freiheit." },
        { schluessel:"quelle", name:"Quelle", art:"text", platzhalter:"GEORG CANTOR, 1883" },
        { schluessel:"marken", name:"Pillen darunter", art:"zeilen", zeilen:3,
          platzhalter:"Mathe LK · Abi 2029\nWillkommen im Kurs" }
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
     Nicht leer: auf eine weiße Fläche zu schauen und nicht zu
     wissen, was man tun soll, ist der schlechteste erste
     Eindruck. Das hier ist ein Gerüst für eine Kursvorstellung –
     alle Texte sind zum Überschreiben gedacht.                */
  standardVortrag: {
    rahmen: {
      titel:     "Kurs-Kickoff",
      kurs:      "Kurs · Jahrgang",
      schuljahr: "Schuljahr 2026/27",
      lehrkraft: ""
    },
    folien: [
      { baustein:"titel",
        augenbraue:"Kickoff · Schuljahr 2026/27",
        titel:"Fach\nKursstufe",
        unter:"Willkommen!",
        marken:"Abi 2029\nJahrgang MSS 11" },

      { baustein:"karten", augenbraue:"Ablauf", titel:"Unser Fahrplan für heute",
        spalten:"3", schrittweise:true,
        karten:[
          { marke:"1", kopf:"Wer bin ich?",        text:"Kurz zu mir – und wie ich Unterricht denke.", farbe:"blau" },
          { marke:"2", kopf:"Wer seid ihr?",       text:"Eine Kennenlernrunde zu zweit.",              farbe:"blau" },
          { marke:"3", kopf:"Wo kommen wir her?",  text:"Rückblick: Wie lief es bisher?",              farbe:"blau" },
          { marke:"4", kopf:"Wo geht es hin?",     text:"Der Weg bis zur Prüfung.",                    farbe:"orange" },
          { marke:"5", kopf:"Was wird anders?",    text:"Was dieser Kurs von bisher unterscheidet.",   farbe:"orange" },
          { marke:"6", kopf:"Was wollen wir?",     text:"Unsere Ziele für die nächste Zeit.",          farbe:"orange" }
        ] },

      { baustein:"spalten", augenbraue:"Wer euch begleitet", titel:"Kurz zu mir",
        schrittweise:true,
        links:[
          { kopf:"Dein Name", text:"Fächer und seit wann an der Schule.", farbe:"voll" },
          { kopf:"Warum dieses Fach?", text:"Zwei, drei Sätze – warum es dir Freude macht.", farbe:"weiss" },
          { kopf:"Abseits der Schule", text:"Was du gern machst, wenn du nicht unterrichtest.", farbe:"weiss" }
        ],
        rechts:[
          { kopf:"Was mir wichtig ist", farbe:"blau",
            punkte:"Verstehen vor Auswendiglernen\nFehler sind Arbeitsmaterial, kein Makel\nKlare Ansagen, verlässliche Rückmeldungen\nFragt früh – nicht kurz vor der Arbeit" },
          { kopf:"So erreicht ihr mich", farbe:"orange",
            text:"Auf welchem Weg, und wie schnell eine Antwort kommt." }
        ] },

      { baustein:"spalten", augenbraue:"Jetzt seid ihr dran", titel:"Kennenlernrunde",
        links:[
          { kopf:"So läuft es ab", farbe:"blau",
            punkte:"*2 Min.* – Sucht euch jemanden, den ihr noch _nicht_ gut kennt.\n*6 Min.* – Interviewt euch gegenseitig.\n*je 1 Min.* – Stellt _euer Gegenüber_ vor." },
          { kopf:"Die Regel", farbe:"orange",
            text:"Ihr stellt nicht euch selbst vor, sondern die andere Person. Also: gut zuhören – und ruhig nachfragen." }
        ],
        rechts:[
          { kopf:"Eure Fragen", farbe:"weiss",
            punkte:"Name – und wie du genannt werden willst.\nDein *schönster* Moment in diesem Fach.\nDein *schwierigster* Moment in diesem Fach.\nWarum hast du diesen Kurs gewählt?\nWas brauchst du, um gut lernen zu können?\nEin Satz, der nichts mit dem Fach zu tun hat." }
        ] },

      { baustein:"karten", augenbraue:"Rückblick", titel:"Wie es bislang lief",
        spalten:"3", schrittweise:true,
        karten:[
          { marke:"🧱", kopf:"Was steht",         text:"Was ihr aus den Jahren davor mitbringt – *das Fundament steht.*" },
          { marke:"🔀", kopf:"Viele Wege hierher", text:"Ihr kommt aus verschiedenen Klassen, mit verschiedenen Erfahrungen und verschiedenem Tempo." },
          { marke:"🛠️", kopf:"Was ich noch nicht weiß", text:"Wo jede und jeder gerade wirklich steht. Genau das finden wir gemeinsam heraus." }
        ] },

      { baustein:"merksatz", augenbraue:"Klartext", titel:"Was jetzt zählt",
        kopf:"Ehrlich bleiben – das ist die Grundlage",
        satz:"Kein Thema von früher wird noch einmal von vorn unterrichtet. Aber: _Lücken lassen sich schließen_ – wenn wir sie kennen. Sprecht mich an, wir finden eine Lösung.",
        nachsatz:"Frage in die Runde: Wo fühlt ihr euch sicher – und wo wackelt es noch?" },

      { baustein:"karten", augenbraue:"Wohin wir wollen", titel:"Unsere Ziele",
        spalten:"2", schrittweise:true,
        karten:[
          { marke:"1", kopf:"Sicher zum Abschluss",   text:"Jede und jeder erreicht mindestens das persönlich mögliche Ergebnis – nachweisbar, nicht auf gut Glück.", farbe:"blau" },
          { marke:"2", kopf:"Verstehen statt Nachmachen", text:"Ihr sollt erklären können, _warum_ etwas funktioniert – nicht nur, wie man es abspult.",             farbe:"blau" },
          { marke:"3", kopf:"Selbstständig arbeiten", text:"Am Ende plant ihr eure Vorbereitung selbst: Lücken erkennen, Material wählen, Fortschritt prüfen.",      farbe:"blau" },
          { marke:"4", kopf:"Ein Kurs, der trägt",    text:"Wir helfen uns gegenseitig. Wer erklärt, lernt doppelt – und niemand fällt unbemerkt hinten runter.",    farbe:"blau" }
        ] },

      { baustein:"abschluss",
        satz:"Hier steht der Satz,\nmit dem ihr rausgehen sollt.",
        quelle:"WER ES GESAGT HAT",
        marken:"Kurs · Jahrgang\nWillkommen!" }
    ]
  },

  /* Dateiformat der gesicherten Präsentation. Wird hochgesetzt,
     wenn sich der Aufbau der Datei ändert.                     */
  version: 1
};
