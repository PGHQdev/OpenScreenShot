---
title: 'Nimbus Screenshot 替代方案：轉為 FuseBase 後的本機擷取選擇'
description: Nimbus Screenshot 現在是 FuseBase Pro。OpenScreenShot 是免費、開放原始碼的選擇，可在你的裝置上整頁擷取、加註解和錄製分頁。
order: 5
---

Nimbus Screenshot 現在以 FuseBase Pro 之名在 Chrome 上推出，由 Nimbus Web 提供。如果你過去用 Nimbus 擷取、註解和錄製網頁，並想要一個把檔案留在你裝置上的免費工具，不需要帳號，也沒有雲端工作區，請改用 OpenScreenShot。如果你需要 OpenScreenShot 沒有的功能，請繼續使用 FuseBase Pro：錄製一個分頁以外的螢幕內容，以及上傳到 FuseBase、Google Drive、Dropbox 或 Slack。OpenScreenShot 只錄製一個瀏覽器分頁，只支援 Chrome。它不擷取桌面視窗或整個螢幕。

OpenScreenShot 是我們的產品。本頁關於 FuseBase Pro 的資訊截至 2026 年 10 月 9 日，來源包括它的 [Chrome 線上應用程式商店頁面](https://chromewebstore.google.com/detail/fddbloohgcjopkmnjdeodjcfbgiimpcn)、FuseBase 的[截圖頁面](https://thefusebase.com/screenshot/)和[價格頁面](https://thefusebase.com/pricing/)、舊的 [Nimbus Firefox 附加元件頁面](https://addons.mozilla.org/en-US/firefox/addon/nimbus-screenshot/)，以及從 Google 更新伺服器取得的 3.6.19 版資訊清單。

## Nimbus Screenshot 發生了什麼事

原本的 Nimbus Screenshot & Screen Video Recorder 頁面已不在 Chrome 線上應用程式商店中。舊的 Nimbus 截圖頁面 nimbusweb.me/screenshot.php 現在會重新導向到 FuseBase 截圖頁面。目前的 Chrome 擴充功能是「FuseBase Pro - Capture screenshots and Video record」，由 Nimbus Web, Inc. 提供。舊的 Nimbus 附加元件仍列在 Firefox 上。它最後更新於 2020 年 7 月 31 日。

## FuseBase Pro 與 OpenScreenShot 對照

|                    | FuseBase Pro（前身為 Nimbus）                             | OpenScreenShot                               |
| ------------------ | --------------------------------------------------------- | -------------------------------------------- |
| 價格               | 免費方案錄影最長 5 分鐘；Pro 方案錄影最長 10 小時         | 免費，沒有付費方案                           |
| 開放原始碼         | 否                                                        | 是，MIT                                      |
| 安裝時的網站存取權 | 所有網站（必要的 `<all_urls>`，每個網頁都執行內容指令碼） | 無。開始擷取時才存取目前分頁                 |
| 整頁擷取           | 是                                                        | 是                                           |
| 註解和模糊         | 是                                                        | 是，所有工具免費                             |
| PDF 匯出           | 是，依據它的商店頁面                                      | 是                                           |
| 分頁錄影           | 是，螢幕和視訊鏡頭；GIF 和 MP4 轉換屬於付費功能           | 是，僅限分頁，在 Chrome 中；MP4 和 WebM 免費 |
| 帳號或雲端         | 上傳到 FuseBase、Google Drive、Dropbox 和 Slack           | 無需帳號，不上傳                             |

FuseBase 截圖頁面沒有顯示擷取 Pro 方案的價格。FuseBase 價格頁面列出的是工作區方案，最低為 Solo，依計費方式為每月 $32 或 $39，而且沒有提到擷取擴充功能。

## 你保留的功能

你保留整頁擷取、具備註解工具和模糊的編輯器，以及 PDF 匯出。在 Chrome 中，你保留含視訊鏡頭的錄影，OpenScreenShot 還能錄製麥克風和分頁音訊。匯出內容沒有浮水印。

## 會改變的地方

檔案會留在你的裝置上。OpenScreenShot 把擷取存放在瀏覽器的本機儲存空間，把錄影存放在 IndexedDB，直到你刪除為止，而且沒有分析或遙測功能。Chrome 線上應用程式商店上 FuseBase Pro 的隱私權部分揭露會收集個人識別資訊、驗證資訊和網站內容。要分享 OpenScreenShot 的擷取，請點**複製**再貼上，或點**儲存圖片**再附加檔案。

安裝時的存取權較小。OpenScreenShot 使用 `activeTab`，在你開始擷取時涵蓋一個分頁。你第一次點**錄影**時，Chrome 會詢問選用的分頁擷取權限；只有在你開啟**跨網站錄影**時，才會詢問所有網站的存取權。

錄影涵蓋一個分頁。在彈出式視窗中點**錄影**，選擇**麥克風**、**分頁音訊**或**視訊鏡頭**，然後錄製整個分頁或你拖曳出的區域。錄影編輯器會在每次點選處加上 2 倍縮放，你可以修剪片段並放置視訊鏡頭泡泡。MP4 和 WebM 匯出免費。OpenScreenShot 沒有 GIF 匯出。請參閱[錄影參考](/zh-tw/docs/#record)。

## 如何轉換

1. 從 [Chrome 線上應用程式商店](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)或 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) 安裝 OpenScreenShot。Firefox 版只擷取截圖。
2. 把圖示固定到工具列。
3. 在網頁上點圖示。在預設的**一鍵 Express 模式**下，這會開始**整個網頁**擷取並開啟**編輯器**。在網頁上按右鍵即可使用**可見範圍**、**選取區域**和**擷取元素**。
4. 在**設定**中設定**擷取後**：**編輯器**、**剪貼簿**或**下載**。
5. 從 FuseBase 或你的雲端儲存空間下載你要保留的檔案。要為舊擷取加註解，請把圖片拖放到 OpenScreenShot 編輯器上。
6. 檢查 `chrome://extensions`，如果不再使用 Nimbus 或 FuseBase 擴充功能，請移除它。

要製作功能短片，請參閱[產品示範影片](/zh-tw/use-cases/product-demos/)。要為團隊製作含註解的擷取，請參閱[為設計審查擷取網頁](/zh-tw/use-cases/design-review/)。其他錄影工具請參閱 [Awesome Screenshot 替代方案](/zh-tw/alternatives/awesome-screenshot/)和 [Screenity 替代方案](/zh-tw/alternatives/screenity/)。
