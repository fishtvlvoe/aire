import type { TranscriptParseResult } from '@/lib/parsers/transcript-parser';

export interface PropertyDossier {
  id?: string;
  // 基本資訊
  property_type: string;
  address: string;
  total_price: number; // 萬元

  // Nine Area Fields（來自謄本）
  registered_area?: number; // 登記坪數（坪）
  land_area?: number; // 土地面積（平方公尺）
  main_building_area?: number; // 主建物（平方公尺）
  accessory_building_area?: number;
  common_facility_area?: number;
  arcade_area?: number;
  parking_area?: number;
  parking_type?: string;
  parking_space?: string;

  // 公設 Checklist
  public_facilities: PublicFacility[];

  // 稅費（系統計算）
  tax_result?: import('@/lib/scrapers/tax-calculator').TaxResult;
  mortgage_scenarios?: import('@/lib/scrapers/bank-estimator').MortgageScenario[];

  // 謄本解析原始結果
  transcript?: TranscriptParseResult;
}

export type PublicFacility =
  | '游泳池'
  | '健身房'
  | '水療室'
  | '撞球間'
  | '籃球場'
  | '三溫暖'
  | '網球場'
  | '其他';
