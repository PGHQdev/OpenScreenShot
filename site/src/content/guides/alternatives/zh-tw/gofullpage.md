---
title: 'GoFullPage 替代方案：免費註解，而且開放原始碼'
description: GoFullPage 與 OpenScreenShot 的整頁截圖比較。OpenScreenShot 提供免費的註解、模糊、裁切和 PDF 分頁，而且程式碼公開。
order: 1
---

如果你擷取整頁後還需要裁切、模糊、加註解或把 PDF 分頁，請改用 OpenScreenShot：GoFullPage 把這些功能放在付費的 Premium 方案中，而 OpenScreenShot 免費提供。OpenScreenShot 也採用 MIT 授權，所以你可以檢視在你網頁上執行的程式碼。如果你只擷取整頁並存成圖片或 PDF、不做任何編輯，請繼續使用 GoFullPage。它的免費版已經能做到這些，擷取次數沒有限制，它的常見問題也連到 Microsoft Edge Add-ons 版本。OpenScreenShot 沒有 Edge Add-ons 頁面，但 Edge 可以從 Chrome 線上應用程式商店安裝它。OpenScreenShot 只擷取瀏覽器中的網頁；它不擷取桌面視窗或整個螢幕。

OpenScreenShot 是我們的產品。本頁關於 GoFullPage 的資訊截至 2026 年 10 月 9 日，來源包括它的 [Chrome 線上應用程式商店頁面](https://chromewebstore.google.com/detail/fdpohaocaechififmbbbbbknoalclacl)、[常見問題](https://gofullpage.com/faq)、[Premium 頁面](https://gofullpage.com/premium)，以及 [Firefox 附加元件頁面](https://addons.mozilla.org/en-US/firefox/addon/gofullpage-screenshot/)。

## GoFullPage 與 OpenScreenShot 對照

|                    | GoFullPage                                             | OpenScreenShot                                 |
| ------------------ | ------------------------------------------------------ | ---------------------------------------------- |
| 價格               | 免費；Premium 每年 $12（未稅），有 7 天試用            | 免費，沒有付費方案                             |
| 開放原始碼         | 否。自 2018 年起為某 MIT 專案的私有分支                | 是，MIT                                        |
| 安裝時的網站存取權 | 無。所有網站的存取權為選用                             | 無。開始擷取時才存取目前分頁                   |
| 整頁擷取           | 是                                                     | 是                                             |
| 註解和模糊         | 僅限 Premium（模糊、文字、螢光標記、裁切）             | 免費（形狀、箭頭、文字、步驟編號、模糊、裁切） |
| PDF 匯出           | 免費；智慧 PDF 分頁屬於 Premium                        | 免費，包括有重疊的 A4 或 Letter 分頁           |
| 分頁錄影           | 否                                                     | 是，在 Chrome 中（Firefox 版只擷取截圖）       |
| 帳號或雲端         | 免費擷取不需要帳號；Premium 使用帳號                   | 無需帳號，不上傳                               |
| 瀏覽器商店         | Chrome 線上應用程式商店、Firefox Add-ons、Edge Add-ons | Chrome 線上應用程式商店、Firefox Add-ons       |

[完整比較](/zh-tw/compare/)把 FullPage Capture 也加入同一張表。

## 你保留的功能

主要的習慣不變。在預設設定下，點一下 OpenScreenShot 工具列圖示就會開始**整個網頁**擷取。這就是**一鍵 Express 模式**。擴充功能會捲動網頁，把各部分拼接成一張圖片，並在**編輯器**中開啟結果。固定式頁首只在頂端出現一次，捲動內部元素的網頁也可以。

兩個擴充功能在安裝時都不要求任何網站存取權。OpenScreenShot 使用 `activeTab`，所以只能在你開始擷取的當下，讀取你擷取的那個分頁。兩者都能儲存 PNG、JPEG 和 PDF 檔案。兩者都能在 Chrome 和 Firefox 中使用。

## 會改變的地方

編輯器工具都免費。**裁切**（`C`）可修剪圖片，**模糊**（`B`）搭配**實色**填色可蓋住私人資料，**箭頭**、**文字**和**步驟編號**可標出重點。**Cut（剪除）**（`X`）可從長擷取中移除水平帶狀區域。[註解參考](/zh-tw/docs/#annotate)列出所有工具和快速鍵。

PDF 版面也免費。點**儲存圖片**開啟**匯出**對話框，選擇 **PDF**，然後選擇 **A4** 或 **Letter** 並搭配**分成多頁**。每頁與下一頁重疊 5 mm，所以文字不會在一行中間被切斷。**儲存圖片**旁的 **PDF** 按鈕一鍵即可儲存 PDF。PDF 以圖片形式保存截圖，所以其中的文字無法搜尋或選取。

你也會得到更多擷取模式：**可見範圍**、**選取區域**和**擷取元素**；擷取元素會依精確的範圍擷取單一卡片、表格或圖表。在 Chrome 中，**錄影**會把分頁錄製成 MP4 或 WebM 影片，並在每次點選處縮放。第一次錄影時會詢問選用的分頁擷取權限。

OpenScreenShot 沒有日期或網址戳記。請改用**設定**中的檔名範本搭配 `{date}` 和 `{domain}`，把這些資訊保留在檔名中。

## 如何轉換

1. 從 [Chrome 線上應用程式商店](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)或 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) 安裝 OpenScreenShot。
2. 把圖示固定到工具列。如果 GoFullPage 固定在同一個位置，請取消固定它，以免點錯圖示。
3. 開啟長網頁並點 OpenScreenShot 圖示。在**編輯器**中檢查頂端、底部和任何黏性頁首。
4. 在**設定**中設定**擷取後**。**編輯器**會開啟每次擷取供你加註解。**下載**會把 PNG 存到你的下載資料夾而不開啟分頁，接近「擷取後直接儲存」的習慣。**剪貼簿**會複製圖片。
5. 要為用 GoFullPage 儲存的圖片加註解，請把檔案拖放到編輯器上，或用 `Ctrl+V`（macOS 上是 `⌘V`）貼上。

如果鍵盤快速鍵無法開始 OpenScreenShot 擷取，請開啟 `chrome://extensions/shortcuts`，檢查是否有其他擴充功能使用相同的按鍵。

要以附日期的檔名保存網頁副本，請參閱[儲存網頁的視覺副本](/zh-tw/use-cases/archive-web-pages/)。如果你需要含可點連結的 PDF 輸出，請比較 [FireShot 替代方案](/zh-tw/alternatives/fireshot/)和 [FullPage Capture 替代方案](/zh-tw/alternatives/fullpage-capture/)。
