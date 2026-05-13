#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const STANDALONE_NODE_MODULES = path.join(
  __dirname,
  '..',
  '.next',
  'standalone',
  '.next',
  'node_modules',
);

function walk(dir, output) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      output.push(fullPath);
      continue;
    }
    if (entry.isDirectory()) {
      walk(fullPath, output);
    }
  }
}

function materializeSymlink(linkPath) {
  const targetPath = fs.realpathSync(linkPath);
  fs.rmSync(linkPath, { recursive: true, force: true });
  fs.cpSync(targetPath, linkPath, { recursive: true });
}

function main() {
  if (!fs.existsSync(STANDALONE_NODE_MODULES)) {
    console.log('standalone node_modules not found, skip materialize');
    return;
  }

  const symlinks = [];
  walk(STANDALONE_NODE_MODULES, symlinks);
  if (symlinks.length === 0) {
    console.log('no standalone symlinks found');
    return;
  }

  for (const symlinkPath of symlinks) {
    materializeSymlink(symlinkPath);
  }
  console.log(`materialized ${symlinks.length} standalone symlinks`);
}

main();
