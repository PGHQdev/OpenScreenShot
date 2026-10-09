---
title: 'FullPage-Capture-Alternative: Open Source ohne Zugriff auf alle Websites bei der Installation'
description: FullPage Capture vs. OpenScreenShot. Beide nehmen ganze Seiten kostenlos auf. OpenScreenShot ist Open Source und braucht keinen Zugriff auf alle Websites.
order: 2
---

Wechsle zu OpenScreenShot, wenn du eine Erweiterung für Ganzseiten-Screenshots willst, deren Code du lesen kannst und die bei der Installation keinen Zugriff auf alle Websites verlangt. Bleib bei FullPage Capture, wenn du brauchst, was sein PDF-Export bietet: Der Eintrag beschreibt PDFs mit klickbaren Links und intelligenten Seitenumbrüchen, und der Pro-Plan ergänzt durchsuchbare PDFs. OpenScreenShot speichert ein PDF als Bild, sein Text lässt sich also nicht durchsuchen oder markieren, und seine Links funktionieren nicht. OpenScreenShot nimmt nur Webseiten im Browser auf; es nimmt keine Desktop-Fenster und nicht den ganzen Bildschirm auf.

OpenScreenShot ist unser Produkt. Die Angaben zu FullPage Capture auf dieser Seite haben den Stand vom 9. Oktober 2026 und stammen aus dem [Eintrag im Chrome Web Store](https://chromewebstore.google.com/detail/ggacghlcchiiejclfdajbpkbjfgjhfol), der [Website](https://fullpagecapture.net/) und dem Manifest der Version 1.19.67 vom Update-Server von Google.

## FullPage Capture und OpenScreenShot im Vergleich

|                                      | FullPage Capture                                                                                 | OpenScreenShot                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Preis                                | Kostenlos; Pro kostet 19 $ pro Jahr nach einer 7-tägigen Testphase                               | Kostenlos, keine kostenpflichtige Stufe                                                                 |
| Open Source                          | Nein                                                                                             | Ja, MIT                                                                                                 |
| Website-Zugriff bei der Installation | Alle Websites (erforderliches `<all_urls>`)                                                      | Keiner. Zugriff auf den aktuellen Tab, wenn du eine Aufnahme startest                                   |
| Ganzseiten-Aufnahme                  | Ja, kostenlos ohne Wasserzeichen                                                                 | Ja, kostenlos ohne Wasserzeichen                                                                        |
| Anmerkungen und Unschärfe            | Kostenlos (Pfeile, Formen, Text, Textmarker, Stift, nummerierte Badges, Unschärfe und Verpixeln) | Kostenlos (Formen, Pfeile, Text, Textmarker, Stift, Schrittnummern, Unschärfe, Mosaik, Füllung Deckend) |
| PDF-Export                           | Ja, mit klickbaren Links und intelligenten Seitenumbrüchen; durchsuchbares PDF ist Pro           | Ja, als Bild: eine Seite oder A4- bzw. Letter-Seiten mit Überlappung                                    |
| Tab-Aufnahme                         | Nein                                                                                             | Ja, in Chrome (die Firefox-Version nimmt nur Screenshots auf)                                           |
| Konto oder Cloud                     | Laut Eintrag kein Konto; Pro nutzt ein Konto und „Send to your cloud“                            | Kein Konto, keine Uploads                                                                               |

Der [vollständige Vergleich](/de/compare/) stellt GoFullPage in dieselbe Tabelle.

## Zugriff bei der Installation

Das Manifest von FullPage Capture verlangt die Host-Berechtigung `<all_urls>`. Chrome zeigt die Warnung „Read and change all your data on all websites“ („Alle Ihre Daten auf allen Websites lesen und ändern“), wenn du eine Erweiterung mit dieser Berechtigung installierst. Der Eintrag sagt „No account, no analytics, no network requests. Files stay on your device“ (kein Konto, keine Analyse, keine Netzwerkanfragen, Dateien bleiben auf deinem Gerät), und die Website sagt „The extension makes zero network requests“ (die Erweiterung stellt keine Netzwerkanfragen). Wir haben ihr Netzwerkverhalten nicht getestet, und diese Seite macht dazu keine Aussage.

OpenScreenShot verlangt keine Host-Berechtigung. Es nutzt `activeTab`, das Zugriff auf einen Tab in dem Moment gibt, in dem du auf das Symbol klickst, ein Tastenkürzel drückst oder eine Aufnahme aus dem Rechtsklick-Menü wählst. Chrome fragt nach der optionalen Berechtigung zur Tab-Aufnahme erst, wenn du zum ersten Mal auf **Aufnehmen** klickst. Zugriff auf alle Websites wird nur angefragt, wenn du **Auf allen Websites** einschaltest. Der [Abschnitt zum Datenschutz](/de/docs/#privacy) erklärt, wie Aufnahmen auf deinem Gerät bleiben.

## Was bleibt

Der Ablauf ist ähnlich. Ein Klick auf das Symbol in der Symbolleiste startet mit dem standardmäßigen **Ein-Klick-Express-Modus** eine Aufnahme mit **Ganze Seite**, und das Ergebnis öffnet sich im **Editor**. Pfeile, Formen, Text, nummerierte Badges und Unschärfe sind alle kostenlos. Speichern, Kopieren und PDF-Export sind ebenfalls kostenlos, und kein Export hat ein Wasserzeichen.

## Was sich ändert

Zum Schwärzen wähle **Unschärfe** (`B`) und dann unter **Schwärzung** die Füllung **Deckend**. Deckend verdeckt den Bereich im Export vollständig. Die [Anleitung zum Schwärzen](/de/blog/redact-screenshot/) zeigt, wie du die gespeicherte Datei prüfst.

PDF funktioniert anders. Klicke auf **Bild speichern**, um den Dialog **Exportieren** zu öffnen, wähle **PDF** und dann **Bildgröße** für eine Seite in der Größe des Bildes oder **A4** bzw. **Letter** mit **Auf mehrere Seiten aufteilen**. Die Seiten überlappen sich um 5 mm, damit Text nicht mitten in der Zeile abgeschnitten wird. Die [Anleitung für Screenshots als PDF](/de/blog/save-screenshot-as-pdf/) vergleicht die Layouts.

OpenScreenShot hat keine Stapelaufnahme und keinen Cloud-Upload. Es ergänzt **Element erfassen** für eine Karte oder Tabelle, den Bereich **Beautify** für Abstand, Ecken, Schatten und Hintergrund und in Chrome die Tab-Aufnahme als MP4 oder WebM. Für Screenshots funktioniert es auch in Firefox.

## So wechselst du

1. Installiere OpenScreenShot aus dem [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) oder von [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Hefte das Symbol an die Symbolleiste an und löse FullPage Capture, wenn es an derselben Stelle sitzt.
3. Öffne eine lange Seite und klicke auf das Symbol. Prüfe das Ergebnis im **Editor**.
4. Lege **Nach Screenshot** in den **Einstellungen** fest: **Editor** zum Anmerken, **Kopieren**, um das Bild sofort einzufügen, oder **Speichern**, um ohne Tab ein PNG zu speichern.
5. Lege in den **Einstellungen** eine **Dateinamen-Vorlage** fest, zum Beispiel `{date}_{domain}`, damit gespeicherte Dateien nach Datum und Website sortiert werden.
6. Entferne FullPage Capture unter `chrome://extensions`, wenn du es nicht mehr nutzt.

Für kommentierte Aufnahmen in Issue-Trackern siehe [Screenshots für Fehlerberichte](/de/use-cases/bug-reports/). Die [Übersicht der Aufnahmemodi](/de/docs/#modes) behandelt jeden Modus. Für andere Ganzseiten-Tools siehe die [GoFullPage-Alternative](/de/alternatives/gofullpage/) und die [FireShot-Alternative](/de/alternatives/fireshot/).
