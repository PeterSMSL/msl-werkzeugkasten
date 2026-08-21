/* ============================================================
   DATEN.JS  –  Stufe 1 bis 3  (Thema: Planeten)
   Hier stehen die Auswahlmöglichkeiten dieser Stufe drin.
   Diese Datei darfst du bearbeiten. Alles andere nicht nötig.
   Regel: Kommas zwischen den Einträgen nicht vergessen.

   Schulname, Logo, Papierformate, Farben und Wochentage stehen
   nicht hier, sondern in gemeinsam/geteilt.js – die gelten für
   alle Stufen gemeinsam.
   ============================================================ */

Object.assign(KATALOG, {
  /* ---- Stand dieser Datei ------------------------------------
     Nach jeder Änderung an faecher / klassen / standardPlan hier
     das Datum hochsetzen. Wer noch einen älteren Stand im Browser
     liegen hat, bekommt dann einen Hinweis statt veralteter Werte. */
  stand: "2026-08-19",

  /* ---- Klassen (= Planeten) ----------------------------------
     DIE eine Stelle für die Klassen. Sie steuert beides:
     die Klassenauswahl oben UND die Planeten, die bei der
     Betreuten Freizeit angeboten werden.
     Namen einfach aus der Liste streichen oder ergänzen.        */
  klassen: ["merkur", "venus", "mars", "jupiter", "saturn", "uranus", "neptun"],

  /* ---- Fächer -------------------------------------------------
     name  = so heißt das Fach und so wird es gedruckt
     farbe = einer der Schlüssel aus "farben" oben
     Diese Liste ist nur ein Vorschlag beim Tippen. Lehrkräfte
     können jederzeit etwas anderes eintragen.
     Optional: kurz:"..."  -> dann wird "kurz" gedruckt statt name  */
  faecher: [
    { name:"FA",                       farbe:"fa" },
    { name:"FA / Englisch",            farbe:"fa" },
    { name:"Kosmos",                   farbe:"kosmos" },
    { name:"Sport",                    farbe:"sport" },
    { name:"Schwimmen",                farbe:"sport" },
    { name:"Musik",                    farbe:"musik" },
    { name:"Chor",                     farbe:"musik" },
    { name:"Kunst",                    farbe:"kunst" },
    { name:"Werken",                   farbe:"kunst" },
    { name:"Theater",                  farbe:"kunst" },
    { name:"Projekte",                 farbe:"projekt" },
    { name:"Forschen",                 farbe:"projekt" },
    { name:"Soziales Lernen",          farbe:"sozial" },
    { name:"Soziales Lernen / FA",     farbe:"sozial" },
    { name:"Erzählkreis",              farbe:"ritual" },
    { name:"Klassenrat",               farbe:"ritual" },
    { name:"Lesen / Lesebus",          farbe:"ritual" },
    { name:"Spielen",                  farbe:"ritual" },
    { name:"Englisch",                 farbe:"sprache" },
    { name:"Religion / Ethik",         farbe:"sprache" },
    { name:"Pflege der Umgebung",      farbe:"natur" },
    { name:"Garten",                   farbe:"natur" },
    { name:"Ausflug",                  farbe:"neutral" }
  ],

  /* ---- Planeten-Bilder ---------------------------------------
     Nur anfassen, wenn ein neuer Planet dazu soll.               */
  planeten: [
    { id:"merkur", name:"Merkur", svg:`<svg viewBox="0 0 40 40"><defs><radialGradient id="pg-merkur" cx="34%" cy="30%" r="78%"><stop offset="0%" stop-color="#D6D9E0"/><stop offset="100%" stop-color="#7C8290"/></radialGradient></defs><circle cx="20" cy="20" r="13" fill="url(#pg-merkur)"/><circle cx="15" cy="15" r="2.4" fill="#6E7482" opacity=".45"/><circle cx="24" cy="24" r="3.2" fill="#6E7482" opacity=".35"/><circle cx="25" cy="14" r="1.5" fill="#6E7482" opacity=".4"/></svg>` },
    { id:"venus", name:"Venus", svg:`<svg viewBox="0 0 40 40"><defs><radialGradient id="pg-venus" cx="34%" cy="30%" r="78%"><stop offset="0%" stop-color="#FBE0A6"/><stop offset="100%" stop-color="#D79A3E"/></radialGradient></defs><circle cx="20" cy="20" r="13" fill="url(#pg-venus)"/><path d="M9 16q7-2.5 14 0t8 1" stroke="#C98B32" stroke-width="1.6" fill="none" opacity=".45" stroke-linecap="round"/><path d="M8 24q8 2.5 15 0t8-1" stroke="#C98B32" stroke-width="1.6" fill="none" opacity=".4" stroke-linecap="round"/></svg>` },
    { id:"mars", name:"Mars", svg:`<svg viewBox="0 0 40 40"><defs><radialGradient id="pg-mars" cx="34%" cy="30%" r="78%"><stop offset="0%" stop-color="#EFA277"/><stop offset="100%" stop-color="#B24A25"/></radialGradient></defs><circle cx="20" cy="20" r="13" fill="url(#pg-mars)"/><ellipse cx="20" cy="9.5" rx="4.5" ry="1.8" fill="#F2E4DA" opacity=".8"/><circle cx="15" cy="22" r="2.6" fill="#9C4526" opacity=".4"/><circle cx="25" cy="17" r="1.8" fill="#9C4526" opacity=".35"/></svg>` },
    { id:"jupiter", name:"Jupiter", svg:`<svg viewBox="0 0 40 40"><defs><radialGradient id="pg-jupiter" cx="34%" cy="30%" r="78%"><stop offset="0%" stop-color="#F7C99A"/><stop offset="100%" stop-color="#C97A3C"/></radialGradient></defs><clipPath id="cl-jupiter"><circle cx="20" cy="20" r="13"/></clipPath><circle cx="20" cy="20" r="13" fill="url(#pg-jupiter)"/><g clip-path="url(#cl-jupiter)" opacity=".55"><rect x="6" y="12.5" width="28" height="2.6" fill="#B4652F"/><rect x="6" y="18.4" width="28" height="3.4" fill="#E8B183"/><rect x="6" y="25" width="28" height="2.4" fill="#B4652F"/></g><ellipse cx="25" cy="23.6" rx="3.1" ry="1.9" fill="#A8482A" opacity=".7"/></svg>` },
    { id:"saturn", name:"Saturn", svg:`<svg viewBox="0 0 40 40"><defs><radialGradient id="pg-saturn" cx="34%" cy="30%" r="78%"><stop offset="0%" stop-color="#FBE9B8"/><stop offset="100%" stop-color="#D2A63F"/></radialGradient></defs><ellipse cx="20" cy="21.5" rx="18.5" ry="5.4" fill="none" stroke="#B9903A" stroke-width="2.1" opacity=".55" transform="rotate(-17 20 21.5)"/><circle cx="20" cy="20" r="11.5" fill="url(#pg-saturn)"/><ellipse cx="20" cy="21.5" rx="18.5" ry="5.4" fill="none" stroke="#D9B75C" stroke-width="2.1" transform="rotate(-17 20 21.5)" stroke-dasharray="15 60" stroke-dashoffset="-2"/><path d="M9.5 17q10-2 21 0" stroke="#C29B3F" stroke-width="1.3" fill="none" opacity=".4" stroke-linecap="round"/></svg>` },
    { id:"uranus", name:"Uranus", svg:`<svg viewBox="0 0 40 40"><defs><radialGradient id="pg-uranus" cx="34%" cy="30%" r="78%"><stop offset="0%" stop-color="#BFF0F2"/><stop offset="100%" stop-color="#4FAFC0"/></radialGradient></defs><ellipse cx="20" cy="20" rx="5" ry="17" fill="none" stroke="#5FB6C4" stroke-width="1.5" opacity=".5" transform="rotate(12 20 20)"/><circle cx="20" cy="20" r="12.5" fill="url(#pg-uranus)"/><ellipse cx="20" cy="20" rx="5" ry="17" fill="none" stroke="#7FCBD6" stroke-width="1.5" transform="rotate(12 20 20)" stroke-dasharray="12 60" stroke-dashoffset="-3"/></svg>` },
    { id:"neptun", name:"Neptun", svg:`<svg viewBox="0 0 40 40"><defs><radialGradient id="pg-neptun" cx="34%" cy="30%" r="78%"><stop offset="0%" stop-color="#8FB6F5"/><stop offset="100%" stop-color="#2A4E9E"/></radialGradient></defs><circle cx="20" cy="20" r="13" fill="url(#pg-neptun)"/><path d="M9 17.5q7-2 13 0t9 .8" stroke="#7FA6E8" stroke-width="1.5" fill="none" opacity=".5" stroke-linecap="round"/><ellipse cx="16" cy="24" rx="3.4" ry="2" fill="#1E3D80" opacity=".55"/></svg>` }
  ],

  /* ---- Standard-Wochenraster ---------------------------------
     Das sieht eine Lehrkraft beim ersten Öffnen. Alles davon
     lässt sich im Service noch ändern.

     typ "stunden"  = normale Unterrichtszeile
     typ "band"     = schmaler Streifen quer (Frühstück, Pause …)
     typ "planeten" = Betreute Freizeit, zwei Planeten pro Tag
     null in zellen = gehört zum durchgehenden Band              */
  standardPlan: {
    zeilen: [
      { typ:"stunden", label:"", von:"7.45", bis:"9.30",
        zellen:["FA / Englisch","FA","FA","FA","FA"] },

      { typ:"band", label:"Frühstück", zeit:"9.30 – 9.55", besteck:true,
        zellen:[null,null,null,null,null] },

      { typ:"band", label:"Pause", zeit:"9.55 – 10.25", besteck:false,
        zellen:[null,null,null,null,null] },

      { typ:"stunden", label:"", von:"10.25", bis:"11.55",
        zellen:["Sport","Kosmos","Kosmos","Kosmos","Musik"] },

      { typ:"band", label:"Mittagessen", zeit:"11.55 – 12.40", besteck:true,
        zellen:[null,null,null,null,"Pflege der Umgebung"] },

      { typ:"planeten", label:"Betreute Freizeit", zeit:"12.40 – 13.15",
        zellen:[["uranus","saturn"],["saturn","jupiter"],["neptun","merkur"],["venus","saturn"],[]] },

      { typ:"stunden", label:"Klassenstunde", von:"13.15", bis:"14.00",
        zellen:["Erzählkreis","Lesen / Lesebus","Spielen","Klassenrat",""] },

      { typ:"stunden", label:"", von:"14.00", bis:"15.30",
        zellen:["Kunst","Projekte","Soziales Lernen / FA","Projekte",""] }
    ]
  },
});
