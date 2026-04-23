export function sanitizeForPrompt(value: string): string {
  return value
    .replace(/^\s*(SYSTEM|USER|ASSISTANT)\s*:/gim, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();
}
