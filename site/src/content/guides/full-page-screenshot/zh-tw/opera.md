---
title: 如何在 Opera 中擷取整頁截圖
description: Opera 的 Snapshot 工具只能把整頁儲存為 PDF。了解步驟和限制，以及如何用 OpenScreenShot 擷取整頁圖片。
order: 6
---

Opera 內建的 Snapshot 工具可以把選取範圍或可見區域擷取為圖片，但整頁只能存成 PDF。按 `Shift+Ctrl+5`（macOS 上是 `Shift+Cmd+2`），然後選取 **Save page as PDF**（將網頁儲存為 PDF）。要取得整頁圖片檔，請安裝 OpenScreenShot。Opera 是 Chromium 瀏覽器，在你新增 Opera 的 **Install Chrome Extensions** 附加元件後，就能從 Chrome 線上應用程式商店安裝它。

## 內建方法

Opera 在它的[功能說明頁面](https://help.opera.com/en/latest/features/)和 [Snapshot 頁面](https://www.opera.com/features/snapshot)中說明 Snapshot。

1. 開啟要擷取的網頁。
2. 在 Windows 和 Linux 上按 `Shift+Ctrl+5`，在 macOS 上按 `Shift+Cmd+2`。你也可以點工具列右側的相機圖示。
3. 選取 **Save page as PDF**。Opera 會把整個網頁從頂端到底部儲存為 PDF。

Snapshot 有兩個圖片選項。**Capture Full Screen**（擷取全螢幕）只擷取網頁的可見區域，**Capture**（擷取）則擷取你調整過的框選範圍。兩者都會產生圖片，你可以用 Zoom、Arrow、Blur、Highlight、Pencil、Selfie camera、Emojis 和 Text 加註解，然後用 **Save Image**（儲存圖片）存成 PNG，或複製到剪貼簿。

## 限制

- **整頁只能存成 PDF。** 圖片擷取只涵蓋可見區域或選取範圍。要取得整個網頁，得到的會是 PDF。
- **未記載的版面。** Opera 沒有記載 PDF 是一張長頁面還是多頁、如何處理黏性頁首，或如何處理在固定高度外框內捲動面板的網頁。分享前請開啟 PDF 檢查。
- **延遲載入。** 標記為 `loading="lazy"` 的圖片，只有在你捲動到附近時才會載入。儲存前請先捲動整個網頁，否則部分區域可能保持空白。
- **無限捲動。** 持續載入的動態沒有真正的底部。任何擷取都只包含開始前已載入的內容。

## 使用 OpenScreenShot

OpenScreenShot 會捲動網頁，分段擷取，再把各部分拼接成一張圖片。固定式頁首只會在頂端擷取一次，捲動內部元素的網頁也可以。高度超過 32,000 裝置像素的網頁會儲存成最多六張圖片。

1. 從 Opera 附加元件新增 **Install Chrome Extensions** 附加元件。Opera 在 [Using add-ons from Chrome in Opera](https://blogs.opera.com/tips-and-tricks/2021/10/using-addons-from-chrome-in-opera/) 中說明這個步驟。
2. 開啟 [OpenScreenShot 商店頁面](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)並新增擴充功能。
3. 把 OpenScreenShot 圖示固定到工具列。
4. 開啟網頁並點圖示，或按 `Ctrl+Shift+S`（macOS 上是 `⌘⇧S`）。在預設設定下，整頁擷取會開始，結果會在編輯器中開啟。
5. 檢查頂端、底部和任何黏性導覽列。
6. 點**儲存圖片**，然後選擇 PNG、JPEG、WebP 或 PDF，或點**複製**。

如果圖示開啟的是選單，請選擇**整個網頁**；這由**一鍵 Express 模式**設定控制。OpenScreenShot 產生的 PDF 以圖片形式保存截圖，所以看起來和畫面上的網頁一樣，但其中的文字無法搜尋或選取。在**頁面大小**下，**原尺寸**會產生一頁與圖片同尺寸的頁面，**A4** 或 **Letter** 則可以把長擷取分成多頁。[截圖轉 PDF 指南](/zh-tw/blog/save-screenshot-as-pdf/)比較這些版面。

## 該用哪一個

- 不想安裝任何東西又要快速取得整頁 PDF 時，請使用 Snapshot 的 **Save page as PDF**。
- 要擷取可見區域或選取範圍並加幾個標記時，請使用 Snapshot 的圖片選項。
- 要取得整頁 PNG、JPEG 或 WebP、擷取捲動內部面板的網頁，或取得與畫面相符的 PDF 時，請使用 OpenScreenShot，例如[設計審查](/zh-tw/use-cases/design-review/)或[儲存網頁副本](/zh-tw/use-cases/archive-web-pages/)。

[擷取模式參考](/zh-tw/docs/#modes)和[匯出參考](/zh-tw/docs/#export)列出所有選項。[Vivaldi 指南](/zh-tw/full-page-screenshot/vivaldi/)說明另一款有自己擷取工具的 Chromium 瀏覽器。對於封鎖擴充功能的網頁（例如瀏覽器設定），請參閱[支援與已知限制](/zh-tw/support/)。
