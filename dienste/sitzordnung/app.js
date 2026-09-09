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
  const ergebnis = VERTEILEN.loesen(kinder, plaetze,
    { pflicht: zustand.pflicht, tabu: zustand.tabu });

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
  $("#btn-still").addEventListener("click", () => verteilen("still"));
  $("#btn-show").addEventListener("click",  () => verteilen("show"));
  $("#btn-leeren").addEventListener("click", () => {
    ziehungAbbrechen(false);
    zustand.belegung = {}; meldung(null);
    raumZeichnen(); werkzeugeZeichnen(); sichernLokal();
  });

  /* Ändert sich die Fenstergröße, ändert sich der Maßstab. */
  let wartet;
  window.addEventListener("resize", () => {
    clearTimeout(wartet);
    wartet = setTimeout(raumZeichnen, 120);
  });
}

anlauf();
