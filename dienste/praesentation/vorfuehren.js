/* ============================================================
   VORFUEHREN.JS  –  das Blättern, Aufdecken und Vollbild.

   DIESE DATEI IST BESONDERS, und zwar aus einem Grund:
   Der Motor muss auch in der EXPORTIERTEN Einzeldatei laufen –
   dort liegt dieses Verzeichnis nicht daneben. Deshalb steht er
   als eine einzige, vollständig selbstständige Funktion da, die
   per toString() als Text in die Exportdatei geschrieben wird.

   Daraus folgt eine Regel, die man nicht aufweichen darf:
   INNERHALB VON "motor" DARF NICHTS VON AUSSEN BENUTZT WERDEN.
   Keine Hilfsfunktion, keine Konstante, kein VORTRAG – nichts
   außer dem, was im Browser ohnehin da ist. Sonst läuft die
   Werkstatt weiter und die exportierte Datei stürzt ab, und das
   merkt man erst auf dem fremden Rechner.

   Dafür gibt es den Vorführmodus nur EINMAL: was die Werkstatt
   zeigt, ist zeichengenau das, was die Lehrkraft weitergibt.

   Der Motor bekommt einen BEHÄLTER. In der exportierten Datei ist
   das der body, in der Werkstatt eine Überlagerung über der Seite.

   Warum die Werkstatt nicht einfach ein zweites Fenster öffnet, wie
   zuerst gebaut: Videos liegen dort als Blob-Adressen vor, und die
   sind NUR in dem Dokument auflösbar, das sie erzeugt hat. Im neuen
   Fenster kam deshalb „Kein Video mit unterstütztem Format
   gefunden" – nachgeprüft, das Dokument blieb ganz leer. Dazu käme
   der Fensterblocker. Beides entfällt, wenn die Vorführung im
   selben Dokument stattfindet.

   Deshalb gibt motor() eine Funktion zum BEENDEN zurück. Die ist
   kein Beiwerk: der Motor hört auf Tasten am Fenster, und ohne
   Abräumen blätterte die Werkstatt hinterher beim Tippen durch die
   Folien.
   ============================================================ */

