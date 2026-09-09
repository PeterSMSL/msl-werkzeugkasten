/* ============================================================
   DATEN.JS  –  die Vorgaben der Sitzordnung.

   Alles in Zentimetern, so wie man es im Klassenzimmer
   nachmisst. Wenn eure Tische anders sind als hier eingetragen,
   ist das die Stelle zum Ändern – sonst ist an dieser Datei
   nichts zu tun.
   ============================================================ */

const SITZ = {

  schule: "MSL",

  /* Das Schullogo steht in haus/marke.js – eine Stelle für alle
     Werkzeuge. Diese Datei muss vorher geladen sein.          */
  logo: MSL_LOGO,

  /* ---- Die Klassenstufen --------------------------------------
     Welche Jahrgänge in der Klasse sitzen, stellt die Lehrkraft in
     der Werkstatt selbst ein – im Feld „Klassenstufen". Hier steht
     nur, womit es beim ersten Öffnen anfängt.

     Die REIHENFOLGE zählt: der erste Jahrgang ist der jüngste, und
     auf ihn bezieht sich die Mischung „Die Neuen verteilen".
     „1-3" ergibt Stufe 1, 2, 3 – „7-8" eben nur zwei Stufen.     */
  stufenwort: "Stufe",
  stufenVorgabe: [1, 2, 3],
  stufenHoechstens: 6,

  /* ---- Wie gemischt wird --------------------------------------
     Bezieht sich immer auf den Zweiertisch – nur dort sitzen zwei
     Kinder nebeneinander.                                       */
  mischungen: [
    { id:"frei",
      name:"Völlig frei",
      was:"Der Jahrgang spielt beim Würfeln keine Rolle." },
    { id:"neue",
      name:"Die Neuen verteilen",
      was:"An keinem Zweiertisch sitzen zwei Kinder aus der " +
          "untersten Klassenstufe. Jedes neue Kind bekommt also " +
          "ein älteres daneben." }
  ],

  /* ---- Der Raum ----------------------------------------------
     Ein durchschnittliches Klassenzimmer ist ungefähr acht Meter
     breit und sechs Meter tief. Das sind nur die Startwerte –
     in der Werkstatt lässt sich der Raum jederzeit ändern.     */
  raum: { breite:800, tiefe:600, kleinster:300, groesster:2000 },

  /* ---- Was man in den Raum stellen kann -----------------------
     breite/tiefe in Zentimetern, plaetze = wie viele Kinder
     daran sitzen.

     Der Zweiertisch ist das Paar. Wer dort zusammensitzt, gilt
     im Regelwerk als „nebeneinander" – nur darauf beziehen sich
     Pflicht- und Ausschlusspaare. Am Einzeltisch sitzt ein Kind
     für sich, das ist nie ein Paar.                            */
  moebel: {
    zweier: { name:"Zweiertisch", breite:130, tiefe:55, plaetze:2, ebene:4 },
    einzel: { name:"Einzeltisch", breite: 65, tiefe:55, plaetze:1, ebene:4 },

    /* ---- Die Einrichtung ------------------------------------
       Alles hier hat plaetze:0 – es sind keine Sitzplätze,
       sondern Dinge, an denen man sich im Raum orientiert.

       bild     ein SVG von oben gesehen, so wie ein Grundriss.
                Es wird auf die Größe des Kastens gezogen, das
                Seitenverhältnis passt also zu breite/tiefe.
       andocken legt sich beim Schieben an die nächste Wand.
                Das haben NUR Tafel und Tür: sie gehören dorthin,
                und der Magnet nimmt einem die Feinarbeit ab. Alles
                andere soll sich frei und ohne Rucken überallhin
                schieben lassen – ein Regal steht auch mal quer im
                Raum als Trennwand.
       groessenAenderbar
                laesst sich an der Ecke groesser und kleiner
                ziehen. Nur fuer Dinge, deren Groesse im echten
                Raum wirklich schwankt.
       ebene    was liegt vor was. Der Teppich liegt am Boden
                (1), die Tische darüber (4).

       Ein weiteres Möbelstück ist ein weiterer Eintrag hier –
       am Werkzeug selbst ist nichts zu ändern.               */

    tafel: { name:"Tafel", breite:300, tiefe:12, plaetze:0,
             andocken:true, ebene:3 },

    tuer:  { name:"Tür", breite:90, tiefe:12, plaetze:0,
             andocken:true, ebene:3 },

    regal: { name:"Regal", breite:120, tiefe:35, plaetze:0,
             groessenAenderbar:true, ebene:3,
             bild:`<svg viewBox="0 0 120 35">
      <rect x="1.5" y="1.5" width="117" height="32" rx="3"
            fill="#F0E6D6" stroke="#B4915F" stroke-width="2.5"/>
      <path d="M31 1.5V33.5M60 1.5V33.5M89 1.5V33.5"
            stroke="#B4915F" stroke-width="2"/></svg>` },

    waschbecken: { name:"Waschbecken", breite:60, tiefe:45, plaetze:0,
             ebene:3,
             bild:`<svg viewBox="0 0 60 45">
      <rect x="1.5" y="1.5" width="57" height="42" rx="5"
            fill="#E8EFF6" stroke="#7893B0" stroke-width="2.5"/>
      <ellipse cx="30" cy="27" rx="17" ry="12" fill="none"
               stroke="#7893B0" stroke-width="2.5"/>
      <circle cx="30" cy="27" r="2.6" fill="#7893B0"/>
      <rect x="26" y="5" width="8" height="6" rx="2" fill="#7893B0"/></svg>` },

    leseecke: { name:"Leseecke", breite:160, tiefe:70, plaetze:0,
             groessenAenderbar:true, ebene:3,
             bild:`<svg viewBox="0 0 160 70">
      <rect x="2" y="2" width="156" height="66" rx="9"
            fill="#F5E8ED" stroke="#C08BA0" stroke-width="2.5"/>
      <path d="M2 19h156" stroke="#C08BA0" stroke-width="2"/>
      <path d="M55 19V68M105 19V68" stroke="#C08BA0" stroke-width="2"/></svg>` },

    teppich: { name:"Teppich", breite:200, tiefe:140, plaetze:0,
             groessenAenderbar:true, ebene:1,
             bild:`<svg viewBox="0 0 200 140">
      <rect x="2" y="2" width="196" height="136" rx="12"
            fill="#E9F1E7" stroke="#89AE8E" stroke-width="3"/>
      <rect x="15" y="15" width="170" height="110" rx="7" fill="none"
            stroke="#89AE8E" stroke-width="2" stroke-dasharray="8 7"/></svg>` },

    pflanze: { name:"Pflanze", breite:45, tiefe:45, plaetze:0,
             ebene:3,
             bild:`<svg viewBox="0 0 45 45">
      <circle cx="22.5" cy="22.5" r="20.5" fill="#E7F1E3"
              stroke="#79A873" stroke-width="2.5"/>
      <g fill="#79A873">
        <ellipse cx="22.5" cy="10" rx="4.5" ry="8"/>
        <ellipse cx="33" cy="18.5" rx="8" ry="4.5"/>
        <ellipse cx="29" cy="32" rx="6" ry="7" transform="rotate(30 29 32)"/>
        <ellipse cx="14" cy="30" rx="7" ry="5" transform="rotate(-25 14 30)"/>
        <ellipse cx="11.5" cy="16" rx="6.5" ry="5" transform="rotate(25 11.5 16)"/>
      </g>
      <circle cx="22.5" cy="22.5" r="4.2" fill="#B9895A"/></svg>` }
  },

  /* ---- Schieben und Drehen -----------------------------------
     raster:      Tische rasten auf diesem Zentimeter-Raster ein,
                  damit Reihen von selbst gerade werden.
     drehschritt: in solchen Winkelschritten wird gedreht.
                  15° erlaubt auch schräge Gruppen; 90° wären
                  nur die vier geraden Richtungen.              */
  raster: 5,
  drehschritt: 15,

  /* Kleiner als das laesst sich nichts ziehen – in Zentimetern. */
  kleinstesMoebel: 30,

  /* ---- Andocken an die Wand ---------------------------------
     Tafel und Tür (alles mit andocken:true) legen sich beim
     Schieben bündig an die nächste Wand, sobald sie ihr näher
     als so viele Zentimeter kommen – mit der Drehung, die
     dorthin gehört. Weiter weg stehen sie frei im Raum.      */
  andockweite: 120,

  /* ---- Papierformate ----------------------------------------- */
  formate: {
    a4quer: { name:"A4 quer  ·  Standard",          breite:297, hoehe:210, seite:"A4 landscape" },
    a4hoch: { name:"A4 hoch",                       breite:210, hoehe:297, seite:"A4 portrait"  },
    a3quer: { name:"A3 quer  ·  fürs Klassenzimmer", breite:420, hoehe:297, seite:"A3 landscape" }
  },

  /* ---- Die Ziehung -------------------------------------------
     Wie lange die Vorführung für EIN Kind dauert, in Millisekunden
     (1000 = eine Sekunde). Das ist die Stelle zum Nachstellen,
     wenn es zu schnell oder zu langsam wirkt.

       heran         aus dem Haufen in die Mitte, dabei groß werden
       zeigen        wie lange der Name groß stehen bleibt
       suchen        Dauer EINES Schwebeflugs über einen Platz
       sucheSchritte wie viele Plätze angeschaut werden, bevor der
                     richtige gefunden ist
       landen        vom letzten Zwischenhalt auf den eigenen Platz
                     (bewusst der längste Abschnitt – das Hinsetzen
                      soll ruhig wirken, nicht wie ein Zuschnappen)
       pause         Ruhe, bevor der nächste Name gezogen wird

     Zusammen sind das hier knapp sechs Sekunden je Kind – bei
     zwanzig Kindern also rund zwei Minuten. Das ist Absicht: es
     ist eine Vorführung und kein Ladebalken. Wer es eilig hat,
     drückt „Überspringen“.                                     */
  ziehung: {
    heran:  700,
    zeigen: 2400,
    suchen: 850,
    sucheSchritte: 2,
    landen: 1800,
    pause:  300
  },

  /* ---- Wie oft der Rechner würfeln darf ----------------------
     Passt eine Verteilung nicht zu den Regeln, würfelt er neu.
     Nach so vielen Versuchen gibt er auf und sagt, welche Regel
     im Weg steht – statt endlos weiterzurechnen.               */
  versuche: 3000,

  /* Dateiformat der gesicherten Sitzordnung. Wird hochgesetzt,
     wenn sich der Aufbau der Datei ändert.                     */
  version: 1
};
