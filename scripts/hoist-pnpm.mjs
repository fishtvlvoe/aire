#!/usr/bin/env node
/**
 * hoist-pnpm.mjs — 把 .pnpm 虛擬 store 的所有包提升到頂層 node_modules
 *
 * 解決問題：pnpm standalone 用 symlink；rsync -rL 雖解析實體檔案，
 * 但 node_modules/next 載入後找 @swc/helpers 時，
 * Node.js 解析路徑不會往 .pnpm/next@.../node_modules/ 走，
 * 導致 MODULE_NOT_FOUND。
 *
 * 修法：把 .pnpm/ENTRY/node_modules/PACKAGE 複製到頂層，
 * 等同 shamefully-hoist=true 的效果。
 * 頂層已存在的包不覆蓋（避免破壞直接依賴）。
 */

import fs from "node:fs";
import path from "node:path";

const NM = process.argv[2];
if (!NM) { console.error("Usage: hoist-pnpm.mjs <node_modules_path>"); process.exit(1); }

const PNPM = path.join(NM, ".pnpm");
if (!fs.existsSync(PNPM)) { console.log("No .pnpm dir, skip."); process.exit(0); }

let hoisted = 0;

for (const entry of fs.readdirSync(PNPM)) {
  const entryNM = path.join(PNPM, entry, "node_modules");
  if (!fs.existsSync(entryNM)) continue;

  for (const pkg of fs.readdirSync(entryNM)) {
    if (pkg === ".pnpm" || pkg === ".modules.yaml") continue;
    const pkgPath = path.join(entryNM, pkg);
    if (!fs.statSync(pkgPath).isDirectory()) continue;

    if (pkg.startsWith("@")) {
      // scoped package: iterate @scope/name
      for (const scoped of fs.readdirSync(pkgPath)) {
        const src = path.join(pkgPath, scoped);
        if (!fs.statSync(src).isDirectory()) continue;
        const dest = path.join(NM, pkg, scoped);
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(path.join(NM, pkg), { recursive: true });
          cpDir(src, dest);
          hoisted++;
        }
      }
    } else {
      const dest = path.join(NM, pkg);
      if (!fs.existsSync(dest)) {
        cpDir(pkgPath, dest);
        hoisted++;
      }
    }
  }
}

console.log(`✓ hoisted ${hoisted} packages`);

function cpDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isSymbolicLink()) {
      // symlink 應已被 rsync -rL 解析；若還有就跳過（dangling）
      try { cpDir(fs.realpathSync(s), d); } catch { /* skip dangling */ }
    } else if (entry.isDirectory()) {
      cpDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}
