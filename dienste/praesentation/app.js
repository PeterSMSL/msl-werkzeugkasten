/* ============================================================
   APP.JS  –  die Bedienung der Folienwerkstatt.

   Hält den Stand zusammen, baut die Eingabemaske aus den
   Feldbeschreibungen in daten.js und zeigt neben jedem Tastendruck
   sofort, wie die Folie aussieht.

   Der Stand liegt in IndexedDB dieses Browsers und sonst nirgends
   – siehe speicher.js. Nichts davon verlässt das Gerät.
   ============================================================ */

const $  = (w, k) => (k || document).querySelector(w);
const $$ = (w, k) => Array.from((k || document).querySelectorAll(w));

/* Eine Folie ist 1280 x 720 Bildpunkte (folien-design.js). In
   Millimetern sind das diese Maße – gebraucht wird das nur beim
   Drucken, um die Folie auf das Papier zu rechnen.            */
const MM_JE_PUNKT = 25.4 / 96;
const FOLIE_BREITE_MM = 1280 * MM_JE_PUNKT;   /* 338,67 mm */
const FOLIE_HOEHE_MM  =  720 * MM_JE_PUNKT;   /* 190,50 mm */

function entschaerfen(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, z =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[z]));
}

const tief = o => JSON.parse(JSON.stringify(o));

/* ------------------------------------------------------------
   Der Stand
   ------------------------------------------------------------ */

function standardZustand() {
  const v = tief(VORTRAG.standardVortrag);
  return {
    rahmen: v.rahmen,
    folien: v.folien,
    gewaehlt: 0,
    format: "a4quer",
    schritt: "rahmen",
    /* Etappe für Etappe kommt hier mehr hinein – die Medien der
       Bilder- und Videofolien bekommen ein eigenes Fach, damit die
       Folien selbst klein und lesbar bleiben und nur verweisen. */
    medien: {},
    version: VORTRAG.version
  };
}

let zustand = standardZustand();
let vorlagen = [];

/* Solange der Anlauf läuft, wird NICHT geschrieben. Sonst legte die
   Werkstatt beim Aufbauen das leere Standardgerüst ab und überschriebe
   damit genau den Stand, den sie gerade laden will.              */
let anlaufLaeuft = true;

function sichern() {
  if (anlaufLaeuft) return;
  SPEICHER.schreiben("aktuell", zustand).then(geklappt => {
    if (!geklappt) speicherPruefen();
  });
}

/* Ein Speicher, der nicht speichert, darf NICHT still bleiben: wer
   eine Stunde lang Folien baut und beim Neuladen alles verliert,
   hält das Werkzeug zu Recht für kaputt.                        */
let klemmtGemeldet = false;
function speicherPruefen() {
  if (klemmtGemeldet) return;

  if (SPEICHER.klemmt) {
    klemmtGemeldet = true;
    meldung("schlecht", "Dieser Browser speichert nichts",
      "Vermutlich ein privates Fenster oder gesperrte Seitendaten. Die " +
      "Arbeit ist beim Neuladen weg. Bitte zwischendurch <b>Sichern</b> " +
      "benutzen – das legt eine Datei bei dir ab, die sich jederzeit " +
      "wieder öffnen lässt.");
    return;
  }

  /* Der andere Fall: Es wurde geschrieben und ging trotzdem nicht.
     Beim kleinen Speicher heißt das: er ist voll.              */
  klemmtGemeldet = true;
  meldung("schlecht", "Der Speicher ist voll",
    SPEICHER.platzKnapp
      ? "Von der Festplatte aus kann der Browser nur wenig ablegen, und das " +
        "ist jetzt aufgebraucht. Bitte mit <b>Sichern</b> eine Datei ablegen."
      : "Der Browser konnte den Stand nicht ablegen. Bitte mit " +
        "<b>Sichern</b> eine Datei ablegen.");
}

function meldung(art, kopf, text) {
  const kasten = $("#meldungen");
  if (!kasten) return;
  kasten.innerHTML = art
    ? `<div class="meldung ${art}"><strong>${kopf}</strong>${text}</div>` : "";
}

/* ------------------------------------------------------------
   Was auf jeder Folie steht
   ------------------------------------------------------------ */
function rahmenDaten() {
  return {
    schulname: VORTRAG.schulname,
    kurs: zustand.rahmen.kurs || "",
    logo: VORTRAG.logo,
    /* Die Bilder liegen zentral und die Folien verweisen nur –
       siehe bausteine.js. Hier werden sie durchgereicht.      */
    medien: zustand.medien || {}
  };
}

function folieHTML(i) {
  return BAUSTEIN.folie(zustand.folien[i], rahmenDaten(), i + 1, zustand.folien.length);
}

function gewaehlteFolie() {
  if (!zustand.folien.length) return null;
  zustand.gewaehlt = Math.max(0, Math.min(zustand.folien.length - 1, zustand.gewaehlt));
  return zustand.folien[zustand.gewaehlt];
}

/* ------------------------------------------------------------
   Die Vorschau
   ------------------------------------------------------------ */

/* Eine Folie in einen Rahmen gegebener Größe rechnen.

   Das ist die eine Stelle, an der aus „1280 x 720" etwas Sichtbares
   wird – für den Bildschirm in Bildpunkten, fürs Papier in
   Millimetern. Beide Male dieselbe Rechnung, nur eine andere
   Einheit. Genau wie RAUM.aufbau in der Sitzordnung.          */
