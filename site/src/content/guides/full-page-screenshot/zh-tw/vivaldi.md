---
title: 如何在 Vivaldi 中擷取整頁截圖
description: 用 Vivaldi 的 Capture 工具把整頁存成 PNG 或 JPEG，了解 30,000 像素上限，並使用 Chrome 線上應用程式商店的 OpenScreenShot。
order: 7
---

Vivaldi 有內建的 Capture（擷取）工具。點狀態列中的相機圖示，選取 **Full Page**（整頁），選擇 PNG、JPEG 或剪貼簿，然後點 **Capture**。Full Page 擷取最多到 30,000 像素為止。OpenScreenShot 在 Vivaldi 中也能使用：Vivaldi 是 Chromium 瀏覽器，可以從 Chrome 線上應用程式商店安裝擴充功能。

## 內建方法

Vivaldi 在 [Capture a screenshot](https://help.vivaldi.com/desktop/tools/capture-a-screenshot/) 中說明這個工具。

1. 開啟要擷取的網頁。
2. 點狀態列中的相機圖示。你也可以在 Windows 和 Linux 上按 `F2`，或在 macOS 上按 `Cmd+E` 開啟 Quick Commands（快速指令），然後輸入 `Capture`。
3. 選取 **Full Page**。
4. 選取輸出方式：**Save as PNG**（儲存為 PNG）、**Save as JPEG**（儲存為 JPEG）或 **Copy to Clipboard**（複製到剪貼簿）。
5. 點 **Capture**。儲存的檔案會存到 **Settings** > **Webpages** > **Image Capture** > **Capture Storage Folder** 中設定的資料夾。

Vivaldi 也可以把擷取轉成 Notes 面板中的新筆記，並附上擷取日期和網頁網址。

[Vivaldi 的鍵盤快速鍵清單](https://help.vivaldi.com/desktop/shortcuts/keyboard-shortcuts/)中沒有網頁擷取的預設按鍵。要設定按鍵，請開啟 **Settings** > **Keyboard**，然後把按鍵對應到 **Capture Page to disk**（擷取網頁到磁碟）或 **Capture Page to Clipboard**（擷取網頁到剪貼簿）。

## 限制

- **尺寸。** Full Page 擷取最多 30,000 像素。網頁更長時，請擷取你需要的區塊。
- **未記載的行為。** Vivaldi 沒有記載它如何組成整頁圖片，或如何處理黏性頁首。請檢查圖片的頂端和中間，看看頁首是否遺漏或重複。
- **延遲載入。** 標記為 `loading="lazy"` 的圖片，只有在你捲動到附近時才會載入。擷取前請先捲動整個網頁，否則圖片的部分區域可能保持空白。
- **內部捲動容器。** 開發人員回報，Chromium、Firefox 和 WebKit 的整頁擷取，對於在固定高度外框內捲動的面板，只會顯示一個畫面高度的內容。Vivaldi 沒有記載它在這方面的行為，所以請檢查網頁應用程式，以及內容窗格會捲動的文件網站。
- **註解。** Vivaldi 沒有記載擷取的繪圖或註解工具。要加上箭頭或文字，請在其他應用程式中開啟檔案。

## 使用 OpenScreenShot

OpenScreenShot 會逐個可視區域捲動網頁，並把各部分拼接成一張圖片。固定式頁首只會在頂端擷取一次，捲動內部元素的網頁也可以。高度超過 32,000 裝置像素的網頁會儲存成最多六張圖片。

1. 在 Vivaldi 中開啟 [OpenScreenShot 商店頁面](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)並新增擴充功能。Vivaldi 在它的[擴充功能說明](https://help.vivaldi.com/desktop/appearance-customization/extensions/)中說明如何從 Chrome 線上應用程式商店安裝。
2. 把 OpenScreenShot 圖示固定到工具列。
3. 開啟網頁並點圖示，或按 `Ctrl+Shift+S`（macOS 上是 `⌘⇧S`）。在預設設定下，整頁擷取會開始，結果會在編輯器中開啟。
4. 檢查頂端、底部和任何黏性導覽列。
5. 點**儲存圖片**，然後選擇 PNG、JPEG、WebP 或 PDF，或點**複製**。

如果圖示開啟的是選單，請選擇**整個網頁**；這由**一鍵 Express 模式**設定控制。匯出前，編輯器可以加上箭頭、文字、步驟編號、模糊和裁切。[擷取模式參考](/zh-tw/docs/#modes)和[匯出參考](/zh-tw/docs/#export)列出所有選項。

## 該用哪一個

- 要為 30,000 像素以下的網頁擷取 PNG 或 JPEG，特別是想把擷取連同網址放進筆記時，請使用 Vivaldi 的 Capture 工具。
- 對於較長的網頁、捲動內部面板的網頁，或要加註解或儲存為 PDF 的擷取，請使用 OpenScreenShot，例如[說明文件和教學](/zh-tw/use-cases/documentation/)或[設計審查](/zh-tw/use-cases/design-review/)。
- 如果你經常擷取且不需要註解，請設定 Vivaldi 的快速鍵。

[Opera 指南](/zh-tw/full-page-screenshot/opera/)和 [Brave 指南](/zh-tw/full-page-screenshot/brave/)說明其他有自己擷取工具的 Chromium 瀏覽器。對於封鎖擴充功能的網頁（例如瀏覽器設定），請參閱[支援與已知限制](/zh-tw/support/)。
