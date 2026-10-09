---
title: 適用各平台的開放原始碼截圖工具
description: 依執行環境介紹 OpenScreenShot、Screenity、ShareX、Flameshot、Playwright 等開放原始碼截圖工具。
audience: everyday
order: 8
---

請依你要擷取的東西在哪裡，來選擇開放原始碼截圖工具。Windows 螢幕上的任何東西，請用 ShareX。Linux、macOS 或 Windows 桌面，請用 Flameshot。網頁請用瀏覽器工具，例如 OpenScreenShot 或 Firefox 內建的 Screenshots 工具；要從腳本擷取截圖，請用 shot-scraper、Playwright 或 Puppeteer。

OpenScreenShot 是我們的產品。本頁會說明它不適合的情況，也不替這些工具排名。所有資訊截至 2026 年 10 月 9 日，來自各專案的儲存庫、商店頁面或官方網站，連結附在下方。

## 各工具涵蓋的平台

| 工具                | 執行環境                                                   | 擷取對象                                   | 授權             | 整頁             | 影片                     |
| ------------------- | ---------------------------------------------------------- | ------------------------------------------ | ---------------- | ---------------- | ------------------------ |
| OpenScreenShot      | Chrome、Firefox                                            | 分頁中的網頁                               | MIT              | 是               | 分頁錄影，僅限 Chrome 版 |
| Screenity           | Chrome，以及使用 Chrome 線上應用程式商店的 Chromium 瀏覽器 | 錄製分頁、區域、桌面、應用程式視窗或攝影機 | GPL-3.0          | 文件未提及       | 是                       |
| ShareX              | Windows                                                    | 螢幕上的任何東西                           | GPL-3.0          | 捲動擷取         | 影片與 GIF               |
| Flameshot           | Linux、macOS、Windows                                      | 螢幕區域                                   | GPL-3.0          | 否               | 文件未提及               |
| Firefox Screenshots | 桌面版 Firefox                                             | 網頁                                       | Firefox 的一部分 | 是               | 文件未提及               |
| shot-scraper        | Python 3.10 或更新版本                                     | 網頁，透過指令                             | Apache-2.0       | 是，預設即為整頁 | 是，透過腳本檔案         |
| Playwright          | Node.js、Python、Java、.NET                                | 網頁，透過程式碼                           | Apache-2.0       | 是               | 是                       |
| Puppeteer           | Node.js                                                    | 網頁，透過程式碼                           | Apache-2.0       | 是               | 是，Chrome               |

這些工具都不能在 Android 或 iOS 上執行。瀏覽器擴充功能只看得到它所在分頁中的網頁。桌面應用程式看得到整個螢幕，但不知道網頁在哪裡結束。

## 瀏覽器：OpenScreenShot

