---
title: 為 AI 代理設定本機截圖 MCP 伺服器
description: 把 OpenScreenShot 連接到 stdio MCP 用戶端，並以明確的網址、可視區域和整頁選項要求 PNG 截圖。
audience: developers
order: 5
---

OpenScreenShot 提供一個本機 MCP 伺服器，內含一個工具：`capture_screenshot`。MCP 用戶端可以用網頁網址呼叫它，並收到 PNG 圖片內容。伺服器會在你的機器上啟動一個獨立的無頭 Chrome 相容瀏覽器；不需要瀏覽器擴充功能。

## 把伺服器加入你的 MCP 用戶端

請先安裝 Node.js、pnpm 和 Chrome 相容瀏覽器。依你的用戶端設定格式加入一筆伺服器項目。接受 `mcpServers` 物件的用戶端可以使用：

```json
{
  "mcpServers": {
    "openscreenshot": {
      "command": "pnpm",
      "args": ["dlx", "openscreenshot", "serve"]
    }
  }
}
```

用戶端必須能在它的執行檔路徑中找到 `pnpm`。儲存設定後，請重新啟動或重新載入它的 MCP 連線。伺服器使用 stdio，所以由用戶端啟動本機程序；沒有需要輸入的託管 MCP 網址。

如果 Chrome 安裝在不尋常的位置，請透過用戶端的環境變數設定傳入 `CHROME_PATH`。請使用執行檔的完整路徑，而不是包含應用程式的資料夾。

## 呼叫 capture_screenshot

最簡單的工具輸入是：

```json
{ "url": "https://example.com" }
```

這會以預設的 1280 × 800 大小擷取可視區域。如果要讓要求可以重現，請明確設定可視區域和整頁選項：

```json
{
  "url": "https://example.com",
  "fullPage": true,
  "width": 1440,
  "height": 900
}
```

`width` 接受 200 到 3840 的整數，`height` 接受 200 到 2160 的整數。工具會回傳 MIME 類型為 `image/png` 的 MCP 圖片內容。這個工具沒有輸出路徑參數。結果要顯示還是儲存，取決於用戶端；如果你需要直接得到具名的檔案，請使用 [CLI](/zh-tw/blog/screenshot-cli/)。

## AI 代理看得到與看不到什麼

擷取會在全新的無頭瀏覽器中開始。它不會繼承你平常 Chrome 視窗中的 Cookie 或已登入的工作階段。因此，需要驗證的頁面可能會顯示登入畫面。目前的工具不提供登入步驟、Cookie 注入、選擇器等待或互動式點擊。

請先要求 AI 代理指出回傳圖片中實際看得到的內容，再下結論。截圖可以幫助檢查版面、間距和可見的錯誤；它無法證明表單能正確送出，或鍵盤導覽能正常運作。

## 截圖會送到哪裡？

截圖在本機產生，並回傳給 MCP 用戶端。如果該用戶端使用託管模型，它可能會依自己的設定，把回傳的圖片傳送給模型供應商。在本機擷取不代表整段 AI 代理對話都留在裝置上。

如需尺寸可預測的自動化擷取，請見 [CI 用的截圖](/zh-tw/blog/screenshots-for-ci/)。[代理擷取技能](/skills/capture-screenshot.md)和[伺服器原始碼](https://github.com/pghqdev/OpenScreenShot/blob/main/mcp/src/serve.ts)提供給機器閱讀的說明和工具定義。
