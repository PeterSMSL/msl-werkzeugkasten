/* ============================================================
   PLAN-DESIGN.JS  –  das Aussehen des gedruckten Stundenplans.
   Steht als Text in JavaScript, damit der Service daraus auch
   fertige Einzeldateien bauen kann. Eine Quelle für alles.
   ============================================================ */

const PLAN_CSS = `
@page { margin: 0; }

/* Safari braucht beim Drucken einen Sonderweg. Warum, steht
   ausführlich in haus/drucken.js – dort ist es die eine Stelle
   für alle Werkzeuge. Der fertige CSS-Text wird hier eingesetzt
   und reist deshalb auch in einer gesicherten Einzeldatei mit. */
${DRUCK.kleinerInSafari(".blattrahmen")}

/* Der Rahmen hat die Größe des Papiers, das Blatt ist immer in
   A4-Maßen gebaut und wird hineingerechnet. So bleibt ein einziges
   Layout für alle Formate – nichts verrutscht bei A3 oder A5.     */
.blattrahmen{ overflow:hidden; }
.blattrahmen > .blatt{ transform-origin:top left; }

.blatt{
  width:297mm; height:209.7mm; padding:7mm;
  background:#fff; color:#1B2340;
  font-family:"Segoe UI Variable Display","Segoe UI",Candara,Calibri,system-ui,sans-serif;
  text-transform:uppercase;
  display:flex; flex-direction:column; gap:3.2mm;
  overflow:hidden;
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
}
.blatt, .blatt *{ box-sizing:border-box; margin:0; padding:0; }

/* ---------------- Kopf ---------------- */
.blatt .kopf{
  position:relative; overflow:hidden; flex:none;
  border-radius:4mm;
  background:
    radial-gradient(ellipse 60% 120% at 88% 20%, rgba(115,85,198,.55), transparent 60%),
    radial-gradient(ellipse 50% 110% at 8% 90%, rgba(34,161,139,.35), transparent 62%),
    linear-gradient(105deg,#141B3C 0%,#20244F 55%,#2C2657 100%);
  color:#fff;
  padding:4.2mm 7mm 4mm;
  display:flex; align-items:center; justify-content:space-between; gap:8mm;
}
.blatt .sterne{ position:absolute; inset:0; opacity:.85; }
.blatt .titel{ position:relative; z-index:2; }
.blatt h1{
  font-size:23pt; font-weight:300; letter-spacing:.11em; line-height:1;
}
.blatt h1 b{ font-weight:700; }
.blatt .wochentage{
  margin-top:1.6mm; font-size:8pt; letter-spacing:.24em;
  color:#B9C2E6; font-weight:600;
}
.blatt .kopfrechts{ position:relative; z-index:2; display:flex; align-items:center; gap:6mm; }

.blatt .namensfeld{ min-width:52mm; }
.blatt .namensfeld span{
  display:block; font-size:7pt; letter-spacing:.18em;
  color:#A9B3DC; font-weight:700; margin-bottom:2.4mm;
}
.blatt .namensfeld i{ display:block; height:.45mm; background:rgba(255,255,255,.45); border-radius:1mm; }
.blatt .namensfeld.gefuellt{ padding-bottom:.6mm; }
.blatt .namensfeld.gefuellt b{
  display:block; font-size:14pt; font-weight:600; letter-spacing:.14em; color:#fff;
  line-height:1.1; white-space:nowrap;
}

.blatt .klassenschild{
  display:flex; align-items:center; gap:3.4mm;
  padding:2mm 5.5mm 2mm 4.5mm;
  border-radius:2.6mm;
  background:rgba(255,255,255,.09);
  box-shadow:inset 0 0 0 .35mm rgba(255,255,255,.24);
}
.blatt .klassenschild svg{ width:7.2mm; height:7.2mm; flex:none; display:block; }
.blatt .klassenschild em{
  display:block; font-style:normal;
  font-size:6.6pt; font-weight:700; letter-spacing:.2em; color:#A9B3DC;
}
.blatt .klassenschild strong{
  display:block; font-size:13.5pt; font-weight:600; letter-spacing:.2em; color:#fff;
}

/* ---------------- Raster ---------------- */
.blatt .raster{
  flex:1; min-height:0;
  display:grid;
  grid-template-columns:26mm repeat(5,1fr);
  gap:1.1mm;
}
.blatt .zelle{
  border-radius:2.2mm; padding:2mm 2.4mm; overflow:hidden;
  display:flex; flex-direction:column; justify-content:center; align-items:center;
  text-align:center; background:#fff; border:.35mm solid #D3DAE6;
}

.blatt .tag{
  background:#1B2340; color:#fff; border-color:#1B2340; padding:0;
  font-size:9.5pt; font-weight:600; letter-spacing:.16em;
}
.blatt .ecke{ background:transparent; border-color:transparent; }

.blatt .zeit{ background:#F5F7FB; border-color:#E2E7F0; gap:.6mm; }
.blatt .zeit .uhr{ font-size:11.5pt; font-weight:600; line-height:1.12; }
.blatt .zeit .uhr small{ display:block; font-size:11.5pt; font-weight:600; }
.blatt .zeit .bez{ font-size:7pt; font-weight:700; letter-spacing:.13em; color:#6B7590; line-height:1.25; }
.blatt .zeit .spanne{ font-size:8.6pt; font-weight:500; color:#6B7590; }
.blatt .zeit.schmal .uhr{ font-size:8.4pt; font-weight:500; color:#6B7590; letter-spacing:0; }

.blatt .fach{ border:none; box-shadow:inset 0 0 0 .35mm rgba(0,0,0,.055); }
.blatt .fach .strich{ width:9mm; height:.9mm; border-radius:1mm; margin-bottom:2.2mm; }
.blatt .fach .name{ font-size:12.5pt; font-weight:600; line-height:1.18; letter-spacing:.06em; }
.blatt .fach .name.lang{ font-size:10.2pt; letter-spacing:.045em; }
.blatt .fach .name.sehrlang{ font-size:8pt; letter-spacing:.04em; }

.blatt .leer{ background:#FAFBFD; border-style:dashed; border-color:#E2E7F0; }

.blatt .band{
  background:#EDF1F7; border:none;
  flex-direction:row; gap:3mm; align-items:center; justify-content:center;
}
.blatt .band .besteck{ font-size:11pt; line-height:1; }
.blatt .band .wort{ font-size:9.5pt; font-weight:600; letter-spacing:.14em; color:#3E4A68; }
.blatt .band .punkt{ width:1.4mm; height:1.4mm; border-radius:50%; background:#A9B4C9; flex:none; }
.blatt .band .spanne{ font-size:8pt; color:#6B7590; font-weight:600; letter-spacing:.07em; }

.blatt .planetenpaar{ display:flex; gap:2.6mm; align-items:flex-start; justify-content:center; }
.blatt .planetenpaar .p{ display:flex; flex-direction:column; align-items:center; gap:1.2mm; width:15mm; }
.blatt .planetenpaar .p svg{ width:9.5mm; height:9.5mm; display:block; }
.blatt .planetenpaar .p span{ font-size:7.4pt; font-weight:700; letter-spacing:.08em; color:#2A3454; }

/* ---------------- Fuß ---------------- */
.blatt .fuss{
  flex:none;
  display:flex; align-items:center; justify-content:space-between; gap:6mm; padding:0 1mm;
}
.blatt .legende{ display:flex; flex-wrap:nowrap; gap:3.4mm; align-items:center; min-width:0; }
.blatt .legende div{
  display:flex; align-items:center; gap:1.6mm; flex:none; white-space:nowrap;
  font-size:6.9pt; font-weight:600; letter-spacing:.07em; color:#41496A;
}
.blatt .legende i{ width:4mm; height:4mm; border-radius:1.2mm; display:block; flex:none; }
.blatt .logo img{ display:block; height:14.5mm; width:auto; }
`;

