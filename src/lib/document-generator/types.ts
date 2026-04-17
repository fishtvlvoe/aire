import { PropertyType } from '../property-types';

export interface GeneratedDocuments {
  disclosure_document: string;
  property_survey: string;
  listing_591: string;
  sales_dm: string;
  social_posts: {
    facebook: string;
    instagram: string;
    threads: string;
    tiktok: string;
    youtube: string;
  };
  short_video_script: string;
  property_dossier: string;
}

export interface DocumentGeneratorInput {
  property_type: PropertyType;
  field_visit_data: Record<string, unknown>;
  supplementary_data: Record<string, unknown>;
}

export interface DocumentGenerator {
  generate(input: DocumentGeneratorInput): Promise<GeneratedDocuments>;
}
