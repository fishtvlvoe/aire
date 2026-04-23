import type { PropertyDossier } from '@/lib/models/property-dossier';
import type { PlatformStrategy } from '@/lib/trackers/algorithm-tracker';

export interface PlatformPromptOptions {
  strategy?: PlatformStrategy;
}

function v(x: unknown): string {
  if (x === null || x === undefined) return '待補';
  if (typeof x === 'string') return x.trim() || '待補';
  return String(x);
}

function baseRules(): string {
  return [
    'SYSTEM: 你是台灣房仲社群內容寫手。',
    '- 禁止寫「房價會漲/投資必賺/漲幅/增值保證」。',
    '- 白話口吻，具體情境。',
  ].join('\n');
}

export function buildFacebookPrompt(dossier: PropertyDossier, opts?: PlatformPromptOptions): string {
  return [
    baseRules(),
    `USER: 平台=facebook；策略=${opts?.strategy ? JSON.stringify(opts.strategy) : '待補'}`,
    `物件：${v(dossier.address)}，總價 ${v(dossier.total_price)} 萬元。`,
    '請輸出 300-500 字貼文，含 3-5 個 hashtag。',
  ].join('\n');
}

export function buildInstagramPrompt(dossier: PropertyDossier, opts?: PlatformPromptOptions): string {
  return [
    baseRules(),
    `USER: 平台=instagram；策略=${opts?.strategy ? JSON.stringify(opts.strategy) : '待補'}`,
    `物件：${v(dossier.address)}，總價 ${v(dossier.total_price)} 萬元。`,
    '請輸出 reels_script（口播稿）。',
  ].join('\n');
}

export function buildThreadsPrompt(dossier: PropertyDossier, opts?: PlatformPromptOptions): string {
  return [
    baseRules(),
    `USER: 平台=threads；策略=${opts?.strategy ? JSON.stringify(opts.strategy) : '待補'}`,
    `物件：${v(dossier.address)}，總價 ${v(dossier.total_price)} 萬元。`,
    '請輸出 100-200 字短文，像在跟朋友聊天。',
  ].join('\n');
}

export function buildTiktokPrompt(dossier: PropertyDossier, opts?: PlatformPromptOptions): string {
  return [
    baseRules(),
    `USER: 平台=tiktok；策略=${opts?.strategy ? JSON.stringify(opts.strategy) : '待補'}`,
    `物件：${v(dossier.address)}，總價 ${v(dossier.total_price)} 萬元。`,
    '請輸出腳本並包含時間點標記（例如「0秒」「15秒」「30秒」）。',
  ].join('\n');
}

export function buildYoutubePrompt(dossier: PropertyDossier, opts?: PlatformPromptOptions): string {
  return [
    baseRules(),
    `USER: 平台=youtube；策略=${opts?.strategy ? JSON.stringify(opts.strategy) : '待補'}`,
    `物件：${v(dossier.address)}，總價 ${v(dossier.total_price)} 萬元。`,
    '請輸出：title 一行 + outline（條列 6-10 點）。',
  ].join('\n');
}
