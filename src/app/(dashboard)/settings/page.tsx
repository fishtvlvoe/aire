"use client";

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

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const categories = getSettingsCategories();
  const features = getEntitlementFeatures();
  const slots = getPdfAssetSlots();
  const selectedSection = searchParams?.get("section") ?? "entitlements";

  return (
    <div className="space-y-6">
      <SettingsTabs />

      <header className="flex flex-col gap-2 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">系統設定</h1>
          <p className="text-sm text-muted-foreground">
            一次性規則、授權、費用歸屬與升級功能集中在這裡管理
          </p>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-medium">基本方案</span>
      </header>

      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold">設定分類</h2>
          <p className="text-sm text-muted-foreground">不放在每個案件工作頁</p>
          <div className="mt-4 grid gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`rounded-md px-3 py-2 text-left text-sm ${
                  category.id === selectedSection ? "bg-slate-950 text-white" : "border"
                }`}
                type="button"
              >
                {category.label}
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-lg border bg-white p-4 shadow-sm">
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

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <article className="rounded-lg border border-amber-200 bg-amber-50/70 p-4">
              <h3 className="font-semibold">屋主資料邊界</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <SettingKv label="可自動帶入" value="權利範圍、登記日期、登記原因、所有權登記次序" />
                <SettingKv label="不可反查" value="私人屋主姓名、身分證、私人地址" />
                <SettingKv label="可用來源" value="屋主提供、正式謄本帶入、人工輸入" />
                <SettingKv label="比對服務" value="所有權人比對服務只能拿已知姓名驗證是否符合" />
              </dl>
            </article>

            <article className="rounded-lg border p-4">
              <h3 className="font-semibold">費用歸屬</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <SettingKv label="地政查詢" value="客戶自己的地政查詢帳號負擔" />
                <SettingKv label="Google / 空拍" value="AIRE 方案內含或另計" />
                <SettingKv label="AI 格局圖" value="AIRE 升級功能，案件資料不送 OPCOS" />
                <SettingKv label="失敗不計費" value="地政查詢失敗時在費用紀錄標示 0 元" />
              </dl>
            </article>

            <article className="rounded-lg border p-4 xl:col-span-2">
              <h3 className="font-semibold">PDF 圖資欄位</h3>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {slots.map((slot) => (
                  <div key={slot.label} className="rounded-md bg-slate-50 p-3 text-sm">
                    <strong>{slot.label}</strong>
                    <span className="mt-1 block text-muted-foreground">{slot.description}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      </div>

      <section className="grid gap-4 xl:grid-cols-2" aria-label="後端授權與管理">
        <LicenseSection />
        <LandApiSection />
        <PremiumUnlockSection />
        <DevSuperAdmin />
      </section>
    </div>
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
