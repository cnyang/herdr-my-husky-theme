# Husky · 雪原雪橇隊

Herdr 原生桌面主題，主角是兩隻哈士奇：肉丸（黑灰白、雙色眼）與樂晴（紅棕白、長毛）。
配色為中淺色陰天雪原：霧灰藍底、藍灰卡片、深藍焦點、深琥珀等待提示。

## 畫面與狀態

- 190px 側欄、60px Space 列搭配 48px 徽章（肉球、雪橇、月山、雪花），以及四態角色卡；收合時改用頭像。
- 每個 agent 固定配一隻狗，以位址存在 localStorage；新 agent 分給目前較少的那隻。
- 休息閉眼、等待歪頭配琥珀燈籠、完成吐舌；工作中每 3 秒輪替「拉雪橇」「挖雪中」「追蹤中」，文字與姿態同步，多個 agent 之間互相錯開。
- 分頁從 10 張雙犬頭像隨機配圖，按 Tab ID 保存，10 張用完才重複。
- Files／Changes／Watch／Git 面板空狀態使用 72px 全彩圖示：卷軸箱、掌印、郵包雪橇、路標。
- 終端背景為寬幅雪原，兩隻狗在右側，以 `cover` 滿版顯示；終端底色不透明度為 0.6。

| 用途 | 色碼 |
| --- | --- |
| 背景 | `#D3DDE6` |
| 卡片 | `#BAC8D4` |
| 邊框 | `#526B80` |
| 文字／次要文字 | `#121C26` / `#354350` |
| 工作／焦點 | `#0E4A70` |
| 完成 | `#0B4F35` |
| 等待操作 | `#5F3700` |

## 驗證

需要 Node.js 與 Herdr；沒有第三方 npm 套件。重建圖片另需 ImageMagick。

```sh
node --test
node scripts/lint.mjs
for m in mods/husky-*; do herdr-app check "$PWD/$m"; done
```

`herdr-app check` 不涵蓋所有互動與版面配置，需搭配實機畫面。

## 安裝與切換

這版配合本機 Herdr 0.1.12，依賴已安裝的 `inbox`、`git-graph`，
以及 Herdr 內建的 pane、files、changes、workspace-status、menu、new-menu、picker、machine-add、workspace-chrome。
Files 面板使用隨附的 `mods/file-icons`（來自 herdr-mods，Material Icon Theme 圖示）：機器上已有就保留，`--update` 才覆蓋。

```sh
node scripts/install.mjs
herdr-app do layout.switch '{"name":"husky"}'
```

安裝只新增十一個 `husky-*` 模組、layout 與 theme，撞名就停止；更新用 `node scripts/install.mjs --update`。
其他 layout 可從 Settings 或 `ctrl-shift-l` 選擇。

程式寫死給深色背景的顏色（Claude Code 深色主題、starship 的 Dracula 色）在淺底上會太淡。
在 `~/.config/herdr-app/settings.json` 設 `"minimum_contrast": 4.5`，低於門檻的字會換成近黑色；這是全域設定，影響所有 layout。

## 重建圖片

原圖在 `artwork/`，`node scripts/build-art.mjs` 輸出到 `mods/`。

- 雪地會跨過等分線，切格取 alpha 最低的欄，不用固定三等分。
- 肉丸的藍眼在牠自己的右側；素材不可水平翻轉。
- 頭像座標為人工框選，換原圖要重框。
- 側欄與面板的節點背景圖換內容後實機未更新，改檔名版本（如 `sidebar-v4.png`）才生效；終端 pane 背景圖沒有這問題。

## 資料讀取與限制

- Spaces 沿用 Traveler 的 `git status`、`git rev-parse` 和 `hc machine ls` 查詢。
- Space 徽章按顯示順序循環：肉球 → 雪橇 → 月山 → 雪花。主機標題與工作樹子列不計入。
- Watch 面板監看 `~/Downloads/` 第一層已下載完的檔案（內部 id 仍是 `inbox`）。
- 側欄底部的 Apple Music 區塊（`husky-music`，僅 macOS）：沒歌時高度 0，有歌時長出曲名、時間、進度條與上一首／倒退 10 秒／播放暫停／快轉 10 秒／下一首。
  一個長駐 `osascript` daemon（herdr-core 終端 `hpm-<雜湊>`）每秒讀 Music 並寫 `data/husky-music/state.json`，按鈕寫 `cmd.json`。
  第一次會跳出「允許控制 Music」的系統授權；若拒絕，區塊改顯示提示列，到系統設定 > 隱私權與安全性 > 自動化開啟。側欄收成窄條時區塊自動縮為 0。
- 右側分頁列的 Lyrics 按鈕（音符圖示）打開歌詞面板（`husky-lyrics`）：顯示目前這首歌的歌詞，向自架的 lrclib 查詢。
  先 `/api/get` 精確比對、404 再 `/api/search`（做法取自 MusicTUI）；有時間軸的歌詞高亮目前這句並置中，純文字歌詞可自己捲動。
  端點讀 `~/.config/music/lyrics.json` 的 `{"endpoint": "http://host:3300"}`（與 MusicTUI 共用）；沒設定就顯示提示，不會退回公開的 lrclib.net。
  曲目與位置取自音樂 daemon 的 `state.json`；面板關著時完全不讀檔、不連網。每首歌每次執行只查一次，連不上的 15 秒後重試。
  用 `curl` 連線（Herdr 的 `fetch` 沒有逾時設定），句子過長會截斷，不換行。
- 右側分頁列的 Note 按鈕（紙張圖示）打開筆記面板（`husky-notes`）：一份 markdown 筆記，存在本機 `~/.config/herdr-app/data/theme-notes/note.md`，重開 app 或重開機都還在。
  標題列的 Edit／Preview 切換：Edit 是多行輸入框，Preview 用內建 markdown 渲染；有內容時開啟先看 Preview，空的直接進 Edit。
  輸入後每秒檢查一次，內容與磁碟不同才原子寫入；輸入框失焦、切到 Preview 也立刻寫。讀檔失敗（例如超過 1 MiB）時不會存檔，避免空白內容蓋掉原筆記。
  Husky 與 Malfoid 共用同一個檔案，切換 theme 筆記不會消失。檔案被別的程式改過時，下一輪以面板內容覆蓋（後寫者勝）。
- 工作姿態由時間決定，不代表 agent 實際在做什麼；沒有獨立 Thinking 狀態或逐格動畫。
- 上游程式碼來源、授權及素材範圍見 `NOTICE.md`。
