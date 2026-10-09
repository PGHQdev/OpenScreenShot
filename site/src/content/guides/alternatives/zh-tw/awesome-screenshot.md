---
title: 'Awesome Screenshot 替代方案：資料留在你裝置上的免費工具'
description: Awesome Screenshot 與 OpenScreenShot 比較。免費的註解、模糊、PDF 和分頁錄影都留在你的裝置上，只有一個免費方案，安裝時不要求所有網站的存取權。
order: 3
---

如果你在瀏覽器內擷取和錄影，並希望所有內容都留在你的裝置上，所有編輯器工具都免費且沒有方案限制，請改用 OpenScreenShot。如果你需要 Awesome Screenshot 的雲端功能，請繼續使用它：分享連結、雲端儲存空間，以及桌面和攝影機錄影（Professional 方案最高 4K）。OpenScreenShot 沒有分享連結，也沒有雲端。它只錄製一個瀏覽器分頁，只支援 Chrome，也不擷取桌面視窗或整個螢幕。

OpenScreenShot 是我們的產品。本頁關於 Awesome Screenshot 的資訊截至 2026 年 10 月 9 日，來源包括它的 [Chrome 線上應用程式商店頁面](https://chromewebstore.google.com/detail/nlipoenfbbikpbjkfpfillcgkoblgpmj)、[價格頁面](https://www.awesomescreenshot.com/pricing)、[Firefox 附加元件頁面](https://addons.mozilla.org/en-US/firefox/addon/screenshot-capture-annotate/)，以及從 Google 更新伺服器取得的 4.4.44 版資訊清單。

## Awesome Screenshot 與 OpenScreenShot 對照

|                    | Awesome Screenshot                                              | OpenScreenShot                                     |
| ------------------ | --------------------------------------------------------------- | -------------------------------------------------- |
| 價格               | 有免費方案；Basic 每月 $5 起，Professional 每月 $6 起，按年計費 | 免費，沒有付費方案                                 |
| 開放原始碼         | Firefox 頁面標示為 MPL 2.0；我們找不到公開的原始碼儲存庫        | 是，MIT，原始碼公開                                |
| 安裝時的網站存取權 | 所有網站（必要的 `<all_urls>`，每個網頁都執行內容指令碼）       | 無。開始擷取時才存取目前分頁                       |
| 整頁擷取           | 是                                                              | 是                                                 |
| 註解和模糊         | 是；免費方案提供基本工具，付費方案提供所有工具                  | 所有工具免費                                       |
| PDF 匯出           | 是                                                              | 是                                                 |
| 分頁錄影           | 是，另可錄製桌面和攝影機                                        | 是，僅限分頁，在 Chrome 中（Firefox 版只擷取截圖） |
| 帳號或雲端         | 雲端儲存空間和分享連結；也提供本機儲存                          | 無需帳號，不上傳                                   |

## 方案限制

Awesome Screenshot 免費方案列出最多 100 張截圖、基本註解，以及最多 20 段 720p 錄影。它的本機儲存允許無限張截圖，以及最長 5 分鐘的錄影。Basic 按年計費為每月 $5，按月計費為 $6。Professional 按年計費為每月 $6，按月計費為 $8，提供無限錄影，最高 4K。

OpenScreenShot 只有一個方案。每種擷取模式、編輯器工具和匯出格式都免費，也不需要建立帳號。

## 你保留的功能

你保留整頁、可見範圍和區域擷取，以及具備形狀、箭頭、文字、螢光標記和模糊的編輯器。你保留 PNG、JPEG 和 PDF 匯出。在 Chrome 中，你保留可搭配麥克風和視訊鏡頭的分頁錄影。

## 會改變的地方

你的擷取會留在你的裝置上。OpenScreenShot 把擷取存放在瀏覽器的本機儲存空間，把錄影存放在 IndexedDB，而且不會上傳。Chrome 線上應用程式商店上 Awesome Screenshot 的隱私權部分揭露會收集「Website content」（網站內容）。要分享 OpenScreenShot 的擷取，請點**複製**再貼上圖片，或點**儲存圖片**再附加檔案。[隱私權部分](/zh-tw/docs/#privacy)有詳細說明。

安裝時的存取權較小。OpenScreenShot 使用 `activeTab`，一次只存取一個分頁。你第一次點**錄影**時，Chrome 會詢問選用的分頁擷取權限；只有在你開啟**跨網站錄影**時，才會詢問所有網站的存取權。

錄影功能只作用於一個分頁。在彈出式視窗中點**錄影**，選擇**麥克風**、**分頁音訊**或**視訊鏡頭**，然後保留**整個分頁**，或拖曳只錄製網頁的一部分。停止後，錄影編輯器會在每次點選處加上 2 倍縮放。你可以修剪、放置視訊鏡頭泡泡，並匯出 MP4 或 WebM。請參閱[錄影參考](/zh-tw/docs/#record)。

遮蔽時，請使用**模糊**（`B`）搭配**實色**填色，它會在匯出檔中完全蓋住該區域。

## 如何轉換

1. 從 [Chrome 線上應用程式商店](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)或 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) 安裝 OpenScreenShot。
2. 把圖示固定到工具列。
3. 在長網頁上點圖示。在預設的**一鍵 Express 模式**下，這會開始**整個網頁**擷取並開啟**編輯器**。在網頁上按右鍵並開啟 **OpenScreenShot** 子選單，即可使用**可見範圍**、**選取區域**或**擷取元素**。
4. 在**設定**中設定**擷取後**：**編輯器**、**剪貼簿**或**下載**。
5. 停止使用 Awesome Screenshot 之前，先從它的雲端儲存空間下載你要保留的擷取和影片。要為舊圖片加註解，請把它拖放到 OpenScreenShot 編輯器上。

要製作功能的短片，請參閱[產品示範影片](/zh-tw/use-cases/product-demos/)。要在支援回覆中使用截圖，請參閱[用於客戶支援的截圖](/zh-tw/use-cases/customer-support/)。如果你在比較有雲端連結的錄影工具，請參閱 [Loom 替代方案](/zh-tw/alternatives/loom/)和 [Nimbus 替代方案](/zh-tw/alternatives/nimbus/)。
