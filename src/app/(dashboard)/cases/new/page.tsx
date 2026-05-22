"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { casesApi } from "@/lib/cases-api";
import { CaseLotInput } from "@/components/CaseLotInput";
import { useIpcErrorToast } from "@/hooks/useIpcErrorToast";
import {
  classifyAddressLookupResult,
  getAddressFirstClassification,
  type AddressFirstClassification,
} from "@/lib/product-ui-demo-alignment";
import { addressLookup } from "@/lib/land-registry-api";

const schema = z.object({
  property_type: z.enum(["residential", "land"]).optional(),
  land_lot_no: z.string().optional(),
  address: z.string().min(1, "地址為必填"),
  owner_name: z.string().optional(),
  case_no: z.string().optional(),
  case_name: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewCasePage() {
  const router = useRouter();
  const { handleError } = useIpcErrorToast();
  const [values, setValues] = useState<FormValues>({
    property_type: undefined,
    land_lot_no: "",
    address: "",
    owner_name: "",
    case_no: "",
    case_name: "",
  });
  const [landLots, setLandLots] = useState<string[]>([""]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [classification, setClassification] = useState<AddressFirstClassification | null>(null);
  const [detectingRegistry, setDetectingRegistry] = useState(false);
  const [registryDetectMessage, setRegistryDetectMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof FormValues>(k: K, v: FormValues[K]) {
    setValues((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  async function handleDetectRegistry() {
    setDetectingRegistry(true);
    setRegistryDetectMessage(null);
    try {
      const parcels = values.address.trim() ? await addressLookup(values.address) : [];
      const result = classifyAddressLookupResult(values.address, parcels);
      setClassification(result);
      if (!result.manualSelectionRequired) {
        update("property_type", result.propertyType);
      }
    } catch (error) {
      const result = getAddressFirstClassification(values.address);
      setClassification(result);
      setRegistryDetectMessage(
        error instanceof Error
          ? `地政查詢暫時無法使用，已改用本機判斷：${error.message}`
          : "地政查詢暫時無法使用，已改用本機判斷。",
      );
      if (!result.manualSelectionRequired) {
        update("property_type", result.propertyType);
      }
    } finally {
      setDetectingRegistry(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof FormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FormValues;
        fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    try {
      const detected = classification ?? getAddressFirstClassification(parsed.data.address);
      const propertyType = parsed.data.property_type ?? detected.propertyType;
      const filteredLots = landLots.filter((s) => s.trim() !== "");
      const lots = filteredLots.length > 0 ? filteredLots : [parsed.data.land_lot_no || ""];
      const created = await casesApi.create({
        property_type: propertyType,
        land_lot_no: lots[0],
        land_lots: lots,
        address: parsed.data.address,
        owner_name: parsed.data.owner_name || null,
        case_no: parsed.data.case_no || null,
        case_name: parsed.data.case_name || null,
      });
      router.push(`/cases/${created.id}`);
    } catch (err) {
      handleError(err);
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold tracking-normal">新增案件</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        先輸入地址讓地政資料自動判斷土地、建物與說明書章節；只有查不到才人工選。
      </p>
      <form className="space-y-5 rounded-lg border bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
        <section>
          <label className="mb-2 block text-sm font-semibold" htmlFor="case-address">
            地址 *
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="case-address"
              type="text"
              value={values.address}
              onChange={(e) => {
                update("address", e.target.value);
                setClassification(null);
              }}
              className="min-h-11 flex-1 rounded-md border px-3 py-2 text-sm"
              placeholder="例：宜蘭縣五結鄉協和村親河路二段 1 號"
            />
            <button
              type="button"
              className="min-h-11 rounded-md border px-4 py-2 text-sm font-medium"
              onClick={() => void handleDetectRegistry()}
              disabled={detectingRegistry}
            >
              {detectingRegistry ? "判斷中..." : "判斷地政資料"}
            </button>
          </div>
          {errors.address ? (
            <span className="mt-1 block text-xs text-destructive">{errors.address}</span>
          ) : null}
          {registryDetectMessage ? (
            <span className="mt-2 block text-xs text-muted-foreground">{registryDetectMessage}</span>
          ) : null}
        </section>

        {classification ? (
          <section className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
            <strong className="block">地址與地政判斷</strong>
            <p className="mt-1 text-sm text-muted-foreground">{classification.summary}</p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-md bg-white p-3">
                <dt className="text-muted-foreground">判斷結果</dt>
                <dd className="font-medium">{classification.displayType}</dd>
              </div>
              <div className="rounded-md bg-white p-3">
                <dt className="text-muted-foreground">資料組成</dt>
                <dd className="font-medium">
                  土地 {classification.landCount} 筆 · 建物 {classification.buildingCount} 筆
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-muted-foreground">{classification.note}</p>
          </section>
        ) : null}

        {classification?.manualSelectionRequired ? (
          <section>
            <label className="mb-2 block text-sm font-semibold" htmlFor="manual-property-type">
              物件類型
            </label>
            <select
              id="manual-property-type"
              className="min-h-11 w-full rounded-md border px-3 py-2 text-sm"
              value={values.property_type ?? "residential"}
              onChange={(e) => update("property_type", e.target.value as FormValues["property_type"])}
            >
              <option value="residential">成屋 / 農舍 / 透天</option>
              <option value="land">土地 / 農地</option>
            </select>
          </section>
        ) : null}

        <section>
          <label className="mb-2 block text-sm font-semibold">地號或候選地號（可多筆）</label>
          <CaseLotInput value={landLots} onChange={setLandLots} />
          {errors.land_lot_no ? (
            <span className="mt-1 block text-xs text-destructive">{errors.land_lot_no}</span>
          ) : null}
        </section>

        <section>
          <label className="mb-2 block text-sm font-semibold" htmlFor="owner-name">
            所有權人（選填）
          </label>
          <input
            id="owner-name"
            type="text"
            value={values.owner_name}
            onChange={(e) => update("owner_name", e.target.value)}
            className="min-h-11 w-full rounded-md border px-3 py-2 text-sm"
          />
          {errors.owner_name ? (
            <span className="mt-1 block text-xs text-destructive">{errors.owner_name}</span>
          ) : null}
        </section>

        <section>
          <label className="mb-2 block text-sm font-semibold" htmlFor="case-name">
            案件名稱（選填）
          </label>
          <input
            id="case-name"
            type="text"
            value={values.case_name ?? ""}
            onChange={(e) => update("case_name", e.target.value)}
            className="min-h-11 w-full rounded-md border px-3 py-2 text-sm"
          />
        </section>

        <section>
          <label className="mb-2 block text-sm font-semibold" htmlFor="case-no">
            案件編號（選填）
          </label>
          <input
            id="case-no"
            type="text"
            value={values.case_no ?? ""}
            onChange={(e) => update("case_no", e.target.value)}
            className="min-h-11 w-full rounded-md border px-3 py-2 text-sm"
          />
        </section>

        {submitError ? (
          <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            建立失敗：{submitError}
          </div>
        ) : null}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/cases")}
            disabled={loading}
            className="rounded-md border px-4 py-2 text-sm"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-slate-950 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "建立中…" : "建立案件"}
          </button>
        </div>
      </form>
    </main>
  );
}
