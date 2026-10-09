---
title: 如何在 Microsoft Edge 中擷取整頁截圖
description: 用 Edge 內建的螢幕擷取工具或 DevTools 指令擷取整個網頁，了解限制，並使用 Chrome 線上應用程式商店的 OpenScreenShot。
order: 2
---

Microsoft Edge 有內建的 Screenshot（螢幕擷取）工具，以前稱為 Web capture（網頁擷取）。按 `Ctrl+Shift+S`，選取 **Capture full page**（擷取整頁），然後複製擷取內容或把它儲存到你的裝置。OpenScreenShot 在 Edge 中也能使用：Edge 是 Chromium 瀏覽器，只要你允許來自其他商店的擴充功能，就能從 Chrome 線上應用程式商店安裝它。

## 內建方法

Microsoft 在 [Edge 截圖指南](https://www.microsoft.com/en-us/edge/learning-center/screenshot-webpage)中說明這個工具。

1. 開啟要擷取的網頁。
2. 按 `Ctrl+Shift+S`。你也可以在網頁上按右鍵並選取 **Screenshot**，或開啟 **Settings and more**（設定及其他）（**...**）並選取 **Screenshot**。
3. 選取中間的選項 **Capture full page**。
4. 需要時，在預覽中用繪圖工具為擷取加註解。
5. 複製擷取內容，或把它儲存到你的裝置。

Microsoft 表示，功能是否可用可能因裝置類型、市場和瀏覽器版本而異。管理員也可以用 [WebCaptureEnabled 原則](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/webcaptureenabled)關閉這個工具。在公司電腦上，如果沒有 **Screenshot** 項目，可能表示已設定該原則。

Edge 也有 Chromium 的 DevTools 擷取功能。開啟 DevTools，開啟 Device Emulation（裝置模擬），開啟 **More options**（更多選項），然後選取 **Capture a full size screenshot**。Microsoft 在它的 [Device Mode 文章](https://learn.microsoft.com/en-us/microsoft-edge/devtools/device-mode/)中記載了這項功能。[Chrome 指南](/zh-tw/full-page-screenshot/chrome/)比較這個方法與擴充功能。

## 限制

- **未記載的行為。** Microsoft 沒有記載 Screenshot 工具如何組成整頁圖片、網頁長度上限，或如何處理黏性頁首、延遲載入和內部捲動容器。分享前請檢查每次擷取。
- **內部捲動容器。** Microsoft Q&A 上的使用者回報，在內部元素中捲動的網頁上（例如內容窗格會捲動的網頁應用程式），整頁擷取會失敗。Microsoft 尚未證實這一點。
- **DevTools 網頁大小。** DevTools 擷取使用 Chromium 的截圖指令，寬度或高度達到 131,072 CSS 像素以上的網頁，該指令會拒絕擷取，並顯示錯誤「Page is too large.」（網頁太大）。
- **延遲載入。** 標記為 `loading="lazy"` 的圖片，只有在你捲動到附近時才會載入。擷取前請先捲動整個網頁，否則圖片的部分區域可能保持空白。
- **黏性頁首。** 捲動並拼接多個部分的擷取工具，會重複任何停留在畫面上的元素。請查看圖片往下是否有出現不只一次的頁首。

## 使用 OpenScreenShot

OpenScreenShot 會捲動網頁，分段擷取，再把各部分拼接成一張圖片。固定式頁首只會在頂端擷取一次，捲動內部元素的網頁也可以。高度超過 32,000 裝置像素的網頁會儲存成最多六張圖片。

1. 在 Edge 中開啟 [OpenScreenShot 商店頁面](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)。Edge 詢問時，選取 **Allow extensions from other stores**（允許來自其他商店的擴充功能），然後新增擴充功能。Microsoft 在它的[擴充功能說明](https://support.microsoft.com/en-us/edge/add-turn-off-or-remove-extensions-in-microsoft-edge)中解釋這個步驟。
2. 把 OpenScreenShot 圖示固定到工具列。
3. 開啟網頁並點圖示。在預設設定下，整頁擷取會開始，結果會在編輯器中開啟。
4. 檢查頂端、底部，以及任何捲動時才載入的區塊。
5. 點**儲存圖片**，然後選擇 PNG、JPEG、WebP 或 PDF，或點**複製**。

OpenScreenShot 的整頁快速鍵是 `Ctrl+Shift+S`，與 Edge 螢幕擷取工具的按鍵相同。如果按鍵開啟的是 Edge 的工具，請改為點圖示，或用擷取選單中的**快速鍵**連結設定其他按鍵。[擷取模式參考](/zh-tw/docs/#modes)列出其他模式。

## 該用哪一個

- 要在捲動整個視窗的網頁上快速擷取並加幾筆畫筆標記，請使用 Edge 的螢幕擷取工具。
- 網頁捲動的是內部面板、需要匯出 PDF、JPEG 或 WebP，或需要步驟編號和實色遮蔽時，請使用 OpenScreenShot，例如[說明文件和教學](/zh-tw/use-cases/documentation/)或[支援回覆](/zh-tw/use-cases/customer-support/)。
- 管理員關閉了螢幕擷取工具，而你又無法安裝擴充功能時，請使用 DevTools 擷取。

[匯出參考](/zh-tw/docs/#export)說明檔案格式和縮放比例。對於 OpenScreenShot 無法擷取的網頁（例如瀏覽器設定），請參閱[支援與已知限制](/zh-tw/support/)。
