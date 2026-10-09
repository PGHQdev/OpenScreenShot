---
title: 'GoFullPage-Alternative: kostenlose Anmerkungen und Open Source'
description: GoFullPage vs. OpenScreenShot. OpenScreenShot bietet kostenlos Anmerkungen, Unschärfe, Zuschneiden und PDF-Seitenteilung, und sein Code ist öffentlich.
order: 1
---

Wechsle zu OpenScreenShot, wenn du ganze Seiten aufnimmst und sie dann zuschneiden, unscharf machen, markieren oder als PDF auf Seiten aufteilen musst: GoFullPage packt diese Funktionen in seinen kostenpflichtigen Premium-Plan, und OpenScreenShot enthält sie kostenlos. OpenScreenShot steht außerdem unter MIT-Lizenz, du kannst also den Code lesen, der auf deinen Seiten läuft. Bleib bei GoFullPage, wenn du ganze Seiten nur aufnimmst und ohne Bearbeitung als Bilder oder PDFs speicherst. Die kostenlose Version kann das bereits ohne Begrenzung der Anzahl der Aufnahmen, und die FAQ verlinkt eine Version für Microsoft Edge Add-ons. OpenScreenShot hat keinen Eintrag bei Edge Add-ons, aber Edge kann es aus dem Chrome Web Store installieren. OpenScreenShot nimmt nur Webseiten im Browser auf; es nimmt keine Desktop-Fenster und nicht den ganzen Bildschirm auf.

