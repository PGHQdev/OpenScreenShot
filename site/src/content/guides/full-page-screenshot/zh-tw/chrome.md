---
title: '如何在 Chrome 中擷取整頁截圖：DevTools 或擴充功能'
description: 使用 Chrome DevTools 的 Capture full size screenshot 指令，了解它的不足之處，並與 OpenScreenShot 的整頁擷取比較。
order: 1
---

Chrome 不用擴充功能也能擷取整頁截圖，但只能從 DevTools 進行。開啟 DevTools，開啟指令選單，輸入 `screenshot`，然後執行 **Capture full size screenshot**（擷取完整尺寸的螢幕截圖）。Chrome 會把整個網頁儲存為 PNG 檔案。Chrome 的一般選單沒有截圖項目：Google 的說明在 **Cast, save, and share**（投放、儲存及分享）下列出的是 Share、Send to your devices 和 Create QR code。如果要擷取可以加註解、匯出成 PDF，或在面板內捲動的網頁，請安裝 OpenScreenShot 並點它的圖示。

## 內建方法

1. 開啟要擷取的網頁。
2. [開啟 DevTools](https://developer.chrome.com/docs/devtools/open)：在 Windows 和 Linux 上按 `F12` 或 `Ctrl+Shift+I`，在 macOS 上按 `Cmd+Option+I`。
3. 開啟[指令選單](https://developer.chrome.com/docs/devtools/command-menu)：按 `Ctrl+Shift+P`，在 macOS 上按 `Cmd+Shift+P`。
4. 輸入 `screenshot`，然後選取 **Capture full size screenshot**。
5. Chrome 會儲存整個網頁的 PNG 檔案。

裝置模式中也有相同的擷取功能。開啟裝置工具列，開啟它的 **More options**（更多選項）選單，然後選取完整尺寸截圖項目。Google 的[裝置模式說明文件](https://developer.chrome.com/docs/devtools/device-mode)稱它為 **Capture a full size screenshot**。

整個流程沒有單一快速鍵。Google 沒有記載這項擷取的註解工具，所以箭頭、文字和遮蔽都要在其他應用程式中完成。

## 限制

- **必須開啟 DevTools。** 這個指令只在指令選單和裝置模式選單中。
- **網頁大小。** 寬度或高度達到 131,072 CSS 像素以上的網頁，Chromium 會拒絕擷取，並顯示錯誤「Page is too large.」（網頁太大）。
- **固定和黏性元素。** 擷取時，Chromium 會把檢視區調整為整個網頁的大小並隱藏捲軸。依視窗高度設定大小的區塊（`100vh`），以及固定的頁首或頁尾，可能會依照這個很高的檢視區重新排版。固定頁尾可能只在圖片底部出現一次，佔滿整個高度的主視覺區塊可能被拉長。
- **延遲載入。** 標記為 `loading="lazy"` 的圖片和框架，只有在你捲動到附近時才會載入。執行指令前請先捲動整個網頁，否則圖片的部分區域可能保持空白。
- **內部捲動容器。** Chromium 依網頁本身的捲動大小決定擷取尺寸。網頁在固定高度的外框內捲動面板時（例如網頁應用程式，或內容窗格會捲動的文件網站），擷取只會顯示該面板一個畫面高度的內容。

## 使用 OpenScreenShot

OpenScreenShot 會逐個可視區域捲動網頁，擷取每個部分，再把各部分拼接成一張圖片。它會在第一個部分擷取固定式頁首，並只在頂端放置一次。捲動的是內部元素而非視窗的網頁也可以。高度超過 32,000 裝置像素的網頁會儲存成最多六張圖片。

1. [從 Chrome 線上應用程式商店安裝 OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)，並把它的圖示固定到工具列。
2. 開啟網頁並點圖示，或按 `Ctrl+Shift+S`（macOS 上是 `⌘⇧S`）。
3. 在編輯器中檢查結果，特別是頂端、底部和任何黏性導覽列。
4. 點**儲存圖片**，然後選擇 PNG、JPEG、WebP 或 PDF。旁邊的**複製**和 **PDF** 一鍵即可完成。

如果開啟的是選單而不是擷取，請選擇**整個網頁**。這由**一鍵 Express 模式**設定控制。[Chrome 整頁截圖指南](/zh-tw/blog/full-page-screenshot-chrome/)逐步說明擴充功能的用法，包括區塊遺漏或重複的情況。[擷取模式參考](/zh-tw/docs/#modes)和[匯出參考](/zh-tw/docs/#export)列出所有選項。

## DevTools 與 OpenScreenShot 對照

- **開始：** DevTools 需要兩組快速鍵和一個輸入的指令。OpenScreenShot 只需要點一下或一組快速鍵。
- **輸出：** DevTools 儲存 PNG。OpenScreenShot 可匯出 PNG、JPEG、WebP 或 PDF，或複製圖片。
- **編輯：** DevTools 沒有編輯功能。OpenScreenShot 會開啟具備箭頭、文字、步驟編號、模糊和裁切的編輯器。
- **安裝：** DevTools 已內建於 Chrome。OpenScreenShot 是採用 MIT 授權的擴充功能，在本機處理擷取。

## 該用哪一個

- 要在無法新增擴充功能的電腦上，為一般網頁擷取一次性的 PNG，請使用 DevTools。
- 對於捲動內部面板的網頁、有黏性頁首的網頁，以及分享前要加註解的擷取，請使用 OpenScreenShot，例如[錯誤回報](/zh-tw/use-cases/bug-reports/)或[設計審查](/zh-tw/use-cases/design-review/)。
- 兩者在 Microsoft Edge 中也能使用；[Edge 指南](/zh-tw/full-page-screenshot/edge/)說明 Edge 本身的螢幕擷取工具。

如果在 `chrome://settings` 這類瀏覽器頁面上擷取失敗，請參閱[支援與已知限制](/zh-tw/support/)。
