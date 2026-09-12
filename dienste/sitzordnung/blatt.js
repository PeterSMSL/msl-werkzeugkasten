/* ============================================================
   BLATT.JS  –  das Aussehen der gedruckten Sitzordnung.

   Anders als beim Stundenplan wird hier NICHT ein A4-Blatt in
   andere Formate hineingerechnet: eine Sitzordnung hat kein
   festes Raster, das verrutschen könnte. Das Blatt wird gleich
   in den Maßen des gewählten Papiers gebaut, und der Raum
   bekommt einfach so viel Platz, wie darauf frei ist.
   Auf A3 wird der Raum dadurch von selbst größer.
   ============================================================ */

const BLATT_CSS = `
@page { margin: 0; }

/* Safari braucht beim Drucken einen Sonderweg. Warum, steht
   ausführlich in haus/drucken.js – dort ist es die eine Stelle
   für alle Werkzeuge. Der fertige CSS-Text wird hier eingesetzt
   und reist deshalb auch in einer gesicherten Datei mit.       */
${DRUCK.kleinerInSafari(".blattrahmen")}

.blattrahmen{ overflow:hidden; background:#fff; }

.blatt{
  width:100%; height:100%;
  background:#fff; color:#1F2A37;
  font-family:"Segoe UI Variable Display","Segoe UI",Candara,Calibri,system-ui,sans-serif;
  display:flex; flex-direction:column;
  overflow:hidden;
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
}
.blatt, .blatt *{ box-sizing:border-box; margin:0; padding:0; }

/* ---------------- Kopf ---------------- */
.blatt .kopf{
  flex:none; display:flex; align-items:flex-end; justify-content:space-between;
  gap:8mm; border-bottom:.6mm solid #00538F; padding-bottom:2.6mm;
}
.blatt .kopf .was{
  font-size:.62em; letter-spacing:.22em; text-transform:uppercase;
  color:#5C6B7A; margin-bottom:.8mm;
}
.blatt .kopf h1{ font-size:1.55em; font-weight:700; letter-spacing:-.01em; line-height:1.05; }
.blatt .kopf .rechts{ display:flex; align-items:center; gap:4mm; flex:none; }
.blatt .kopf .datum{ font-size:.66em; color:#5C6B7A; text-align:right; }
.blatt .kopf img{ height:11mm; width:11mm; object-fit:contain; display:block; }

/* ---------------- Der Raum ---------------- */
/* Nimmt allen Platz zwischen Kopf und Fuß und stellt den Raum mittig
   hinein. Der Raum selbst kommt aus RAUM.aufbau – dieselbe Zeichnung
   wie am Bildschirm, nur in Millimetern.                           */
.blatt .plan{
  flex:1; min-height:0;
  display:flex; align-items:center; justify-content:center;
  padding:3mm 0;
}

/* ---------------- Fuß ---------------- */
.blatt .fuss{
  flex:none; display:flex; justify-content:space-between; align-items:baseline;
  gap:6mm; border-top:.25mm solid #DDE4EC; padding-top:1.8mm;
  font-size:.6em; color:#5C6B7A;
}
.blatt .fuss b{ color:#1F2A37; font-weight:600; }
`;

const BLATT = (function () {

  function heute() {
    return new Date().toLocaleDateString("de-DE",
      { day: "2-digit", month: "long", year: "numeric" });
  }

  function entschaerfen(s) {
    return String(s).replace(/[&<>"]/g, z =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[z]));
  }

  /* zustand : { klasse, raum, belegung }
     Gibt das fertige Blatt als HTML zurück.                  */
  function bauen(zustand, formatId) {
    const f = SITZ.formate[formatId] || SITZ.formate.a4quer;
    const raum = zustand.raum;

    /* Ränder und die Höhe von Kopf und Fuß, alles in Millimetern.
       Was übrig bleibt, gehört dem Raum.                       */
    const rand = 9, kopf = 15, fuss = 8;
    const freiBreite = f.breite - 2 * rand;
    const freiHoehe  = f.hoehe  - 2 * rand - kopf - fuss;

    const s = Math.min(freiBreite / raum.breite, freiHoehe / raum.tiefe);

    /* Die Grundschrift wächst mit dem Papier mit, damit A3 nicht
       aussieht wie A4 mit zu kleiner Schrift.                  */
    const grund = 4.2 * (f.breite / 297);

    const kinder = Object.keys(zustand.belegung || {}).length;
    const anzahlPlaetze = RAUM.plaetze(raum).length;

    return `
<div class="blattrahmen" style="width:${f.breite}mm; height:${f.hoehe}mm">
  <div class="blatt" style="padding:${rand}mm; font-size:${grund}mm">

    <div class="kopf">
      <div>
        <div class="was">Sitzordnung</div>
        <h1>${entschaerfen(zustand.klasse || "Klasse")}</h1>
      </div>
      <div class="rechts">
        <div class="datum">${heute()}</div>
        <img src="${SITZ.logo}" alt="">
      </div>
    </div>

    <div class="plan">
      ${RAUM.aufbau(raum, { namen: zustand.belegung, einheit: "mm", masstab: s })}
    </div>

    <div class="fuss">
      <span>${SITZ.schule} &ndash; Freie Montessori Schule Landau</span>
      <span><b>${kinder}</b> Kinder auf <b>${anzahlPlaetze}</b> Plätzen</span>
    </div>

  </div>
</div>`;
  }

  /* Welches Papier der Drucker einziehen soll. Steht in einem
     eigenen Stil-Element, das mit der Formatwahl wechselt –
     "@page" lässt sich nicht mitten im Blatt setzen.        */
  function seitenCSS(formatId) {
    return DRUCK.seitengroesse(SITZ.formate[formatId] || SITZ.formate.a4quer);
  }

  return { bauen: bauen, seitenCSS: seitenCSS };
})();
