---
title: Erweiterungen für Ganzseiten-Screenshots im Vergleich (2026)
description: OpenScreenShot, GoFullPage, FullPage Capture, Awesome Screenshot, FireShot und Nimbus/FuseBase im Vergleich nach Preis, Quellcode, Berechtigungen, Anmerkungen, PDF und Aufnahme, dazu die eingebauten Browser-Tools.
audience: everyday
order: 7
---

Brauchst du nur ab und zu einen Ganzseiten-Screenshot, nehmen die eingebauten Tools in Chrome DevTools, Microsoft Edge und Firefox eine ganze Seite ohne Installation auf. Nimmst du oft Seiten auf, unterscheiden sich die Erweiterungen unten darin, was kostenlos ist, welchen Website-Zugriff sie bei der Installation verlangen, ob sie Video aufnehmen und ob ihr Quellcode öffentlich ist. Jeder Abschnitt sagt, für wen das Tool passt.

OpenScreenShot ist unser Produkt, und wir nennen die Fälle, in denen ein anderes Tool besser passt. Alle Fakten haben den Stand vom 9. Oktober 2026 und stammen aus Store-Einträgen, Erweiterungs-Manifesten und Anbieterseiten, die in jedem Abschnitt verlinkt sind. Diese Seite vergleicht Funktionen und erstellt keine Rangliste.

## Die Tools im Überblick

| Tool                  | Preis                                                 | Open Source                     | Zugriff auf alle Websites bei Installation | Anmerkungen kostenlos?                                     | PDF                                           | Aufnahme                |
| --------------------- | ----------------------------------------------------- | ------------------------------- | ------------------------------------------ | ---------------------------------------------------------- | --------------------------------------------- | ----------------------- |
| OpenScreenShot        | Kostenlos                                             | Ja, MIT                         | Nein                                       | Ja                                                         | Ja                                            | Nur Tab, Chrome-Version |
| GoFullPage            | Kostenlos; Premium 12 $ pro Jahr                      | Nein                            | Nein                                       | Nein, Premium                                              | Ja; intelligente Seitenaufteilung ist Premium | Nein                    |
| FullPage Capture      | Kostenlos; Pro 19 $ pro Jahr                          | Nein                            | Ja                                         | Ja                                                         | Ja; durchsuchbares PDF ist Pro                | Nein                    |
| Awesome Screenshot    | Kostenloser Tarif; bezahlt ab 5 $ pro Monat           | Kein öffentlicher Quellcode     | Ja                                         | Grundwerkzeuge; alle Werkzeuge in bezahlten Tarifen        | Ja                                            | Desktop, Tab, Kamera    |
| FireShot              | Kostenlos; Pro 39,95 $ pro Jahr oder 99,95 $ einmalig | Nein                            | Nein                                       | Text, Pfeile, Unschärfe laut Eintrag                       | Ja, mit Links; erweitertes PDF ist Pro        | Nein                    |
| FuseBase Pro (Nimbus) | Kostenloser Tarif; Pro-Preis nicht veröffentlicht     | Nein                            | Ja                                         | Anmerkungen und Unschärfe; Aufteilung nicht veröffentlicht | Ja                                            | Bildschirm und Webcam   |
| Chrome DevTools       | Kostenlos, eingebaut                                  | DevTools-Frontend, BSD-3-Clause | Keine Installation                         | Kein Editor dokumentiert                                   | Nicht dokumentiert                            | Nicht dokumentiert      |
| Edge Screenshot       | Kostenlos, eingebaut                                  | Nein                            | Keine Installation                         | Markieren mit Stift und Touch                              | Nicht dokumentiert                            | Nicht dokumentiert      |
| Firefox Screenshots   | Kostenlos, eingebaut                                  | Teil von Firefox                | Keine Installation                         | Nicht dokumentiert                                         | Nicht dokumentiert                            | Nicht dokumentiert      |

