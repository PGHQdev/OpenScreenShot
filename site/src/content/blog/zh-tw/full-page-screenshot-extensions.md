---
title: 整頁截圖擴充功能比較（2026）
description: 從價格、原始碼、權限、註解、PDF 和錄影比較 OpenScreenShot、GoFullPage 等 6 款擴充功能，並介紹瀏覽器內建工具。
audience: everyday
order: 7
---

如果你只是偶爾需要整頁截圖，Chrome DevTools、Microsoft Edge 和 Firefox 內建的工具不用安裝任何東西就能擷取整個頁面。如果你經常擷取頁面，下面這些擴充功能的差別在於：哪些功能免費、安裝時要求哪些網站存取權、能不能錄影，以及原始碼是否公開。每一節都會說明該工具適合誰。

OpenScreenShot 是我們的產品，我們也列出了其他工具更適合的情況。所有資訊截至 2026 年 10 月 9 日，來自商店頁面、擴充功能的 manifest 和廠商網頁，並在各節附上連結。本頁比較的是功能，不替這些工具排名。

## 工具一覽

| 工具                  | 價格                                    | 開放原始碼                  | 安裝時要求所有網站存取權 | 註解免費？                         | PDF                         | 錄影                |
| --------------------- | --------------------------------------- | --------------------------- | ------------------------ | ---------------------------------- | --------------------------- | ------------------- |
| OpenScreenShot        | 免費                                    | 是，MIT                     | 否                       | 是                                 | 是                          | 僅限分頁，Chrome 版 |
| GoFullPage            | 免費；Premium 每年 $12                  | 否                          | 否                       | 否，需 Premium                     | 是；智慧分頁需 Premium      | 否                  |
| FullPage Capture      | 免費；Pro 每年 $19                      | 否                          | 是                       | 是                                 | 是；可搜尋 PDF 需 Pro       | 否                  |
| Awesome Screenshot    | 免費方案；付費方案每月 $5 起            | 無公開原始碼                | 是                       | 基本工具；完整工具需付費方案       | 是                          | 桌面、分頁、攝影機  |
| FireShot              | 免費；Pro 每年 $39.95 或一次付清 $99.95 | 否                          | 否                       | 依商店頁面為文字、箭頭、模糊       | 是，含連結；進階 PDF 需 Pro | 否                  |
| FuseBase Pro (Nimbus) | 免費方案；Pro 價格未公布                | 否                          | 是                       | 註解與模糊；免費與付費的劃分未公布 | 是                          | 螢幕與網路攝影機    |
| Chrome DevTools       | 免費，內建                              | DevTools 前端，BSD-3-Clause | 無需安裝                 | 文件未提到編輯器                   | 文件未提及                  | 文件未提及          |
| Edge Screenshot       | 免費，內建                              | 否                          | 無需安裝                 | 筆和觸控標記                       | 文件未提及                  | 文件未提及          |
| Firefox Screenshots   | 免費，內建                              | Firefox 的一部分            | 無需安裝                 | 文件未提及                         | 文件未提及                  | 文件未提及          |

「安裝時要求所有網站存取權」表示擴充功能在你加入時，就要求存取每個網站的主機權限。Chrome 會把這項要求顯示為「Read and change all your data on all websites」（讀取及變更你在所有網站上的所有資料）。

## OpenScreenShot

[OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) 免費、沒有付費方案，並以 MIT 授權在 [GitHub 上公開原始碼](https://github.com/pghqdev/OpenScreenShot)。它在 Chrome 線上應用程式商店和 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) 都有上架。在工具列圖示上點一下即可開始整頁擷取；可見範圍、選取區域和元素模式在右鍵選單和鍵盤快速鍵中。請見[擷取模式](/zh-tw/docs/#modes)。

編輯器包含形狀、箭頭、文字、步驟編號、可用不透明填滿的模糊、聚光、裁切和剪除。匯出格式為 PNG、JPEG、WebP，或 PDF（單頁、符合 A4 或 Letter，或分成多頁）。它在安裝時不要求任何主機存取權。Chrome 版可以把[分頁錄影](/zh-tw/docs/#record)存成 MP4 或 WebM；第一次錄影時，Chrome 會要求分頁擷取權限。Firefox 版只能截圖。

比較不適合的情況：

- 它擷取的是瀏覽器分頁中的網頁。它無法擷取你的桌面或其他應用程式，也只能錄製分頁。
- 它沒有雲端儲存或分享連結。匯出的檔案要由你自己分享。
- 它的 PDF 以圖片形式保存截圖，所以文字無法搜尋。
- 無法擷取 `chrome://` 設定和瀏覽器商店等瀏覽器頁面。

## GoFullPage

[GoFullPage](https://gofullpage.com/) 一鍵擷取頁面，可匯出 PNG、JPEG 或 PDF。它的[常見問題](https://gofullpage.com/faq)說，免費版的截圖數量以及圖片和 PDF 匯出都沒有限制。[Premium](https://gofullpage.com/premium) 在 7 天試用後每年 $12，加入裁切、註解（模糊、文字、醒目標示）、網址和時間戳記，以及智慧 PDF 分頁。

它的程式碼是封閉的。常見問題說，開發者在 2018 年把原本的 MIT 專案做成了私有分支。GoFullPage 在 2026 年 8 月因為它的[部落格](https://blog.gofullpage.com/2026/08/11/gofullpage-chrome-update/)所說的「與著作權相關的問題」（a copyright-related issue）被 Chrome 線上應用程式商店下架，主要的商店頁面在 2026 年 9 月 10 日恢復。官方的 [Firefox 版](https://addons.mozilla.org/en-US/firefox/addon/gofullpage-screenshot/)在 2026 年 9 月 7 日推出。它在安裝時不要求任何主機存取權。

GoFullPage 適合想要一鍵擷取和 PDF 匯出、不需要標記的人，或願意為標記功能付費的人。請見 [GoFullPage 替代方案](/zh-tw/alternatives/gofullpage/)。

## FullPage Capture

[FullPage Capture](https://fullpagecapture.net/) 表示擷取、儲存、複製和列印都免費，沒有浮水印，也沒有使用次數限制。它的 [Chrome 商店頁面](https://chromewebstore.google.com/detail/ggacghlcchiiejclfdajbpkbjfgjhfol)描述了一個免費編輯器，有箭頭、形狀、文字、螢光筆、編號標記和模糊，另外還有含可點擊連結的 PDF。Pro 在 7 天試用後每年 $19，加入可搜尋的 PDF、證據模式、批次擷取和雲端上傳。

它的程式碼是封閉的，而且我們只找到 Chrome 的商店頁面。它的 manifest 要求存取所有網站，所以 Chrome 會在安裝時顯示所有網站的警告。它適合需要可搜尋 PDF 或批次擷取、並接受這項權限的人。請見 [FullPage Capture 替代方案](/zh-tw/alternatives/fullpage-capture/)。

## Awesome Screenshot

Diigo 的 [Awesome Screenshot](https://chromewebstore.google.com/detail/nlipoenfbbikpbjkfpfillcgkoblgpmj) 結合了截圖和錄影工具，可以錄製桌面、分頁或攝影機。它的[價格頁面](https://www.awesomescreenshot.com/pricing)列出免費方案，提供最多 100 張截圖、基本註解和 720p 錄影。Basic 方案以年繳計每月 $5，Professional 方案以年繳計每月 $6，可錄製最高 4K。它提供含分享連結的雲端儲存，也能儲存在本機。

它在安裝時要求存取所有網站，而它在 Chrome 的隱私權欄位中揭露會收集「Website content」（網站內容）。它的 [Firefox 商店頁面](https://addons.mozilla.org/en-US/firefox/addon/screenshot-capture-annotate/)寫的是 Mozilla Public License 2.0，但我們找不到公開的原始碼儲存庫。它適合想在同一個工具中取得分享連結和螢幕錄影的團隊。請見 [Awesome Screenshot 替代方案](/zh-tw/alternatives/awesome-screenshot/)。

## FireShot

[FireShot](https://getfireshot.com/) 可以把整個頁面存成含連結的 PDF、PNG 或 JPEG。根據它的[購買頁面](https://getfireshot.com/buy.php)，FireShot Pro 每年 $39.95，或一次付清 $99.95，可用於兩台裝置。Pro 加入進階 PDF 匯出、Windows 上具智慧註解的編輯器、擷取紀錄和批次擷取。我們沒有確認免費 Chrome 版包含哪些編輯工具。

它的程式碼是封閉的。FireShot 在安裝時不要求主機存取權，但它要求原生訊息傳遞（native messaging）權限，Chrome 會為此另外顯示一則警告。它的 [Firefox 附加元件](https://addons.mozilla.org/en-US/firefox/addon/fireshot/)最後更新於 2023 年 6 月 5 日。FireShot 適合想要批次擷取或一次性授權的 Windows 使用者。請見 [FireShot 替代方案](/zh-tw/alternatives/fireshot/)。

## Nimbus 與 FuseBase Pro

原本的 Nimbus Screenshot Chrome 商店頁面現在顯示「This item is not available」（此項目無法使用），而 Nimbus 的擷取頁面會重新導向到 [FuseBase](https://thefusebase.com/screenshot/)。Nimbus Web 現在發布的是 [FuseBase Pro](https://chromewebstore.google.com/detail/fddbloohgcjopkmnjdeodjcfbgiimpcn)，提供截圖、螢幕與網路攝影機錄影、註解、模糊和 PDF 儲存。它會上傳到 FuseBase、Google Drive、Dropbox 和 Slack。

免費方案最多可錄 5 分鐘，Pro 最多 10 小時。[FuseBase 價格頁面](https://thefusebase.com/pricing/)列出的是平台方案，沒有寫出擴充功能的價格。FuseBase Pro 在安裝時要求存取所有網站。它適合已經在使用 FuseBase 的人。請見 [Nimbus 替代方案](/zh-tw/alternatives/nimbus/)。

## 不用安裝：瀏覽器內建的工具

### Chrome DevTools

開啟 DevTools，按 Ctrl+Shift+P（macOS 上為 Cmd+Shift+P），輸入「screenshot」，然後選擇「**Capture full size screenshot**」（擷取完整尺寸的螢幕截圖）。Chrome 會儲存一張 PNG。官方文件沒有描述編輯器；[指令選單文件](https://developer.chrome.com/docs/devtools/command-menu)列出了其他截圖指令。請見 [Chrome 指南](/zh-tw/full-page-screenshot/chrome/)。

### Microsoft Edge Screenshot

根據 Microsoft 的[原則頁面](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/webcaptureenabled)，Edge 把 Web Capture 改名為 Screenshot，按 Ctrl+Shift+S 即可開啟。它可以擷取整個頁面或某個區域，你也可以用筆或觸控加上標記。請見 [Edge 指南](/zh-tw/full-page-screenshot/edge/)。

### Firefox Screenshots

根據 [Mozilla 的指南](https://blog.mozilla.org/en/firefox/how-to-capture-screenshots-with-firefox/)，在頁面上按右鍵，選擇「**Take Screenshot**」（擷取畫面），再選「**Save full page**」（儲存完整頁面）。你可以複製或下載結果。上傳到 Mozilla 伺服器的功能已在 2019 年 5 月隨 Firefox 67 結束。請見 [Firefox 指南](/zh-tw/full-page-screenshot/firefox/)。

Safari、Brave、Opera、Vivaldi 和 Arc 請見[各瀏覽器指南](/zh-tw/full-page-screenshot/)。

## 該選哪一個

- **只要一頁、今天就要、不想安裝**：你瀏覽器的內建工具。
- **免費標記和 PDF、安裝時不要求所有網站存取權、原始碼可讀**：OpenScreenShot。
- **一鍵擷取、不需要標記**：GoFullPage 的免費版。
- **可搜尋的 PDF 或批次擷取**：FullPage Capture Pro 或 FireShot Pro。
- **團隊用的分享連結和桌面錄影**：Awesome Screenshot 或 FuseBase Pro。
- **桌面應用程式的截圖**：桌面工具；請見[適用各平台的開放原始碼截圖工具](/zh-tw/blog/open-source-screenshot-tools/)。
- **從腳本或 CI 擷取截圖**：請見[給開發者的網站截圖工具](/zh-tw/blog/website-screenshot-tools-for-developers/)。

這些工具處理無限捲動的動態和延遲載入的圖片時都可能遇到困難；[Chrome 整頁指南](/zh-tw/blog/full-page-screenshot-chrome/)說明如何檢查擷取結果。如需並排比較 OpenScreenShot、GoFullPage 和 FullPage Capture，請見[比較頁面](/zh-tw/compare/)。