function inRahmen(innen, breite, hoehe, einheit) {
  const bezugB = einheit === "mm" ? FOLIE_BREITE_MM : 1280;
  const bezugH = einheit === "mm" ? FOLIE_HOEHE_MM  : 720;
  const s = Math.min(breite / bezugB, hoehe / bezugH);

  /* Was übrig bleibt, verteilt sich gleichmäßig auf beide Seiten –
     eine 16:9-Folie auf A4 quer bekommt so oben und unten denselben
     weißen Streifen.                                            */
  const randL = (breite - bezugB * s) / 2;
  const randO = (hoehe  - bezugH * s) / 2;

  /* Das Stil-Attribut wird VOR die Klasse gesetzt – so trifft die
     Ersetzung das öffnende Tag und nichts sonst.              */
  const stil = `transform:scale(${s});` +
               `margin-left:${randL}${einheit};margin-top:${randO}${einheit}`;
  return `<div class="folienrahmen" style="width:${breite}${einheit};height:${hoehe}${einheit}">` +
    innen.replace('<section class="folie', `<section style="${stil}" class="folie`) +
    `</div>`;
}

function vorschauZeichnen() {
  const kasten = $("#schaukasten");
  const f = gewaehlteFolie();

  if (!f) {
    kasten.style.height = "120px";
    kasten.innerHTML = `<p class="hinweis" style="padding:14px">
      Noch keine Folie. Im Schritt <b>Folien</b> eine anlegen.</p>`;
    $("#schau-nr").textContent = "";
    $("#schau-fuss").textContent = "";
    return;
  }

  const breite = kasten.clientWidth || 360;
  const hoehe = Math.round(breite * 720 / 1280);
  kasten.style.height = hoehe + "px";
  kasten.innerHTML = inRahmen(folieHTML(zustand.gewaehlt), breite, hoehe, "px");

  $("#schau-nr").textContent =
    (zustand.gewaehlt + 1) + " / " + zustand.folien.length;

  const art = VORTRAG.bausteine.find(b => b.id === f.baustein);
  $("#schau-fuss").innerHTML = f.schrittweise
    ? "Wird beim Vorführen nacheinander aufgedeckt."
    : (art ? entschaerfen(art.name) : "");
}

/* ------------------------------------------------------------
   Die Folienliste
   ------------------------------------------------------------ */
function folienlisteZeichnen() {
  const liste = $("#folienliste");
  if (!zustand.folien.length) {
    liste.innerHTML = `<li class="leer" style="cursor:default;border-style:dashed">
      <span class="was"><span class="name">Noch keine Folie</span>
      <span class="art">auf „+ Folie“ tippen</span></span></li>`;
    return;
  }

  liste.innerHTML = zustand.folien.map((f, i) => {
    const art = VORTRAG.bausteine.find(b => b.id === f.baustein);
    return `<li data-nr="${i}" class="${i === zustand.gewaehlt ? "dran" : ""}">
      <span class="nr">${i + 1}</span>
      <span class="was">
        <span class="name">${entschaerfen(BAUSTEIN.benennen(f))}</span>
        <span class="art">${entschaerfen(art ? art.name : f.baustein)}</span>
      </span>
      <span class="griffe">
        <button data-tu="hoch"   title="nach oben">&#9650;</button>
        <button data-tu="runter" title="nach unten">&#9660;</button>
      </span>
    </li>`;
  }).join("");
}

$("#folienliste").addEventListener("click", e => {
  const zeile = e.target.closest("li[data-nr]");
  if (!zeile) return;
  const i = Number(zeile.dataset.nr);
  const knopf = e.target.closest("button[data-tu]");

  if (knopf) {
    const fs = zustand.folien;
    const j = knopf.dataset.tu === "hoch" ? i - 1 : i + 1;
    if (j < 0 || j >= fs.length) return;
    [fs[i], fs[j]] = [fs[j], fs[i]];
    zustand.gewaehlt = j;
  } else {
    zustand.gewaehlt = i;
  }
  allesZeichnen(); sichern();
});

/* ------------------------------------------------------------
   Die Eingabemaske

   Sie baut sich aus VORTRAG.bausteine[…].felder – deshalb ist eine
   neue Folienart ein Eintrag in daten.js und keine neue Maske.
   ------------------------------------------------------------ */

