import { randomBytes } from 'node:crypto';

const PREFIX = 'THREE';
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PART_LENGTH = 4;
const PART_COUNT = 3;

function randomPart(length: number): string {
  const bytes = randomBytes(length);
  return Array.from(bytes).map((byte) => CHARSET[byte % CHARSET.length]).join('');
}

export function generateSerialKey(): string {
  const parts: string[] = [];
  for (let i = 0; i < PART_COUNT; i += 1) {
    parts.push(randomPart(PART_LENGTH));
  }
  return `${PREFIX}-${parts.join('-')}`;
}

export function generateSerialBatch(count: number): string[] {
  const unique = new Set<string>();
  while (unique.size < count) {
    unique.add(generateSerialKey());
  }
  return [...unique];
}

