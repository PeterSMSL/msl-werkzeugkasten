/* ============================================================
   FOLIEN-DESIGN.JS  –  das Aussehen der Folien.

   Steht als Text in JavaScript, damit die Werkstatt daraus auch
   fertige Einzeldateien bauen kann. Eine Quelle für Vorschau,
   Vorführung, Ausdruck und Export – die vier können deshalb gar
   nicht auseinanderlaufen.

   EINE FOLIE IST IMMER 1280 × 720 BILDPUNKTE.
   Das ist die Naht dieses Werkzeugs. Bildschirm, Vorschau und
   Papier unterscheiden sich nur darin, mit welchem Faktor diese
   Fläche skaliert wird – genau wie der Raum in der Sitzordnung
   immer in Zentimetern gerechnet wird. Alle Maße hier drin sind
   deshalb Bildpunkte und dürfen es auch sein.
   ============================================================ */

const FOLIEN_CSS = `
/* Safari braucht beim Drucken einen Sonderweg. Warum, steht
   ausführlich in haus/drucken.js – dort ist es die eine Stelle
   für alle Werkzeuge. Der fertige CSS-Text wird hier eingesetzt
   und reist deshalb auch in einer exportierten Datei mit.       */
${DRUCK.kleinerInSafari(".folienrahmen")}

/* ---- Die Hausfarben, hier als Zahlen ----------------------------

   Sie stehen bewusst NICHT als var(--msl-blau) da: dieses CSS
   reist in gesicherten Einzeldateien mit, und dort liegt kein
   haus.css daneben. Ändert sich eine Hausfarbe, ist dies die
   Stelle, an der sie nachgezogen werden muss.

   Zwei Abweichungen von haus.css, beide mit Grund:
   f-blau-hell  eine aufgehellte Fassung des Hausblaus, nur für
                Farbverläufe im Kopf und in den Säulen.
   f-orange-schrift  Orange auf Weiß kommt auf 2,4:1 und ist
                unlesbar – das sagt haus.css ausdrücklich. Wo
                Orange als SCHRIFT auftritt (die kleine Zeile über
                der Überschrift), steht deshalb dieses dunkle
                Bernsteinbraun: 6,9:1 auf Weiß.

   Sie stehen auf .folie und nicht auf dem Rahmen darum: beim
   Vorführen und in der exportierten Datei gibt es gar keinen
   Rahmen, dort stehen die Folien für sich.                      */
.folie{
  --f-blau:#0060A8;
  --f-blau-tief:#00538F;
  --f-blau-hell:#3E8FD0;
  --f-blau-pastell:#E7F0F8;
  --f-orange:#F09018;
  --f-orange-warm:#FFA733;
  --f-orange-pastell:#FDF0DD;
  --f-orange-schrift:#8A5A00;
  --f-tinte:#1F2A37;
  --f-grau:#5C6B7A;
  --f-linie:#DDE4EC;
}

/* Der Reset MUSS vor der Regel für .folie stehen. Stünde er
   dahinter, löschte sein "padding:0" den Innenabstand der Folie
   gleich wieder – und die Überschrift verschwände hinter der
   Kopfleiste. Genau so ist es beim ersten Bauen passiert.      */
.folie, .folie *{ box-sizing:border-box; margin:0; padding:0; }

/* ---- Rahmen und Fläche -----------------------------------------
   Der Rahmen bekommt die Größe des Ziels (Bildschirmplatz oder
   Papier), die Folie ist immer 1280 x 720 und wird hineingerechnet. */
.folienrahmen{ overflow:hidden; position:relative; }
.folienrahmen > .folie{ transform-origin:top left; }

.folie{
  position:relative;
  width:1280px; height:720px;
  background:#fff; color:var(--f-tinte);
  /* Sansation ist die Wunschschrift der Schule. Sie muss, wenn sie
     kommt, als eingebettete Schriftdatei mitreisen – ein Abruf im
     Netz verbietet sich hier doppelt (läuft ohne Netz, und es geht
     nichts nach draußen). Bis dahin trägt der Stapel dahinter.   */
  font-family:"Sansation","Segoe UI Variable Text","Segoe UI",
              system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif;
  overflow:hidden;
  display:flex; flex-direction:column;
  padding:86px 62px 58px;
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
}

/* ---- Kopfleiste der Folie --------------------------------------
   Logo, Schulname, rechts der Kurs. Der schmale Streifen darunter
   ist zu einem Drittel kräftig orange und dann hell – ein kleiner
   Wiedererkennungswert, der auf jeder Folie gleich sitzt.        */
.folie .kopf{
  position:absolute; top:0; left:0; right:0; height:58px;
  background:linear-gradient(100deg,var(--f-blau-tief) 0%,
                             var(--f-blau) 55%,var(--f-blau-hell) 100%);
  display:flex; align-items:center; gap:14px;
  padding:0 22px 0 18px; color:#fff; z-index:5;
}
.folie .kopf::after{
  content:""; position:absolute; left:0; right:0; bottom:-5px; height:5px;
  background:linear-gradient(90deg,var(--f-orange) 0%,var(--f-orange) 34%,
                             #F6C46E 34%,#F6C46E 100%);
}
.folie .kopf img{ height:40px; width:auto; filter:drop-shadow(0 1px 2px rgba(0,0,0,.25)); }
.folie .kopf .schule{
  font-size:13px; font-weight:700; letter-spacing:.10em;
  text-transform:uppercase; opacity:.95;
}
.folie .kopf .anlass{
  margin-left:auto; font-size:12.5px; font-weight:600; letter-spacing:.06em;
  background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.28);
  padding:5px 12px; border-radius:999px;
}

/* ---- Schrift ---------------------------------------------------- */
.folie h1{ font-size:56px; line-height:1.06; font-weight:800; letter-spacing:-.02em; }
.folie h2{ font-size:40px; line-height:1.12; font-weight:800; letter-spacing:-.015em;
           color:var(--f-blau-tief); }
.folie h3{ font-size:20px; font-weight:750; color:var(--f-blau-tief); }
.folie p, .folie li{ font-size:19px; line-height:1.5; color:var(--f-tinte); }
.folie .klein{ font-size:16px; line-height:1.45; color:var(--f-grau); }
.folie strong{ color:var(--f-blau-tief); }
/* Kein Kursiv, sondern ein Textmarker – das liest sich auf dem
   Beamer aus der letzten Reihe besser als schräge Buchstaben.   */
.folie em{
  font-style:normal; padding:0 2px;
  background:linear-gradient(transparent 62%, var(--f-orange-pastell) 62%);
}

.folie .augenbraue{
  font-size:13px; font-weight:800; letter-spacing:.18em; text-transform:uppercase;
  color:var(--f-orange-schrift); margin-bottom:10px;
}
.folie .titelzeile{ margin-bottom:26px; flex:none; }
.folie .titelzeile h2::after{
  content:""; display:block; width:64px; height:5px; border-radius:3px;
  background:var(--f-orange); margin-top:12px;
}
/* "safe center": bei zu viel Inhalt wird oben ausgerichtet statt
   über den oberen Rand hinauszuwachsen.                         */
.folie .inhalt{ flex:1; min-height:0; display:flex; flex-direction:column;
                justify-content:safe center; }

/* ---- Karten ----------------------------------------------------- */
.folie .raster{ display:grid; gap:20px; }
.folie .raster.s2{ grid-template-columns:repeat(2,1fr); }
.folie .raster.s3{ grid-template-columns:repeat(3,1fr); }

.folie .karte{
  background:#fff; border:1px solid var(--f-linie); border-radius:12px;
  padding:20px 22px; box-shadow:0 2px 0 rgba(0,96,168,.05);
  display:flex; flex-direction:column; gap:8px;
}
.folie .karte.blau{ background:var(--f-blau-pastell); border-color:#C4DFF2; }
.folie .karte.orange{ background:var(--f-orange-pastell); border-color:#F3DCAF; }
.folie .karte.voll{
  background:linear-gradient(150deg,var(--f-blau-tief),var(--f-blau));
  border:none; color:#fff;
}
.folie .karte.voll h3, .folie .karte.voll strong{ color:#fff; }
.folie .karte.voll p, .folie .karte.voll li{ color:rgba(255,255,255,.92); }
.folie .karte.voll em{ background:linear-gradient(transparent 62%, rgba(240,144,24,.45) 62%); }
.folie .karte p, .folie .karte li{ font-size:17px; line-height:1.45; }

/* Ein Stapel Karten untereinander – das ist die Spalte in der
   Folienart "Zwei Spalten" und der Rumpf der schlichten Textfolie. */
.folie .stapel{ display:flex; flex-direction:column; gap:18px; }
.folie .karte .symbol{ font-size:26px; line-height:1; }

/* Die orange Nummernkachel. Dunkle Schrift auf Orange – auf der
   Fläche ist Orange erlaubt, als Schrift nicht.                 */
.folie .nummer{
  width:38px; height:38px; flex:none; border-radius:10px;
  background:var(--f-orange); color:#3A2400;
  display:flex; align-items:center; justify-content:center;
  font-weight:800; font-size:19px;
}
.folie .zeile{ display:flex; gap:16px; align-items:flex-start; }
.folie .karte.voll .nummer{ color:#3A2400; }

/* ---- Bilder -------------------------------------------------------
   Der Platz nimmt sich den freien Raum und das Bild passt sich ihm an –
   "ganz zeigen" (contain) lässt nichts weg, "Fläche füllen" (cover)
   beschneidet die Ränder. Beides wird am Bild selbst gesetzt.
   Der graue Grund ist nur dann zu sehen, wenn das Bild nicht das
   ganze Feld ausfüllt; er gibt der Folie trotzdem eine ruhige Kante. */
.folie .bildganz{ flex:1; min-height:0; display:flex; flex-direction:column; gap:10px; }
.folie .bildplatz{
  flex:1; min-height:0; position:relative;
  background:#F2F5F9; border-radius:12px; overflow:hidden;
  display:grid; place-items:center;
}
.folie .bildplatz img{ width:100%; height:100%; display:block; }
.folie .bildplatz > span{
  font-size:15px; color:var(--f-grau); letter-spacing:.08em; text-transform:uppercase;
}
.folie .bildzeile{ flex:none; text-align:right; }

/* Ein Video – auf dem Papier und in der Vorschau ein Standbild mit
   Abspielzeichen, in der Vorführung ein echtes <video>.          */
.folie .videoplatz{ background:#22303C; }
.folie .videoplatz video{ width:100%; height:100%; display:block; object-fit:contain; }
/* Ohne Standbild steht der Dateiname unter dem Abspielzeichen und
   nicht dahinter – sonst überlagern sich beide.                 */
.folie .videoplatz > span:not(.abspielen){
  position:absolute; left:0; right:0; bottom:14%;
  text-align:center; color:#C6D3DE; padding:0 20px;
}
.folie .videoplatz .abspielen{
  position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
  width:88px; height:88px; border-radius:50%;
  background:rgba(0,83,143,.82); box-shadow:0 6px 24px rgba(0,0,0,.35);
}
/* Das Dreieck: ein Rahmen, dessen drei andere Seiten durchsichtig
   sind – so braucht es keine Grafik, die mitgeladen werden müsste. */
.folie .videoplatz .abspielen::after{
  content:""; position:absolute; left:54%; top:50%;
  transform:translate(-50%,-50%);
  border-style:solid; border-width:17px 0 17px 28px;
  border-color:transparent transparent transparent #fff;
}
/* Nebeneinander soll das Bild nicht zum Streifen werden. */
.folie .bildpaar{ align-items:stretch; }
.folie .bildpaar .bildplatz{ min-height:300px; }

/* ---- Aufzählung -------------------------------------------------- */
.folie ul.liste{ list-style:none; display:flex; flex-direction:column; gap:11px; }
.folie ul.liste li{ position:relative; padding-left:30px; }
.folie ul.liste li::before{
  content:""; position:absolute; left:6px; top:.55em;
  width:9px; height:9px; border-radius:3px; background:var(--f-orange);
}
.folie .karte.blau ul.liste li::before{ background:var(--f-blau); }
.folie .karte.voll ul.liste li::before{ background:var(--f-orange); }

/* ---- Kurze Angaben ------------------------------------------------
   Die kleinen abgerundeten Beschriftungen für Datum, Raum, Gruppe.  */
.folie .angabe{
  display:inline-block; padding:6px 14px; border-radius:999px;
  background:var(--f-blau-pastell); color:var(--f-blau-tief);
  font-size:16px; font-weight:650; border:1px solid #C4DFF2;
}
.folie .angabe.o{
  background:var(--f-orange-pastell); color:var(--f-orange-schrift);
  border-color:#F3DCAF;
}
.folie .angaben{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; }

/* ---- Zitat -------------------------------------------------------- */
.folie .zitat{
  border-left:6px solid var(--f-orange); padding:6px 0 6px 22px;
  font-size:26px; line-height:1.35; font-weight:600; color:var(--f-blau-tief);
}
.folie .karte.voll .zitat{ color:#fff; }
.folie .zitatquelle{
  margin-top:14px; font-size:17px; font-weight:600;
  letter-spacing:.06em; color:var(--f-grau);
}

/* ---- Fußzeile ----------------------------------------------------- */
/* Drei Teile: Anlass, wer und wann, Nummer. Die Mitte bleibt
   mittig, auch wenn links und rechts verschieden lang sind –
   deshalb bekommen die äußeren dieselbe Grundbreite.          */
.folie .fuss{
  position:absolute; left:62px; right:62px; bottom:20px;
  display:flex; justify-content:space-between; align-items:center; gap:16px;
  font-size:12.5px; color:var(--f-grau);
  border-top:1px solid var(--f-linie); padding-top:9px;
}
.folie .fuss > span:first-child,
.folie .fuss > span:last-child{ flex:1 0 0; }
.folie .fuss > span:last-child{ text-align:right; }
.folie .fuss > span:nth-child(2){ flex:none; }

/* ---- Die dunklen Folien: Titel und Abschluss ---------------------- */
.folie.titel{
  padding:0; color:#fff;
  background:
    radial-gradient(1100px 520px at 78% 8%, rgba(240,144,24,.20), transparent 62%),
    linear-gradient(140deg,#003C69 0%, var(--f-blau-tief) 40%, var(--f-blau) 100%);
  display:grid; grid-template-columns:1.35fr .65fr;
}
.folie.titel .links{
  padding:74px 56px 56px; display:flex; flex-direction:column; justify-content:center;
}
.folie.titel .rechts{
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:22px; background:rgba(255,255,255,.07);
  border-left:1px solid rgba(255,255,255,.16);
}
.folie.titel .logokachel{
  background:#fff; border-radius:38px; padding:28px 30px;
  box-shadow:0 20px 46px rgba(0,0,0,.30), 0 0 0 1px rgba(255,255,255,.5);
  display:flex; align-items:center; justify-content:center;
}
.folie.titel .logokachel img{ width:168px; display:block; }
.folie.titel .schulname{
  font-size:14px; letter-spacing:.14em; text-transform:uppercase;
  font-weight:700; opacity:.9; text-align:center; line-height:1.4;
}
.folie.titel h1{ color:#fff; }
.folie.titel .augenbraue{ color:var(--f-orange-warm); }
.folie.titel .unter{
  font-size:23px; color:rgba(255,255,255,.9); margin-top:18px; max-width:640px;
}
.folie.titel .meta{ margin-top:38px; display:flex; gap:12px; flex-wrap:wrap; }
.folie.titel .meta span{
  background:rgba(255,255,255,.13); border:1px solid rgba(255,255,255,.26);
  padding:8px 16px; border-radius:999px; font-size:15.5px; font-weight:600;
}
.folie.titel .balken{
  height:6px; width:110px; background:var(--f-orange);
  border-radius:4px; margin-bottom:26px;
}

.folie.abschluss{ grid-template-columns:1fr; }
.folie.abschluss .links{ align-items:center; text-align:center; padding:60px 120px; }
.folie.abschluss img{
  width:64px; margin-bottom:34px; background:rgba(255,255,255,.92);
  border-radius:50%; padding:9px; box-shadow:0 8px 24px rgba(0,0,0,.28);
}
.folie .zitatgross{
  font-size:40px; line-height:1.28; font-weight:700; letter-spacing:-.015em;
  color:#fff; max-width:900px;
}
.folie .zitatgross .strich{
  display:block; width:56px; height:5px; background:var(--f-orange);
  border-radius:3px; margin:26px auto 20px;
}
.folie .quelle{
  font-size:18px; font-weight:600; color:var(--f-orange-warm); letter-spacing:.06em;
}

/* ---- Schrittweises Aufdecken --------------------------------------
   Eine Folie ist von sich aus VOLLSTÄNDIG. Nur die Vorführung
   versteckt die Teile und holt sie einzeln hervor – die Regel dafür
   steht in vorfuehren.js und greift ausschließlich innerhalb von
   #buehne.

   Andersherum wäre es falsch: stünde hier "opacity:0", wären die
   Karten auch in der Vorschau und auf dem Ausdruck unsichtbar. Genau
   das ist beim ersten Bauen passiert – die Vorschau zeigte eine
   Überschrift über einer leeren Fläche.                          */
.folie .schritt{ transition:opacity .3s ease, transform .3s ease; }
`;

/* Welches Papier der Drucker einziehen soll – die gemeinsame
   Stelle dafür ist haus/drucken.js.                          */
function folienSeitenCSS(formatId) {
  return DRUCK.seitengroesse(VORTRAG.formate[formatId] || VORTRAG.formate.a4quer);
}
