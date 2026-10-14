# 京阪神 8 天自由行

2026/12/29–2027/1/5 大阪・京都・神戶行程網站。

線上版：https://chre55551.github.io/JP8Day/ （push 到 `main` 後 GitHub Pages 會自動更新，約 1 分鐘）

## 專案結構

```
index.html        頁面骨架（首頁、航班、每日行程、待辦、住宿）
css/style.css     樣式
js/data.js        行程資料（DAYS 每日行程、TODOS 待辦）← 改行程改這裡
js/icons.js       SVG 小圖示
js/main.js        畫面邏輯（倒數、分頁、待辦勾選）
images/           圖片
docs/             行程原稿（kansai-8days.md）
```

純靜態網站，不需要安裝套件或 build。直接用瀏覽器開 `index.html` 就能預覽。

## 開發流程（Mac 筆電、Windows 桌機共用）

每次開工前**先 pull**，收工**一定 push**，另一台電腦才拿得到最新版本：

```bash
# 開工
git pull --rebase

# 修改、用瀏覽器預覽……

# 收工
git add -A
git commit -m "說明這次改了什麼"
git push
```

pull 時如果出現衝突：打開有衝突的檔案，留下要的內容並刪掉 `<<<<<<<`、`=======`、`>>>>>>>` 標記，然後執行 `git add <檔案>` 和 `git rebase --continue`。

## 新電腦初次設定（Windows）

1. 安裝 [Git for Windows](https://git-scm.com/download/win) 和 VS Code
2. 在 Git Bash 產生 SSH key：`ssh-keygen -t ed25519`，把 `~/.ssh/id_ed25519.pub` 的內容加到 GitHub → Settings → SSH and GPG keys
3. 設定 Git：
   ```bash
   git config --global user.name "Chris"
   git config --global user.email "<你的 email>"
   git config --global core.autocrlf false
   ```
4. Clone：`git clone git@github.com:chre55551/JP8Day.git`

換行字元由 `.gitattributes` 統一成 LF，所以 `core.autocrlf` 設成 `false`，交給 `.gitattributes` 處理。
