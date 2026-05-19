"use client";

/**
 * 成屋說明書表單（Group 6.2 + 6.4）
 *
 * - 5 個 tab：標示 / 權利 / 稅費 / 現況 / 附件
 * - 用 react-hook-form 管 form state + zodResolver 驗證
 * - Radix Tabs（controlled）切換不重 mount，欄位值保留
 * - useDraftAutosave 1000ms debounce 寫回 SQLite
 * - 初始化呼叫 loadDraft<ResidentialPayload>(caseId) 合併到表單
 * - 「標示為完成」按鈕用 residentialSchemaCompleted 驗證、失敗 inline error
 */

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AutosaveIndicator } from "@/components/ux/AutosaveIndicator";
import {
  residentialFormTabs,
  residentialDefaults,
  residentialSchema,
  residentialSchemaCompleted,
  type ResidentialPayload,
  type FormFieldDef,
} from "@/lib/disclosure-schema-residential";
import { useDraftAutosave, loadDraft } from "@/lib/use-draft-autosave";
import { cn } from "@/lib/utils";
import { RealtorLicenseField } from "@/components/RealtorLicenseField";
import { PullParcelDataButton } from "@/components/PullParcelDataButton";

/**
 * 經紀人證號 + 驗證狀態（#1d Stage 7.3）
 * - 隨 draft autosave 一起寫回 SQLite（payload 額外欄位，schema 未含、不參與 zod 驗證）
 * - verification_status 為 not_found/expired/offline 時，PDF 預覽 / 標示為完成按鈕「不阻擋」（#1d Stage 7.4）
 */
type RealtorLicenseVerificationStatus =
  | "verified"
  | "not_found"
  | "expired"
  | "offline"
  | null;

interface RealtorLicenseDraftSlice {
  realtor_license_number?: string;
  realtor_license_verification_status?: RealtorLicenseVerificationStatus;
}

/** 成屋表單預設查詢的七支地政 API */
const RESIDENTIAL_API_IDS = [
  "building_registry",
  "land_registry",
  "co_owners",
  "land_value",
  "mortgages",
  "building_ownership",
  "zoning",
];

export interface DisclosureFormResidentialProps {
  caseId: string;
  /** 地號（由案件載入，供拉謄本使用） */
  parcelId?: string;
  /** 標示為完成觸發 — 由父層呼 markCompleted IPC */
  onMarkCompleted?: (payload: ResidentialPayload) => Promise<void> | void;
  /**
   * 受控模式（可選）：由外部傳入初始欄位值，mount 後合併至 form state。
   * key 對應 residentialFormTabs 裡的 field.key（即 ResidentialPayload 欄位名稱）。
   * 不傳此 prop 時元件行為與原本完全相同（standalone 獨立模式）。
   */
  initialPayload?: Record<string, unknown>;
  /**
   * 受控模式（可選）：任意欄位值改變時呼叫，傳入所有欄位的當前完整 payload。
   * 不傳此 prop 時不做任何事。
   */
  onChange?: (payload: Record<string, unknown>) => void;
}

