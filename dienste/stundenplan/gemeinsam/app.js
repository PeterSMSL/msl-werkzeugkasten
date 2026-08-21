/* ============================================================
   APP.JS  –  die Bedienung der Werkstatt.
   ============================================================ */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const MM = 96 / 25.4;                       // Millimeter in Bildpunkte
/* Jede Stufe bekommt ihr eigenes Fächlein im Browserspeicher –
   sonst sieht Stufe 4-6 den zuletzt gebauten Plan von 1-3.      */
const SPEICHER = "stundenplan-werkstatt-" + KATALOG.stufe;

/* Plan-Design einmalig in die Seite hängen */
document.head.insertAdjacentHTML("beforeend",
  `<style>${PLAN_CSS}</style><style id="seitenformat"></style>`);

/* ---------- Zustand --------------------------------------- */
const tief = o => JSON.parse(JSON.stringify(o));

let zustand = {
  plan:    { klasse: KATALOG.klassen[0], format: "a4", zeilen: tief(KATALOG.standardPlan.zeilen) },
  namen:   "",
  auchLeer:false,
  stand:   KATALOG.stand
};

let standVeraltet = false;

function laden() {
  try {
    const roh = localStorage.getItem(SPEICHER);
    if (!roh) return;
    const alt = JSON.parse(roh);
    /* Der Browser merkt sich den letzten Stand. Wurde daten.js seither
       geändert, arbeitet man sonst unbemerkt mit veralteten Vorgaben. */
    standVeraltet = alt.stand !== KATALOG.stand;
    zustand = Object.assign(zustand, alt);
  } catch (e) { /* kaputter Speicher -> Standard behalten */ }
}

function hinweisAufbauen() {
  const bar = $("#hinweisbar");
  if (!standVeraltet) { bar.innerHTML = ""; return; }
  bar.innerHTML = `<div class="hinweisbar">
    <p><strong>Die Vorgaben der Schule wurden aktualisiert.</strong>
       In diesem Browser liegt noch dein Stand von vorher. Möchtest du
       das neue Standardraster übernehmen? Dein bisheriger Plan geht
       dabei verloren.</p>
    <button class="ja"   data-tu="neu">Neues Raster übernehmen</button>
    <button class="nein" data-tu="behalten">Meinen Plan behalten</button>
  </div>`;
}

$("#hinweisbar").addEventListener("click", e => {
  const tu = e.target.dataset.tu;
  if (!tu) return;
  if (tu === "neu") zustand.plan.zeilen = tief(KATALOG.standardPlan.zeilen);
  zustand.stand = KATALOG.stand;
  standVeraltet = false;
  allesAufbauen();
});
function sichernLokal() {
  try { localStorage.setItem(SPEICHER, JSON.stringify(zustand)); } catch (e) {}
}

/* ---------- Aufbau der Oberfläche -------------------------- */
const planetenBild = id => {
  const p = findePlanet(id);
  return p ? grafikEinsetzen(p.svg) : "";
};

function klassenAuswahl() {
  const sel = $("#klasse");
  sel.innerHTML = KATALOG.klassen
    .map(id => findePlanet(id))
    .filter(Boolean)
    .map(p => `<option value="${p.id}">Klasse ${esc(p.name)}</option>`)
    .join("");
  sel.value = zustand.plan.klasse;
  $("#klassenbild").innerHTML = planetenBild(zustand.plan.klasse);
}

/* Eingabefeld für ein Fach.
   Freitext mit Vorschlagsliste. Steht der Text im Katalog, kommt die
   Farbe von dort; sonst darf sie daneben gewählt werden.            */
function fachText(wert) {
  if (wert === null || wert === undefined || wert === "") return "";
  return typeof wert === "object" ? (wert.text || "") : wert;
}
function istFreitext(wert) { return wert && typeof wert === "object"; }

function farbwahl(wert) {
  if (!istFreitext(wert)) return "";
  const opts = Object.entries(KATALOG.farben)
    .map(([k, f]) => `<option value="${k}"${k === wert.farbe ? " selected" : ""}>${esc(f.label)}</option>`)
    .join("");
  return `<select data-rolle="farbe" class="farbwahl">${opts}</select>`;
}

function fachFeld(zi, ti, wert, istBand) {
  return `<div class="tag-feld" data-zi="${zi}" data-ti="${ti}">
    <label>${esc(KATALOG.tage[ti])}</label>
    <input data-rolle="fach" list="fachvorschlaege" autocomplete="off"
           value="${esc(fachText(wert))}"
           placeholder="${istBand ? "— Streifen —" : "— leer —"}">
    ${farbwahl(wert)}
  </div>`;
}

