#!/usr/bin/env node
/**
 * build-enterprise-package.mjs
 * AIRE 企業內部分發包打包腳本
 *
 * 用法：
 *   node scripts/build-enterprise-package.mjs --installer path/to/AIRE-x.x.x-Setup.exe
 *   node scripts/build-enterprise-package.mjs --installer path/to/AIRE-x.x.x-Setup.exe --root-cert path/to/root.cer --pub-cert path/to/pub.cer
 *
 * 產出：
 *   artifacts/enterprise-package/AIRE-<version>-enterprise-<date>.zip
 *   artifacts/enterprise-package/AIRE-<version>-enterprise-<date>/manifest.json
 */

import { createHash } from 'crypto'
import { createReadStream, existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')

// --- 參數解析 ---
const args = process.argv.slice(2)
const get = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null }

const installerPath = get('--installer')
if (!installerPath) {
  console.error('用法：node scripts/build-enterprise-package.mjs --installer <path>')
  process.exit(1)
}
if (!existsSync(installerPath)) {
  console.error(`找不到 installer：${installerPath}`)
  process.exit(1)
}

// 版本號從 installer 檔名推斷（格式：AIRE-x.x.x-Setup.exe）
const installerName = basename(installerPath)
const versionMatch = installerName.match(/AIRE-(\d+\.\d+\.\d+)-/)
const version = versionMatch ? versionMatch[1] : 'unknown'

const now = new Date()
const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
const packageName = `AIRE-${version}-enterprise-${dateStr}`
const outputDir = join(projectRoot, 'artifacts', 'enterprise-package', packageName)

// --- 工具函式 ---
async function sha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(filePath)
    stream.on('data', d => hash.update(d))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  })
}

function ensureDir(p) {
  mkdirSync(p, { recursive: true })
}

function copyFile(src, dest) {
  if (!existsSync(src)) {
    console.warn(`⚠  跳過（不存在）：${src}`)
    return false
  }
  copyFileSync(src, dest)
  return true
}

// --- 路徑設定 ---
const enterpriseTemplate = join(projectRoot, 'installer', 'enterprise-package')

const rootCertSrc = get('--root-cert') || join(enterpriseTemplate, 'trust', 'AIRE-RootCA.cer')
const pubCertSrc = get('--pub-cert') || join(enterpriseTemplate, 'trust', 'AIRE-Publisher.cer')

// --- 建立目錄 ---
console.log(`\n📦 AIRE 企業內部分發包打包`)
console.log(`版本：${version}`)
console.log(`輸出：${outputDir}\n`)

ensureDir(join(outputDir, 'trust'))
ensureDir(join(outputDir, 'scripts'))

// --- 複製檔案 ---
const files = []

// installer
copyFileSync(installerPath, join(outputDir, installerName))
files.push({ path: installerName, filePath: join(outputDir, installerName) })

// trust
copyFile(rootCertSrc, join(outputDir, 'trust', 'AIRE-RootCA.cer'))
if (existsSync(join(outputDir, 'trust', 'AIRE-RootCA.cer'))) {
  files.push({ path: 'trust/AIRE-RootCA.cer', filePath: join(outputDir, 'trust', 'AIRE-RootCA.cer') })
}
copyFile(pubCertSrc, join(outputDir, 'trust', 'AIRE-Publisher.cer'))
if (existsSync(join(outputDir, 'trust', 'AIRE-Publisher.cer'))) {
  files.push({ path: 'trust/AIRE-Publisher.cer', filePath: join(outputDir, 'trust', 'AIRE-Publisher.cer') })
}
copyFile(join(enterpriseTemplate, 'trust', 'README-trust.md'), join(outputDir, 'trust', 'README-trust.md'))

// scripts
const scriptNames = ['install.ps1', 'install-trust.ps1', 'verify-checksum.ps1']
for (const s of scriptNames) {
  copyFileSync(join(enterpriseTemplate, 'scripts', s), join(outputDir, 'scripts', s))
  files.push({ path: `scripts/${s}`, filePath: join(outputDir, 'scripts', s) })
}

// README
const readmeSrc = join(projectRoot, 'docs', 'release', 'windows-enterprise-managed-package.md')
if (existsSync(readmeSrc)) {
  copyFileSync(readmeSrc, join(outputDir, 'README.md'))
}

// --- 計算 sha256 ---
console.log('計算 sha256 checksums...')
const fileEntries = []
for (const f of files) {
  const hash = await sha256(f.filePath)
  console.log(`  ${hash.slice(0, 16)}...  ${f.path}`)
  fileEntries.push({ path: f.path, sha256: hash })
}

// --- 寫入 manifest.json ---
const manifest = {
  version,
  generated_at: now.toISOString(),
  release_status: 'enterprise-managed-internal',
  files: fileEntries
}
writeFileSync(join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log('\n✓ manifest.json 已產生')

// --- 打包 zip ---
const zipPath = join(projectRoot, 'artifacts', 'enterprise-package', `${packageName}.zip`)
try {
  execSync(`cd "${join(projectRoot, 'artifacts', 'enterprise-package')}" && zip -r "${zipPath}" "${packageName}"`)
  console.log(`✓ zip 已產生：${zipPath}`)
} catch (e) {
  console.warn('⚠  zip 打包失敗（可手動打包）：', e.message)
}

// --- 輸出 evidence ---
const evidencePath = join(projectRoot, 'artifacts', 'enterprise-package', `${packageName}-evidence.json`)
const evidence = {
  package_name: packageName,
  version,
  generated_at: now.toISOString(),
  release_status: 'enterprise-managed-internal',
  zip_path: zipPath,
  manifest_path: join(outputDir, 'manifest.json'),
  files: fileEntries
}
writeFileSync(evidencePath, JSON.stringify(evidence, null, 2))

console.log(`\n✓ 打包完成`)
console.log(`  包目錄：${outputDir}`)
console.log(`  zip：${zipPath}`)
console.log(`  evidence：${evidencePath}`)
console.log(`\n⚠  release_status = enterprise-managed-internal`)
console.log(`   本包不等於 customer-release-ready，不可公開發行。\n`)
