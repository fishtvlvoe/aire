import type { DocumentGeneratorInput } from '../document-generator/types';
import { generateDossierPDFLib } from './pdflib-dossier';

export async function generateDossierPDF(
  markdown: string,
  listingId: number | string,
  input?: DocumentGeneratorInput
): Promise<Uint8Array> {
  return await generateDossierPDFLib(markdown, listingId, input);
}