function feldHTML(feld, wert, pfad) {
  const id = "f-" + pfad.replace(/[^\w]/g, "-");
  const hinweis = feld.hinweis
    ? `<p class="hinweis klein">${entschaerfen(feld.hinweis)}</p>` : "";
  const platz = feld.platzhalter ? ` placeholder="${entschaerfen(feld.platzhalter)}"` : "";
  const schmal = feld.breite === "schmal" ? " schmal" : "";

  if (feld.art === "schalter")
    return `<div class="feld"><label class="haken" style="text-transform:none;
              letter-spacing:0;font-size:13px;font-weight:600;color:var(--ink)">
              <input type="checkbox" data-pfad="${pfad}"${wert ? " checked" : ""}>
              ${entschaerfen(feld.name)}</label>${hinweis}</div>`;

  if (feld.art === "wahl") {
    const werte = feld.werte || VORTRAG.kartenfarben;
    return `<div class="feld${schmal}">
      <label for="${id}">${entschaerfen(feld.name)}</label>
      <select id="${id}" data-pfad="${pfad}">${werte.map(w =>
        `<option value="${entschaerfen(w.id)}"${String(wert) === w.id ? " selected" : ""}>${
          entschaerfen(w.name)}</option>`).join("")}</select>${hinweis}</div>`;
  }

  if (feld.art === "bild") {
    const m = (zustand.medien || {})[wert];
    return `<div class="feld bildfeld" data-pfad="${pfad}">
      <label>${entschaerfen(feld.name)}</label>
      <div class="bildwahl">
        <div class="bildschau">${m && m.daten
          ? `<img src="${m.daten}" alt="">`
          : `<span>noch kein Bild</span>`}</div>
        <div class="bildknoepfe">
          <button data-tu="bild-waehlen">${m ? "Anderes Bild" : "Bild wählen"}</button>
          ${m ? `<button data-tu="bild-weg" class="werkzeug-warn">Wegnehmen</button>` : ""}
          <p class="hinweis klein">${m
            ? entschaerfen(m.name || "") + " &middot; " + kilobyte(m.daten)
            : "JPG, PNG oder SVG. Große Bilder werden beim Einfügen " +
              "verkleinert &ndash; sonst passen wenige in den Speicher."}</p>
        </div>
      </div>${hinweis}</div>`;
  }

  if (feld.art === "absatz" || feld.art === "zeilen")
    return `<div class="feld">
      <label for="${id}">${entschaerfen(feld.name)}</label>
      <textarea id="${id}" data-pfad="${pfad}" rows="${feld.zeilen || 3}"
        class="${feld.schrift === "fest" ? "fest" : ""}"${platz}>${entschaerfen(wert)}</textarea>
      ${hinweis}</div>`;

  return `<div class="feld${schmal}">
    <label for="${id}">${entschaerfen(feld.name)}</label>
    <input type="text" id="${id}" data-pfad="${pfad}"
           value="${entschaerfen(wert)}"${platz}>${hinweis}</div>`;
}

/* Eine Kartenreihe: jede Karte ein Kasten zum Auf- und Zuklappen.
   Offen wäre bei sechs Karten nichts mehr zu finden.           */
function kartenHTML(reihe, schluessel) {
  const karten = reihe || [];
  const kaesten = karten.map((k, i) => {
    const farbe = k.farbe || "weiss";
    const auf = offeneKarte === schluessel + ":" + i ? " auf" : "";
    const titel = k.kopf || k.text || k.punkte || "";
    return `<div class="kartenkasten${auf}" data-karte="${i}" data-liste="${schluessel}">
      <div class="kartenkopf" data-tu="klappen">
        <span class="pfeil">&#9654;</span>
        <span class="punkt ${farbe}"></span>
        <span class="titel">${entschaerfen(String(titel).split("\n")[0]) ||
                             "<em style='color:var(--muted)'>leere Karte</em>"}</span>
        <span class="griffe">
          <button data-tu="hoch"   title="nach oben">&#9650;</button>
          <button data-tu="runter" title="nach unten">&#9660;</button>
          <button data-tu="weg" class="weg" title="Karte wegnehmen">&times;</button>
        </span>
      </div>
      <div class="kartenfelder">${VORTRAG.kartenfelder.map(feld =>
        feldHTML(feld, k[feld.schluessel], schluessel + "." + i + "." + feld.schluessel)
      ).join("")}</div>
    </div>`;
  }).join("");

  return `<div class="kartenliste" data-liste="${schluessel}">${kaesten}</div>
    <button class="werkzeug-haupt" data-tu="karte-neu" data-liste="${schluessel}">
      + Karte</button>`;
}

/* Welche Karte gerade aufgeklappt ist. Steht außerhalb des
   Zustands: es ist eine Ansichtssache und gehört nicht in die
   gesicherte Datei.                                          */
let offeneKarte = null;

function editorBauen() {
  const kasten = $("#folien-editor");
  const f = gewaehlteFolie();

  if (!f) {
    kasten.innerHTML = `<h2>Noch keine Folie</h2>
      <p class="hinweis">Links auf <b>+ Folie</b> tippen und eine Art auswählen.</p>`;
    return;
  }

  const art = VORTRAG.bausteine.find(b => b.id === f.baustein);
  if (!art) {
    kasten.innerHTML = `<h2>Unbekannte Folienart</h2>
      <p class="hinweis">Diese Folie hat die Art „${entschaerfen(f.baustein)}“,
      die es hier nicht gibt. Vermutlich stammt die Datei aus einer
      neueren Fassung der Werkstatt.</p>`;
    return;
  }

  kasten.innerHTML =
    `<div class="editorkopf">
      <h2>Folie ${zustand.gewaehlt + 1}</h2>
      <span class="art">${entschaerfen(art.name)}</span>
      <span style="flex:1"></span>
      <div class="werkzeuge">
        <button data-tu="folie-kopie">Verdoppeln</button>
        <button data-tu="folie-weg" class="werkzeug-warn">Folie wegnehmen</button>
      </div>
    </div>
    <p class="hinweis">${entschaerfen(art.was)}</p>` +
    art.felder.map(feld => feld.art === "karten"
      ? `<div class="feld"><label>${entschaerfen(feld.name)}</label>
           ${kartenHTML(f[feld.schluessel], feld.schluessel)}</div>`
      : feldHTML(feld, f[feld.schluessel], feld.schluessel)).join("");
}

/* ---- Einen Wert an seinen Platz schreiben -------------------
   Der Pfad ist entweder "titel" oder "karten.2.kopf". Mehr
   Verschachtelung gibt es nicht und soll es nicht geben.     */
function wertSetzen(pfad, wert) {
  const f = gewaehlteFolie();
  if (!f) return;
  const teile = pfad.split(".");
  if (teile.length === 1) { f[teile[0]] = wert; return; }
  const reihe = f[teile[0]] || (f[teile[0]] = []);
  const karte = reihe[Number(teile[1])] || (reihe[Number(teile[1])] = {});
  karte[teile[2]] = wert;
}

