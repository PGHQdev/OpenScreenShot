---
title: 'Lightshot-Alternative: Ganzseiten-Aufnahme ohne öffentlichen Upload'
description: Lightshot vs. OpenScreenShot. Ganzseiten-Aufnahme, Unschärfe und PDF-Export im Browser, mit Dateien, die auf deinem Gerät bleiben, und ohne prnt.sc-Links.
order: 6
---

Wechsle zu OpenScreenShot, wenn du in Chrome oder Firefox Screenshots von Webseiten aufnimmst und Ganzseiten-Aufnahme, Unschärfe und PDF-Export willst, mit Dateien, die auf deinem Gerät bleiben. Bleib bei Lightshot, wenn du andere Apps oder deinen ganzen Desktop aufnimmst: Lightshot hat Desktop-Apps für Windows und Mac, und OpenScreenShot nimmt nur Webseiten im Browser auf. Bleib auch dabei, wenn du auf die sofortigen Kurzlinks angewiesen bist. OpenScreenShot hat keinen Upload-Dienst, du teilst eine Aufnahme also, indem du sie einfügst oder die Datei anhängst.

OpenScreenShot ist unser Produkt. Die Angaben zu Lightshot auf dieser Seite haben den Stand vom 9. Oktober 2026 und stammen aus dem [Eintrag im Chrome Web Store](https://chromewebstore.google.com/detail/mbniclmhobmnbdlbpiphghaielnnpgdp), der [Website](https://app.prntscr.com/en/index.html), der [Seite bei Firefox Add-ons](https://addons.mozilla.org/firefox/addon/lightshot/) und dem Manifest der Version 7.0.1 vom Update-Server von Google.

## Lightshot und OpenScreenShot im Vergleich

|                                      | Lightshot                                                                                    | OpenScreenShot                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Preis                                | Kostenlos                                                                                    | Kostenlos                                                             |
| Open Source                          | Nein (eigene Lizenz)                                                                         | Ja, MIT                                                               |
| Website-Zugriff bei der Installation | Alle Websites (erforderliches `*://*/*`)                                                     | Keiner. Zugriff auf den aktuellen Tab, wenn du eine Aufnahme startest |
| Ganzseiten-Aufnahme                  | Nein; der Eintrag beschreibt die Auswahl eines Bereichs                                      | Ja                                                                    |
| Anmerkungen und Unschärfe            | Bearbeitung direkt an Ort und Stelle                                                         | Formen, Pfeile, Text, Schrittnummern, Unschärfe, Zuschneiden          |
| PDF-Export                           | Nein                                                                                         | Ja                                                                    |
| Tab-Aufnahme                         | Nein                                                                                         | Ja, in Chrome (die Firefox-Version nimmt nur Screenshots auf)         |
| Konto oder Cloud                     | Optionaler Upload zu prnt.sc für einen Kurzlink; Speichern auf der Festplatte wird angeboten | Kein Konto, keine Uploads                                             |
| Desktop-Aufnahme                     | Ja, mit den Apps für Windows und Mac                                                         | Nein                                                                  |

Die Chrome-Erweiterung von Lightshot wurde zuletzt am 23. Juli 2024 aktualisiert.

## Uploads und Freigabelinks

Lightshot kann einen Screenshot zu prnt.sc hochladen und dir einen Kurzlink geben. Um einen Upload anzusehen, ist kein Konto nötig. 2021 [berichtete Kaspersky](https://www.kaspersky.com/blog/cryptoscam-in-lightshot/39224/), dass die URLs fortlaufend waren, sodass ein geändertes Zeichen ein anderes Bild öffnen konnte, und dass „Anyone can see published screenshots without authentication“ (jeder veröffentlichte Screenshots ohne Authentifizierung sehen kann). [AIN.UA berichtete](https://en.ain.ua/2021/09/08/lightshot-allows-people-to-view-screenshots-of-other-users) im selben Jahr über dasselbe Problem. Wir haben nicht geprüft, ob das 2026 noch zutrifft.

OpenScreenShot hat keinen Upload-Schritt. Es verarbeitet und speichert Aufnahmen in deinem Browser, und eine exportierte Datei landet in deinem Download-Ordner. Niemand sieht eine Aufnahme, bevor du sie irgendwo einfügst oder anhängst. Der [Abschnitt zum Datenschutz](/de/docs/#privacy) enthält die Details.

## Was bleibt

Die schnelle Ausschnitt-Aufnahme bleibt. Drücke `Ctrl+Shift+E` (`⌘⇧E` auf macOS) oder klicke mit der rechten Maustaste auf die Seite und wähle **Ausschnitt**, ziehe dann ein Rechteck und drücke `Enter`. Der Editor öffnet sich mit Pfeilen, Text, Formen und einem Textmarker. **Kopieren** legt das Bild in die Zwischenablage, bereit zum Einfügen in einen Chat.

Um den Editor zu überspringen, setze **Nach Screenshot** auf **Kopieren**. Jede Aufnahme geht dann direkt in die Zwischenablage, was einer Gewohnheit aus Aufnehmen und Einfügen nahekommt.

## Was sich ändert

Du kannst mehr von einer Seite aufnehmen. **Ganze Seite** scrollt und setzt die ganze Seite zu einem Bild zusammen. **Element erfassen** nimmt eine Karte, Tabelle oder ein Diagramm exakt in seinen Grenzen auf. **Sichtbarer Bereich** nimmt auf, was im Tab auf dem Bildschirm zu sehen ist.

Der Editor ergänzt **Unschärfe** (`B`) mit weicher Unschärfe, Mosaik oder der Füllung **Deckend**, die private Daten vollständig verdeckt. **Schrittnummer**-Badges zählen von selbst hoch. Klicke auf **Bild speichern**, um den Dialog **Exportieren** zu öffnen und PNG, JPEG, WebP oder PDF zu speichern.

Der Zugriff bei der Installation ist kleiner. OpenScreenShot nutzt `activeTab` für jeweils einen Tab und kann keine Browser-Einstellungsseiten, Erweiterungsseiten oder etwas außerhalb des Browsers aufnehmen. Für eine Desktop-App oder ein anderes Programmfenster brauchst du weiterhin ein Desktop-Tool.

## So wechselst du

1. Installiere OpenScreenShot aus dem [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) oder von [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Hefte das Symbol an die Symbolleiste an.
3. Probiere eine erste Aufnahme. Ein Klick auf das Symbol startet mit dem standardmäßigen **Ein-Klick-Express-Modus** eine Aufnahme mit **Ganze Seite**. Für einen Bereich nutze `Ctrl+Shift+E` oder das Rechtsklick-Menü.
4. Lege **Nach Screenshot** in den **Einstellungen** fest: **Kopieren** zum sofortigen Einfügen, **Editor** zum Anmerken oder **Speichern**, um ein PNG zu speichern.
5. Behältst du eine Desktop-Screenshot-App für andere Programme, stelle sicher, dass sie nicht dieselben Tasten wie OpenScreenShot nutzt. In Chrome kannst du die Tasten der Erweiterung unter `chrome://extensions/shortcuts` ändern.

Für schnelle Bilder in Support-Antworten siehe [Screenshots für den Kundensupport](/de/use-cases/customer-support/). Für Beiträge siehe [Screenshots für Social Media](/de/use-cases/social-media/). Brauchst du Desktop-Aufnahmen, zeigt die Seite zur [Snagit-Alternative](/de/alternatives/snagit/), was ein Desktop-Tool abdeckt.
