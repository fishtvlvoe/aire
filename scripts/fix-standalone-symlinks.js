#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const STANDALONE_NM = path.join(__dirname, '..', '.next', 'standalone', '.next', 'node_modules');
const ROOT_NM = path.join(__dirname, '..', 'node_modules');

if (!fs.existsSync(STANDALONE_NM)) {
  console.log('standalone node_modules not found, skipping');
  process.exit(0);
}

let fixed = 0;

function fixSymlinks(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      const target = fs.readlinkSync(full);
      const resolved = path.resolve(dir, target);
      if (fs.existsSync(resolved)) {
        fs.unlinkSync(full);
        fs.cpSync(resolved, full, { recursive: true });
        const rel = path.relative(STANDALONE_NM, full);
        console.log(`fixed: ${rel} -> copied from ${resolved}`);
        fixed++;
      } else {
        console.warn(`skip: ${entry.name} (target not found: ${resolved})`);
      }
    } else if (entry.isDirectory() && entry.name.startsWith('@')) {
      fixSymlinks(full);
    }
  }
}

fixSymlinks(STANDALONE_NM);
console.log(`Done. Fixed ${fixed} symlinks.`);