[OpenScreenShot](https://github.com/pghqdev/OpenScreenShot) 是採用 MIT 授權的 [Chrome](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) 和 [Firefox](https://addons.mozilla.org/firefox/addon/openscreenshot/) 擴充功能。它可以擷取整個網頁、可見範圍、選取區域或單一元素。接著它會開啟編輯器，提供箭頭、形狀、文字、步驟編號、模糊和裁切，並匯出 PNG、JPEG、WebP 或 PDF。擷取和編輯都在你的瀏覽器中執行，擴充功能不會上傳你的截圖或錄影。[說明文件](/zh-tw/docs/)涵蓋每一種模式。

Chrome 版也能[錄製分頁](/zh-tw/docs/#record)，可選擇加入麥克風、分頁音訊和視訊鏡頭，並匯出 MP4 或 WebM。Firefox 版只能截圖。

如果你需要的東西在瀏覽器分頁之外，OpenScreenShot 就不是合適的工具。它無法擷取桌面、其他應用程式或瀏覽器設定頁面，也不能錄製整個螢幕。

## 瀏覽器錄影：Screenity

[Screenity](https://github.com/alyssaxuu/screenity) 是 Chrome 的螢幕錄影與註解擴充功能。它可以錄製分頁、區域、桌面、任何應用程式視窗或攝影機，並收錄麥克風和內部音訊。它可匯出 MP4、GIF 或 WebM，或儲存到 Google Drive。你可以繪圖，加入文字、箭頭和形狀，並模糊頁面上的敏感內容。

它的授權是 [GPL-3.0](https://github.com/alyssaxuu/screenity/blob/master/LICENSE)。README 說，從 3.0.0 版起，Manifest V3 版本的授權改為 GPLv3。這個擴充功能免費，本機錄影不需要登入。[Screenity Pro](https://screenity.io/pro) 在 7 天試用後每月 $10 或每年 $120，加入編輯器、連結分享和位於歐盟伺服器的雲端代管，需要帳號。README 說有些程式碼路徑會連到 Screenity Pro，而且只在 Chrome 線上應用程式商店版本中啟用。

Screenity 在安裝時要求存取所有網站。它的文件沒有描述整頁截圖。當你需要錄製桌面或其他應用程式時，請選它而不是 OpenScreenShot；請見 [Screenity 替代方案](/zh-tw/alternatives/screenity/)。

## Windows：ShareX

[ShareX](https://getsharex.com/) 是免費、無廣告的 Windows 應用程式，採用 [GPL-3.0](https://github.com/ShareX/ShareX) 授權。它可以擷取螢幕、視窗或區域；它的[捲動擷取](https://getsharex.com/docs/scrolling-screenshot)會比較連續的截圖，並附加有變化的區段，所以一張圖片可以容納捲出螢幕的內容。它也能錄製影片和 GIF，README 還列出了 OCR 和 QR code 掃描。

圖片編輯器有形狀、箭頭、文字、對話框、模糊、像素化、醒目標示和聚光。ShareX 可以上傳到許多服務，而且如果你設定了擷取後的工作，就會自動上傳。擷取私人內容前，請先檢查這些設定。你可以取得安裝程式、免安裝版，或從 Microsoft Store 或 Steam 取得。最新版本 v21.0.0 於 2026 年 7 月 3 日發布。

ShareX 不能在 macOS 或 Linux 上執行。

## Linux、macOS 和 Windows：Flameshot

[Flameshot](https://flameshot.org/) 是適用於 Linux、macOS 和 Windows 的免費截圖工具，採用 [GPL-3.0](https://github.com/flameshot-org/flameshot) 授權。你選取一個區域，就能直接在原地用箭頭、醒目標示、模糊或像素化、文字、手繪線條、方框和計數編號加上註解。它也有命令列介面。它的 README 列出了選用的 Imgur 上傳功能，按 Return 鍵就會開始上傳，所以擷取私人內容前，請先熟悉這個按鍵。

[14.0.0 版](https://github.com/flameshot-org/flameshot/releases/tag/v14.0.0)（2026 年 6 月）會詢問要擷取哪個螢幕，並在 Linux 上以 xdg-desktop-portal 作為主要擷取途徑。README 稱 GNOME 和 Plasma 的 Wayland 支援仍屬實驗性質。

Flameshot 沒有捲動擷取。相關的[功能要求](https://github.com/flameshot-org/flameshot/issues/1130)仍未關閉。我們在它的文件中找不到錄影功能。要在 Linux 上擷取整個網頁，請把 Flameshot 和瀏覽器工具搭配使用。

## 內建：Firefox Screenshots

Firefox 是開放原始碼軟體，它的 Screenshots 工具不需要安裝。根據 [Mozilla 的指南](https://blog.mozilla.org/en/firefox/how-to-capture-screenshots-with-firefox/)，在頁面上按右鍵，選擇「**Take Screenshot**」（擷取畫面），然後選擇區域、可見範圍或「**Save full page**」（儲存完整頁面）。你可以複製或下載結果。Mozilla 在 Firefox 67（2019 年 5 月）[停止了上傳](https://blog.mozilla.org/futurereleases/2019/01/24/clarifying-the-future-of-firefox-screenshots/)到它的 Screenshots 伺服器，所以擷取結果會留在本機。

如果要用指令，根據 [DevTools 文件](https://firefox-source-docs.mozilla.org/devtools-user/taking_screenshots/index.html)，Firefox DevTools 主控台接受 `:screenshot --fullpage`，會把 PNG 存到「下載」資料夾。Chrome 的 DevTools 前端也是開放原始碼，採用 [BSD-3-Clause](https://github.com/ChromeDevTools/devtools-frontend) 授權，它的「**Capture full size screenshot**」（擷取完整尺寸的螢幕截圖）指令會儲存一張 PNG。[整頁截圖指南](/zh-tw/full-page-screenshot/)涵蓋各個瀏覽器。

## 從腳本：shot-scraper、Playwright、Puppeteer

這些工具從指令或程式碼擷取網頁，適合重複性工作和 CI。它們在自己的瀏覽器中載入頁面，所以看不到你已登入的分頁。

- [shot-scraper](https://github.com/simonw/shot-scraper) 是以 Playwright 為基礎的 Python 命令列工具。它預設擷取整頁截圖，也能儲存 PDF，並依 YAML 腳本錄製影片。
- [Playwright](https://github.com/microsoft/playwright) 是 Microsoft 的瀏覽器自動化與測試框架，支援 Chromium、Firefox 和 WebKit，提供截圖、PDF 和影片 API。
- [Puppeteer](https://github.com/puppeteer/puppeteer) 是 Google 的 Node.js 程式庫，支援 Chrome 和 Firefox，提供截圖、PDF 和 MP4 錄影 API。

我們自己採用 MIT 授權的 `openscreenshot` 套件，另外提供命令列工具和給 AI 代理使用的 MCP 伺服器。[開發者工具比較](/zh-tw/blog/website-screenshot-tools-for-developers/)附上指令，涵蓋以上所有工具。

## 該選哪一個

- **Windows 螢幕上的任何東西，需要捲動擷取**：ShareX。
- **Linux 或 macOS 上的螢幕區域**：Flameshot。
- **完整網頁，需要標記和 PDF 匯出**：OpenScreenShot；如果只想快速擷取、不想安裝，可用 Firefox Screenshots。
- **錄製桌面或其他應用程式**：Screenity，或 Windows 上的 ShareX。
- **從腳本或 CI 擷取截圖**：shot-scraper、Playwright 或 Puppeteer。

如果工具不需要開放原始碼，[整頁擴充功能比較](/zh-tw/blog/full-page-screenshot-extensions/)還加入了 GoFullPage、FireShot 等工具。[比較頁面](/zh-tw/compare/)把 OpenScreenShot、GoFullPage 和 FullPage Capture 並排比較。