function planetenFeld(zi, ti, paar) {
  const opts = p => `<option value="">— kein Planet —</option>` + KATALOG.klassen
    .map(findePlanet).filter(Boolean)
    .map(x => `<option value="${x.id}"${x.id === p ? " selected" : ""}>${esc(x.name)}</option>`).join("");
  const a = (paar || [])[0] || "", b = (paar || [])[1] || "";
  return `<div class="tag-feld" data-zi="${zi}" data-ti="${ti}">
    <label>${esc(KATALOG.tage[ti])}</label>
    <div class="paar">
      <select data-rolle="planet" data-pos="0">${opts(a)}</select>
      <select data-rolle="planet" data-pos="1">${opts(b)}</select>
    </div>
  </div>`;
}

function vorschlaegeAufbauen() {
  $("#fachvorschlaege").innerHTML =
    KATALOG.faecher.map(f => `<option value="${esc(f.name)}">`).join("");
}

function zeilenAufbauen() {
  $("#zeilen").innerHTML = zustand.plan.zeilen.map((z, zi) => {
    const typName = { stunden:"Unterricht", band:"Pause / Essen", planeten:"Betreute Freizeit" }[z.typ];

    const kopf = z.typ === "band"
      ? `<input class="bez" data-rolle="label" value="${esc(z.label)}" placeholder="Frühstück">
         <input class="uhr" style="width:110px" data-rolle="zeit" value="${esc(z.zeit)}" placeholder="9.30 – 9.55">
         <label class="haken" style="margin:0;font-size:12px">
           <input type="checkbox" data-rolle="besteck"${z.besteck ? " checked" : ""}> 🍴
         </label>`
      : z.typ === "planeten"
      ? `<input class="bez" data-rolle="label" value="${esc(z.label)}">
         <input class="uhr" style="width:110px" data-rolle="zeit" value="${esc(z.zeit)}">`
      : `<input class="bez" data-rolle="label" value="${esc(z.label || "")}" placeholder="Bezeichnung (optional)">
         <input class="uhr" data-rolle="von" value="${esc(z.von || "")}" placeholder="7.45">
         <input class="uhr" data-rolle="bis" value="${esc(z.bis || "")}" placeholder="9.30">`;

    const felder = KATALOG.tage.map((_, ti) => z.typ === "planeten"
      ? planetenFeld(zi, ti, (z.zellen || [])[ti])
      : fachFeld(zi, ti, (z.zellen || [])[ti], z.typ === "band")).join("");

    return `<div class="zeile ${z.typ === "band" ? "band" : ""}" data-zi="${zi}">
      <div class="zkopf">
        <span class="marke-typ">${typName}</span>
        ${kopf}
        <div class="schieber">
          <button data-tu="hoch"   title="nach oben">↑</button>
          <button data-tu="runter" title="nach unten">↓</button>
          <button data-tu="weg" class="weg" title="Zeile löschen">✕</button>
        </div>
      </div>
      <div class="tage">${felder}</div>
    </div>`;
  }).join("");

}

function formatAuswahl() {
  const sel = $("#format");
  sel.innerHTML = Object.entries(KATALOG.formate)
    .map(([k, f]) => `<option value="${k}">${esc(f.name)}</option>`).join("");
  sel.value = zustand.plan.format || "a4";
  const f = KATALOG.formate[sel.value];
  $("#formatname").textContent = f.name.split("·")[0].trim();
  $("#seitenformat").textContent = seitenCSS(sel.value);
}

/* Schmale Geräte zeigen die Vorschau in der Klappleiste unten.
   52 % der Fensterhöhe ist ihr Höchstmaß – derselbe Wert steht in
   app.css als max-height der Leiste. Ändert sich einer, dann beide. */
const KLAPP_ANTEIL = 0.52;
const klappleiste = () => window.matchMedia("(max-width:999px)").matches;

function vorschauAufbauen() {
  const b = $("#buehne");
  b.innerHTML = blattBauen(zustand.plan, "");
  const rahmen = $(".blattrahmen", b);
  const f = KATALOG.formate[zustand.plan.format] || KATALOG.formate.a4;

  /* Am Rechner bestimmt die Spaltenbreite die Größe. In der Klappleiste
     ist die Höhe knapp – dort entscheidet, was zuerst nicht mehr passt. */
  const platz = klappleiste() ? window.innerHeight * KLAPP_ANTEIL - 30 : Infinity;
  const skala = Math.min(b.clientWidth / (f.breite * MM), platz / (f.hoehe * MM));

  rahmen.style.transform = `scale(${skala})`;
  b.style.height = (f.hoehe * MM * skala) + "px";
  b.style.width  = platz === Infinity ? "" : (f.breite * MM * skala) + "px";
  vorschauBeschriftung();
}

