---
title: 'FullPage Capture 替代方案：開放原始碼，安裝時不要求所有網站的存取權'
description: FullPage Capture 與 OpenScreenShot 比較。兩者都能免費擷取整頁並加註解。OpenScreenShot 開放原始碼，安裝時不需要所有網站的存取權。
order: 2
---

如果你想要程式碼可供檢視、安裝時不要求存取所有網站的整頁截圖擴充功能，請改用 OpenScreenShot。如果你需要 FullPage Capture 的 PDF 匯出功能，請繼續使用它：它的商店頁面描述 PDF 有可點的連結和智慧分頁，Pro 方案還加入可搜尋的 PDF。OpenScreenShot 以圖片形式儲存 PDF，所以其中的文字無法搜尋或選取，連結也無法使用。OpenScreenShot 只擷取瀏覽器中的網頁；它不擷取桌面視窗或整個螢幕。

OpenScreenShot 是我們的產品。本頁關於 FullPage Capture 的資訊截至 2026 年 10 月 9 日，來源包括它的 [Chrome 線上應用程式商店頁面](https://chromewebstore.google.com/detail/ggacghlcchiiejclfdajbpkbjfgjhfol)、[網站](https://fullpagecapture.net/)，以及從 Google 更新伺服器取得的 1.19.67 版資訊清單。

## FullPage Capture 與 OpenScreenShot 對照

|                    | FullPage Capture                                                             | OpenScreenShot                                                           |
| ------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 價格               | 免費；Pro 在 7 天試用後每年 $19                                              | 免費，沒有付費方案                                                       |
| 開放原始碼         | 否                                                                           | 是，MIT                                                                  |
| 安裝時的網站存取權 | 所有網站（必要的 `<all_urls>`）                                              | 無。開始擷取時才存取目前分頁                                             |
| 整頁擷取           | 是，免費且無浮水印                                                           | 是，免費且無浮水印                                                       |
| 註解和模糊         | 免費（箭頭、形狀、文字、螢光筆、畫筆、編號徽章、模糊和像素化）               | 免費（形狀、箭頭、文字、螢光筆、畫筆、步驟編號、模糊、馬賽克、實色填色） |
| PDF 匯出           | 是，含可點的連結和智慧分頁；可搜尋的 PDF 屬於 Pro                            | 是，以圖片形式：單頁，或有重疊的 A4 或 Letter 頁面                       |
| 分頁錄影           | 否                                                                           | 是，在 Chrome 中（Firefox 版只擷取截圖）                                 |
| 帳號或雲端         | 商店頁面說不需要帳號；Pro 使用帳號和「Send to your cloud」（傳送到你的雲端） | 無需帳號，不上傳                                                         |

[完整比較](/zh-tw/compare/)把 GoFullPage 也列在同一張表中。

## 安裝時的存取權

FullPage Capture 的資訊清單要求 `<all_urls>` 主機權限。安裝具有這項權限的擴充功能時，Chrome 會顯示警告「Read and change all your data on all websites」（讀取及變更你在所有網站上的資料）。商店頁面寫著「No account, no analytics, no network requests. Files stay on your device」（無需帳號、無分析、無網路請求，檔案留在你的裝置上），網站則寫著「The extension makes zero network requests」（擴充功能不發出任何網路請求）。我們沒有測試它的網路行為，本頁對此不做任何聲明。

OpenScreenShot 不要求任何主機權限。它使用 `activeTab`，只在你點圖示、按快速鍵或從右鍵選單選擇擷取的當下，存取一個分頁。Chrome 只在你第一次點**錄影**時，才詢問選用的分頁擷取權限。只有在你開啟**跨網站錄影**時，才會要求所有網站的存取權。[隱私權部分](/zh-tw/docs/#privacy)說明擷取如何留在你的裝置上。

## 你保留的功能

工作流程很接近。在預設的**一鍵 Express 模式**下，點一下工具列圖示就會開始**整個網頁**擷取，結果會在**編輯器**中開啟。箭頭、形狀、文字、編號徽章和模糊全都免費。儲存、複製和 PDF 匯出也都免費，而且任何匯出都沒有浮水印。

## 會改變的地方

遮蔽時，請選擇**模糊**（`B`），然後在**遮蔽**下選擇**實色**填色。實色會在匯出檔中完全蓋住該區域。[遮蔽指南](/zh-tw/blog/redact-screenshot/)說明如何檢查儲存的檔案。

PDF 的運作方式不同。點**儲存圖片**開啟**匯出**對話框，選擇 **PDF**，然後選擇**原尺寸**產生一頁與圖片同尺寸的頁面，或選擇 **A4** 或 **Letter** 搭配**分成多頁**。頁面之間重疊 5 mm，所以文字不會在一行中間被切斷。[截圖轉 PDF 指南](/zh-tw/blog/save-screenshot-as-pdf/)比較各種版面。

OpenScreenShot 沒有批次擷取，也沒有雲端上傳。它加入了用於擷取單一卡片或表格的**擷取元素**、可加上邊距、圓角、陰影和背景的「**Beautify（美化）**」面板，以及 Chrome 中錄製成 MP4 或 WebM 的分頁錄影。它也能在 Firefox 中擷取截圖。

## 如何轉換

1. 從 [Chrome 線上應用程式商店](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)或 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) 安裝 OpenScreenShot。
2. 把圖示固定到工具列；如果 FullPage Capture 也在同一個位置，請取消固定它。
3. 開啟長網頁並點圖示。在**編輯器**中檢查結果。
4. 在**設定**中設定**擷取後**：選擇**編輯器**來加註解，選擇**剪貼簿**來立即貼上圖片，或選擇**下載**來儲存 PNG 而不開啟分頁。
5. 在**設定**中設定**檔名範本**，例如 `{date}_{domain}`，讓儲存的檔案依日期和網站排序。
6. 不再使用 FullPage Capture 時，從 `chrome://extensions` 移除它。

要在問題追蹤系統中使用含註解的擷取，請參閱[用於錯誤回報的截圖](/zh-tw/use-cases/bug-reports/)。[擷取模式參考](/zh-tw/docs/#modes)說明所有模式。其他整頁工具請參閱 [GoFullPage 替代方案](/zh-tw/alternatives/gofullpage/)和 [FireShot 替代方案](/zh-tw/alternatives/fireshot/)。
