#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const argv = process.argv.slice(2);
const requestedComponent = argv.includes('--components')
  ? argv[argv.indexOf('--components') + 1]
  : null;

const requestedThemes = argv.includes('--themes')
  ? (argv[argv.indexOf('--themes') + 1] ?? '').split(',').filter(Boolean)
  : [];

if (requestedComponent && requestedComponent !== 'legal-notice') {
  console.error(`Unsupported component for parity script: ${requestedComponent}`);
  process.exit(1);
}

if (requestedThemes.length > 0) {
  const normalized = requestedThemes.map((item) => item.trim().toLowerCase());
  const allowed = new Set(['a', 'c']);
  for (const theme of normalized) {
    if (!allowed.has(theme)) {
      console.error(`Unsupported theme for parity script: ${theme}`);
      process.exit(1);
    }
  }
}

run('pnpm', ['-s', 'vitest', 'run', 'src/lib/pdf-blocks/__tests__/legal-notice-theme.test.tsx']);