/* Tippen: Vorschau und Folienname nachziehen, aber die Maske NICHT
   neu bauen – sonst spränge der Schreibcursor weg.           */
$("#folien-editor").addEventListener("input", e => {
  const el = e.target.closest("[data-pfad]");
  if (!el) return;
  wertSetzen(el.dataset.pfad, el.type === "checkbox" ? el.checked : el.value);
  vorschauZeichnen();
  folienlisteZeichnen();
  kartentitelNachziehen(el);
  sichern();
});

$("#folien-editor").addEventListener("change", e => {
  const el = e.target.closest("[data-pfad]");
  if (!el || (el.tagName !== "SELECT" && el.type !== "checkbox")) return;
  wertSetzen(el.dataset.pfad, el.type === "checkbox" ? el.checked : el.value);
  vorschauZeichnen(); folienlisteZeichnen();
  /* Die Farbe steht auch im zugeklappten Kartenkopf. */
  if (el.dataset.pfad.endsWith(".farbe")) editorBauen();
  sichern();
});

/* Die Überschrift im zugeklappten Kartenkopf soll mitlaufen. */
function kartentitelNachziehen(el) {
  const kasten = el.closest(".kartenkasten");
  if (!kasten) return;
  const pfad = el.dataset.pfad || "";
  if (!/\.(kopf|text|punkte)$/.test(pfad)) return;
  const titel = $(".kartenkopf .titel", kasten);
  const erste = String(el.value).split("\n")[0].trim();
  const kopffeld = $('[data-pfad$=".kopf"]', kasten);
  if (pfad.endsWith(".kopf") || !kopffeld || !kopffeld.value.trim())
    titel.textContent = erste || "leere Karte";
}

$("#folien-editor").addEventListener("click", e => {
  const knopf = e.target.closest("[data-tu]");
  if (!knopf) return;
  const tu = knopf.dataset.tu;
  const f = gewaehlteFolie();

  if (tu === "folie-weg") {
    if (!confirm("Diese Folie wirklich wegnehmen?")) return;
    zustand.folien.splice(zustand.gewaehlt, 1);
    zustand.gewaehlt = Math.max(0, zustand.gewaehlt - 1);
    allesZeichnen(); sichern(); return;
  }
  if (tu === "bild-waehlen") {
    bildZiel = knopf.closest("[data-pfad]").dataset.pfad;
    $("#bild-datei").click();
    return;
  }
  if (tu === "bild-weg") {
    wertSetzen(knopf.closest("[data-pfad]").dataset.pfad, "");
    medienAufraeumen();
    editorBauen(); vorschauZeichnen(); sichern();
    return;
  }
  if (tu === "folie-kopie") {
    zustand.folien.splice(zustand.gewaehlt + 1, 0, tief(f));
    zustand.gewaehlt++;
    allesZeichnen(); sichern(); return;
  }

  const traeger = knopf.closest("[data-liste]");
  const liste = knopf.dataset.liste || (traeger && traeger.dataset.liste);
  if (!liste) return;

  if (tu === "karte-neu") {
    const reihe = f[liste] || (f[liste] = []);
    reihe.push({ farbe: "weiss" });
    offeneKarte = liste + ":" + (reihe.length - 1);
    editorBauen(); vorschauZeichnen(); sichern(); return;
  }

  const kasten = knopf.closest(".kartenkasten");
  if (!kasten) return;
  const i = Number(kasten.dataset.karte);
  const reihe = f[liste] || [];

  if (tu === "klappen") {
    const schluessel = liste + ":" + i;
    offeneKarte = offeneKarte === schluessel ? null : schluessel;
    editorBauen(); return;
  }
  if (tu === "weg") {
    reihe.splice(i, 1);
    offeneKarte = null;
  }
  if (tu === "hoch" && i > 0)                { [reihe[i-1], reihe[i]] = [reihe[i], reihe[i-1]]; offeneKarte = liste + ":" + (i-1); }
  if (tu === "runter" && i < reihe.length-1) { [reihe[i+1], reihe[i]] = [reihe[i], reihe[i+1]]; offeneKarte = liste + ":" + (i+1); }
  editorBauen(); vorschauZeichnen(); folienlisteZeichnen(); sichern();
});

/* ------------------------------------------------------------
   Bilder

   Ein eingefügtes Bild wird verkleinert und wandert als Text in
   den Stand – die gesicherte Datei und der HTML-Export bringen es
   damit mit, ohne dass irgendwo eine Bilddatei danebenliegen muss.
   Die Größenvorgaben stehen in daten.js unter "bilder".

   Die Kennungen sind fortlaufend und nicht der Dateiname: zweimal
   "foto.jpg" aus verschiedenen Ordnern wären sonst dasselbe Bild.
   ------------------------------------------------------------ */
function kilobyte(text) {
  /* Ein Daten-URI trägt rund ein Drittel Verpackung mit. */
  return Math.round(String(text || "").length * 0.73 / 1024) + " KB";
}

let bildZaehler = 0;
function neueBildKennung() {
  bildZaehler++;
  return "b" + Date.now().toString(36) + bildZaehler.toString(36);
}

/* Verkleinern über eine Zeichenfläche.

   Der weiße Grund ist Pflicht: JPEG kennt keine Durchsichtigkeit,
   und ohne ihn würde aus einem durchsichtigen Hintergrund
   SCHWARZ. Ein Logo auf der Folie wäre dann ein schwarzer Kasten. */
