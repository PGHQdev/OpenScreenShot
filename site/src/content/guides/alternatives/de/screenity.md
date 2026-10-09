---
title: 'Screenity-Alternative: Screenshots und Tab-Aufnahme in einer Erweiterung'
description: Screenity vs. OpenScreenShot. Beide sind Open Source. OpenScreenShot ergänzt Ganzseiten-Screenshots und PDF-Export und braucht keinen Zugriff auf alle Websites.
order: 7
---

Wechsle zu OpenScreenShot, wenn du Browser-Tabs aufnimmst und außerdem Ganzseiten-Screenshots machst und eine Open-Source-Erweiterung willst, die beides kann, ohne bei der Installation Zugriff auf alle Websites zu verlangen. Bleib bei Screenity, wenn du mehr als einen Tab aufnimmst: Es nimmt einen Bereich, den Desktop, jedes App-Fenster oder die Kamera auf und exportiert GIF oder speichert in Google Drive. OpenScreenShot nimmt einen Browser-Tab auf und nimmt keine Desktop-Fenster und nicht den ganzen Bildschirm auf. Der kostenpflichtige Pro-Plan von Screenity ergänzt außerdem Freigabelinks und Cloud-Hosting, was OpenScreenShot nicht bietet.

OpenScreenShot ist unser Produkt. Die Angaben zu Screenity auf dieser Seite haben den Stand vom 9. Oktober 2026 und stammen aus dem [GitHub-Repository](https://github.com/alyssaxuu/screenity) und dem [Manifest](https://github.com/alyssaxuu/screenity/blob/master/src/manifest.json), dem [Eintrag im Chrome Web Store](https://chromewebstore.google.com/detail/screenity-screen-recorder/kbbdabhdfibnancpjfhlkhafgdilcnji), der [Pro-Seite](https://screenity.io/pro) und der [Liste der Berechtigungswarnungen](https://developer.chrome.com/docs/extensions/reference/permissions-list) von Chrome.

## Screenity und OpenScreenShot im Vergleich

|                                      | Screenity                                                                                              | OpenScreenShot                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Preis                                | Kostenlose Erweiterung; Pro kostet 10 $ pro Monat oder 120 $ pro Jahr, mit 7-tägiger Testphase         | Kostenlos, keine kostenpflichtige Stufe                                                 |
| Open Source                          | Ja, GPL-3.0                                                                                            | Ja, MIT                                                                                 |
| Website-Zugriff bei der Installation | Alle Websites (erforderliches `<all_urls>`, dazu `tabs` und `tabCapture`)                              | Keiner. Tab-Aufnahme ist optional und wird bei der ersten Aufnahme angefragt            |
| Ganzseiten-Aufnahme                  | In den geprüften Quellen nicht behandelt                                                               | Ja                                                                                      |
| Anmerkungen und Unschärfe            | Zeichnen, Text, Pfeile, Formen; Unschärfe von Seiteninhalten                                           | Formen, Pfeile, Text, Schrittnummern, Unschärfe, Spotlight, Zuschneiden bei Screenshots |
| PDF-Export                           | In den geprüften Quellen nicht behandelt                                                               | Ja                                                                                      |
| Tab-Aufnahme                         | Ja, außerdem Bereich, Desktop, App-Fenster und Kamera                                                  | Ja, nur Tab, in Chrome (die Firefox-Version nimmt nur Screenshots auf)                  |
| Video-Export                         | MP4, GIF, WebM oder Google Drive                                                                       | MP4 oder WebM                                                                           |
| Konto oder Cloud                     | Keine Anmeldung für die kostenlose Erweiterung; Pro nutzt ein Konto und eine in der EU gehostete Cloud | Kein Konto, keine Uploads                                                               |

## Was bleibt

Beide Erweiterungen sind Open Source, und beide behalten kostenlose Aufnahmen ohne Anmeldung auf deinem Gerät. Klicke in OpenScreenShot im Popup auf **Aufnehmen** und wähle **Mikro**, **Tab-Audio** oder **Webcam**. Behalte **Ganzer Tab** oder ziehe über die Vorschau, um einen Teil der Seite aufzunehmen. Der Aufnahme-Tab enthält den Timer und die Schaltflächen **Pause**, **Stopp** und **Abbrechen**, sodass im Video keine Bedienelemente erscheinen. Drücke `Alt+Shift+X`, um von jedem Tab aus zu stoppen.

## Was sich ändert

Der Aufnahme-Editor fügt bei jedem Klick deines Cursors einen 2x-Zoom hinzu. Du kannst diese Zooms verschieben oder löschen, manuelle Zooms mit 1,5x, 2x oder 3x hinzufügen und jedes Segment kürzen. Die Webcam kommt als runde Blase, die du platzierst, in den Export, und der Bereich **Beautify** fügt Abstand und einen Hintergrund hinzu. Der Export rendert standardmäßig ein MP4 (H.264 und AAC) oder WebM. Die [Übersicht der Aufnahme](/de/docs/#record) behandelt jedes Bedienelement.

Screenshots gehören zur selben Erweiterung. Ein Klick auf das Symbol in der Symbolleiste startet mit dem standardmäßigen **Ein-Klick-Express-Modus** eine Aufnahme mit **Ganze Seite**. Der Screenshot-Editor hat **Unschärfe** mit der Füllung **Deckend** zum Schwärzen, und **Bild speichern** öffnet den Dialog **Exportieren** für PNG, JPEG, WebP oder PDF. OpenScreenShot fügt der Seite während einer Aufnahme nichts hinzu, du kannst also während der Aufnahme nicht auf der Seite zeichnen. Anmerkungen funktionieren bei Screenshots.

Der Zugriff bei der Installation ist kleiner. Das Manifest von Screenity verlangt `<all_urls>`, und die Liste von Chrome zeigt „Read and change all your data on all websites“ („Alle Ihre Daten auf allen Websites lesen und ändern“) für `tabCapture` und „Read your browsing history“ („Browserverlauf lesen“) für `tabs`. OpenScreenShot wird mit `activeTab` installiert und fragt nach der Tab-Aufnahme erst, wenn du zum ersten Mal auf **Aufnehmen** klickst. Nach Zugriff auf alle Websites fragt es nur, wenn du **Auf allen Websites** einschaltest. Damit kann die Klick-Erfassung einem Tab auf eine andere Website folgen.

## So wechselst du

1. Installiere OpenScreenShot aus dem [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp). Die [Firefox-Version](https://addons.mozilla.org/firefox/addon/openscreenshot/) nimmt nur Screenshots auf.
2. Hefte das Symbol an die Symbolleiste an.
3. Mach einen ersten Screenshot: Klicke auf einer Seite auf das Symbol und prüfe das Ergebnis im **Editor**.
4. Klicke im Popup auf **Aufnehmen** und bestätige die Chrome-Abfrage zur Tab-Aufnahme. Nimm einen kurzen Test auf und exportiere ihn.
5. Lege für Screenshots **Nach Screenshot** in den **Einstellungen** fest: **Editor**, **Kopieren** oder **Speichern**.
6. Exportiere alle Screenity-Aufnahmen, die du behalten willst, bevor du es entfernst.

Für Rundgänge durch Funktionen siehe [Produktdemo-Videos](/de/use-cases/product-demos/). Um einen Fehler in einem Issue zu zeigen, siehe [Screenshots für Fehlerberichte](/de/use-cases/bug-reports/). Teilst du Videos per Link mit einem Team, vergleiche die [Loom-Alternative](/de/alternatives/loom/). Für einen Rekorder mit Cloud-Upload siehe die [Nimbus-Alternative](/de/alternatives/nimbus/).
