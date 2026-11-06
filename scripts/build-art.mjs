// 由 artwork/ 原圖產生 mods/ 內所有 PNG；需要 ImageMagick（magick）。
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const art = name => join(root, "artwork", name);
const out = path => { const file = join(root, "mods", path); mkdirSync(dirname(file), { recursive: true }); return file; };
const magick = (...args) => execFileSync("magick", args.flat(), { maxBuffer: 1 << 26 });

const CARD = "#BAC8D4"; // 與 theme surface 相同，透明像素的隱藏 RGB 也填這色，縮放時不滲色。
const CLEAN = ["-channel", "A", "-level", "8%,100%", "+channel", "-background", "none", "-alpha", "background", "-bordercolor", "none", "-border", "1", "-trim", "+repage"];
// 背景圖整體降亮度。側欄節點背景圖只換內容不會更新，改數值後要連 sidebar-vN 檔名一起換。
const DIM = ["-modulate", "82"];
// 側欄混入主題底色壓低對比與藍色調，讓亮度接近終端區（0.87）。
const THEME_BG = "#D3DDE6";
const FINISH = ["-background", CARD, "-alpha", "background", "-strip", "-define", "png:color-type=6"];

// 雪地會跨過等分線，所以取搜尋範圍內 alpha 總量最低的欄當切線。
export function lowestColumn(sums, from, to) {
  let best = from;
  for (let x = from; x < to; x++) if (sums[x] < sums[best]) best = x;
  return best;
}

function strip(file, dog, names) {
  const width = Number(magick(art(file), "-format", "%w", "info:").toString());
  const sums = magick(art(file), "-alpha", "extract", "-scale", `${width}x1!`, "-depth", "8", "gray:-");
  const cuts = [0, lowestColumn(sums, 500, 700), lowestColumn(sums, 1150, 1330), width];
  console.log(file, "cuts", cuts.slice(1, 3).join(" "));
  names.forEach((name, i) => magick(art(file), "-crop", `${cuts[i + 1] - cuts[i]}x836+${cuts[i]}+0`, "+repage", CLEAN,
    "-resize", "543x724", "-background", "none", "-gravity", "south", "-extent", "543x724", FINISH,
    out(`husky-agents/states/${dog}/${name}.png`)));
}

function grid(file, names) {
  names.forEach((name, i) => magick(art(file), "-crop", `627x627+${(i % 2) * 627}+${(i >> 1) * 627}`, "+repage", CLEAN,
    "-resize", "240x240", "-background", "none", "-gravity", "center", "-extent", "256x256", FINISH, out(name)));
}

function portrait(file, [x, y, size], ...targets) {
  for (const target of targets) magick(art(file), "-crop", `${size}x${size}+${x}+${y}`, "+repage",
    "-background", CARD, "-flatten", "-resize", "256x256", "-strip", out(target));
}

// 終端背景以 cover 置中裁切，窗格比原圖窄時兩側被切，靠右的狗會被裁到。
// 解法：在右側補 160px（1914 → 2074），讓狗往左移約 80px、不必置中。
// 補的區域：先鋪「右緣 24 欄平均色、垂直模糊」的底色（與原圖右緣色調連續、無條紋），
// 再疊上原圖左側霧面（無狗），用 160px 漸層慢慢過渡；最後把接縫帶局部模糊遮掉細節差。
// ponytail: 靠右的狗仍有下限，窗格長寬比低於約 1.1 時還是會被切；要更窄就再加大補寬。
function terminalBackground() {
  const src = art("terminal-background.png"), H = 822, X = 1914, EXTRA = 160, W = X + EXTRA, RAMP = 160;
  magick(src, "-background", "none", "-gravity", "northwest", "-extent", `${W}x${H}`,
    "(", src, "-crop", `24x${H}+${X - 24}+0`, "+repage", "-filter", "box", "-resize", `1x${H}!`, "-blur", "0x40",
      "-filter", "point", "-resize", `${EXTRA}x${H}!`, ")", "-geometry", `+${X}+0`, "-composite",
    "(", src, "-crop", `${EXTRA}x${H}+0+0`, "+repage", "-alpha", "set", "-channel", "A", "-fx", `i<${RAMP}?i/${RAMP}:1`, "+channel", ")",
    "-geometry", `+${X}+0`, "-composite", "-alpha", "off",
    "(", "+clone", "-blur", "0x14",
      "(", "-size", `${W}x${H}`, "xc:black", "-fill", "white", "-draw", `rectangle ${X - 2},0 ${X + 30},${H}`, "-blur", "0x8", ")",
      "-geometry", "+0+0", "-alpha", "off", "-compose", "CopyOpacity", "-composite", ")",
    "-compose", "over", "-composite", ...DIM, "-strip", out("husky-chrome/terminal-background-v4.png"));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  strip("meatball-rest.png", "meatball", ["idle", "blocked", "done"]);
  strip("meatball-working.png", "meatball", ["working-hauling", "working-digging", "working-tracking"]);
  strip("sunny-rest.png", "sunny", ["idle", "blocked", "done"]);
  strip("sunny-working.png", "sunny", ["working-hauling", "working-digging", "working-tracking"]);
  grid("space-badges.png", ["paw", "sled", "moon", "snowflake"].map(n => `husky-spaces/art/${n}.png`));
  grid("panel-icons.png", ["crate", "tracks", "satchel", "signpost"].map(n => `husky-spaces/art/${n}.png`));
  magick(art("brand-emblem.png"), CLEAN, "-resize", "248x248", "-background", "none", "-gravity", "center", "-extent", "256x256", FINISH, out("husky-chrome/brand-emblem.png"));
  magick(art("sidebar.png"), "-gravity", "center", "-crop", "653x1672+0+0", "+repage", "-resize", "400x1024!", ...DIM, "-fill", THEME_BG, "-colorize", "75", "-strip", out("husky-chrome/sidebar-v4.png"));
  terminalBackground();
  // 頭像座標是人工框的頭部；一三五七九為肉丸，其餘為樂晴。
  const tab = n => `husky-tabs/art/portrait-${String(n).padStart(2, "0")}.png`;
  portrait("meatball-rest.png", [170, 45, 300], tab(1), "husky-agents/art/meatball.png");
  portrait("sunny-rest.png", [110, 20, 320], tab(2), "husky-agents/art/sunny.png");
  portrait("meatball-rest.png", [755, 15, 310], tab(3));
  portrait("sunny-rest.png", [710, 10, 330], tab(4));
  portrait("meatball-rest.png", [1380, 30, 300], tab(5));
  portrait("sunny-rest.png", [1350, 10, 330], tab(6));
  portrait("meatball-working.png", [190, 65, 330], tab(7));
  portrait("sunny-working.png", [115, 30, 340], tab(8));
  portrait("meatball-working.png", [640, 222, 380], tab(9));
  portrait("sunny-working.png", [610, 240, 380], tab(10));
}
