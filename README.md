# 京阪神奈 8 日跨年之旅

2026/12/29–2027/1/5 大阪・京都・神戶行程網站。

線上版：https://chre55551.github.io/JP8Day/ （push 到 `main` 後由 `.github/workflows/deploy.yml` 自動部署，約 1 分鐘；進度在 repo 的 Actions 頁面）

## 專案結構

```
index.html        行程頁：首頁、航班、每日行程、路線圖、住宿
prep.html         待辦・備選頁：出發前待辦、建議備選
css/style.css     樣式
js/data.js        資料（DAYS 每日行程、TODOS 待辦、PLANS／SPOTS／FOODS／SHOPS 備選）← 改行程改這裡
js/icons.js       SVG 小圖示
js/main.js        畫面邏輯（兩頁共用）
fonts/            Huninn 字型（只留網站用到的字）與授權
sw.js             離線快取；manifest.webmanifest、icons/ 是加到主畫面用的
docs/             行程原稿（kansai-8days.md）和產生器腳本
```

純靜態網站，不需要 build。直接用瀏覽器開 `index.html` 就能預覽（離線快取只在 https 或 localhost 才會啟用）。

### 改了文字之後

字型只包含網站用到的字，**新增文字後要重新裁切字型**，不然新字會用系統字型顯示：

```bash
pip install fonttools brotli   # 第一次
python3 docs/make-font.py
```

其他產生器：`node docs/make-picks.js`（原稿的備選清單）、`python3 docs/make-maps.py <資料夾>`（路線圖 SVG）。

新增檔案時，記得也加進 `sw.js` 的 `FILES`，離線時才看得到。

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
