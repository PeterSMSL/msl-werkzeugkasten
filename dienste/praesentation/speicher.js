/* ============================================================
   SPEICHER.JS  –  wo der Stand zwischen zwei Besuchen liegt.

   Hier steckt ein Fund, der die Bauweise bestimmt hat:

   BEIM DOPPELKLICK VON DER FESTPLATTE GIBT ES KEIN IndexedDB.
   Und zwar nicht so, dass es einen Fehler meldete – es antwortet
   schlicht NIE. Weder Erfolg noch Fehler, die Anfrage hängt für
   immer. Nachgeprüft in Chrome 152 mit einer Seite über file://.
   Wer darauf wartet, wartet ewig, und die Werkstatt bliebe leer.

   Deshalb dieser Aufbau:

     1. Beim Start wird EINMAL ausprobiert, was geht – mit einer
        Zeitgrenze, weil Hängen eben kein Fehler ist.
     2. Geht IndexedDB (auf einer Adresse mit http/https, also auf
        der Schulseite), wird es benutzt. Der Platz ist dort groß
        genug für Folien mit Bildern.
     3. Geht es nicht, tut es der localStorage. Der reicht für
        Folien aus Text bequem, hat aber rund fünf Megabyte – mit
        Bildern wird es dort eng. "platzKnapp" sagt das, damit die
        Werkstatt es der Lehrkraft sagen kann statt still zu
        scheitern.

   Und wie überall hier: der Stand liegt auf DIESEM Rechner, in
   DIESEM Browser. Er wird nirgendwohin geschickt.
   ============================================================ */

const SPEICHER = (function () {

  const NAME = "msl-folienwerkstatt";
  const FACH = "stand";
  /* Unter diesem Namen liegt es im localStorage – ein Fach je
     Schlüssel, damit die Vorlagen nicht am Stand hängen.      */
  const VORNE = "msl-folienwerkstatt-";

  /* Wie lange auf IndexedDB gewartet wird. Auf einer richtigen
     Adresse antwortet es in wenigen Millisekunden; die Grenze
     greift nur im Festplatten-Fall, und dort einmalig.       */
  const GEDULD = 900;

  let weg = null;          // "idb" | "lokal" | "nichts"
  let datenbank = null;
  let ermittelt = null;    // das Versprechen, das den Weg sucht

  /* ---- Einmal herausfinden, was dieser Browser hergibt ---- */
  function wegSuchen() {
    if (ermittelt) return ermittelt;

    ermittelt = new Promise(function (fertig) {
      let entschieden = false;
      const nimm = function (w, db) {
        if (entschieden) return;
        entschieden = true; weg = w; datenbank = db || null; fertig(w);
      };

      /* Die Zeitgrenze läuft IMMER mit – sie ist der eigentliche
         Grund, warum es diese Funktion gibt.                 */
      setTimeout(function () { nimm(lokalGeht() ? "lokal" : "nichts"); }, GEDULD);

      let anfrage;
      try { anfrage = indexedDB.open(NAME, 1); }
      catch (e) { nimm(lokalGeht() ? "lokal" : "nichts"); return; }

      anfrage.onupgradeneeded = function () {
        const db = anfrage.result;
        if (!db.objectStoreNames.contains(FACH)) db.createObjectStore(FACH);
      };
      anfrage.onsuccess = function () { nimm("idb", anfrage.result); };
      anfrage.onerror   = function () { nimm(lokalGeht() ? "lokal" : "nichts"); };
      anfrage.onblocked = function () { nimm(lokalGeht() ? "lokal" : "nichts"); };
    });
    return ermittelt;
  }

  function lokalGeht() {
    try {
      localStorage.setItem(VORNE + "probe", "1");
      localStorage.removeItem(VORNE + "probe");
      return true;
    } catch (e) { return false; }
  }

  /* ---- Lesen ---- */
  function lesen(schluessel) {
    return wegSuchen().then(function (w) {
      if (w === "idb") return new Promise(function (fertig) {
        try {
          const a = datenbank.transaction(FACH, "readonly").objectStore(FACH).get(schluessel);
          a.onsuccess = function () { fertig(a.result || null); };
          a.onerror   = function () { fertig(null); };
        } catch (e) { fertig(null); }
      });

      if (w === "lokal") {
        try {
          const roh = localStorage.getItem(VORNE + schluessel);
          return roh ? JSON.parse(roh) : null;
        } catch (e) { return null; }
      }
      return null;
    });
  }

  /* ---- Schreiben ----
     Gibt zurück, ob es geklappt hat. Die Werkstatt fragt das ab:
     ein Speicher, der nicht speichert, muss sich melden.      */
  function schreiben(schluessel, wert) {
    return wegSuchen().then(function (w) {
      if (w === "idb") return new Promise(function (fertig) {
        try {
          const t = datenbank.transaction(FACH, "readwrite");
          t.objectStore(FACH).put(wert, schluessel);
          t.oncomplete = function () { fertig(true); };
          t.onerror    = function () { fertig(false); };
          t.onabort    = function () { fertig(false); };   // Platte voll
        } catch (e) { fertig(false); }
      });

      if (w === "lokal") {
        try {
          localStorage.setItem(VORNE + schluessel, JSON.stringify(wert));
          return true;
        } catch (e) {
          /* Hier landet der volle localStorage – die fünf Megabyte.
             Genau dafür gibt es "platzKnapp".                    */
          return false;
        }
      }
      return false;
    });
  }

  function leeren(schluessel) {
    return wegSuchen().then(function (w) {
      if (w === "idb") return new Promise(function (fertig) {
        try {
          const t = datenbank.transaction(FACH, "readwrite");
          t.objectStore(FACH).delete(schluessel);
          t.oncomplete = function () { fertig(true); };
          t.onerror    = function () { fertig(false); };
        } catch (e) { fertig(false); }
      });
      if (w === "lokal") {
        try { localStorage.removeItem(VORNE + schluessel); return true; }
        catch (e) { return false; }
      }
      return false;
    });
  }

  return {
    lesen: lesen, schreiben: schreiben, leeren: leeren,
    bereit: wegSuchen,

    /* Welcher Weg es geworden ist – vor dem ersten Lesen "null". */
    get weg() { return weg; },

    /* Gar kein Speicher: privates Fenster, gesperrte Seitendaten. */
    get klemmt() { return weg === "nichts"; },

    /* Nur der kleine Speicher. Für Text reicht er mühelos; sobald
       Bilder dazukommen, muss die Werkstatt es sagen.          */
    get platzKnapp() { return weg === "lokal"; }
  };
})();
