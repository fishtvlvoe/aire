import { isTauriEnv, safeInvoke } from "@/lib/tauri-bridge";

export interface BrandTextSettings {
  agent_name?: string;
  agent_cert_no?: string;
  company_name?: string;
  company_license_no?: string;
  company_address?: string;
  company_phone?: string;
  realtor_name?: string;
}

function hasBrandText(settings: BrandTextSettings | null | undefined): boolean {
  return Boolean(settings && Object.values(settings).some((value) => value?.trim()));
}

async function shouldUseWebFallback(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return !(await isTauriEnv());
}

async function fetchWebBrandText(): Promise<BrandTextSettings> {
  const resp = await fetch("/api/branding-text", {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5000),
  });
  if (!resp.ok) return {};
  return (await resp.json()) as BrandTextSettings;
}

async function saveWebBrandText(settings: BrandTextSettings): Promise<void> {
  await fetch("/api/branding-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settings }),
    signal: AbortSignal.timeout(5000),
  });
}

export const brandingApi = {
  getBrandText: async (): Promise<BrandTextSettings> => {
    let settings: BrandTextSettings = {};
    try {
      settings = await safeInvoke<BrandTextSettings>("get_brand_text_settings");
    } catch {
      settings = {};
    }
    if (hasBrandText(settings) || !(await shouldUseWebFallback())) {
      return settings;
    }
    try {
      return await fetchWebBrandText();
    } catch {
      return settings;
    }
  },

  saveBrandText: async (settings: BrandTextSettings): Promise<void> => {
    const useWebFallback = await shouldUseWebFallback();
    try {
      await safeInvoke<void>("save_brand_text_settings", { settings });
    } catch (error) {
      if (!useWebFallback) throw error;
    }
    if (useWebFallback) {
      await saveWebBrandText(settings);
    }
  },
};
