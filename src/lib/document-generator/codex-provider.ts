import type { DocumentGenerator, DocumentGeneratorInput, GeneratedDocuments } from './types';
import { generateSurvey } from './md/survey';
import { generateListing591 } from './md/listing591';
import { generateDm } from './md/dm';
import { generateSocialPosts } from './md/social';

export class CodexDocumentGenerator implements DocumentGenerator {
  async generate(input: DocumentGeneratorInput): Promise<GeneratedDocuments> {
    const [property_survey, listing_591, sales_dm, social_posts] = await Promise.all([
      generateSurvey(input),
      generateListing591(input),
      generateDm(input),
      generateSocialPosts(input),
    ]);

    return {
      property_survey,
      listing_591,
      sales_dm,
      social_posts,
      disclosure_document: '[PDF 由任務 10 實作]',
    };
  }
}
