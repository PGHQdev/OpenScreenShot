---
title: 如何在 Arc 中擷取整頁截圖
description: 在 macOS 上用 Arc 的 Capture Full Page 指令存成 PNG，了解未記載之處，並使用 Chrome 線上應用程式商店的 OpenScreenShot。
order: 8
---

macOS 版 Arc 有 **Capture Full Page**（擷取整頁）指令。按 `Cmd+T` 開啟 Command Bar，輸入 `Capture Full Page` 並選取它。Arc 會把整個網頁的 PNG 下載到你的預設下載位置。Arc 的說明只記載了 macOS 版的這個指令。OpenScreenShot 在 Arc 中也能使用：Arc 是 Chromium 瀏覽器，可以從 Chrome 線上應用程式商店安裝擴充功能。

## 內建方法

Arc 在 [How to take full page screen captures in Arc](https://resources.arc.net/hc/en-us/articles/25481392111895-How-To-Take-Full-Page-Screen-Captures-in-Arc) 中說明這個指令。

1. 開啟要擷取的網頁。
2. 按 `Cmd+T` 開啟 Command Bar，輸入 `Capture Full Page` 並選取它。你也可以選擇 **File** > **Capture Full Page**。
3. Arc 會把 PNG 下載到你的預設下載位置。

這個指令沒有預設快速鍵。要新增快速鍵，請開啟 **Arc** > **Settings** > **Shortcuts**，搜尋 `capture`，再為 **Capture Full Page** 設定按鍵。

要擷取有樣式的截圖，請開啟 [Developer Mode](https://resources.arc.net/hc/en-us/articles/20468488031511-Developer-Mode-Instant-Dev-Tools) 並使用工具列中的截圖按鈕，或從 Command Bar 執行 **Capture in Portrait Mode**。Arc 另有獨立的 Capture 工具，可擷取選取範圍並提供編輯和 Easels 功能，它同樣只支援 macOS。

## 限制

- **只支援 macOS。** Arc 沒有記載 Windows 版 Arc 的整頁指令。
- **未記載的行為。** Arc 沒有記載它如何組成圖片、尺寸上限，或如何處理黏性頁首。請檢查 PNG 的頂端和中間，看看頁首是否遺漏或重複。
- **註解。** Arc 沒有記載整頁擷取的編輯功能。要加上箭頭或文字，請在其他應用程式中開啟 PNG。
- **延遲載入。** 標記為 `loading="lazy"` 的圖片，只有在你捲動到附近時才會載入。擷取前請先捲動整個網頁，否則圖片的部分區域可能保持空白。
- **內部捲動容器。** 開發人員回報，Chromium、Firefox 和 WebKit 的整頁擷取，對於在固定高度外框內捲動的面板，只會顯示一個畫面高度的內容。請檢查網頁應用程式，以及內容窗格會捲動的文件網站。
- **無限捲動。** 持續載入的動態沒有真正的底部。擷取只包含開始前已載入的內容。

## 使用 OpenScreenShot

OpenScreenShot 會逐個可視區域捲動網頁，並把各部分拼接成一張圖片。固定式頁首只會在頂端擷取一次，捲動內部元素的網頁也可以。高度超過 32,000 裝置像素的網頁會儲存成最多六張圖片。

1. 在 Arc 中開啟 [OpenScreenShot 商店頁面](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)並新增擴充功能。Arc 在 [Extensions in Arc](https://resources.arc.net/hc/en-us/articles/19434259167767-Extensions-in-Arc-How-to-Import-Add-Open) 中說明如何從 Chrome 線上應用程式商店安裝。
2. 固定 OpenScreenShot 圖示。
3. 開啟網頁並點圖示，或按 `⌘⇧S`。在預設設定下，整頁擷取會開始，結果會在編輯器中開啟。
4. 檢查頂端、底部和任何黏性導覽列。
5. 點**儲存圖片**，然後選擇 PNG、JPEG、WebP 或 PDF，或點**複製**。

如果圖示開啟的是選單，請選擇**整個網頁**；這由**一鍵 Express 模式**設定控制。要在 OpenScreenShot 中為擷取加上樣式，請在編輯器中開啟「**Beautify（美化）**」面板：它會加上邊距、圓角、陰影，以及漸層、單色或透明背景，外框會包含在每次匯出中。[擷取模式參考](/zh-tw/docs/#modes)和[匯出參考](/zh-tw/docs/#export)列出所有選項。

## 該用哪一個

- 要為捲動整個視窗的網頁快速擷取 PNG，請在 macOS 上使用 Arc 的 **Capture Full Page**。
- 對於捲動內部面板的網頁，或要為擷取加註解、遮蔽或儲存為 PDF 時，請使用 OpenScreenShot，例如[設計審查](/zh-tw/use-cases/design-review/)。
- 要製作自訂邊距和背景的有樣式圖片，請使用 OpenScreenShot 的「**Beautify（美化）**」面板，例如[用於社群媒體的截圖](/zh-tw/use-cases/social-media/)。

[Chrome 指南](/zh-tw/full-page-screenshot/chrome/)比較 Chrome 的 DevTools 擷取與擴充功能，[Brave 指南](/zh-tw/full-page-screenshot/brave/)說明另一款有內建工具的 Chromium 瀏覽器。對於封鎖擴充功能的網頁（例如瀏覽器設定），請參閱[支援與已知限制](/zh-tw/support/)。
