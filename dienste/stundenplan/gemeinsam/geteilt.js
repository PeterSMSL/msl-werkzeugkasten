/* ============================================================
   GETEILT.JS  –  was für ALLE Stufen gilt.
   Schulname, Logo, Papierformate, Farbwelten, Wochentage
   und die Liste der Stufen selbst.
   Ändert sich hier etwas, ändert es sich überall.
   ============================================================ */

const KATALOG = {
  /* ---- Schule ------------------------------------------------ */
  schule: "MSL",

  /* ---- Die Stufen --------------------------------------------
     Steuert die Kacheln auf der Startseite.
     bereit:false  ->  Kachel ist zu sehen, aber noch nicht klickbar.
     Sobald es einen Ordner stufen/<id>/ mit daten.js und
     plan-design.js gibt, hier auf bereit:true stellen.          */
  stufen: [
    { id:"1-3", name:"Klassen 1 – 3", thema:"Planeten",        bereit:true  },
    { id:"4-6", name:"Klassen 4 – 6", thema:"Lehrkräfte",     bereit:false },
    { id:"7-8", name:"Klassen 7 / 8", thema:"Lehrkräfte",     bereit:false }
  ],

  /* ---- Papierformate -----------------------------------------
     Alle im Querformat – fünf Tage nebeneinander brauchen Breite.
     breite/hoehe in Millimetern, seite = was der Drucker bekommt. */
  formate: {
    a4: { name:"A4 quer  ·  Standard",      breite:297, hoehe:210, seite:"A4 landscape" },
    a3: { name:"A3 quer  ·  fürs Klassenzimmer", breite:420, hoehe:297, seite:"A3 landscape" },
    a5: { name:"A5 quer  ·  fürs Heft",     breite:210, hoehe:148, seite:"A5 landscape" }
  },

  /* ---- Farbwelten --------------------------------------------
     bg = Kastenfarbe, ac = Farbstrich, label = Text der Legende.
     Gilt für alle Stufen; eine Stufe kann den Block überschreiben. */
  farben: {
    fa:      { bg:"#FFF3DF", ac:"#E09B2D", label:"Freie Arbeit" },
    kosmos:  { bg:"#EDE8FB", ac:"#7355C6", label:"Kosmos" },
    sport:   { bg:"#E1F5F1", ac:"#22A18B", label:"Sport" },
    musik:   { bg:"#FCE7EF", ac:"#D14C86", label:"Musik" },
    kunst:   { bg:"#FFE9DF", ac:"#E4642F", label:"Kunst" },
    projekt: { bg:"#E5EFFD", ac:"#3572C4", label:"Projekte" },
    sozial:  { bg:"#E7F6E2", ac:"#4F9E3C", label:"Soziales Lernen" },
    ritual:  { bg:"#FBF2D8", ac:"#C2971C", label:"Klassenstunde" },
    sprache: { bg:"#E8EAFB", ac:"#5A5FC7", label:"Sprachen" },
    natur:   { bg:"#E9F4E4", ac:"#5AA347", label:"Umgebung & Natur" },
    neutral: { bg:"#F1F3F7", ac:"#8A93AC", label:"Sonstiges" }
  },

  /* ---- Logo der Schule (unten rechts) ------------------------
     Das Bild selbst steht in haus/marke.js – eine Stelle für alle
     Werkzeuge. Diese Datei muss vorher geladen sein.            */
  logo: MSL_LOGO,

  tage: ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag"]
};
