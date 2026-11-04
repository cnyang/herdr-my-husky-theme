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

```sh
node scripts/install.mjs
herdr-app do layout.switch '{"name":"husky"}'
```

安裝只新增八個 `husky-*` 模組、layout 與 theme，撞名就停止；更新用 `node scripts/install.mjs --update`。
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
- 工作姿態由時間決定，不代表 agent 實際在做什麼；沒有獨立 Thinking 狀態或逐格動畫。
- 上游程式碼來源、授權及素材範圍見 `NOTICE.md`。
