---
title: Strumenti per screenshot di siti web per sviluppatori, CI e agenti AI
description: La CLI e il server MCP openscreenshot, shot-scraper, capture-website-cli, pageres-cli, Playwright, Puppeteer e Playwright MCP a confronto per runtime, pagina intera, CLI, MCP, video e licenza.
audience: developers
order: 9
---

Per un PNG di una pagina pubblica da uno script di shell o da un job di CI basta uno strumento a riga di comando: openscreenshot, shot-scraper, capture-website-cli o pageres-cli. Quando la cattura richiede un login, clic, asserzioni o video, scrivila con Playwright o Puppeteer. Per un agente AI, un server MCP locale restituisce gli screenshot al modello: `openscreenshot serve` fa uno screenshot per chiamata, e Playwright MCP guida un’intera sessione del browser.

Il pacchetto `openscreenshot` è un nostro prodotto, e questa pagina dice dove è la scelta più debole. Confronta le funzioni e non stila una classifica degli strumenti. Tutti i fatti sono aggiornati al 9 ottobre 2026 e vengono dal repository, dal registro dei pacchetti o dalla documentazione ufficiale di ogni progetto, con i link qui sotto.

## Gli strumenti in sintesi

| Strumento           | Linguaggio / runtime                               | Pagina intera        | CLI          | MCP                    | Video              | Licenza    |
| ------------------- | -------------------------------------------------- | -------------------- | ------------ | ---------------------- | ------------------ | ---------- |
| openscreenshot      | Node.js 22.12+, Chrome, Chromium o Edge installato | `--full`             | Sì           | Sì, stdio              | No                 | MIT        |
| shot-scraper        | Python 3.10+, browser di Playwright                | Predefinita          | Sì           | Non indicato           | Sì, WebM o MP4     | Apache-2.0 |
| capture-website-cli | Node.js 20+, Chrome di Puppeteer                   | `--full-page`        | Sì           | Non indicato           | No                 | MIT        |
| pageres-cli         | Node.js 20+, Chrome di Puppeteer                   | Predefinita          | Sì           | Non indicato           | No                 | MIT        |
| Playwright          | Node.js, Python, Java, .NET                        | `fullPage: true`     | Test runner  | Tramite Playwright MCP | Sì                 | Apache-2.0 |
| Puppeteer           | Node.js 22.12+                                     | `fullPage: true`     | Non indicato | Non indicato           | Sì, MP4 in Chrome  | Apache-2.0 |
| Playwright MCP      | Node.js tramite `npx`, o Docker                    | Parametro `fullPage` | Solo server  | Sì, stdio o HTTP       | Sì, su attivazione | Apache-2.0 |

«Non indicato» significa che la documentazione del progetto che abbiamo consultato non descrive la funzione.

## openscreenshot (CLI e server MCP)

