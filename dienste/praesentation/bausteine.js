/* ============================================================
   BAUSTEINE.JS  –  macht aus den ausgefüllten Feldern eine Folie.

   Wird für die Vorschau, die Vorführung, den Ausdruck und den
   Export benutzt – dieselbe Funktion, viermal. Genau deshalb
   können die vier nicht auseinanderlaufen.

   Eine neue Folienart braucht zwei Dinge: einen Eintrag in
   VORTRAG.bausteine (daten.js) und hier unten eine Funktion
   gleichen Namens in "arten". Sonst nichts.
   ============================================================ */

const BAUSTEIN = (function () {

  /* ---- Text, der aus einem Eingabefeld kommt -----------------
     Grundsätzlich entschärft: was eine Lehrkraft tippt, ist Text
     und kein HTML. Danach die beiden kleinen Auszeichnungen, die
     man ohne Erklärung versteht:

       *fett*          wird fett und blau
       _hervorheben_   bekommt den orangen Textmarker

     Mehr nicht. Wer wirklich HTML braucht, nimmt die Folienart
     „Eigenes HTML" – dort wird nichts entschärft.              */
  function text(roh) {
    return String(roh == null ? "" : roh)
      .replace(/[&<>"]/g, z => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[z]))
      .replace(/\*([^*\n]+)\*/g, "<strong>$1</strong>")
      .replace(/_([^_\n]+)_/g, "<em>$1</em>");
  }

  /* Mehrzeiliger Text: Zeilenumbrüche bleiben Zeilenumbrüche. */
  function absatz(roh) { return text(roh).replace(/\n/g, "<br>"); }

  /* Ein Feld „zeilen": leere Zeilen fallen weg. */
  function zeilen(roh) {
    return String(roh == null ? "" : roh).split("\n")
             .map(z => z.trim()).filter(Boolean);
  }

  function liste(roh) {
    const p = zeilen(roh);
    if (!p.length) return "";
    return `<ul class="liste">${p.map(z => `<li>${text(z)}</li>`).join("")}</ul>`;
  }

  /* ---- Eine Karte ---------------------------------------------
     Die Marke links entscheidet über die Form: eine Zahl wird zur
     orangen Kachel neben dem Text, alles andere (ein Symbol) steht
     groß darüber. Leer heißt: nichts davon.                     */
  function karte(k, schrittweise) {
    if (!k) return "";
    const inhalt =
      (k.kopf  ? `<h3>${text(k.kopf)}</h3>` : "") +
      (k.text  ? `<p class="klein">${absatz(k.text)}</p>` : "") +
      liste(k.punkte);
    if (!inhalt && !k.marke) return "";

    const marke = String(k.marke || "").trim();
    const istZahl = /^\d{1,2}$/.test(marke);

    const koerper = istZahl
      ? `<div class="zeile"><div class="nummer">${text(marke)}</div><div>${inhalt}</div></div>`
      : (marke ? `<div class="symbol">${text(marke)}</div>` : "") + inhalt;

    const farbe = k.farbe && k.farbe !== "weiss" ? " " + k.farbe : "";
    return `<div class="karte${farbe}${schrittweise ? " schritt" : ""}">${koerper}</div>`;
  }

  function karten(reihe, schrittweise) {
    return (reihe || []).map(k => karte(k, schrittweise)).join("");
  }

  /* ---- Ein Bild ----------------------------------------------
     In der Folie steht nur die KENNUNG des Bildes; die Bilddaten
     selbst liegen zentral in rahmen.medien. Das hat zwei Gründe:
     dasselbe Bild lässt sich mehrfach verwenden, ohne zweimal
     gespeichert zu werden, und die Folie bleibt klein und lesbar.

     Fehlt das Bild – zum Beispiel in einer Datei, aus der es
     jemand entfernt hat –, steht dort ein ruhiger grauer Platz
     und keine kaputte Grafik.                                  */
  function bildPlatz(kennung, medien, passform) {
    const m = medien && medien[kennung];
    if (!m || !m.daten)
      return `<div class="bildplatz"><span>Kein Bild</span></div>`;
    return `<div class="bildplatz"><img src="${m.daten}" alt=""` +
           ` style="object-fit:${passform === "fuellen" ? "cover" : "contain"}"></div>`;
  }

  /* ---- Ein Video ---------------------------------------------
     Das Video liegt NICHT in der Präsentation, sondern als Datei
     daneben (siehe VORTRAG.videos in daten.js). In der Folie steht
     deshalb der Dateiname und ein Standbild.

     Vier Zustände, und alle vier müssen etwas Vernünftiges zeigen:

       vorfuehren:false  Vorschau in der Werkstatt und AUSDRUCK.
                         Ein Film auf Papier ist ein Standbild – mit
                         einem Abspielzeichen, damit man sieht,
                         dass dort etwas läuft.
       vorfuehren:true   Die fertige Präsentation: ein echtes
                         <video> mit dem Standbild als Vorschaubild.
       kein Standbild    grauer Platz mit dem Dateinamen.
       gar nichts        grauer Platz, "Kein Video".              */
  function videoPlatz(kennung, medien, opt) {
    const m = medien && medien[kennung];
    if (!m) return `<div class="bildplatz"><span>Kein Video</span></div>`;

    const bild = m.standbild
      ? `<img src="${m.standbild}" alt="" style="object-fit:contain">` : "";

    if (!opt || !opt.vorfuehren)
      return `<div class="bildplatz videoplatz">${bild}
        <span class="abspielen" aria-hidden="true"></span>
        ${m.standbild ? "" : `<span>${text(m.name || "Video")}</span>`}
      </div>`;

    /* Woher der Film kommt, hängt davon ab, WO wir gerade sind:

       m.quelle   beim Vorführen aus der Werkstatt heraus. Dort gibt
                  es die Datei noch im Browser, und sie wird direkt
                  eingesetzt – sonst liefe der Film erst nach dem
                  Sichern, und man könnte ihn nie vorher ansehen.
       sonst      der relative Pfad in die gesicherte Ablage.     */
    const pfad = m.quelle ||
      ((m.ordner || "medien") + "/" + encodeURIComponent(m.name || ""));
    return `<div class="bildplatz videoplatz">
      <video controls preload="metadata" playsinline
             ${m.standbild ? `poster="${m.standbild}"` : ""}
             src="${pfad}"></video></div>`;
  }

  /* ---- Der Kopf einer hellen Folie ---------------------------- */
  function titelzeile(f) {
    if (!f.titel && !f.augenbraue) return "";
    return `<div class="titelzeile">` +
      (f.augenbraue ? `<div class="augenbraue">${text(f.augenbraue)}</div>` : "") +
      (f.titel ? `<h2>${absatz(f.titel)}</h2>` : "") +
      `</div>`;
  }

  /* ============================================================
     Die Folienarten. Jede bekommt die ausgefüllte Folie und gibt
     den INHALT zurück (ohne Kopfleiste und Fußzeile – die setzt
     "folie" weiter unten drumherum).

     Wer "dunkel:true" zurückgibt, bekommt gar keinen Rahmen: das
     sind die beiden Folien, die die ganze Fläche füllen.
     ============================================================ */
  const arten = {

    titel(f, rahmen) {
      return { dunkel:true, klasse:"titel", html:
        `<div class="links">
          <div class="balken"></div>
          ${f.augenbraue ? `<div class="augenbraue">${text(f.augenbraue)}</div>` : ""}
          <h1>${absatz(f.titel)}</h1>
          ${f.unter ? `<p class="unter">${absatz(f.unter)}</p>` : ""}
          ${zeilen(f.marken).length
            ? `<div class="meta">${zeilen(f.marken)
                 .map(m => `<span>${text(m)}</span>`).join("")}</div>` : ""}
        </div>
        <div class="rechts">
          <div class="logokachel"><img src="${rahmen.logo}" alt=""></div>
          <div class="schulname">${text(rahmen.schulname).replace(/ /g, "<br>")}</div>
        </div>` };
    },

    abschluss(f, rahmen) {
      return { dunkel:true, klasse:"titel abschluss", html:
        `<div class="links">
          <img src="${rahmen.logo}" alt="">
          <div class="zitatgross">${absatz(f.satz)}<span class="strich"></span></div>
          ${f.quelle ? `<div class="quelle">${text(f.quelle)}</div>` : ""}
          ${zeilen(f.marken).length
            ? `<div class="meta" style="justify-content:center;margin-top:46px">${
                zeilen(f.marken).map(m => `<span>${text(m)}</span>`).join("")}</div>` : ""}
        </div>` };
    },

    karten(f) {
      const s = f.spalten === "2" ? "s2" : "s3";
      return { html: `<div class="raster ${s}">${karten(f.karten, f.schrittweise)}</div>` };
    },

    spalten(f) {
      return { html:
        `<div class="raster s2">
          <div class="stapel">${karten(f.links, f.schrittweise)}</div>
          <div class="stapel">${karten(f.rechts, f.schrittweise)}</div>
        </div>` };
    },

    text(f) {
      const kern =
        (f.einleitung ? `<p>${absatz(f.einleitung)}</p>` : "") +
        liste(f.punkte);
      if (!f.farbe || f.farbe === "keine")
        return { html: `<div class="stapel">${kern}</div>` };
      const farbe = f.farbe === "weiss" ? "" : " " + f.farbe;
      return { html: `<div class="karte${farbe}">${kern}</div>` };
    },

    bild(f, rahmen) {
      return { html:
        `<div class="bildganz">
          ${bildPlatz(f.bild, rahmen.medien, f.passform)}
          ${f.unterschrift
            ? `<p class="klein bildzeile">${text(f.unterschrift)}</p>` : ""}
        </div>` };
    },

    bildtext(f, rahmen) {
      const bildseite =
        `<div class="stapel">
          ${bildPlatz(f.bild, rahmen.medien, "ganz")}
          ${f.unterschrift
            ? `<p class="klein bildzeile">${text(f.unterschrift)}</p>` : ""}
        </div>`;
      const textseite =
        `<div class="stapel">
          ${f.text ? `<p>${absatz(f.text)}</p>` : ""}
          ${liste(f.punkte)}
        </div>`;
      return { html: `<div class="raster s2 bildpaar">` +
        (f.seite === "rechts" ? textseite + bildseite : bildseite + textseite) +
        `</div>` };
    },

    video(f, rahmen, opt) {
      return { html:
        `<div class="bildganz">
          ${videoPlatz(f.video, rahmen.medien, opt)}
          ${f.unterschrift
            ? `<p class="klein bildzeile">${text(f.unterschrift)}</p>` : ""}
        </div>` };
    },

    merksatz(f) {
      return { html:
        `<div class="karte voll${f.schrittweise ? " schritt" : ""}">
          ${f.kopf ? `<h3 style="font-size:22px">${text(f.kopf)}</h3>` : ""}
          ${f.satz ? `<p>${absatz(f.satz)}</p>` : ""}
        </div>
        ${f.nachsatz
          ? `<p class="klein" style="margin-top:18px;text-align:center">${absatz(f.nachsatz)}</p>`
          : ""}` };
    },

    zitat(f) {
      return { html:
        `<div>
          <div class="zitat">${absatz(f.zitat)}</div>
          ${f.quelle ? `<div class="zitatquelle">— ${text(f.quelle)}</div>` : ""}
        </div>` };
    },

    /* Der Notausgang. Hier wird bewusst NICHT entschärft – wer
       diese Folienart wählt, weiß, was er tut.                */
    frei(f) {
      return { html: String(f.html || "") };
    }
  };

  /* ============================================================
     Eine ganze Folie, fertig zum Einsetzen.

     folie   die ausgefüllte Folie aus dem Zustand
     rahmen  { schulname, kurs, logo } – was auf jeder Folie steht
     nr      Nummer dieser Folie, für die Fußzeile (ab 1)
     gesamt  wie viele es sind
     ============================================================ */
  /* opt  { vorfuehren:true }  – nur die fertige Präsentation und die
             Vorführung brauchen ein echtes <video>; Vorschau und
             Ausdruck bekommen das Standbild. Alles andere ist in
             beiden Fällen gleich.                                */
  function folie(folie_, rahmen, nr, gesamt, opt) {
    const bauer = arten[folie_.baustein] || arten.text;
    const teil = bauer(folie_, rahmen, opt) || {};

    if (teil.dunkel)
      return `<section class="folie ${teil.klasse}">${teil.html}</section>`;

    /* Die Fußzeile ist dreiteilig, damit die Angaben aus Schritt 1
       auch wirklich irgendwo LANDEN: links der Anlass, in der Mitte
       wer sie hält und wann, rechts die Nummer. Vorher wurden zwei
       der vier Felder nirgends benutzt – man trug etwas ein und
       nichts geschah. Leere Angaben lassen einfach ihren Platz
       leer, das fällt nicht auf.                                */
    const mitte = [rahmen.lehrkraft, rahmen.datum]
                    .filter(Boolean).map(text).join(" &middot; ");

    return `<section class="folie">
      <header class="kopf">
        <img src="${rahmen.logo}" alt="">
        <span class="schule">${text(rahmen.schulname)}</span>
        ${rahmen.anlass ? `<span class="anlass">${text(rahmen.anlass)}</span>` : ""}
      </header>
      ${titelzeile(folie_)}
      <div class="inhalt">${teil.html}</div>
      <div class="fuss">
        <span>${text(rahmen.anlass || "")}</span>
        <span>${mitte}</span>
        <span>${nr} / ${gesamt}</span>
      </div>
    </section>`;
  }

  /* Wie eine Folie in der Folienliste heißt – das erste, was
     ausgefüllt ist. Eine Folie ohne jeden Text bekommt den Namen
     ihrer Art, damit die Liste nie leere Zeilen zeigt.        */
  function benennen(f) {
    const art = VORTRAG.bausteine.find(b => b.id === f.baustein);
    const roh = f.titel || f.satz || f.kopf || f.zitat || f.unter || "";
    const kurz = String(roh).split("\n")[0].trim();
    return kurz || (art ? art.name : "Folie");
  }

  return { folie: folie, benennen: benennen, text: text, karte: karte };
})();
