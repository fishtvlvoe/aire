export const AI_DISCLAIMER_MD = `\n\n---\n⚠️ 本文件由 AI 輔助產出，請務必確認內容正確後再使用。`;

export const AI_DISCLAIMER_HTML = `<div style="margin-top:24px;padding-top:8px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:10px;text-align:center">⚠️ 本文件由 AI 輔助產出，請務必確認內容正確後再使用。</div>`;

export function appendDisclaimer(md: string): string {
  return md + AI_DISCLAIMER_MD;
}
