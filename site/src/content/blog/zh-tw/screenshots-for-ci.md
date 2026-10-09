---
title: 為 CI 與版本審閱擷取網站截圖
description: 用 OpenScreenShot CLI 建立可重現的 PNG 產出檔，並了解截圖在建置流程中能驗證什麼。
audience: developers
order: 6
---

在 CI 中使用 OpenScreenShot CLI，可以為執行中的應用程式儲存一張 PNG 供審閱。準備好 Chrome 相容瀏覽器，啟動應用程式，等它就緒，然後以固定的網址和可視區域擷取。再用 CI 服務的產出檔機制上傳產生的檔案。

## 讓環境可以重現

如果專案已經使用 pnpm，請把 CLI 加為開發相依套件，並提交因此變更的 manifest 和 lockfile：

```sh
pnpm add -D -E openscreenshot
```

在 CI 中用專案凍結的 lockfile 安裝相依套件。這個套件使用 `puppeteer-core`，不會下載瀏覽器，所以執行器上也需要 Chrome 或 Chromium。如果執行檔不在支援的預設位置，請設定 `CHROME_PATH`。

比較擷取結果時，請保持瀏覽器版本、字型、可視區域、應用程式資料和套件版本不變。即使應用程式程式碼沒有改變，字型或瀏覽器算繪引擎變了，圖片也可能不同。

## 在應用程式就緒後擷取

用專案本身的指令啟動開發或預覽伺服器。執行這個範例前，請等路由及其相依項目就緒；連接埠 4321 只是範例，必須符合你的應用程式：

```sh
mkdir -p artifacts
pnpm exec openscreenshot shot http://127.0.0.1:4321 --out artifacts/desktop.png --width 1440 --height 900
pnpm exec openscreenshot shot http://127.0.0.1:4321 --out artifacts/narrow.png --width 390 --height 844
```

這些指令會擷取可視區域。加上 `--full` 可審閱整個頁面。把 `artifacts/` 目錄交給 CI 的產出檔上傳步驟，審閱者就能在 pull request 或版本旁開啟這些檔案。

CLI 在導覽時會等待網路閒置，但這不保證應用程式特有的工作已經完成。它沒有可設定的選擇器等待，也沒有可注入的設定指令碼。當一般路由含有動畫、變動內容或驗證時，請使用專用、穩定、資料固定的審閱路由。

## 擷取到圖片不等於通過視覺測試

指令可能在擷取到伺服器錯誤或載入畫面後仍成功結束。請把 PNG 當作審閱用的產出檔。視覺回歸系統還需要基準圖、圖片比較方法、門檻值，以及接受預期變更的流程；OpenScreenShot 的 CLI 不提供這些部分。

窄版截圖是有用的響應式版面檢查，但它不是行動裝置模擬。同樣地，截圖也無法驗證互動、無障礙功能或 API 行為。請在擷取步驟之外，保留應用程式相關的檢查。

## 排解流程問題

**找不到 Chrome**：確認執行器映像檔內含瀏覽器，且 `CHROME_PATH` 指向它的執行檔。

**導覽失敗或逾時**：確認擷取程序能連到伺服器、伺服器使用預期的連接埠，且在擷取開始前已就緒。導覽的逾時時間為 30 秒。

**出現意料之外的登入頁面**：CLI 會啟動全新的瀏覽器工作階段。它不會重複使用你的本機設定檔，也不提供 Cookie 注入。

**輸出檔不見了**：建立輸出目錄，檢查指令的結束狀態，並確認產出檔路徑相對於 CI 工作目錄是否正確。

[CLI 參考指南](/zh-tw/blog/screenshot-cli/)涵蓋旗標和結束代碼。如果要由人或 AI 代理決定接下來檢查哪個頁面，請使用 [MCP 截圖流程](/zh-tw/blog/screenshot-mcp-server/)。
