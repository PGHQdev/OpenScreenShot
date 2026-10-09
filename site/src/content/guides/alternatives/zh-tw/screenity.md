---
title: 'Screenity 替代方案：截圖和分頁錄影整合在一個擴充功能中'
description: Screenity 與 OpenScreenShot 比較。兩者都開放原始碼。OpenScreenShot 另有整頁截圖和 PDF 匯出，安裝時不要求所有網站的存取權。
order: 7
---

如果你錄製瀏覽器分頁，也擷取整頁截圖，並想要一個能同時做到這兩件事、安裝時不要求存取所有網站的開放原始碼擴充功能，請改用 OpenScreenShot。如果你錄製的不只是分頁，請繼續使用 Screenity：它能錄製區域、桌面、任何應用程式視窗或攝影機，並能匯出 GIF 或儲存到 Google Drive。OpenScreenShot 只錄製一個瀏覽器分頁，不擷取桌面視窗或整個螢幕。Screenity 的付費 Pro 方案還加入連結分享和雲端代管，這是 OpenScreenShot 沒有提供的。

OpenScreenShot 是我們的產品。本頁關於 Screenity 的資訊截至 2026 年 10 月 9 日，來源包括它的 [GitHub 儲存庫](https://github.com/alyssaxuu/screenity)和[資訊清單](https://github.com/alyssaxuu/screenity/blob/master/src/manifest.json)、[Chrome 線上應用程式商店頁面](https://chromewebstore.google.com/detail/screenity-screen-recorder/kbbdabhdfibnancpjfhlkhafgdilcnji)、[Pro 頁面](https://screenity.io/pro)，以及 Chrome 的[權限警告清單](https://developer.chrome.com/docs/extensions/reference/permissions-list)。

## Screenity 與 OpenScreenShot 對照

|                    | Screenity                                                    | OpenScreenShot                                       |
| ------------------ | ------------------------------------------------------------ | ---------------------------------------------------- |
| 價格               | 擴充功能免費；Pro 每月 $10 或每年 $120，有 7 天試用          | 免費，沒有付費方案                                   |
| 開放原始碼         | 是，GPL-3.0                                                  | 是，MIT                                              |
| 安裝時的網站存取權 | 所有網站（必要的 `<all_urls>`，另有 `tabs` 和 `tabCapture`） | 無。分頁擷取為選用，在第一次錄影時詢問               |
| 整頁擷取           | 我們查閱的來源未提及                                         | 是                                                   |
| 註解和模糊         | 繪圖、文字、箭頭、形狀；模糊網頁內容                         | 截圖上的形狀、箭頭、文字、步驟編號、模糊、聚光、裁切 |
| PDF 匯出           | 我們查閱的來源未提及                                         | 是                                                   |
| 分頁錄影           | 是，另可錄製區域、桌面、應用程式視窗和攝影機                 | 是，僅限分頁，在 Chrome 中（Firefox 版只擷取截圖）   |
| 影片匯出           | MP4、GIF、WebM 或 Google Drive                               | MP4 或 WebM                                          |
| 帳號或雲端         | 免費擴充功能不需要登入；Pro 使用帳號和代管於歐盟的雲端       | 無需帳號，不上傳                                     |

## 你保留的功能

兩個擴充功能都開放原始碼，而且都不需要登入就能把免費錄影留在你的裝置上。在 OpenScreenShot 中，在彈出式視窗中點**錄影**，然後選擇**麥克風**、**分頁音訊**或**視訊鏡頭**。保留**整個分頁**，或在預覽上拖曳只錄製網頁的一部分。錄影分頁中有計時器，以及**暫停**、**停止**和**取消**按鈕，所以影片中不會出現控制項。在任何分頁按 `Alt+Shift+X` 都能停止。

## 會改變的地方

錄影編輯器會在游標的每次點選處加上 2 倍縮放。你可以移動或刪除這些縮放，手動加入 1.5 倍、2 倍或 3 倍的縮放，並修剪每個片段。視訊鏡頭會以圓形泡泡加入匯出的影片，位置由你決定，「**Beautify（美化）**」面板則可加上邊距和背景。匯出預設算繪 MP4（H.264 和 AAC），也可以選擇 WebM。[錄影參考](/zh-tw/docs/#record)說明每個控制項。

截圖是同一個擴充功能的一部分。在預設的**一鍵 Express 模式**下，點工具列圖示會開始**整個網頁**擷取。截圖編輯器有搭配**實色**填色的**模糊**可用於遮蔽，**儲存圖片**會開啟**匯出**對話框，可儲存 PNG、JPEG、WebP 或 PDF。OpenScreenShot 在錄影期間不會在網頁上加入任何東西，所以你無法在錄影時於網頁上繪圖。註解功能用於截圖。

安裝時的存取權較小。Screenity 的資訊清單要求 `<all_urls>`，Chrome 的清單對 `tabCapture` 顯示「Read and change all your data on all websites」（讀取及變更你在所有網站上的資料），對 `tabs` 顯示「Read your browsing history」（讀取你的瀏覽記錄）。OpenScreenShot 以 `activeTab` 安裝，只在你第一次點**錄影**時才詢問分頁擷取權限。只有在你開啟**跨網站錄影**時，它才會要求所有網站的存取權；這項權限讓點選追蹤能跟著分頁到其他網站。

## 如何轉換

1. 從 [Chrome 線上應用程式商店](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)安裝 OpenScreenShot。[Firefox 版](https://addons.mozilla.org/firefox/addon/openscreenshot/)只擷取截圖。
2. 把圖示固定到工具列。
3. 擷取第一張截圖：在網頁上點圖示，然後在**編輯器**中檢查結果。
4. 在彈出式視窗中點**錄影**，並接受 Chrome 的分頁擷取提示。錄一段簡短的影片並匯出。
5. 擷取截圖時，在**設定**中設定**擷取後**：**編輯器**、**剪貼簿**或**下載**。
6. 移除 Screenity 之前，先匯出你要保留的錄影。

要製作功能導覽，請參閱[產品示範影片](/zh-tw/use-cases/product-demos/)。要在 issue 中呈現錯誤，請參閱[用於錯誤回報的截圖](/zh-tw/use-cases/bug-reports/)。如果你用連結和團隊分享影片，請比較 [Loom 替代方案](/zh-tw/alternatives/loom/)。要找有雲端上傳的錄影工具，請參閱 [Nimbus 替代方案](/zh-tw/alternatives/nimbus/)。
