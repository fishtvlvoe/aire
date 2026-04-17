import type { DocumentGenerator, DocumentGeneratorInput, GeneratedDocuments } from './types';
import { generateSurvey } from './md/survey';
import { generateListing591 } from './md/listing591';
import { generateDm } from './md/dm';
import { generateSocialPosts } from './md/social';
import { generateBuildingDossier } from './pdf/dossier-building';
import { generateLandDossier } from './pdf/dossier-land';

const LAND_PROPERTY_TYPES = new Set([
  '農地',
  '建地',
  '商業地',
  '工業地',
  '鄉村區建地',
  '其他土地',
]);

export function isLandType(propertyType: string): boolean {
  return LAND_PROPERTY_TYPES.has(propertyType);
}

export class CodexDocumentGenerator implements DocumentGenerator {
  async generate(input: DocumentGeneratorInput): Promise<GeneratedDocuments> {
    const [property_survey, listing_591, sales_dm, social_posts, disclosure_document] =
      await Promise.all([
        generateSurvey(input),
        generateListing591(input),
        generateDm(input),
        generateSocialPosts(input),
        isLandType(input.property_type)
          ? generateLandDossier(input)
          : generateBuildingDossier(input),
      ]);

    return {
      property_survey,
      listing_591,
      sales_dm,
      social_posts,
      disclosure_document,
    };
  }
}
