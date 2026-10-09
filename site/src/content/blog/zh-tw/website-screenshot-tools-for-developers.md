---
title: 給開發者、CI 與 AI 代理的網站截圖工具
description: 從執行環境、整頁、CLI、MCP、影片和授權比較 openscreenshot CLI 與 MCP 伺服器、shot-scraper、Playwright 等工具。
audience: developers
order: 9
---

如果只是要從 shell 腳本或 CI 工作取得公開頁面的 PNG，命令列工具就夠了：openscreenshot、shot-scraper、capture-website-cli 或 pageres-cli。當擷取需要登入、點擊、斷言或影片時，請用 Playwright 或 Puppeteer 撰寫。對 AI 代理來說，本機 MCP 伺服器可以把截圖回傳給模型：`openscreenshot serve` 每次呼叫擷取一張截圖，而 Playwright MCP 會驅動整個瀏覽器工作階段。

`openscreenshot` 套件是我們的產品，本頁會說明它在哪些情況下是較弱的選擇。本頁比較的是功能，不替這些工具排名。所有資訊截至 2026 年 10 月 9 日，來自各專案的儲存庫、套件登錄庫或官方文件，連結附在下方。

## 工具一覽

| 工具                | 語言／執行環境                                    | 整頁             | CLI        | MCP                 | 影片                | 授權       |
| ------------------- | ------------------------------------------------- | ---------------- | ---------- | ------------------- | ------------------- | ---------- |
| openscreenshot      | Node.js 22.12+，已安裝的 Chrome、Chromium 或 Edge | `--full`         | 是         | 是，stdio           | 否                  | MIT        |
| shot-scraper        | Python 3.10+，Playwright 瀏覽器                   | 預設             | 是         | 未列出              | 是，WebM 或 MP4     | Apache-2.0 |
| capture-website-cli | Node.js 20+，Puppeteer Chrome                     | `--full-page`    | 是         | 未列出              | 否                  | MIT        |
| pageres-cli         | Node.js 20+，Puppeteer Chrome                     | 預設             | 是         | 未列出              | 否                  | MIT        |
| Playwright          | Node.js、Python、Java、.NET                       | `fullPage: true` | 測試執行器 | 透過 Playwright MCP | 是                  | Apache-2.0 |
| Puppeteer           | Node.js 22.12+                                    | `fullPage: true` | 未列出     | 未列出              | 是，Chrome 中為 MP4 | Apache-2.0 |
| Playwright MCP      | 透過 `npx` 的 Node.js，或 Docker                  | `fullPage` 參數  | 僅伺服器   | 是，stdio 或 HTTP   | 是，需選擇啟用      | Apache-2.0 |

「未列出」表示我們查閱的專案自身文件沒有描述該功能。

## openscreenshot（CLI 與 MCP 伺服器）

