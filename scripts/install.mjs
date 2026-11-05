import { cpSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const target = process.env.HERDR_APP_HOME || join(homedir(), ".config", "herdr-app");
const files = [
  "mods/husky-agents", "mods/husky-tabs", "mods/husky-spaces", "mods/husky-chrome",
  "mods/husky-files", "mods/husky-changes", "mods/husky-inbox", "mods/husky-git-graph",
  "layouts/husky.json", "layouts/husky.svg", "themes/husky.json",
];
const update = process.argv.includes("--update");
const dependencies = ["pane", "files", "changes", "workspace-status", "menu", "new-menu", "picker", "machine-add", "workspace-chrome", "inbox", "git-graph", "file-icons"];

// 完整預檢後才複製；撞名預設停止，避免覆蓋個人主題或設定。
// --update 只覆寫上面列出的 husky 路徑，供已安裝者更新；來源已刪的檔案不會移除。
for (const name of dependencies) {
  if (!existsSync(join(target, "mods", name, "main.js"))) throw new Error(`Missing Herdr mod: ${name}`);
}
if (!update) for (const file of files) {
  if (existsSync(join(target, file))) throw new Error(`Already exists; nothing copied: ${join(target, file)}`);
}
for (const folder of ["mods", "layouts", "themes"]) mkdirSync(join(target, folder), { recursive: true });
for (const file of files) cpSync(join(root, file), join(target, file), {
  recursive: true, force: update, errorOnExist: !update,
  filter: path => !/(?:gpui-kit\.d\.ts|herdr\.d\.ts|jsconfig\.json)$/.test(path),
});
console.log(`${update ? "Updated" : "Installed"} Husky in ${target}`);
console.log('Next: check all eight mods, then herdr-app do layout.switch \'{"name":"husky"}\'');
