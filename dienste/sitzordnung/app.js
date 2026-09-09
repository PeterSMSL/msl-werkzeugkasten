/* ============================================================
   APP.JS  –  die Bedienung der Sitzordnung.

   Hält den Stand zusammen, schaltet zwischen den drei Schritten
   um und lässt am Ende die Namen fliegen.

   Der Stand liegt im localStorage des Browsers und sonst
   nirgends. Kindernamen verlassen dieses Gerät nicht.
   ============================================================ */

const $  = (w, k) => (k || document).querySelector(w);
const $$ = (w, k) => Array.from((k || document).querySelectorAll(w));

/* sessionStorage, NICHT localStorage.

   Der Stand überlebt damit das Neuladen der Seite und das Hin- und
   Herspringen zwischen den Schritten, ist aber weg, sobald der
   Browser geschlossen wird. Zwei Gründe:

   1. Peter erwartet beim Neustart ein leeres Blatt und nicht die
      Reste vom letzten Mal.
   2. Auf einem Rechner, den sich mehrere Lehrkräfte teilen, hätten
      sonst die Namen der letzten Klasse dort liegen bleiben. Das
      sind personenbezogene Daten von Kindern.

   Wer sein Klassenzimmer behalten will, benutzt "Sichern" – das
   legt eine Datei ab, die sich jederzeit wieder öffnen lässt.   */
const SPEICHER = "msl-sitzordnung";

/* ------------------------------------------------------------
   Der Stand
   ------------------------------------------------------------ */

/* Beim allerersten Öffnen steht schon ein Klassenzimmer da.
   Auf eine leere Fläche zu schauen und nicht zu wissen, was
   man tun soll, ist der schlechteste erste Eindruck.        */
function standardZustand() {
  const raum = { breite: 800, tiefe: 600, moebel: [] };
  let n = 0;
  const stell = (art, x, y, dreh) =>
    raum.moebel.push({ id: "v" + (++n), art: art, x: x, y: y, dreh: dreh || 0 });

  stell("tafel", 400, 16);
  stell("tuer", 792, 470, 90);
  [220, 350, 480].forEach(y => [180, 400, 620].forEach(x => stell("zweier", x, y)));

  return {
    klasse: "", raum: raum, namen: "",
    pflicht: [], tabu: [], belegung: {},
    format: "a4quer", schritt: "raum", version: SITZ.version
  };
}

let zustand = standardZustand();

function laden() {
  /* Aufräumen: frühere Fassungen haben in den localStorage
     geschrieben. Der wird nicht mehr gelesen – aber Kindernamen
     sollen auch nicht ungenutzt im Browser liegen bleiben.     */
  try { localStorage.removeItem(SPEICHER); } catch (e) {}

  try {
    const roh = sessionStorage.getItem(SPEICHER);
    if (!roh) return;
    const alt = JSON.parse(roh);
    if (alt && alt.raum && Array.isArray(alt.raum.moebel))
      zustand = Object.assign(standardZustand(), alt);
  } catch (e) { /* kaputter Eintrag: dann eben von vorn */ }
}

function sichernLokal() {
  try { sessionStorage.setItem(SPEICHER, JSON.stringify(zustand)); } catch (e) {}
}

/* ------------------------------------------------------------
   Zeichnen
   ------------------------------------------------------------ */

function raumZeichnen() {
  RAUM.zeichnen($("#raum"), zustand.raum, {
    bearbeiten: zustand.schritt === "raum",
    namen: zustand.belegung
  });
}

/* Wird gerufen, sobald im Raum etwas verschoben, gedreht,
   verwandelt oder weggenommen wurde.

   Eine benannte Funktion, kein Zugriffsschalter: app.js ruft sie
   auch selbst, und RAUM bekommt sie nur zusätzlich gereicht.  */
function raumGeaendert() {
  /* Ein veränderter Raum passt nicht mehr zur alten Verteilung –
     ein weggenommener Tisch hätte sonst Namen im Nichts.     */
  zustand.belegung = {};
  raumZeichnen(); werkzeugeZeichnen(); sichernLokal();
}
RAUM.aenderung = raumGeaendert;

