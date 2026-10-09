---
title: 'FireShot 替代方案：瀏覽器內的免費編輯器，而且開放原始碼'
description: FireShot 與 OpenScreenShot 比較。兩者都在本機擷取整頁。OpenScreenShot 開放原始碼，提供免費的瀏覽器內編輯器和分頁錄影。
order: 4
---

如果你想在瀏覽器中免費為整頁截圖加註解和模糊，在任何能執行 Chrome 或 Firefox 的作業系統上使用，而且程式碼可供檢視，請改用 OpenScreenShot。如果你需要連結可用的 PDF、批次或自動擷取，或 FireShot Pro 的額外功能（例如進階 PDF 匯出和擷取紀錄），請繼續使用 FireShot。OpenScreenShot 以圖片形式儲存 PDF，所以其中的文字無法搜尋，連結也無法使用。它只擷取網頁，不擷取桌面視窗或整個螢幕。

OpenScreenShot 是我們的產品。本頁關於 FireShot 的資訊截至 2026 年 10 月 9 日，來源包括它的 [Chrome 線上應用程式商店頁面](https://chromewebstore.google.com/detail/mcbpblocgmgfnpjjppndjkmgjaogfceg)、[網站](https://getfireshot.com/)、[購買頁面](https://getfireshot.com/buy.php)、[Firefox 附加元件頁面](https://addons.mozilla.org/en-US/firefox/addon/fireshot/)，以及從 Google 更新伺服器取得的 2.1.4.18 版資訊清單。

## FireShot 與 OpenScreenShot 對照

|                    | FireShot                                                                                                          | OpenScreenShot                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 價格               | 免費（Lite）；Pro 每年 $39.95，或一次付 $99.95 取得兩台裝置的終身授權                                             | 免費，沒有付費方案                                 |
| 開放原始碼         | 否（自訂授權）                                                                                                    | 是，MIT                                            |
| 安裝時的網站存取權 | 在 Chrome 中無；所有網站的存取權為選用。必須要求 `nativeMessaging`                                                | 無。開始擷取時才存取目前分頁                       |
| 整頁擷取           | 是                                                                                                                | 是                                                 |
| 註解和模糊         | 商店頁面提到文字、箭頭和模糊；Pro 列出「Editor & smart annotations (on Windows)」（編輯器與智慧註解，Windows 版） | 免費，在瀏覽器中                                   |
| PDF 匯出           | 是，含連結；進階 PDF 屬於 Pro                                                                                     | 是，以圖片形式：單頁，或有重疊的 A4 或 Letter 頁面 |
| 分頁錄影           | 否                                                                                                                | 是，在 Chrome 中（Firefox 版只擷取截圖）           |
| 帳號或雲端         | 本機擷取；可選擇上傳和分享                                                                                        | 無需帳號，不上傳                                   |

## 你保留的功能

兩個工具的擷取都留在本機。FireShot 的網站寫著「100% local captures keep your work private and offline-safe.」（100% 本機擷取，讓你的作品保持私密且可離線使用）。OpenScreenShot 在你的瀏覽器中處理擷取，不會上傳。在 Chrome 中，兩者在安裝時都不要求所有網站的存取權。

你保留長網頁的整頁擷取，以及 PNG、JPEG 和 PDF 匯出。OpenScreenShot 還能儲存 WebP。

## 會改變的地方

編輯器在瀏覽器分頁中執行，所以在每種作業系統上的運作都相同，而且每個工具都免費。用**箭頭**、**文字**、**步驟編號**和「**Spotlight（聚光）**」指出細節，用**模糊**（`B`）搭配**實色**填色遮住私人資料。**裁切**和「**Cut（剪除）**」可修剪長擷取。[註解參考](/zh-tw/docs/#annotate)列出所有工具。

PDF 的運作方式不同。點**儲存圖片**開啟**匯出**對話框，然後選擇 **PDF**。**原尺寸**會產生一頁與圖片同尺寸的頁面。**A4** 或 **Letter** 搭配**分成多頁**，會把長擷取分成多頁，每頁重疊 5 mm。PDF 以圖片形式保存截圖，所以沒有可點的連結或可選取的文字。如果你傳送的 PDF 需要讀者點連結，FireShot 更適合這項工作。

OpenScreenShot 沒有批次擷取、沒有擷取紀錄，也沒有上傳到電子郵件或 OneNote 的功能。它有**擷取元素**、用於製作加框圖片的「**Beautify（美化）**」面板，以及 Chrome 中可在點選處縮放並匯出 MP4 的分頁錄影。

FireShot 的 Chrome 資訊清單要求 `nativeMessaging`，這讓擴充功能能與安裝在你電腦上的程式溝通。OpenScreenShot 不使用原生程式。Chrome 只在你第一次點**錄影**時，才詢問它選用的分頁擷取權限。

FireShot 的 Firefox 附加元件最後更新於 2023 年 6 月 5 日，並要求存取你在所有網站上的資料。OpenScreenShot 的 Firefox 版在安裝時不要求任何網站存取權，只擷取截圖。

## 如何轉換

1. 從 [Chrome 線上應用程式商店](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)或 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) 安裝 OpenScreenShot。
2. 把圖示固定到工具列。
3. 在長網頁上點圖示。在預設的**一鍵 Express 模式**下，這會開始**整個網頁**擷取並開啟**編輯器**。
4. 在**設定**中設定**擷取後**。選擇**下載**可把每次擷取以 PNG 直接存到你的下載資料夾，選擇**剪貼簿**則可立即貼上。
5. 用 `{date}`、`{domain}` 和 `{title}` 等代號設定**檔名範本**。`/` 會存到「下載」內的資料夾。

如果鍵盤快速鍵無法開始擷取，請開啟 `chrome://extensions/shortcuts`，檢查是否有其他擴充功能使用相同的按鍵。

要保存附日期的網頁副本，請參閱[儲存網頁的視覺副本](/zh-tw/use-cases/archive-web-pages/)。要製作含註解擷取的說明頁面，請參閱[用於文件的截圖](/zh-tw/use-cases/documentation/)。[匯出參考](/zh-tw/docs/#export)說明格式和縮放比例。其他整頁工具請參閱 [GoFullPage 替代方案](/zh-tw/alternatives/gofullpage/)和 [FullPage Capture 替代方案](/zh-tw/alternatives/fullpage-capture/)。
