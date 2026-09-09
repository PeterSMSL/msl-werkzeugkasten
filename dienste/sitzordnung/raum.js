/* ============================================================
   RAUM.JS  –  das Klassenzimmer: zeichnen, schieben, drehen.

   Der Raum wird in ZENTIMETERN gerechnet, nicht in Bildpunkten.
   Ein Zentimeter ist im Inneren genau ein Bildpunkt; die ganze
   Zeichnung wird am Ende als Ganzes auf die verfügbare Fläche
   skaliert. Deshalb sieht der Raum auf dem Handy, am Rechner und
   auf dem Papier gleich aus – es ändert sich nur ein Faktor.

   Ein Möbelstück ist:
     { id, art, x, y, dreh }
   x und y sind der MITTELPUNKT in Zentimetern, gemessen von der
   linken oberen Ecke des Raums. dreh sind Grad im Uhrzeigersinn.
   ============================================================ */

const RAUM = (function () {

  /* Wird gerufen, sobald die Lehrkraft etwas verändert hat –
     app.js hängt sich hier ein und sichert den Stand.        */
  let beiAenderung = function () {};

  let gewaehlt = null;      // id des angetippten Möbelstücks
  let masstab  = 1;         // Bildpunkte je Zentimeter

  /* ---------------------------------------------------------
     Rechnen: wo sitzt wer, und wie viel Platz braucht ein Tisch
     --------------------------------------------------------- */

  /* Die halbe Ausdehnung eines gedrehten Tisches. Ein um 45°
     gedrehter Tisch braucht mehr Platz in beide Richtungen als
     ein gerader – sonst schöbe man ihn aus dem Raum heraus.   */
  function halbeAusdehnung(m) {
    const d = SITZ.moebel[m.art];
    const w = m.dreh * Math.PI / 180;
    const c = Math.abs(Math.cos(w)), s = Math.abs(Math.sin(w));
    return { x: (d.breite * c + d.tiefe * s) / 2,
             y: (d.breite * s + d.tiefe * c) / 2 };
  }

  /* Der Punkt, an dem ein Platz liegt – schon gedreht.
     Am Zweiertisch links und rechts, am Einzeltisch in der Mitte. */
  function platzPunkt(m, i) {
    const d = SITZ.moebel[m.art];
    const lx = d.plaetze === 2 ? (i === 0 ? -d.breite / 4 : d.breite / 4) : 0;
    const w = m.dreh * Math.PI / 180;
    return { x: m.x + lx * Math.cos(w), y: m.y + lx * Math.sin(w) };
  }

  /* Alle Sitzplätze des Raums, von vorn nach hinten und von links
     nach rechts sortiert. Die Reihenfolge ist die, in der ein
     Mensch die Plätze vorlesen würde – daran hängt später die
     Namensliste auf dem Blatt.                                  */
  function plaetze(raum) {
    const liste = [];
    raum.moebel.forEach(m => {
      const d = SITZ.moebel[m.art];
      for (let i = 0; i < d.plaetze; i++) {
        const p = platzPunkt(m, i);
        liste.push({
          schluessel: m.id + ":" + i,
          moebel: m.id, index: i, art: m.art,
          paar: d.plaetze === 2,
          x: p.x, y: p.y
        });
      }
    });
    /* In Reihen sortieren: was innerhalb von 60 cm gleich weit
       hinten steht, gehört zur selben Reihe.                   */
    liste.sort((a, b) =>
      Math.abs(a.y - b.y) > 60 ? a.y - b.y : a.x - b.x);
    return liste;
  }

  /* ---------------------------------------------------------
     Ein neues Möbelstück – und zwar auf einen freien Fleck
     --------------------------------------------------------- */

  function ueberschneidet(m, andere) {
    const a = halbeAusdehnung(m);
    return andere.some(o => {
      const b = halbeAusdehnung(o);
      return Math.abs(m.x - o.x) < a.x + b.x - 2 &&
             Math.abs(m.y - o.y) < a.y + b.y - 2;
    });
  }

  function neuesMoebel(raum, art) {
    const d = SITZ.moebel[art];
    const m = { id: "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
                art, x: raum.breite / 2, y: raum.tiefe / 2, dreh: 0 };

    /* Die Tafel gehört nach vorn, die Tür an die Seite – dort
       sucht der Rechner gar nicht erst herum.                */
    if (art === "tafel") { m.x = raum.breite / 2; m.y = d.tiefe; }
    else if (art === "tuer") { m.x = raum.breite - d.tiefe; m.y = raum.tiefe - 120; m.dreh = 90; }
    else {
      /* Von oben nach unten den ersten freien Fleck suchen. Wer
         zwölf Tische stellt, soll sie nicht erst auseinander-
         ziehen müssen.                                        */
      const h = halbeAusdehnung(m);
      suche:
      for (let y = h.y + 100; y < raum.tiefe - h.y; y += 20) {
        for (let x = h.x + 20; x < raum.breite - h.x; x += 20) {
          m.x = x; m.y = y;
          if (!ueberschneidet(m, raum.moebel)) break suche;
        }
      }
    }
    einpassen(m, raum);
    raum.moebel.push(m);
    gewaehlt = m.id;
    return m;
  }

  /* Hält ein Möbelstück im Raum und auf dem Raster. */
  function einpassen(m, raum) {
    const h = halbeAusdehnung(m);
    const r = SITZ.raster;
    m.x = Math.round(m.x / r) * r;
    m.y = Math.round(m.y / r) * r;
    m.x = Math.min(Math.max(m.x, h.x), raum.breite - h.x);
    m.y = Math.min(Math.max(m.y, h.y), raum.tiefe  - h.y);
  }

  /* ---------------------------------------------------------
     Zeichnen
     --------------------------------------------------------- */

  /* ziel      Element, in das gezeichnet wird
     raum      { breite, tiefe, moebel }
     opt       { bearbeiten, namen, hoehe, klasse }
               namen: { "id:0": "Mia", … }                    */
  function zeichnen(ziel, raum, opt) {
    opt = opt || {};
    const namen = opt.namen || {};

    /* Der Maßstab: so groß wie möglich, aber ganz sichtbar. */
    const platzBreite = opt.breite || ziel.clientWidth  || 800;
    const platzHoehe  = opt.hoehe  || ziel.clientHeight || 600;
    masstab = Math.min(platzBreite / raum.breite, platzHoehe / raum.tiefe);

    ziel.innerHTML =
      aufbau(raum, { namen: namen, einheit: "px", masstab: masstab,
                     bearbeiten: opt.bearbeiten }) +
      (opt.bearbeiten ? `<div class="griffe" id="griffe" hidden></div>` : "");

    if (opt.bearbeiten) { bedienungAnhaengen(ziel, raum); griffeSetzen(ziel, raum); }
  }

  /* Der Raum als HTML – einmal geschrieben, zweimal benutzt.

     Am Bildschirm steht hinter den Zahlen "px", auf dem Papier
     "mm". Die ZAHLEN sind beide Male die Zentimeter des Raums;
     es wechselt nur die Einheit und der Maßstab davor. Genau
     deshalb sieht das gedruckte Blatt aus wie der Bildschirm –
     es ist dieselbe Zeichnung, nicht eine nachgebaute.        */
  function aufbau(raum, opt) {
    const namen = opt.namen || {};
    const e = opt.einheit || "px";
    const s = opt.masstab;

    const teile = raum.moebel.map(m => {
      const d = SITZ.moebel[m.art];
      const inhalt = [];
      for (let i = 0; i < d.plaetze; i++) {
        const name = namen[m.id + ":" + i] || "";
        inhalt.push(
          `<div class="platz${name ? " besetzt" : ""}" data-platz="${i}">` +
          `<span class="name" style="font-size:${engerSatz(name)}em">` +
          `${entschaerfen(name)}</span></div>`);
      }
      if (!d.plaetze) inhalt.push(`<span class="beschriftung">${d.name}</span>`);

      const markiert = opt.bearbeiten && gewaehlt === m.id ? " gewaehlt" : "";
      return `<div class="moebel ${m.art}${markiert}" data-id="${m.id}"
                   style="left:${m.x - d.breite / 2}${e}; top:${m.y - d.tiefe / 2}${e};
                          width:${d.breite}${e}; height:${d.tiefe}${e};
                          transform:rotate(${m.dreh}deg)">${inhalt.join("")}</div>`;
    }).join("");

    /* Die Schriftgröße steht in DERSELBEN Einheit wie der Raum und
       ist damit der Maßstab für alles Weitere: innerhalb der Fläche
       ist jedes Maß in "em" angegeben – Rahmenstärken, Rundungen,
       Abstände. Sonst hätte ein 2px-Rahmen am Bildschirm die
       richtige Stärke und auf dem Papier die eines Haares.        */
    return `<div class="buehne" style="width:${raum.breite * s}${e}; height:${raum.tiefe * s}${e}">
              <div class="flaeche" style="width:${raum.breite}${e}; height:${raum.tiefe}${e};
                                          font-size:${opt.schrift || 13}${e};
                                          transform:scale(${s})">${teile}</div>
            </div>`;
  }

  /* Ein langer Name wird kleiner gesetzt, statt mitten im Wort
     umzubrechen. In einen Platz von 65 cm passen bei voller Größe
     knapp neun Zeichen – "Maximilian" stand vorher als
     "Maximilia / n" auf dem Blatt.
     Unter 55 % wird nicht mehr verkleinert; ein derart langer Name
     bricht dann doch um, aber lesbar bleibt er.               */
  function engerSatz(name) {
    if (!name) return 1;
    return Math.max(.55, Math.min(1, 8.5 / name.length)).toFixed(2);
  }

  /* Kindernamen sind Text, kein HTML. */
  function entschaerfen(s) {
    return String(s).replace(/[&<>"]/g, z =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[z]));
  }

  /* ---------------------------------------------------------
     Bedienung: schieben, drehen, verdoppeln, wegnehmen
     --------------------------------------------------------- */

  function bedienungAnhaengen(ziel, raum) {
    const flaeche = ziel.querySelector(".flaeche");
    let zieht = null;

    /* Pointer-Ereignisse statt Maus- oder Berührungsereignisse:
       damit gilt derselbe Code für Maus, Finger und Stift.    */
    flaeche.addEventListener("pointerdown", e => {
      const kasten = e.target.closest(".moebel");
      if (!kasten) { gewaehlt = null; griffeSetzen(ziel, raum); markieren(ziel); return; }

      const m = raum.moebel.find(x => x.id === kasten.dataset.id);
      gewaehlt = m.id;
      markieren(ziel); griffeSetzen(ziel, raum);

      zieht = { m, startX: e.clientX, startY: e.clientY, ausgangX: m.x, ausgangY: m.y, bewegt: false };
      kasten.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    flaeche.addEventListener("pointermove", e => {
      if (!zieht) return;
      /* Der Weg auf dem Bildschirm geteilt durch den Maßstab
         ergibt den Weg im Raum – in Zentimetern.            */
      zieht.m.x = zieht.ausgangX + (e.clientX - zieht.startX) / masstab;
      zieht.m.y = zieht.ausgangY + (e.clientY - zieht.startY) / masstab;
      einpassen(zieht.m, raum);
      zieht.bewegt = true;
      stellungSetzen(ziel, zieht.m);
      griffeSetzen(ziel, raum);
    });

    const loslassen = () => {
      if (!zieht) return;
      if (zieht.bewegt) beiAenderung();
      zieht = null;
    };
    flaeche.addEventListener("pointerup", loslassen);
    flaeche.addEventListener("pointercancel", loslassen);
  }

  /* Nur die Stellung eines einzelnen Tisches neu setzen – beim
     Ziehen alles neu zu zeichnen wäre ruckelig.              */
  function stellungSetzen(ziel, m) {
    const d = SITZ.moebel[m.art];
    const el = ziel.querySelector(`.moebel[data-id="${m.id}"]`);
    if (!el) return;
    el.style.left = (m.x - d.breite / 2) + "px";
    el.style.top  = (m.y - d.tiefe  / 2) + "px";
    el.style.transform = `rotate(${m.dreh}deg)`;
  }

  function markieren(ziel) {
    ziel.querySelectorAll(".moebel").forEach(el =>
      el.classList.toggle("gewaehlt", el.dataset.id === gewaehlt));
  }

  /* Die kleine Leiste über dem gewählten Tisch. Sie liegt AUSSERHALB
     der skalierten Fläche – sonst würde sie mitskaliert und wäre auf
     kleinen Bildschirmen nicht mehr zu treffen.                     */
  function griffeSetzen(ziel, raum) {
    const kasten = ziel.querySelector("#griffe");
    if (!kasten) return;
    const m = raum.moebel.find(x => x.id === gewaehlt);
    if (!m) { kasten.hidden = true; return; }

    const h = halbeAusdehnung(m);
    kasten.hidden = false;
    kasten.innerHTML =
      `<button data-tun="links"  title="Nach links drehen">&#8634;</button>
       <button data-tun="rechts" title="Nach rechts drehen">&#8635;</button>
       <button data-tun="kopie"  title="Noch so einen">&#9107;</button>
       <button data-tun="weg" class="weg" title="Wegnehmen">&times;</button>`;
    kasten.style.left = (m.x * masstab) + "px";
    kasten.style.top  = ((m.y - h.y) * masstab) + "px";

    kasten.querySelectorAll("button").forEach(b =>
      b.addEventListener("click", () => {
        const tun = b.dataset.tun;
        if (tun === "links")  m.dreh = (m.dreh - SITZ.drehschritt + 360) % 360;
        if (tun === "rechts") m.dreh = (m.dreh + SITZ.drehschritt) % 360;
        if (tun === "kopie") {
          const neu = Object.assign({}, m, {
            id: "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
            x: m.x + 40, y: m.y + 40 });
          einpassen(neu, raum); raum.moebel.push(neu); gewaehlt = neu.id;
        }
        if (tun === "weg") {
          raum.moebel = raum.moebel.filter(x => x.id !== m.id);
          gewaehlt = null;
        }
        if (tun === "links" || tun === "rechts") einpassen(m, raum);
        beiAenderung();
      }));
  }

  return {
    zeichnen, aufbau, plaetze, neuesMoebel, halbeAusdehnung, einpassen,
    get masstab() { return masstab; },
    get gewaehlt() { return gewaehlt; },
    set gewaehlt(v) { gewaehlt = v; },
    set aenderung(fn) { beiAenderung = fn; }
  };
})();
