import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { STATES, DOGS, assignDogs, portraitPath, stateFor, spritePath, nextSidebarWidth, frameColor, iconKind, statusText, phaseOffset, ACTION_MS, TICK_MS, SIDEBAR_WIDTH } from "../mods/husky-agents/lib.js";
import { PORTRAITS, assignPortraits } from "../mods/husky-tabs/portraits.js";
import { badgePath } from "../mods/husky-spaces/badges.js";
import { lowestColumn } from "../scripts/build-art.mjs";
import { openCommand, parseListing } from "../mods/husky-inbox/lib.js";
import { listNames, newFilesNote } from "../mods/husky-tabs/downloads.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const json = path => JSON.parse(readFileSync(join(root, path), "utf8"));

test("Space badges cycle paw, sled, moon, snowflake in display order", () => {
  const expected = ["paw", "sled", "moon", "snowflake", "paw", "sled", "moon", "snowflake", "paw"];
  assert.deepEqual(expected.map((_, i) => badgePath(i)), expected.map(name => `mods/husky-spaces/art/${name}.png`));
});

test("art cuts fall on the emptiest column inside the search window", () => {
  assert.equal(lowestColumn([9, 9, 1, 0, 2, 9], 1, 5), 3);
  assert.equal(lowestColumn([0, 9, 5, 9], 1, 4), 2);
});

test("agents keep their dog, and both dogs appear before either repeats", () => {
  const first = assignDogs(["a", "b", "c", "d"], {});
  assert.deepEqual(Object.values(first), ["meatball", "sunny", "meatball", "sunny"]);
  assert.deepEqual(assignDogs(["d", "c", "b", "a"], first), { d: "sunny", c: "meatball", b: "sunny", a: "meatball" });
  assert.equal(assignDogs(["a", "new"], { a: "meatball" }).new, "sunny");
  assert.equal(assignDogs(["a", "new"], { a: "sunny" }).new, "meatball");
});

test("invalid saved dogs cannot select arbitrary folders or inherited keys", () => {
  for (const saved of [null, [], "bad", { a: "../../secret" }, Object.create({ a: "sunny" })]) {
    assert.deepEqual(assignDogs(["a"], saved), { a: "meatball" });
  }
  assert.ok(Object.hasOwn(assignDogs(["__proto__"], {}), "__proto__"));
  assert.equal(spritePath("../../secret", "idle"), spritePath("meatball", "idle"));
  assert.equal(portraitPath("../../secret"), portraitPath("meatball"));
});

test("ten distinct square portraits are available for every tab type", () => {
  assert.equal(PORTRAITS.length, 10);
  const images = PORTRAITS.map(path => readFileSync(join(root, path)));
  for (const bytes of images) {
    assert.equal(bytes.subarray(1, 4).toString(), "PNG");
    assert.equal(bytes.readUInt32BE(16), 256);
    assert.equal(bytes.readUInt32BE(20), 256);
  }
  assert.equal(new Set(images.map(bytes => bytes.toString("base64"))).size, 10);
});

test("new tabs receive unused random portraits until the pool is exhausted", () => {
  const tabs = Array.from({ length: 12 }, (_, i) => ({ id: `t${i}` }));
  const first = assignPortraits(tabs.slice(0, 10), {});
  assert.equal(new Set(Object.values(first)).size, 10);
  const all = assignPortraits(tabs, first);
  assert.equal(Object.keys(all).length, 12);
  for (const path of Object.values(all)) assert.ok(PORTRAITS.includes(path));
  for (const [id, path] of Object.entries(first)) assert.equal(all[id], path);
});

test("saved tab portraits survive redraw, rename, reorder and reload", () => {
  const tabs = [{ id: "shell", name: "cmd" }, { id: "agent", name: "Codex" }];
  const first = assignPortraits(tabs, {});
  const saved = JSON.parse(JSON.stringify(first));
  assert.deepEqual(assignPortraits(tabs, saved), first);
  assert.deepEqual(assignPortraits([{ id: "agent", name: "New name" }, tabs[0]], saved), first);
  const next = assignPortraits([tabs[1], { id: "new-tab" }], saved);
  assert.equal(next.agent, first.agent);
  assert.ok(!Object.hasOwn(next, "shell"));
  assert.notEqual(next["new-tab"], next.agent);
});

test("invalid saved portraits cannot select arbitrary files or inherited keys", () => {
  const tabs = [{ id: "t1" }, { id: "__proto__" }];
  for (const saved of [null, [], "bad", { t1: "../../secret" }, Object.create({ t1: PORTRAITS[0] })]) {
    const result = assignPortraits(tabs, saved);
    assert.deepEqual(Object.keys(result), ["t1", "__proto__"]);
    assert.ok(Object.hasOwn(result, "__proto__"));
    for (const path of Object.values(result)) assert.ok(PORTRAITS.includes(path));
  }
});

