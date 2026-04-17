import { CodexDocumentGenerator } from './codex-provider';
import { CodexFormalGenerator } from './codex-formal-provider';
import { HaikuMarketingGenerator } from './haiku-marketing-provider';
import { GeminiSocialGenerator } from './gemini-social-provider';
import { TriProviderDocumentGenerator } from './tri-provider';

export { CodexDocumentGenerator, CodexFormalGenerator, HaikuMarketingGenerator, GeminiSocialGenerator, TriProviderDocumentGenerator };
export type {
  DocumentGenerator,
  DocumentGeneratorInput,
  GeneratedDocuments,
  FormalDocumentGenerator,
  MarketingDocumentGenerator,
  SocialDocumentGenerator
} from './types';

export function createDefaultGenerator() {
  const provider = process.env.DOCUMENT_GENERATOR_PROVIDER || 'all';
  if (provider === 'codex') return new CodexDocumentGenerator();
  if (provider === 'formal') return new CodexFormalGenerator();
  if (provider === 'marketing') return new HaikuMarketingGenerator();
  if (provider === 'social') return new GeminiSocialGenerator();
  return new TriProviderDocumentGenerator(
    new CodexFormalGenerator(),
    new HaikuMarketingGenerator(),
    new GeminiSocialGenerator()
  );
}
