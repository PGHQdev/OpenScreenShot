---
title: 'Lightshot 替代方案：整頁擷取，不公開上傳'
description: Lightshot 與 OpenScreenShot 比較。在瀏覽器中整頁擷取、模糊和匯出 PDF，檔案留在你的裝置上，沒有 prnt.sc 連結。
order: 6
---

如果你在 Chrome 或 Firefox 中擷取網頁截圖，並想要整頁擷取、模糊和 PDF 匯出，而且檔案留在你的裝置上，請改用 OpenScreenShot。如果你要擷取其他應用程式或整個桌面，請繼續使用 Lightshot：Lightshot 有 Windows 和 Mac 桌面應用程式，而 OpenScreenShot 只擷取瀏覽器中的網頁。如果你依賴它的即時短連結，也請繼續使用它。OpenScreenShot 沒有上傳服務，所以你要以貼上或附加檔案的方式分享擷取。

OpenScreenShot 是我們的產品。本頁關於 Lightshot 的資訊截至 2026 年 10 月 9 日，來源包括它的 [Chrome 線上應用程式商店頁面](https://chromewebstore.google.com/detail/mbniclmhobmnbdlbpiphghaielnnpgdp)、[網站](https://app.prntscr.com/en/index.html)、[Firefox 附加元件頁面](https://addons.mozilla.org/firefox/addon/lightshot/)，以及從 Google 更新伺服器取得的 7.0.1 版資訊清單。

## Lightshot 與 OpenScreenShot 對照

|                    | Lightshot                                       | OpenScreenShot                           |
| ------------------ | ----------------------------------------------- | ---------------------------------------- |
| 價格               | 免費                                            | 免費                                     |
| 開放原始碼         | 否（自訂授權）                                  | 是，MIT                                  |
| 安裝時的網站存取權 | 所有網站（必要的 `*://*/*`）                    | 無。開始擷取時才存取目前分頁             |
| 整頁擷取           | 否；商店頁面描述的是區域選取                    | 是                                       |
| 註解和模糊         | 就地編輯                                        | 形狀、箭頭、文字、步驟編號、模糊、裁切   |
| PDF 匯出           | 否                                              | 是                                       |
| 分頁錄影           | 否                                              | 是，在 Chrome 中（Firefox 版只擷取截圖） |
| 帳號或雲端         | 可選擇上傳到 prnt.sc 取得短連結；也提供存到磁碟 | 無需帳號，不上傳                         |
| 桌面擷取           | 是，使用 Windows 和 Mac 應用程式                | 否                                       |

Lightshot Chrome 擴充功能最後更新於 2024 年 7 月 23 日。

## 上傳和分享連結

Lightshot 可以把截圖上傳到 prnt.sc 並給你一個短連結。檢視上傳內容不需要帳號。2021 年，[Kaspersky 報導](https://www.kaspersky.com/blog/cryptoscam-in-lightshot/39224/)這些網址是連續的，所以改一個字元就可能開啟另一張圖片，並指出「Anyone can see published screenshots without authentication.」（任何人都能在未經驗證的情況下看到已發布的截圖）。[AIN.UA 也報導了](https://en.ain.ua/2021/09/08/lightshot-allows-people-to-view-screenshots-of-other-users)同一年的這個問題。我們沒有檢查這在 2026 年是否仍然適用。

OpenScreenShot 沒有上傳步驟。它在你的瀏覽器中處理和存放擷取，匯出的檔案會存到你的下載資料夾。在你把擷取貼上或附加到某處之前，沒有人看得到它。[隱私權部分](/zh-tw/docs/#privacy)有詳細說明。

## 你保留的功能

快速的區域擷取依然保留。按 `Ctrl+Shift+E`（macOS 上是 `⌘⇧E`），或在網頁上按右鍵並選擇**選取區域**，然後拖曳出矩形並按 `Enter`。編輯器會開啟，提供箭頭、文字、形狀和螢光筆。**複製**會把圖片放到剪貼簿，可直接貼到聊天中。

要略過編輯器，請把**擷取後**設為**剪貼簿**。之後每次擷取都會直接送到剪貼簿，接近「擷取後直接貼上」的習慣。

## 會改變的地方

你可以擷取網頁的更多部分。**整個網頁**會捲動並把整個網頁拼接成一張圖片。**擷取元素**會依精確的範圍擷取單一卡片、表格或圖表。**可見範圍**會擷取分頁中畫面上的內容。

編輯器加入了**模糊**（`B`），提供柔和模糊、馬賽克或**實色**填色，實色能完全蓋住私人資料。**步驟編號**徽章會自動遞增。點**儲存圖片**開啟**匯出**對話框，即可儲存 PNG、JPEG、WebP 或 PDF。

安裝時的存取權較小。OpenScreenShot 使用 `activeTab`，一次只存取一個分頁，而且無法擷取瀏覽器設定頁面、擴充功能頁面或瀏覽器以外的任何內容。要擷取桌面應用程式或其他程式視窗，你仍然需要桌面工具。

## 如何轉換

1. 從 [Chrome 線上應用程式商店](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)或 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) 安裝 OpenScreenShot。
2. 把圖示固定到工具列。
3. 試試第一次擷取。在預設的**一鍵 Express 模式**下，點圖示會開始**整個網頁**擷取。要擷取區域，請使用 `Ctrl+Shift+E` 或右鍵選單。
4. 在**設定**中設定**擷取後**：選擇**剪貼簿**來立即貼上，選擇**編輯器**來加註解，或選擇**下載**來儲存 PNG。
5. 如果你保留桌面截圖應用程式來擷取其他程式，請確認它沒有使用與 OpenScreenShot 相同的按鍵。在 Chrome 中，你可以在 `chrome://extensions/shortcuts` 變更擴充功能的按鍵。

要在支援回覆中使用快速截圖，請參閱[用於客戶支援的截圖](/zh-tw/use-cases/customer-support/)。要用在貼文中，請參閱[用於社群媒體的截圖](/zh-tw/use-cases/social-media/)。如果你需要桌面擷取，請參閱 [Snagit 替代方案](/zh-tw/alternatives/snagit/)頁面，了解桌面工具涵蓋的範圍。
