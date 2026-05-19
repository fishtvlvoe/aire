"use client";

/**
 * 土地說明書表單（Group 7.2）
 *
 * - 4 個 tab：標示 / 權利 / 稅費 / 現況
 * - 與成屋表單共用 autosave hook 與互動樣式
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
  landFormTabs,
  landDefaults,
  landSchema,
  landSchemaCompleted,
  type LandPayload,
  type FormFieldDef,
} from "@/lib/disclosure-schema-land";
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

/** 土地表單預設查詢的地政 API（排除建物相關） */
const LAND_API_IDS = [
  "land_registry",
  "co_owners",
  "land_value",
  "mortgages",
  "zoning",
];

export interface DisclosureFormLandProps {
  caseId: string;
  /** 地號（由案件載入，供拉謄本使用） */
  parcelId?: string;
  onMarkCompleted?: (payload: LandPayload) => Promise<void> | void;
  /**
   * 受控模式：傳入初始欄位值，key 對應 landFormTabs 裡的 field.key。
   * 所有 props 為 optional，不傳時維持獨立（standalone）模式。
   */
  initialPayload?: Record<string, unknown>;
  /**
   * 受控模式：任一欄位變更後呼叫，payload 為目前所有欄位完整值。
   */
  onChange?: (payload: Record<string, unknown>) => void;
}

export function DisclosureFormLand({
  caseId,
  parcelId,
  onMarkCompleted,
  initialPayload,
  onChange,
}: DisclosureFormLandProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(landFormTabs[0]!.id);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  // #1d Stage 7.3 — 經紀人證號 local state（未納入 zod schema，僅進 autosave payload）
  const [realtorLicenseNumber, setRealtorLicenseNumber] = useState<string>("");
  const [realtorLicenseVerificationStatus, setRealtorLicenseVerificationStatus] =
    useState<RealtorLicenseVerificationStatus>(null);

  const form = useForm<LandPayload>({
    resolver: zodResolver(landSchema),
    defaultValues: landDefaults,
    mode: "onChange",
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const existing = await loadDraft<LandPayload & RealtorLicenseDraftSlice>(caseId);
      if (cancelled) return;
      if (existing) {
        const {
          realtor_license_number: _rln,
          realtor_license_verification_status: _rls,
          ...formValues
        } = existing as LandPayload & RealtorLicenseDraftSlice;
        form.reset({ ...landDefaults, ...(formValues as LandPayload) });
        if (typeof existing.realtor_license_number === "string") {
          setRealtorLicenseNumber(existing.realtor_license_number);
        }
      }
      setDraftLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  // 受控模式：initialPayload 變更時，將對應欄位覆蓋進 form state
  useEffect(() => {
    if (!initialPayload || Object.keys(initialPayload).length === 0) return;
    // 取出所有 landFormTabs 欄位 key，只套用有定義的 key
    const allKeys = landFormTabs.flatMap((tab) => tab.fields.map((f) => f.key as string));
    const overrides: Partial<LandPayload> = {};
    for (const k of allKeys) {
      if (Object.prototype.hasOwnProperty.call(initialPayload, k)) {
        (overrides as Record<string, unknown>)[k] = initialPayload[k];
      }
    }
    if (Object.keys(overrides).length > 0) {
      form.reset({ ...form.getValues(), ...overrides });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPayload]);

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

  // 取得表單中的地號值，作為拉謄本的參考
  const watchedLotNo = form.watch("land_lot_no" as keyof LandPayload) as string | undefined;

  /**
   * 受控模式 onChange 通知。
   * 在各欄位的 onChange handler 呼叫，傳入最新的 key/value；
   * 與當前 form values 合併後呼叫外部 onChange?.(payload)。
   */
  function notifyChange(key: string, value: unknown) {
    if (!onChange) return;
    const current = form.getValues() as Record<string, unknown>;
    onChange({ ...current, [key]: value });
  }

  async function handleMarkCompleted() {
    setCompletionError(null);
    const values = form.getValues();
    const parsed = landSchemaCompleted.safeParse(values);
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
          {watchedLotNo && (
            <p className="mb-2 text-xs text-muted-foreground">
              地號：{watchedLotNo}
            </p>
          )}
          <PullParcelDataButton
            caseId={caseId}
            parcelId={parcelId}
            apiIds={LAND_API_IDS}
          />
        </section>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 flex w-full justify-start gap-1 bg-muted/40 p-1">
          {landFormTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {landFormTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-4">
            {tab.fields.map((field) => (
              <FieldRow
                key={field.key as string}
                field={field}
                form={form}
                onFieldChange={notifyChange}
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
  /** 受控模式：欄位值變更時呼叫，key 為欄位 key，value 為最新值 */
  onFieldChange?: (key: string, value: unknown) => void;
}

function FieldRow({ field, form, onFieldChange }: FieldRowProps) {
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
              onChange={(v) => {
                f.onChange(v);
                onFieldChange?.(key, v);
              }}
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
              onChange={(e) => {
                f.onChange(e.target.value);
                onFieldChange?.(key, e.target.value);
              }}
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
                const parsed = v === "" ? undefined : Number(v);
                f.onChange(parsed);
                onFieldChange?.(key, parsed);
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
              onChange={(e) => {
                f.onChange(e.target.value);
                onFieldChange?.(key, e.target.value);
              }}
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
