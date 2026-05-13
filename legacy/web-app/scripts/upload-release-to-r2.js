#!/usr/bin/env node
/**
 * 把 dist-electron/ 下的安裝檔上傳到 Cloudflare R2，
 * 並更新 releases/latest.json。
 *
 * 需要環境變數：
 *   R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT, RELEASE_VERSION
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIST_DIR = path.join(__dirname, '..', 'dist-electron');
const VERSION = (process.env.RELEASE_VERSION ?? '').replace(/^v/, '');
const BUCKET = process.env.R2_BUCKET ?? 'fishtv';
const ENDPOINT = process.env.R2_ENDPOINT ?? '';

if (!VERSION) { console.error('RELEASE_VERSION is required'); process.exit(1); }

const INSTALL_EXTS = ['.dmg', '.exe', '.AppImage'];

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function r2Url(key) {
  return `${ENDPOINT}/${BUCKET}/${key}`;
}

function awsSync(src, key) {
  execSync(
    `aws s3 cp "${src}" "s3://${BUCKET}/${key}" --endpoint-url="${ENDPOINT}"`,
    { env: { ...process.env }, stdio: 'inherit' },
  );
}

const files = fs.readdirSync(DIST_DIR).filter((f) =>
  INSTALL_EXTS.some((ext) => f.endsWith(ext)),
);

const fileInfos = [];

for (const filename of files) {
  const src = path.join(DIST_DIR, filename);
  const platform = filename.endsWith('.dmg') ? 'mac' : filename.endsWith('.exe') ? 'win' : 'linux';
  const key = `releases/v${VERSION}/${filename}`;
  console.log(`Uploading ${filename} → ${key}`);
  awsSync(src, key);
  fileInfos.push({ platform, filename, sha256: sha256(src) });
}

// 更新 latest.json
const latest = { version: VERSION, files: fileInfos };
const tmpLatest = path.join(DIST_DIR, 'latest.json');
fs.writeFileSync(tmpLatest, JSON.stringify(latest, null, 2));
awsSync(tmpLatest, 'releases/latest.json');

console.log('Upload complete:', latest);
