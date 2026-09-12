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
   ============================================================ */

const VORFUEHREN = (function () {

  /* ---- Das Aussehen der Bedienung ----------------------------
     Gehört nicht zur Folie, sondern um sie herum: Fortschritts-
     balken, Blätterknöpfe, Übersicht. Reist mit dem Export mit. */
  const CSS = `
html,body{ height:100%; }
body.vorfuehrung{
  margin:0; background:#0E1B27; overflow:hidden;
  display:flex; align-items:center; justify-content:center;
  font-family:"Sansation","Segoe UI",system-ui,sans-serif;
}
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

/* Beim Drucken aus der exportierten Datei heraus: alles sichtbar,
   eine Folie je Seite. Der saubere Weg zum PDF führt über die
   Werkstatt – dort lässt sich auch das Papierformat wählen.    */
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
  body.vorfuehrung{ display:block; background:#fff; overflow:visible; }
  #buehne{ transform:none !important; width:auto; height:auto; }
  #buehne .folie{
    position:relative; inset:auto; visibility:visible; opacity:1;
    transform:none; border-radius:0; box-shadow:none;
    break-after:page; page-break-after:always;
  }
  #buehne .folie:last-child{ break-after:auto; page-break-after:auto; }
  #buehne .folie .schritt{ opacity:1 !important; transform:none !important; }
  #navi, #fortschritt, #uebersicht{ display:none !important; }
}`;

  /* ============================================================
     DER MOTOR.  Ab hier: nichts von außen benutzen – siehe oben.
     Erwartet im Dokument ein #buehne mit den fertigen Folien
     darin und hängt alles Weitere selbst an.
     ============================================================ */
  function motor() {
    const buehne = document.getElementById("buehne");
    if (!buehne) return;
    document.body.classList.add("vorfuehrung");

    const folien = Array.prototype.slice.call(buehne.querySelectorAll(".folie"));
    if (!folien.length) return;

    /* ---- Bedienung anhängen ---- */
    const balken = document.createElement("div");
    balken.id = "fortschritt";
    document.body.appendChild(balken);

    const navi = document.createElement("div");
    navi.id = "navi";
    navi.innerHTML =
      '<button data-tu="zurueck" title="Zurück (Pfeil links)">‹</button>' +
      '<span class="zaehler">1 / 1</span>' +
      '<button data-tu="vor" title="Weiter (Pfeil rechts)">›</button>' +
      '<span class="hilfe">O Übersicht · F Vollbild</span>';
    document.body.appendChild(navi);
    const zaehler = navi.querySelector(".zaehler");

    const uebersicht = document.createElement("div");
    uebersicht.id = "uebersicht";
    uebersicht.innerHTML =
      "<h4>Übersicht — Folie anklicken (Esc schließt)</h4><div class='gitter'></div>";
    document.body.appendChild(uebersicht);

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
         lädt, steht wieder an derselben Stelle.               */
      try { history.replaceState(null, "", "#" + (i + 1)); } catch (e) {}
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
    window.addEventListener("resize", skalieren);

    navi.addEventListener("click", function (e) {
      const knopf = e.target.closest("button[data-tu]");
      if (!knopf) return;
      if (knopf.dataset.tu === "vor") vor(); else zurueck();
    });

    window.addEventListener("keydown", function (e) {
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
    buehne.addEventListener("click", function (e) {
      if (!e.target.closest("a")) vor();
    });

    skalieren();
    const ausAdresse = parseInt(location.hash.slice(1), 10);
    zeige(ausAdresse > 0 ? ausAdresse - 1 : 0);
  }

  /* Der Motor als Text – so kommt er in die exportierte Datei. */
  function quelltext() {
    return "(" + motor.toString() + ")();";
  }

  return { CSS: CSS, motor: motor, quelltext: quelltext };
})();
