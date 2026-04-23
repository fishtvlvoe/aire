import type { PropertyType } from '../property-types';
import type { DocumentGenerator, DocumentGeneratorInput, GeneratedDocuments } from './types';
import { generateSurvey } from './md/survey';
import { generateListing591 } from './md/listing591';
import { generateDm } from './md/dm';
import { generateSocialPosts } from './md/social';
import { generateBuildingDossier } from './pdf/dossier-building';
import { generateLandDossier } from './pdf/dossier-land';

const LAND_PROPERTY_TYPES: ReadonlySet<PropertyType> = new Set<PropertyType>([
  'farmland',
  'residential-land',
  'commercial-land',
  'industrial-land',
  'rural-land',
  'other-land',
]);

export function isLandType(propertyType: string): boolean {
  return LAND_PROPERTY_TYPES.has(propertyType as PropertyType);
}

export class CodexDocumentGenerator implements DocumentGenerator {
  async generateSingle(input: DocumentGeneratorInput, type: keyof GeneratedDocuments): Promise<string> {
    switch (type) {
      case 'property_survey':
        return generateSurvey(input);
      case 'listing_591':
        return generateListing591(input);
      case 'sales_dm':
        return generateDm(input);
      case 'social_posts':
        return generateSocialPosts(input);
      case 'disclosure_document':
        return isLandType(input.property_type)
          ? generateLandDossier(input)
          : generateBuildingDossier(input);
      default: {
        const _exhaustive: never = type;
        throw new Error(`Unsupported document type: ${_exhaustive}`);
      }
    }
  }

  async generate(input: DocumentGeneratorInput): Promise<GeneratedDocuments> {
    const [property_survey, listing_591, sales_dm, social_posts, disclosure_document] =
      await Promise.all([
        this.generateSingle(input, 'property_survey'),
        this.generateSingle(input, 'listing_591'),
        this.generateSingle(input, 'sales_dm'),
        this.generateSingle(input, 'social_posts'),
        this.generateSingle(input, 'disclosure_document'),
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