[openscreenshot](https://www.npmjs.com/package/openscreenshot) 透過 `puppeteer-core` 驅動你機器上現有的 Chrome、Chromium 或 Edge，所以不會下載瀏覽器。一個指令就能儲存整頁 PNG：

```sh
npx openscreenshot shot https://example.com --out example.png --full
```

旗標有 `--out`（檔案，或用 `-` 表示 stdout）、`--full`、`--width`（200 到 3840，預設 1280）和 `--height`（200 到 2160，預設 800）。結束代碼 0 表示已寫出 PNG，1 表示擷取失敗，2 表示用法錯誤。`openscreenshot serve` 會透過 stdio 啟動 MCP 伺服器，內含一個工具 `capture_screenshot`，它接受 `url`、`fullPage`、`width` 和 `height`，並回傳 PNG 圖片內容。[CLI 指南](/zh-tw/blog/screenshot-cli/)、[MCP 指南](/zh-tw/blog/screenshot-mcp-server/)和 [CI 指南](/zh-tw/blog/screenshots-for-ci/)涵蓋設定方式，[原始碼](https://github.com/pghqdev/OpenScreenShot/tree/main/mcp/src)則是參考依據。

它是較弱選擇的情況：

- 每次擷取都會以空白設定檔啟動全新的瀏覽器。它沒有 Cookie、登入、點擊或選擇器等待，所以需要登入的頁面會顯示登入畫面。
- 導覽會等待 `networkidle2` 最多 30 秒，沒有額外的等待選項。在網路靜止後才算繪的頁面，可能只載入一半就被擷取。
- 輸出只有 PNG，沒有 PDF 或影片。
- MCP 伺服器只支援本機 stdio，沒有託管網址或 HTTP 傳輸。工具會回傳圖片，不會寫出檔案。
- 瀏覽器以 `--no-sandbox` 執行，以便在容器中運作。請只擷取你信任的網址。
- 在 Windows 上，偵測不到 Edge 和以個別使用者安裝的 Chrome；請設定 `CHROME_PATH`。

如果要手動處理已登入的頁面、註解或 PDF 匯出，請使用[瀏覽器擴充功能](/zh-tw/docs/)。

## shot-scraper

[shot-scraper](https://github.com/simonw/shot-scraper) 是以 Playwright 為基礎的 Python 工具。根據它的[截圖文件](https://github.com/simonw/shot-scraper/blob/main/docs/screenshots.md)，安裝它、下載它的瀏覽器，然後擷取截圖：

```sh
pip install shot-scraper
shot-scraper install
shot-scraper https://example.com -o example.png
```

省略 `--height` 時，截圖就是整頁。`--selector` 擷取單一元素，`shot-scraper pdf` 儲存 PDF，`multi` 執行 YAML 清單中的多張擷取。在 [1.10](https://github.com/simonw/shot-scraper/releases/tag/1.10) 加入的 `video` 指令會依 YAML 分鏡錄製 WebM，`--mp4` 則用 ffmpeg 轉檔。預設瀏覽器是 Chromium，也可以安裝 Firefox 和 WebKit。如果你的團隊使用 Python，或你想用同一個工具產生截圖、PDF 和腳本化的示範影片，就選它。

## capture-website-cli

[capture-website-cli](https://github.com/sindresorhus/capture-website-cli) 是 Sindre Sorhus 開發的 Node.js 工具，使用 Puppeteer 擷取頁面。預設擷取可視區域；`--full-page` 會擷取整個可捲動的頁面：

```sh
npm install --global capture-website-cli
capture-website https://example.com --output=screenshot.png --full-page
```

沒有 `--output` 時，它會把圖片寫到 stdout。它可輸出 PNG、JPEG 或 WebP。`--element`、`--hide-elements`、`--remove-elements`、`--click-element`、`--dark-mode`、`--style` 和 `--script` 等旗標可以在擷取前準備頁面，這是 openscreenshot 做不到的。如果你需要在擷取前隱藏 Cookie 橫幅或注入 CSS，就選它。

## pageres-cli

[pageres-cli](https://github.com/sindresorhus/pageres-cli) 可以在一次執行中，以多種解析度擷取多個網址：

```sh
pageres https://example.com 1366x768 1600x900
```

它會擷取每一組網址與解析度，預設為整頁；`--crop` 會把每張圖片限制在設定的高度。輸出為 PNG 或 JPEG，預設大小為 1366x768。`iphone5s` 這類裝置關鍵字已不再支援。專案活動不多：最新版本 v9.0.0 於 2025 年 9 月 9 日發布，把 Node.js 需求提高到 20，並加入三個旗標。如果要跨多種寬度快速檢查響應式版面，就選它。

## Playwright

[Playwright](https://github.com/microsoft/playwright) 是 Microsoft 的自動化與測試框架，支援 Chromium、Firefox 和 WebKit，提供 Node.js、Python、Java 和 .NET 的繫結。整頁截圖是 [`page.screenshot`](https://playwright.dev/docs/api/class-page#page-screenshot) 的一個選項：

```js
await page.screenshot({ path: 'page.png', fullPage: true });
```

[`page.pdf()`](https://playwright.dev/docs/api/class-page#page-pdf) 只能在無頭 Chromium 中使用。[影片錄製](https://playwright.dev/docs/videos)是一個 context 選項，測試執行器可以只保留失敗測試的影片。當截圖是測試中的一個步驟，而該測試需要登入、點擊和斷言時，就選 Playwright。

## Puppeteer

[Puppeteer](https://github.com/puppeteer/puppeteer) 是 Google 的 Node.js 程式庫，支援 Chrome 和 Firefox。`npm i puppeteer` 會下載 Chrome for Testing。它的[截圖選項](https://pptr.dev/api/puppeteer.screenshotoptions)使用相同的形式：

```js
await page.screenshot({ path: 'page.png', fullPage: true });
```

[`page.pdf()`](https://pptr.dev/api/puppeteer.page.pdf) 會套用列印 CSS 產生 PDF。在 puppeteer-core 25.10.0 加入的 [`page.record()`](https://pptr.dev/api/puppeteer.page.record) 可以在 Chrome 中錄製 MP4。Firefox 透過 WebDriver BiDi 執行，部分功能在那裡不受支援。openscreenshot 是 `puppeteer-core` 的輕量包裝，所以當你需要它四個擷取選項以外的功能時，請直接使用 Puppeteer。

## Playwright MCP

[Playwright MCP](https://github.com/microsoft/playwright-mcp) 讓 AI 代理透過無障礙快照驅動瀏覽器，所以不需要視覺模型。它的 [README](https://github.com/microsoft/playwright-mcp/blob/v0.0.83/README.md) 提供以下標準設定：

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

`browser_take_screenshot` 工具接受 `fullPage` 參數，並回傳 PNG、JPEG 或 WebP。PDF 和影片工具需要透過 `--caps` 選擇啟用。瀏覽器預設以有介面模式執行，並保留持久的設定檔，所以登入狀態可以延續；`--isolated`、`--storage-state` 和 `--extension`（連接到執行中的 Chrome 或 Edge）會改變這一點。`--port` 改以 HTTP 而非 stdio 提供服務。它仍是 0.0.x 版本（v0.0.83）。當 AI 代理必須登入、點擊或填寫表單時，請選它而不是 `openscreenshot serve`。

## 該選哪一個

- **在腳本或 CI 產出檔中取得公開頁面的 PNG**：openscreenshot、shot-scraper 或 capture-website-cli。
- **同一個頁面的多種寬度**：pageres-cli。
- **先隱藏元素或注入 CSS**：capture-website-cli 或 shot-scraper。
- **從命令列產生 PDF 或腳本化的示範影片**：shot-scraper。
- **在測試套件中登入、點擊和斷言**：Playwright 或 Puppeteer。
- **只需要看頁面的 AI 代理**：`openscreenshot serve`。
- **必須和頁面互動或登入的 AI 代理**：Playwright MCP。
- **要擷取並註解已登入頁面的人**：擴充功能；請見[整頁擴充功能比較](/zh-tw/blog/full-page-screenshot-extensions/)。
