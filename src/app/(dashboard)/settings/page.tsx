"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getEntitlementFeatures,
  getPdfAssetSlots,
  getSettingsCategories,
} from "@/lib/product-ui-demo-alignment";
import { SettingsTabs } from "@/components/SettingsTabs";
import { LandApiSection } from "@/components/settings/LandApiSection";
import { LicenseSection } from "@/components/settings/LicenseSection";
import { PremiumUnlockSection } from "@/components/settings/PremiumUnlockSection";
import { DevSuperAdmin } from "@/components/settings/DevSuperAdmin";
import { BalanceMonitor } from "@/components/BalanceMonitor";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const categories = getSettingsCategories();
  const features = getEntitlementFeatures();
  const slots = getPdfAssetSlots();
  const selectedSection = searchParams?.get("section") ?? "entitlements";
  const selectedCategory = categories.find((category) => category.id === selectedSection);
  const isLandDataPage = selectedSection === "registry-rules" || selectedSection === "billing";
  const pageTitle = selectedSection === "registry-rules"
    ? "資料來源"
    : selectedSection === "billing"
      ? "費用紀錄"
      : selectedSection === "registry-auth"
        ? "地政授權"
        : selectedSection === "features"
          ? "功能開關"
          : selectedSection === "pdf-assets"
            ? "PDF 圖資欄位"
            : "系統設定";
  const pageDescription = selectedSection === "registry-rules"
    ? "查看地政資料可帶入、不可查與需要人工補件的邊界。"
    : selectedSection === "billing"
      ? "查看地政查詢費用、失敗不計費原因與帳務歸屬。"
      : "一次性規則、授權、費用歸屬與升級功能集中在這裡管理";

  return (
    <div className="space-y-6">
      {!isLandDataPage && !searchParams?.get("section") ? <SettingsTabs /> : null}

      <header className="flex flex-col gap-2 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          {isLandDataPage ? <p className="text-sm text-muted-foreground">地政資料</p> : null}
          <h1 className="text-2xl font-semibold tracking-normal">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground">{pageDescription}</p>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-medium">基本方案</span>
      </header>

      {isLandDataPage ? (
        <LandDataSection section={selectedSection} slots={slots} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold">設定分類</h2>
            <p className="text-sm text-muted-foreground">只顯示目前設定項目</p>
            <div className="mt-4 grid gap-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  className={`rounded-md px-3 py-2 text-left text-sm ${
                    category.id === selectedSection ? "bg-slate-950 text-white" : "border"
                  }`}
                  href={`/settings?section=${category.id}`}
                >
                  {category.label}
                </Link>
              ))}
            </div>
          </aside>

          <section className="rounded-lg border bg-white p-4 shadow-sm" aria-label={selectedCategory?.label ?? "設定內容"}>
            {selectedSection === "registry-auth" ? <LandApiSection /> : null}
            {selectedSection === "features" ? (
              <div className="space-y-4">
                <FeatureTogglePanel features={features} />
                <DevSuperAdmin />
              </div>
            ) : null}
            {selectedSection === "pdf-assets" ? <PdfAssetPanel slots={slots} /> : null}
            {selectedSection === "billing" ? <BillingPanel /> : null}
            {selectedSection === "registry-rules" ? <RegistryRulesPanel /> : null}
            {selectedSection === "entitlements" || !selectedCategory ? (
              <div className="space-y-5">
                <FeatureTogglePanel features={features} />
                <section className="grid gap-4 xl:grid-cols-2" aria-label="授權與升級管理">
                  <LicenseSection />
                  <PremiumUnlockSection />
                </section>
              </div>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}

function FeatureTogglePanel({ features }: { features: ReturnType<typeof getEntitlementFeatures> }) {
  return (
    <section>
      <div>
        <h2 className="text-base font-semibold">授權與升級</h2>
        <p className="text-sm text-muted-foreground">
          未升級灰色鎖定；已升級後可開啟或關閉本機功能
        </p>
      </div>

      <div className="mt-5 divide-y rounded-lg border">
        {features.map((feature) => (
          <div key={feature.label} className="flex items-center justify-between gap-4 p-4">
            <div>
              <strong>{feature.label}</strong>
              <span className="mt-1 block text-sm text-muted-foreground">{feature.description}</span>
            </div>
            <button
              type="button"
              aria-label={feature.ariaLabel}
              disabled={!feature.upgraded}
              className={`relative h-8 w-14 rounded-full transition-colors ${
                feature.enabled ? "bg-teal-700" : "bg-slate-300"
              } disabled:bg-slate-300`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  feature.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function LandDataSection({ section, slots }: { section: string; slots: ReturnType<typeof getPdfAssetSlots> }) {
  if (section === "billing") return <BillingPanel />;
  return <RegistryRulesPanel slots={slots} />;
}

function RegistryRulesPanel({ slots = [] }: { slots?: ReturnType<typeof getPdfAssetSlots> }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <article className="rounded-lg border border-amber-200 bg-amber-50/70 p-4">
        <h2 className="text-base font-semibold">屋主資料邊界</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <SettingKv label="可自動帶入" value="權利範圍、登記日期、登記原因、所有權登記次序" />
          <SettingKv label="不可反查" value="私人屋主姓名、身分證、私人地址" />
          <SettingKv label="可用來源" value="屋主提供、正式謄本帶入、人工輸入" />
          <SettingKv label="比對服務" value="所有權人比對服務只能拿已知姓名驗證是否符合" />
        </dl>
      </article>
      <article className="rounded-lg border p-4">
        <h2 className="text-base font-semibold">地政資料來源</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <SettingKv label="建物資料" value="建物標示、建物所有權、登記日期與權利範圍" />
          <SettingKv label="土地資料" value="土地標示、地號、地籍圖與謄本欄位" />
          <SettingKv label="門牌資料" value="門牌與建號比對，查不到時進補件" />
          <SettingKv label="缺口處理" value="未串接或不可查欄位只列為補件，不在工作台偽裝完成" />
        </dl>
      </article>
      {slots.length > 0 ? <PdfAssetPanel slots={slots} /> : null}
    </div>
  );
}

function BillingPanel() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <article className="rounded-lg border p-4">
        <h2 className="text-base font-semibold">費用歸屬</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <SettingKv label="地政查詢" value="客戶自己的地政查詢帳號負擔" />
          <SettingKv label="Google / 空拍" value="AIRE 方案內含或另計" />
          <SettingKv label="AI 格局圖" value="AIRE 升級功能，案件資料不送 OPCOS" />
          <SettingKv label="失敗不計費" value="地政查詢失敗時在費用紀錄標示 0 元" />
        </dl>
      </article>
      <BalanceMonitor />
    </div>
  );
}

function PdfAssetPanel({ slots }: { slots: ReturnType<typeof getPdfAssetSlots> }) {
  return (
    <article className="rounded-lg border p-4 xl:col-span-2">
      <h2 className="text-base font-semibold">PDF 圖資欄位</h2>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {slots.map((slot) => (
          <div key={slot.label} className="rounded-md bg-slate-50 p-3 text-sm">
            <strong>{slot.label}</strong>
            <span className="mt-1 block text-muted-foreground">{slot.description}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function SettingKv({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-black/5 pb-2 last:border-b-0 md:grid-cols-[110px_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
