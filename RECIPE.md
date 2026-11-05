# Husky

把 Herdr 變成淺色雪原：肉丸與樂晴代表 agent，四枚徽章代表 Spaces，
終端以寬幅雪原為背景，兩隻狗在右側，底色不透明度 0.6。

## What you see

左側 190px，可收合。頂部 46px 雙犬徽章與 Herdr 字樣，中間上方 Spaces、下方角色卡，底部 69px 設定列。
右側 48px 頭像分頁列、終端／檔案等面板、28px 狀態列。
主底 `#D3DDE6`、卡片 `#BAC8D4`、邊框 `#526B80`，冰藍焦點、琥珀等待提示。
每張角色卡使用 72×96 圖片；兩隻狗的白胸口靠淡藍灰卡片與背景分開，卡片不可改純白。

## How it behaves

`working` 每 3 秒同步切換拉雪橇、挖雪中、追蹤中的文字與姿態，冰藍狀態燈呼吸；`blocked` 歪頭配燈籠，琥珀文字與外框；
`done` 吐舌笑，綠色狀態；`idle` 閉眼休息。未知狀態回到休息姿態。
agent 與狗的配對以位址存在 localStorage，重畫或排序不換狗；新 agent 分給較少的那隻。
Tab 從 10 張頭像隨機配圖，以 Tab ID 保存。

## Built from

`layouts/husky.json` 的 root row 包含 sidebar column 與 work column，
sidebar 使用 `husky-chrome`、`husky-spaces`、`husky-agents`；work 使用 `husky-tabs`、
Herdr 內建 pane／workspace-status，外部的 file-icons（Files 面板），以及 husky-changes／husky-inbox／husky-git-graph。
側欄與面板共用 `husky-chrome/sidebar-v4.png`。美術由 `scripts/build-art.mjs` 從 `artwork/` 產生。

## Watch out

此版本以本機 Herdr 0.1.12 為準，需要已安裝的 inbox 與 git-graph。
肉丸素材不可水平翻轉，否則雙色眼會左右對調。
模組不能匯入自己資料夾以外的 JavaScript；不要跨模組共用 lib。
所有安裝路徑獨立，撞名時停止，既有 layout 保留可切回。

## Done when

1. `node --test` 與 `node scripts/lint.mjs` 通過。
2. 八個 `herdr-app check` 通過。
3. 切換後 `herdr-app status` 沒有新模組錯誤，截圖可見兩隻狗、徽章與淺色面板。
4. 終端文字疊在雪原與狗身上仍清楚可讀。
