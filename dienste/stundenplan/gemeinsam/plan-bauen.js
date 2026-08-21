/* ============================================================
   PLAN-BAUEN.JS  –  macht aus den Daten ein fertiges Blatt.
   Wird sowohl für die Vorschau als auch fürs Drucken benutzt,
   damit Vorschau und Ausdruck nie auseinanderlaufen können.
   ============================================================ */

/* --- kleine Helfer ---------------------------------------- */
const esc = t => String(t ?? "").replace(/[&<>"]/g, c =>
  ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));

const findeFach   = name => KATALOG.faecher.find(f =>
  f.name === name || (f.kurz && f.kurz === name));

/* Jede eingesetzte Grafik bekommt eigene Kennungen.
   Sonst zeigen mehrere gleiche Planeten auf denselben Farbverlauf –
   und beim Drucken (Vorschau ausgeblendet) findet der Browser ihn
   nicht mehr, wodurch die Planetenkugeln unsichtbar werden.        */
let grafikZaehler = 0;
function grafikEinsetzen(svg) {
  const n = ++grafikZaehler;
  return String(svg)
    .replace(/id="([^"]+)"/g,     (m, id) => `id="${id}-${n}"`)
    .replace(/url\(#([^)]+)\)/g, (m, id) => `url(#${id}-${n})`);
}
const findePlanet = id   => KATALOG.planeten.find(p => p.id === id);

/* Ein Eintrag im Plan ist entweder ein Fachname aus dem Katalog
   oder frei getippter Text. Beides kommt hier heil wieder raus. */
function eintragLesen(wert) {
  if (wert === null || wert === undefined || wert === "") return null;
  if (Array.isArray(wert)) return null;                 // Planeten-Paar, kein Fach
  if (typeof wert === "object") {                       // frei getippt
    return { text: wert.text || "", farbe: wert.farbe || "neutral" };
  }
  const f = findeFach(wert);
  return f ? { text: f.kurz || f.name, farbe: f.farbe }
           : { text: wert, farbe: "neutral" };
}

/* Lange Fachnamen dürfen nicht aus dem Kasten laufen. */
function groessenKlasse(text) {
  const n = text.length;
  if (n > 24) return " sehrlang";
  if (n > 11) return " lang";
  return "";
}

function fachZelle(wert) {
  const e = eintragLesen(wert);
  if (!e) return `<div class="zelle leer"></div>`;
  const farbe = KATALOG.farben[e.farbe] || KATALOG.farben.neutral;
  return `<div class="zelle fach" style="background:${farbe.bg}">
    <div class="strich" style="background:${farbe.ac}"></div>
    <div class="name${groessenKlasse(e.text)}">${esc(e.text)}</div>
  </div>`;
}

/* --- eine Zeile ------------------------------------------- */
function zeileBauen(z) {
  if (z.typ === "band") {
    /* Nebeneinanderliegende leere Tage werden zu einem durchgehenden
       Streifen zusammengefasst; ein gefüllter Tag bekommt seinen
       eigenen Kasten (z.B. Freitag "Pflege der Umgebung").        */
    const zeitZelle = `<div class="zelle zeit schmal"><div class="uhr">${esc(z.zeit)}</div></div>`;
    let html = zeitZelle, i = 0;
    const zellen = z.zellen || [null,null,null,null,null];
    while (i < 5) {
      if (eintragLesen(zellen[i])) { html += fachZelle(zellen[i]); i++; continue; }
      let breite = 0;
      while (i + breite < 5 && !eintragLesen(zellen[i + breite])) breite++;
      html += `<div class="zelle band" style="grid-column:span ${breite}">
        ${z.besteck ? '<span class="besteck">\u{1F374}</span>' : ""}
        <span class="wort">${esc(z.label)}</span>
        <span class="punkt"></span>
        <span class="spanne">${esc(z.zeit)} Uhr</span>
      </div>`;
      i += breite;
    }
    return html;
  }

  /* Zeitspalte für die hohen Zeilen */
  const zeitZelle = z.typ === "planeten"
    ? `<div class="zelle zeit"><div class="bez">${esc(z.label)}</div>
         <div class="spanne">${esc(z.zeit)}</div></div>`
    : z.label
    ? `<div class="zelle zeit"><div class="bez">${esc(z.label)}</div>
         <div class="spanne">${esc(z.von)} – ${esc(z.bis)}</div></div>`
    : `<div class="zelle zeit"><div class="uhr">${esc(z.von)}<small>${esc(z.bis)}</small></div></div>`;

  if (z.typ === "planeten") {
    const zellen = (z.zellen || []).map(paar => {
      const ps = (paar || []).map(findePlanet).filter(Boolean);
      if (!ps.length) return `<div class="zelle leer"></div>`;
      return `<div class="zelle fach" style="background:${KATALOG.farben.neutral.bg}">
        <div class="planetenpaar">${ps.map(p =>
          `<div class="p">${grafikEinsetzen(p.svg)}<span>${esc(p.name)}</span></div>`).join("")}</div>
      </div>`;
    }).join("");
    return zeitZelle + zellen;
  }

  return zeitZelle + (z.zellen || []).map(fachZelle).join("");
}

/* --- ganzes Blatt ----------------------------------------- */
/* A4-Maße, in denen das Blatt gebaut ist. */
const BLATT_BREITE = 297, BLATT_HOEHE = 209.7;

/* Browser rechnen die Seitenhöhe minimal kleiner als das Nennmaß.
   Ohne diesen Abzug ragt der Rahmen um Bruchteile eines Millimeters
   über die Seite – und hinter jedem Blatt landet eine Leerseite.    */
const SEITEN_LUFT = 0.5;

function rahmenMasse(formatId) {
  const f = KATALOG.formate[formatId] || KATALOG.formate.a4;
  const hoehe  = f.hoehe - SEITEN_LUFT;
  const faktor = Math.min(f.breite / BLATT_BREITE, hoehe / BLATT_HOEHE);
  return { breite:f.breite, hoehe, faktor };
}

function blattBauen(plan, kindName) {
  const planet = findePlanet(plan.klasse) || KATALOG.planeten[0];

  const kopfZeile = `<div class="zelle ecke"></div>` +
    KATALOG.tage.map(t => `<div class="zelle tag">${esc(t)}</div>`).join("");

  const hoehen = "9mm " + plan.zeilen.map(z =>
    z.typ === "band" ? "8.5mm" : (z.typ === "planeten" ? "1.02fr" : "1.2fr")).join(" ");

  /* Legende zeigt nur Farben, die auf diesem Blatt wirklich vorkommen. */
  const benutzt = new Set();
  plan.zeilen.filter(z => z.typ !== "planeten").forEach(z => (z.zellen || []).forEach(w => {
    const e = eintragLesen(w); if (e) benutzt.add(e.farbe);
  }));
  const legende = Object.entries(KATALOG.farben)
    .filter(([k]) => benutzt.has(k))
    .map(([, f]) => `<div><i style="background:${f.ac}"></i>${esc(f.label)}</div>`).join("");

  const namensfeld = kindName
    ? `<div class="namensfeld gefuellt"><span>Name</span><b>${esc(kindName)}</b></div>`
    : `<div class="namensfeld"><span>Name</span><i></i></div>`;

  const m = rahmenMasse(plan.format);

  return `<div class="blattrahmen" style="width:${m.breite}mm;height:${m.hoehe}mm">
  <div class="blatt" style="transform:scale(${m.faktor})">
    <div class="kopf">
      ${STERNE_SVG}
      <div class="titel">
        <h1>Mein <b>Stundenplan</b></h1>
        <div class="wochentage">${KATALOG.tage.join(" &nbsp;·&nbsp; ")}</div>
      </div>
      <div class="kopfrechts">
        ${namensfeld}
        <div class="klassenschild">
          ${grafikEinsetzen(planet.svg)}
          <div><em>Klasse</em><strong>${esc(planet.name)}</strong></div>
        </div>
      </div>
    </div>

    <div class="raster" style="grid-template-rows:${hoehen}">
      ${kopfZeile}
      ${plan.zeilen.map(zeileBauen).join("")}
    </div>

    <div class="fuss">
      <div class="legende">${legende}</div>
      <div class="logo"><img src="${KATALOG.logo}" alt="${esc(KATALOG.schule)}"></div>
    </div>
  </div></div>`;
}

/* --- alle Blätter für einen Druckauftrag ------------------- */
function blaetterBauen(plan, namen, auchLeer) {
  const liste = (namen || []).map(n => n.trim()).filter(Boolean);
  const blaetter = liste.map(n => blattBauen(plan, n));
  if (!blaetter.length || auchLeer) blaetter.push(blattBauen(plan, ""));
  return blaetter.join("\n");
}
