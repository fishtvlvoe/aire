"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { LogoUploader } from "@/components/LogoUploader";
import { TauriRequired } from "@/components/TauriRequired";
import { ThemeSelector } from "@/components/ThemeSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brandingApi } from "@/lib/branding-api";
import type { BrandTextSettings } from "@/lib/branding-api";
import { storage } from "@/lib/storage";
import { ThemeProvider } from "@/lib/pdf-themes/theme-provider";
import { isTauriEnv } from "@/lib/tauri-bridge";

function BrandTextForm() {
  const { register, handleSubmit, reset } = useForm<BrandTextSettings>();
  const hasUserEdited = useRef(false);

  function hasBrandText(values: BrandTextSettings | null | undefined) {
    return Boolean(values && Object.values(values).some((value) => value?.trim()));
  }

  function toStorageFormat(values: BrandTextSettings) {
    return {
      agentName: values.agent_name,
      companyName: values.company_name,
      agentCertNo: values.agent_cert_no,
      companyLicenseNo: values.company_license_no,
      companyAddress: values.company_address,
      companyPhone: values.company_phone,
      realtorName: values.realtor_name,
    };
  }

  function fromStorageFormat(data: NonNullable<Awaited<ReturnType<typeof storage.getBranding>>>) {
    return {
      agent_name: data.agentName,
      company_name: data.companyName,
      agent_cert_no: data.agentCertNo,
      company_license_no: data.companyLicenseNo,
      company_address: data.companyAddress,
      company_phone: data.companyPhone,
      realtor_name: data.realtorName,
    };
  }

  useEffect(() => {
    (async () => {
      try {
        const values = await brandingApi.getBrandText();
        if (hasBrandText(values)) {
          if (!hasUserEdited.current) reset(values);
          return;
        }
      } catch {
        // 舊版 browser mock 或未接 IPC 時，改讀相容 storage。
      }

      try {
        const data = await storage.getBranding();
        if (data && !hasUserEdited.current) reset(fromStorageFormat(data));
      } catch {
        // ignore
      }
    })();
  }, [reset]);

  async function onSubmit(values: BrandTextSettings) {
    try {
      await brandingApi.saveBrandText(values);
      await storage.saveBranding(toStorageFormat(values)).catch(() => null);
      toast.success("品牌資訊已儲存");
    } catch {
      toast.error("儲存失敗，請重試");
    }
  }

  const FIELDS: { key: keyof BrandTextSettings; label: string }[] = [
    { key: "agent_name", label: "承辦人" },
    { key: "realtor_name", label: "經紀人" },
    { key: "agent_cert_no", label: "經紀人證號" },
    { key: "company_name", label: "不動產經紀業" },
    { key: "company_license_no", label: "經紀業證號" },
    { key: "company_address", label: "公司地址" },
    { key: "company_phone", label: "公司電話" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-lg font-medium">品牌文字資訊</h3>
      {FIELDS.map(({ key, label }) => (
        <div key={key} className="space-y-1.5">
          <Label htmlFor={`brand-${key}`}>{label}</Label>
          <Input
            id={`brand-${key}`}
            {...register(key, {
              onChange: () => {
                hasUserEdited.current = true;
              },
            })}
          />
        </div>
      ))}
      <Button type="submit">儲存品牌資訊</Button>
    </form>
  );
}

export default function BrandingContent() {
  const isDevelopment = process.env.NODE_ENV === "development";
  const [isLoadingEnv, setIsLoadingEnv] = useState(true);
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const detected = await isTauriEnv();
      if (!mounted) return;
      setIsTauri(detected);
      setIsLoadingEnv(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (isLoadingEnv) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground" role="status">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        偵測桌面環境中…
      </div>
    );
  }

  if (!isTauri && !isDevelopment) {
    return <TauriRequired />;
  }

  return (
    <ThemeProvider initialThemeId="theme-a-minimal">
      <div className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-2xl font-semibold">品牌與交付資訊</h2>
          <p className="text-sm text-muted-foreground">
            設定每份不動產說明書共用的公司、經紀人與承辦資訊。
          </p>
        </header>

        <LogoUploader />
        <ThemeSelector />
        <BrandTextForm />
      </div>
    </ThemeProvider>
  );
}