test("four states select valid sprites; unknown values stay in the asset folder", () => {
  for (const dog of DOGS) {
    assert.ok(existsSync(join(root, portraitPath(dog))));
    for (const state of STATES) {
      assert.equal(stateFor(state), state);
      const bytes = readFileSync(join(root, spritePath(dog, state)));
      assert.equal(bytes.subarray(1, 4).toString(), "PNG");
      assert.equal(bytes.readUInt32BE(16) * 4, bytes.readUInt32BE(20) * 3);
    }
  }
  for (const value of [null, undefined, "thinking", "../../secret", {}, "constructor"]) {
    assert.equal(stateFor(value), "idle");
    assert.equal(spritePath("sunny", value), spritePath("sunny", "idle"));
  }
});

test("sidebar folds to a rail wide enough for the platform and always unfolds to the layout width", () => {
  assert.equal(SIDEBAR_WIDTH, 190);
  assert.equal(json("layouts/husky.json").children.find(n => n.id === "sidebar").size.px, SIDEBAR_WIDTH);
  assert.match(readFileSync(join(root, "mods/husky-chrome/main.js"), "utf8"), new RegExp(`narrow\\(\\) \\? ${SIDEBAR_WIDTH} :`));
  assert.equal(nextSidebarWidth(SIDEBAR_WIDTH, "macos"), 76);
  assert.equal(nextSidebarWidth(SIDEBAR_WIDTH, "linux"), 44);
  assert.equal(nextSidebarWidth(76, "macos"), SIDEBAR_WIDTH);
  assert.equal(nextSidebarWidth(44, "windows"), SIDEBAR_WIDTH);
});