const VORFUEHREN = (function () {

  /* ---- Das Aussehen der Bedienung ----------------------------
     Gehört nicht zur Folie, sondern um sie herum: Fortschritts-
     balken, Blätterknöpfe, Übersicht. Reist mit dem Export mit. */
  const CSS = `
html,body{ height:100%; }
/* Im Export trägt der body diese Klasse, in der Werkstatt die
   Überlagerung. Deshalb steht hier kein "body" davor.          */
.vorfuehrung{
  margin:0; background:#0E1B27; overflow:hidden;
  display:flex; align-items:center; justify-content:center;
  font-family:"Sansation","Segoe UI",system-ui,sans-serif;
}
/* Als Überlagerung in der Werkstatt: über allem und formatfüllend. */
.vorfuehrung.ueberlagert{ position:fixed; inset:0; z-index:300; }
#buehne{
  position:relative; width:1280px; height:720px;
  transform-origin:center center; flex:none;
}
#buehne .folie{
  position:absolute; inset:0;
  border-radius:14px; box-shadow:0 18px 50px rgba(0,0,0,.45);
  opacity:0; visibility:hidden;
  transform:translateY(14px) scale(.995);
  transition:opacity .32s ease, transform .32s ease, visibility .32s;
}
#buehne .folie.dran{ opacity:1; visibility:visible; transform:none; }

/* Die schrittweise aufgedeckten Teile sind NUR hier versteckt, in
   der Vorführung. Auf dem Ausdruck und in der Vorschau der Werkstatt
   ist die Folie vollständig – siehe folien-design.js.           */
#buehne .folie .schritt{ opacity:0; transform:translateY(10px); }
#buehne .folie .schritt.da{ opacity:1; transform:none; }

#fortschritt{
  position:fixed; left:0; top:0; height:4px; background:#F09018;
  width:0; transition:width .3s ease; z-index:50;
}
#navi{
  position:fixed; right:18px; bottom:14px; z-index:50;
  display:flex; align-items:center; gap:8px;
  background:rgba(255,255,255,.9); border-radius:999px; padding:5px 8px;
  box-shadow:0 4px 14px rgba(0,0,0,.3);
}
#navi button{
  border:none; background:#E7F0F8; color:#00538F;
  width:30px; height:30px; border-radius:50%; cursor:pointer;
  font-size:15px; font-weight:800; line-height:1;
}
#navi button:hover{ background:#0060A8; color:#fff; }
#navi .zaehler{ font-size:13px; font-weight:700; color:#5C6B7A;
                padding:0 6px; min-width:52px; text-align:center; }
#navi .hilfe{ font-size:11px; color:#5C6B7A; padding-right:6px;
              border-left:1px solid #DDE4EC; padding-left:8px; }
/* Auf einem Tablet gibt es kein O und kein F – da ist der Hinweis
   auf Tasten nur im Weg. Die Knöpfe daneben bleiben.           */
@media (pointer:coarse){
  #navi .hilfe{ display:none; }
  #navi button{ width:44px; height:44px; font-size:19px; }
  #navi .zaehler{ font-size:15px; min-width:64px; }
}

#uebersicht{
  position:fixed; inset:0; background:rgba(0,53,90,.97); z-index:100;
  display:none; padding:34px; overflow:auto;
}
#uebersicht.auf{ display:block; }
#uebersicht h4{ color:#fff; font-size:18px; margin:0 0 18px; font-weight:700; }
#uebersicht .gitter{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
#uebersicht .mini{
  background:#fff; border-radius:8px; padding:14px; cursor:pointer;
  border:3px solid transparent; min-height:78px;
}
#uebersicht .mini:hover{ border-color:#F09018; }
#uebersicht .mini .nr{ font-size:11px; font-weight:800; color:#8A5A00; }
#uebersicht .mini .tt{ font-size:14px; font-weight:700; color:#00538F;
                       margin-top:3px; line-height:1.25; }
`;

  /* ---- Druckregeln NUR für die exportierte Datei --------------

     Sie stehen getrennt, und das ist kein Ordnungssinn: dieser Block
     enthält ein "@page" mit fester Seitengröße. Hängte man ihn auch
     in die Werkstatt, überschriebe er dort das Papierformat, das die
     Lehrkraft gerade gewählt hat – und „A3" würde heimlich zu 16:9.

     Die Werkstatt bekommt deshalb nur VORFUEHREN.CSS, die
     exportierte Datei beides.                                    */
  const DRUCK = `
/* Alles sichtbar, eine Folie je Seite. Der saubere Weg zum PDF
   führt über die Werkstatt – dort lässt sich das Papierformat
   wählen.                                                      */
/* Auch hier der Safari-Sonderweg (siehe haus/drucken.js) – in der
   exportierten Datei ist die Folie SELBST die Seite, es gibt keinen
   Rahmen darum. Deshalb steht der Selektor anders als in
   folien-design.js.                                              */
@supports (-webkit-hyphens: none){
  @media print{
    #buehne .folie{ zoom: 0.9; }
  }
}

@media print{
  @page{ size:338mm 190mm; margin:0 }
  .vorfuehrung{ display:block; background:#fff; overflow:visible; }
  #buehne{ transform:none !important; width:auto; height:auto; }
  #buehne .folie{
    position:relative; inset:auto; visibility:visible; opacity:1;
    transform:none; border-radius:0; box-shadow:none;
    break-after:page; page-break-after:always;
  }
  #buehne .folie:last-child{ break-after:auto; page-break-after:auto; }
  #buehne .folie .schritt{ opacity:1 !important; transform:none !important; }
  #navi, #fortschritt, #uebersicht{ display:none !important; }
}
`;
;

  /* ============================================================
     DER MOTOR.  Ab hier: nichts von außen benutzen – siehe oben.
     Erwartet im Dokument ein #buehne mit den fertigen Folien
     darin und hängt alles Weitere selbst an.
     ============================================================ */
  function motor(behaelter) {
    const heim = behaelter || document.body;
    const buehne = heim.querySelector("#buehne") || document.getElementById("buehne");
    if (!buehne) return function () {};
    heim.classList.add("vorfuehrung");

    const folien = Array.prototype.slice.call(buehne.querySelectorAll(".folie"));
    if (!folien.length) return function () {};

    /* Alles, was beim Beenden rückgängig gemacht werden muss. */
    const abraeumen = [];
    function hoeren(ziel, art, fn, passiv) {
      const wie = passiv ? { passive: true } : undefined;
      ziel.addEventListener(art, fn, wie);
      abraeumen.push(function () { ziel.removeEventListener(art, fn, wie); });
    }

    /* ---- Bedienung anhängen ---- */
    const balken = document.createElement("div");
    balken.id = "fortschritt";
    heim.appendChild(balken);
    abraeumen.push(function () { balken.remove(); });

    const navi = document.createElement("div");
    navi.id = "navi";
    navi.innerHTML =
      '<button data-tu="zurueck" title="Zurück (Pfeil links)">‹</button>' +
      '<span class="zaehler">1 / 1</span>' +
      '<button data-tu="vor" title="Weiter (Pfeil rechts)">›</button>' +
      '<span class="hilfe">O Übersicht · F Vollbild</span>';
    heim.appendChild(navi);
    abraeumen.push(function () { navi.remove(); });
    const zaehler = navi.querySelector(".zaehler");

    const uebersicht = document.createElement("div");
    uebersicht.id = "uebersicht";
    uebersicht.innerHTML =
      "<h4>Übersicht — Folie anklicken (Esc schließt)</h4><div class='gitter'></div>";
    heim.appendChild(uebersicht);
    abraeumen.push(function () { uebersicht.remove(); });

    /* Die Überschriften für die Übersicht stehen schon in den
       Folien – aus dem Dokument lesen statt mitzuschleppen. */
    const gitter = uebersicht.querySelector(".gitter");
    folien.forEach(function (f, k) {
      const kopf = f.querySelector("h2") || f.querySelector("h1") ||
                   f.querySelector(".zitatgross");
      const mini = document.createElement("div");
      mini.className = "mini";
      mini.innerHTML = "<div class='nr'>FOLIE " + (k + 1) + "</div>" +
                       "<div class='tt'></div>";
      /* Ein Zeilenumbruch im Titel ist im Text nichts – aus
         "Fach<br>Kursstufe" würde sonst "FachKursstufe". Also den
         Umbruch erst zum Leerzeichen machen und dann entschärfen. */
      const roh = kopf ? kopf.innerHTML.replace(/<br\s*\/?>/gi, " ") : "";
      const eimer = document.createElement("div");
      eimer.innerHTML = roh;
      mini.querySelector(".tt").textContent =
        eimer.textContent.replace(/\s+/g, " ").trim().slice(0, 70);
      mini.addEventListener("click", function () {
        uebersicht.classList.remove("auf");
        zeige(k);
      });
      gitter.appendChild(mini);
    });

    let i = 0, schritt = 0;

    function teile(n) {
      return Array.prototype.slice.call(folien[n].querySelectorAll(".schritt"));
    }

    function zeige(n, allesAufdecken) {
      i = Math.max(0, Math.min(folien.length - 1, n));
      folien.forEach(function (f, k) { f.classList.toggle("dran", k === i); });
      const t = teile(i);
      schritt = allesAufdecken ? t.length : 0;
      t.forEach(function (el, k) { el.classList.toggle("da", k < schritt); });
      zaehler.textContent = (i + 1) + " / " + folien.length;
      balken.style.width = ((i + 1) / folien.length * 100) + "%";
      /* Die Adresse merkt sich die Folie – wer versehentlich neu
         lädt, steht wieder an derselben Stelle. Nur in der
         exportierten Datei: in der Werkstatt hätte die Adresse
         nichts mit der Folie zu tun.                          */
      if (!behaelter) { try { history.replaceState(null, "", "#" + (i + 1)); } catch (e) {} }
    }

    function vor() {
      const t = teile(i);
      if (schritt < t.length) { t[schritt].classList.add("da"); schritt++; return; }
      if (i < folien.length - 1) zeige(i + 1);
    }

    function zurueck() {
      if (schritt > 0) { schritt--; teile(i)[schritt].classList.remove("da"); return; }
      /* Rückwärts wird die vorige Folie VOLL gezeigt – sonst müsste
         man sich durch alle Zwischenschritte zurückklicken.      */
      if (i > 0) zeige(i - 1, true);
    }

    /* Die Folie ist starr 1280 x 720 und wird als Ganzes auf das
       Fenster skaliert – dieselbe Idee wie der Grundriss in der
       Sitzordnung. Deshalb sieht sie überall gleich aus.       */
    function skalieren() {
      const rand = 40;
      const s = Math.min((window.innerWidth - rand) / 1280,
                         (window.innerHeight - rand) / 720);
      buehne.style.transform = "scale(" + s + ")";
    }
    hoeren(window, "resize", skalieren);

    hoeren(navi, "click", function (e) {
      const knopf = e.target.closest("button[data-tu]");
      if (!knopf) return;
      if (knopf.dataset.tu === "vor") vor(); else zurueck();
    });

    hoeren(window, "keydown", function (e) {
      const k = e.key;
      if (k === "ArrowRight" || k === "PageDown" || k === " " || k === "Enter") {
        e.preventDefault(); vor();
      } else if (k === "ArrowLeft" || k === "PageUp" || k === "Backspace") {
        e.preventDefault(); zurueck();
      } else if (k === "Home") { zeige(0); }
      else if (k === "End")    { zeige(folien.length - 1, true); }
      else if (k === "o" || k === "O") { uebersicht.classList.toggle("auf"); }
      else if (k === "Escape") { uebersicht.classList.remove("auf"); }
      else if (k === "f" || k === "F") {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
      }
    });

    /* Klick auf die Folie blättert weiter – am Beamer tippt man
       lieber irgendwohin, als den kleinen Knopf zu treffen.   */
    let eben = 0;
    hoeren(buehne, "click", function (e) {
      /* Nach einem Wisch kommt mancherorts noch ein Klick hinterher.
         Der würde eine Folie zu weit springen.                   */
      if (Date.now() - eben < 500) return;
      if (!e.target.closest("a")) vor();
    });

    /* Und auf dem Tablet: wischen. Ohne das müsste man dort den
       kleinen Knopf unten rechts treffen, denn Pfeiltasten gibt es
       nicht. Nach links heißt weiter, wie beim Umblättern.      */
    let start = null;
    hoeren(buehne, "touchstart", function (e) {
      start = e.touches.length === 1
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
    }, true);
    hoeren(buehne, "touchend", function (e) {
      if (!start) return;
      const b = e.changedTouches[0];
      const dx = b.clientX - start.x, dy = b.clientY - start.y;
      start = null;
      /* Mindestens 50 Punkte weit und eher waagerecht als senkrecht –
         sonst wäre jedes ungenaue Tippen ein Wisch.              */
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      eben = Date.now();
      if (dx < 0) vor(); else zurueck();
    });

    skalieren();
    const ausAdresse = behaelter ? 0 : parseInt(location.hash.slice(1), 10);
    zeige(ausAdresse > 0 ? ausAdresse - 1 : 0);

    /* Zurückgegeben wird das Beenden – siehe oben, warum das wichtig
       ist. In der exportierten Datei ruft es niemand, das schadet
       nicht.                                                      */
    return function beenden() {
      abraeumen.forEach(function (f) { f(); });
      heim.classList.remove("vorfuehrung");
      if (document.fullscreenElement) {
        try { document.exitFullscreen(); } catch (e) {}
      }
    };
  }

  /* Der Motor als Text – so kommt er in die exportierte Datei. */
  function quelltext() {
    return "(" + motor.toString() + ")();";
  }

  return { CSS: CSS, DRUCK: DRUCK, motor: motor, quelltext: quelltext };
})();
