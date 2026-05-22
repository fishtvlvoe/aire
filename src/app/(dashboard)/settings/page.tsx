"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  type EntitlementFeature,
  getEntitlementFeatures,
  getPdfAssetSlots,
  getUpgradePlans,
} from "@/lib/product-ui-demo-alignment";
import { LandApiSection } from "@/components/settings/LandApiSection";
import { BalanceMonitor } from "@/components/BalanceMonitor";
import { listBillingEntries, type BillingLineItem } from "@/lib/land-registry-api";
import { mockInvoke } from "@/lib/mock-backend";

type SessionResponse =
  | { authenticated: true; user: { email: string; role: "admin" | "user" } }
  | { authenticated: false; user: null };

type FeatureFlag = {
  id: string;
  name: string;
  enabled: boolean;
};

type ProfileSettingsResponse = {
  name: string;
  email: string;
  brandColor: string;
  logoName: string;
  passwordUpdatedAt: string | null;
};

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
          : "管理個人名稱、Email、密碼、品牌色與 Logo。";

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
  const [name, setName] = useState("余啟彰");
  const [email, setEmail] = useState("fish.myfb@gmail.com");
  const [brandColor, setBrandColor] = useState("#174d36");
  const [logoName, setLogoName] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [brandSaved, setBrandSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const profile = await mockInvoke<ProfileSettingsResponse>("get_profile_settings");
        if (cancelled) return;
        setName(profile.name);
        setEmail(profile.email);
        setBrandColor(profile.brandColor);
        setLogoName(profile.logoName);
      } catch {
        // Keep defaults when profile persistence is unavailable.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveProfileSettings(next?: Partial<ProfileSettingsResponse>) {
    const payload = {
      name: next?.name ?? name,
      email: next?.email ?? email,
      brandColor: next?.brandColor ?? brandColor,
      logoName: next?.logoName ?? logoName,
    };
    await mockInvoke("save_profile_settings", payload);
    return payload;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <form
        className="rounded-lg border p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void (async () => {
            await saveProfileSettings();
            setProfileSaved(true);
          })();
        }}
      >
        <h2 className="text-base font-semibold">個人名稱與 Email</h2>
        <div className="mt-3 grid gap-3 text-sm">
          <label>
            <span className="font-medium">名稱</span>
            <input
              className="mt-1 min-h-10 w-full rounded-md border px-3 py-2"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-label="個人名稱"
            />
          </label>
          <label>
            <span className="font-medium">Email</span>
            <input
              className="mt-1 min-h-10 w-full rounded-md border px-3 py-2"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-label="Email"
            />
          </label>
        </div>
        <button className="mt-4 rounded-md bg-slate-950 px-3 py-2 text-sm text-white" type="submit">
          儲存個人資料
        </button>
        {profileSaved ? <p className="mt-2 text-sm font-medium text-emerald-700">個人資料已儲存</p> : null}
      </form>

      <form
        className="rounded-lg border p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void (async () => {
            const result = await mockInvoke<{ success: true; passwordUpdatedAt: string }>(
              "update_profile_password",
              {
                currentPassword,
                newPassword,
              },
            );
            if (result.success) {
              setCurrentPassword("");
              setNewPassword("");
              setPasswordSaved(true);
            }
          })();
        }}
      >
        <h2 className="text-base font-semibold">更新密碼</h2>
        <p className="mt-2 text-sm text-muted-foreground">用於登入 AIRE 與開啟加密 PDF。</p>
        <div className="mt-3 grid gap-3 text-sm">
          <label>
            <span className="font-medium">目前密碼</span>
            <input
              className="mt-1 min-h-10 w-full rounded-md border px-3 py-2"
              type="password"
              aria-label="目前密碼"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>
          <label>
            <span className="font-medium">新密碼</span>
            <input
              className="mt-1 min-h-10 w-full rounded-md border px-3 py-2"
              type="password"
              aria-label="新密碼"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>
        </div>
        <button className="mt-4 rounded-md border px-3 py-2 text-sm" type="submit">更新密碼</button>
        {passwordSaved ? <p className="mt-2 text-sm font-medium text-emerald-700">密碼已更新</p> : null}
      </form>

      <form
        className="rounded-lg border p-4 xl:col-span-2"
        onSubmit={(event) => {
          event.preventDefault();
          void (async () => {
            await saveProfileSettings();
            setBrandSaved(true);
          })();
        }}
      >
        <h2 className="text-base font-semibold">品牌色與 Logo</h2>
        <p className="mt-2 text-sm text-muted-foreground">會套用在 PDF 封面、頁首與系統識別。</p>
        <div className="mt-3 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
          <label className="text-sm">
            <span className="font-medium">品牌色</span>
            <div className="mt-2 flex items-center gap-3">
              <input
                className="h-10 w-14 rounded-md border"
                type="color"
                value={brandColor}
                onChange={(event) => setBrandColor(event.target.value)}
                aria-label="品牌色"
              />
              <span className="text-muted-foreground">{brandColor}</span>
            </div>
          </label>
          <label className="text-sm">
            <span className="font-medium">品牌 Logo</span>
            <input
              className="mt-2 block w-full text-sm"
              type="file"
              accept="image/*"
              aria-label="品牌 Logo 上傳"
              onChange={(event) => setLogoName(event.currentTarget.files?.[0]?.name ?? "")}
            />
            <span className="mt-2 block text-xs text-muted-foreground">
              {logoName ? `已選擇：${logoName}` : "尚未上傳"}
            </span>
          </label>
        </div>
        <button className="mt-4 rounded-md border px-3 py-2 text-sm" type="submit">儲存品牌設定</button>
        {brandSaved ? <p className="mt-2 text-sm font-medium text-emerald-700">品牌設定已儲存</p> : null}
      </form>
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
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [featureStates, setFeatureStates] = useState(() => getFeatureStates(features, []));

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [session, flags] = await Promise.all([
          mockInvoke<SessionResponse>("get_session"),
          mockInvoke<FeatureFlag[]>("get_feature_flags"),
        ]);
        if (cancelled) return;
        const canToggle = Boolean(session.authenticated && session.user.role === "admin");
        setIsSuperAdmin(canToggle);
        setFeatureStates(getFeatureStates(features, canToggle ? flags : []));
      } catch {
        if (cancelled) return;
        setIsSuperAdmin(false);
        setFeatureStates(getFeatureStates(features, []));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [features]);

  async function toggleFeature(feature: EntitlementFeature) {
    if (!isSuperAdmin) return;
    const res = await mockInvoke<{ success: true; enabled: boolean }>("toggle_feature_flag", {
      id: feature.id,
    });
    setFeatureStates((prev) =>
      prev.map((row) =>
        row.id === feature.id
          ? {
              ...row,
              enabled: res.enabled,
              description: res.enabled ? "已啟用" : "未啟用",
              ariaLabel: `${row.label}${res.enabled ? "已啟用" : "未啟用"}`,
            }
          : row,
      ),
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border p-4" aria-label="帳號與授權管理">
        <h2 className="text-base font-semibold">帳號與授權管理</h2>
        <dl className="mt-3 grid gap-2 text-sm md:grid-cols-3">
          <SettingKv label="目前方案" value="基本款" />
          <SettingKv label="授權狀態" value="測試版已啟用" />
          <SettingKv label="裝置" value="本機 AIRE 桌面 App" />
        </dl>
      </section>

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
        <h2 className="text-base font-semibold">預留功能</h2>
        <p className="text-sm text-muted-foreground">目前正在開發中。</p>
        <div className="mt-4 divide-y rounded-lg border">
          {featureStates.map((feature) => (
            <div key={feature.label} className="flex items-center justify-between gap-4 p-4">
              <div>
                <strong>{feature.label}</strong>
                <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {feature.description}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-label={feature.ariaLabel}
                aria-checked={feature.enabled}
                disabled={!isSuperAdmin}
                onClick={() => {
                  void toggleFeature(feature);
                }}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                  feature.enabled ? "bg-teal-700" : "bg-slate-300"
                } disabled:cursor-not-allowed disabled:bg-slate-300`}
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

function getFeatureStates(features: EntitlementFeature[], flags: FeatureFlag[]) {
  const flagMap = new Map(flags.map((flag) => [flag.id, flag.enabled]));
  return features.map((feature) => ({
    ...feature,
    enabled: flagMap.get(feature.id) ?? false,
    description: flagMap.get(feature.id) ? "已啟用" : "未啟用",
    ariaLabel: `${feature.label}${flagMap.get(feature.id) ? "已啟用" : "未啟用"}`,
  }));
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
          <SettingKv label="AIRE 方案功能" value="Google、空拍、AI 格局圖不列入地政 API 明細" />
          <SettingKv label="失敗不計費" value="地政查詢失敗時在費用紀錄標示 0 元" />
        </dl>
      </article>
      <BalanceMonitor />
      <BillingLedgerPanel />
    </div>
  );
}

function BillingLedgerPanel() {
  const [rows, setRows] = useState<BillingLineItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const entries = await listBillingEntries();
        if (!cancelled) setRows(entries);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "無法取得地政 API 查詢明細");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = (rows ?? []).reduce((sum, row) => sum + row.cost, 0);

  return (
    <article className="rounded-lg border p-4 xl:col-span-2">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-base font-semibold">地政 API 查詢明細</h2>
          <p className="text-sm text-muted-foreground">只列地政查詢扣款；AIRE 方案功能費用不放在這張表。</p>
        </div>
        <strong className="text-sm">地政費用合計 {total} 元</strong>
      </div>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {!rows && !error ? <p className="mt-3 text-sm text-muted-foreground">載入查詢明細中…</p> : null}
      {rows ? (
        <div className="mt-3 overflow-hidden rounded-lg border">
          <div className="grid grid-cols-[1.2fr_1.4fr_90px_1fr_80px] gap-3 border-b bg-slate-50 px-3 py-2 text-sm font-medium text-muted-foreground max-lg:hidden">
            <span>服務</span>
            <span>查詢目標</span>
            <span>狀態</span>
            <span>交易序號</span>
            <span className="text-right">費用</span>
          </div>
          {rows.map((row) => (
            <div key={`${row.transaction_id}-${row.service_name}`} className="grid gap-2 border-b px-3 py-3 text-sm last:border-b-0 lg:grid-cols-[1.2fr_1.4fr_90px_1fr_80px]">
              <span className="font-medium">{row.service_name}</span>
              <span>{row.target}</span>
              <span>{row.status_label}</span>
              <span className="truncate text-muted-foreground">{row.transaction_id}</span>
              <strong className="text-right">{row.cost} 元</strong>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function PdfAssetPanel({ slots }: { slots: ReturnType<typeof getPdfAssetSlots> }) {
  const [selectedFiles, setSelectedFiles] = useState<Record<string, string>>({});

  return (
    <article className="rounded-lg border p-4 xl:col-span-2">
      <h2 className="text-base font-semibold">PDF 圖資欄位</h2>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {slots.map((slot) => (
          <label key={slot.label} className="rounded-md bg-slate-50 p-3 text-sm">
            <strong>{slot.label}</strong>
            <span className="mt-1 block text-muted-foreground">{slot.description}</span>
            <span className="mt-1 block">{slot.basicFallback}</span>
            <span className="mt-1 block text-muted-foreground">{slot.upgradeAutomation}</span>
            <input
              className="mt-3 block w-full text-xs"
              type="file"
              accept="image/*,.pdf"
              aria-label={`${slot.label}上傳`}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) setSelectedFiles((prev) => ({ ...prev, [slot.label]: file.name }));
              }}
            />
            <span className="mt-2 block text-xs text-muted-foreground">
              {selectedFiles[slot.label] ? `已選擇：${selectedFiles[slot.label]}` : "尚未上傳"}
            </span>
          </label>
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
