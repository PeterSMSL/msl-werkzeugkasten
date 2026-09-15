/* ============================================================
   VERTEILEN.JS  –  der Zufall und die pädagogische Bremse.

   Der Rechner würfelt eine Sitzordnung und prüft, ob sie zu den
   Regeln passt. Passt sie nicht, würfelt er neu. Nach vielen
   vergeblichen Versuchen hört er auf und sagt, woran es liegt –
   das ist wichtiger, als irgendetwas auszugeben.

   Es gibt zwei Regelarten, und beide meinen dasselbe Wort
   "nebeneinander": zusammen an EINEM Zweiertisch.
     Pflichtpaar    – diese beiden müssen zusammensitzen
     Ausschlusspaar – diese beiden dürfen es nicht
   ============================================================ */

const VERTEILEN = (function () {

  /* Mischen nach Fisher und Yates: jede Reihenfolge ist gleich
     wahrscheinlich. Kein sort(() => Math.random() - .5) – das
     ist nachweislich schief.                                  */
  function mischen(liste) {
    const a = liste.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* Der Schlüssel eines Paares, unabhängig von der Reihenfolge.

     Getrennt wird mit \u0000 und NICHT mit einem Leerzeichen: sonst
     ergaeben "Anna" + "Lea Marie" und "Anna Lea" + "Marie" denselben
     Schlüssel, und ein Kind gälte fälschlich als verpaart oder
     getrennt. In einem Namen kommt dieses Zeichen nicht vor.

     Als Escape-Folge geschrieben, nicht als rohes Byte – sonst hält
     Git die Datei für binär und jeder Editor kann sie zerstören. */
  function paarSchluessel(a, b) { return [a, b].sort().join("\u0000"); }

  /* Dürfen diese beiden an EINEN Zweiertisch?

     Bei „Die Neuen verteilen" nicht, wenn beide aus dem ersten
     Jahrgang kommen. Kinder ohne eingetragenen Jahrgang stehen
     dieser Regel nie im Weg – wer nichts einträgt, soll nicht
     bestraft werden.                                           */
  function mischungErlaubt(a, b, regeln) {
    if (regeln.mischung !== "neue") return true;
    const erste = regeln.jahrgaenge && regeln.jahrgaenge[0];
    if (!erste) return true;
    const j = regeln.jahrgang || {};
    return !(j[a] === erste.id && j[b] === erste.id);
  }

  /* ---------------------------------------------------------
     Erst prüfen, dann würfeln.
     Alles, was sich vorher als unmöglich erkennen lässt, soll
     als klarer Satz herauskommen und nicht als "geht nicht".
     --------------------------------------------------------- */
  function pruefen(kinder, plaetze, regeln) {
    if (!plaetze.length)
      return "Im Klassenzimmer steht noch kein Tisch. Lege im Schritt " +
             "„Klassenzimmer“ zuerst die Tische an.";

    if (!kinder.length)
      return "Es steht noch kein Name in der Liste.";

    /* Zwei Kinder mit demselben Namen: dann weiß niemand, welches
       von beiden eine Regel meint.                              */
    const doppelt = kinder.filter((n, i) => kinder.indexOf(n) !== i);
    if (doppelt.length)
      return "„" + doppelt[0] + "“ steht zweimal in der Namensliste. " +
             "Bitte unterscheidbar machen, sonst ist nicht klar, wen eine Regel meint – " +
             "zum Beispiel „" + doppelt[0] + " K.“ und „" + doppelt[0] + " S.“";

    if (kinder.length > plaetze.length)
      return "Es sind " + kinder.length + " Kinder, aber nur " + plaetze.length + " Plätze. " +
             "Es fehlen " + (kinder.length - plaetze.length) +
             " Plätze – stelle noch Tische dazu.";

    /* Namen in Regeln, die es in der Liste nicht gibt. Meist ein
       Tippfehler oder ein Kind, das die Klasse verlassen hat.   */
    const bekannt = new Set(kinder);
    const listen = [["Pflichtpaar", regeln.pflicht], ["Ausschlusspaar", regeln.tabu]];
    for (const [art, paare] of listen)
      for (const [a, b] of paare)
        for (const n of [a, b])
          if (!bekannt.has(n))
            return "„" + n + "“ steht in einem " + art +
                   ", aber nicht in der Namensliste.";

    /* Dieselben zwei Kinder in beiden Listen. */
    const tabuSet = new Set(regeln.tabu.map(([a, b]) => paarSchluessel(a, b)));
    for (const [a, b] of regeln.pflicht)
      if (tabuSet.has(paarSchluessel(a, b)))
        return "„" + a + "“ und „" + b + "“ sollen gleichzeitig " +
               "zusammensitzen und nicht zusammensitzen. Eine der beiden Regeln muss weg.";

    /* Ein Kind in zwei Pflichtpaaren: an einen Zweiertisch passen
       keine drei.                                               */
    const zaehler = {};
    for (const [a, b] of regeln.pflicht)
      for (const n of [a, b]) {
        zaehler[n] = (zaehler[n] || 0) + 1;
        if (zaehler[n] > 1) {
          const partner = regeln.pflicht
            .filter(p => p.indexOf(n) >= 0)
            .map(p => p.find(x => x !== n))
            .map(p => "„" + p + "“");
          return "„" + n + "“ soll fest mit " + partner.join(" und mit ") +
                 " zusammensitzen. An einem Zweiertisch ist nur für zwei Platz.";
        }
      }

    const zweiertische = new Set(plaetze.filter(p => p.paar).map(p => p.moebel));
    if (regeln.pflicht.length > zweiertische.size)
      return "Es gibt " + regeln.pflicht.length + " Pflichtpaare, aber nur " +
             zweiertische.size + " " +
             (zweiertische.size === 1 ? "Zweiertisch" : "Zweiertische") +
             ". Jedes Pflichtpaar braucht einen eigenen.";

    /* ---- Die Mischung ---------------------------------------
       Sie hat eine harte Obergrenze: an einen Zweiertisch passt
       höchstens ein Kind aus dem ersten Jahrgang, an einen
       Einzeltisch auch. Mehr Neue als Tische geht nicht, und das
       muss vorher gesagt werden statt tausendmal vergeblich
       gewürfelt.                                               */
    if (regeln.mischung === "neue" && regeln.jahrgaenge && regeln.jahrgaenge.length) {
      const jg = regeln.jahrgaenge[0];
      const art = SITZ.mischungen.find(m => m.id === "neue");
      const j = regeln.jahrgang || {};
      const neue = kinder.filter(k => j[k] === jg.id);

      for (const [a, b] of regeln.pflicht)
        if (j[a] === jg.id && j[b] === jg.id)
          return "„" + a + "“ und „" + b + "“ sind beide aus " + jg.name +
                 " und sollen zusammensitzen. Das verträgt sich nicht mit " +
                 "der Mischung „" + art.name + "“. Nimm entweder das " +
                 "Pflichtpaar weg oder stelle die Mischung auf „" +
                 SITZ.mischungen[0].name + "“.";

      const zweiertische = new Set(plaetze.filter(p => p.paar).map(p => p.moebel)).size;
      const einzeltische = plaetze.filter(p => !p.paar).length;

      /* Ein Pflichtpaar belegt einen ganzen Tisch. Sitzt darin schon
         ein Kind der untersten Stufe, ist dieses versorgt – beides
         muss abgezogen werden, sonst rechnet die Grenze falsch.   */
      const inPflicht = [].concat.apply([], regeln.pflicht)
                          .filter(n => j[n] === jg.id).length;
      const uebrige = neue.length - inPflicht;
      const freieTische = zweiertische + einzeltische - regeln.pflicht.length;

      if (uebrige > freieTische)
        return "Es sind " + neue.length + " Kinder aus " + jg.name + ", aber nur " +
               freieTische + " " + (freieTische === 1 ? "Tisch" : "Tische") +
               " für sie frei (" + zweiertische + " Zweiertische, " +
               einzeltische + " Einzeltische" +
               (regeln.pflicht.length
                  ? ", davon " + regeln.pflicht.length + " durch Pflichtpaare belegt" : "") +
               "). An jedem Tisch darf nur eines von ihnen sitzen. " +
               "Stelle mehr Tische dazu oder stelle die Mischung auf „" +
               SITZ.mischungen[0].name + "“.";
    }

    return null;   // nichts einzuwenden
  }

  /* ---------------------------------------------------------
     Ein Wurf. Gibt eine Belegung zurück oder null, wenn dieser
     Wurf sich an den Regeln festgefahren hat.
     --------------------------------------------------------- */
  function einWurf(kinder, einheiten, regeln, tabu) {
    /* Gearbeitet wird auf TISCHEN, nicht auf Plätzen: alle Regeln
       reden von „nebeneinander", und das ist eine Eigenschaft des
       Tisches. Erst ganz am Ende werden die Kinder auf die beiden
       Sitze verteilt.                                            */
    const tische = mischen(einheiten).map(e => ({ e: e, wer: [] }));

    const passt = (t, name) => {
      if (t.wer.length >= (t.e.paar ? 2 : 1)) return false;
      return t.wer.every(x => !tabu.has(paarSchluessel(x, name)) &&
                              mischungErlaubt(x, name, regeln));
    };
    const einer = liste => liste[Math.floor(Math.random() * liste.length)];

    /* 1. Die Pflichtpaare – sie sind am unbeweglichsten und
          brauchen jeweils einen ganzen Zweiertisch.            */
    const paartische = tische.filter(t => t.e.paar);
    let i = 0;
    for (const [a, b] of regeln.pflicht) {
      const t = paartische[i++];
      if (!t) return null;
      t.wer.push(a, b);
    }

    const vergeben = new Set([].concat.apply([], regeln.pflicht));
    let rest = kinder.filter(k => !vergeben.has(k));

    /* 2. Die Kinder der untersten Stufe, jedes auf einen EIGENEN
          noch leeren Tisch.

          Das ist der Kern der Sache. Vorher wurden die Tische
          stur zu zweit gefüllt – bei zwölf Kindern, davon sieben
          aus Stufe 1, gingen dabei die Partner aus, obwohl die
          Aufstellung lösbar ist (fünf Paare, zwei sitzen allein).
          Wer eine Einschränkung hat, wird zuerst gesetzt.       */
    if (regeln.mischung === "neue" && regeln.jahrgaenge && regeln.jahrgaenge.length) {
      const erste = regeln.jahrgaenge[0].id;
      const j = regeln.jahrgang || {};
      for (const kind of mischen(rest.filter(k => j[k] === erste))) {
        const leer = tische.filter(t => !t.wer.length);
        if (!leer.length) return null;
        einer(leer).wer.push(kind);
      }
      rest = rest.filter(k => j[k] !== erste);
    }

    /* 3. Alle übrigen. Wer die meisten Ausschlüsse hat, kommt
          zuerst dran – zum Schluss ist die Auswahl am kleinsten.

          Bevorzugt wird ein Tisch, an dem schon jemand sitzt:
          sonst verteilten sich die Kinder bei vielen freien
          Plätzen einzeln über den ganzen Raum.                 */
    const verbote = name =>
      kinder.filter(x => x !== name && tabu.has(paarSchluessel(name, x))).length;
    rest = mischen(rest).sort((a, b) => verbote(b) - verbote(a));

    for (const kind of rest) {
      const halbe = tische.filter(t => t.wer.length === 1 && passt(t, kind));
      const leere = tische.filter(t => !t.wer.length && passt(t, kind));
      const auswahl = halbe.length ? halbe : leere;
      if (!auswahl.length) return null;
      einer(auswahl).wer.push(kind);
    }

    /* Zum Schluss auf die Sitze – auch innerhalb des Tisches
       gewürfelt, sonst säße das zuerst gezogene Kind immer links. */
    const belegung = {};
    tische.forEach(t => {
      const sitze = Math.random() < 0.5 ? t.e.plaetze : t.e.plaetze.slice().reverse();
      t.wer.forEach((name, k) => { if (sitze[k]) belegung[sitze[k].schluessel] = name; });
    });
    return belegung;
  }

  /* ---------------------------------------------------------
     Der Aufruf von außen.
     --------------------------------------------------------- */
  function loesen(kinder, plaetze, regeln) {
    const beschwerde = pruefen(kinder, plaetze, regeln);
    if (beschwerde) return { ok: false, grund: beschwerde };

    /* Die Plätze zu Tischen bündeln – gewürfelt wird tischweise,
       denn ein Paar ist ein Tisch.                             */
    const nachTisch = {};
    plaetze.forEach(p => {
      if (!nachTisch[p.moebel])
        nachTisch[p.moebel] = { id: p.moebel, paar: p.paar, plaetze: [] };
      nachTisch[p.moebel].plaetze.push(p);
    });
    const einheiten = Object.keys(nachTisch).map(k => nachTisch[k]);
    const tabu = new Set(regeln.tabu.map(([a, b]) => paarSchluessel(a, b)));

    for (let versuch = 1; versuch <= SITZ.versuche; versuch++) {
      const belegung = einWurf(kinder, einheiten, regeln, tabu);
      if (belegung) return { ok: true, belegung: belegung, versuche: versuch };
    }

    return { ok: false, grund: engstelle(kinder, tabu, regeln) };
  }

  /* Nach vielen vergeblichen Würfen: sagen, wer am meisten
     eingeschränkt ist. Das ist fast immer das Kind, an dem es
     hängt – und die Lehrkraft weiß dann, welche Regel sie
     lockern kann.                                             */
  function engstelle(kinder, tabu, regeln) {
    let schlimmster = null, meiste = 0;
    kinder.forEach(k => {
      const n = kinder.filter(a => a !== k && tabu.has(paarSchluessel(k, a))).length;
      if (n > meiste) { meiste = n; schlimmster = k; }
    });

    let satz = "Mit diesen Regeln ließ sich keine Sitzordnung finden.";

    /* Ein Kind NUR dann beim Namen nennen, wenn es wirklich stark
       eingeschränkt ist. Bei einem einzigen Ausschluss ist es fast
       nie die Ursache, und der Hinweis schickte die Lehrkraft auf
       die falsche Fährte – genau das ist passiert.              */
    if (schlimmster && meiste >= kinder.length - 2)
      satz += " „" + schlimmster + "“ darf neben fast niemandem sitzen (" +
              meiste + " von " + (kinder.length - 1) + " Kindern ausgeschlossen).";
    else if (schlimmster && meiste >= 3)
      satz += " Am stärksten eingeschränkt ist „" + schlimmster +
              "“ mit " + meiste + " Ausschlüssen.";

    /* Was man tun kann – die wahrscheinlichste Ursache zuerst. */
    const wege = [];
    if (regeln && regeln.mischung === "neue")
      wege.push("die Mischung auf „" + SITZ.mischungen[0].name + "“ stellen");
    if (tabu.size) wege.push("ein Ausschlusspaar herausnehmen");
    if (regeln && regeln.pflicht && regeln.pflicht.length)
      wege.push("ein Pflichtpaar herausnehmen");
    wege.push("einen Zweiertisch mehr dazustellen");

    return satz + " Was hilft: " + wege.join(", ") + ".";
  }

  /* ---------------------------------------------------------
     Eine FERTIGE Belegung gegen die Regeln halten.

     Gebraucht, wenn die Lehrkraft von Hand getauscht hat. Das darf
     sie – sie entscheidet bewusst. Deshalb wird hier nichts
     verboten, nur gesagt, welche Regel jetzt nicht mehr stimmt.

     Zurück kommt eine Liste ganzer Sätze, leer wenn alles passt.
     Die Namen stehen roh darin; wer sie in HTML setzt, entschärft.
     --------------------------------------------------------- */
  function verstoesse(belegung, plaetze, regeln) {
    /* Wer sitzt an welchem Tisch? "Nebeneinander" heißt hier wie
       überall in dieser Datei: am selben Tisch.                 */
    const tisch = {};
    const amTisch = {};
    plaetze.forEach(p => {
      const n = belegung[p.schluessel];
      if (!n) return;
      tisch[n] = p.moebel;
      (amTisch[p.moebel] = amTisch[p.moebel] || []).push(n);
    });
    const sitzt = n => tisch[n] !== undefined;
    const saetze = [];

    (regeln.pflicht || []).forEach(([a, b]) => {
      if (sitzt(a) && sitzt(b) && tisch[a] !== tisch[b])
        saetze.push("„" + a + "“ und „" + b + "“ sollen zusammensitzen, " +
                    "sitzen jetzt aber getrennt.");
    });

    (regeln.tabu || []).forEach(([a, b]) => {
      if (sitzt(a) && tisch[a] === tisch[b])
        saetze.push("„" + a + "“ und „" + b + "“ sollen nicht zusammensitzen, " +
                    "sitzen jetzt aber an einem Tisch.");
    });

    Object.keys(amTisch).forEach(id => {
      const [a, b] = amTisch[id];
      if (b !== undefined && !mischungErlaubt(a, b, regeln))
        saetze.push("„" + a + "“ und „" + b + "“ sind beide aus " +
                    regeln.jahrgaenge[0].name + " und sitzen jetzt an einem Tisch.");
    });

    return saetze;
  }

  return { loesen: loesen, pruefen: pruefen, mischen: mischen, verstoesse: verstoesse };
})();
