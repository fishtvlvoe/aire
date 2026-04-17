import { CodexDocumentGenerator } from './codex-provider';

export { CodexDocumentGenerator };
export type {
  DocumentGenerator,
  DocumentGeneratorInput,
  GeneratedDocuments,
} from './types';

export function createDefaultGenerator() {
  return new CodexDocumentGenerator();
}
