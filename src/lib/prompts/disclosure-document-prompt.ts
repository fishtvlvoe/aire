import type { TranscriptAdditional } from '@/lib/parsers/transcript-parser';
import type { PropertyDossier } from '@/lib/models/property-dossier';

export function buildEncumbranceInterpretationPrompt(
  encumbrances: TranscriptAdditional['encumbrances']
): string {
  return [
    'SYSTEM: 你是台灣不動產法務助理，請用白話解釋他項權利（抵押權等）代表的意義與買方注意事項。',
    'USER: 請根據以下 encumbrances JSON，輸出 3-6 句說明，不要恐嚇式用語。',
    JSON.stringify(encumbrances ?? []),
  ].join('\n');
}

export function buildPropertySummaryPrompt(dossier: PropertyDossier): string {
  return [
    'SYSTEM: 你是台灣房仲助理，請用白話整理物件摘要（不誇大、不寫漲價）。',
    'USER: 請輸出 6-10 行要點，包含地址、總價、適合客群、注意事項。',
    JSON.stringify({
      property_type: dossier.property_type,
      address: dossier.address,
      total_price: dossier.total_price,
      registered_area: dossier.registered_area,
      parking: { type: dossier.parking_type, space: dossier.parking_space },
    }),
  ].join('\n');
}

export function buildTranscriptAppendix(yamlContent: string): string {
  // 過濾：刪「注意：謄本列印完畢」，其餘保留（含 QR Code、身分證字號不遮蔽）
  return yamlContent
    .split(/\r?\n/)
    .filter((line) => !line.includes('注意：謄本列印完畢'))
    .join('\n')
    .trim();
}
