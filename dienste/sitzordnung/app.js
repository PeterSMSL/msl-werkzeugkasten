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

  /* Bündig an die Wand, aus den Maßen gerechnet statt geraten –
     vorher standen hier feste Zahlen aus der Zeit vor dem
     Andocken, und Tafel und Tür hingen sichtbar davor.       */
  stell("tafel", raum.breite / 2, SITZ.moebel.tafel.tiefe / 2);
  stell("tuer", raum.breite - SITZ.moebel.tuer.tiefe / 2, raum.tiefe - 130, 90);
  [220, 350, 480].forEach(y => [180, 400, 620].forEach(x => stell("zweier", x, y)));

  /* stufen        welche Jahrgänge in der Klasse sitzen, z. B. [1,2,3]
     stufenNamen   ein Textfeld je Stufe, ÜBER DIE POSITION zugeordnet
                   und nicht über die Nummer. Nur so überlebt eine
                   Namensliste das Umbenennen von 1-3 auf 4-6.
     namen         Auffangbecken für Namen ohne Stufe             */
  return {
    klasse: "", raum: raum, namen: "",
    stufen: SITZ.stufenVorgabe.slice(),
    stufenNamen: SITZ.stufenVorgabe.map(() => ""),
    mischung: SITZ.mischungen[0].id,
    pflicht: [], tabu: [], belegung: {},
    format: "a4quer", schritt: "raum", ziehungsart: "show",
    version: SITZ.version
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
    if (alt && alt.raum && Array.isArray(alt.raum.moebel)) {
      zustand = Object.assign(standardZustand(), alt);
      /* Sicherungen aus früheren Fassungen kennen die Stufen noch
         nicht oder anders. Lieber auf die Vorgabe zurückfallen,
         als mit einer kaputten Form weiterzurechnen – die Namen
         im Auffangbecken bleiben dabei erhalten.               */
      if (!Array.isArray(zustand.stufen) || !zustand.stufen.length)
        zustand.stufen = SITZ.stufenVorgabe.slice();
      if (!Array.isArray(zustand.stufenNamen))
        zustand.stufenNamen = zustand.stufen.map(() => "");
      while (zustand.stufenNamen.length < zustand.stufen.length)
        zustand.stufenNamen.push("");
    }
  } catch (e) { /* kaputter Eintrag: dann eben von vorn */ }
}

function sichernLokal() {
  try { sessionStorage.setItem(SPEICHER, JSON.stringify(zustand)); } catch (e) {}
}

/* ------------------------------------------------------------
   Zeichnen
   ------------------------------------------------------------ */

/* Wie viel Platz über dem Raum verbraucht wird – gemessen, nicht
   geraten. Kopfleiste, Schritte und Werkzeugleiste brechen auf
   schmalen Geräten um und werden dabei höher; mit einem festen
   Wert stünde der Grundriss dann halb unter dem Fensterrand.   */
function raumHoeheSetzen() {
  const ueber = ($(".leiste").offsetHeight || 0) +
                ($(".schritte").offsetHeight || 0) +
                ($("#werkzeuge").offsetHeight || 0) + 66;
  document.documentElement.style.setProperty("--ueber-dem-raum", ueber + "px");
}

function raumZeichnen() {
  raumHoeheSetzen();
  /* Das Wischen nur beim Einrichten abfangen – siehe app.css. */
  $("#raum").classList.toggle("bearbeiten", zustand.schritt === "raum");
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
  /* Erst die Werkzeugleiste, dann der Raum: seine Höhe hängt davon
     ab, wie hoch die Leiste gerade ist.                        */
  werkzeugeZeichnen(); raumZeichnen(); sichernLokal();
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
    /* Die Knöpfe kommen aus SITZ.moebel – ein neues Möbelstück in
       daten.js erscheint hier von selbst. Links die Tische, dann
       ein Trenner, dann die Einrichtung.                        */
    const knopf = (art, d) =>
      `<button data-neu="${art}">` +
      (d.bild ? `<span class="knopfbild">${d.bild}</span>`
              : d.plaetze ? `<span class="sinnbild ${d.plaetze === 2 ? "zwei" : "ein"}"></span>`
                          : "") +
      ` ${d.name}</button>`;

    const arten = Object.keys(SITZ.moebel);
    kasten.innerHTML =
      arten.filter(a => SITZ.moebel[a].plaetze).map(a => knopf(a, SITZ.moebel[a])).join("") +
      `<span class="trenner"></span>` +
      arten.filter(a => !SITZ.moebel[a].plaetze).map(a => knopf(a, SITZ.moebel[a])).join("") +
      zaehler;

    $$("button[data-neu]", kasten).forEach(b =>
      b.addEventListener("click", () => {
        RAUM.neuesMoebel(zustand.raum, b.dataset.neu);
        raumGeaendert();
      }));

  } else if (zustand.schritt === "verteilen") {
    /* Während der Ziehung steht dort nur ein Knopf: abkürzen.
       Eine Klasse mit 28 Kindern dauert sonst gut eineinhalb
       Minuten, und manchmal will man einfach das Ergebnis.    */
    if (ziehungLaeuft()) {
      kasten.innerHTML =
        `<button id="btn-ueberspringen">Überspringen</button>
         <span class="abstand zaehler">Ziehung läuft …</span>`;
      $("#btn-ueberspringen", kasten)
        .addEventListener("click", () => ziehungAbbrechen(true));
    } else {
      kasten.innerHTML =
        `<button id="btn-nochmal" class="werkzeug-haupt">Noch einmal</button>` + zaehler;
      $("#btn-nochmal", kasten).addEventListener("click",
        () => verteilen(zustand.ziehungsart || "show"));
    }

  } else {
    kasten.innerHTML = zaehler;
  }
}

