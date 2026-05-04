#!/usr/bin/env node
/**
 * Next.js standalone 輸出的 server 端 JS 混淆腳本
 * 僅混淆 .next/standalone/ 下的業務邏輯檔案，不動 node_modules
 *
 * 使用方式：node scripts/obfuscate-build.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const STANDALONE_DIR = path.join(__dirname, '..', '.next', 'standalone');
const TARGET_DIR = path.join(STANDALONE_DIR, '.next', 'server', 'chunks');

if (!fs.existsSync(TARGET_DIR)) {
  console.log('standalone chunks dir not found, skipping obfuscation');
  process.exit(0);
}

const jsFiles = findJsFiles(TARGET_DIR);
console.log(`Obfuscating ${jsFiles.length} JS files...`);

for (const file of jsFiles) {
  try {
    execSync(
      `npx javascript-obfuscator "${file}" --output "${file}" ` +
      `--compact true --control-flow-flattening false ` +
      `--rename-globals false --string-array true ` +
      `--string-array-encoding base64 --dead-code-injection false`,
      { stdio: 'pipe' },
    );
  } catch {
    // 單個檔案失敗不中斷整體流程
    console.warn(`Warning: failed to obfuscate ${path.basename(file)}`);
  }
}

console.log('Obfuscation complete.');

function findJsFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findJsFiles(full));
    else if (entry.name.endsWith('.js') && !entry.name.endsWith('.min.js')) {
      results.push(full);
    }
  }
  return results;
}
