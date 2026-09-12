/* ============================================================
   PACKEN.JS  –  mehrere Dateien in EIN ZIP.

   Warum das hier steht und keine Bibliothek benutzt wird:

   Eine Präsentation mit Film besteht aus zwei Teilen – der
   HTML-Datei und dem Film daneben, in einem Ordner "medien".
   Ein Browser darf aber keine Ordner anlegen. Ohne diese Datei
   bekäme die Lehrkraft zwei einzelne Downloads und müsste den
   Ordner von Hand anlegen und die Datei hineinziehen. Peter beim
   Testen: „so konnte ich nicht testen". Das ist die richtige
   Antwort darauf.

   Mit einem ZIP ist es ein Download, der beim Entpacken die
   richtige Ablage mitbringt. Windows und macOS öffnen ZIP von
   sich aus, es muss nichts installiert werden.

   Warum selbst geschrieben: eine Bibliothek dafür wäre wieder
   etwas, das mitgeladen und gepflegt werden müsste. Das Format
   ist an dieser Stelle einfach – wir speichern OHNE Komprimierung
   (Verfahren 0, "store"). Das ist kein Verzicht: Filme und JPEG
   sind bereits komprimiert, da holt ein Packer nichts mehr heraus,
   und die HTML-Datei daneben fällt nicht ins Gewicht.
   ============================================================ */

const PACKEN = (function () {

  /* ---- Prüfsumme (CRC-32) ------------------------------------
     Die verlangt das ZIP-Format für jede Datei. Die Tabelle wird
     einmal berechnet und dann wiederverwendet.                 */
  let tabelle = null;

  function tabelleBauen() {
    tabelle = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      tabelle[i] = c >>> 0;
    }
  }

  function crc32(daten) {
    if (!tabelle) tabelleBauen();
    let c = 0xFFFFFFFF;
    for (let i = 0; i < daten.length; i++)
      c = tabelle[(c ^ daten[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  /* Dateinamen im ZIP sind UTF-8; das Sprachkennzeichen (Bit 11)
     sagt das den Packprogrammen, damit Umlaute heil ankommen.  */
  function alsBytes(text) { return new TextEncoder().encode(text); }

  /* ---- Kleine Schreibhilfe ---------------------------------- */
  function Schreiber() {
    const teile = [];
    let laenge = 0;
    return {
      dazu(bytes) { teile.push(bytes); laenge += bytes.length; },
      /* Zahlen stehen im ZIP mit dem niederwertigsten Byte zuerst. */
      zahl2(n) { this.dazu(new Uint8Array([n & 0xFF, (n >>> 8) & 0xFF])); },
      zahl4(n) { this.dazu(new Uint8Array([n & 0xFF, (n >>> 8) & 0xFF,
                                           (n >>> 16) & 0xFF, (n >>> 24) & 0xFF])); },
      get stand() { return laenge; },
      get teile() { return teile; }
    };
  }

  /* Datum und Uhrzeit im Format von MS-DOS – so alt ist ZIP.
     Sekunden nur in Zweierschritten, das Jahr ab 1980.        */
  function zeitstempel(d) {
    const zeit = ((d.getHours() & 31) << 11) | ((d.getMinutes() & 63) << 5) |
                 ((d.getSeconds() / 2) & 31);
    const datum = (((d.getFullYear() - 1980) & 127) << 9) |
                  (((d.getMonth() + 1) & 15) << 5) | (d.getDate() & 31);
    return { zeit: zeit, datum: datum };
  }

  /* ============================================================
     dateien : [{ name:"medien/Film.mp4", daten:Uint8Array }]
               Der Name darf Schrägstriche enthalten – daraus
               entstehen beim Entpacken die Ordner.
     Gibt einen Blob zurück, fertig zum Herunterladen.
     ============================================================ */
  function zip(dateien) {
    const jetzt = zeitstempel(new Date());
    const aus = Schreiber();
    const verzeichnis = [];

    dateien.forEach(d => {
      const name = alsBytes(d.name);
      const summe = crc32(d.daten);
      const beginn = aus.stand;

      /* ---- Kopf vor der Datei ---- */
      aus.zahl4(0x04034b50);      // Erkennungszeichen
      aus.zahl2(20);              // dafür nötige Fassung: 2.0
      aus.zahl2(0x0800);          // Bit 11: Name ist UTF-8
      aus.zahl2(0);               // Verfahren 0 = ohne Komprimierung
      aus.zahl2(jetzt.zeit);
      aus.zahl2(jetzt.datum);
      aus.zahl4(summe);
      aus.zahl4(d.daten.length);  // gepackt …
      aus.zahl4(d.daten.length);  // … und ungepackt, hier dasselbe
      aus.zahl2(name.length);
      aus.zahl2(0);               // kein Zusatzfeld
      aus.dazu(name);
      aus.dazu(d.daten);

      verzeichnis.push({ name: name, summe: summe,
                         laenge: d.daten.length, beginn: beginn });
    });

    /* ---- Das Inhaltsverzeichnis am Ende ---- */
    const verzBeginn = aus.stand;
    verzeichnis.forEach(e => {
      aus.zahl4(0x02014b50);
      aus.zahl2(20);              // erstellt von Fassung 2.0
      aus.zahl2(20);              // nötige Fassung 2.0
      aus.zahl2(0x0800);
      aus.zahl2(0);
      aus.zahl2(jetzt.zeit);
      aus.zahl2(jetzt.datum);
      aus.zahl4(e.summe);
      aus.zahl4(e.laenge);
      aus.zahl4(e.laenge);
      aus.zahl2(e.name.length);
      aus.zahl2(0);               // kein Zusatzfeld
      aus.zahl2(0);               // kein Kommentar
      aus.zahl2(0);               // erster Datenträger
      aus.zahl2(0);               // innere Eigenschaften
      aus.zahl4(0);               // äußere Eigenschaften
      aus.zahl4(e.beginn);
      aus.dazu(e.name);
    });
    const verzLaenge = aus.stand - verzBeginn;

    /* ---- Der Abschluss ---- */
    aus.zahl4(0x06054b50);
    aus.zahl2(0);                 // Datenträgernummer
    aus.zahl2(0);                 // Datenträger mit dem Verzeichnis
    aus.zahl2(verzeichnis.length);
    aus.zahl2(verzeichnis.length);
    aus.zahl4(verzLaenge);
    aus.zahl4(verzBeginn);
    aus.zahl2(0);                 // kein Kommentar

    return new Blob(aus.teile, { type: "application/zip" });
  }

  return { zip: zip, crc32: crc32 };
})();