/* Die Namensfelder – eines je Klassenstufe. Das Auffangbecken für
   Namen ohne Stufe erscheint nur, wenn wirklich etwas drinsteht. */
function jahrgangsfelderBauen() {
  const kasten = $("#jahrgangsfelder");
  const feld = (id, name, wert, klasse, zusatz) =>
    `<div class="jahrgang${klasse ? " " + klasse : ""}">
       <label for="jg-${id}">${entschaerfen(name)}
         ${zusatz ? `<span class="zusatz">${entschaerfen(zusatz)}</span>` : ""}
         <span class="wieviele" id="jg-zahl-${id}"></span>
       </label>
       <textarea class="namen" id="jg-${id}" rows="5"
                 placeholder="ein Name pro Zeile">${entschaerfen(wert || "")}</textarea>
     </div>`;

  let html = jahrgaenge().map(j =>
    feld(j.id, j.name, zustand.stufenNamen[Number(j.id)])).join("");

  if (zeilen(zustand.namen).length)
    html += feld("alt", "Ohne Stufe", zustand.namen, "alt",
                 "bitte auf die Stufen verteilen");

  kasten.innerHTML = html;

  jahrgaenge().forEach(j =>
    $("#jg-" + j.id).addEventListener("input", e => {
      zustand.stufenNamen[Number(j.id)] = e.target.value;
      nachNamensaenderung();
    }));

  const altfeld = $("#jg-alt");
  if (altfeld) altfeld.addEventListener("input", e => {
    zustand.namen = e.target.value;
    nachNamensaenderung();
  });
}

/* Die Lehrkraft hat die Klassenstufen geändert.

   Namen dürfen dabei NIE verschwinden: fällt eine Stufe weg,
   wandern ihre Kinder ins Auffangbecken, wo sie sichtbar bleiben
   und sich neu verteilen lassen.                               */
function stufenSetzen(zahlen) {
  if (!zahlen.length) return false;

  const alteNamen = zustand.stufenNamen.slice();
  zustand.stufen = zahlen;
  zustand.stufenNamen = zahlen.map((n, i) => alteNamen[i] || "");

  const heimatlos = alteNamen.slice(zahlen.length).filter(t => zeilen(t).length);
  if (heimatlos.length)
    zustand.namen = [zustand.namen].concat(heimatlos)
                    .filter(t => zeilen(t).length).join("\n");

  zustand.belegung = {};
  return true;
}

/* Ändert sich die Namensliste, hängt vieles daran. */
function nachNamensaenderung() {
  zaehlerZeichnen(); regelnZeichnen(); sichernLokal();
}

