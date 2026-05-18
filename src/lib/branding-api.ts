import { safeInvoke } from "@/lib/tauri-bridge";

export interface BrandTextSettings {
  agent_name?: string;
  agent_cert_no?: string;
  company_name?: string;
  company_license_no?: string;
  company_address?: string;
  company_phone?: string;
  realtor_name?: string;
}

export const brandingApi = {
  getBrandText: (): Promise<BrandTextSettings> =>
    safeInvoke<BrandTextSettings>("get_brand_text_settings"),

  saveBrandText: (settings: BrandTextSettings): Promise<void> =>
    safeInvoke<void>("save_brand_text_settings", { settings }),
};
