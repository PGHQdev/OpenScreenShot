---
title: Open-Source-Screenshot-Tools für jede Plattform
description: Open-Source-Screenshot-Tools nach Einsatzort sortiert, von OpenScreenShot und Screenity im Browser über ShareX unter Windows und Flameshot unter Linux, macOS und Windows bis zu Firefox Screenshots und shot-scraper, Playwright und Puppeteer für Skripte.
audience: everyday
order: 8
---

Wähle ein Open-Source-Screenshot-Tool danach, wo das liegt, was du aufnimmst. Für alles auf einem Windows-Bildschirm nimm ShareX. Für Desktops unter Linux, macOS oder Windows nimm Flameshot. Für Webseiten nimm ein Browser-Tool wie OpenScreenShot oder das in Firefox eingebaute Screenshots-Tool, und für Screenshots aus einem Skript nimm shot-scraper, Playwright oder Puppeteer.

OpenScreenShot ist unser Produkt. Diese Seite sagt, wo es nicht passt, und erstellt keine Rangliste. Alle Fakten haben den Stand vom 9. Oktober 2026 und stammen aus dem Repository, dem Store-Eintrag oder der offiziellen Website jedes Projekts, unten verlinkt.

## Welches Tool welche Plattform abdeckt

| Tool                | Läuft auf                                                    | Nimmt auf                                                              | Lizenz           | Ganze Seite        | Video                            |
| ------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------- | ---------------- | ------------------ | -------------------------------- |
| OpenScreenShot      | Chrome, Firefox                                              | Webseiten in einem Tab                                                 | MIT              | Ja                 | Tab-Aufnahme, nur Chrome-Version |
| Screenity           | Chrome und Chromium-Browser, die den Chrome Web Store nutzen | Aufnahmen eines Tabs, Bereichs, Desktops, App-Fensters oder der Kamera | GPL-3.0          | Nicht dokumentiert | Ja                               |
| ShareX              | Windows                                                      | Alles auf dem Bildschirm                                               | GPL-3.0          | Scroll-Aufnahme    | Video und GIF                    |
| Flameshot           | Linux, macOS, Windows                                        | Einen Bildschirmbereich                                                | GPL-3.0          | Nein               | Nicht dokumentiert               |
| Firefox Screenshots | Firefox für Desktop                                          | Webseiten                                                              | Teil von Firefox | Ja                 | Nicht dokumentiert               |
| shot-scraper        | Python 3.10 oder neuer                                       | Webseiten, per Befehl                                                  | Apache-2.0       | Ja, standardmäßig  | Ja, aus einer Skriptdatei        |
| Playwright          | Node.js, Python, Java, .NET                                  | Webseiten, per Code                                                    | Apache-2.0       | Ja                 | Ja                               |
| Puppeteer           | Node.js                                                      | Webseiten, per Code                                                    | Apache-2.0       | Ja                 | Ja, Chrome                       |

Keines dieser Tools läuft auf Android oder iOS. Eine Browsererweiterung sieht nur die Webseite in ihrem Tab. Eine Desktop-App sieht den ganzen Bildschirm, weiß aber nicht, wo eine Webseite endet.

## Im Browser: OpenScreenShot

