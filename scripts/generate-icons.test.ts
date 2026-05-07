import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runGenerateIconsCli } from './generate-icons';

function fakePngWithSize(width: number, height: number): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrLength = Buffer.from([0x00, 0x00, 0x00, 0x0d]);
  const ihdrType = Buffer.from('IHDR');
  const size = Buffer.alloc(8);
  size.writeUInt32BE(width, 0);
  size.writeUInt32BE(height, 4);
  const rest = Buffer.from([0x08, 0x06, 0x00, 0x00, 0x00]);
  const crc = Buffer.from([0x00, 0x00, 0x00, 0x00]);
  return Buffer.concat([signature, ihdrLength, ihdrType, size, rest, crc]);
}

describe('generate-icons script', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'three-ai-icon-test-'));

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    fs.mkdirSync(tempRoot, { recursive: true });
  });

  it('exits with code 1 when source PNG is missing', () => {
    const code = runGenerateIconsCli({
      sourcePngPath: path.join(tempRoot, 'icon.png'),
      logger: () => undefined,
    });
    expect(code).toBe(1);
  });

  it('exits with code 1 when source PNG is not 1024x1024', () => {
    const sourcePath = path.join(tempRoot, 'icon.png');
    fs.writeFileSync(sourcePath, fakePngWithSize(512, 512));

    const code = runGenerateIconsCli({
      sourcePngPath: sourcePath,
      logger: () => undefined,
    });
    expect(code).toBe(1);
  });
});

