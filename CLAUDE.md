# CLAUDE.md

京阪神 8 天自由行的靜態網站，透過 GitHub Pages 發佈（repo：git@github.com:chre55551/JP8Day.git，線上：https://chre55551.github.io/JP8Day/）。

## 同步規則（必守）

使用者會在 Mac 筆電和 Windows 桌機兩邊開發。

- **開始任何修改前**，先執行 `git pull --rebase`。
- **完成修改後**，commit 並 `git push`，不用另外詢問。commit message 用繁體中文簡述改了什麼。
- pull 遇到衝突時，先停下來跟使用者說明衝突內容，不要自行丟棄任何一方的修改。

## 結構

- `js/data.js`：行程資料。`DAYS` 每日行程的欄位：`k` 類型（sight/food/shop/move/rest）、`m` 必去、`w` 需確認、`x` 待安排、`tr` 交通標籤；`TODOS` 待辦清單。
- `js/icons.js`：SVG 圖示；`js/main.js`：渲染邏輯；`css/style.css`：樣式。
- 載入順序：icons.js → data.js → main.js（一般 `<script>`，沒有模組或 build）。
- 資料刻意用 JS 而不是 JSON，這樣直接開 `file://` 也能預覽。
- `docs/kansai-8days.md` 是行程原稿；改行程時兩邊內容要保持一致。

## 慣例

- 介面文字一律用繁體中文。
- 換行統一 LF（見 `.gitattributes`），編碼 UTF-8。
- 改完要在瀏覽器確認畫面正常，再 push。
