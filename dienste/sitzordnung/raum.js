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

    /* Was an die Wand gehört, sucht sich eine freie Stelle daran.

       Die Reihenfolge der Wände ist Geschmack, aber begründet:
       die Tafel gehört nach vorn und dort in die Mitte, die Tür
       an die Seite. Alles andere fängt vorn an und wandert
       herum, bis es Platz findet.                             */
    if (d.andocken) {
      const halb = d.tiefe / 2, schritt = 20;
      const waende = { oben:{dreh:0, punkte:[]}, unten:{dreh:180, punkte:[]},
                       links:{dreh:270, punkte:[]}, rechts:{dreh:90, punkte:[]} };
      for (let x = schritt; x < raum.breite; x += schritt) {
        waende.oben.punkte.push({ x: x, y: halb });
        waende.unten.punkte.push({ x: x, y: raum.tiefe - halb });
      }
      for (let y = schritt; y < raum.tiefe; y += schritt) {
        waende.links.punkte.push({ x: halb, y: y });
        waende.rechts.punkte.push({ x: raum.breite - halb, y: y });
      }
      if (art === "tafel")
        waende.oben.punkte.sort((a, b) =>
          Math.abs(a.x - raum.breite / 2) - Math.abs(b.x - raum.breite / 2));

      const folge = art === "tafel" ? ["oben", "links", "rechts", "unten"]
                  : art === "tuer"  ? ["rechts", "unten", "links", "oben"]
                  :                   ["oben", "rechts", "unten", "links"];
      suchewand:
      for (const name of folge) {
        m.dreh = waende[name].dreh;
        for (const pkt of waende[name].punkte) {
          m.x = pkt.x; m.y = pkt.y;
          if (!ueberschneidet(m, raum.moebel)) break suchewand;
        }
      }
      einpassen(m, raum, true);
      raum.moebel.push(m);
      gewaehlt = m.id;
      return m;
    }
    {
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

  /* Hält ein Möbelstück im Raum und auf dem Raster.

     ohneRaster: für angedockte Tafeln und Türen. Sie liegen bündig
     an der Wand, und das Raster würde sie um bis zu 2,5 cm davon
     wegziehen – ein sichtbarer Spalt.                          */
  function einpassen(m, raum, ohneRaster) {
    const r = SITZ.raster;
    if (!ohneRaster) {
      m.x = Math.round(m.x / r) * r;
      m.y = Math.round(m.y / r) * r;
    }
    const h = halbeAusdehnung(m);
    m.x = Math.min(Math.max(m.x, h.x), raum.breite - h.x);
    m.y = Math.min(Math.max(m.y, h.y), raum.tiefe  - h.y);

    /* Auf hundertstel Zentimeter runden. cos(270°) ist im Rechner
       nicht ganz null; ohne das stünde in der gesicherten Datei
       6.0000000000000275 statt 6.                              */
    m.x = Math.round(m.x * 100) / 100;
    m.y = Math.round(m.y * 100) / 100;
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

    if (opt.bearbeiten) { bedienungAnhaengen(ziel, raum); griffeBauen(ziel, raum); }
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
      /* Einrichtung: entweder ein Bild von oben – so wie in einem
         Grundriss – oder, wenn keines hinterlegt ist, der Name.

         An der unteren Wand stünde die Beschriftung auf dem Kopf,
         sie dreht deshalb zurück. Bilder nicht: ein Sofa, das
         andersherum steht, SOLL andersherum aussehen.           */
      if (!d.plaetze) {
        if (d.bild) inhalt.push(`<span class="bild">${d.bild}</span>`);
        else {
          const gegen = m.dreh > 90 && m.dreh < 270 ? 180 : 0;
          inhalt.push(`<span class="beschriftung" style="transform:rotate(${gegen}deg)">` +
                      `${d.name}</span>`);
        }
      }

      const markiert = opt.bearbeiten && gewaehlt === m.id ? " gewaehlt" : "";
      /* Die Ebene steht in daten.js: der Teppich liegt am Boden,
         die Tische darüber. Inline gesetzt, damit ein neues
         Möbelstück ohne Eingriff ins CSS auskommt.             */
      return `<div class="moebel ${m.art}${markiert}" data-id="${m.id}"
                   title="${entschaerfen(d.name)}"
                   style="left:${m.x - d.breite / 2}${e}; top:${m.y - d.tiefe / 2}${e};
                          width:${d.breite}${e}; height:${d.tiefe}${e};
                          z-index:${d.ebene || 3};
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

  /* Eine Bewegung mitverfolgen, bis der Zeiger losgelassen wird.

     Die Ereignisse hängen am FENSTER, nicht am angefassten Element.
     Das ist der Unterschied zwischen „geht" und „geht nicht": beim
     Drehen verlässt die Maus den kleinen Knopf sofort, und ein
     Zuhörer auf dem Knopf bekäme danach nichts mehr mit.
     setPointerCapture wäre der andere Weg, ist aber Komfort und
     keine Verlassenheit — schlägt es fehl, hört hier trotzdem
     jemand zu.                                                   */
  function bewegungVerfolgen(beiBewegung) {
    let etwasGetan = false;

    const bewegen = ev => { beiBewegung(ev); etwasGetan = true; };
    const fertig = () => {
      window.removeEventListener("pointermove", bewegen);
      window.removeEventListener("pointerup", fertig);
      window.removeEventListener("pointercancel", fertig);
      if (etwasGetan) beiAenderung();
    };

    window.addEventListener("pointermove", bewegen);
    window.addEventListener("pointerup", fertig);
    window.addEventListener("pointercancel", fertig);
  }

  function bedienungAnhaengen(ziel, raum) {
    const flaeche = ziel.querySelector(".flaeche");

    /* Pointer-Ereignisse statt Maus- oder Berührungsereignisse:
       damit gilt derselbe Code für Maus, Finger und Stift.    */
    flaeche.addEventListener("pointerdown", e => {
      const kasten = e.target.closest(".moebel");
      if (!kasten) { gewaehlt = null; markieren(ziel); griffeBauen(ziel, raum); return; }

      const m = raum.moebel.find(x => x.id === kasten.dataset.id);
      gewaehlt = m.id;
      markieren(ziel); griffeBauen(ziel, raum);

      const startX = e.clientX, startY = e.clientY;
      const ausgangX = m.x, ausgangY = m.y;

      bewegungVerfolgen(ev => {
        /* Der Weg auf dem Bildschirm geteilt durch den Maßstab
           ergibt den Weg im Raum – in Zentimetern.            */
        m.x = ausgangX + (ev.clientX - startX) / masstab;
        m.y = ausgangY + (ev.clientY - startY) / masstab;

        /* Tafel und Tür suchen sich beim Schieben die Wand. */
        const haengt = SITZ.moebel[m.art].andocken ? andocken(m, raum) : false;
        einpassen(m, raum, haengt);

        stellungSetzen(ziel, m);
        griffeStellen(ziel, raum);
      });
      e.preventDefault();
    });
  }

  /* ---------------------------------------------------------
     Andocken: Tafel und Tür gehören an die Wand
     ---------------------------------------------------------
     Beim Schieben suchen sie sich die nächste Wand und legen sich
     bündig daran – mitsamt der Drehung, die dorthin gehört. Die
     Winkel sind so gewählt, dass der TÜRBOGEN in den Raum zeigt
     und nicht in die Wand hinein.

     Weiter als SITZ.andockweite von jeder Wand entfernt bleiben
     beide frei stehen; man soll eine Tafel auch mitten in den Raum
     stellen können.                                            */
  function andocken(m, raum) {
    const halb = SITZ.moebel[m.art].tiefe / 2;

    const waende = [
      { weg: m.y,                dreh:  0, x: m.x,                    y: halb },
      { weg: raum.tiefe  - m.y,  dreh:180, x: m.x,                    y: raum.tiefe  - halb },
      { weg: m.x,                dreh:270, x: halb,                   y: m.y },
      { weg: raum.breite - m.x,  dreh: 90, x: raum.breite - halb,     y: m.y }
    ];
    const naechste = waende.sort((a, b) => a.weg - b.weg)[0];
    if (naechste.weg > SITZ.andockweite) return false;

    m.dreh = naechste.dreh; m.x = naechste.x; m.y = naechste.y;
    return true;
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
     kleinen Bildschirmen nicht mehr zu treffen.

     Zwei getrennte Aufgaben, und das mit Absicht:
       griffeBauen  – Knöpfe neu erzeugen (Auswahl hat gewechselt)
       griffeStellen– nur neu hinlegen (Tisch bewegt sich gerade)
     Beim Drehen und Schieben darf NICHT neu gebaut werden: der
     Knopf, an dem der Finger hängt, würde mitten in der Bewegung
     weggeworfen und die Zeigerübernahme risse ab.               */
  function griffeStellen(ziel, raum) {
    const kasten = ziel.querySelector("#griffe");
    const buehne = ziel.querySelector(".buehne");
    const m = kasten && buehne && raum.moebel.find(x => x.id === gewaehlt);
    if (!kasten || !buehne || !m) return;

    /* Der Versatz der Bühne MUSS mit hinein. Die Griffe hängen am
       .raum, die Bühne liegt darin mittig – ohne diese beiden
       Werte landet die Leiste um genau diesen Rand daneben, und
       zwar oben und links. Genau so sah sie „zu weit weg" aus. */
    const mx = buehne.offsetLeft + m.x * masstab;
    const h  = halbeAusdehnung(m);
    /* 12 px Luft nach beiden Seiten. Weniger, und der Schlagschatten
       der Leiste überbrückt die Lücke – dann sieht sie aus, als
       klebte sie am Tisch, obwohl sie ihn nicht berührt.        */
    const luft = 12;
    const obenY  = buehne.offsetTop + (m.y - h.y) * masstab - luft;
    const untenY = buehne.offsetTop + (m.y + h.y) * masstab + luft;

    /* Steht das Möbel ganz oben – die Tafel an der vorderen Wand –,
       wäre die Leiste über dem Raum abgeschnitten. Dann darunter. */
    const hoch = kasten.offsetHeight || 44;
    const unten = obenY - hoch < 2;
    kasten.classList.toggle("unten", unten);

    /* Und am linken oder rechten Rand nicht hinauslaufen. */
    const halbeBreite = (kasten.offsetWidth || 160) / 2;
    kasten.style.left = Math.min(Math.max(mx, halbeBreite + 2),
                                 ziel.clientWidth - halbeBreite - 2) + "px";
    kasten.style.top  = (unten ? untenY : obenY) + "px";
  }

  function griffeBauen(ziel, raum) {
    const kasten = ziel.querySelector("#griffe");
    if (!kasten) return;
    const m = raum.moebel.find(x => x.id === gewaehlt);
    if (!m) { kasten.hidden = true; return; }

    /* Tafel und Tür lassen sich nicht in einen Tisch verwandeln. */
    const istTisch = SITZ.moebel[m.art].plaetze > 0;
    const ziel_art = m.art === "zweier" ? "einzel" : "zweier";

    kasten.hidden = false;
    kasten.innerHTML =
      `<button data-tun="drehen" class="drehen"
               title="Ziehen zum Drehen &#183; Umschalttaste für feine Winkel">&#8635;</button>` +
      (istTisch
        ? `<button data-tun="wandeln" title="${SITZ.moebel[ziel_art].name} daraus machen">
             <span class="sinnbild ${ziel_art === "zweier" ? "zwei" : "ein"}"></span></button>`
        : "") +
      `<button data-tun="kopie" title="Noch so einen">&#10697;</button>
       <button data-tun="weg" class="weg" title="Wegnehmen">&times;</button>`;
    griffeStellen(ziel, raum);

    /* Drehen hängt am Ziehen, nicht am Klicken. */
    drehenAnhaengen(kasten.querySelector('[data-tun="drehen"]'), m, raum, ziel);

    kasten.querySelectorAll('button:not([data-tun="drehen"])').forEach(b =>
      b.addEventListener("click", () => {
        const tun = b.dataset.tun;
        if (tun === "wandeln") {
          m.art = ziel_art;
          einpassen(m, raum);          // der neue Tisch ist anders groß
        }
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
        beiAenderung();
      }));
  }

  /* Drehen mit der Maus (und mit dem Finger): der Winkel ergibt sich
     aus der Linie vom Tischmittelpunkt zum Zeiger. Gerechnet wird mit
     der DIFFERENZ zum Winkel beim Anfassen – sonst spränge der Tisch
     beim ersten Antippen auf den Zeiger.

     Gerastet wird auf SITZ.drehschritt, damit Reihen gerade bleiben;
     mit gedrückter Umschalttaste geht es gradgenau.                */
  function drehenAnhaengen(knopf, m, raum, ziel) {
    if (!knopf) return;

    knopf.addEventListener("pointerdown", e => {
      const buehne = ziel.querySelector(".buehne").getBoundingClientRect();
      const mx = buehne.left + m.x * masstab;
      const my = buehne.top  + m.y * masstab;
      const winkel = ev => Math.atan2(ev.clientY - my, ev.clientX - mx) * 180 / Math.PI;

      const startWinkel = winkel(e), startDreh = m.dreh;

      bewegungVerfolgen(ev => {
        const schritt = ev.shiftKey ? 1 : SITZ.drehschritt;
        const roh = startDreh + (winkel(ev) - startWinkel);
        m.dreh = ((Math.round(roh / schritt) * schritt % 360) + 360) % 360;
        einpassen(m, raum);           // gedreht braucht der Tisch mehr Platz
        stellungSetzen(ziel, m);
        griffeStellen(ziel, raum);
      });

      e.preventDefault();
      e.stopPropagation();
    });
  }

  return {
    zeichnen, aufbau, plaetze, neuesMoebel, halbeAusdehnung, einpassen, andocken,
    get masstab() { return masstab; },
    get gewaehlt() { return gewaehlt; },
    set gewaehlt(v) { gewaehlt = v; },
    /* Setter UND Getter. Vorher gab es nur den Setter – wer
       RAUM.aenderung() rufen wollte, bekam undefined und einen
       Absturz. Genau daran ist das Hinzufügen von Tischen
       gescheitert.                                            */
    get aenderung() { return beiAenderung; },
    set aenderung(fn) { beiAenderung = fn; }
  };
})();