/* Der Kopf der Vorschau ist am Rechner nur eine Überschrift,
   auf schmalen Geräten der Schalter zum Auf- und Zuklappen.  */
function vorschauBeschriftung() {
  $("#vorschau-schalter .wort").textContent = !klappleiste()
    ? "Vorschau"
    : $("#vorschau").classList.contains("offen")
      ? "Vorschau zuklappen"
      : "Vorschau ansehen";
}

$("#vorschau-schalter").addEventListener("click", () => {
  const offen = $("#vorschau").classList.toggle("offen");
  $("#vorschau-schalter").setAttribute("aria-expanded", offen);
  vorschauAufbauen();
});

function zaehlerAufbauen() {
  const n = zustand.namen.split("\n").map(s => s.trim()).filter(Boolean).length;
  const seiten = (n || 1) + (n && zustand.auchLeer ? 1 : 0);
  $("#seitenzahl").textContent = n
    ? `${n} ${n === 1 ? "Kind" : "Kinder"} → ${seiten} Seiten in einem PDF`
    : `Kein Name eingetragen → 1 Seite zum selbst Ausfüllen`;
}

function allesAufbauen() {
  hinweisAufbauen();
  klassenAuswahl();
  formatAuswahl();
  vorschlaegeAufbauen();
  zeilenAufbauen();
  vorschauAufbauen();
  zaehlerAufbauen();
  sichernLokal();
}

/* ---------- Bedienung -------------------------------------- */
$("#klasse").addEventListener("change", e => {
  zustand.plan.klasse = e.target.value;
  $("#klassenbild").innerHTML = planetenBild(e.target.value);
  vorschauAufbauen(); sichernLokal();
});

$("#format").addEventListener("change", e => {
  zustand.plan.format = e.target.value;
  formatAuswahl(); vorschauAufbauen(); sichernLokal();
});

$("#zeilen").addEventListener("change", e => {
  const feld  = e.target.closest(".tag-feld");
  const zeile = e.target.closest(".zeile");
  if (!zeile) return;
  const z = zustand.plan.zeilen[+zeile.dataset.zi];

  if (e.target.dataset.rolle === "farbe") {
    const w = z.zellen[+feld.dataset.ti];
    if (istFreitext(w)) w.farbe = e.target.value;
  } else if (e.target.dataset.rolle === "planet") {
    const paar = z.zellen[+feld.dataset.ti] || (z.zellen[+feld.dataset.ti] = []);
    paar[+e.target.dataset.pos] = e.target.value;
    z.zellen[+feld.dataset.ti] = paar.filter(Boolean);
    zeilenAufbauen();
  } else if (e.target.dataset.rolle === "besteck") {
    z.besteck = e.target.checked;
  } else return;

  vorschauAufbauen(); sichernLokal();
});

$("#zeilen").addEventListener("input", e => {
  const feld  = e.target.closest(".tag-feld");
  const zeile = e.target.closest(".zeile");
  if (!zeile) return;
  const z = zustand.plan.zeilen[+zeile.dataset.zi];
  const rolle = e.target.dataset.rolle;

  if (rolle === "fach") {
    const ti   = +feld.dataset.ti;
    const text = e.target.value.trim();
    const alt  = z.zellen[ti];
    const bekannt = KATALOG.faecher.find(f =>
      f.name.toLowerCase() === text.toLowerCase() ||
      (f.kurz && f.kurz.toLowerCase() === text.toLowerCase()));

    z.zellen[ti] = !text ? (z.typ === "band" ? null : "")
                 : bekannt ? bekannt.name
                 : { text, farbe: istFreitext(alt) ? alt.farbe : "neutral" };

    /* Farbwahl nur bei Freitext – ohne das Eingabefeld anzufassen,
       damit der Schreibcursor stehen bleibt.                        */
    const vorhanden = $(".farbwahl", feld);
    const gebraucht = istFreitext(z.zellen[ti]);
    if (gebraucht && !vorhanden) feld.insertAdjacentHTML("beforeend", farbwahl(z.zellen[ti]));
    if (!gebraucht && vorhanden) vorhanden.remove();

  } else if (["label","zeit","von","bis"].includes(rolle)) {
    z[rolle] = e.target.value;
  } else return;

  vorschauAufbauen(); sichernLokal();
});

