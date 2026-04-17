import { PropertyType } from '../property-types';

export interface GeneratedDocuments {
  property_survey: string;      // 物調表 MD
  listing_591: string;          // 591 PO 文 MD
  sales_dm: string;             // 銷售 DM 文案 MD
  social_posts: string;         // FB 5 平台貼文 + 圖片提示詞 MD（單一字串，含全部平台）
  disclosure_document: string;  // 不動產說明書（PDF，Phase 2 任務 10 實作，目前 placeholder）
}

export interface DocumentGeneratorInput {
  property_type: PropertyType;
  field_visit_data: Record<string, unknown>;
  supplementary_data: Record<string, unknown>;
}

export interface DocumentGenerator {
  generate(input: DocumentGeneratorInput): Promise<GeneratedDocuments>;
}