OpenScreenShot ist unser Produkt. Die Angaben zu GoFullPage auf dieser Seite haben den Stand vom 9. Oktober 2026 und stammen aus dem [Eintrag im Chrome Web Store](https://chromewebstore.google.com/detail/fdpohaocaechififmbbbbbknoalclacl), der [FAQ](https://gofullpage.com/faq), der [Premium-Seite](https://gofullpage.com/premium) und der [Seite bei Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/gofullpage-screenshot/).

## GoFullPage und OpenScreenShot im Vergleich

|                                      | GoFullPage                                                                     | OpenScreenShot                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Preis                                | Kostenlos; Premium kostet 12 $ pro Jahr (vor Steuern), mit 7-tägiger Testphase | Kostenlos, keine kostenpflichtige Stufe                                      |
| Open Source                          | Nein. Seit 2018 ein privater Fork eines MIT-Projekts                           | Ja, MIT                                                                      |
| Website-Zugriff bei der Installation | Keiner. Zugriff auf alle Websites ist optional                                 | Keiner. Zugriff auf den aktuellen Tab, wenn du eine Aufnahme startest        |
| Ganzseiten-Aufnahme                  | Ja                                                                             | Ja                                                                           |
| Anmerkungen und Unschärfe            | Nur Premium (Unschärfe, Text, Hervorhebung, Zuschneiden)                       | Kostenlos (Formen, Pfeile, Text, Schrittnummern, Unschärfe, Zuschneiden)     |
| PDF-Export                           | Kostenlos; intelligente PDF-Seitenteilung ist Premium                          | Kostenlos, einschließlich A4- oder Letter-Seiten, aufgeteilt mit Überlappung |
| Tab-Aufnahme                         | Nein                                                                           | Ja, in Chrome (die Firefox-Version nimmt nur Screenshots auf)                |
| Konto oder Cloud                     | Kein Konto für kostenlose Aufnahmen; Premium nutzt ein Konto                   | Kein Konto, keine Uploads                                                    |
| Browser-Stores                       | Chrome Web Store, Firefox Add-ons, Edge Add-ons                                | Chrome Web Store, Firefox Add-ons                                            |

Der [vollständige Vergleich](/de/compare/) ergänzt FullPage Capture in derselben Tabelle.

## Was bleibt

Die wichtigste Gewohnheit bleibt gleich. Mit den Standardeinstellungen startet ein Klick auf das OpenScreenShot-Symbol in der Symbolleiste eine Aufnahme mit **Ganze Seite**. Das ist der **Ein-Klick-Express-Modus**. Die Erweiterung scrollt die Seite, setzt die Teile zu einem Bild zusammen und öffnet das Ergebnis im **Editor**. Fixierte Kopfzeilen erscheinen einmal oben, und Seiten, die ein inneres Element scrollen, funktionieren auch.

Beide Erweiterungen verlangen bei der Installation keinen Website-Zugriff. OpenScreenShot nutzt `activeTab` und kann daher nur den Tab lesen, den du aufnimmst, und nur in dem Moment, in dem du die Aufnahme startest. Beide speichern PNG-, JPEG- und PDF-Dateien. Beide funktionieren in Chrome und Firefox.

## Was sich ändert

Die Editor-Werkzeuge sind kostenlos. **Zuschneiden** (`C`) kürzt das Bild, **Unschärfe** (`B`) mit der Füllung **Deckend** verdeckt private Daten, und **Pfeil**, **Text** und **Schrittnummer** markieren, was wichtig ist. **Cut** (`X`) entfernt horizontale Streifen aus einer langen Aufnahme. Die [Übersicht der Anmerkungen](/de/docs/#annotate) listet jedes Werkzeug und Tastenkürzel auf.

Auch das PDF-Layout ist kostenlos. Klicke auf **Bild speichern**, um den Dialog **Exportieren** zu öffnen, wähle **PDF** und dann **A4** oder **Letter** mit **Auf mehrere Seiten aufteilen**. Jede Seite überlappt die nächste um 5 mm, sodass Text nicht mitten in der Zeile abgeschnitten wird. Die Schaltfläche **PDF** neben **Bild speichern** speichert ein PDF mit einem Klick. Das PDF enthält den Screenshot als Bild, sein Text ist also nicht durchsuchbar oder markierbar.

Du bekommst außerdem mehr Aufnahmemodi: **Sichtbarer Bereich**, **Ausschnitt** und **Element erfassen**, das eine Karte, Tabelle oder ein Diagramm exakt in seinen Grenzen aufnimmt. In Chrome nimmt **Aufnehmen** einen Tab als MP4- oder WebM-Video mit Zoom bei jedem Klick auf. Die erste Aufnahme fragt nach der optionalen Berechtigung zur Tab-Aufnahme.

OpenScreenShot hat keinen Datums- oder URL-Stempel. Nutze stattdessen die Dateinamen-Vorlage in den **Einstellungen** mit `{date}` und `{domain}`, um diese Information im Dateinamen zu behalten.

## So wechselst du

1. Installiere OpenScreenShot aus dem [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) oder von [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Hefte das Symbol an die Symbolleiste an. Ist GoFullPage an derselben Stelle angeheftet, löse es, damit du auf das richtige Symbol klickst.
3. Öffne eine lange Seite und klicke auf das OpenScreenShot-Symbol. Prüfe im **Editor** den Anfang, das Ende und jede fixierte Kopfzeile.
4. Lege **Nach Screenshot** in den **Einstellungen** fest. **Editor** öffnet jede Aufnahme zum Anmerken. **Speichern** speichert ohne Tab ein PNG in deinen Download-Ordner, was einer Gewohnheit aus Aufnehmen und Speichern nahekommt. **Kopieren** kopiert das Bild.
5. Um ein Bild zu markieren, das du mit GoFullPage gespeichert hast, ziehe die Datei auf den Editor oder füge sie mit `Ctrl+V` (`⌘V` auf macOS) ein.

Startet ein Tastenkürzel keine OpenScreenShot-Aufnahme, öffne `chrome://extensions/shortcuts` und prüfe, ob eine andere Erweiterung dieselben Tasten nutzt.

Um Kopien von Seiten mit datierten Dateinamen zu behalten, siehe [eine visuelle Kopie einer Webseite speichern](/de/use-cases/archive-web-pages/). Willst du PDF-Ausgabe mit klickbaren Links, vergleiche die [FireShot-Alternative](/de/alternatives/fireshot/) und die [FullPage-Capture-Alternative](/de/alternatives/fullpage-capture/).