function werkzeugeZeichnen() {
  const kasten = $("#werkzeuge");
  const plaetze = RAUM.plaetze(zustand.raum);
  const zweier = new Set(plaetze.filter(p => p.paar).map(p => p.moebel)).size;
  const zaehler =
    `<span class="abstand zaehler"><b>${plaetze.length}</b> Plätze` +
    `${zweier ? ` &middot; ${zweier} ${zweier === 1 ? "Zweiertisch" : "Zweiertische"}` : ""}</span>`;

  if (zustand.schritt === "raum") {
    kasten.innerHTML =
      `<button data-neu="zweier"><span class="sinnbild zwei"></span> Zweiertisch</button>
       <button data-neu="einzel"><span class="sinnbild ein"></span> Einzeltisch</button>
       <button data-neu="tafel">Tafel</button>
       <button data-neu="tuer">Tür</button>` + zaehler;

    $$("button[data-neu]", kasten).forEach(b =>
      b.addEventListener("click", () => {
        RAUM.neuesMoebel(zustand.raum, b.dataset.neu);
        raumGeaendert();
      }));

  } else if (zustand.schritt === "verteilen") {
    kasten.innerHTML =
      `<button id="btn-nochmal" class="werkzeug-haupt">Noch einmal würfeln</button>` + zaehler;
    $("#btn-nochmal", kasten).addEventListener("click", verteilen);

  } else {
    kasten.innerHTML = zaehler;
  }
}

function zaehlerZeichnen() {
  const kinder = kinderListe();
  const plaetze = RAUM.plaetze(zustand.raum).length;
  const knapp = kinder.length > plaetze;
  $("#zaehlzeile").className = "zaehlzeile" + (knapp ? " knapp" : "");
  $("#zaehlzeile").innerHTML =
    `<b>${kinder.length}</b> ${kinder.length === 1 ? "Kind" : "Kinder"} ` +
    `auf <b>${plaetze}</b> ${plaetze === 1 ? "Platz" : "Plätzen"}` +
    (knapp ? ` &ndash; es fehlen ${kinder.length - plaetze} Plätze.`
           : plaetze > kinder.length ? ` &ndash; ${plaetze - kinder.length} bleiben frei.` : ".");
}

/* ------------------------------------------------------------
   Kinder und Regeln
   ------------------------------------------------------------ */

function kinderListe() {
  return zustand.namen.split("\n").map(s => s.trim()).filter(Boolean);
}

