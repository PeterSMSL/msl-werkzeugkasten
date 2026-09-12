/* ============================================================
   APP.JS  –  die Bedienung der Präsentationswerkstatt.

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
  const v = tief(VORTRAG.leererVortrag);
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
    anlass: zustand.rahmen.anlass || "",
    datum: zustand.rahmen.datum || "",
    lehrkraft: zustand.rahmen.lehrkraft || "",
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

/* Im Schritt „Anlass & Rahmen" gibt es noch gar keine Folie, die man
   zeigen könnte – und genau dort will man sehen, was die Eingaben
   bewirken. Also wird eine MUSTERFOLIE gebaut: eine gewöhnliche
   Folie, gefüllt mit den echten Angaben aus den Feldern daneben.
   Sie ist nicht Teil der Präsentation und wird nie gespeichert.  */
function musterFolie() {
  return {
    baustein: "text",
    augenbraue: "Musterfolie",
    /* Bewusst NICHT rahmen.titel: daneben steht, dass der Name der
       Präsentation auf keiner Folie erscheint – dann darf er hier
       auch nicht als Überschrift stehen.                        */
    titel: "So sieht jede deiner Folien aus",
    einleitung:
      "Diese Folie gibt es nur hier in der Vorschau. Sie zeigt, was " +
      "auf *jeder* deiner Folien steht.",
    punkte:
      "Oben rechts in der blauen Leiste: der *Anlass*\n" +
      "Unten links: derselbe Anlass noch einmal\n" +
      "Unten in der Mitte: *wer* sie hält und *wann*\n" +
      "Unten rechts: die Nummer der Folie",
    farbe: "blau"
  };
}

