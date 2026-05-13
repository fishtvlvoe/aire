import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as png2icons from 'png2icons';

const PNG_SIGNATURE = '89504e470d0a1a0a';
const REQUIRED_SIZE = 1024;

export interface GenerateIconCliOptions {
  sourcePngPath?: string;
  targetIcnsPath?: string;
  targetIcoPath?: string;
  logger?: (message: string) => void;
}

function readPngDimensions(buffer: Buffer): { width: number; height: number } {
  if (buffer.subarray(0, 8).toString('hex') !== PNG_SIGNATURE) {
    throw new Error('Error: build/icon.png is not a valid PNG');
  }
  if (buffer.subarray(12, 16).toString('ascii') !== 'IHDR') {
    throw new Error('Error: build/icon.png is missing IHDR chunk');
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

export function generateIcons(options: GenerateIconCliOptions = {}): void {
  const sourcePngPath = options.sourcePngPath ?? path.join(process.cwd(), 'build', 'icon.png');
  const targetIcnsPath = options.targetIcnsPath ?? path.join(process.cwd(), 'build', 'icon.icns');
  const targetIcoPath = options.targetIcoPath ?? path.join(process.cwd(), 'build', 'icon.ico');

  if (!fs.existsSync(sourcePngPath)) {
    throw new Error('Error: build/icon.png not found');
  }

  const sourceBuffer = fs.readFileSync(sourcePngPath);
  const { width, height } = readPngDimensions(sourceBuffer);
  if (width !== REQUIRED_SIZE || height !== REQUIRED_SIZE) {
    throw new Error('Error: icon must be 1024x1024 pixels');
  }

  const icns = png2icons.createICNS(sourceBuffer, png2icons.BILINEAR, 0);
  if (!icns) {
    throw new Error('Error: failed to generate build/icon.icns');
  }

  const ico = png2icons.createICO(sourceBuffer, png2icons.BILINEAR, 0, true);
  if (!ico) {
    throw new Error('Error: failed to generate build/icon.ico');
  }

  fs.mkdirSync(path.dirname(targetIcnsPath), { recursive: true });
  fs.writeFileSync(targetIcnsPath, Buffer.from(icns));
  fs.writeFileSync(targetIcoPath, Buffer.from(ico));
}

export function runGenerateIconsCli(options: GenerateIconCliOptions = {}): number {
  const logger = options.logger ?? console.error;
  try {
    generateIcons(options);
    return 0;
  } catch (error: unknown) {
    logger(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (
  process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  process.exitCode = runGenerateIconsCli();
}

