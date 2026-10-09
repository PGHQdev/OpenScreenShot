---
title: 'FireShot-Alternative: ein kostenloser Editor im Browser und Open Source'
description: FireShot vs. OpenScreenShot. Beide nehmen ganze Seiten lokal auf. OpenScreenShot ist Open Source und hat einen kostenlosen Editor im Browser und Tab-Aufnahme.
order: 4
---

Wechsle zu OpenScreenShot, wenn du Ganzseiten-Screenshots kostenlos im Browser anmerken und unscharf machen willst, auf jedem Betriebssystem, auf dem Chrome oder Firefox läuft, mit Code, den du lesen kannst. Bleib bei FireShot, wenn du PDFs mit funktionierenden Links, Stapel- oder automatisierte Aufnahmen oder die Extras von FireShot Pro brauchst, etwa erweiterten PDF-Export und einen Aufnahmeverlauf. OpenScreenShot speichert ein PDF als Bild, sein Text ist also nicht durchsuchbar, und seine Links funktionieren nicht. Es nimmt nur Webseiten auf und keine Desktop-Fenster und nicht den ganzen Bildschirm.

OpenScreenShot ist unser Produkt. Die Angaben zu FireShot auf dieser Seite haben den Stand vom 9. Oktober 2026 und stammen aus dem [Eintrag im Chrome Web Store](https://chromewebstore.google.com/detail/mcbpblocgmgfnpjjppndjkmgjaogfceg), der [Website](https://getfireshot.com/), der [Kaufseite](https://getfireshot.com/buy.php), der [Seite bei Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/fireshot/) und dem Manifest der Version 2.1.4.18 vom Update-Server von Google.

## FireShot und OpenScreenShot im Vergleich

|                                      | FireShot                                                                                                         | OpenScreenShot                                                        |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Preis                                | Kostenlos (Lite); Pro kostet 39,95 $ pro Jahr oder einmalig 99,95 $ für eine lebenslange Lizenz auf zwei Geräten | Kostenlos, keine kostenpflichtige Stufe                               |
| Open Source                          | Nein (eigene Lizenz)                                                                                             | Ja, MIT                                                               |
| Website-Zugriff bei der Installation | Keiner in Chrome; Zugriff auf alle Websites ist optional. `nativeMessaging` ist erforderlich                     | Keiner. Zugriff auf den aktuellen Tab, wenn du eine Aufnahme startest |
| Ganzseiten-Aufnahme                  | Ja                                                                                                               | Ja                                                                    |
| Anmerkungen und Unschärfe            | Der Eintrag nennt Text, Pfeile und Unschärfe; Pro nennt „Editor & smart annotations (on Windows)“                | Kostenlos, im Browser                                                 |
| PDF-Export                           | Ja, mit Links; erweitertes PDF ist Pro                                                                           | Ja, als Bild: eine Seite oder A4- bzw. Letter-Seiten mit Überlappung  |
| Tab-Aufnahme                         | Nein                                                                                                             | Ja, in Chrome (die Firefox-Version nimmt nur Screenshots auf)         |
| Konto oder Cloud                     | Lokale Aufnahme; optionale Uploads und Freigabe                                                                  | Kein Konto, keine Uploads                                             |

## Was bleibt

In beiden Tools bleiben Aufnahmen lokal. Auf der Website von FireShot steht „100% local captures keep your work private and offline-safe.“ (100 % lokale Aufnahmen halten deine Arbeit privat und offline sicher). OpenScreenShot verarbeitet Aufnahmen in deinem Browser und lädt sie nicht hoch. Keines der beiden verlangt in Chrome bei der Installation Zugriff auf alle Websites.

Du behältst die Ganzseiten-Aufnahme langer Seiten und den Export als PNG, JPEG und PDF. OpenScreenShot speichert außerdem WebP.

## Was sich ändert

Der Editor läuft in einem Browser-Tab, er funktioniert also auf jedem Betriebssystem gleich, und jedes Werkzeug ist kostenlos. Nutze **Pfeil**, **Text**, **Schrittnummer** und **Spotlight**, um auf Details zu zeigen, und **Unschärfe** (`B`) mit der Füllung **Deckend**, um private Daten zu verdecken. **Zuschneiden** und **Cut** kürzen eine lange Aufnahme. Die [Übersicht der Anmerkungen](/de/docs/#annotate) listet die Werkzeuge auf.

PDF funktioniert anders. Klicke auf **Bild speichern**, um den Dialog **Exportieren** zu öffnen, und wähle **PDF**. **Bildgröße** erzeugt eine Seite in der Größe des Bildes. **A4** oder **Letter** mit **Auf mehrere Seiten aufteilen** teilt eine lange Aufnahme mit 5 mm Überlappung. Das PDF enthält den Screenshot als Bild, es hat also keine klickbaren Links und keinen markierbaren Text. Verschickst du PDFs, in denen Leser Links folgen, passt FireShot besser zu dieser Aufgabe.

OpenScreenShot hat keine Stapelaufnahme, keinen Aufnahmeverlauf und keinen Upload per E-Mail oder zu OneNote. Es hat **Element erfassen**, den Bereich **Beautify** für ein gerahmtes Bild und in Chrome die Tab-Aufnahme mit Zoom bei Klicks und MP4-Export.

Das Chrome-Manifest von FireShot verlangt `nativeMessaging`. Damit kann die Erweiterung mit einem Programm kommunizieren, das auf deinem Computer installiert ist. OpenScreenShot nutzt kein natives Programm. Chrome fragt nach der optionalen Berechtigung zur Tab-Aufnahme erst, wenn du zum ersten Mal auf **Aufnehmen** klickst.

Das Firefox-Add-on von FireShot wurde zuletzt am 5. Juni 2023 aktualisiert und verlangt Zugriff auf deine Daten auf allen Websites. Die Firefox-Version von OpenScreenShot verlangt bei der Installation keinen Website-Zugriff und nimmt nur Screenshots auf.

## So wechselst du

1. Installiere OpenScreenShot aus dem [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) oder von [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Hefte das Symbol an die Symbolleiste an.
3. Klicke auf einer langen Seite auf das Symbol. Mit dem standardmäßigen **Ein-Klick-Express-Modus** startet das eine Aufnahme mit **Ganze Seite** und öffnet den **Editor**.
4. Lege **Nach Screenshot** in den **Einstellungen** fest. Wähle **Speichern**, um jede Aufnahme direkt als PNG in deinen Download-Ordner zu speichern, oder **Kopieren**, um sie sofort einzufügen.
5. Lege eine **Dateinamen-Vorlage** mit Platzhaltern wie `{date}`, `{domain}` und `{title}` fest. Ein `/` speichert in einen Ordner innerhalb von Downloads.

Startet ein Tastenkürzel keine Aufnahme, öffne `chrome://extensions/shortcuts` und prüfe, ob eine andere Erweiterung dieselben Tasten nutzt.

Für datierte Kopien von Seiten siehe [eine visuelle Kopie einer Webseite speichern](/de/use-cases/archive-web-pages/). Für Hilfeseiten mit kommentierten Aufnahmen siehe [Screenshots für Dokumentation](/de/use-cases/documentation/). Die [Export-Übersicht](/de/docs/#export) behandelt Formate und Skalierung. Für andere Ganzseiten-Tools siehe die [GoFullPage-Alternative](/de/alternatives/gofullpage/) und die [FullPage-Capture-Alternative](/de/alternatives/fullpage-capture/).
