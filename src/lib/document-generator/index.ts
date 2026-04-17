export { CodexDocumentGenerator } from './codex-provider';
export { CodexFormalGenerator } from './codex-formal-provider';
export { HaikuMarketingGenerator } from './haiku-marketing-provider';
export { GeminiSocialGenerator } from './gemini-social-provider';
export { TriProviderDocumentGenerator } from './tri-provider';
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
  if (provider === 'codex') {
    const { CodexDocumentGenerator } = require('./codex-provider');
    return new CodexDocumentGenerator();
  }
  if (provider === 'formal') {
    const { CodexFormalGenerator } = require('./codex-formal-provider');
    return new CodexFormalGenerator();
  }
  if (provider === 'marketing') {
    const { HaikuMarketingGenerator } = require('./haiku-marketing-provider');
    return new HaikuMarketingGenerator();
  }
  if (provider === 'social') {
    const { GeminiSocialGenerator } = require('./gemini-social-provider');
    return new GeminiSocialGenerator();
  }
  // default: all
  const { CodexFormalGenerator } = require('./codex-formal-provider');
  const { HaikuMarketingGenerator } = require('./haiku-marketing-provider');
  const { GeminiSocialGenerator } = require('./gemini-social-provider');
  const { TriProviderDocumentGenerator } = require('./tri-provider');
  return new TriProviderDocumentGenerator(
    new CodexFormalGenerator(),
    new HaikuMarketingGenerator(),
    new GeminiSocialGenerator()
  );
}
