// 純資料處理：未知狀態回到休息姿態，圖片路徑只使用固定白名單。
export const STATES = ["idle", "working", "blocked", "done"];
export const DOGS = ["meatball", "sunny"];

export function stateFor(status) {
  return STATES.includes(status) ? status : "idle";
}

const STATUS = { blocked: "等待指示", done: "已完成", idle: "休息中" };

// 工作中輪替三種動作。文字與圖由同一個時間算出，兩者才不會錯開。
export const ACTION_MS = 3000;
export const TICK_MS = 1000;
const WORKING_ACTIONS = [
  { text: "拉雪橇", sprite: "working-hauling" },
  { text: "挖雪中", sprite: "working-digging" },
  { text: "追蹤中", sprite: "working-tracking" },
];

function actionAt(ms) {
  return WORKING_ACTIONS[Math.floor(ms / ACTION_MS) % WORKING_ACTIONS.length];
}

// 第 i 張卡的時間偏移：動作差一格、切換時機差一個 tick，前 9 張的相位都不同。
export function phaseOffset(index) {
  return index * (ACTION_MS + TICK_MS);
}

export function statusText(status, ms = 0) {
  const state = stateFor(status);
  return state === "working" ? actionAt(ms).text : STATUS[state];
}

const dogFor = dog => DOGS.includes(dog) ? dog : DOGS[0];

export function spritePath(dog, status, ms = 0) {
  const state = stateFor(status);
  const sprite = state === "working" ? actionAt(ms).sprite : state;
  return `mods/husky-agents/states/${dogFor(dog)}/${sprite}.png`;
}

export function portraitPath(dog) {
  return `mods/husky-agents/art/${dogFor(dog)}.png`;
}

// 以 agent 位址保存配對：舊配對優先保留，新 agent 分給目前較少的那隻，兩隻才都會上場。
export function assignDogs(addresses, saved) {
  const known = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  const assigned = new Map();
  for (const id of addresses) {
    if (Object.hasOwn(known, id) && DOGS.includes(known[id])) assigned.set(id, known[id]);
  }
  const count = dog => [...assigned.values()].filter(d => d === dog).length;
  for (const id of addresses) {
    if (!assigned.has(id)) assigned.set(id, count("sunny") < count("meatball") ? "sunny" : "meatball");
  }
  return Object.fromEntries(assigned);
}

// Husky 版面固定此寬度，需與 layouts/husky.json、husky-chrome 一致；
// 不讀共用的 sidebar.width，避免其他 layout 存的寬度影響側欄。
export const SIDEBAR_WIDTH = 190;

export function nextSidebarWidth(px, platform) {
  if (px < 160) return SIDEBAR_WIDTH;
  return platform === "macos" ? 76 : 44;
}

// 程式圖示：單色字形用 svg 上色，彩色圖用 image，沒有圖示就不畫。
export function iconKind(program) {
  if (!program?.icon) return null;
  return program.tint ? "svg" : "image";
}

// blocked 最優先：focused 的 accent 不可蓋掉金框，收合與展開一致。
export function frameColor(state, focused, t, collapsed) {
  if (state === "blocked") return t.blocked;
  if (focused) return t.accent;
  return collapsed ? t[state] : t.border;
}