/* Der Sternenhimmel im Kopf – bewusst nur links der Mitte,
   damit nichts über dem Namensfeld liegt. */
/* Seitengröße für den Druck – wird je nach Format eingesetzt. */
function seitenCSS(formatId) {
  return DRUCK.seitengroesse(KATALOG.formate[formatId] || KATALOG.formate.a4);
}

const STERNE_SVG = `<svg class="sterne" viewBox="0 0 1000 100" preserveAspectRatio="none">
<g fill="#fff">
<circle cx="372" cy="24" r="1.1" opacity=".5"/><circle cx="404" cy="72" r="1.4" opacity=".38"/>
<circle cx="428" cy="18" r="1.6" opacity=".55"/><circle cx="470" cy="86" r="1.0" opacity=".4"/>
<circle cx="508" cy="40" r="1.3" opacity=".5"/><circle cx="536" cy="80" r="1.5" opacity=".42"/>
<circle cx="566" cy="14" r="1.1" opacity=".48"/><circle cx="592" cy="60" r="1.0" opacity=".4"/>
</g>
<g stroke="#fff" stroke-width=".9" opacity=".45" fill="none" stroke-linecap="round">
<path d="M452 30 l0 -5.5 M452 30 l0 5.5 M452 30 l-5.5 0 M452 30 l5.5 0"/>
</g></svg>`;
