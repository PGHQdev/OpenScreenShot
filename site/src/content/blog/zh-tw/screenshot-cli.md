---
title: 從命令列擷取網站截圖
description: 用 OpenScreenShot CLI 儲存 PNG 截圖，可設定固定可視區域、整頁擷取，或把二進位輸出寫到 stdout。
audience: developers
order: 4
---

OpenScreenShot CLI 使用本機安裝的 Chrome 相容瀏覽器，把網頁擷取成 PNG。它和瀏覽器擴充功能是不同的套件。安裝好 Node.js、pnpm 和 Chrome 後，執行：

```sh
pnpm dlx openscreenshot shot https://example.com --out screenshot.png --full
```

這個指令會啟動一個獨立的無頭瀏覽器，前往該網址，寫出圖片，然後關閉瀏覽器。它不會連接到你日常瀏覽器中的分頁或已登入的設定檔。

## 明確設定可視區域

如果只要擷取可視區域，請省略 `--full`。寬度預設為 1280 像素，高度預設為 800 像素。版面需要特定大小時，請兩者都設定：

```sh
pnpm dlx openscreenshot shot https://example.com --out desktop.png --width 1440 --height 900
pnpm dlx openscreenshot shot https://example.com --out narrow.png --width 390 --height 844
```

寬度接受 200 到 3840 的整數；高度接受 200 到 2160 的整數。窄的可視區域可以測試該寬度下的響應式版面。它不會模擬手機的觸控輸入、裝置像素比或行動版瀏覽器：CLI 使用的是桌面版使用者代理程式。

加上 `--full` 可擷取可視區域以外的內容。無頭瀏覽器的整頁擷取和擴充功能「捲動再拼接」的實作方式不同；不要假設每個動態頁面在兩者中看起來都會一樣。

## 儲存檔案或寫到 stdout

沒有 `--out` 時，指令會在目前目錄寫出 `screenshot.png`。請使用明確的檔名，讓產出檔容易辨認。執行指令前，請先建立輸出檔所在的上層目錄。

`--out -` 會把 PNG 位元組寫到 stdout：

```sh
pnpm dlx openscreenshot shot https://example.com --out - > screenshot.png
```

請使用可安全處理二進位資料的重新導向。CLI 一律產生 PNG；把輸出檔命名為 `capture.jpg` 或 `capture.pdf` 並不會轉換格式。如果需要加上註解的圖片或 PDF 輸出，請使用[擴充功能的編輯器](/zh-tw/docs/#export)。

## 解決常見的失敗

如果找不到 Chrome，請安裝它，或把 `CHROME_PATH` 設為瀏覽器的執行檔。例如，在 Chromium 安裝於該路徑的 Linux 系統上：

```sh
CHROME_PATH=/usr/bin/chromium pnpm dlx openscreenshot shot https://example.com --out screenshot.png
```

導覽會等待 `networkidle2`，逾時時間為 30 秒。目前的指令沒有自訂等待、選擇器、Cookie 或登入選項。擷取成功也不代表應用程式正確載入：請檢查 PNG 中是否有錯誤頁面、載入中狀態和缺少的資源。

結束代碼 0 表示擷取指令已完成，1 表示擷取失敗，2 表示用法無效或參數驗證失敗。串接指令時請使用這些代碼，然後再檢查圖片本身。

如需可重現的產出檔，請閱讀 [CI 擷取指南](/zh-tw/blog/screenshots-for-ci/)。如果是由 AI 代理驅動的流程，請見 [MCP 設定指南](/zh-tw/blog/screenshot-mcp-server/)。可用的旗標以 [CLI 原始碼](https://github.com/pghqdev/OpenScreenShot/tree/main/mcp/src)為準。