function entschaerfen(s) {
  return String(s).replace(/[&<>"]/g, z =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[z]));
}

function regelnZeichnen() {
  const kinder = kinderListe();
  const bekannt = new Set(kinder);

  ["pflicht", "tabu"].forEach(art => {
    /* Die beiden Auswahlfelder mit den Namen füllen. */
    ["a", "b"].forEach(seite => {
      const feld = $(`#${art}-${seite}`);
      const vorher = feld.value;
      feld.innerHTML =
        `<option value="">${seite === "a" ? "Kind …" : "und …"}</option>` +
        kinder.map(k => `<option>${entschaerfen(k)}</option>`).join("");
      if (bekannt.has(vorher)) feld.value = vorher;
    });

    /* Die schon vorhandenen Regeln auflisten. Ein Name, der nicht
       mehr in der Liste steht, wird markiert – meist ein
       Tippfehler oder ein Kind, das gegangen ist.              */
    const liste = $(`#${art}-liste`);
    if (!zustand[art].length) {
      liste.innerHTML = `<div class="leer">Noch keine Regel.</div>`;
      return;
    }
    liste.innerHTML = zustand[art].map(([a, b], i) => {
      const zeig = n => `<span class="${bekannt.has(n) ? "" : "fehlt"}"` +
                        `${bekannt.has(n) ? "" : ' title="steht nicht in der Namensliste"'}` +
                        `>${entschaerfen(n)}</span>`;
      return `<div class="regel"><span>${zeig(a)}<em>${art === "pflicht" ? "+" : "×"}</em>${zeig(b)}</span>` +
             `<button data-art="${art}" data-nr="${i}" title="Regel entfernen">&times;</button></div>`;
    }).join("");

    $$("button[data-nr]", liste).forEach(b =>
      b.addEventListener("click", () => {
        zustand[b.dataset.art].splice(Number(b.dataset.nr), 1);
        regelnZeichnen(); sichernLokal();
      }));
  });
}

function regelHinzu(art) {
  const a = $(`#${art}-a`).value, b = $(`#${art}-b`).value;
  if (!a || !b || a === b) return;
  const gibtEs = zustand[art].some(p =>
    (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
  if (!gibtEs) zustand[art].push([a, b]);
  $(`#${art}-a`).value = ""; $(`#${art}-b`).value = "";
  regelnZeichnen(); sichernLokal();
}

/* ------------------------------------------------------------
   Verteilen und der Auftritt der Namen
   ------------------------------------------------------------ */

function meldung(art, kopf, text) {
  $("#meldung").innerHTML = art
    ? `<div class="meldung ${art}"><strong>${kopf}</strong>${text}</div>` : "";
}

function verteilen() {
  const kinder  = kinderListe();
  const plaetze = RAUM.plaetze(zustand.raum);
  const ergebnis = VERTEILEN.loesen(kinder, plaetze,
    { pflicht: zustand.pflicht, tabu: zustand.tabu });

  if (!ergebnis.ok) {
    meldung("schlecht", "So geht es nicht", ergebnis.grund);
    zustand.belegung = {};
    raumZeichnen(); sichernLokal();
    return;
  }

  meldung("gut", "Fertig",
    `${kinder.length} ${kinder.length === 1 ? "Kind" : "Kinder"} sitzen. ` +
    `Gefällt es nicht, würfle noch einmal.`);

  zustand.belegung = ergebnis.belegung;
  sichernLokal();
  fliegenLassen(plaetze, ergebnis.belegung);
}

/* Die Namen fliegen aus der Mitte des Raums auf ihre Plätze,
   einer nach dem anderen. Darum geht es bei diesem Werkzeug
   eigentlich: jedes Kind soll sehen können, wo sein Name landet. */
function fliegenLassen(plaetze, belegung) {
  const kasten = $("#raum");

  /* Erst den LEEREN Raum zeichnen – sonst stünden die Namen schon
     da, bevor sie angeflogen kommen.                           */
  RAUM.zeichnen(kasten, zustand.raum, { bearbeiten: false, namen: {} });

  const besetzt = VERTEILEN.mischen(plaetze.filter(p => belegung[p.schluessel]));
  const ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (ruhig || !besetzt.length) { raumZeichnen(); return; }

  const buehne = $(".buehne", kasten);
  const s = RAUM.masstab;
  const ox = buehne.offsetLeft, oy = buehne.offsetTop;

  const flug = document.createElement("div");
  flug.className = "flug";
  kasten.appendChild(flug);

  const mitteX = kasten.clientWidth / 2, mitteY = kasten.clientHeight / 2;
  const dauer = 750;
  /* Bei einer großen Klasse rückt der Takt zusammen, damit das
     Ganze nicht ewig dauert.                                  */
  const takt = Math.min(170, 3400 / besetzt.length);

  besetzt.forEach((p, i) => {
    const schild = document.createElement("div");
    schild.className = "schild";
    schild.textContent = belegung[p.schluessel];
    const streu = w => (Math.random() - .5) * w;
    schild.style.transform =
      `translate(${mitteX + streu(80)}px, ${mitteY + streu(50)}px) ` +
      `translate(-50%,-50%) rotate(${streu(18)}deg)`;
    schild.style.transitionDelay = (i * takt) + "ms";
    flug.appendChild(schild);

    /* Zweimal warten: einmal, damit das Schild überhaupt im
       Dokument steht, einmal, damit der Browser die Startlage
       übernommen hat. Sonst gibt es keinen Übergang, sondern
       einen Sprung.                                          */
    requestAnimationFrame(() => requestAnimationFrame(() => {
      schild.style.transform =
        `translate(${ox + p.x * s}px, ${oy + p.y * s}px) translate(-50%,-50%) rotate(0deg)`;
    }));

    /* Angekommen: der Name erscheint im Platz, das Schild löst
       sich auf. So sieht es aus, als setze sich das Kind hin. */
    setTimeout(() => {
      const feld = kasten.querySelector(
        `.moebel[data-id="${p.moebel}"] .platz[data-platz="${p.index}"]`);
      if (feld) {
        feld.querySelector(".name").textContent = belegung[p.schluessel];
        feld.classList.add("besetzt");
      }
      schild.classList.add("gelandet");
      schild.style.transitionDelay = "0ms";   // sonst verzögert sich auch das Ausblenden
      schild.style.opacity = "0";
    }, i * takt + dauer);
  });

  setTimeout(() => { flug.remove(); raumZeichnen(); },
             besetzt.length * takt + dauer + 450);
}

/* ------------------------------------------------------------
   Die drei Schritte
   ------------------------------------------------------------ */

function schrittSetzen(s) {
  zustand.schritt = s;
  $$("#schritte button").forEach(b => b.classList.toggle("an", b.dataset.schritt === s));
  $$("[data-fuer]").forEach(el => { el.hidden = el.dataset.fuer !== s; });
  if (s === "kinder") { regelnZeichnen(); zaehlerZeichnen(); }
  if (s === "verteilen") meldung(null);
  werkzeugeZeichnen(); raumZeichnen(); sichernLokal();
}

/* ------------------------------------------------------------
   Sichern und Öffnen als Datei
   ------------------------------------------------------------ */

function alsDateiSichern() {
  const name = "Sitzordnung_" +
    (zustand.klasse || "Klasse").replace(/[^\wÄÖÜäöüß-]+/g, "_") + ".json";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(zustand, null, 2)], { type: "application/json" }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function ausDateiLaden(datei) {
  const leser = new FileReader();
  leser.onload = () => {
    try {
      const alt = JSON.parse(leser.result);
      if (!alt || !alt.raum || !Array.isArray(alt.raum.moebel))
        throw new Error("keine Sitzordnung");
      zustand = Object.assign(standardZustand(), alt);
      felderFuellen(); schrittSetzen(zustand.schritt || "raum");
      sichernLokal();
    } catch (e) {
      alert("Diese Datei ist keine gesicherte Sitzordnung.");
    }
  };
  leser.readAsText(datei);
}

/* ------------------------------------------------------------
   Anlauf
   ------------------------------------------------------------ */

function felderFuellen() {
  $("#raum-breite").value = zustand.raum.breite / 100;
  $("#raum-tiefe").value  = zustand.raum.tiefe  / 100;
  $("#namen").value  = zustand.namen;
  $("#klasse").value = zustand.klasse;
  $("#format").value = zustand.format;
  regelnZeichnen(); zaehlerZeichnen();
}

function anlauf() {
  $("#marke-logo").src = SITZ.logo;
  $("#blattstil").textContent = BLATT_CSS;

  $("#format").innerHTML = Object.keys(SITZ.formate)
    .map(k => `<option value="${k}">${SITZ.formate[k].name}</option>`).join("");

  laden();
  felderFuellen();
  $("#seitenformat").textContent = BLATT.seitenCSS(zustand.format);
  schrittSetzen(zustand.schritt || "raum");

  /* ---- Kopfleiste ---- */
  $("#format").addEventListener("change", e => {
    zustand.format = e.target.value;
    $("#seitenformat").textContent = BLATT.seitenCSS(zustand.format);
    sichernLokal();
  });
  $("#btn-drucken").addEventListener("click", () => {
    $("#druck").innerHTML = BLATT.bauen(zustand, zustand.format);
    window.print();
  });
  $("#btn-sichern").addEventListener("click", alsDateiSichern);
  $("#btn-oeffnen").addEventListener("click", () => $("#datei").click());
  $("#datei").addEventListener("change", e => {
    if (e.target.files[0]) ausDateiLaden(e.target.files[0]);
    e.target.value = "";
  });

  /* ---- Schritte ---- */
  $$("#schritte button").forEach(b =>
    b.addEventListener("click", () => schrittSetzen(b.dataset.schritt)));

  /* ---- Schritt 1: der Raum ---- */
  ["breite", "tiefe"].forEach(was =>
    $("#raum-" + was).addEventListener("change", e => {
      const meter = Number(e.target.value);
      if (!meter) { e.target.value = zustand.raum[was] / 100; return; }
      zustand.raum[was] = Math.min(Math.max(meter * 100, SITZ.raum.kleinster), SITZ.raum.groesster);
      e.target.value = zustand.raum[was] / 100;
      /* Tische, die jetzt außerhalb stünden, wieder hereinholen –
         und was an der Wand hing, hängt sich an die neue Wand.  */
      zustand.raum.moebel.forEach(m => {
        const haengt = SITZ.moebel[m.art].andocken && RAUM.andocken(m, zustand.raum);
        RAUM.einpassen(m, zustand.raum, haengt);
      });
      zustand.belegung = {};
      raumZeichnen(); werkzeugeZeichnen(); sichernLokal();
    }));

  $("#btn-raum-leeren").addEventListener("click", () => {
    if (!zustand.raum.moebel.length) return;
    if (!confirm("Alle Tische, Tafel und Tür wegnehmen? Der Raum ist danach leer.")) return;
    zustand.raum.moebel = []; zustand.belegung = {}; RAUM.gewaehlt = null;
    raumZeichnen(); werkzeugeZeichnen(); sichernLokal();
  });

  /* ---- Schritt 2: Kinder und Regeln ---- */
  $("#namen").addEventListener("input", e => {
    zustand.namen = e.target.value;
    zaehlerZeichnen(); regelnZeichnen(); sichernLokal();
  });
  $("#klasse").addEventListener("input", e => {
    zustand.klasse = e.target.value; sichernLokal();
  });
  ["pflicht", "tabu"].forEach(art =>
    $(`#${art}-plus`).addEventListener("click", () => regelHinzu(art)));

  /* ---- Schritt 3: verteilen ---- */
  $("#btn-verteilen").addEventListener("click", verteilen);
  $("#btn-leeren").addEventListener("click", () => {
    zustand.belegung = {}; meldung(null); raumZeichnen(); sichernLokal();
  });

  /* Ändert sich die Fenstergröße, ändert sich der Maßstab. */
  let wartet;
  window.addEventListener("resize", () => {
    clearTimeout(wartet);
    wartet = setTimeout(raumZeichnen, 120);
  });
}

anlauf();
