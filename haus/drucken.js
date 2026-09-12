/* ============================================================
   DRUCKEN.JS  –  was beim Drucken für ALLE Werkzeuge gilt.

   Bis hierher stand das zweimal fast wortgleich in der Werkstatt:
   einmal im Stundenplan, einmal in der Sitzordnung. Mit dem
   dritten Werkzeug lohnt sich die eine Stelle.

   ACHTUNG, das ist der Grund für die etwas umständliche Form:
   Beide Werkzeuge bauen fertige Einzeldateien zum Weitergeben.
   Darin darf NICHTS stehen, was nachgeladen werden müsste – die
   Datei liegt später irgendwo auf einem Rechner, ohne dieses
   Verzeichnis daneben. Deshalb geben die Funktionen hier CSS als
   TEXT zurück, der in das Stylesheet des Blattes eingesetzt wird.
   Der Text reist dann mit; diese Datei selbst muss es nicht.
   ============================================================ */

const DRUCK = {

  /* ---- Der Safari-Kniff --------------------------------------

     Safari hält sich weder an "size" noch an "margin" in "@page"
     und legt beim Drucken einen eigenen Rand an – auf dem iPad
     wie am Mac. Unsere Blätter sind aber genau so groß wie das
     Papier; was überhängt, landet auf einer zweiten, fast leeren
     Seite.

     Deshalb druckt Safari das Blatt um ein Zehntel kleiner.

     Der Wert ist GEMESSEN, nicht geschätzt: Peter hat auf dem
     iPad eine Testseite mit 100/95/90/85/80 % gedruckt. 95 %
     passte nicht mehr, 90 % passt. Es entsteht dabei kein
     zusätzlicher weißer Rand – der Rand ist genau der, den Safari
     ohnehin erzwingt.

     Die Abfrage trifft NUR Safari: Chrome und Firefox kennen
     "-webkit-hyphens" nicht (in Chrome 151 nachgeprüft). Und sie
     gilt nur beim Drucken; am Bildschirm ändert sich nichts.

     "zoom" und nicht "transform": zoom verkleinert auch den
     Platzbedarf im Seitenlayout. Mit transform bliebe die alte
     Größe stehen und die zweite Seite käme trotzdem.

     selektor  was verkleinert werden soll – bei uns immer der
               äußere Rahmen, der die Papiergröße hat.            */
  kleinerInSafari(selektor) {
    return `@supports (-webkit-hyphens: none){
  @media print{
    ${selektor}{ zoom: 0.9; }
  }
}`;
  },

  /* ---- Welches Papier der Drucker einziehen soll --------------

     Steht in einem eigenen Stil-Element, das mit der Formatwahl
     wechselt – "@page" lässt sich nicht mitten im Blatt setzen.

     format  ein Eintrag aus den Formaten des Werkzeugs, also
             { name, breite, hoehe, seite }. Gebraucht wird nur
             "seite", z. B. "A4 landscape".                      */
  seitengroesse(format) {
    return `@page{ size:${format.seite}; margin:0 }`;
  }
};
