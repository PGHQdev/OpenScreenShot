---
title: Website-Screenshot-Tools für Entwickler, CI und KI-Agenten
description: Vergleich von openscreenshot CLI und MCP-Server, shot-scraper, capture-website-cli, pageres-cli, Playwright, Puppeteer und Playwright MCP nach Laufzeit, Ganzseiten-Support, CLI, MCP, Video und Lizenz.
audience: developers
order: 9
---

Für ein PNG einer öffentlichen Seite aus einem Shell-Skript oder CI-Job reicht ein Kommandozeilen-Tool: openscreenshot, shot-scraper, capture-website-cli oder pageres-cli. Braucht die Aufnahme einen Login, Klicks, Assertions oder Video, schreibe sie mit Playwright oder Puppeteer. Für einen KI-Agenten gibt ein lokaler MCP-Server Screenshots an das Modell zurück: `openscreenshot serve` nimmt pro Aufruf einen Screenshot auf, und Playwright MCP steuert eine ganze Browsersitzung.

Das Paket `openscreenshot` ist unser Produkt, und diese Seite sagt, wo es die schwächere Wahl ist. Sie vergleicht Funktionen und erstellt keine Rangliste. Alle Fakten haben den Stand vom 9. Oktober 2026 und stammen aus dem Repository, der Paket-Registry oder der offiziellen Dokumentation jedes Projekts, unten verlinkt.

## Die Tools im Überblick

| Tool                | Sprache / Laufzeit                                       | Ganze Seite          | CLI           | MCP                 | Video             | Lizenz     |
| ------------------- | -------------------------------------------------------- | -------------------- | ------------- | ------------------- | ----------------- | ---------- |
| openscreenshot      | Node.js 22.12+, installiertes Chrome, Chromium oder Edge | `--full`             | Ja            | Ja, stdio           | Nein              | MIT        |
| shot-scraper        | Python 3.10+, Playwright-Browser                         | Standard             | Ja            | Nicht genannt       | Ja, WebM oder MP4 | Apache-2.0 |
| capture-website-cli | Node.js 20+, Puppeteer-Chrome                            | `--full-page`        | Ja            | Nicht genannt       | Nein              | MIT        |
| pageres-cli         | Node.js 20+, Puppeteer-Chrome                            | Standard             | Ja            | Nicht genannt       | Nein              | MIT        |
| Playwright          | Node.js, Python, Java, .NET                              | `fullPage: true`     | Test-Runner   | Über Playwright MCP | Ja                | Apache-2.0 |
| Puppeteer           | Node.js 22.12+                                           | `fullPage: true`     | Nicht genannt | Nicht genannt       | Ja, MP4 in Chrome | Apache-2.0 |
| Playwright MCP      | Node.js über `npx` oder Docker                           | Parameter `fullPage` | Nur Server    | Ja, stdio oder HTTP | Ja, optional      | Apache-2.0 |

„Nicht genannt“ heißt, dass die eigene Dokumentation des Projekts, die wir geprüft haben, die Funktion nicht beschreibt.

## openscreenshot (CLI und MCP-Server)

