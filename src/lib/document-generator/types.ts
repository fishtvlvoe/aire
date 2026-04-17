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
}

export interface DocumentGeneratorInput {
  property_type: 'residential' | 'farmland';
  field_visit_data: Record<string, unknown>;
  supplementary_data: Record<string, unknown>;
}

export interface DocumentGenerator {
  generate(input: DocumentGeneratorInput): Promise<GeneratedDocuments>;
}

// --- Tri-provider interfaces ---
export interface FormalDocumentGenerator {
  generate(input: DocumentGeneratorInput): Promise<Pick<GeneratedDocuments, 'disclosure_document' | 'property_survey'>>;
}

export interface MarketingDocumentGenerator {
  generate(input: DocumentGeneratorInput): Promise<Pick<GeneratedDocuments, 'listing_591' | 'sales_dm'>>;
}

export interface SocialDocumentGenerator {
  generate(input: DocumentGeneratorInput): Promise<Pick<GeneratedDocuments, 'social_posts' | 'short_video_script'>>;
}
