"use client";

import { useSearchParams } from "next/navigation";
import {
  getEntitlementFeatures,
  getPdfAssetSlots,
  getUpgradePlans,
} from "@/lib/product-ui-demo-alignment";
import { LandApiSection } from "@/components/settings/LandApiSection";
import { BalanceMonitor } from "@/components/BalanceMonitor";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const features = getEntitlementFeatures();
  const slots = getPdfAssetSlots();
  const plans = getUpgradePlans();
  const selectedSection = searchParams?.get("section") ?? "profile";
  const isLandDataPage = selectedSection === "registry-rules" || selectedSection === "billing";
  const pageTitle = selectedSection === "registry-rules"
    ? "資料來源"
    : selectedSection === "billing"
      ? "費用紀錄"
      : selectedSection === "registry-auth"
        ? "地政授權"
        : selectedSection === "plans"
          ? "方案與升級"
          : selectedSection === "pdf-assets"
            ? "PDF 圖資欄位"
            : "個人設定";
  const pageDescription = selectedSection === "registry-rules"
    ? "查看地政資料可帶入、不可查與需要人工補件的邊界。"
    : selectedSection === "billing"
      ? "查看地政查詢費用、失敗不計費原因與帳務歸屬。"
      : selectedSection === "plans"
        ? "目前方案、可用功能與升級入口集中在這裡。"
        : selectedSection === "registry-auth"
          ? "管理客戶自己的地政查詢帳號與連線測試。"
          : "管理帳號、授權、密碼、品牌色與近期操作。";

  return (
    <div className="space-y-6">
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
        <section className="rounded-lg border bg-white p-4 shadow-sm" aria-label={pageTitle}>
          {selectedSection === "profile" || !isKnownSettingsSection(selectedSection) ? <ProfileSettingsPanel /> : null}
          {selectedSection === "registry-auth" ? <LandApiSection /> : null}
          {selectedSection === "plans" ? <PlansAndUpgradePanel features={features} plans={plans} /> : null}
          {selectedSection === "pdf-assets" ? <PdfAssetPanel slots={slots} /> : null}
        </section>
      )}
    </div>
  );
}

function isKnownSettingsSection(section: string) {
  return [
    "profile",
    "registry-rules",
    "billing",
    "pdf-assets",
    "registry-auth",
    "plans",
  ].includes(section);
}

function ProfileSettingsPanel() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <article className="rounded-lg border p-4">
        <h2 className="text-base font-semibold">帳號與授權管理</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <SettingKv label="目前方案" value="基本款" />
          <SettingKv label="授權狀態" value="測試版已啟用" />
          <SettingKv label="裝置" value="本機 AIRE 桌面 App" />
        </dl>
      </article>
      <article className="rounded-lg border p-4">
        <h2 className="text-base font-semibold">更新密碼</h2>
        <p className="mt-2 text-sm text-muted-foreground">管理登入密碼與 PDF 開啟密碼；正式版會依角色限制可見範圍。</p>
        <button className="mt-4 rounded-md border px-3 py-2 text-sm" type="button">更新密碼</button>
      </article>
      <article className="rounded-lg border p-4">
        <h2 className="text-base font-semibold">個人名稱與 Email</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <SettingKv label="名稱" value="余啟彰" />
          <SettingKv label="Email" value="fish.myfb@gmail.com" />
        </dl>
      </article>
      <article className="rounded-lg border p-4">
        <h2 className="text-base font-semibold">品牌色</h2>
        <div className="mt-3 flex items-center gap-3 text-sm">
          <span className="h-8 w-8 rounded-full bg-teal-700" aria-label="目前品牌色" />
          <span className="text-muted-foreground">目前使用 AIRE 深綠品牌色</span>
        </div>
      </article>
      <article className="rounded-lg border p-4 xl:col-span-2">
        <h2 className="text-base font-semibold">目前操作紀錄</h2>
        <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
          <div className="rounded-md bg-slate-50 p-3">最近建立案件：勝利小屋</div>
          <div className="rounded-md bg-slate-50 p-3">最近地政查詢：測試資料</div>
          <div className="rounded-md bg-slate-50 p-3">最近匯出：尚未匯出</div>
        </div>
      </article>
    </div>
  );
}

function PlansAndUpgradePanel({
  features,
  plans,
}: {
  features: ReturnType<typeof getEntitlementFeatures>;
  plans: ReturnType<typeof getUpgradePlans>;
}) {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-3" aria-label="方案卡片">
        {plans.map((plan) => (
          <article
            key={plan.id}
            className={`rounded-lg border p-5 ${plan.current ? "border-blue-600 shadow-sm" : "border-slate-200"}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${plan.current ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                {plan.badge}
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold">{plan.priceLabel}</p>
            <p className="mt-3 min-h-12 text-sm text-muted-foreground">{plan.description}</p>
            <button
              type="button"
              className={`mt-5 w-full rounded-md px-3 py-2 text-sm font-medium ${
                plan.current ? "border text-muted-foreground" : "bg-blue-600 text-white"
              }`}
              onClick={() => {
                if (!plan.current) window.open("https://opcos.me", "_blank", "noopener,noreferrer");
              }}
            >
              {plan.ctaLabel}
            </button>
            <ul className="mt-5 space-y-2 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span aria-hidden="true">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section>
        <h2 className="text-base font-semibold">測試版可用功能</h2>
        <p className="text-sm text-muted-foreground">測試版本先開啟可驗收功能；正式版會依方案控管。</p>
        <div className="mt-4 divide-y rounded-lg border">
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
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                feature.enabled ? "bg-teal-700" : "bg-slate-300"
              } disabled:bg-slate-300`}
            >
              <span
                className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  feature.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
        </div>
      </section>
    </div>
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
