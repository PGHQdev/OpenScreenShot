---
title: 如何在 Firefox 中擷取整頁截圖
description: 用 Firefox 內建的 Screenshots 工具或 :screenshot 指令擷取整個網頁，了解尺寸上限，並使用 OpenScreenShot 附加元件。
order: 3
---

Firefox 有內建的 Screenshots 工具。按 `Ctrl+Shift+S`（macOS 上是 `Cmd+Shift+S`），選取 **Save full page**（儲存整頁），然後選取 **Download** 儲存 PNG，或選取 **Copy** 把圖片放到剪貼簿。Firefox 版的 OpenScreenShot 附加元件提供可加箭頭、文字和遮蔽的編輯器，並能匯出為 PNG、JPEG、WebP 或 PDF。

## 內建方法

Mozilla 在 [Take screenshots in Firefox](https://support.mozilla.org/en-US/kb/take-screenshots-firefox) 中說明這個工具。

1. 開啟要擷取的網頁。
2. 在 Windows 和 Linux 上按 `Ctrl+Shift+S`，在 macOS 上按 `Cmd+Shift+S`。你也可以在網頁的空白處按右鍵，然後選取 **Take Screenshot**（擷取畫面）。
3. 選取右上角的 **Save full page**。
4. 在預覽中，選取 **Download** 把 PNG 儲存到 Firefox 的下載資料夾，或選取 **Copy**。

預覽提供 **Copy** 和 **Download**。要加上箭頭或文字，請在其他應用程式中開啟 PNG。

Firefox DevTools 還有第二種方法。開啟 Web Console（網頁主控台）並輸入 `:screenshot --fullpage`，Firefox 就會儲存整個網頁的 PNG。你也可以在 DevTools 設定的 **Available Toolbox Buttons**（可用的工具箱按鈕）下，開啟 **Take a screenshot of the entire page**（擷取整個網頁的畫面）按鈕。Mozilla 在它的 [DevTools 截圖指南](https://firefox-source-docs.mozilla.org/devtools-user/taking_screenshots/index.html)中記載了這兩種方法。

## 限制

- **尺寸。** 單邊超過 32,766 像素或面積超過 472,907,776 像素的擷取，Firefox 會裁切，並顯示「Your screenshot was cropped because it was too large.」（截圖太大，已被裁切）。Firefox 對過大擷取的錯誤訊息則給出不同的數字：最長邊小於 32,700 像素，或總面積小於 124,900,000 像素。
- **顯示比例。** Firefox 以裝置像素計算這些上限：網頁寬度和高度乘以顯示器的像素比。在 2x 顯示器上，以 CSS 像素計算的網頁高度上限減半，約為 16,383。
- **內部捲動容器。** Firefox 從視窗的捲動寬度和高度取得整頁範圍。網頁在固定高度的外框內捲動面板時，面板內的內容不會展開，所以擷取只會顯示一個畫面高度的內容。
- **延遲載入。** 標記為 `loading="lazy"` 的圖片，只有在你捲動到附近時才會載入。擷取前請先捲動整個網頁，否則圖片的部分區域可能保持空白。
- **無限捲動。** 捲動時會載入更多內容的動態沒有真正的底部。擷取只包含開始前已載入的內容。
- **黏性頁首。** 分享前，請檢查圖片的頂端和中間，看看頁首是否遺漏、重複或位置錯誤。

## 使用 OpenScreenShot

Firefox 版的 OpenScreenShot 只能擷取截圖。分頁錄影功能在 Chrome 版中。它的整頁模式會捲動網頁，分段擷取，再把各部分拼接成一張圖片，固定式頁首只在頂端放置一次。捲動的是內部元素而非視窗的網頁也可以。

1. [從 Firefox Add-ons 安裝 OpenScreenShot](https://addons.mozilla.org/firefox/addon/openscreenshot/)，並把它的圖示固定到工具列。
2. 開啟網頁並完整捲動一次，讓延遲載入的圖片載入，再回到頂端。
3. 點 OpenScreenShot 圖示；如果開啟了模式選單，請選擇**整個網頁**。
4. 在編輯器中檢查結果，特別是頂端、底部和任何黏性導覽列。
5. 點**儲存圖片**，然後選擇 PNG、JPEG、WebP 或 PDF，或點**複製**。

Firefox 把 `Ctrl+Shift+S` 用於它自己的 Screenshots 工具，所以要使用 OpenScreenShot 時，請點工具列圖示。[擷取模式參考](/zh-tw/docs/#modes)說明各個模式，[匯出參考](/zh-tw/docs/#export)說明格式和縮放比例。

## 該用哪一個

- 要為捲動整個視窗且不超過尺寸上限的網頁快速擷取 PNG，請使用 Firefox Screenshots。
- 已經在使用 Web Console 時，請使用 `:screenshot --fullpage` 指令。
- 對於捲動內部面板的網頁，以及要加註解或儲存為 PDF 的擷取，請使用 OpenScreenShot，例如[錯誤回報](/zh-tw/use-cases/bug-reports/)或[儲存網頁副本](/zh-tw/use-cases/archive-web-pages/)。

[Chrome 指南](/zh-tw/full-page-screenshot/chrome/)和 [Edge 指南](/zh-tw/full-page-screenshot/edge/)說明在 Chromium 瀏覽器中完成同樣的工作，OpenScreenShot 在這些瀏覽器中還能錄製分頁。對於封鎖擴充功能的網頁（例如 Firefox 設定），請參閱[支援與已知限制](/zh-tw/support/)。