$("#zeilen").addEventListener("click", e => {
  const knopf = e.target.closest("[data-tu]");
  if (!knopf) return;
  const zi = +knopf.closest(".zeile").dataset.zi;
  const zn = zustand.plan.zeilen;
  if (knopf.dataset.tu === "weg")   zn.splice(zi, 1);
  if (knopf.dataset.tu === "hoch"   && zi > 0)          [zn[zi-1], zn[zi]] = [zn[zi], zn[zi-1]];
  if (knopf.dataset.tu === "runter" && zi < zn.length-1)[zn[zi+1], zn[zi]] = [zn[zi], zn[zi+1]];
  allesAufbauen();
});

$(".zeile-neu").addEventListener("click", e => {
  const art = e.target.dataset.neu;
  if (!art) return;
  if (art === "zuruecksetzen") {
    if (!confirm("Wirklich alle Zeilen auf das Standard-Raster zurücksetzen?")) return;
    zustand.plan.zeilen = tief(KATALOG.standardPlan.zeilen);
    zustand.stand = KATALOG.stand;
  }
  if (art === "stunden")  zustand.plan.zeilen.push({ typ:"stunden", label:"", von:"", bis:"", zellen:["","","","",""] });
  if (art === "band")     zustand.plan.zeilen.push({ typ:"band", label:"Pause", zeit:"", besteck:false, zellen:[null,null,null,null,null] });
  if (art === "planeten") zustand.plan.zeilen.push({ typ:"planeten", label:"Betreute Freizeit", zeit:"", zellen:[[],[],[],[],[]] });
  allesAufbauen();
});

$("#namen").addEventListener("input", e => {
  zustand.namen = e.target.value; zaehlerAufbauen(); sichernLokal();
});
$("#auch-leer").addEventListener("change", e => {
  zustand.auchLeer = e.target.checked; zaehlerAufbauen(); sichernLokal();
});

/* ---------- Drucken ---------------------------------------- */
$("#btn-drucken").addEventListener("click", () => {
  $("#druck").innerHTML = blaetterBauen(zustand.plan, zustand.namen.split("\n"), zustand.auchLeer);
  window.print();
});

/* ---------- Sichern / Öffnen ------------------------------- */
function herunterladen(name, inhalt, typ) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([inhalt], { type: typ }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const klassenName = () => (findePlanet(zustand.plan.klasse) || {}).name || "Klasse";

$("#btn-sichern").addEventListener("click", () =>
  herunterladen(`Stundenplan_${klassenName()}.json`,
    JSON.stringify(zustand, null, 2), "application/json"));

$("#btn-oeffnen").addEventListener("click", () => $("#datei").click());
$("#datei").addEventListener("change", e => {
  const f = e.target.files[0]; if (!f) return;
  const leser = new FileReader();
  leser.onload = () => {
    try {
      const neu = JSON.parse(leser.result);
      if (!neu.plan || !Array.isArray(neu.plan.zeilen)) throw new Error("kein Plan");
      zustand = Object.assign({ namen:"", auchLeer:false }, neu);
      $("#namen").value = zustand.namen;
      $("#auch-leer").checked = zustand.auchLeer;
      allesAufbauen();
    } catch (err) { alert("Diese Datei enthält keinen Stundenplan."); }
    e.target.value = "";
  };
  leser.readAsText(f);
});

$("#btn-html").addEventListener("click", () => {
  const blaetter = blaetterBauen(zustand.plan, zustand.namen.split("\n"), zustand.auchLeer);
  const seite = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">
<title>Stundenplan Klasse ${esc(klassenName())}</title>
<style>${PLAN_CSS}
${seitenCSS(zustand.plan.format)}
body{margin:0;background:#EEF1F6;display:flex;flex-direction:column;align-items:center;gap:14px;padding:14px}
.blattrahmen{box-shadow:0 4px 20px rgba(27,35,64,.18);background:#fff}
@media print{body{background:#fff;margin:0;padding:0;gap:0}
.blattrahmen{box-shadow:none;break-after:page;page-break-after:always}
.blattrahmen:last-child{break-after:auto;page-break-after:auto}}
</style></head><body>${blaetter}</body></html>`;
  herunterladen(`Stundenplan_${klassenName()}.html`, seite, "text/html");
});

/* ---------- Start ------------------------------------------ */
$("#marke-logo").src = KATALOG.logo;   /* steckt in geteilt.js, keine Extradatei nötig */
$("#stufenname").textContent = "Freie Montessori Schule Landau \u00b7 " + KATALOG.stufeName;
laden();
$("#namen").value = zustand.namen;
$("#auch-leer").checked = zustand.auchLeer;
allesAufbauen();
window.addEventListener("resize", vorschauAufbauen);