function bildEinlesen(datei, dann) {
  const v = VORTRAG.bilder;

  /* Eine Zeichnung bleibt eine Zeichnung. */
  if (datei.type === "image/svg+xml") return alsText(datei, dann);

  /* Ein kleines PNG bleibt unangetastet – wegen der Durchsicht. */
  if (datei.type === "image/png" && datei.size <= v.pngUnberuehrtBis)
    return alsText(datei, dann);

  const bild = new Image();
  const url = URL.createObjectURL(datei);
  bild.onload = function () {
    const s = Math.min(1, v.hoechstensPunkte / Math.max(bild.width, bild.height));
    const tafel = document.createElement("canvas");
    tafel.width  = Math.max(1, Math.round(bild.width  * s));
    tafel.height = Math.max(1, Math.round(bild.height * s));
    const stift = tafel.getContext("2d");
    stift.fillStyle = "#fff";
    stift.fillRect(0, 0, tafel.width, tafel.height);
    stift.drawImage(bild, 0, 0, tafel.width, tafel.height);
    URL.revokeObjectURL(url);
    dann(tafel.toDataURL("image/jpeg", v.guete));
  };
  bild.onerror = function () {
    URL.revokeObjectURL(url);
    meldung("schlecht", "Das ging nicht",
      "Diese Datei konnte nicht als Bild gelesen werden. Bitte JPG, " +
      "PNG oder SVG nehmen.");
  };
  bild.src = url;
}

function alsText(datei, dann) {
  const leser = new FileReader();
  leser.onload = () => dann(leser.result);
  leser.readAsDataURL(datei);
}

/* Bilder, auf die keine Folie mehr zeigt, fliegen hinaus. Ohne das
   bliebe jedes einmal eingefügte Bild für immer im Speicher – und
   der ist beim Doppelklick von der Festplatte knapp.            */
function medienAufraeumen() {
  const benutzt = new Set();
  zustand.folien.forEach(f => VORTRAG.bausteine.forEach(b => {
    if (b.id !== f.baustein) return;
    b.felder.forEach(feld => { if (feld.art === "bild" && f[feld.schluessel])
      benutzt.add(f[feld.schluessel]); });
  }));
  Object.keys(zustand.medien || {}).forEach(k => {
    if (!benutzt.has(k)) delete zustand.medien[k];
  });
}

/* Der Dateiwähler liegt einmal im Dokument und merkt sich, für
   welches Feld er gerade offen ist.                            */
let bildZiel = null;
$("#bild-datei").addEventListener("change", e => {
  const datei = e.target.files[0];
  e.target.value = "";
  if (!datei || !bildZiel) return;

  bildEinlesen(datei, daten => {
    const kennung = neueBildKennung();
    zustand.medien = zustand.medien || {};
    zustand.medien[kennung] = { art:"bild", name: datei.name, daten: daten };
    wertSetzen(bildZiel, kennung);
    medienAufraeumen();
    editorBauen(); vorschauZeichnen(); folienlisteZeichnen(); sichern();
    bildPlatzWarnen();
  });
});

/* Beim Doppelklick von der Festplatte hat der Browser nur wenige
   Megabyte. Das muss gesagt werden, BEVOR die Arbeit verloren
   geht – und zwar einmal, nicht bei jedem Bild.               */
let bildWarnungGezeigt = false;
function bildPlatzWarnen() {
  if (bildWarnungGezeigt || !SPEICHER.platzKnapp) return;
  bildWarnungGezeigt = true;
  meldung("hinweis", "Bilder brauchen Platz",
    "Diese Seite liegt auf deiner Festplatte, und von dort kann der " +
    "Browser nur etwa fünf Megabyte behalten – für ungefähr zwanzig " +
    "Bilder. Bitte zwischendurch <b>Sichern</b> benutzen; die Datei " +
    "hat diese Grenze nicht. (Über die Schulseite im Netz gibt es " +
    "sie ebenfalls nicht.)");
}

/* ------------------------------------------------------------
   Die Auswahl der Folienart
   ------------------------------------------------------------ */
function galerieZeigen() {
  $("#galerierost").innerHTML = VORTRAG.bausteine.map(b =>
    `<button class="galeriekachel" data-art="${entschaerfen(b.id)}">
      ${b.skizze}
      <span class="name">${entschaerfen(b.name)}</span>
      <span class="was">${entschaerfen(b.was)}</span>
    </button>`).join("");
  $("#galerie").hidden = false;
}

$("#btn-folie-neu").addEventListener("click", galerieZeigen);
$("#galerie-zu").addEventListener("click", () => { $("#galerie").hidden = true; });
$("#galerie").addEventListener("click", e => {
  if (e.target === $("#galerie")) { $("#galerie").hidden = true; return; }
  const kachel = e.target.closest("[data-art]");
  if (!kachel) return;

  const art = VORTRAG.bausteine.find(b => b.id === kachel.dataset.art);
  const neu = { baustein: art.id };
  /* Eine Kartenfolie ohne Karten sieht aus wie ein Fehler –
     also gleich zwei leere hinlegen.                        */
  art.felder.forEach(feld => {
    if (feld.art === "karten") neu[feld.schluessel] = [{ farbe:"weiss" }, { farbe:"weiss" }];
    if (feld.schluessel === "spalten") neu.spalten = "3";
  });

  zustand.folien.splice(zustand.gewaehlt + 1, 0, neu);
  zustand.gewaehlt = Math.min(zustand.gewaehlt + 1, zustand.folien.length - 1);
  offeneKarte = null;
  $("#galerie").hidden = true;
  schrittSetzen("folien");
  sichern();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !$("#galerie").hidden) $("#galerie").hidden = true;
});