test("the macOS rail keeps a way back and other layouts' saved width cannot shrink Husky", () => {
  const agents = readFileSync(join(root, "mods/husky-agents/main.js"), "utf8");
  const chrome = readFileSync(join(root, "mods/husky-chrome/main.js"), "utf8");
  assert.match(agents, /\.on_click\(toggleSidebar\)/);
  assert.match(agents, /run\("layout\.resize", \{ id: "sidebar", px: nextSidebarWidth\(/);
  for (const source of [agents, chrome]) assert.ok(!source.includes('"sidebar.width"'));
});

test("a blocked agent keeps its gold frame while focused, in both card sizes", () => {
  const t = { blocked: "gold", accent: "teal", border: "line", working: "mint", idle: "grey" };
  for (const collapsed of [false, true]) {
    assert.equal(frameColor("blocked", true, t, collapsed), "gold");
    assert.equal(frameColor("working", true, t, collapsed), "teal");
  }
  assert.equal(frameColor("working", false, t, false), "line");
  assert.equal(frameColor("working", false, t, true), "mint");
});

test("working rotates label and pose together; other states stay put", () => {
  for (const dog of DOGS) {
    const seen = [0, 1, 2].map((i) => [statusText("working", i * ACTION_MS), spritePath(dog, "working", i * ACTION_MS)]);
    assert.deepEqual(seen.map(([text]) => text), ["拉雪橇", "挖雪中", "追蹤中"]);
    assert.deepEqual(seen.map(([, path]) => path.split("/").pop()), ["working-hauling.png", "working-digging.png", "working-tracking.png"]);
    for (const [, path] of seen) {
      const bytes = readFileSync(join(root, path));
      assert.equal(bytes.subarray(1, 4).toString(), "PNG");
      assert.equal(bytes.readUInt32BE(16) * 4, bytes.readUInt32BE(20) * 3);
    }
  }
  assert.equal(statusText("working", 3 * ACTION_MS), "拉雪橇");
  assert.equal(statusText("working", ACTION_MS - 1), "拉雪橇");
  assert.equal(statusText("idle", ACTION_MS), "休息中");
  assert.equal(statusText("blocked", ACTION_MS), "等待指示");
  assert.equal(statusText("done", ACTION_MS), "已完成");
  assert.equal(spritePath("sunny", "idle", ACTION_MS), spritePath("sunny", "idle"));
});

test("neighbouring agents never show the same action or switch together", () => {
  const cycle = ACTION_MS * 3;
  const phases = Array.from({ length: 9 }, (_, i) => phaseOffset(i) % cycle);
  assert.equal(new Set(phases).size, 9);
  // 三張全不同又要錯開切換在數學上不可能，只保證相鄰兩張永遠不同。
  for (let ms = 0; ms < cycle; ms += 100) {
    for (const i of [0, 1, 2, 7]) {
      assert.notEqual(statusText("working", ms + phaseOffset(i)), statusText("working", ms + phaseOffset(i + 1)), `at ${ms}ms`);
    }
  }
  // 每次 tick 最多只有一張卡換動作，切換時機才真的錯開。
  for (let tick = 0; tick < 9; tick++) {
    const before = tick * TICK_MS, after = before + TICK_MS;
    const changed = [0, 1, 2].filter((i) =>
      statusText("working", before + phaseOffset(i)) !== statusText("working", after + phaseOffset(i)));
    assert.equal(changed.length, 1);
  }
});

test("agent cards draw the program icon the way its table entry says", () => {
  assert.equal(iconKind({ icon: "icons/claude.svg", tint: true }), "svg");
  assert.equal(iconKind({ icon: "icons/logo.svg", tint: false }), "image");
  assert.equal(iconKind({ icon: null, tint: true }), null);
  assert.equal(iconKind(undefined), null);
});

test("Inbox watches ~/Downloads", () => {
  const source = readFileSync(join(root, "mods/husky-inbox/main.js"), "utf8");
  assert.ok(source.includes('const INBOX_DIR = home() + "/Downloads";'));
  assert.ok(!source.includes("mkdir"), "the mod must not create folders in Downloads");
});

test("Watch lists every finished file, but only media opens directly", () => {
  const dir = "/d";
  const items = parseListing(["1 5 /d/a.zip", "2 5 /d/run.command", "3 5 /d/b.pdf", "4 5 /d/c.crdownload", "5 5 /d/.DS_Store"].join("\n"), dir);
  assert.deepEqual(items.map(i => [i.name, i.kind]), [["b.pdf", "pdf"], ["run.command", "file"], ["a.zip", "file"]]);
  assert.deepEqual(openCommand("/d/b.pdf", dir).args, ["/d/b.pdf"]);
  // 不是媒體檔只在 Finder 顯示，點一下不能執行 .command／.pkg。
  assert.deepEqual(openCommand("/d/run.command", dir).args, ["-R", "/d/run.command"]);
  assert.equal(openCommand("/d/sub/a.png", dir), null);
});

test("Watch notes only files that were not there before", () => {
  assert.deepEqual(listNames("/d/a.zip\n/d/b.part\n/d/.DS_Store\n/d/sub/c.png\n", "/d"), ["a.zip"]);
  assert.equal(newFilesNote(["a"], ["a"]), null);
  assert.equal(newFilesNote(["a", "b"], ["a"]), null);
  assert.deepEqual(newFilesNote(["a"], ["a", "b"]), { title: "New download", body: "b", level: "info" });
  assert.equal(newFilesNote([], ["a", "b", "c"]).body, "a, b +1 more");
});

test("each panel shows its trail icon in full color when empty, never over an error", () => {
  const panels = { "husky-files/main.js": "crate", "husky-changes/main.js": "tracks", "husky-inbox/main.js": "satchel", "husky-git-graph/graph.js": "signpost" };
  for (const [file, art] of Object.entries(panels)) {
    const path = `mods/husky-spaces/art/${art}.png`;
    assert.ok(existsSync(join(root, path)), path);
    const source = readFileSync(join(root, "mods", file), "utf8");
    assert.match(source, /import \{[^}]*\bimage\b[^}]*\} from "gpui-kit"/, file);
    assert.ok(source.includes(`image("${path}").size(72)`), file);
    assert.match(source, /\.when\((?:!this\.error|!failed), [^\n]*\.png"\)/, file);
  }
  assert.match(readFileSync(join(root, "mods/husky-changes/main.js"), "utf8"), /\? 132 :/, "Changes list must be tall enough for the icon");
});

test("panel buttons use bold 24px icons drawn for small sizes", () => {
  const tabs = readFileSync(join(root, "mods/husky-tabs/main.js"), "utf8");
  for (const [id, label] of Object.entries({ files: "Files", changes: "Changes", graph: "Git", inbox: "Watch" })) {
    const path = `mods/husky-tabs/art/panel-${id}.svg`;
    assert.ok(tabs.includes(`panelButton("${id}", "${label}", "${path}")`), id);
    const icon = readFileSync(join(root, path), "utf8");
    assert.match(icon, /viewBox="0 0 24 24"/, id);
    assert.match(icon, /stroke-width="2"/, id);
    assert.match(icon, /stroke="#0E4A70"/, id);
    assert.ok(!icon.includes("<rect"), `${id} must not waste pixels on a frame`);
  }
  assert.ok(tabs.includes(".child(image(icon).size(24).flex_none())"));
});

test("layout has unique IDs, valid theme, all local art and mod references", () => {
  const layout = json("layouts/husky.json");
  const ids = new Set();
  function visit(value) {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== "object") return;
    if (value.id) { assert.ok(!ids.has(value.id), `Duplicate node: ${value.id}`); ids.add(value.id); }
    if (value.mod?.startsWith("husky-")) assert.ok(existsSync(join(root, "mods", value.mod, "main.js")));
    if (value.image) assert.ok(existsSync(join(root, value.image)), value.image);
    Object.values(value).forEach(visit);
  }
  visit(layout);
  assert.ok(existsSync(join(root, layout.preview)));
  const theme = json(`themes/${layout.theme}.json`);
  assert.equal(theme.ansi.length, 16);
  for (const color of [...theme.ansi, ...Object.values(theme.colors)]) assert.match(color, /^#[\da-f]{6}([\da-f]{2})?$/i);
  for (const state of STATES) assert.ok(theme.colors[state]);
  for (const folder of readdirSync(join(root, "mods"), { withFileTypes: true }).filter(entry => entry.isDirectory())) {
    const source = readFileSync(join(root, "mods", folder.name, "main.js"), "utf8");
    for (const [, path] of source.matchAll(/"(mods\/husky-[^"$]+\.(?:png|svg|json))"/g)) assert.ok(existsSync(join(root, path)), path);
  }
  for (const name of ["paw", "sled", "moon", "snowflake", "crate", "tracks", "satchel", "signpost"]) {
    const bytes = readFileSync(join(root, "mods/husky-spaces/art", `${name}.png`));
    assert.equal(bytes.subarray(1, 4).toString(), "PNG");
    assert.equal(bytes.readUInt32BE(16), 256);
    assert.equal(bytes.readUInt32BE(20), 256);
    assert.equal(bytes[25], 6, "Badge must preserve RGBA transparency");
  }
});

test("text and status colors retain readable contrast on the panel background", () => {
  const t = json("themes/husky.json").colors;
  const light = hex => hex.slice(1).match(/../g).map(c => parseInt(c, 16) / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4).reduce((n, c, i) => n + c * [0.2126, 0.7152, 0.0722][i], 0);
  for (const key of ["foreground", "muted", "dim", "working", "blocked", "done", "idle"]) {
    const [hi, lo] = [light(t[key]), light(t.surface)].sort((x, y) => y - x);
    assert.ok((hi + 0.05) / (lo + 0.05) >= 4.5, key);
  }
});

test("installer refuses missing dependencies and name collisions before copying", () => {
  const target = mkdtempSync(join(tmpdir(), "herdr-husky-test-"));
  const install = () => spawnSync(process.execPath, [join(root, "scripts/install.mjs")], { env: { ...process.env, HERDR_APP_HOME: target }, encoding: "utf8" });
  try {
    assert.notEqual(install().status, 0);
    assert.ok(!existsSync(join(target, "mods/husky-agents")));
    for (const name of ["pane", "files", "changes", "workspace-status", "menu", "new-menu", "picker", "machine-add", "workspace-chrome", "inbox", "git-graph"]) {
      mkdirSync(join(target, "mods", name), { recursive: true });
      writeFileSync(join(target, "mods", name, "main.js"), "fixture");
    }
    const result = install();
    assert.equal(result.status, 0, result.stderr);
    assert.ok(existsSync(join(target, "themes/husky.json")));
    for (const name of ["agents", "tabs", "spaces", "chrome", "files", "changes", "inbox", "git-graph"]) {
      assert.ok(existsSync(join(target, `mods/husky-${name}/main.js`)), name);
    }
    const file = join(target, "mods/husky-agents/main.js");
    writeFileSync(file, "user edit");
    assert.notEqual(install().status, 0);
    assert.equal(readFileSync(file, "utf8"), "user edit");
    const other = join(target, "mods/inbox/main.js");
    const update = spawnSync(process.execPath, [join(root, "scripts/install.mjs"), "--update"], { env: { ...process.env, HERDR_APP_HOME: target }, encoding: "utf8" });
    assert.equal(update.status, 0, update.stderr);
    assert.equal(readFileSync(file, "utf8"), readFileSync(join(root, "mods/husky-agents/main.js"), "utf8"));
    assert.equal(readFileSync(other, "utf8"), "fixture");
    assert.ok(!existsSync(join(target, "mods/husky-agents/gpui-kit.d.ts")));
  } finally { rmSync(target, { recursive: true, force: true }); }
});
