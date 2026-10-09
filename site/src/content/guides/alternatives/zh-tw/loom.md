---
title: 'Loom 替代方案：留在你裝置上的分頁錄影'
description: Loom 與 OpenScreenShot 比較。錄製瀏覽器分頁並加入視訊鏡頭、麥克風和自動縮放，在本機匯出 MP4，無需帳號，也沒有付費方案。
order: 8
---

如果你在 Chrome 中錄製網頁應用程式或網頁的操作導覽，並想在自己的裝置上匯出 MP4 檔案，而且不需要帳號，請改用 OpenScreenShot。如果你用連結分享影片，請繼續使用 Loom：Loom 代管每部影片，提供影片庫和團隊工作區，並列出桌面和行動應用程式。OpenScreenShot 沒有代管服務，也沒有分享連結，所以你要自己上傳或附加匯出的檔案。它只錄製一個瀏覽器分頁，只支援 Chrome，也不擷取桌面視窗或整個螢幕。

OpenScreenShot 是我們的產品。本頁關於 Loom 的資訊截至 2026 年 10 月 9 日，來源包括它的[價格頁面](https://www.loom.com/pricing)、[Chrome 線上應用程式商店頁面](https://chromewebstore.google.com/detail/loom-%E2%80%93-screen-recorder-sc/liecbddmkiiihnedobmlmillhodjkdmb)、Atlassian 的[帳號說明頁面](https://support.atlassian.com/loom/docs/use-loom-with-an-atlassian-account)，以及 Chrome 的[權限警告清單](https://developer.chrome.com/docs/extensions/reference/permissions-list)。

## Loom 與 OpenScreenShot 對照

|                    | Loom                                                                                                                               | OpenScreenShot                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 價格               | Starter $0（25 部影片，螢幕錄影最長 5 分鐘）；Business 每位使用者每月 $18；Business + AI 列為每位使用者每月 $24；Enterprise 需洽詢 | 免費，沒有付費方案                                 |
| 開放原始碼         | 否                                                                                                                                 | 是，MIT                                            |
| 安裝時的網站存取權 | 所有網站（必要的 `<all_urls>`，每個網頁都執行內容指令碼）                                                                          | 無。分頁擷取為選用，在第一次錄影時詢問             |
| 整頁擷取           | 我們查閱的來源未提及                                                                                                               | 是                                                 |
| 註解和模糊         | 我們查閱的來源未提及                                                                                                               | 是，用於截圖                                       |
| PDF 匯出           | 我們查閱的來源未提及                                                                                                               | 是，用於截圖                                       |
| 分頁錄影           | 螢幕錄影，各方案有不同限制                                                                                                         | 是，僅限分頁，在 Chrome 中（Firefox 版只擷取截圖） |
| 帳號或雲端         | 必須有帳號；影片由 Loom 代管                                                                                                       | 無需帳號，不上傳                                   |

Loom 自 2023 年 11 月起成為 Atlassian 的一部分，Loom 帳號可以使用 Atlassian 帳號。

## 你保留的功能

你保留從瀏覽器工具列啟動的錄影工具。在 OpenScreenShot 彈出式視窗中點**錄影**，開啟**麥克風**和**視訊鏡頭**，然後點**開始錄製**。你的視訊鏡頭畫面會以圓形泡泡出現在匯出的影片中，位置由你決定。**分頁音訊**會加入網頁的聲音。

## 會改變的地方

影片是一個檔案。停止後，錄影編輯器會在同一個分頁中開啟。它會在每次點選處加上 2 倍縮放，讓觀看者看到你點了哪裡。你可以調整或刪除每個縮放，自行加入 1.5 倍、2 倍或 3 倍的縮放，並修剪片段。匯出會把 MP4（H.264 和 AAC）或 WebM 檔案算繪到你的下載資料夾。你可以把它上傳到自己的影片代管服務、聊天或工單中。[錄影參考](/zh-tw/docs/#record)說明每個控制項。

錄影會留在你的裝置上。OpenScreenShot 會在你錄影時把錄影存到 IndexedDB，並保留到你刪除該工作階段為止。它沒有分析或遙測功能。[隱私權部分](/zh-tw/docs/#privacy)有詳細說明。

範圍是一個分頁。保留**整個分頁**，或在預覽上拖曳只錄製網頁的一部分。如果分頁在錄影期間移到其他網站，點選追蹤需要**跨網站錄影**，它會要求所有網站的存取權。沒有這個權限時，影片其餘部分的縮放和點選效果會停止，影片則會繼續錄製。

安裝時的存取權較小。Loom 的資訊清單要求 `<all_urls>`、`tabCapture` 和 `desktopCapture`。Chrome 的清單對 `tabCapture` 顯示「Read and change all your data on all websites」（讀取及變更你在所有網站上的資料），對 `desktopCapture` 顯示「Capture content of your screen」（擷取你的螢幕內容）。OpenScreenShot 以 `activeTab` 安裝，只在你第一次點**錄影**時才詢問分頁擷取權限。

OpenScreenShot 也能擷取截圖。在預設的**一鍵 Express 模式**下，點工具列圖示會開始**整個網頁**擷取，編輯器提供箭頭、步驟編號，以及搭配**實色**填色的**模糊**。

## 如何轉換

1. 從 [Chrome 線上應用程式商店](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)安裝 OpenScreenShot。[Firefox 版](https://addons.mozilla.org/firefox/addon/openscreenshot/)只擷取截圖。
2. 把圖示固定到工具列。
3. 在彈出式視窗中點**錄影**，並接受 Chrome 的分頁擷取提示。錄一段簡短的影片，然後點**匯出**。
4. 在任何分頁按 `Alt+Shift+X` 都能停止錄影。
5. 擷取截圖時，在**設定**中設定**擷取後**：**編輯器**、**剪貼簿**或**下載**。
6. 關閉帳號或變更方案之前，先下載你要保留的 Loom 影片。

要製作功能導覽，請參閱[產品示範影片](/zh-tw/use-cases/product-demos/)。要回覆支援工單，請參閱[用於客戶支援的截圖](/zh-tw/use-cases/customer-support/)。要找也能錄製桌面的開放原始碼錄影工具，請參閱 [Screenity 替代方案](/zh-tw/alternatives/screenity/)。要找有雲端連結的錄影工具，請參閱 [Awesome Screenshot 替代方案](/zh-tw/alternatives/awesome-screenshot/)。