/* ------------------------------------------------------------
   Die fertige Präsentation als eine Datei

   Das ist zugleich das, was beim Vorführen im neuen Fenster
   läuft. Dadurch gibt es nur EINEN Weg statt zweier, die
   auseinanderlaufen könnten – was die Lehrkraft am Beamer sieht,
   ist zeichengenau die Datei, die sie weitergibt.
   ------------------------------------------------------------ */
function alsEineDatei() {
  const rahmen = rahmenDaten();
  const folien = zustand.folien
    .map((f, i) => BAUSTEIN.folie(f, rahmen, i + 1, zustand.folien.length))
    .join("\n");

  const titel = zustand.rahmen.titel || zustand.rahmen.kurs || "Präsentation";

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${entschaerfen(titel)}</title>
<!-- Gebaut mit der Folienwerkstatt der MSL.
     Diese Datei läuft überall per Doppelklick: sie braucht kein
     Internet, kein Programm und nichts daneben.
     Weiter: Pfeiltaste, Leertaste oder Klick.
     F = Vollbild, O = Übersicht, Esc = zurück.                -->
<style>
${FOLIEN_CSS}
${VORFUEHREN.CSS}
</style>
</head>
<body>
<div id="buehne">
${folien}
</div>
<script>
${VORFUEHREN.quelltext()}
<\/script>
</body>
</html>`;
}

function herunterladen(name, inhalt, typ) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([inhalt], { type: typ }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* Jede ausgegebene Datei fängt mit "Vortrag_" an, Vorlagen mit
   "Vortragsvorlage_". Das ist nicht Zierrat: so erkennt man sie im
   Download-Ordner wieder – und die .gitignore des Werkzeugkastens
   kann sie an EINEM Muster fangen. Sonst hieße eine Datei einfach
   "Kickoff.html" und landete womöglich im Repository.          */
function dateiname(endung, was, vorne) {
  const roh = (was || zustand.rahmen.titel || zustand.rahmen.kurs || "Praesentation");
  return (vorne || "Vortrag_") +
         roh.replace(/[^\wÄÖÜäöüß -]+/g, "").replace(/\s+/g, "_") + endung;
}

$("#btn-html").addEventListener("click", () => {
  if (!zustand.folien.length) { meldung("schlecht", "Nichts zu sichern",
    "Es gibt noch keine Folie."); return; }
  herunterladen(dateiname(".html"), alsEineDatei(), "text/html");
  meldung("gut", "Gesichert",
    "Die Datei liegt in deinem Download-Ordner. Sie läuft per Doppelklick, " +
    "auch auf einem fremden Rechner ohne Internet.");
});

/* Vorführen: dieselbe Datei, nur gleich geöffnet statt abgelegt. */
$("#btn-vorfuehren").addEventListener("click", () => {
  if (!zustand.folien.length) { meldung("schlecht", "Nichts vorzuführen",
    "Es gibt noch keine Folie."); return; }

  const url = URL.createObjectURL(new Blob([alsEineDatei()], { type: "text/html" }));
  const fenster = window.open(url, "_blank");

  /* Manche Browser halten das für ein aufgedrängtes Fenster. Das
     muss gesagt werden – sonst passiert scheinbar gar nichts.  */
  if (!fenster) {
    meldung("schlecht", "Das Fenster wurde blockiert",
      "Dein Browser hat das neue Fenster verhindert. Erlaube Fenster für " +
      "diese Seite – oder nimm <b>Als HTML sichern</b> und öffne die Datei " +
      "mit einem Doppelklick.");
    return;
  }
  meldung("gut", "Läuft im neuen Fenster",
    "Weiter mit Pfeiltaste, Leertaste oder Klick. <b>F</b> für Vollbild, " +
    "<b>O</b> für die Übersicht.");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
});

/* ------------------------------------------------------------
   Drucken

   Eine Folie ist 16:9 und das Papier nicht. Deshalb wird sie
   zentriert hineingerechnet – auf A4 quer bleibt oben und unten
   ein weißer Streifen, auf „16:9 randlos" keiner.
   ------------------------------------------------------------ */
$("#btn-drucken").addEventListener("click", () => {
  if (!zustand.folien.length) { meldung("schlecht", "Nichts zu drucken",
    "Es gibt noch keine Folie."); return; }
  const f = VORTRAG.formate[zustand.format] || VORTRAG.formate.a4quer;
  $("#druck").innerHTML = zustand.folien
    .map((_, i) => inRahmen(folieHTML(i), f.breite, f.hoehe, "mm"))
    .join("\n");
  window.print();
});

function formatSetzen() {
  $("#seitenformat").textContent = folienSeitenCSS(zustand.format);
}

/* ------------------------------------------------------------
   Sichern und Öffnen als Datei
   ------------------------------------------------------------ */
$("#btn-sichern").addEventListener("click", () => {
  herunterladen(dateiname(".json"), JSON.stringify(zustand, null, 2), "application/json");
});

$("#btn-oeffnen").addEventListener("click", () => $("#datei").click());
$("#datei").addEventListener("change", e => {
  const datei = e.target.files[0];
  if (datei) einlesen(datei, geladen => {
    zustand = Object.assign(standardZustand(), geladen);
    zustand.gewaehlt = 0;
    offeneKarte = null;
    felderFuellen();
    schrittSetzen(zustand.schritt || "folien");
    sichern();
    meldung("gut", "Geladen", "Die Präsentation steht wieder da.");
  });
  e.target.value = "";
});

function einlesen(datei, dann) {
  const leser = new FileReader();
  leser.onload = () => {
    try {
      const roh = JSON.parse(leser.result);
      if (!roh || !Array.isArray(roh.folien)) throw new Error("keine Präsentation");
      dann(roh);
    } catch (err) {
      alert("Diese Datei enthält keine Präsentation aus der Folienwerkstatt.");
    }
  };
  leser.readAsText(datei);
}

/* ------------------------------------------------------------
   Vorlagen

   Eine Vorlage ist eine Präsentation ohne den Arbeitsstand –
   Rahmen und Folien, sonst nichts. Sie liegt in diesem Browser;
   zum Weitergeben gibt es sie auch als Datei.
   ------------------------------------------------------------ */
/* Die Bilder kommen MIT in die Vorlage.

   Die Versuchung wäre, sie wegzulassen – eine Vorlage ist ja ein
   Gerüst, und ohne Bilder bleibt sie klein. Aber dann hätte eine
   Lehrkraft eine Vorlage abgelegt, sie später benutzt und fände
   dort graue Flächen statt ihrer Bilder: still verschwunden, ohne
   dass irgendwo etwas davon stand. Das ist die schlimmste Art von
   Fehler. Wer eine Vorlage per Mail verschickt, entscheidet selbst,
   ob sie ihm zu groß ist.                                       */
function alsVorlage(name) {
  const folien = tief(zustand.folien);
  const medien = {};
  folien.forEach(f => VORTRAG.bausteine.forEach(b => {
    if (b.id !== f.baustein) return;
    b.felder.forEach(feld => {
      const k = feld.art === "bild" && f[feld.schluessel];
      if (k && zustand.medien[k]) medien[k] = zustand.medien[k];
    });
  }));

  return {
    name: name,
    wann: new Date().toISOString().slice(0, 10),
    rahmen: tief(zustand.rahmen),
    folien: folien,
    medien: medien,
    version: VORTRAG.version
  };
}

function vorlagenSichern() {
  return SPEICHER.schreiben("vorlagen", vorlagen).then(speicherPruefen);
}

function vorlagenZeichnen() {
  const kasten = $("#vorlagenliste");
  if (!vorlagen.length) {
    kasten.innerHTML = `<div class="leer">Noch keine Vorlage abgelegt.</div>`;
    return;
  }
  kasten.innerHTML = vorlagen.map((v, i) => `<div class="vorlage">
    <span class="name">${entschaerfen(v.name)}</span>
    <span class="wann">${entschaerfen(v.wann)} &middot; ${v.folien.length} Folien${
      Object.keys(v.medien || {}).length
        ? " &middot; " + Object.keys(v.medien).length + " Bilder" : ""}</span>
    <button data-tu="nehmen" data-nr="${i}">Benutzen</button>
    <button data-tu="datei"  data-nr="${i}" title="Als Datei sichern">&#8615;</button>
    <button data-tu="weg" data-nr="${i}" class="werkzeug-warn" title="Vorlage löschen">&times;</button>
  </div>`).join("");
}

$("#vorlagenliste").addEventListener("click", e => {
  const knopf = e.target.closest("[data-tu]");
  if (!knopf) return;
  const i = Number(knopf.dataset.nr), v = vorlagen[i];
  if (!v) return;

  if (knopf.dataset.tu === "weg") {
    if (!confirm(`Die Vorlage „${v.name}“ wirklich löschen?`)) return;
    vorlagen.splice(i, 1);
    vorlagenZeichnen(); vorlagenSichern(); return;
  }
  if (knopf.dataset.tu === "datei") {
    herunterladen(dateiname(".json", v.name, "Vortragsvorlage_"),
      JSON.stringify(v, null, 2), "application/json");
    return;
  }
  /* Benutzen heißt: die aktuelle Arbeit wird ersetzt. Das ist der
     Punkt, an dem etwas verloren gehen kann – also fragen.     */
  if (zustand.folien.length &&
      !confirm(`Die Vorlage „${v.name}“ übernehmen? Die Folien, an denen ` +
               `du gerade arbeitest, werden dabei ersetzt.`)) return;
  zustand.rahmen = tief(v.rahmen);
  zustand.folien = tief(v.folien);
  /* Die Bilder der Vorlage dazulegen, ohne die vorhandenen zu
     verlieren – aufgeräumt wird gleich danach.               */
  zustand.medien = Object.assign(zustand.medien || {}, tief(v.medien || {}));
  zustand.gewaehlt = 0;
  medienAufraeumen();
  offeneKarte = null;
  felderFuellen(); schrittSetzen("folien"); sichern();
});

$("#btn-vorlage-merken").addEventListener("click", () => {
  if (!zustand.folien.length) { meldung("schlecht", "Nichts zu merken",
    "Es gibt noch keine Folie."); return; }
  const vorschlag = zustand.rahmen.titel || zustand.rahmen.kurs || "Meine Vorlage";
  const name = prompt("Wie soll die Vorlage heißen?", vorschlag);
  if (!name) return;

  const schon = vorlagen.findIndex(v => v.name === name);
  if (schon >= 0) {
    if (!confirm(`Es gibt schon eine Vorlage „${name}“. Überschreiben?`)) return;
    vorlagen[schon] = alsVorlage(name);
  } else {
    vorlagen.push(alsVorlage(name));
  }
  vorlagenZeichnen(); vorlagenSichern();
  meldung("gut", "Abgelegt",
    `„${entschaerfen(name)}“ steht jetzt in deiner Vorlagenliste.`);
});

$("#btn-vorlage-datei").addEventListener("click", () => {
  if (!zustand.folien.length) return;
  const name = zustand.rahmen.titel || zustand.rahmen.kurs || "Vorlage";
  herunterladen(dateiname(".json", name, "Vortragsvorlage_"),
    JSON.stringify(alsVorlage(name), null, 2), "application/json");
  meldung("gut", "Als Datei gesichert",
    "Diese Datei kannst du weitergeben – eine Kollegin liest sie hier " +
    "mit <b>Vorlage einlesen</b> wieder ein.");
});

$("#btn-vorlage-laden").addEventListener("click", () => $("#vorlage-datei").click());
$("#vorlage-datei").addEventListener("change", e => {
  const datei = e.target.files[0];
  if (datei) einlesen(datei, roh => {
    const v = {
      name: roh.name || roh.rahmen?.titel || "Eingelesene Vorlage",
      wann: roh.wann || new Date().toISOString().slice(0, 10),
      rahmen: roh.rahmen || tief(VORTRAG.standardVortrag.rahmen),
      folien: roh.folien,
      medien: roh.medien || {},
      version: roh.version || VORTRAG.version
    };
    vorlagen.push(v);
    vorlagenZeichnen(); vorlagenSichern();
    meldung("gut", "Vorlage eingelesen",
      `„${entschaerfen(v.name)}“ steht jetzt in der Liste. ` +
      `Mit <b>Benutzen</b> fängst du damit an.`);
  });
  e.target.value = "";
});

/* ------------------------------------------------------------
   Die drei Schritte
   ------------------------------------------------------------ */
function schrittSetzen(s) {
  zustand.schritt = s;
  $("#werkstatt").dataset.schritt = s;
  $$("#schritte button").forEach(b => b.classList.toggle("an", b.dataset.schritt === s));
  $$("[data-fuer]").forEach(el => { el.hidden = el.dataset.fuer !== s; });
  allesZeichnen(); sichern();
}

$$("#schritte button").forEach(b =>
  b.addEventListener("click", () => schrittSetzen(b.dataset.schritt)));

function allesZeichnen() {
  folienlisteZeichnen();
  editorBauen();
  vorschauZeichnen();
}

/* ------------------------------------------------------------
   Anlauf
   ------------------------------------------------------------ */
function felderFuellen() {
  $("#r-kurs").value      = zustand.rahmen.kurs || "";
  $("#r-titel").value     = zustand.rahmen.titel || "";
  $("#r-schuljahr").value = zustand.rahmen.schuljahr || "";
  $("#r-lehrkraft").value = zustand.rahmen.lehrkraft || "";
  $("#format").value      = zustand.format;
  formatSetzen();
  allesZeichnen();
}

function anlauf() {
  $("#marke-logo").src = VORTRAG.logo;
  $("#folienstil").textContent = FOLIEN_CSS;

  $("#format").innerHTML = Object.keys(VORTRAG.formate)
    .map(k => `<option value="${k}">${entschaerfen(VORTRAG.formate[k].name)}</option>`)
    .join("");

  /* Ein Platz für Meldungen, oben in der Arbeitsfläche. */
  $(".arbeit").insertAdjacentHTML("afterbegin", '<div id="meldungen"></div>');

  ["kurs", "titel", "schuljahr", "lehrkraft"].forEach(feld =>
    $("#r-" + feld).addEventListener("input", e => {
      zustand.rahmen[feld] = e.target.value;
      vorschauZeichnen(); sichern();
    }));

  $("#format").addEventListener("change", e => {
    zustand.format = e.target.value;
    formatSetzen(); sichern();
  });

  $("#btn-ganz-neu").addEventListener("click", () => {
    if (!confirm("Alles verwerfen und mit einer leeren Präsentation anfangen?\n\n" +
                 "Was du behalten möchtest, vorher mit „Sichern“ ablegen.")) return;
    zustand = standardZustand();
    zustand.folien = [];
    offeneKarte = null;
    felderFuellen(); schrittSetzen("rahmen"); sichern();
  });

  /* Der Maßstab der Vorschau hängt an der Fensterbreite. */
  let wartet;
  window.addEventListener("resize", () => {
    clearTimeout(wartet);
    wartet = setTimeout(vorschauZeichnen, 120);
  });

  /* SOFORT zeichnen, und zwar mit dem Standardgerüst.

     Der Stand kommt erst danach – der Speicher kann sich Zeit
     lassen (siehe speicher.js: beim Doppelklick von der Festplatte
     antwortet IndexedDB gar nicht, dort greift eine Zeitgrenze).
     Würde hier auf ihn gewartet, bliebe die Werkstatt so lange
     leer, und im schlimmsten Fall für immer.                   */
  vorlagenZeichnen();
  felderFuellen();
  schrittSetzen(zustand.schritt || "rahmen");

  SPEICHER.lesen("aktuell").then(alt => {
    if (alt && Array.isArray(alt.folien)) {
      zustand = Object.assign(standardZustand(), alt);
      felderFuellen();
      schrittSetzen(zustand.schritt || "rahmen");
    }
    return SPEICHER.lesen("vorlagen");
  }).then(v => {
    if (Array.isArray(v)) vorlagen = v;
    vorlagenZeichnen();
    /* Ab jetzt darf geschrieben werden: der alte Stand ist da. */
    anlaufLaeuft = false;
    if (SPEICHER.klemmt) speicherPruefen();
  });
}

anlauf();
