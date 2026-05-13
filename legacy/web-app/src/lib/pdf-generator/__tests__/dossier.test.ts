import { describe, expect, it, vi } from 'vitest';
import { generateDossierPDF } from '../dossier';
import { generateDossierPDFLib } from '../pdflib-dossier';
import type { DocumentGeneratorInput } from '@/lib/document-generator/types';

vi.mock('../pdflib-dossier', () => ({
  generateDossierPDFLib: vi.fn(),
}));

describe('generateDossierPDF', () => {
  it('delegates to generateDossierPDFLib with original arguments', async () => {
    const expected = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    const generateDossierPDFLibMock = vi.mocked(generateDossierPDFLib);
    generateDossierPDFLibMock.mockResolvedValue(expected);

    const input: DocumentGeneratorInput = {
      property_type: 'apartment',
      field_visit_data: { address: '台北市信義區' },
      supplementary_data: { property_name: '信義路三段100號' },
    };

    const result = await generateDossierPDF('# 測試', 42, input);

    expect(generateDossierPDFLibMock).toHaveBeenCalledWith('# 測試', 42, input);
    expect(result).toBe(expected);
  });
});
