---
title: 如何在 Brave 中擷取整頁截圖
description: 開啟 Brave 的截圖工具列按鈕並把整頁擷取為 PNG，了解限制，並使用 Chrome 線上應用程式商店的 OpenScreenShot。
order: 5
---

Brave 1.94 以上版本有內建截圖工具。在 `brave://settings/appearance` 中開啟截圖按鈕，點它，然後選取 **Full page**（整頁）。在 Brave 1.96 以上版本中，會開啟預覽，你可以在其中下載 PNG 或複製圖片。OpenScreenShot 在 Brave 中也能使用：Brave 是 Chromium 瀏覽器，可以從 Chrome 線上應用程式商店安裝擴充功能。

## 內建方法

Brave 沒有這個工具的說明中心文章。以下步驟依據 Brave 的[版本資訊](https://brave.com/latest/)和[問題追蹤系統](https://github.com/brave/brave-browser/issues/57937)。

1. 前往 `brave://settings/appearance`，在工具列區段中開啟截圖按鈕。
2. 開啟要擷取的網頁。
3. 點工具列中的 **Take a screenshot**（擷取螢幕截圖）按鈕。
4. 在 **Capture screenshot** 泡泡中選取 **Full page**。泡泡也提供 **Selected area**（選取區域）和 **Visible area**（可見區域）。
5. 在 **Screenshot preview**（截圖預覽）對話框中，選取 **Download** 儲存 PNG，或選取 **Copy to clipboard**（複製到剪貼簿）。

在 Brave 1.75 以上版本中，`Ctrl+Shift+S`（macOS 上是 `Shift+Cmd+S`）會開啟 Brave 的截圖工具。Brave 的問題追蹤系統把這組快速鍵描述為選取式擷取，所以要擷取 **Full page** 請使用工具列按鈕。在 Brave 1.96 中，應用程式選單中的截圖項目移到了 **Save and share**（儲存及分享）的 Save 區段。

預覽提供 **Download** 和 **Copy to clipboard**。要加上箭頭或文字，請在其他應用程式中開啟 PNG。

## 限制

- **網頁大小。** **Full page** 選項使用 Chromium 的 DevTools 截圖指令。寬度或高度達到 131,072 CSS 像素以上的網頁，該指令會拒絕擷取，並顯示錯誤「Page is too large.」（網頁太大）。
- **固定和黏性元素。** 執行該指令時，Chromium 會把檢視區調整為整個網頁的大小。依視窗高度設定大小的區塊（`100vh`），以及固定的頁首或頁尾，可能會依照這個很高的檢視區重新排版，所以固定頁尾可能只在圖片底部出現一次。
- **延遲載入。** 標記為 `loading="lazy"` 的圖片，只有在你捲動到附近時才會載入。擷取前請先捲動整個網頁，否則圖片的部分區域可能保持空白。
- **內部捲動容器。** Chromium 依網頁本身的捲動大小決定擷取尺寸。網頁在固定高度的外框內捲動面板時，擷取只會顯示該面板一個畫面高度的內容。
- **無限捲動。** 持續載入的動態沒有真正的底部。擷取只包含開始前已載入的內容。

## 使用 OpenScreenShot

OpenScreenShot 會逐個可視區域捲動網頁，並把各部分拼接成一張圖片。固定式頁首只會在頂端擷取一次，捲動內部元素的網頁也可以。高度超過 32,000 裝置像素的網頁會儲存成最多六張圖片。

1. 在 Brave 中開啟 [OpenScreenShot 商店頁面](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)並新增擴充功能。Brave 在 [Using Chrome extensions in Brave](https://brave.com/learn/using-chrome-extensions-in-brave/) 中說明如何從 Chrome 線上應用程式商店安裝。
2. 把 OpenScreenShot 圖示固定到工具列。
3. 開啟網頁並點圖示。在預設設定下，整頁擷取會開始，結果會在編輯器中開啟。
4. 檢查頂端、底部和任何黏性導覽列。
5. 點**儲存圖片**，然後選擇 PNG、JPEG、WebP 或 PDF，或點**複製**。

OpenScreenShot 的整頁快速鍵是 `Ctrl+Shift+S`（macOS 上是 `⌘⇧S`），與 Brave 截圖工具的按鍵相同。如果按鍵開啟的是 Brave 的工具，請改為點圖示，或用擷取選單中的**快速鍵**連結設定其他按鍵。如果圖示開啟的是選單，請選擇**整個網頁**；這由**一鍵 Express 模式**設定控制。

## 該用哪一個

- 要為捲動整個視窗的網頁快速擷取 PNG，請使用 Brave 的 **Full page** 按鈕。
- 對於捲動內部面板的網頁、要匯出 PDF、JPEG 或 WebP，或分享前要加註解和遮蔽時，請使用 OpenScreenShot，例如[錯誤回報](/zh-tw/use-cases/bug-reports/)。
- 擷取要用在貼文中時，請使用 OpenScreenShot 的「**Beautify（美化）**」面板：它會加上邊距、圓角、陰影和背景。請參閱[用於社群媒體的截圖](/zh-tw/use-cases/social-media/)。

[擷取模式參考](/zh-tw/docs/#modes)和[匯出參考](/zh-tw/docs/#export)列出所有選項。[Chrome 指南](/zh-tw/full-page-screenshot/chrome/)說明 DevTools 擷取，Brave 也有這項功能。對於封鎖擴充功能的網頁（例如瀏覽器設定），請參閱[支援與已知限制](/zh-tw/support/)。
