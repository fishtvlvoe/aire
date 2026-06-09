export function formatRegistryCodeValue(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (/^[0-9A-Z]{1,4}$/i.test(trimmed)) return `政府代碼 ${trimmed}`;
  return trimmed;
}