export function DisclosureFormResidential({
  caseId,
  parcelId,
  onMarkCompleted,
  initialPayload,
  onChange,
}: DisclosureFormResidentialProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(residentialFormTabs[0]!.id);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  // #1d Stage 7.3 — 經紀人證號 local state（未納入 zod schema，僅進 autosave payload）
  const [realtorLicenseNumber, setRealtorLicenseNumber] = useState<string>("");
  const [realtorLicenseVerificationStatus, setRealtorLicenseVerificationStatus] =
    useState<RealtorLicenseVerificationStatus>(null);

  const form = useForm<ResidentialPayload>({
    resolver: zodResolver(residentialSchema),
    defaultValues: residentialDefaults,
    mode: "onChange",
  });

  // 載入既有草稿
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const existing = await loadDraft<ResidentialPayload & RealtorLicenseDraftSlice>(
        caseId,
      );
      if (cancelled) return;
      if (existing) {
        const {
          realtor_license_number: _rln,
          realtor_license_verification_status: _rls,
          ...formValues
        } = existing as ResidentialPayload & RealtorLicenseDraftSlice;
        form.reset({ ...residentialDefaults, ...(formValues as ResidentialPayload) });
        if (typeof existing.realtor_license_number === "string") {
          setRealtorLicenseNumber(existing.realtor_license_number);
        }
      }
      setDraftLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
    // 故意只在 caseId 變動時重跑
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  // 受控模式：initialPayload 變動時合併至 form state
  // 在 draftLoaded 完成後才套用，避免被草稿重置蓋掉
  useEffect(() => {
    if (!initialPayload || !draftLoaded) return;

    // 收集所有 tab 的欄位定義，依型別轉換後 merge
    const allFields = residentialFormTabs.flatMap((tab) => tab.fields);
    const patch: Partial<ResidentialPayload> = {};
    for (const fieldDef of allFields) {
      const k = fieldDef.key as string;
      if (!(k in initialPayload)) continue;
      const raw = initialPayload[k];
      if (raw === undefined) continue;

      if (fieldDef.type === "number") {
        const n = typeof raw === "number" ? raw : parseFloat(String(raw));
        if (!isNaN(n)) {
          (patch as Record<string, unknown>)[k] = n;
        }
      } else {
        // text / textarea / tristate — 直接用 string
        (patch as Record<string, unknown>)[k] = String(raw);
      }
    }
    if (Object.keys(patch).length > 0) {
      form.reset({ ...form.getValues(), ...patch });
    }
    // 依賴 initialPayload 與 draftLoaded；form 是穩定引用不列入
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPayload, draftLoaded]);

  // 受控模式：訂閱 form 值變動，呼叫外部 onChange
  // 用 form.watch(callback) 訂閱而非 useEffect 監聽 state，避免渲染迴圈
  useEffect(() => {
    if (!onChange) return;
    const subscription = form.watch((values) => {
      onChange(values as Record<string, unknown>);
    });
    return () => subscription.unsubscribe();
    // onChange 用 ref 包裝可免依賴，但 prop 穩定時直接列入即可
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, onChange]);

  // 自動儲存（draft 載入完才啟動，避免 default 蓋掉 DB 值）
  // #1d Stage 7.3 — 把證號 + 驗證狀態混入 payload，隨 autosave 寫回 SQLite
  const watched = form.watch();
  const autosavePayload = {
    ...(watched as Record<string, unknown>),
    realtor_license_number: realtorLicenseNumber,
    realtor_license_verification_status: realtorLicenseVerificationStatus,
  } as Record<string, unknown>;
  const { state, savedAt } = useDraftAutosave({
    caseId,
    payload: autosavePayload,
    enabled: draftLoaded,
  });

  // 取得表單中的地址值，作為拉謄本的參考
  const watchedAddress = form.watch("address" as keyof ResidentialPayload) as string | undefined;

  async function handleMarkCompleted() {
    setCompletionError(null);
    const values = form.getValues();
    const parsed = residentialSchemaCompleted.safeParse(values);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setCompletionError(first?.message ?? "標示為完成失敗：欄位驗證未通過");
      return;
    }
    setCompleting(true);
    try {
      await onMarkCompleted?.(values);
    } catch (err) {
      setCompletionError(err instanceof Error ? err.message : String(err));
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="relative">
      <AutosaveIndicator state={state} savedAt={savedAt ?? undefined} />

      {/* #1d Stage 7.3 — 經紀人證號（公司資訊區塊） */}
      <section
        aria-label="公司資訊"
        className="mb-4 rounded-md border border-border bg-muted/20 p-3"
      >
        <RealtorLicenseField
          initialValue={realtorLicenseNumber}
          onChange={setRealtorLicenseNumber}
          onVerificationChange={(state) => {
            if (state === null) {
              setRealtorLicenseVerificationStatus(null);
            } else if (state.source === "offline" && !state.verifiedAt) {
              setRealtorLicenseVerificationStatus("offline");
            } else {
              setRealtorLicenseVerificationStatus(state.status);
            }
          }}
        />
      </section>

      {/* 拉謄本（地政 API 查詢） */}
      {parcelId && (
        <section
          aria-label="地政資料查詢"
          className="mb-4 rounded-md border border-border bg-muted/20 p-3"
        >
          <p className="mb-2 text-sm font-medium">地政資料查詢</p>
          {watchedAddress && (
            <p className="mb-2 text-xs text-muted-foreground">
              地址：{watchedAddress}
            </p>
          )}
          <PullParcelDataButton
            caseId={caseId}
            parcelId={parcelId}
            apiIds={RESIDENTIAL_API_IDS}
          />
        </section>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 flex w-full justify-start gap-1 bg-muted/40 p-1">
          {residentialFormTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {residentialFormTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-4">
            {tab.fields.map((field) => (
              <FieldRow
                key={field.key as string}
                field={field}
                form={form}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
        <Button
          type="button"
          variant="default"
          disabled={completing || !draftLoaded}
          onClick={handleMarkCompleted}
        >
          {completing ? "處理中…" : "標示為完成"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!draftLoaded}
          onClick={() => router.push(`/cases/${caseId}/preview`)}
        >
          前往 PDF 預覽
        </Button>
        {completionError ? (
          <span role="alert" className="text-sm text-destructive">
            {completionError}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------ 子元件 ------------------------------ */

interface FieldRowProps {
  field: FormFieldDef;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: ReturnType<typeof useForm<any>>;
}

function FieldRow({ field, form }: FieldRowProps) {
  const key = field.key as string;
  const errors = form.formState.errors as Record<string, { message?: string } | undefined>;
  const errMsg = errors[key]?.message;

  return (
    <div>
      <label className="mb-1 block text-sm font-medium" htmlFor={`field-${key}`}>
        {field.label}
        {field.required ? <span className="ml-1 text-destructive">*</span> : null}
      </label>

      {field.type === "tristate" ? (
        <Controller
          control={form.control}
          name={key}
          render={({ field: f }) => (
            <TriStateButtons
              value={(f.value ?? "unknown") as string}
              onChange={f.onChange}
              ariaLabel={field.label}
            />
          )}
        />
      ) : field.type === "textarea" ? (
        <Controller
          control={form.control}
          name={key}
          render={({ field: f }) => (
            <textarea
              id={`field-${key}`}
              value={(f.value as string | undefined) ?? ""}
              onChange={(e) => f.onChange(e.target.value)}
              onBlur={f.onBlur}
              placeholder={field.placeholder}
              className={cn(
                "min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              )}
            />
          )}
        />
      ) : field.type === "number" ? (
        <Controller
          control={form.control}
          name={key}
          render={({ field: f }) => (
            <Input
              id={`field-${key}`}
              type="number"
              step="0.01"
              value={f.value === undefined || f.value === null ? "" : String(f.value)}
              onChange={(e) => {
                const v = e.target.value;
                f.onChange(v === "" ? undefined : Number(v));
              }}
              onBlur={f.onBlur}
              placeholder={field.placeholder}
            />
          )}
        />
      ) : (
        <Controller
          control={form.control}
          name={key}
          render={({ field: f }) => (
            <Input
              id={`field-${key}`}
              type="text"
              value={(f.value as string | undefined) ?? ""}
              onChange={(e) => f.onChange(e.target.value)}
              onBlur={f.onBlur}
              placeholder={field.placeholder}
            />
          )}
        />
      )}

      {errMsg ? (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {errMsg}
        </p>
      ) : null}
    </div>
  );
}

interface TriStateButtonsProps {
  value: string;
  onChange: (v: "true" | "false" | "unknown") => void;
  ariaLabel: string;
}

function TriStateButtons({ value, onChange, ariaLabel }: TriStateButtonsProps) {
  const options: Array<{ v: "true" | "false" | "unknown"; label: string }> = [
    { v: "true", label: "是" },
    { v: "false", label: "否" },
    { v: "unknown", label: "未知" },
  ];
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex gap-1">
      {options.map((opt) => {
        const active = value === opt.v;
        return (
          <button
            key={opt.v}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.v)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