[openscreenshot](https://www.npmjs.com/package/openscreenshot) steuert das Chrome, Chromium oder Edge, das schon auf deinem Gerät ist, über `puppeteer-core` und lädt daher keinen Browser herunter. Ein Befehl speichert ein Ganzseiten-PNG:

```sh
npx openscreenshot shot https://example.com --out example.png --full
```

Die Flags sind `--out` (eine Datei oder `-` für stdout), `--full`, `--width` (200 bis 3840, Standard 1280) und `--height` (200 bis 2160, Standard 800). Exit-Code 0 heißt, dass ein PNG geschrieben wurde, 1, dass die Aufnahme fehlgeschlagen ist, und 2 eine falsche Verwendung. `openscreenshot serve` startet einen MCP-Server über stdio mit einem Tool, `capture_screenshot`, das `url`, `fullPage`, `width` und `height` annimmt und PNG-Bildinhalt zurückgibt. Die [CLI-Anleitung](/de/blog/screenshot-cli/), die [MCP-Anleitung](/de/blog/screenshot-mcp-server/) und die [CI-Anleitung](/de/blog/screenshots-for-ci/) behandeln die Einrichtung, und der [Quellcode](https://github.com/pghqdev/OpenScreenShot/tree/main/mcp/src) ist die Referenz.

Wo es die schwächere Wahl ist:

- Jede Aufnahme startet einen frischen Browser mit leerem Profil. Es gibt keine Cookies, keinen Login, keine Klicks und kein Warten auf Selektoren, daher zeigt eine Seite hinter einem Login den Login-Bildschirm.
- Die Navigation wartet bis zu 30 Sekunden auf `networkidle2`, ohne Option für zusätzliches Warten. Seiten, die rendern, nachdem das Netzwerk ruhig geworden ist, können halb geladen herauskommen.
- Die Ausgabe ist nur PNG, ohne PDF oder Video.
- Der MCP-Server ist nur lokal über stdio verfügbar, ohne gehostete URL oder HTTP-Transport. Das Tool gibt ein Bild zurück und schreibt keine Datei.
- Der Browser läuft mit `--no-sandbox`, damit er in Containern funktioniert. Nimm nur URLs auf, denen du vertraust.
- Unter Windows werden Edge und Chrome-Installationen pro Benutzer nicht erkannt; setze `CHROME_PATH`.

Für angemeldete Seiten, Anmerkungen oder PDF-Export von Hand nutze die [Browsererweiterung](/de/docs/).

## shot-scraper

[shot-scraper](https://github.com/simonw/shot-scraper) ist ein Python-Tool auf Basis von Playwright. Installiere es, lade seinen Browser herunter und nimm einen Screenshot auf, laut seiner [Screenshot-Dokumentation](https://github.com/simonw/shot-scraper/blob/main/docs/screenshots.md):

```sh
pip install shot-scraper
shot-scraper install
shot-scraper https://example.com -o example.png
```

Lässt du `--height` weg, wird der Screenshot ganzseitig. `--selector` nimmt ein Element auf, `shot-scraper pdf` speichert ein PDF, und `multi` führt eine YAML-Liste von Aufnahmen aus. Der Befehl `video`, hinzugefügt in [1.10](https://github.com/simonw/shot-scraper/releases/tag/1.10), nimmt WebM aus einem YAML-Storyboard auf, und `--mp4` wandelt es mit ffmpeg um. Chromium ist der Standardbrowser, Firefox und WebKit lassen sich installieren. Wähle es, wenn dein Team in Python arbeitet oder du Screenshots, PDFs und geskriptete Demo-Videos aus einem Tool willst.

## capture-website-cli

[capture-website-cli](https://github.com/sindresorhus/capture-website-cli) ist ein Node.js-Tool von Sindre Sorhus, das Seiten mit Puppeteer aufnimmt. Standard ist der Viewport; `--full-page` nimmt die ganze scrollbare Seite auf:

```sh
npm install --global capture-website-cli
capture-website https://example.com --output=screenshot.png --full-page
```

Ohne `--output` schreibt es das Bild nach stdout. Es gibt PNG, JPEG oder WebP aus. Flags wie `--element`, `--hide-elements`, `--remove-elements`, `--click-element`, `--dark-mode`, `--style` und `--script` bereiten die Seite vor der Aufnahme vor, was openscreenshot nicht kann. Wähle es, wenn du vor einer Aufnahme Cookie-Banner ausblenden oder CSS einschleusen musst.

## pageres-cli

[pageres-cli](https://github.com/sindresorhus/pageres-cli) nimmt mehrere URLs in mehreren Auflösungen in einem Durchlauf auf:

```sh
pageres https://example.com 1366x768 1600x900
```

Es nimmt jedes Paar aus URL und Auflösung auf, standardmäßig ganzseitig; `--crop` begrenzt jedes Bild auf die eingestellte Höhe. Die Ausgabe ist PNG oder JPEG, und die Standardgröße ist 1366x768. Geräte-Schlüsselwörter wie `iphone5s` werden nicht mehr unterstützt. Die Aktivität ist gering: Die letzte Version, v9.0.0 vom 9. September 2025, hob die Node.js-Anforderung auf 20 an und fügte drei Flags hinzu. Wähle es für eine schnelle responsive Prüfung über mehrere Breiten.

## Playwright

[Playwright](https://github.com/microsoft/playwright) ist Microsofts Framework für Automatisierung und Tests für Chromium, Firefox und WebKit, mit Bindings für Node.js, Python, Java und .NET. Ein Ganzseiten-Screenshot ist eine Option von [`page.screenshot`](https://playwright.dev/docs/api/class-page#page-screenshot):

```js
await page.screenshot({ path: 'page.png', fullPage: true });
```

[`page.pdf()`](https://playwright.dev/docs/api/class-page#page-pdf) funktioniert nur in Headless-Chromium. Die [Videoaufnahme](https://playwright.dev/docs/videos) ist eine Kontext-Option, und der Test-Runner kann Videos nur für fehlgeschlagene Tests behalten. Wähle Playwright, wenn der Screenshot ein Schritt in einem Test ist, der sich anmeldet, klickt und Assertions prüft.

## Puppeteer

[Puppeteer](https://github.com/puppeteer/puppeteer) ist Googles Node.js-Bibliothek für Chrome und Firefox. `npm i puppeteer` lädt Chrome for Testing herunter. Die [Screenshot-Optionen](https://pptr.dev/api/puppeteer.screenshotoptions) haben dieselbe Form:

```js
await page.screenshot({ path: 'page.png', fullPage: true });
```

[`page.pdf()`](https://pptr.dev/api/puppeteer.page.pdf) erzeugt ein PDF mit Druck-CSS. [`page.record()`](https://pptr.dev/api/puppeteer.page.record), hinzugefügt in puppeteer-core 25.10.0, nimmt MP4 in Chrome auf. Firefox läuft über WebDriver BiDi, wo manche Funktionen nicht unterstützt werden. openscreenshot ist eine dünne Hülle um `puppeteer-core`, nutze also Puppeteer direkt, wenn du mehr als seine vier Aufnahmeoptionen brauchst.

## Playwright MCP

[Playwright MCP](https://github.com/microsoft/playwright-mcp) lässt einen Agenten einen Browser über Barrierefreiheits-Snapshots steuern und braucht daher kein Vision-Modell. Sein [README](https://github.com/microsoft/playwright-mcp/blob/v0.0.83/README.md) nennt diese Standardkonfiguration:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

Das Tool `browser_take_screenshot` nimmt einen Parameter `fullPage` an und gibt PNG, JPEG oder WebP zurück. Tools für PDF und Video werden über `--caps` eingeschaltet. Der Browser läuft standardmäßig mit sichtbarem Fenster und behält ein dauerhaftes Profil, sodass Logins erhalten bleiben können; `--isolated`, `--storage-state` und `--extension` (zum Verbinden mit einem laufenden Chrome oder Edge) ändern das. `--port` stellt HTTP statt stdio bereit. Es ist noch eine 0.0.x-Version (v0.0.83). Wähle es statt `openscreenshot serve`, wenn der Agent sich anmelden, klicken oder Formulare ausfüllen muss.

## Welches Tool du wählen solltest

- **Ein PNG einer öffentlichen Seite in einem Skript oder als CI-Artefakt:** openscreenshot, shot-scraper oder capture-website-cli.
- **Dieselbe Seite in mehreren Breiten:** pageres-cli.
- **Erst Elemente ausblenden oder CSS einschleusen:** capture-website-cli oder shot-scraper.
- **PDF oder ein geskriptetes Demo-Video über die Kommandozeile:** shot-scraper.
- **Login, Klicks und Assertions in einer Testsuite:** Playwright oder Puppeteer.
- **Ein Agent, der eine Seite nur ansehen muss:** `openscreenshot serve`.
- **Ein Agent, der mit der Seite interagieren oder sich anmelden muss:** Playwright MCP.
- **Eine Person, die angemeldete Seiten aufnimmt und kommentiert:** eine Erweiterung; siehe den [Vergleich der Erweiterungen für ganze Seiten](/de/blog/full-page-screenshot-extensions/).
