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
    zweier: { name:"Zweiertisch", breite:130, tiefe:55, plaetze:2 },
    einzel: { name:"Einzeltisch", breite: 65, tiefe:55, plaetze:1 },
    tafel:  { name:"Tafel",       breite:300, tiefe:12, plaetze:0 },
    tuer:   { name:"Tür",         breite: 90, tiefe:12, plaetze:0 }
  },

  /* ---- Schieben und Drehen -----------------------------------
     raster:      Tische rasten auf diesem Zentimeter-Raster ein,
                  damit Reihen von selbst gerade werden.
     drehschritt: in solchen Winkelschritten wird gedreht.
                  15° erlaubt auch schräge Gruppen; 90° wären
                  nur die vier geraden Richtungen.              */
  raster: 5,
  drehschritt: 15,

  /* ---- Papierformate ----------------------------------------- */
  formate: {
    a4quer: { name:"A4 quer  ·  Standard",          breite:297, hoehe:210, seite:"A4 landscape" },
    a4hoch: { name:"A4 hoch",                       breite:210, hoehe:297, seite:"A4 portrait"  },
    a3quer: { name:"A3 quer  ·  fürs Klassenzimmer", breite:420, hoehe:297, seite:"A3 landscape" }
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
