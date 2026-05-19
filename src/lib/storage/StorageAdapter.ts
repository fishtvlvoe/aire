export interface BrandingData {
  agentName?: string;
  companyName?: string;
  agentCertNo?: string;
  companyLicenseNo?: string;
  companyAddress?: string;
  companyPhone?: string;
  realtorName?: string;
}

export interface DisclosureData {
  conditionLeakage: boolean;
  conditionRenovation: boolean;
  conditionIllegalStructure: boolean;
  [key: string]: boolean;
}

export interface KeyinData {
  savedAt: string;
  [fieldName: string]: string | boolean | number;
}

export interface AppSettings {
  landApi: {
    clientId: string;
    secret: string;
  };
}

export interface StorageAdapter {
  getBranding(): Promise<BrandingData | null>;
  saveBranding(data: BrandingData): Promise<void>;

  getCaseDisclosures(caseId: string): Promise<DisclosureData | null>;
  saveCaseDisclosures(caseId: string, data: DisclosureData): Promise<void>;

  getKeyinData(caseId: string): Promise<KeyinData | null>;
  saveKeyinData(caseId: string, data: KeyinData): Promise<void>;

  getAppSettings(): Promise<AppSettings>;
  saveAppSettings(settings: AppSettings): Promise<void>;
}
