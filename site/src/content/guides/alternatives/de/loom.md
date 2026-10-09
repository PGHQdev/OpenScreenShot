---
title: 'Loom-Alternative: Tab-Aufnahmen, die auf deinem Gerät bleiben'
description: Loom vs. OpenScreenShot. Nimm einen Browser-Tab mit Webcam, Mikrofon und Auto-Zoom auf und exportiere ein MP4 lokal, ohne Konto und ohne bezahlten Plan.
order: 8
---

Wechsle zu OpenScreenShot, wenn du in Chrome Rundgänge durch eine Web-App oder eine Seite aufnimmst und eine MP4-Datei auf deinem eigenen Gerät exportieren willst, ohne Konto. Bleib bei Loom, wenn du Videos per Link teilst: Loom hostet jedes Video, gibt dir eine Bibliothek und einen Team-Arbeitsbereich und nennt Desktop- und Mobil-Apps. OpenScreenShot hat kein Hosting und keine Freigabelinks, du lädst die exportierte Datei also selbst hoch oder hängst sie an. Es nimmt einen Browser-Tab auf, nur in Chrome, und es nimmt keine Desktop-Fenster und nicht den ganzen Bildschirm auf.

OpenScreenShot ist unser Produkt. Die Angaben zu Loom auf dieser Seite haben den Stand vom 9. Oktober 2026 und stammen aus der [Preisseite](https://www.loom.com/pricing), dem [Eintrag im Chrome Web Store](https://chromewebstore.google.com/detail/loom-%E2%80%93-screen-recorder-sc/liecbddmkiiihnedobmlmillhodjkdmb), der [Hilfeseite zu Konten](https://support.atlassian.com/loom/docs/use-loom-with-an-atlassian-account) von Atlassian und der [Liste der Berechtigungswarnungen](https://developer.chrome.com/docs/extensions/reference/permissions-list) von Chrome.

## Loom und OpenScreenShot im Vergleich

|                                      | Loom                                                                                                                                                                         | OpenScreenShot                                                               |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Preis                                | Starter 0 $ (25 Videos, Bildschirmaufnahmen bis 5 Minuten); Business 18 $ pro Nutzer und Monat; Business + AI für 24 $ pro Nutzer und Monat gelistet; Enterprise auf Anfrage | Kostenlos, keine kostenpflichtige Stufe                                      |
| Open Source                          | Nein                                                                                                                                                                         | Ja, MIT                                                                      |
| Website-Zugriff bei der Installation | Alle Websites (erforderliches `<all_urls>`, Content-Skripte auf jeder Seite)                                                                                                 | Keiner. Tab-Aufnahme ist optional und wird bei der ersten Aufnahme angefragt |
| Ganzseiten-Aufnahme                  | In den geprüften Quellen nicht behandelt                                                                                                                                     | Ja                                                                           |
| Anmerkungen und Unschärfe            | In den geprüften Quellen nicht behandelt                                                                                                                                     | Ja, bei Screenshots                                                          |
| PDF-Export                           | In den geprüften Quellen nicht behandelt                                                                                                                                     | Ja, für Screenshots                                                          |
| Tab-Aufnahme                         | Bildschirmaufnahme, mit Grenzen je nach Plan                                                                                                                                 | Ja, nur Tab, in Chrome (die Firefox-Version nimmt nur Screenshots auf)       |
| Konto oder Cloud                     | Konto erforderlich; Videos werden von Loom gehostet                                                                                                                          | Kein Konto, keine Uploads                                                    |

Loom gehört seit November 2023 zu Atlassian, und ein Loom-Konto kann ein Atlassian-Konto nutzen.

## Was bleibt

Du behältst einen Rekorder, der aus der Browser-Symbolleiste startet. Klicke im OpenScreenShot-Popup auf **Aufnehmen**, schalte **Mikro** und **Webcam** ein und klicke auf **Aufnahme starten**. Deine Webcam erscheint im Export als runde Blase, die du platzierst. **Tab-Audio** fügt den Ton der Seite hinzu.

## Was sich ändert

Das Video ist eine Datei. Wenn du stoppst, öffnet sich der Aufnahme-Editor im selben Tab. Er fügt bei jedem Klick einen 2x-Zoom hinzu, damit Zuschauer sehen, wo du geklickt hast. Du kannst jeden Zoom anpassen oder löschen, eigene mit 1,5x, 2x oder 3x hinzufügen und Segmente kürzen. Der Export rendert eine MP4-Datei (H.264 und AAC) oder eine WebM-Datei in deinen Download-Ordner. Lade sie zu deinem eigenen Video-Host, in einen Chat oder ein Ticket hoch. Die [Übersicht der Aufnahme](/de/docs/#record) behandelt jedes Bedienelement.

Aufnahmen bleiben auf deinem Gerät. OpenScreenShot speichert sie während der Aufnahme in IndexedDB und behält sie, bis du die Sitzung löschst. Es hat keine Analyse und keine Telemetrie. Der [Abschnitt zum Datenschutz](/de/docs/#privacy) enthält die Details.

Der Umfang ist ein Tab. Behalte **Ganzer Tab** oder ziehe über die Vorschau, um einen Teil der Seite aufzunehmen. Wechselt der Tab während einer Aufnahme zu einer anderen Website, braucht die Klick-Erfassung **Auf allen Websites**, das Zugriff auf alle Websites anfragt. Ohne diese Berechtigung stoppen Zoom- und Klick-Effekte für den Rest des Videos, und das Video wird weiter aufgenommen.

Der Zugriff bei der Installation ist kleiner. Das Manifest von Loom verlangt `<all_urls>`, `tabCapture` und `desktopCapture`. Die Liste von Chrome zeigt „Read and change all your data on all websites“ („Alle Ihre Daten auf allen Websites lesen und ändern“) für `tabCapture` und „Capture content of your screen“ („Bildschirminhalt erfassen“) für `desktopCapture`. OpenScreenShot wird mit `activeTab` installiert und fragt nach der Tab-Aufnahme erst, wenn du zum ersten Mal auf **Aufnehmen** klickst.

OpenScreenShot nimmt auch Screenshots auf. Ein Klick auf das Symbol in der Symbolleiste startet mit dem standardmäßigen **Ein-Klick-Express-Modus** eine Aufnahme mit **Ganze Seite**, und der Editor hat Pfeile, Schrittnummern und **Unschärfe** mit der Füllung **Deckend**.

## So wechselst du

1. Installiere OpenScreenShot aus dem [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp). Die [Firefox-Version](https://addons.mozilla.org/firefox/addon/openscreenshot/) nimmt nur Screenshots auf.
2. Hefte das Symbol an die Symbolleiste an.
3. Klicke im Popup auf **Aufnehmen** und bestätige die Chrome-Abfrage zur Tab-Aufnahme. Nimm einen kurzen Test auf und klicke dann auf **Exportieren**.
4. Drücke `Alt+Shift+X`, um eine Aufnahme von jedem Tab aus zu stoppen.
5. Für Screenshots lege **Nach Screenshot** in den **Einstellungen** fest: **Editor**, **Kopieren** oder **Speichern**.
6. Lade die Loom-Videos, die du behalten willst, herunter, bevor du dein Konto schließt oder den Plan wechselst.

Für Rundgänge durch Funktionen siehe [Produktdemo-Videos](/de/use-cases/product-demos/). Für Support-Antworten siehe [Screenshots für den Kundensupport](/de/use-cases/customer-support/). Für einen Open-Source-Rekorder, der auch den Desktop aufnimmt, siehe die [Screenity-Alternative](/de/alternatives/screenity/). Für einen Rekorder mit Cloud-Links siehe die [Awesome-Screenshot-Alternative](/de/alternatives/awesome-screenshot/).
