#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const agents = readFileSync(resolve(root, 'AGENTS.md'), 'utf8');

const requiredPaths = [
  'docs/agents/README.md',
  'docs/agents/spectra.md',
  'docs/agents/domains/listing.md',
  'docs/agents/domains/documents.md',
  'docs/agents/domains/data-collection.md',
  'docs/agents/domains/property.md',
  'docs/agents/domains/llm-infra.md',
  'docs/agents/workflows/testing.md',
  'docs/agents/workflows/commits.md',
  'docs/agents/workflows/deployment.md',
];

const linkedPaths = Array.from(agents.matchAll(/`(docs\/agents\/[^`]+\.md)`/g), (match) => match[1]);
const missing = [...new Set([...requiredPaths, ...linkedPaths])]
  .filter((relativePath) => !existsSync(resolve(root, relativePath)));

const hasSpectraBlock = agents.includes('<!-- SPECTRA:START') && agents.includes('<!-- SPECTRA:END -->');
const hasRouting = agents.includes('## Task Routing');
const hasProgressivePolicy = agents.includes('## Progressive Loading Policy');

const failures = [];
if (!hasSpectraBlock) failures.push('AGENTS.md is missing the Spectra managed block.');
if (!hasRouting) failures.push('AGENTS.md is missing Task Routing.');
if (!hasProgressivePolicy) failures.push('AGENTS.md is missing Progressive Loading Policy.');
if (missing.length > 0) failures.push(`Missing linked docs: ${missing.join(', ')}`);

if (failures.length > 0) {
  console.error('Agent docs validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Agent docs validation passed.');
console.log(`Checked ${requiredPaths.length} required docs and ${new Set(linkedPaths).size} AGENTS.md links.`);