function zaehlerZeichnen() {
  const kinder = kinderListe();
  const plaetze = RAUM.plaetze(zustand.raum).length;

  /* Die Zahl neben jeder Stufenüberschrift. */
  jahrgaenge().forEach(j => {
    const feld = $("#jg-zahl-" + j.id);
    if (feld) {
      const n = zeilen(zustand.stufenNamen[Number(j.id)]).length;
      feld.textContent = n ? n + (n === 1 ? " Kind" : " Kinder") : "";
    }
  });
  const altzahl = $("#jg-zahl-alt");
  if (altzahl) {
    const n = zeilen(zustand.namen).length;
    altzahl.textContent = n ? n + (n === 1 ? " Kind" : " Kinder") : "";
  }
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

/* ------------------------------------------------------------
   Die Klassenstufen
   ------------------------------------------------------------ */

/* Aus dem, was die Lehrkraft tippt, eine Liste von Jahrgängen
   machen. "1-3", "1 bis 3", "1,2,3" und "7 8" ergeben dasselbe.
   Unsinn ergibt eine leere Liste – dann bleibt der alte Stand.  */
function stufenLesen(text) {
  const roh = String(text || "").trim();
  let zahlen = [];

  const bereich = roh.match(/^(\d{1,2})\s*(?:-|–|—|bis)\s*(\d{1,2})$/i);
  if (bereich) {
    const von = +bereich[1], zu = +bereich[2];
    if (von <= zu) for (let i = von; i <= zu; i++) zahlen.push(i);
  } else {
    zahlen = roh.split(/[^\d]+/).map(Number).filter(n => Number.isInteger(n));
  }

  zahlen = zahlen.filter(n => n >= 1 && n <= 13);
  zahlen = zahlen.filter((n, i) => zahlen.indexOf(n) === i);
  return zahlen.slice(0, SITZ.stufenHoechstens);
}

/* Und zurück: die Liste so schreiben, wie ein Mensch sie schreibt. */
function stufenSchreiben(zahlen) {
  if (!zahlen.length) return "";
  const durchgehend = zahlen.every((n, i) => i === 0 || n === zahlen[i - 1] + 1);
  return durchgehend && zahlen.length > 1
    ? zahlen[0] + "–" + zahlen[zahlen.length - 1]
    : zahlen.join(", ");
}

/* Die Jahrgänge, wie der Löser und die Oberfläche sie brauchen.
   Die Kennung ist die Position, nicht die Nummer – siehe oben. */
function jahrgaenge() {
  return zustand.stufen.map((n, i) => ({
    id: String(i), nummer: n, name: SITZ.stufenwort + " " + n
  }));
}

function zeilen(text) {
  return (text || "").split("\n").map(s => s.trim()).filter(Boolean);
}

/* Alle Kinder, Stufe für Stufe – und zum Schluss die ohne. */
function kinderListe() {
  const alle = [];
  zustand.stufenNamen.forEach(t => zeilen(t).forEach(n => alle.push(n)));
  zeilen(zustand.namen).forEach(n => alle.push(n));
  return alle;
}

/* Welches Kind gehört zu welcher Stufe? Kinder aus dem
   Auffangbecken stehen in keiner und bremsen daher nie.        */
function jahrgangKarte() {
  const karte = {};
  zustand.stufenNamen.forEach((t, i) =>
    zeilen(t).forEach(n => { karte[n] = String(i); }));
  return karte;
}

function entschaerfen(s) {
  return String(s).replace(/[&<>"]/g, z =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[z]));
}

/* Wer steht schon in einem Pflichtpaar? An einem Zweiertisch ist
   für zwei Platz, also kann jedes Kind nur in EINEM stehen.     */
function festVergeben() {
  return new Set([].concat.apply([], zustand.pflicht));
}

/* Mit wem muss dieses Kind zusammensitzen? (höchstens einer) */
function pflichtPartner(name) {
  const paar = zustand.pflicht.find(p => p.indexOf(name) >= 0);
  return paar ? paar.find(x => x !== name) : null;
}

/* Von wem ist dieses Kind schon getrennt? (beliebig viele) */
function tabuPartner(name) {
  return zustand.tabu.filter(p => p.indexOf(name) >= 0)
                     .map(p => p.find(x => x !== name));
}

/* Die beiden Auswahlfelder einer Regelart füllen.

   Hier liegt der Unterschied zwischen den beiden Bremsen:

   PFLICHT  Ein Kind, das schon fest verpaart ist, verschwindet aus
            der Auswahl. Sonst könnte man es einem zweiten Kind
            zuordnen – und an einen Zweiertisch passen keine drei.
            Wer eine Paarung ändern will, nimmt sie erst weg; dann
            sind beide Namen sofort wieder da.

   TABU     Ein Kind darf von beliebig vielen getrennt werden, es
            bleibt also immer wählbar. Nur die Kombinationen, die
            es schon gibt, fallen aus dem zweiten Feld heraus.

   Beide schließen zusätzlich aus, was sich widersprechen würde:
   wer zusammen MUSS, taucht beim Trennen nicht auf, und wer
   getrennt ist, nicht beim Zusammensetzen.                     */
function auswahlFuellen(art) {
  const kinder = kinderListe();
  const feldA = $(`#${art}-a`), feldB = $(`#${art}-b`);
  const fest = festVergeben();

  const moeglichA = art === "pflicht" ? kinder.filter(k => !fest.has(k)) : kinder;

  const alterA = feldA.value;
  feldA.innerHTML = `<option value="">Kind …</option>` +
    moeglichA.map(k => `<option>${entschaerfen(k)}</option>`).join("");
  if (moeglichA.indexOf(alterA) >= 0) feldA.value = alterA;

  const a = feldA.value;
  let moeglichB = [];
  if (a) {
    if (art === "pflicht") {
      const getrennt = new Set(tabuPartner(a));
      moeglichB = kinder.filter(k => k !== a && !fest.has(k) && !getrennt.has(k));
    } else {
      const schon = new Set(tabuPartner(a));
      const muss = pflichtPartner(a);
      moeglichB = kinder.filter(k => k !== a && !schon.has(k) && k !== muss);
    }
  }

  const alterB = feldB.value;
  feldB.innerHTML = `<option value="">und …</option>` +
    moeglichB.map(k => `<option>${entschaerfen(k)}</option>`).join("");
  if (moeglichB.indexOf(alterB) >= 0) feldB.value = alterB;

  feldB.disabled = !a;
  $(`#${art}-plus`).disabled = !a || !feldB.value;

  /* Sagen, wenn nichts mehr zu wählen ist – ein leeres Feld ohne
     Erklärung sieht nach einem Fehler aus.                     */
  const notiz = $(`#${art}-notiz`);
  if (art === "pflicht" && kinder.length && moeglichA.length < 2)
    notiz.textContent = moeglichA.length
      ? "Nur noch ein Kind ist frei – für ein Paar braucht es zwei."
      : "Alle Kinder sind schon fest verpaart.";
  else if (a && !moeglichB.length)
    notiz.textContent = art === "pflicht"
      ? `Für „${a}“ ist kein freies Kind mehr übrig.`
      : `„${a}“ ist schon von allen anderen getrennt.`;
  else
    notiz.textContent = "";
}

function regelListeZeichnen(art) {
  const bekannt = new Set(kinderListe());
  const liste = $(`#${art}-liste`);

  if (!zustand[art].length) {
    liste.innerHTML = `<div class="leer">Noch keine Regel.</div>`;
    return;
  }

  /* Ein Name, der nicht mehr in der Liste steht, wird markiert –
     meist ein Tippfehler oder ein Kind, das gegangen ist.      */
  liste.innerHTML = zustand[art].map(([a, b], i) => {
    const zeig = n => `<span class="${bekannt.has(n) ? "" : "fehlt"}"` +
                      `${bekannt.has(n) ? "" : ' title="steht nicht in der Namensliste"'}` +
                      `>${entschaerfen(n)}</span>`;
    return `<div class="regel"><span>${zeig(a)}` +
           `<em>${art === "pflicht" ? "+" : "×"}</em>${zeig(b)}</span>` +
           `<button data-art="${art}" data-nr="${i}" title="Regel entfernen">&times;</button></div>`;
  }).join("");

  $$("button[data-nr]", liste).forEach(b =>
    b.addEventListener("click", () => {
      zustand[b.dataset.art].splice(Number(b.dataset.nr), 1);
      regelnZeichnen(); sichernLokal();
    }));
}

function regelnZeichnen() {
  ["pflicht", "tabu"].forEach(art => {
    auswahlFuellen(art);
    regelListeZeichnen(art);
  });
}

function regelHinzu(art) {
  const a = $(`#${art}-a`).value, b = $(`#${art}-b`).value;
  if (!a || !b || a === b) return;
  const gibtEs = zustand[art].some(p =>
    (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
  if (!gibtEs) zustand[art].push([a, b]);

  /* Beim Trennen bleibt das erste Kind stehen: meistens will man
     „Peter nicht neben Anna, und auch nicht neben Jonas". Beim
     Zusammensetzen ist das Paar fertig, dort werden beide Felder
     geleert.                                                    */
  if (art === "tabu") $(`#${art}-b`).value = "";
  else { $(`#${art}-a`).value = ""; $(`#${art}-b`).value = ""; }

  regelnZeichnen(); sichernLokal();
}

/* ------------------------------------------------------------
   Verteilen und der Auftritt der Namen
   ------------------------------------------------------------ */

function meldung(art, kopf, text) {
  $("#meldung").innerHTML = art
    ? `<div class="meldung ${art}"><strong>${kopf}</strong>${text}</div>` : "";
}

/* Es gibt zwei Wege, die Kinder zu setzen, und sie unterscheiden
   sich NUR in der Vorführung – gewürfelt wird beide Male gleich:

     "still"  sofort hingesetzt. Für die Runde zu zweit mit der
              Kollegin, wenn niemand zuschaut.
     "show"   jeder Name wird einzeln aus dem Haufen gezogen, groß
              in die Mitte gestellt und wandert dann auf seinen
              Platz. Für die Klasse am Beamer.                   */
function verteilen(art) {
  ziehungAbbrechen(false);

  const kinder  = kinderListe();
  const plaetze = RAUM.plaetze(zustand.raum);
  const ergebnis = VERTEILEN.loesen(kinder, plaetze, {
    pflicht: zustand.pflicht, tabu: zustand.tabu,
    mischung: zustand.mischung, jahrgang: jahrgangKarte(),
    jahrgaenge: jahrgaenge()
  });

  if (!ergebnis.ok) {
    meldung("schlecht", "So geht es nicht", ergebnis.grund);
    zustand.belegung = {};
    raumZeichnen(); werkzeugeZeichnen(); sichernLokal();
    return;
  }

  zustand.belegung = ergebnis.belegung;
  zustand.ziehungsart = art;              // "Noch einmal" wiederholt denselben Weg
  sichernLokal();

  /* Wer im Betriebssystem „Animationen reduzieren" eingeschaltet hat,
     bekommt das Ergebnis sofort. Das ist richtig so – aber es DARF
     nicht stillschweigend passieren: wer auf „Ziehung starten"
     drückt und dann einfach ein fertiges Bild sieht, hält das
     Werkzeug für kaputt. Also sagen, was los ist und warum.      */
  const ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (art === "show" && ruhig)
    meldung("gut", "Ohne Vorführung",
      `${kinder.length} ${kinder.length === 1 ? "Kind" : "Kinder"} sitzen. ` +
      `Die Ziehung wurde übersprungen, weil auf diesem Gerät ` +
      `<b>„Animationen reduzieren“</b> eingeschaltet ist. In den ` +
      `Einstellungen des Geräts lässt sich das abschalten.`);
  else
    meldung("gut", "Fertig",
      `${kinder.length} ${kinder.length === 1 ? "Kind" : "Kinder"} sitzen. ` +
      `Gefällt es nicht, würfle noch einmal.`);

  if (art === "show" && !ruhig) vorfuehren(plaetze, ergebnis.belegung);
  else { raumZeichnen(); werkzeugeZeichnen(); }
}

/* ------------------------------------------------------------
   Die Ziehung
   ------------------------------------------------------------ */

/* Läuft gerade eine Vorführung, hängt hier ihre Merkliste –
   daran lässt sie sich abbrechen.                            */
let ziehung = null;

function ziehungLaeuft() { return ziehung !== null; }

/* fertigMachen: true  = sofort das Endbild zeigen (Überspringen)
                  false = nur aufräumen, es kommt gleich etwas Neues */
function ziehungAbbrechen(fertigMachen) {
  if (!ziehung) return;
  ziehung.uhren.forEach(clearTimeout);
  ziehung = null;
  const flug = $(".flug", $("#raum"));
  if (flug) flug.remove();
  if (fertigMachen) { raumZeichnen(); werkzeugeZeichnen(); }
}

/* Der Ablauf je Kind:

     1. aus dem Haufen heranholen und groß werden
     2. eine Weile groß stehen bleiben – lang genug, dass auch die
        hinterste Reihe liest, wer dran ist
     3. SUCHEN: leicht schräg über ein paar Plätze schweben, als
        überlege der Name, wo er hin soll
     4. den eigenen Platz finden, sich geradedrehen und hinsetzen

   Schritt 3 ist der Grund, warum das hier eine Vorführung ist und
   keine Zuweisung. Ruhig, nicht hektisch: die Zwischenflüge sind
   fast so lang wie der letzte, und die Kurve ist beidseitig weich.

   Alle Zeiten stehen in SITZ.ziehung (daten.js) und sind dort
   zum Nachstellen gedacht.                                     */

/* Der Korb, in dem die Namen liegen, bevor sie gezogen werden.
   Reines SVG, keine Bilddatei – dann gibt es nichts nachzuladen
   und nichts, was auf der Festplatte fehlen könnte.

   Die Kennung im clipPath ist absichtlich sperrig: sie steht
   einmal im Dokument, und nichts anderes soll sie erwischen. */
const KORB_SVG = `
<svg viewBox="0 0 240 150" aria-hidden="true">
  <defs>
    <clipPath id="sitz-korb-innen">
      <path d="M34 50 H206 L184 132 Q182 140 174 140 H66 Q58 140 56 132 Z"/>
    </clipPath>
  </defs>
  <ellipse cx="120" cy="144" rx="76" ry="6" fill="#1F2A37" opacity=".12"/>
  <path d="M34 50 H206 L184 132 Q182 140 174 140 H66 Q58 140 56 132 Z" fill="#E0B27B"/>
  <g clip-path="url(#sitz-korb-innen)" stroke="#C08A4E" stroke-width="2.6"
     fill="none" opacity=".7" stroke-linecap="round">
    <path d="M30 74 H210"/><path d="M34 96 H206"/><path d="M38 118 H202"/>
    <path d="M72 48 L80 142"/><path d="M104 48 L106 142"/>
    <path d="M136 48 L134 142"/><path d="M168 48 L160 142"/>
  </g>
  <rect x="22" y="36" width="196" height="24" rx="12" fill="#CE9455"/>
  <rect x="31" y="41" width="178" height="7" rx="3.5" fill="#EFCC9A" opacity=".7"/>
</svg>`;

function vorfuehren(plaetze, belegung) {
  const kasten = $("#raum");

  /* Erst den LEEREN Raum zeichnen – sonst stünden die Namen schon
     da, bevor sie gezogen werden.                              */
  RAUM.zeichnen(kasten, zustand.raum, { bearbeiten: false, namen: {} });

  const gezogen = VERTEILEN.mischen(plaetze.filter(p => belegung[p.schluessel]));
  if (!gezogen.length) { raumZeichnen(); werkzeugeZeichnen(); return; }

  const buehne = $(".buehne", kasten);
  const mass = RAUM.masstab;
  const ox = buehne.offsetLeft, oy = buehne.offsetTop;

  /* Groß gezeigt wird in der MITTE des Raums – das ist der
     Augenblick, auf den alle schauen.                        */
  const mitteX = kasten.clientWidth / 2, mitteY = kasten.clientHeight / 2;

  /* So groß darf der gezogene Name werden, ohne aus dem Raum zu
     ragen – bei einem schmalen Fenster eben etwas weniger.     */
  const gross = Math.max(1.8, Math.min(3.6, kasten.clientWidth / 320));

  const flug = document.createElement("div");
  flug.className = "flug";
  kasten.appendChild(flug);

  /* Der Korb steht oben links, gleich unter „Noch einmal“ – nicht
     mitten im Raum, wo er die Tische verdeckt. Auf schmalen
     Geräten wird er kleiner, sonst nähme er den halben Raum ein. */
  const korbBreite = Math.max(140, Math.min(230, kasten.clientWidth * 0.30));
  const korb = document.createElement("div");
  korb.className = "korb";
  korb.style.width = korbBreite + "px";
  korb.innerHTML = KORB_SVG + `<span class="korb-zahl"></span>`;
  flug.appendChild(korb);
  const korbZahl = $(".korb-zahl", korb);

  /* Die Zettel STECKEN im Korb: sie liegen in der Malreihenfolge
     vor ihm, aber der Korb bekommt die höhere Ebene und deckt ihre
     untere Hälfte ab. Was übrig bleibt, schaut über den Rand –
     wie Lose, nach denen man greifen kann. Nur der gezogene Name
     (.dran) liegt über dem Korb.

     Der Rand des Korbes sitzt bei etwa 15 % seiner Breite, von
     seiner oberen Kante aus gerechnet; dort liegt die Mitte des
     Haufens.                                                    */
  const haufenX = 14 + korbBreite / 2;
  const haufenY = 8 + korbBreite * 0.15;

  /* Die Kurven: wie sich die Bewegung anfühlt.
       AUS   – aus dem Haufen heraus, mit einem Hauch Überschwingen
       WEICH – beidseitig sanft, für das ruhige Schweben
       AN    – ankommen und sich kurz setzen                     */
  const AUS   = "cubic-bezier(.2,.9,.25,1.06)";
  const WEICH = "cubic-bezier(.45,.05,.55,.95)";
  /* Kein Überschwingen beim Ankommen: das gab dem Hinsetzen einen
     Ruck. Stattdessen ein langes, gleichmäßiges Auslaufen –
     der Name wird zum Schluss immer langsamer.                */
  const AN    = "cubic-bezier(.32,.02,.22,1)";

  const stelle = (el, x, y, dreh, skala, dauer, kurve) => {
    /* Zwei Werte: der erste gilt der Bewegung, der zweite dem
       Ein- und Ausblenden. Mit nur einem würde das Schild am
       Platz genauso lange verblassen, wie es geflogen ist.   */
    el.style.transitionDuration = dauer + "ms, 320ms";
    el.style.transitionTimingFunction = (kurve || WEICH) + ", linear";
    el.style.transform =
      `translate(${x}px, ${y}px) translate(-50%,-50%) rotate(${dreh}deg) scale(${skala})`;
  };

  /* Alle Namen liegen von Anfang an als Haufen in der Mitte. Die
     Lage wird VOR dem Einhängen gesetzt, sonst würde der erste
     Übergang von der linken oberen Ecke aus laufen.            */
  const streu = w => (Math.random() - .5) * w;
  const liste = gezogen.map(p => {
    const el = document.createElement("div");
    el.className = "schild";
    el.textContent = belegung[p.schluessel];
    el.style.transform =
      `translate(${haufenX + streu(korbBreite * 0.48)}px, ${haufenY + streu(28)}px) ` +
      `translate(-50%,-50%) rotate(${streu(22)}deg) scale(1)`;
    flug.appendChild(el);

    /* Ein paar fremde Plätze als Zwischenhalte – dorthin schwebt
       der Name, bevor er seinen eigenen findet.                */
    const wege = VERTEILEN.mischen(plaetze.filter(q => q.schluessel !== p.schluessel))
                          .slice(0, SITZ.ziehung.sucheSchritte);
    return { p: p, el: el, wege: wege };
  });

  ziehung = { uhren: [] };
  const spaeter = (fn, ms) => ziehung.uhren.push(setTimeout(fn, ms));

  korbZahl.textContent = liste.length === 1 ? "1 Name" : liste.length + " Namen";

  const zeit = SITZ.ziehung;
  const proKind = zeit.heran + zeit.zeigen +
                  zeit.suchen * zeit.sucheSchritte + zeit.landen + zeit.pause;

  liste.forEach((eintrag, i) => {
    let t = i * proKind;

    /* 1. herausziehen, in die Mitte, groß werden */
    spaeter(() => {
      flug.classList.add("zieht");        // der Rest des Haufens tritt zurück
      eintrag.el.classList.add("dran");
      stelle(eintrag.el, mitteX, mitteY, 0, gross, zeit.heran, AUS);

      const uebrig = liste.length - i - 1;
      korbZahl.textContent = uebrig === 0 ? "leer"
                           : uebrig === 1 ? "noch 1 Name"
                           : "noch " + uebrig + " Namen";
      if (uebrig === 0) korb.classList.add("leer");
    }, t);
    t += zeit.heran + zeit.zeigen;

    /* 2. suchen: schräg über ein paar Plätze schweben und dabei
          langsam kleiner werden – als sinke der Name herab.

          Er bleibt dabei deutlich GRÖSSER als der Haufen. Sonst
          verschwindet er beim ersten Zwischenhalt zwischen den
          anderen Schildern, und genau das soll man ja verfolgen
          können.                                                */
    eintrag.wege.forEach((q, k) => {
      const neigung = k % 2 ? 8 : -8;
      const groesse = Math.max(1.45, gross * (0.62 - k * 0.10));
      spaeter(() => stelle(eintrag.el,
                           ox + q.x * mass, oy + q.y * mass - 22,
                           neigung, groesse, zeit.suchen, WEICH), t);
      t += zeit.suchen;
    });

    /* 3. den eigenen Platz gefunden: geradedrehen und ankommen */
    spaeter(() => stelle(eintrag.el,
                         ox + eintrag.p.x * mass, oy + eintrag.p.y * mass,
                         0, 1, zeit.landen, AN), t);
    t += zeit.landen;

    /* 4. hinsetzen: der Name erscheint im Platz, das Schild löst
          sich auf. So sieht es aus, als setze sich das Kind hin. */
    spaeter(() => {
      const feld = kasten.querySelector(
        `.moebel[data-id="${eintrag.p.moebel}"] .platz[data-platz="${eintrag.p.index}"]`);
      if (feld) {
        feld.querySelector(".name").textContent = belegung[eintrag.p.schluessel];
        feld.classList.add("besetzt");
      }
      eintrag.el.classList.remove("dran");
      eintrag.el.classList.add("gelandet");
      eintrag.el.style.opacity = "0";
    }, t);
  });

  /* Ganz am Ende aufräumen und das saubere Endbild zeichnen. */
  spaeter(() => { ziehung = null; flug.remove(); raumZeichnen(); werkzeugeZeichnen(); },
          liste.length * proKind + 400);

  werkzeugeZeichnen();                    // die Leiste zeigt jetzt „Überspringen“
}

/* ------------------------------------------------------------
   Die drei Schritte
   ------------------------------------------------------------ */

function schrittSetzen(s) {
  /* Wer weggeht, während die Ziehung läuft, soll sie nicht im
     Hintergrund weiterlaufen lassen. */
  if (s !== "verteilen") ziehungAbbrechen(false);
  zustand.schritt = s;
  /* Steht am <main>, damit das Stylesheet auf einspaltigen Geräten
     entscheiden kann, was oben steht: der Raum oder die Felder. */
  $("#werkstatt").dataset.schritt = s;
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
  dateiWarnung(name);
}

/* Der Hinweis beim Sichern.

   Er kommt JEDES MAL und nicht nur einmal: Wer eine Datei mit
   Kindernamen weitergibt, soll in dem Augenblick daran denken, in
   dem er sie weitergibt. Ruhig gehalten und keine Warnung mit
   Ausrufezeichen – er soll erinnern, nicht erschrecken.

   Er steht in einem EIGENEN Feld ganz oben, denn das vorhandene
   „#meldung" liegt im Schritt „Verteilen" und wäre in den ersten
   beiden Schritten unsichtbar. Gesichert wird aber jederzeit.  */
function dateiWarnung(name) {
  const kasten = $("#dateimeldung");
  if (!kasten) return;
  const kinder = kinderListe().length;
  kasten.innerHTML = `<div class="meldung hinweis">
    <strong>${entschaerfen(name)} liegt jetzt bei dir</strong>
    Die Datei enthält <b>${kinder
      ? "die Namen von " + kinder + (kinder === 1 ? " Kind" : " Kindern")
      : "deine Eingaben"}</b> im Klartext und ist nicht geschützt: Wer sie
    hat, kann sie öffnen und lesen &ndash; <b>wie ein Word-Dokument</b>.
    Behandle sie auch so. Nicht auf einem Stick liegen lassen, der
    herumgeht, und beim Verschicken überlegen, an wen.
  </div>`;
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

function mischungZeigen() {
  const m = SITZ.mischungen.find(x => x.id === zustand.mischung) || SITZ.mischungen[0];
  const erste = jahrgaenge()[0];
  $("#mischung").value = m.id;
  /* Bei „Die Neuen verteilen" die Stufe beim Namen nennen – dann
     muss niemand überlegen, welche gemeint ist.               */
  $("#mischung-was").textContent = m.was +
    (m.id === "neue" && erste ? " Hier also: nie zwei Kinder aus " +
                                erste.name + " an einem Tisch." : "");
}

function stufenZeigen() {
  $("#stufen").value = stufenSchreiben(zustand.stufen);
}

function felderFuellen() {
  $("#raum-breite").value = zustand.raum.breite / 100;
  $("#raum-tiefe").value  = zustand.raum.tiefe  / 100;
  $("#klasse").value = zustand.klasse;
  $("#format").value = zustand.format;
  stufenZeigen();
  jahrgangsfelderBauen();
  mischungZeigen();
  regelnZeichnen(); zaehlerZeichnen();
}

function anlauf() {
  $("#marke-logo").src = SITZ.logo;

  /* Ein Platz für den Hinweis beim Sichern – ganz oben in der
     Steuerung, damit er in jedem Schritt zu sehen ist.        */
  $(".steuerung").insertAdjacentHTML("afterbegin", '<div id="dateimeldung"></div>');
  $("#blattstil").textContent = BLATT_CSS;

  $("#format").innerHTML = Object.keys(SITZ.formate)
    .map(k => `<option value="${k}">${SITZ.formate[k].name}</option>`).join("");

  $("#mischung").innerHTML = SITZ.mischungen
    .map(m => `<option value="${m.id}">${m.name}</option>`).join("");

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
    if (!confirm("Alles wegnehmen? Der Raum ist danach leer.")) return;
    zustand.raum.moebel = []; zustand.belegung = {}; RAUM.gewaehlt = null;
    raumZeichnen(); werkzeugeZeichnen(); sichernLokal();
  });

  /* ---- Schritt 2: Kinder und Regeln ---- */
  $("#stufen").addEventListener("change", e => {
    const zahlen = stufenLesen(e.target.value);
    if (!zahlen.length || !stufenSetzen(zahlen)) { stufenZeigen(); return; }
    stufenZeigen(); jahrgangsfelderBauen(); mischungZeigen();
    zaehlerZeichnen(); regelnZeichnen();
    raumZeichnen(); werkzeugeZeichnen(); sichernLokal();
  });

  $("#mischung").addEventListener("change", e => {
    zustand.mischung = e.target.value;
    mischungZeigen(); sichernLokal();
  });
  $("#klasse").addEventListener("input", e => {
    zustand.klasse = e.target.value; sichernLokal();
  });
  ["pflicht", "tabu"].forEach(art => {
    $(`#${art}-plus`).addEventListener("click", () => regelHinzu(art));
    /* Das zweite Feld hängt vom ersten ab, und der Plus-Knopf von
       beiden – deshalb nach jeder Wahl neu aufbauen.          */
    $(`#${art}-a`).addEventListener("change", () => auswahlFuellen(art));
    $(`#${art}-b`).addEventListener("change", () => auswahlFuellen(art));
  });

  /* ---- Schritt 3: verteilen ---- */
  $("#btn-still").addEventListener("click", () => verteilen("still"));
  $("#btn-show").addEventListener("click",  () => verteilen("show"));
  $("#btn-leeren").addEventListener("click", () => {
    ziehungAbbrechen(false);
    zustand.belegung = {}; meldung(null);
    raumZeichnen(); werkzeugeZeichnen(); sichernLokal();
  });

  /* Entf nimmt das gewählte Möbelstück weg.

     Nur im Schritt „Klassenzimmer", und nur wenn der Finger nicht
     gerade in einem Textfeld steht – sonst löschte die Rücktaste
     beim Tippen von Namen den halben Raum.                     */
  document.addEventListener("keydown", e => {
    if (zustand.schritt !== "raum") return;
    if (e.key !== "Delete" && e.key !== "Backspace") return;
    const wo = e.target;
    if (wo && (wo.tagName === "INPUT" || wo.tagName === "TEXTAREA" ||
               wo.tagName === "SELECT" || wo.isContentEditable)) return;
    if (!RAUM.gewaehlt) return;
    zustand.raum.moebel = zustand.raum.moebel.filter(m => m.id !== RAUM.gewaehlt);
    RAUM.gewaehlt = null;
    e.preventDefault();
    raumGeaendert();
  });

  /* Ändert sich die Fenstergröße, ändert sich der Maßstab. */
  let wartet;
  window.addEventListener("resize", () => {
    clearTimeout(wartet);
    wartet = setTimeout(raumZeichnen, 120);
  });
}

anlauf();