[OpenScreenShot](https://github.com/pghqdev/OpenScreenShot) ist eine MIT-lizenzierte Erweiterung für [Chrome](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) und [Firefox](https://addons.mozilla.org/firefox/addon/openscreenshot/). Sie nimmt eine ganze Seite, den sichtbaren Bereich, einen Ausschnitt oder ein einzelnes Element auf. Dann öffnet sie einen Editor mit Pfeilen, Formen, Text, Schrittnummern, Unschärfe und Zuschneiden und exportiert PNG, JPEG, WebP oder PDF. Aufnahme und Bearbeitung laufen in deinem Browser, und die Erweiterung lädt deine Screenshots und Aufnahmen nicht hoch. Die [Dokumentation](/de/docs/) behandelt jeden Modus.

Die Chrome-Version [nimmt auch einen Tab auf](/de/docs/#record), optional mit Mikrofon, Tab-Audio und Webcam, und exportiert MP4 oder WebM. Die Firefox-Version nimmt nur Screenshots auf.

OpenScreenShot ist das falsche Tool, wenn das, was du brauchst, außerhalb eines Browser-Tabs liegt. Es kann weder den Desktop noch eine andere App noch eine Einstellungsseite des Browsers aufnehmen, und es zeichnet nicht den ganzen Bildschirm auf.

## Aufnahme im Browser: Screenity

[Screenity](https://github.com/alyssaxuu/screenity) ist eine Erweiterung für Bildschirmaufnahmen und Anmerkungen in Chrome. Sie nimmt einen Tab, einen Bereich, den Desktop, jedes App-Fenster oder die Kamera auf, mit Mikrofon und internem Audio. Sie exportiert MP4, GIF oder WebM oder speichert in Google Drive. Du kannst zeichnen, Text, Pfeile und Formen hinzufügen und sensible Seiteninhalte unscharf machen.

Die Lizenz ist [GPL-3.0](https://github.com/alyssaxuu/screenity/blob/master/LICENSE). Laut README wechselte die Lizenz für die Manifest-V3-Version ab Version 3.0.0 zu GPLv3. Die Erweiterung ist kostenlos und braucht für lokale Aufnahmen keine Anmeldung. [Screenity Pro](https://screenity.io/pro) kostet nach einer 7-tägigen Testphase 10 $ pro Monat oder 120 $ pro Jahr und fügt einen Editor, Link-Freigabe und Cloud-Hosting auf EU-Servern hinzu, mit Konto. Laut README verbinden sich manche Codepfade mit Screenity Pro, und sie sind nur in der Version aus dem Chrome Web Store aktiv.

Screenity verlangt bei der Installation Zugriff auf alle Websites. Seine Dokumentation beschreibt keine Ganzseiten-Screenshots. Wähle es statt OpenScreenShot, wenn du den Desktop oder eine andere App aufnehmen musst; siehe [Alternativen zu Screenity](/de/alternatives/screenity/).

## Windows: ShareX

[ShareX](https://getsharex.com/) ist eine kostenlose Windows-App ohne Werbung, lizenziert unter [GPL-3.0](https://github.com/ShareX/ShareX). Sie nimmt den Bildschirm, ein Fenster oder einen Bereich auf, und ihre [Scroll-Aufnahme](https://getsharex.com/docs/scrolling-screenshot) vergleicht aufeinanderfolgende Screenshots und hängt die geänderten Abschnitte an, sodass ein Bild Inhalte enthalten kann, die über den Bildschirm hinaus scrollen. Sie nimmt auch Videos und GIFs auf, und ihr README nennt OCR und das Scannen von QR-Codes.

Der Bildeditor hat Formen, Pfeile, Text, Sprechblasen, Unschärfe, Verpixeln, Hervorheben und Spotlight. ShareX kann zu vielen Diensten hochladen, und Aufgaben nach der Aufnahme können automatisch hochladen, wenn du sie so einrichtest. Prüfe diese Einstellungen, bevor du private Inhalte aufnimmst. Du bekommst es als Installer, als portable Version oder aus dem Microsoft Store oder von Steam. Die neueste Version, v21.0.0, erschien am 3. Juli 2026.

ShareX läuft nicht unter macOS oder Linux.

## Linux, macOS und Windows: Flameshot

[Flameshot](https://flameshot.org/) ist ein kostenloses Screenshot-Tool für Linux, macOS und Windows, lizenziert unter [GPL-3.0](https://github.com/flameshot-org/flameshot). Du wählst einen Bereich und kommentierst ihn direkt mit Pfeilen, Hervorhebungen, Unschärfe oder Verpixeln, Text, Freihandlinien, Kästen und Zählnummern. Es hat auch eine Kommandozeilen-Schnittstelle. Sein README nennt einen optionalen Upload zu Imgur, den die Return-Taste startet, also lerne diese Taste kennen, bevor du private Inhalte aufnimmst.

[Version 14.0.0](https://github.com/flameshot-org/flameshot/releases/tag/v14.0.0) (Juni 2026) fragt, welcher Monitor aufgenommen werden soll, und nutzt unter Linux xdg-desktop-portal als Hauptweg für die Aufnahme. Das README nennt die Unterstützung für GNOME und Plasma unter Wayland experimentell.

Flameshot hat keine Scroll-Aufnahme. Der [Feature-Request](https://github.com/flameshot-org/flameshot/issues/1130) ist noch offen. In seiner Dokumentation haben wir keine Aufnahmefunktion für Video gefunden. Für eine ganze Webseite unter Linux kombinierst du Flameshot mit einem Browser-Tool.

## Eingebaut: Firefox Screenshots

Firefox ist Open Source, und sein Screenshots-Tool braucht keine Installation. Klicke mit der rechten Maustaste auf eine Seite, wähle **Take Screenshot** (Bildschirmfoto aufnehmen) und dann einen Bereich, den sichtbaren Bereich oder **Save full page** (Gesamte Seite speichern), laut [Mozillas Anleitung](https://blog.mozilla.org/en/firefox/how-to-capture-screenshots-with-firefox/). Das Ergebnis kopierst du oder lädst es herunter. Mozilla [beendete die Uploads](https://blog.mozilla.org/futurereleases/2019/01/24/clarifying-the-future-of-firefox-screenshots/) auf seinen Screenshots-Server mit Firefox 67 (Mai 2019), daher bleiben Aufnahmen lokal.

Für einen Befehl akzeptiert die Konsole der Firefox-DevTools `:screenshot --fullpage`, das laut der [DevTools-Dokumentation](https://firefox-source-docs.mozilla.org/devtools-user/taking_screenshots/index.html) ein PNG in Downloads speichert. Auch das DevTools-Frontend von Chrome ist Open Source, unter [BSD-3-Clause](https://github.com/ChromeDevTools/devtools-frontend), und sein Befehl **Capture full size screenshot** (Screenshot in voller Größe aufnehmen) speichert ein PNG. Die [Anleitungen für Ganzseiten-Screenshots](/de/full-page-screenshot/) behandeln jeden Browser.

## Aus einem Skript: shot-scraper, Playwright, Puppeteer

Diese Tools nehmen Webseiten per Befehl oder per Code auf, für wiederkehrende Arbeit und CI. Sie laden die Seite in ihrem eigenen Browser und sehen daher deine angemeldeten Tabs nicht.

- [shot-scraper](https://github.com/simonw/shot-scraper) ist ein Python-Kommandozeilen-Tool auf Basis von Playwright. Es nimmt standardmäßig Ganzseiten-Screenshots auf, speichert auch PDFs und nimmt Videos aus einem YAML-Skript auf.
- [Playwright](https://github.com/microsoft/playwright) ist Microsofts Framework für Browser-Automatisierung und Tests für Chromium, Firefox und WebKit, mit APIs für Screenshots, PDF und Video.
- [Puppeteer](https://github.com/puppeteer/puppeteer) ist Googles Node.js-Bibliothek für Chrome und Firefox, mit APIs für Screenshots, PDF und MP4-Aufnahmen.

Unser eigenes MIT-lizenziertes Paket `openscreenshot` bringt ein Kommandozeilen-Tool und einen MCP-Server für KI-Agenten mit. Der [Vergleich für Entwickler](/de/blog/website-screenshot-tools-for-developers/) behandelt all diese Tools mit Befehlen.

## Welches Tool du wählen solltest

- **Alles auf einem Windows-Bildschirm, mit Scroll-Aufnahme:** ShareX.
- **Ein Bildschirmbereich unter Linux oder macOS:** Flameshot.
- **Eine ganze Webseite mit Anmerkungen und PDF-Export:** OpenScreenShot, oder Firefox Screenshots für eine schnelle Aufnahme ohne Installation.
- **Eine Aufnahme des Desktops oder einer anderen App:** Screenity, oder ShareX unter Windows.
- **Screenshots aus einem Skript oder aus CI:** shot-scraper, Playwright oder Puppeteer.

Muss das Tool nicht Open Source sein, ergänzt der [Vergleich der Erweiterungen für ganze Seiten](/de/blog/full-page-screenshot-extensions/) GoFullPage, FireShot und weitere. Die [Vergleichsseite](/de/compare/) stellt OpenScreenShot, GoFullPage und FullPage Capture nebeneinander.
