---
title: 'Nimbus-Screenshot-Alternative: lokale Aufnahme nach dem Wechsel zu FuseBase'
description: Nimbus Screenshot heißt jetzt FuseBase Pro. OpenScreenShot ist eine kostenlose Open-Source-Option für Ganzseiten-Aufnahme, Anmerkungen und Tab-Aufnahme.
order: 5
---

Nimbus Screenshot erscheint in Chrome jetzt als FuseBase Pro, von Nimbus Web. Wechsle zu OpenScreenShot, wenn du Nimbus genutzt hast, um Webseiten aufzunehmen, anzumerken und aufzuzeichnen, und ein kostenloses Tool willst, das Dateien auf deinem Gerät behält, ohne Konto und ohne Cloud-Arbeitsbereich. Bleib bei FuseBase Pro, wenn du brauchst, was OpenScreenShot nicht hat: Bildschirmaufnahme über einen Tab hinaus und Uploads zu FuseBase, Google Drive, Dropbox oder Slack. OpenScreenShot nimmt einen Browser-Tab auf, nur in Chrome. Es nimmt keine Desktop-Fenster und nicht den ganzen Bildschirm auf.

OpenScreenShot ist unser Produkt. Die Angaben zu FuseBase Pro auf dieser Seite haben den Stand vom 9. Oktober 2026 und stammen aus dem [Eintrag im Chrome Web Store](https://chromewebstore.google.com/detail/fddbloohgcjopkmnjdeodjcfbgiimpcn), der [Screenshot-Seite](https://thefusebase.com/screenshot/) und der [Preisseite](https://thefusebase.com/pricing/) von FuseBase, der alten [Nimbus-Seite bei Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/nimbus-screenshot/) und dem Manifest der Version 3.6.19 vom Update-Server von Google.

## Was aus Nimbus Screenshot wurde

Der ursprüngliche Eintrag „Nimbus Screenshot & Screen Video Recorder“ ist nicht mehr im Chrome Web Store. Die alte Nimbus-Screenshot-Seite, nimbusweb.me/screenshot.php, leitet jetzt auf die Screenshot-Seite von FuseBase weiter. Die aktuelle Chrome-Erweiterung ist „FuseBase Pro - Capture screenshots and Video record“, angeboten von Nimbus Web, Inc. Das alte Nimbus-Add-on ist für Firefox noch gelistet. Es wurde zuletzt am 31. Juli 2020 aktualisiert.

## FuseBase Pro und OpenScreenShot im Vergleich

|                                      | FuseBase Pro (früher Nimbus)                                                        | OpenScreenShot                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Preis                                | Kostenloser Plan mit Aufnahmen bis 5 Minuten; Pro-Plan mit Aufnahmen bis 10 Stunden | Kostenlos, keine kostenpflichtige Stufe                               |
| Open Source                          | Nein                                                                                | Ja, MIT                                                               |
| Website-Zugriff bei der Installation | Alle Websites (erforderliches `<all_urls>`, Content-Skripte auf jeder Seite)        | Keiner. Zugriff auf den aktuellen Tab, wenn du eine Aufnahme startest |
| Ganzseiten-Aufnahme                  | Ja                                                                                  | Ja                                                                    |
| Anmerkungen und Unschärfe            | Ja                                                                                  | Ja, alle Werkzeuge kostenlos                                          |
| PDF-Export                           | Ja, laut Eintrag                                                                    | Ja                                                                    |
| Tab-Aufnahme                         | Ja, Bildschirm und Webcam; Umwandlung in GIF und MP4 ist Premium                    | Ja, nur Tab, in Chrome; MP4 und WebM kostenlos                        |
| Konto oder Cloud                     | Uploads zu FuseBase, Google Drive, Dropbox und Slack                                | Kein Konto, keine Uploads                                             |

Die Screenshot-Seite von FuseBase zeigt keinen Preis für den Pro-Plan der Aufnahme-Erweiterung. Die Preisseite von FuseBase listet Pläne für Arbeitsbereiche, beginnend mit Solo für 32 $ oder 39 $ pro Monat je nach Abrechnung, und nennt die Aufnahme-Erweiterung nicht.

## Was bleibt

Du behältst die Ganzseiten-Aufnahme, einen Editor mit Anmerkungswerkzeugen und Unschärfe sowie den PDF-Export. In Chrome behältst du die Aufnahme mit Webcam, und OpenScreenShot nimmt außerdem Mikrofon und Tab-Audio auf. Exporte haben kein Wasserzeichen.

## Was sich ändert

Dateien bleiben auf deinem Gerät. OpenScreenShot speichert Aufnahmen im lokalen Browserspeicher und Videoaufnahmen in IndexedDB, bis du sie löschst, und es hat keine Analyse und keine Telemetrie. Der Datenschutzabschnitt von FuseBase Pro im Chrome Web Store gibt die Erhebung personenbezogener Daten, Authentifizierungsdaten und Website-Inhalte an. Um eine OpenScreenShot-Aufnahme zu teilen, klicke auf **Kopieren** und füge sie ein, oder klicke auf **Bild speichern** und hänge die Datei an.

Der Zugriff bei der Installation ist kleiner. OpenScreenShot nutzt `activeTab`, das einen Tab abdeckt, wenn du eine Aufnahme startest. Chrome fragt nach der optionalen Berechtigung zur Tab-Aufnahme, wenn du zum ersten Mal auf **Aufnehmen** klickst, und nach Zugriff auf alle Websites nur, wenn du **Auf allen Websites** einschaltest.

Die Aufnahme umfasst einen Tab. Klicke im Popup auf **Aufnehmen**, wähle **Mikro**, **Tab-Audio** oder **Webcam** und nimm den ganzen Tab oder einen gezogenen Bereich auf. Der Aufnahme-Editor fügt bei jedem Klick einen 2x-Zoom hinzu, und du kannst Segmente kürzen und die Webcam-Blase platzieren. MP4- und WebM-Export sind kostenlos. OpenScreenShot hat keinen GIF-Export. Siehe die [Übersicht der Aufnahme](/de/docs/#record).

## So wechselst du

1. Installiere OpenScreenShot aus dem [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) oder von [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/). Die Firefox-Version nimmt nur Screenshots auf.
2. Hefte das Symbol an die Symbolleiste an.
3. Klicke auf einer Seite auf das Symbol. Mit dem standardmäßigen **Ein-Klick-Express-Modus** startet das eine Aufnahme mit **Ganze Seite** und öffnet den **Editor**. Klicke mit der rechten Maustaste auf die Seite für **Sichtbarer Bereich**, **Ausschnitt** und **Element erfassen**.
4. Lege **Nach Screenshot** in den **Einstellungen** fest: **Editor**, **Kopieren** oder **Speichern**.
5. Lade die Dateien, die du behalten willst, aus FuseBase oder deinem Cloud-Speicher herunter. Um eine alte Aufnahme anzumerken, ziehe das Bild auf den OpenScreenShot-Editor.
6. Prüfe `chrome://extensions` und entferne die Nimbus- oder FuseBase-Erweiterung, wenn du sie nicht mehr nutzt.

Für kurze Videos von Funktionen siehe [Produktdemo-Videos](/de/use-cases/product-demos/). Für markierte Aufnahmen für ein Team siehe [eine Seite für das Design-Review aufnehmen](/de/use-cases/design-review/). Für andere Rekorder siehe die [Awesome-Screenshot-Alternative](/de/alternatives/awesome-screenshot/) und die [Screenity-Alternative](/de/alternatives/screenity/).