function vorschauZeichnen() {
  const kasten = $("#schaukasten");
  const rahmenSchritt = zustand.schritt === "rahmen";
  const f = rahmenSchritt ? musterFolie() : gewaehlteFolie();

  if (!f) {
    kasten.style.height = "";
    kasten.innerHTML = `<div class="schauleer">
      <p><b>Noch keine Folie.</b></p>
      <p>Links auf <b>+ Folie</b> tippen &ndash; dort siehst du alle
         Folienarten als Skizze und suchst dir die erste aus.</p>
    </div>`;
    $("#schau-titel").textContent = "Vorschau";
    $("#schau-nr").textContent = "";
    $("#schau-fuss").textContent = "";
    return;
  }

  const breite = kasten.clientWidth || 360;
  const hoehe = Math.round(breite * 720 / 1280);
  kasten.style.height = hoehe + "px";

  const inhalt = rahmenSchritt
    ? BAUSTEIN.folie(f, rahmenDaten(), 1, 1)
    : folieHTML(zustand.gewaehlt);
  kasten.innerHTML = inRahmen(inhalt, breite, hoehe, "px");

  $("#schau-titel").textContent = rahmenSchritt ? "Musterfolie" : "Vorschau";
  $("#schau-nr").textContent = rahmenSchritt
    ? "" : (zustand.gewaehlt + 1) + " / " + zustand.folien.length;

  if (rahmenSchritt) {
    $("#schau-fuss").innerHTML =
      "Nur zur Ansicht &ndash; sie gehört nicht zur Präsentation.";
    return;
  }
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
    liste.innerHTML = `<li class="leer">
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
            : "JPG, PNG oder SVG &ndash; oder ein <b>PDF</b>, dann suchst du " +
              "dir eine Seite daraus aus. Große Bilder werden beim Einfügen " +
              "verkleinert, sonst passen wenige in den Speicher."}</p>
        </div>
      </div>${hinweis}</div>`;
  }

  if (feld.art === "video") {
    const m = (zustand.medien || {})[wert];
    const dabei = m && videoDateien[wert];
    return `<div class="feld bildfeld" data-pfad="${pfad}">
      <label>${entschaerfen(feld.name)}</label>
      <div class="bildwahl">
        <div class="bildschau dunkel">${m && m.standbild
          ? `<img src="${m.standbild}" alt="">`
          : `<span>noch kein Video</span>`}</div>
        <div class="bildknoepfe">
          <button data-tu="video-waehlen">${m ? "Anderes Video" : "Video wählen"}</button>
          ${m ? `<button data-tu="video-weg" class="werkzeug-warn">Wegnehmen</button>` : ""}
          ${m ? `<p class="hinweis klein">${entschaerfen(m.name)}
                 ${m.groesse ? "&middot; " + megabyte(m.groesse) : ""}</p>` : ""}
          <p class="hinweis klein">${m
            ? (dabei
                ? "Die Datei liegt bereit und wird beim Ausgeben mit abgelegt."
                : "<b>Die Datei liegt nicht mehr vor.</b> Bitte noch einmal " +
                  "wählen &ndash; sonst musst du sie beim Ausgeben von Hand " +
                  "in den Ordner <b>medien</b> legen.")
            : "MP4 oder WebM. Der Film bleibt eine eigene Datei und wird " +
              "beim Ausgeben danebengelegt &ndash; in der Präsentation " +
              "steckt nur ein Standbild."}</p>
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
    kasten.innerHTML = `<h2>Fang mit der ersten Folie an</h2>
      <p class="hinweis">
        Es gibt zehn Folienarten &ndash; von der Titelfolie über Karten
        und Bilder bis zum Zitat. Du siehst sie als Skizze und suchst
        dir aus, was passt. Die Reihenfolge lässt sich jederzeit ändern.
      </p>
      <p class="hinweis">
        Nichts davon ist vorbelegt: was du nicht anlegst, gibt es nicht.
      </p>
      <button class="werkzeug-haupt" data-tu="erste-folie">
        Erste Folie wählen</button>`;
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

  if (tu === "erste-folie") { galerieZeigen(); return; }

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
  if (tu === "video-waehlen") {
    videoZiel = knopf.closest("[data-pfad]").dataset.pfad;
    $("#video-datei").click();
    return;
  }
  if (tu === "video-weg") {
    wertSetzen(knopf.closest("[data-pfad]").dataset.pfad, "");
    medienAufraeumen();
    editorBauen(); vorschauZeichnen(); sichern();
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
/* Über alle Felder einer Folie laufen, die auf ein Medium zeigen –
   Bilder, PDF-Seiten und Videos.

   Diese Funktion gibt es, weil DREI Stellen dasselbe brauchen:
   das Aufräumen, das Ablegen einer Vorlage und die Liste der
   Videodateien. Beim ersten Bauen kannten zwei davon nur Bilder,
   und die Folge war heimtückisch: ein eingefügtes Video wurde im
   selben Atemzug wieder weggeräumt. Zu sehen war nur, dass es
   „nicht ging". Wer eine vierte Medienart einführt, ändert HIER
   eine Zeile – und nicht an drei Stellen zwei davon.           */
function medienFelder(folie, tuWas) {
  const art = VORTRAG.bausteine.find(b => b.id === folie.baustein);
  if (!art) return;
  art.felder.forEach(feld => {
    if (feld.art !== "bild" && feld.art !== "video") return;
    const kennung = folie[feld.schluessel];
    if (kennung) tuWas(kennung, feld.art);
  });
}

function medienAufraeumen() {
  const benutzt = new Set();
  zustand.folien.forEach(f => medienFelder(f, k => benutzt.add(k)));
  Object.keys(zustand.medien || {}).forEach(k => {
    if (!benutzt.has(k)) { delete zustand.medien[k]; delete videoDateien[k]; }
  });
}

/* ------------------------------------------------------------
   Seiten aus einem PDF

   Der Weg dahin ist kurz und die Folge weitreichend: eine gewählte
   PDF-Seite wird zu einem BILD und ist danach eines. Sie druckt,
   exportiert, reist in Vorlagen mit und braucht pdf.js nie wieder.
   Deshalb gibt es auch keine eigene Folienart „PDF" – man wählt im
   Bildfeld einfach ein PDF statt eines Fotos.
   ------------------------------------------------------------ */

/* pdf.js wiegt zusammen rund 1,4 MB. Es wird deshalb ERST GELADEN,
   wenn wirklich jemand ein PDF einfügt – wer nie eines benutzt,
   zahlt nichts dafür.                                          */
let pdfBereit = null;

function pdfLaden() {
  if (pdfBereit) return pdfBereit;

  pdfBereit = new Promise((fertig, schiefgegangen) => {
    const holen = pfad => new Promise((ja, nein) => {
      const el = document.createElement("script");
      el.src = pfad;
      el.onload = ja;
      el.onerror = () => nein(new Error(pfad));
      document.head.appendChild(el);
    });

    /* HIER STECKT DER KNIFF, und ohne ihn geht gar nichts.

       pdf.js rechnet normalerweise in einem Web Worker. Beim
       Doppelklick von der Festplatte lässt Chrome keinen Worker
       aus einer file://-Adresse starten – und pdf.js bleibt dann
       einfach stehen: getDocument() antwortet nie, weder mit
       Erfolg noch mit Fehler. Nachgeprüft: die Seite hing endlos.

       Lädt man pdf.worker.min.js dagegen VORHER als gewöhnliches
       Skript, steht window.pdfjsWorker bereit, und pdf.js rechnet
       im Hauptfaden weiter. Dann dauert eine Seite Sekunden-
       bruchteile. Also: erst der Worker, dann die Bibliothek –
       diese Reihenfolge nicht umdrehen.                        */
    holen("pdfjs/pdf.worker.min.js")
      .then(() => holen("pdfjs/pdf.min.js"))
      .then(() => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "pdfjs/pdf.worker.min.js";
        fertig(window.pdfjsLib);
      })
      .catch(schiefgegangen);
  });
  return pdfBereit;
}

/* Eine Seite auf eine Zeichenfläche bringen und als Bild zurückgeben. */
function pdfSeiteZeichnen(seite, breite, alsDatenText) {
  const roh = seite.getViewport({ scale: 1 });
  const s = breite / roh.width;
  const blick = seite.getViewport({ scale: s });

  const tafel = document.createElement("canvas");
  tafel.width = Math.round(blick.width);
  tafel.height = Math.round(blick.height);
  const stift = tafel.getContext("2d");
  /* Weißer Grund: ein PDF hat keinen, und ohne ihn würde die Seite
     als JPEG schwarz.                                            */
  stift.fillStyle = "#fff";
  stift.fillRect(0, 0, tafel.width, tafel.height);

  return seite.render({ canvasContext: stift, viewport: blick }).promise
    .then(() => alsDatenText
      ? tafel.toDataURL("image/jpeg", VORTRAG.pdfSeiten.guete)
      : tafel);
}

/* Das offene PDF und wohin die gewählte Seite gehört. */
let pdfOffen = null, pdfName = "", pdfZiel = null;

function pdfOeffnen(datei, ziel) {
  meldung("hinweis", "Einen Augenblick",
    "Das PDF wird geöffnet. Beim ersten Mal dauert es kurz länger &ndash; " +
    "die Werkstatt lädt dafür einmalig ein Hilfsprogramm nach.");

  const leser = new FileReader();
  leser.onload = () => {
    pdfLaden().then(lib =>
      lib.getDocument({ data: new Uint8Array(leser.result) }).promise
    ).then(pdf => {
      pdfOffen = pdf; pdfName = datei.name; pdfZiel = ziel;
      meldung(null);
      if (pdf.numPages === 1) return pdfSeiteNehmen(1);
      pdfAuswahlZeigen();
    }).catch(err => {
      meldung("schlecht", "Das PDF ließ sich nicht öffnen",
        "Vielleicht ist die Datei beschädigt oder mit einem Kennwort " +
        "geschützt. Ein Ausweg: die Seite im PDF-Programm als Bild " +
        "sichern und dieses Bild einfügen.");
    });
  };
  leser.readAsArrayBuffer(datei);
}

/* Die Seitenauswahl: Miniaturen, anklicken, fertig. Eine Zahl
   einzutippen wäre weniger Code und deutlich schlechter – man
   weiß meistens nicht, welche Seite man braucht, man erkennt sie. */
function pdfAuswahlZeigen() {
  const rost = $("#pdfrost");
  const anzahl = Math.min(pdfOffen.numPages, VORTRAG.pdfSeiten.hoechstensSeiten);

  $("#pdf-titel").textContent = "Welche Seite aus „" + pdfName + "“?";
  $("#pdf-notiz").textContent = pdfOffen.numPages > anzahl
    ? "Das PDF hat " + pdfOffen.numPages + " Seiten; gezeigt werden die " +
      "ersten " + anzahl + "."
    : pdfOffen.numPages + " Seiten";

  rost.innerHTML = "";
  for (let n = 1; n <= anzahl; n++) {
    const kachel = document.createElement("button");
    kachel.className = "pdfkachel";
    kachel.dataset.seite = n;
    kachel.innerHTML = `<div class="mini"></div><span class="nr">Seite ${n}</span>`;
    rost.appendChild(kachel);
  }
  $("#pdfwahl").hidden = false;

  /* Die Miniaturen nacheinander nachziehen – auf einen Schlag
     würde der Browser bei 60 Seiten sichtbar stehen bleiben.   */
  let n = 1;
  (function weiter() {
    if (!pdfOffen || n > anzahl || $("#pdfwahl").hidden) return;
    const jetzt = n++;
    pdfOffen.getPage(jetzt)
      .then(seite => pdfSeiteZeichnen(seite, VORTRAG.pdfSeiten.miniBreite, false))
      .then(tafel => {
        const ziel = $(`.pdfkachel[data-seite="${jetzt}"] .mini`, rost);
        if (ziel) { ziel.innerHTML = ""; ziel.appendChild(tafel); }
        setTimeout(weiter, 0);
      })
      .catch(() => setTimeout(weiter, 0));
  })();
}

function pdfSchliessen() {
  $("#pdfwahl").hidden = true;
  pdfOffen = null; pdfZiel = null; pdfName = "";
}

function pdfSeiteNehmen(nummer) {
  const merkeZiel = pdfZiel, merkeName = pdfName, pdf = pdfOffen;
  $("#pdfwahl").hidden = true;

  pdf.getPage(nummer)
    .then(seite => pdfSeiteZeichnen(seite, VORTRAG.pdfSeiten.breitePunkte, true))
    .then(daten => {
      const kennung = neueBildKennung();
      zustand.medien = zustand.medien || {};
      zustand.medien[kennung] = {
        art: "bild",
        name: merkeName + " · Seite " + nummer,
        daten: daten
      };
      wertSetzen(merkeZiel, kennung);
      medienAufraeumen();
      editorBauen(); vorschauZeichnen(); folienlisteZeichnen(); sichern();
      bildPlatzWarnen();
      pdfOffen = null; pdfZiel = null;
      meldung("gut", "Seite übernommen",
        "Sie ist jetzt ein ganz gewöhnliches Bild &ndash; sie druckt und " +
        "reist in der gesicherten Datei mit. Das PDF wird nicht mehr gebraucht.");
    })
    .catch(() => meldung("schlecht", "Die Seite ließ sich nicht zeichnen",
      "Bitte eine andere Seite versuchen."));
}

$("#pdf-zu").addEventListener("click", pdfSchliessen);
$("#pdfwahl").addEventListener("click", e => {
  if (e.target === $("#pdfwahl")) { pdfSchliessen(); return; }
  const kachel = e.target.closest(".pdfkachel");
  if (kachel) pdfSeiteNehmen(Number(kachel.dataset.seite));
});

/* ------------------------------------------------------------
   Videos

   Sie sind der eine Fall, der NICHT in die Präsentation wandert –
   die Begründung steht in daten.js unter "videos". In der
   Präsentation stecken der Dateiname und ein Standbild; die Datei
   selbst wird beim Ausgeben danebengelegt.
   ------------------------------------------------------------ */

/* Die gewählten Videodateien, solange die Seite offen ist. Sie
   lassen sich nicht mitspeichern: ein Dateizugriff überlebt kein
   Neuladen, und in den kleinen Speicher passt ein Film ohnehin
   nicht. Darum sagt das Feld deutlich, wenn eine Datei fehlt.   */
const videoDateien = {};

function megabyte(bytes) {
  const mb = bytes / 1024 / 1024;
  return (mb < 10 ? mb.toFixed(1) : Math.round(mb)) + " MB";
}

/* Ein Standbild aus dem Film holen. Nicht vom allerersten Bild –
   das ist oft noch schwarz –, sondern aus der Sekunde, die in
   daten.js steht. Ist der Film kürzer, eben aus der Mitte.      */
function videoStandbild(datei, dann) {
  const v = document.createElement("video");
  const url = URL.createObjectURL(datei);
  let fertig = false;

  const aufgeben = grund => {
    if (fertig) return;
    fertig = true;
    URL.revokeObjectURL(url);
    dann(null, grund);
  };

  v.preload = "metadata";
  v.muted = true;
  v.playsInline = true;

  v.onloadedmetadata = () => {
    const wunsch = VORTRAG.videos.standbildSekunde;
    v.currentTime = isFinite(v.duration) && v.duration > wunsch
      ? wunsch : (isFinite(v.duration) ? v.duration / 2 : 0);
  };

  v.onseeked = () => {
    if (fertig) return;
    fertig = true;
    const breite = Math.min(VORTRAG.videos.standbildBreite, v.videoWidth || 1280);
    const s = breite / (v.videoWidth || breite);
    const tafel = document.createElement("canvas");
    tafel.width = Math.round(breite);
    tafel.height = Math.round((v.videoHeight || 720) * s);
    const stift = tafel.getContext("2d");
    stift.fillStyle = "#000";
    stift.fillRect(0, 0, tafel.width, tafel.height);
    try { stift.drawImage(v, 0, 0, tafel.width, tafel.height); }
    catch (e) { URL.revokeObjectURL(url); return dann(null, "kein Bild"); }
    URL.revokeObjectURL(url);
    dann({
      daten: tafel.toDataURL("image/jpeg", VORTRAG.videos.guete),
      dauer: isFinite(v.duration) ? v.duration : 0
    });
  };

  v.onerror = () => aufgeben("Format");
  /* Ein Film, der sich nicht innerhalb von zehn Sekunden öffnen
     lässt, wird auch danach nichts – dann lieber ohne Standbild
     weitermachen als endlos warten.                            */
  setTimeout(() => aufgeben("zu langsam"), 10000);
  v.src = url;
}

let videoZiel = null;
$("#video-datei").addEventListener("change", e => {
  const datei = e.target.files[0];
  e.target.value = "";
  if (!datei || !videoZiel) return;

  const ziel = videoZiel;
  meldung("hinweis", "Einen Augenblick", "Das Standbild wird geholt.");

  videoStandbild(datei, (ergebnis, grund) => {
    const kennung = neueBildKennung();
    zustand.medien = zustand.medien || {};
    zustand.medien[kennung] = {
      art: "video",
      name: datei.name,
      groesse: datei.size,
      ordner: VORTRAG.videos.ordner,
      standbild: ergebnis ? ergebnis.daten : ""
    };
    videoDateien[kennung] = datei;
    wertSetzen(ziel, kennung);
    medienAufraeumen();
    editorBauen(); vorschauZeichnen(); folienlisteZeichnen(); sichern();

    if (ergebnis) {
      meldung("gut", "Video eingefügt",
        `<b>${entschaerfen(datei.name)}</b> &middot; ${megabyte(datei.size)}. ` +
        `Der Film bleibt eine eigene Datei. Beim <b>Als HTML sichern</b> ` +
        `bekommst du beides: die Präsentation und den Film &ndash; den legst ` +
        `du in einen Ordner <b>${VORTRAG.videos.ordner}</b> daneben.`);
    } else {
      meldung("schlecht", "Kein Standbild",
        `Der Browser konnte aus <b>${entschaerfen(datei.name)}</b> kein ` +
        `Standbild holen (${entschaerfen(grund || "unbekannt")}). Der Film ` +
        `ist trotzdem eingefügt, aber auf dem Ausdruck bleibt die Fläche ` +
        `leer. Meist hilft ein <b>MP4</b> statt eines anderen Formats.`);
    }
  });
});

/* Der Dateiwähler liegt einmal im Dokument und merkt sich, für
   welches Feld er gerade offen ist.                            */
let bildZiel = null;
$("#bild-datei").addEventListener("change", e => {
  const datei = e.target.files[0];
  e.target.value = "";
  if (!datei || !bildZiel) return;

  /* Ein PDF geht den Umweg über die Seitenauswahl und landet danach
     als ganz gewöhnliches Bild hier.                            */
  if (datei.type === "application/pdf" || /\.pdf$/i.test(datei.name)) {
    pdfOeffnen(datei, bildZiel);
    return;
  }

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
  if (e.key !== "Escape") return;
  if (!$("#galerie").hidden) $("#galerie").hidden = true;
  if (!$("#pdfwahl").hidden) pdfSchliessen();
});

/* ------------------------------------------------------------
   Die fertige Präsentation als eine Datei

   Gebaut wird damit auch die Vorführung – dieselbe Funktion, ein
   Weg statt zweier, die auseinanderlaufen könnten. Was am Beamer
   läuft, ist zeichengenau das, was weitergegeben wird.
   ------------------------------------------------------------ */
function alsEineDatei() {
  const rahmen = rahmenDaten();
  /* vorfuehren:true – nur hier wird aus dem Standbild ein echtes
     <video>. Vorschau und Ausdruck zeigen weiter das Standbild.  */
  const folien = zustand.folien
    .map((f, i) => BAUSTEIN.folie(f, rahmen, i + 1, zustand.folien.length,
                                  { vorfuehren: true }))
    .join("\n");

  const titel = zustand.rahmen.titel || zustand.rahmen.anlass || "Präsentation";

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${entschaerfen(titel)}</title>
<!-- Gebaut mit der Präsentationswerkstatt der MSL.
     Diese Datei läuft überall per Doppelklick: sie braucht kein
     Internet, kein Programm und nichts daneben.
     Weiter: Pfeiltaste, Leertaste oder Klick.
     F = Vollbild, O = Übersicht, Esc = zurück.                -->
<style>
${FOLIEN_CSS}
${VORFUEHREN.CSS}
${VORFUEHREN.DRUCK}
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

/* Alle Videos, auf die eine Folie zeigt – mit dem Hinweis, ob die
   Datei noch vorliegt.                                          */
function videosDerPraesentation() {
  const liste = [];
  zustand.folien.forEach(f => medienFelder(f, (k, art) => {
    if (art !== "video") return;
    const m = zustand.medien[k];
    if (m && !liste.some(x => x.kennung === k))
      liste.push({ kennung:k, name:m.name, datei:videoDateien[k] || null });
  }));
  return liste;
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
   "Elternabend.html" und landete womöglich im Repository.     */
function dateiname(endung, was, vorne) {
  const roh = (was || zustand.rahmen.titel || zustand.rahmen.anlass || "Praesentation");
  return (vorne || "Vortrag_") +
         roh.replace(/[^\wÄÖÜäöüß -]+/g, "").replace(/\s+/g, "_") + endung;
}

/* Sichern.

   OHNE Film ist es eine einzige HTML-Datei – das ist der Normalfall
   und soll so einfach bleiben, wie er ist.

   MIT Film wird ein ZIP daraus. Der Grund ist schlicht: ein Browser
   darf keine Ordner anlegen. Ohne ZIP bekäme die Lehrkraft zwei
   getrennte Downloads und müsste den Ordner „medien" selbst
   anlegen und die Datei hineinziehen – Peter beim Testen dazu:
   „so konnte ich nicht testen". Aus einem ZIP fällt die richtige
   Ablage beim Entpacken von selbst heraus.                       */
$("#btn-html").addEventListener("click", async () => {
  if (!zustand.folien.length) { meldung("schlecht", "Nichts zu sichern",
    "Es gibt noch keine Folie."); return; }

  const filme = videosDerPraesentation();

  if (!filme.length) {
    herunterladen(dateiname(".html"), alsEineDatei(), "text/html");
    meldung("gut", "Gesichert",
      "Die Datei liegt in deinem Download-Ordner. Sie läuft per Doppelklick, " +
      "auch auf einem fremden Rechner ohne Internet.");
    return;
  }

  const dabei  = filme.filter(v => v.datei);
  const fehlen = filme.filter(v => !v.datei);
  const ordner = VORTRAG.videos.ordner;
  const html   = dateiname(".html");

  meldung("hinweis", "Einen Augenblick",
    "Die Präsentation wird mit " + (dabei.length === 1 ? "dem Film" : "den Filmen") +
    " zusammengepackt. Bei großen Filmen dauert das etwas.");

  try {
    const teile = [{
      name: html,
      daten: new TextEncoder().encode(alsEineDatei())
    }];
    for (const v of dabei)
      teile.push({
        name: ordner + "/" + v.name,
        daten: new Uint8Array(await v.datei.arrayBuffer())
      });

    const paket = PACKEN.zip(teile);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(paket);
    a.download = dateiname(".zip");
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 30000);

    meldung(fehlen.length ? "schlecht" : "gut",
      fehlen.length ? "Gepackt – aber ein Film fehlt" : "Gepackt und gesichert",
      `In deinem Download-Ordner liegt <b>${entschaerfen(dateiname(".zip"))}</b>. ` +
      `Rechtsklick &rarr; <b>Alle extrahieren</b>, dann steht alles richtig ` +
      `beieinander:` +
      `<div class="baum">${entschaerfen(html)}<br>${entschaerfen(ordner)}/<br>` +
      dabei.map(v => "&nbsp;&nbsp;&nbsp;" + entschaerfen(v.name)).join("<br>") +
      `</div>` +
      `Danach die HTML-Datei doppelklicken &ndash; die Filme laufen dann mit. ` +
      `<b>Wichtig:</b> beides zusammen lassen, der Ordner gehört daneben.` +
      (fehlen.length
        ? `<br><br><b>Nicht im Paket:</b> ${fehlen.map(v => entschaerfen(v.name)).join(", ")}. ` +
          `Diese ${fehlen.length === 1 ? "Datei liegt" : "Dateien liegen"} dem ` +
          `Browser nicht mehr vor &ndash; nach einem Neuladen der Werkstatt ist ` +
          `das so. Wähle sie im Schritt <b>Folien</b> noch einmal aus, dann ` +
          `${fehlen.length === 1 ? "kommt sie" : "kommen sie"} beim nächsten Mal mit.`
        : ""));
  } catch (e) {
    meldung("schlecht", "Das Packen ging schief",
      "Vermutlich ist der Film zu groß für den Arbeitsspeicher dieses " +
      "Rechners. Ausweg: die Videofolie herausnehmen, die Präsentation " +
      "sichern und den Film getrennt weitergeben.");
  }
});

/* ------------------------------------------------------------
   Vorführen

   Findet in DIESEM Dokument statt, als Überlagerung über der
   Werkstatt – nicht in einem zweiten Fenster. Zwei Gründe:

   1. Videos liegen als Blob-Adressen vor, und die sind nur in dem
      Dokument auflösbar, das sie erzeugt hat. Im zweiten Fenster
      blieb der Film deshalb stumm („Kein Video mit unterstütztem
      Format gefunden").
   2. Ein zweites Fenster kann der Fensterblocker abfangen.

   Gebaut wird trotzdem mit BAUSTEIN.folie und FOLIEN_CSS – was hier
   läuft, ist zeichengenau das, was die gesicherte Datei zeigt.
   ------------------------------------------------------------ */
let vorfuehrungBeenden = null;
let vorfuehrAdressen = [];

function vorfuehren() {
  if (!zustand.folien.length) {
    meldung("schlecht", "Nichts vorzuführen", "Es gibt noch keine Folie.");
    return;
  }
  vorfuehrungSchliessen();

  /* Für jede Filmdatei, die noch vorliegt, eine Adresse – so laufen
     die Filme mit, ohne dass vorher etwas gesichert werden muss. */
  const quellen = {};
  videosDerPraesentation().forEach(v => {
    if (!v.datei) return;
    quellen[v.kennung] = URL.createObjectURL(v.datei);
    vorfuehrAdressen.push(quellen[v.kennung]);
  });

  /* Eine Kopie der Medien: der gespeicherte Stand darf diese
     Adressen nie bekommen, sie wären beim nächsten Öffnen tot. */
  const rahmen = rahmenDaten();
  rahmen.medien = {};
  Object.keys(zustand.medien || {}).forEach(k => {
    rahmen.medien[k] = quellen[k]
      ? Object.assign({}, zustand.medien[k], { quelle: quellen[k] })
      : zustand.medien[k];
  });

  $("#buehne").innerHTML = zustand.folien
    .map((f, i) => BAUSTEIN.folie(f, rahmen, i + 1, zustand.folien.length,
                                  { vorfuehren: true }))
    .join("\n");

  const raum = $("#buehnenraum");
  raum.hidden = false;
  raum.classList.add("ueberlagert");
  vorfuehrungBeenden = VORFUEHREN.motor(raum);

  /* Vollbild anbieten, aber nicht erzwingen: manche Browser lassen es
     nur nach einem Klick zu, und dann soll es trotzdem laufen.     */
  try {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  } catch (e) {}

  const fehlen = videosDerPraesentation().filter(v => !v.datei);
  if (fehlen.length)
    meldung("hinweis", "Ein Film fehlt",
      "Diese Filme laufen nicht mit: " +
      fehlen.map(v => entschaerfen(v.name)).join(", ") +
      " &ndash; ihre Dateien liegen dem Browser nicht mehr vor. Wähle sie " +
      "im Schritt <b>Folien</b> noch einmal aus.");
}

function vorfuehrungSchliessen() {
  if (vorfuehrungBeenden) { vorfuehrungBeenden(); vorfuehrungBeenden = null; }
  const raum = $("#buehnenraum");
  raum.hidden = true;
  raum.classList.remove("ueberlagert");
  $("#buehne").innerHTML = "";
  vorfuehrAdressen.forEach(a => URL.revokeObjectURL(a));
  vorfuehrAdressen = [];
}

$("#btn-vorfuehren").addEventListener("click", vorfuehren);
$("#btn-zeigen").addEventListener("click", vorfuehren);
$("#buehne-zu").addEventListener("click", vorfuehrungSchliessen);

/* Esc beendet. Der Motor hat die Taste auch belegt (für die
   Übersicht); deshalb erst schließen, wenn keine Übersicht offen
   ist – sonst verschwände beides auf einen Schlag.              */
document.addEventListener("keydown", e => {
  if (e.key !== "Escape" || !vorfuehrungBeenden) return;
  const ueb = $("#buehnenraum #uebersicht");
  if (ueb && ueb.classList.contains("auf")) return;
  vorfuehrungSchliessen();
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
  const f = VORTRAG.formate[zustand.format] || VORTRAG.formate.a4quer;
  const hinweis = $("#formathinweis");
  if (!hinweis) return;
  /* Eine Folie ist 16:9 und Papier ist es nicht. Was das bedeutet,
     soll VOR dem Drucken dastehen und nicht erst im Ausdruck.    */
  const rand = Math.round((f.hoehe - FOLIE_HOEHE_MM *
                 Math.min(f.breite / FOLIE_BREITE_MM, f.hoehe / FOLIE_HOEHE_MM)) / 2);
  hinweis.innerHTML = rand > 2
    ? `Eine Folie ist 16:9, dieses Papier nicht &ndash; oben und unten
       bleiben je rund <b>${rand} mm</b> weiß. Wer das nicht möchte,
       nimmt <b>16:9 randlos</b>.`
    : `Das Papier ist genauso geschnitten wie die Folie &ndash; kein
       weißer Rand.`;
}

/* ------------------------------------------------------------
   Was steckt in der Präsentation, und was kommt beim Ausgeben
   heraus?

   Beides steht im Schritt „Ausgeben" – VOR dem Klicken. Vorher
   erfuhr man erst hinterher aus einer Meldung, dass es diesmal ein
   ZIP geworden ist; Peter dazu: „rund ist das nicht".
   ------------------------------------------------------------ */
function inhaltsbildZeichnen() {
  const kasten = $("#inhaltsbild");
  if (!kasten) return;

  let bilder = 0;
  zustand.folien.forEach(f => medienFelder(f, (k, art) => {
    if (art === "bild" && zustand.medien[k]) bilder++;
  }));
  const filme = videosDerPraesentation();
  const fehlen = filme.filter(v => !v.datei);
  const n = zustand.folien.length;

  if (!n) {
    kasten.innerHTML = `<p class="hinweis">Noch keine Folie. Im Schritt
      <b>Folien</b> geht es los.</p>`;
    return;
  }

  const zahl = (wieviel, eins, viele) =>
    `<span class="zaehlkachel"><b>${wieviel}</b>${wieviel === 1 ? eins : viele}</span>`;

  kasten.innerHTML =
    zahl(n, " Folie", " Folien") +
    (bilder ? zahl(bilder, " Bild", " Bilder") : "") +
    (filme.length ? zahl(filme.length, " Film", " Filme") : "") +
    (fehlen.length
      ? `<p class="hinweis" style="margin:10px 0 0">
           <b>Achtung:</b> ${fehlen.map(v => entschaerfen(v.name)).join(", ")}
           &ndash; ${fehlen.length === 1 ? "diese Datei liegt" : "diese Dateien liegen"}
           dem Browser nicht mehr vor (nach einem Neuladen ist das so).
           ${fehlen.length === 1 ? "Sie" : "Sie"} läuft beim Vorführen nicht mit
           und kommt beim Sichern nicht ins Paket. Im Schritt <b>Folien</b>
           noch einmal auswählen.</p>`
      : "");

  /* Und was der Knopf „Weitergeben" diesmal ausspuckt. */
  const was = $("#ausgabe-was");
  if (!was) return;
  const dabei = filme.filter(v => v.datei);

  was.innerHTML = !filme.length
    ? `<div class="baum">${entschaerfen(dateiname(".html"))}</div>
       <p class="hinweis">Eine einzige Datei &ndash; verschicken, doppelklicken,
       fertig.</p>`
    : `<div class="baum">${entschaerfen(dateiname(".zip"))}<br>
         &nbsp;&nbsp;&nbsp;${entschaerfen(dateiname(".html"))}<br>
         &nbsp;&nbsp;&nbsp;${entschaerfen(VORTRAG.videos.ordner)}/<br>` +
       dabei.map(v => "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +
                      entschaerfen(v.name)).join("<br>") +
       `</div>
       <p class="hinweis">Weil ${dabei.length === 1 ? "ein Film" : "Filme"} dabei
       ${dabei.length === 1 ? "ist" : "sind"}, wird es ein <b>ZIP</b>: ein Film
       gehört nicht in eine HTML-Datei, und ein Browser darf keine Ordner
       anlegen. Einmal entpacken (Rechtsklick &rarr; <b>Alle extrahieren</b>),
       dann die HTML-Datei doppelklicken. Beides zusammen lassen.</p>`;
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
      alert("Diese Datei enthält keine Präsentation aus der Präsentationswerkstatt.");
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
  folien.forEach(f => medienFelder(f, k => {
    if (zustand.medien[k]) medien[k] = zustand.medien[k];
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
  const vorschlag = zustand.rahmen.titel || zustand.rahmen.anlass || "Meine Vorlage";
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
  const name = zustand.rahmen.titel || zustand.rahmen.anlass || "Vorlage";
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
      name: roh.name || (roh.rahmen && roh.rahmen.titel) || "Eingelesene Vorlage",
      wann: roh.wann || new Date().toISOString().slice(0, 10),
      rahmen: roh.rahmen || tief(VORTRAG.leererVortrag.rahmen),
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
  inhaltsbildZeichnen();
}

/* ------------------------------------------------------------
   Anlauf
   ------------------------------------------------------------ */
function felderFuellen() {
  $("#r-anlass").value    = zustand.rahmen.anlass || "";
  $("#r-titel").value     = zustand.rahmen.titel || "";
  $("#r-datum").value     = zustand.rahmen.datum || "";
  $("#r-lehrkraft").value = zustand.rahmen.lehrkraft || "";
  $("#format").value      = zustand.format;
  formatSetzen();
  allesZeichnen();
}

function anlauf() {
  $("#marke-logo").src = VORTRAG.logo;
  /* Das Aussehen der Folie UND das der Vorführung – letzteres, weil
     die Vorführung seit dem Umbau hier im Dokument stattfindet.
     Die Druckregeln der Vorführung bleiben draußen: ihr @page
     überschriebe sonst das gewählte Papierformat.              */
  $("#folienstil").textContent = FOLIEN_CSS + "\n" + VORFUEHREN.CSS;

  $("#format").innerHTML = Object.keys(VORTRAG.formate)
    .map(k => `<option value="${k}">${entschaerfen(VORTRAG.formate[k].name)}</option>`)
    .join("");

  /* Ein Platz für Meldungen, oben in der Arbeitsfläche. */
  $(".arbeit").insertAdjacentHTML("afterbegin", '<div id="meldungen"></div>');

  ["anlass", "titel", "datum", "lehrkraft"].forEach(feld =>
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
