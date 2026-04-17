import type { DocumentGenerator, DocumentGeneratorInput, GeneratedDocuments, FormalDocumentGenerator, MarketingDocumentGenerator, SocialDocumentGenerator } from './types';

export class TriProviderDocumentGenerator implements DocumentGenerator {
  constructor(
    private formal: FormalDocumentGenerator,
    private marketing: MarketingDocumentGenerator,
    private social: SocialDocumentGenerator
  ) {}

  async generate(input: DocumentGeneratorInput): Promise<GeneratedDocuments> {
    const [formal, marketing, social] = await Promise.all([
      this.formal.generate(input).catch(e => { throw new Error('Formal provider failed: ' + e); }),
      this.marketing.generate(input).catch(e => { throw new Error('Marketing provider failed: ' + e); }),
      this.social.generate(input).catch(e => { throw new Error('Social provider failed: ' + e); })
    ]);
    return {
      ...formal,
      ...marketing,
      ...social
    };
  }
}
