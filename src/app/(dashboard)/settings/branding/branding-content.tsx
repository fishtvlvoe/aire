"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { LogoUploader } from "@/components/LogoUploader";
import { TauriRequired } from "@/components/TauriRequired";
import { ThemeSelector } from "@/components/ThemeSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brandingApi, type BrandTextSettings } from "@/lib/branding-api";
import { ThemeProvider } from "@/lib/pdf-themes/theme-provider";
import { isTauriEnv } from "@/lib/tauri-bridge";

function BrandTextForm() {
  const { register, handleSubmit, reset } = useForm<BrandTextSettings>();

  useEffect(() => {
    brandingApi.getBrandText().then((data) => reset(data)).catch(() => null);
  }, [reset]);

  async function onSubmit(values: BrandTextSettings) {
    try {
      await brandingApi.saveBrandText(values);
      toast.success("品牌資訊已儲存");
    } catch {
      toast.error("儲存失敗，請重試");
    }
  }

  const FIELDS: { key: keyof BrandTextSettings; label: string }[] = [
    { key: "agent_name", label: "業務員姓名" },
    { key: "agent_cert_no", label: "業務員證號" },
    { key: "company_name", label: "公司名稱" },
    { key: "company_license_no", label: "公司牌照號" },
    { key: "company_address", label: "公司地址" },
    { key: "company_phone", label: "公司電話" },
    { key: "realtor_name", label: "不動產經紀人" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-lg font-medium">品牌文字資訊</h3>
      {FIELDS.map(({ key, label }) => (
        <div key={key} className="space-y-1.5">
          <Label htmlFor={`brand-${key}`}>{label}</Label>
          <Input id={`brand-${key}`} {...register(key)} />
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
          <h2 className="text-2xl font-semibold">品牌設定</h2>
          <p className="text-sm text-muted-foreground">
            上傳公司 Logo 並切換 PDF 主題風格。
          </p>
        </header>

        <LogoUploader />
        <ThemeSelector />
        <BrandTextForm />
      </div>
    </ThemeProvider>
  );
}
