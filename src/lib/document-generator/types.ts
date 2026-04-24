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
  /**
   * 周邊行情人工資料（external-market-lookup change）。
   * 系統 SHALL NOT 自動產生此欄位內容，僅引用業務在 supplementary 頁填寫的摘要與上傳的截圖路徑。
   */
  market_research?: {
    summary: string | null;
    attachments: string[];
  };
}

export interface DocumentGenerator {
  generate(input: DocumentGeneratorInput): Promise<GeneratedDocuments>;
  generateSingle(input: DocumentGeneratorInput, type: keyof GeneratedDocuments): Promise<string>;
}