„Zugriff auf alle Websites bei Installation“ heißt, dass die Erweiterung beim Hinzufügen Host-Zugriff auf jede Website verlangt. Chrome zeigt diese Anfrage als „Alle Ihre Daten auf allen Websites lesen und ändern“ an.

## OpenScreenShot

[OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) ist kostenlos, hat keine bezahlte Stufe und veröffentlicht seinen [Quellcode auf GitHub](https://github.com/pghqdev/OpenScreenShot) unter der MIT-Lizenz. Es ist im Chrome Web Store und in [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) verfügbar. Ein Klick auf das Symbol in der Symbolleiste startet eine Ganzseiten-Aufnahme; die Modi für sichtbaren Bereich, Ausschnitt und Element liegen im Rechtsklick-Menü und auf Tastenkürzeln. Siehe die [Aufnahmemodi](/de/docs/#modes).

Der Editor bietet Formen, Pfeile, Text, Schrittnummern, Unschärfe mit deckender Füllung, Spotlight, Zuschneiden und Cut. Der Export erfolgt als PNG, JPEG, WebP oder PDF als eine Seite, eingepasst auf A4 oder Letter oder auf mehrere Seiten aufgeteilt. Bei der Installation verlangt es keinen Host-Zugriff. Die Chrome-Version kann [einen Tab aufnehmen](/de/docs/#record) und als MP4 oder WebM speichern; Chrome fragt bei der ersten Aufnahme nach der Tab-Aufnahme. Die Firefox-Version nimmt nur Screenshots auf.

Wo es weniger gut passt:

- Es nimmt Webseiten in einem Browser-Tab auf. Deinen Desktop oder andere Apps kann es nicht aufnehmen, und es zeichnet nur einen Tab auf.
- Es hat keinen Cloud-Speicher und keine Freigabelinks. Die exportierte Datei teilst du selbst.
- Sein PDF enthält den Screenshot als Bild, daher ist der Text nicht durchsuchbar.
- Browserseiten wie die `chrome://`-Einstellungen und die Browser-Stores lassen sich nicht aufnehmen.

## GoFullPage

[GoFullPage](https://gofullpage.com/) nimmt eine Seite mit einem Klick auf und exportiert PNG, JPEG oder PDF. Laut seiner [FAQ](https://gofullpage.com/faq) hat die kostenlose Version kein Limit für Screenshots und für den Bild- und PDF-Export. [Premium](https://gofullpage.com/premium) kostet nach einer 7-tägigen Testphase 12 $ pro Jahr und fügt Zuschneiden, Anmerkungen (Unschärfe, Text, Hervorhebung), URL und Zeitstempel sowie eine intelligente PDF-Seitenaufteilung hinzu.

Der Code ist geschlossen. Laut FAQ hat der Entwickler 2018 einen privaten Fork des ursprünglichen MIT-Projekts erstellt. GoFullPage wurde im August 2026 aus dem Chrome Web Store entfernt, wegen dessen, was sein [Blog](https://blog.gofullpage.com/2026/08/11/gofullpage-chrome-update/) „a copyright-related issue“ (ein Problem im Zusammenhang mit dem Urheberrecht) nennt, und der Haupteintrag kam am 10. September 2026 zurück. Eine offizielle [Firefox-Version](https://addons.mozilla.org/en-US/firefox/addon/gofullpage-screenshot/) erschien am 7. September 2026. Bei der Installation verlangt es keinen Host-Zugriff.

GoFullPage passt für Leute, die Ein-Klick-Aufnahme und PDF-Export ohne Anmerkungen wollen oder für Anmerkungen bezahlen. Siehe [Alternativen zu GoFullPage](/de/alternatives/gofullpage/).

## FullPage Capture

[FullPage Capture](https://fullpagecapture.net/) gibt an, dass Aufnehmen, Speichern, Kopieren und Drucken kostenlos sind, ohne Wasserzeichen und ohne Nutzungslimit. Sein [Chrome-Eintrag](https://chromewebstore.google.com/detail/ggacghlcchiiejclfdajbpkbjfgjhfol) beschreibt einen kostenlosen Editor mit Pfeilen, Formen, Text, Textmarker, nummerierten Markierungen und Unschärfe, dazu PDF mit klickbaren Links. Pro kostet nach einer 7-tägigen Testphase 19 $ pro Jahr und fügt durchsuchbares PDF, einen Beweismodus, Stapelaufnahmen und Cloud-Upload hinzu.

Der Code ist geschlossen, und wir haben nur einen Chrome-Eintrag gefunden. Sein Manifest verlangt Zugriff auf alle Websites, daher zeigt Chrome bei der Installation die Warnung für alle Websites. Es passt für Leute, die durchsuchbare PDFs oder Stapelaufnahmen brauchen und diese Berechtigung akzeptieren. Siehe [Alternativen zu FullPage Capture](/de/alternatives/fullpage-capture/).

## Awesome Screenshot

[Awesome Screenshot](https://chromewebstore.google.com/detail/nlipoenfbbikpbjkfpfillcgkoblgpmj) von Diigo kombiniert Screenshots mit einem Rekorder für den Desktop, einen Tab oder eine Kamera. Seine [Preisseite](https://www.awesomescreenshot.com/pricing) nennt einen kostenlosen Tarif mit bis zu 100 Screenshots, grundlegenden Anmerkungen und Aufnahmen in 720p. Basic kostet 5 $ pro Monat bei jährlicher Abrechnung, und Professional kostet 6 $ pro Monat bei jährlicher Abrechnung mit Aufnahmen bis 4K. Es bietet Cloud-Speicher mit Freigabelinks und lokales Speichern.

Bei der Installation verlangt es Zugriff auf alle Websites, und sein Datenschutzabschnitt in Chrome legt die Erfassung von „Website content“ (Websiteinhalten) offen. Sein [Firefox-Eintrag](https://addons.mozilla.org/en-US/firefox/addon/screenshot-capture-annotate/) nennt die Mozilla Public License 2.0, doch wir haben kein öffentliches Quellcode-Repository gefunden. Es passt für Teams, die Freigabelinks und einen Bildschirmrekorder in einem Tool wollen. Siehe [Alternativen zu Awesome Screenshot](/de/alternatives/awesome-screenshot/).

## FireShot

[FireShot](https://getfireshot.com/) speichert eine ganze Seite als PDF mit Links, als PNG oder als JPEG. FireShot Pro kostet laut seiner [Kaufseite](https://getfireshot.com/buy.php) 39,95 $ pro Jahr oder 99,95 $ einmalig für zwei Geräte. Pro fügt erweiterten PDF-Export, einen Editor mit intelligenten Anmerkungen unter Windows, einen Aufnahmeverlauf und Stapelaufnahmen hinzu. Welche Bearbeitungswerkzeuge die kostenlose Chrome-Version enthält, haben wir nicht bestätigt.

Der Code ist geschlossen. FireShot verlangt bei der Installation keinen Host-Zugriff, fordert aber Native Messaging an, wofür Chrome eine separate Warnung zeigt. Sein [Firefox-Add-on](https://addons.mozilla.org/en-US/firefox/addon/fireshot/) wurde zuletzt am 5. Juni 2023 aktualisiert. FireShot passt für Windows-Nutzer, die Stapelaufnahmen oder eine einmalige Lizenz wollen. Siehe [Alternativen zu FireShot](/de/alternatives/fireshot/).

## Nimbus und FuseBase Pro

Der ursprüngliche Chrome-Eintrag von Nimbus Screenshot zeigt jetzt „This item is not available“ (Dieser Artikel ist nicht verfügbar), und die Nimbus-Aufnahmeseite leitet zu [FuseBase](https://thefusebase.com/screenshot/) weiter. Nimbus Web veröffentlicht jetzt [FuseBase Pro](https://chromewebstore.google.com/detail/fddbloohgcjopkmnjdeodjcfbgiimpcn) für Screenshots, Bildschirm- und Webcam-Aufnahmen, Anmerkungen, Unschärfe und das Speichern als PDF. Es lädt zu FuseBase, Google Drive, Dropbox und Slack hoch.

Der kostenlose Tarif nimmt bis zu 5 Minuten auf, Pro bis zu 10 Stunden. Die [Preisseite von FuseBase](https://thefusebase.com/pricing/) nennt Plattform-Tarife und keinen Preis für die Erweiterung. FuseBase Pro verlangt bei der Installation Zugriff auf alle Websites. Es passt für Leute, die schon mit FuseBase arbeiten. Siehe [Alternativen zu Nimbus](/de/alternatives/nimbus/).

## Ohne Installation: im Browser eingebaute Tools

### Chrome DevTools

Öffne die DevTools, drücke Ctrl+Shift+P (Cmd+Shift+P auf macOS), tippe „screenshot“ und wähle **Capture full size screenshot** (Screenshot in voller Größe aufnehmen). Chrome speichert ein PNG. Die Dokumentation beschreibt keinen Editor; die [Dokumentation zum Befehlsmenü](https://developer.chrome.com/docs/devtools/command-menu) listet die anderen Screenshot-Befehle. Siehe [die Chrome-Anleitung](/de/full-page-screenshot/chrome/).

### Microsoft Edge Screenshot

Edge hat Web Capture in Screenshot umbenannt, und Ctrl+Shift+S öffnet es, laut Microsofts [Richtlinienseite](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/webcaptureenabled). Es nimmt eine ganze Seite oder einen Bereich auf, und du kannst mit Stift oder Touch darauf markieren. Siehe [die Edge-Anleitung](/de/full-page-screenshot/edge/).

### Firefox Screenshots

Klicke mit der rechten Maustaste auf eine Seite, wähle **Take Screenshot** (Bildschirmfoto aufnehmen) und dann **Save full page** (Gesamte Seite speichern), laut [Mozillas Anleitung](https://blog.mozilla.org/en/firefox/how-to-capture-screenshots-with-firefox/). Das Ergebnis kopierst du oder lädst es herunter. Uploads auf einen Mozilla-Server endeten mit Firefox 67 im Mai 2019. Siehe [die Firefox-Anleitung](/de/full-page-screenshot/firefox/).

Für Safari, Brave, Opera, Vivaldi und Arc siehe die [Anleitungen nach Browser](/de/full-page-screenshot/).

## Welches Tool du wählen solltest

- **Eine Seite, heute, ohne Installation:** das eingebaute Tool in deinem Browser.
- **Kostenlose Anmerkungen und PDF, kein Zugriff auf alle Websites bei Installation, lesbarer Quellcode:** OpenScreenShot.
- **Ein-Klick-Aufnahme ohne Anmerkungen:** die kostenlose Version von GoFullPage.
- **Durchsuchbares PDF oder Stapelaufnahmen:** FullPage Capture Pro oder FireShot Pro.
- **Freigabelinks und Desktop-Aufnahme für ein Team:** Awesome Screenshot oder FuseBase Pro.
- **Screenshots von Desktop-Apps:** ein Desktop-Tool; siehe [Open-Source-Screenshot-Tools für jede Plattform](/de/blog/open-source-screenshot-tools/).
- **Screenshots aus einem Skript oder aus CI:** siehe [Website-Screenshot-Tools für Entwickler](/de/blog/website-screenshot-tools-for-developers/).

Alle diese Tools können mit endlosen Feeds und nachgeladenen Bildern Probleme haben; die [Chrome-Anleitung für ganze Seiten](/de/blog/full-page-screenshot-chrome/) erklärt, wie du eine Aufnahme prüfst. Einen direkten Vergleich von OpenScreenShot, GoFullPage und FullPage Capture findest du auf der [Vergleichsseite](/de/compare/).