[openscreenshot](https://www.npmjs.com/package/openscreenshot) guida il Chrome, Chromium o Edge già presente sul tuo computer tramite `puppeteer-core`, quindi non scarica alcun browser. Un solo comando salva un PNG a pagina intera:

```sh
npx openscreenshot shot https://example.com --out example.png --full
```

I flag sono `--out` (un file, o `-` per stdout), `--full`, `--width` (da 200 a 3840, predefinito 1280) e `--height` (da 200 a 2160, predefinito 800). Il codice di uscita 0 significa che è stato scritto un PNG, 1 che la cattura non è riuscita e 2 un uso errato. `openscreenshot serve` avvia un server MCP su stdio con un solo strumento, `capture_screenshot`, che accetta `url`, `fullPage`, `width` e `height` e restituisce un’immagine PNG. La [guida alla CLI](/it/blog/screenshot-cli/), la [guida MCP](/it/blog/screenshot-mcp-server/) e la [guida alla CI](/it/blog/screenshots-for-ci/) coprono la configurazione, e il [sorgente](https://github.com/pghqdev/OpenScreenShot/tree/main/mcp/src) è il riferimento.

Dove è la scelta più debole:

- Ogni cattura avvia un browser nuovo con un profilo vuoto. Non ha cookie, login, clic o attese su selettori, quindi una pagina dietro login mostra la schermata di login.
- La navigazione aspetta `networkidle2` fino a 30 secondi, senza opzioni di attesa aggiuntive. Le pagine che si completano dopo che la rete si è calmata possono risultare caricate a metà.
- L’output è solo PNG, senza PDF né video.
- Il server MCP è solo stdio locale, senza URL ospitato né trasporto HTTP. Lo strumento restituisce un’immagine e non scrive un file.
- Il browser gira con `--no-sandbox` per funzionare nei container. Cattura solo URL di cui ti fidi.
- Su Windows, Edge e le installazioni di Chrome per singolo utente non vengono rilevati; imposta `CHROME_PATH`.

Per pagine con accesso, annotazioni o esportazione PDF a mano, usa l’[estensione per il browser](/it/docs/).

## shot-scraper

[shot-scraper](https://github.com/simonw/shot-scraper) è uno strumento Python basato su Playwright. Installalo, scarica il suo browser e fai uno screenshot, secondo la sua [documentazione sugli screenshot](https://github.com/simonw/shot-scraper/blob/main/docs/screenshots.md):

```sh
pip install shot-scraper
shot-scraper install
shot-scraper https://example.com -o example.png
```

Quando ometti `--height`, lo screenshot è a pagina intera. `--selector` cattura un elemento, `shot-scraper pdf` salva un PDF e `multi` esegue un elenco YAML di screenshot. Il comando `video`, aggiunto nella [1.10](https://github.com/simonw/shot-scraper/releases/tag/1.10), registra un WebM da uno storyboard YAML, e `--mp4` lo converte con ffmpeg. Chromium è il browser predefinito, e Firefox e WebKit si possono installare. Sceglilo quando il tuo team lavora in Python o vuoi screenshot, PDF e video dimostrativi scriptati da un solo strumento.

## capture-website-cli

[capture-website-cli](https://github.com/sindresorhus/capture-website-cli) è uno strumento Node.js di Sindre Sorhus che cattura le pagine con Puppeteer. Il valore predefinito è la viewport; `--full-page` cattura l’intera pagina scorrevole:

```sh
npm install --global capture-website-cli
capture-website https://example.com --output=screenshot.png --full-page
```

Senza `--output`, scrive l’immagine su stdout. Produce PNG, JPEG o WebP. Flag come `--element`, `--hide-elements`, `--remove-elements`, `--click-element`, `--dark-mode`, `--style` e `--script` preparano la pagina prima della cattura, cosa che openscreenshot non sa fare. Sceglilo quando devi nascondere i banner dei cookie o iniettare CSS prima di una cattura.

## pageres-cli

[pageres-cli](https://github.com/sindresorhus/pageres-cli) cattura più URL a più risoluzioni in un’unica esecuzione:

```sh
pageres https://example.com 1366x768 1600x900
```

Cattura ogni coppia di URL e risoluzione, a pagina intera per impostazione predefinita; `--crop` limita ogni immagine all’altezza impostata. L’output è PNG o JPEG, e la dimensione predefinita è 1366x768. Le parole chiave dei dispositivi come `iphone5s` non sono più supportate. L’attività è scarsa: l’ultima release, v9.0.0 del 9 settembre 2025, ha alzato il requisito di Node.js a 20 e aggiunto tre flag. Sceglilo per un rapido controllo responsive su più larghezze.

## Playwright

[Playwright](https://github.com/microsoft/playwright) è il framework di automazione e test di Microsoft per Chromium, Firefox e WebKit, con binding per Node.js, Python, Java e .NET. Uno screenshot a pagina intera è un’opzione di [`page.screenshot`](https://playwright.dev/docs/api/class-page#page-screenshot):

```js
await page.screenshot({ path: 'page.png', fullPage: true });
```

[`page.pdf()`](https://playwright.dev/docs/api/class-page#page-pdf) funziona solo in Chromium headless. La [registrazione video](https://playwright.dev/docs/videos) è un’opzione del contesto, e il test runner può conservare il video solo per i test falliti. Scegli Playwright quando lo screenshot è un passaggio di un test che fa login, clicca e verifica asserzioni.

## Puppeteer

[Puppeteer](https://github.com/puppeteer/puppeteer) è la libreria Node.js di Google per Chrome e Firefox. `npm i puppeteer` scarica Chrome for Testing. Le [opzioni degli screenshot](https://pptr.dev/api/puppeteer.screenshotoptions) hanno la stessa forma:

```js
await page.screenshot({ path: 'page.png', fullPage: true });
```

[`page.pdf()`](https://pptr.dev/api/puppeteer.page.pdf) genera un PDF con il CSS di stampa. [`page.record()`](https://pptr.dev/api/puppeteer.page.record), aggiunto in puppeteer-core 25.10.0, registra MP4 in Chrome. Firefox funziona tramite WebDriver BiDi, dove alcune funzioni non sono supportate. openscreenshot è un sottile wrapper attorno a `puppeteer-core`, quindi usa Puppeteer direttamente quando ti serve più delle sue quattro opzioni di cattura.

## Playwright MCP

[Playwright MCP](https://github.com/microsoft/playwright-mcp) permette a un agente di guidare un browser tramite snapshot di accessibilità, quindi non ha bisogno di un modello visivo. Il suo [README](https://github.com/microsoft/playwright-mcp/blob/v0.0.83/README.md) fornisce questa configurazione standard:

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

Lo strumento `browser_take_screenshot` accetta un parametro `fullPage` e restituisce PNG, JPEG o WebP. Gli strumenti per PDF e video si attivano tramite `--caps`. Il browser gira con interfaccia visibile per impostazione predefinita e mantiene un profilo persistente, quindi i login possono restare attivi; `--isolated`, `--storage-state` e `--extension` (per collegarsi a un Chrome o Edge in esecuzione) cambiano questo comportamento. `--port` serve via HTTP invece che via stdio. È ancora una release 0.0.x (v0.0.83). Sceglilo al posto di `openscreenshot serve` quando l’agente deve accedere, cliccare o compilare moduli.

## Quale scegliere

- **Un PNG di una pagina pubblica in uno script o come artefatto di CI:** openscreenshot, shot-scraper o capture-website-cli.
- **La stessa pagina a più larghezze:** pageres-cli.
- **Nascondere elementi o iniettare CSS prima:** capture-website-cli o shot-scraper.
- **PDF o un video dimostrativo scriptato dalla riga di comando:** shot-scraper.
- **Login, clic e asserzioni in una suite di test:** Playwright o Puppeteer.
- **Un agente che deve solo guardare una pagina:** `openscreenshot serve`.
- **Un agente che deve interagire con la pagina o accedere:** Playwright MCP.
- **Una persona che cattura e annota pagine con accesso:** un’estensione; vedi il [confronto tra estensioni per la pagina intera](/it/blog/full-page-screenshot-extensions/).
