---
title: 如何在 Safari 中擷取整頁截圖
description: Mac 上的 Safari 沒有整頁圖片擷取功能。你可以把整個網頁存成 PDF、在網頁檢閱器中擷取單一元素，或改用其他瀏覽器。
order: 4
---

Mac 上的 Safari 沒有整頁截圖指令。最接近的內建選項是 PDF：選擇 **File** > **Print**（檔案 > 列印），點對話框底部的 **PDF**，然後儲存檔案。如果要圖片檔，Safari 的 Web Inspector（網頁檢閱器）可以擷取網頁中的單一元素。OpenScreenShot 沒有 Safari 版。Safari 從 Mac App Store 安裝 Safari Web Extensions，無法安裝 Chrome 線上應用程式商店或 Firefox 附加元件套件。在 Mac 上，Chrome、Firefox、Edge 和其他瀏覽器都能執行 OpenScreenShot。

## 內建方法

### 把網頁存成 PDF

Apple 在 [Print or create a PDF of a webpage in Safari](https://support.apple.com/guide/safari/print-or-create-a-pdf-of-a-webpage-ibrw1060/18.0/mac/15.0) 中說明這個方法。

1. 開啟要保存的網頁。
2. 先完整捲動網頁一次，讓較晚載入的圖片載入完成。
3. 選擇 **File** > **Print**。
4. 要保留網頁的顏色，請在列印選項中開啟背景圖片和顏色的列印。你也可以在頁首和頁尾加上網址和日期。
5. 點對話框底部的 **PDF**，然後儲存檔案。

### 在網頁檢閱器中擷取元素

1. 選擇 **Safari** > **Settings** > **Advanced**，然後選取 **Show features for web developers**（顯示網頁開發者功能）。WebKit 在 [Enabling Web Inspector](https://webkit.org/web-inspector/enabling-web-inspector/) 中說明這個步驟。
2. 開啟網頁，按 `Option+Cmd+I` 開啟網頁檢閱器。
3. 在 **Elements**（元素）分頁中，在節點上按右鍵（例如 `<html>` 或 `<body>`），然後選取 **Capture Screenshot**（擷取螢幕截圖）。
4. Safari 會把該節點的快照存成檔案。

Apple 沒有記載擷取 `<html>` 時是否包含網頁可見部分以下的內容，也沒有記載寫出的圖片格式。依賴這個檔案前請先檢查。

## 限制

- **沒有整頁圖片。** 這兩種方法都無法產生整頁擷取工具那樣的截圖。PDF 是網頁的列印版本，網頁檢閱器的項目則擷取單一節點。
- **列印版面。** PDF 使用列印版面，所以檔案中的網頁可能和畫面上的網頁看起來不同。如果設計依賴背景圖片和顏色，請開啟它們。
- **延遲載入。** 標記為 `loading="lazy"` 的圖片，只有在你捲動到附近時才會載入。列印或擷取前請先捲動整個網頁，否則部分區域可能保持空白。
- **內部捲動容器。** 開發人員回報，在 WebKit（Safari 底層的引擎）中自動進行的整頁擷取，遇到在固定高度外框內捲動面板的網頁時，只會顯示一個畫面高度。對於以這種方式建構的網頁，請仔細檢查。
- **黏性頁首。** 請檢查結果中的頁首是否遺漏、重複或位置錯誤。

## 使用 OpenScreenShot

OpenScreenShot 沒有 Safari 版。如果同一台 Mac 上有 Chrome、Firefox、Edge、Brave、Opera、Vivaldi 或 Arc，請在那裡開啟網頁並使用擴充功能。Chrome 和其他 Chromium 瀏覽器從 [Chrome 線上應用程式商店](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)安裝。Firefox 從 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) 安裝。

1. 在其他瀏覽器中安裝 OpenScreenShot，並把它的圖示固定到工具列。
2. 開啟網頁並點圖示。在 Chrome 中，`⌘⇧S` 也能開始整頁擷取。
3. 在編輯器中檢查結果。
4. 點**儲存圖片**，然後選擇 PNG、JPEG、WebP 或 PDF。

擴充功能會捲動網頁，把各部分拼接成一張圖片，並只在頂端放置一次固定式頁首。高度超過 32,000 裝置像素的網頁會儲存成最多六張圖片。[Chrome 指南](/zh-tw/full-page-screenshot/chrome/)和 [Firefox 指南](/zh-tw/full-page-screenshot/firefox/)提供各瀏覽器的步驟，包括它們自己的內建工具。

## 該用哪一個

- 要保存文章或收據頁面的可讀副本，請在 Safari 中使用 **File** > **Print** > **PDF**。
- 要取得網頁某一部分（例如卡片或圖表）的圖片，請使用網頁檢閱器的 **Capture Screenshot**。
- 要取得可加註解的整頁圖片，或與畫面外觀相同的網頁 PDF，請在 Mac 上的其他瀏覽器中使用 OpenScreenShot。[截圖轉 PDF 指南](/zh-tw/blog/save-screenshot-as-pdf/)比較 PDF 版面，[儲存網頁的視覺副本](/zh-tw/use-cases/archive-web-pages/)說明命名和儲存方式。

其他問題請參閱[支援與已知限制](/zh-tw/support/)。
