"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  casesApi,
  coarseCasePropertyType,
  isCasePropertyType,
  type CasePropertyType,
  type CaseRow,
} from "@/lib/cases-api";
import { CaseLotInput } from "@/components/CaseLotInput";
import { useIpcErrorToast } from "@/hooks/useIpcErrorToast";
import { formatIpcError, parseIpcError } from "@/lib/ipc-error";
import {
  classifyAddressLookupResult,
  getAddressFirstClassification,
  getCustomerPropertyTypeOptions,
  type AddressFirstClassification,
} from "@/lib/product-ui-demo-alignment";
import {
  addressLookup,
  BrowserAddressDiscoveryUnavailableError,
  confirmCaseRegistryMatch,
  listRegistryQueryRuns,
  paidAddressResolver,
  type ParcelInfo,
  type RegistryQueryRun,
} from "@/lib/land-registry-api";
import { safeInvoke } from "@/lib/safe-invoke";
import { createRegistryProvenancePayload } from "@/lib/registry-provenance";
import { caseDetailHref } from "@/lib/case-routes";
import {
  BrowserRealPriceUnavailableError,
  extractRealPriceDistrict,
  extractRealPriceKeyword,
  queryRealPrice,
  type RealPriceRecord,
} from "@/lib/real-price-query";

const schema = z.object({
  property_type: z.string()
    .optional()
    .refine((value) => !value || isCasePropertyType(value), "請選擇有效的物件類型"),
  land_lot_no: z.string().optional(),
  address: z.string().min(1, "地址為必填"),
  owner_name: z.string().optional(),
  case_no: z.string().optional(),
  case_name: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type RegistryMatchDraft = {
  officeCode: string;
  sectionCode: string;
  sectionName: string;
  landNo: string;
  buildingNo: string;
  registryKey: string;
  landAreaSqm: string;
  announcedLandCurrentValue: string;
  announcedLandValue: string;
};

type DuplicateCaseWarning = Pick<CaseRow, "id" | "case_no" | "case_name" | "address">;
type LookupState =
  | "idle"
  | "running"
  | "slow_source"
  | "source_error"
  | "no_data"
  | "manual_required"
  | "low_confidence_unresolved"
  | "resolved"
  | "snapshot";

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
  const [detectedParcels, setDetectedParcels] = useState<ParcelInfo[]>([]);
  const [detectingRegistry, setDetectingRegistry] = useState(false);
  const [registryDetectMessage, setRegistryDetectMessage] = useState<string | null>(null);
  const [usedExistingRegistryData, setUsedExistingRegistryData] = useState(false);
  const [duplicateCase, setDuplicateCase] = useState<DuplicateCaseWarning | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [registryFieldsTouched, setRegistryFieldsTouched] = useState(false);
  const [paidResolverRunning, setPaidResolverRunning] = useState(false);
  const [paidResolverError, setPaidResolverError] = useState<string | null>(null);
  const [realPriceRecords, setRealPriceRecords] = useState<RealPriceRecord[]>([]);
  const [realPriceLoading, setRealPriceLoading] = useState(false);
  const [realPriceQueried, setRealPriceQueried] = useState(false);
  const [realPriceError, setRealPriceError] = useState<string | null>(null);
  const [lookupDebugDetail, setLookupDebugDetail] = useState<string | null>(null);
  const [realPriceDebugDetail, setRealPriceDebugDetail] = useState<string | null>(null);
  const [lookupState, setLookupState] = useState<LookupState>("idle");
  const [lookupStartedAt, setLookupStartedAt] = useState<number | null>(null);
  const [registryMatch, setRegistryMatch] = useState<RegistryMatchDraft>({
    officeCode: "",
    sectionCode: "",
    sectionName: "",
    landNo: "",
    buildingNo: "",
    registryKey: "",
    landAreaSqm: "",
    announcedLandCurrentValue: "",
    announcedLandValue: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!detectingRegistry || lookupStartedAt === null) return;
    const timer = window.setTimeout(() => {
      setLookupState((current) => (current === "running" ? "slow_source" : current));
    }, 60_000);
    return () => window.clearTimeout(timer);
  }, [detectingRegistry, lookupStartedAt]);

  function update<K extends keyof FormValues>(k: K, v: FormValues[K]) {
    setValues((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function updateRegistryMatch(patch: Partial<RegistryMatchDraft>) {
    setRegistryMatch((prev) => {
      const next = { ...prev, ...patch };
      return {
        ...next,
        registryKey: buildRegistryKey(next.officeCode, next.sectionCode, next.buildingNo || next.landNo),
      };
    });
  }

  async function detectRegistry(): Promise<AddressFirstClassification | null> {
    setSubmitError(null);
    setDetectingRegistry(true);
    setLookupState("running");
    setLookupStartedAt(Date.now());
    setRegistryDetectMessage(null);
    setUsedExistingRegistryData(false);
    setDuplicateCase(null);
    setSelectedCandidateId(null);
    setRegistryFieldsTouched(false);
    setPaidResolverError(null);
    setRealPriceRecords([]);
    setRealPriceError(null);
    setLookupDebugDetail(null);
    setRealPriceDebugDetail(null);
    setRealPriceQueried(false);
    setRealPriceLoading(false);
    try {
      const address = values.address.trim();
      if (address) {
        await loadRealPriceRecords(address);
      }
      const existingParcels = values.address.trim() ? await loadExistingAddressParcels(values.address) : [];
      const parcels = existingParcels.length > 0 ? existingParcels : values.address.trim() ? await addressLookup(values.address) : [];
      const usedExisting = existingParcels.length > 0;
      const trustedParcels = parcels.filter(isTrustedAddressLookupParcel);
      const result = trustedParcels.length > 0
        ? classifyAddressLookupResult(values.address, trustedParcels)
        : buildManualRegistryClassification(
            values.address,
            parcels.length > 0 ? "未取得可信的地址補齊資料，請人工確認土地或建物" : undefined,
          );
      setDetectedParcels(trustedParcels);
      setClassification(result);
      setUsedExistingRegistryData(usedExisting);
      const needsCandidateSelection = isCandidateSelectionRequired(trustedParcels, result);
      const hasLowConfidenceCandidate = trustedParcels.some((parcel) => parcel.discovery_confidence === "low");
      const autoSelectedCandidate = hasLowConfidenceCandidate
        ? null
        : needsCandidateSelection
          ? findAutoSelectedCandidate(values.address, trustedParcels)
          : null;
      const effectiveClassification = autoSelectedCandidate
        ? classifyAddressLookupResult(values.address, [autoSelectedCandidate])
        : result;
      if (usedExisting) {
        setLookupState("snapshot");
      } else if (hasLowConfidenceCandidate || result.status === "low_confidence_unresolved") {
        setLookupState("low_confidence_unresolved");
      } else if (trustedParcels.length > 0 && (!needsCandidateSelection || Boolean(autoSelectedCandidate))) {
        setLookupState("resolved");
      } else if (trustedParcels.length > 0) {
        setLookupState("manual_required");
      } else {
        setLookupState("no_data");
      }
      if ((!result.manualSelectionRequired && !needsCandidateSelection) || autoSelectedCandidate) {
        update("property_type", effectiveClassification.propertyType);
        const primaryLot = (autoSelectedCandidate ?? trustedParcels[0])?.lot_number?.trim();
        if (primaryLot) setLandLots([primaryLot]);
      }
      if (autoSelectedCandidate) {
        setSelectedCandidateId(getCandidateId(autoSelectedCandidate));
      }
      const nextRegistryMatch = hasLowConfidenceCandidate
        ? emptyRegistryMatch()
        : autoSelectedCandidate
        ? buildRegistryMatchDraft([autoSelectedCandidate])
        : needsCandidateSelection
          ? emptyRegistryMatch()
          : buildRegistryMatchDraft(trustedParcels);
      setRegistryMatch(nextRegistryMatch);
      setDuplicateCase(await findDuplicateCaseByRegistryMatch(nextRegistryMatch));
      return result;
    } catch (error) {
      const result = buildManualRegistryClassification(values.address);
      setDetectedParcels([]);
      setClassification(result);
      setLookupState("source_error");
      const isBrowserProviderUnavailable = error instanceof BrowserAddressDiscoveryUnavailableError;
      setLookupDebugDetail(buildLookupDebugDetail(error));
      setRegistryDetectMessage(
        isBrowserProviderUnavailable
          ? error.message
          : error instanceof Error
            ? `這次地址補齊沒有成功，請先人工填寫地段、地號、建號。${error.message ? `（${error.message}）` : ""}`
            : "這次地址補齊沒有成功，請先人工填寫地段、地號、建號。",
      );
      setRegistryMatch(emptyRegistryMatch());
      setDuplicateCase(null);
      setSelectedCandidateId(null);
      setRegistryFieldsTouched(false);
      return result;
    } finally {
      setDetectingRegistry(false);
      setLookupStartedAt(null);
    }
  }

  async function retryLookup() {
    if (!values.address.trim() || detectingRegistry || loading) return;
    await detectRegistry();
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
    if (!classification) {
      await detectRegistry();
      return;
    }
    setLoading(true);
    try {
      const detected = classification;
      const missingRegistryFields = getMissingRegistryFields(registryMatch, detected);
      const selectedCandidate = selectedCandidateId
        ? detectedParcels.find((parcel) => getCandidateId(parcel) === selectedCandidateId)
        : null;
      const needsCandidateSelection = isCandidateSelectionRequired(detectedParcels, detected);
      const createAsRegistryPending =
        detected.manualSelectionRequired &&
        (missingRegistryFields.length > 0 || (needsCandidateSelection && !selectedCandidate && !registryFieldsTouched));
      if (missingRegistryFields.length > 0 && !createAsRegistryPending) {
        setSubmitError(`請先確認${missingRegistryFields.join("、")}後再建立案件`);
        return;
      }
      const propertyType = (parsed.data.property_type ?? detected.propertyType) as CasePropertyType;
      const backendPropertyType = coarseCasePropertyType(propertyType);
      const filteredLots = landLots.filter((s) => s.trim() !== "");
      const detectedLots = Array.from(
        new Set(detectedParcels.map((parcel) => parcel.lot_number?.trim()).filter(Boolean)),
      );
      const lots = filteredLots.length > 0
        ? filteredLots
        : detectedLots.length > 0
          ? detectedLots
          : [parsed.data.land_lot_no || ""];
      const created = await casesApi.create({
        property_type: backendPropertyType,
        land_lot_no: createAsRegistryPending ? "" : registryMatch.landNo || lots[0],
        land_lots: lots,
        building_lot_no: createAsRegistryPending ? null : registryMatch.buildingNo || null,
        address: parsed.data.address,
        owner_name: parsed.data.owner_name || null,
        case_no: parsed.data.case_no || null,
        case_name: parsed.data.case_name || null,
        land_registry_data: {
          customer_property_type: propertyType,
          ...buildAddressLookupProvenance(detected, detectedParcels, realPriceRecords),
          ...(createAsRegistryPending
            ? {
                registry_status: "registry_pending",
                missing_registry_fields: missingRegistryFields,
                discovery_diagnostics: {
                  status: detected.status,
                  summary: detected.summary,
                  address: parsed.data.address,
                },
              }
            : {
                confirmed_registry_match: {
                  office_code: registryMatch.officeCode || null,
                  section_code: registryMatch.sectionCode || null,
                  section_name: registryMatch.sectionName || null,
                  land_no: registryMatch.landNo || null,
                  building_no: registryMatch.buildingNo || null,
                  registry_key: registryMatch.registryKey || null,
                  land_area_sqm: registryMatch.landAreaSqm || null,
                  announced_land_current_value: registryMatch.announcedLandCurrentValue || null,
                  announced_land_value: registryMatch.announcedLandValue || null,
                  status: "confirmed",
                },
              }),
        },
      });
      if (!createAsRegistryPending) {
        await confirmCaseRegistryMatch({
          caseId: created.id,
          officeCode: registryMatch.officeCode || null,
          sectionCode: registryMatch.sectionCode || null,
          sectionName: registryMatch.sectionName,
          landNo: registryMatch.landNo,
          buildingNo: registryMatch.buildingNo || null,
          registryKey: registryMatch.registryKey || null,
        });
      }
      router.push(caseDetailHref(created.id));
    } catch (err) {
      handleError(err);
      setSubmitError(getSubmitErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function selectCandidate(parcel: ParcelInfo) {
    const candidateId = getCandidateId(parcel);
    const nextRegistryMatch = buildRegistryMatchDraft([parcel]);
    const selectedClassification = classifyAddressLookupResult(values.address, [parcel]);
    setSelectedCandidateId(candidateId);
    setRegistryFieldsTouched(false);
    setRegistryMatch(nextRegistryMatch);
    update("property_type", selectedClassification.propertyType);
    if (parcel.lot_number?.trim()) setLandLots([parcel.lot_number.trim()]);
    void findDuplicateCaseByRegistryMatch(nextRegistryMatch).then(setDuplicateCase);
  }

  async function runPaidResolver() {
    if (!values.address.trim()) return;
    setPaidResolverRunning(true);
    setPaidResolverError(null);
    try {
      const result = await paidAddressResolver(values.address.trim());
      const candidates = result.candidates ?? [];
      setDetectedParcels(candidates);
      const nextClassification = classifyAddressLookupResult(values.address, candidates);
      setClassification({
        ...nextClassification,
        manualSelectionRequired: true,
        status: "manual_required",
        note: "已取得候選資料，請選定一筆後再建立案件。",
      });
      setSelectedCandidateId(null);
      setRegistryFieldsTouched(false);
      setRegistryMatch(emptyRegistryMatch());
      setUsedExistingRegistryData(false);
    } catch (error) {
      setPaidResolverError(error instanceof Error ? error.message : String(error));
    } finally {
      setPaidResolverRunning(false);
    }
  }

  async function loadRealPriceRecords(address: string): Promise<RealPriceRecord[]> {
    setRealPriceLoading(true);
    setRealPriceQueried(true);
    setRealPriceError(null);
    setRealPriceDebugDetail(null);
    setRealPriceRecords([]);
    try {
      const district = extractDistrictForRealPrice(address);
      if (!district) {
        setRealPriceRecords([]);
        return [];
      }
      const records = await queryRealPrice(district, extractRealPriceKeyword(address, district), 5, address);
      const nextRecords = Array.isArray(records) ? records.slice(0, 5) : [];
      setRealPriceRecords(nextRecords);
      return nextRecords;
    } catch (error) {
      setRealPriceError(getRealPriceErrorMessage(error));
      setRealPriceDebugDetail(buildRealPriceDebugDetail(error, address));
      return [];
    } finally {
      setRealPriceLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold tracking-normal">新增案件</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        先用免費前查補齊地址候選、附近實價登錄與參考欄位；只有需要正式地政資料時才進入付費查詢。
      </p>
      <form className="space-y-5 rounded-lg border bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
        <section>
          <label className="mb-2 block text-sm font-semibold" htmlFor="case-address">
            地址 *
          </label>
          <div>
            <input
              id="case-address"
              type="text"
              value={values.address}
              onChange={(e) => {
                update("address", e.target.value);
                setClassification(null);
                setDetectedParcels([]);
                setUsedExistingRegistryData(false);
                setDuplicateCase(null);
                setSelectedCandidateId(null);
                setRegistryFieldsTouched(false);
                setSubmitError(null);
                setRealPriceRecords([]);
                setRealPriceError(null);
                setLookupDebugDetail(null);
                setRealPriceDebugDetail(null);
                setRealPriceQueried(false);
                setRealPriceLoading(false);
                setLookupState("idle");
                setLookupStartedAt(null);
                setRegistryMatch(emptyRegistryMatch());
              }}
              className="min-h-11 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="例：台南市東區中華東路三段24巷8號5樓"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            建議不要留空白或多餘符號；系統會自動判讀全形 / 半形、中文 / 阿拉伯數字。
          </p>
          {errors.address ? (
            <span className="mt-1 block text-xs text-destructive">{errors.address}</span>
          ) : null}
          {registryDetectMessage ? (
            <span className="mt-2 block text-xs text-muted-foreground">{registryDetectMessage}</span>
          ) : null}
          {lookupState !== "idle" ? (
            <div className="mt-3 rounded-md border bg-slate-50 p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium">{getLookupStateTitle(lookupState, usedExistingRegistryData)}</p>
                  <p className="text-muted-foreground">
                    {getLookupStateDescription(lookupState, {
                      realPriceError,
                      realPriceQueried,
                      realPriceRecordsCount: realPriceRecords.length,
                    })}
                  </p>
                </div>
                {lookupState === "running" || lookupState === "slow_source" ? (
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800"
                  />
                ) : null}
              </div>
              {canRetryLookup(lookupState, realPriceError, realPriceQueried, realPriceRecords.length) ? (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => void retryLookup()}
                    disabled={detectingRegistry || loading}
                    className="rounded-md border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    重新查詢
                  </button>
                </div>
              ) : null}
              {lookupDebugDetail ? (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                  <p className="font-medium">除錯資訊</p>
                  <p className="mt-1 break-all">{lookupDebugDetail}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        {classification ? (
          <section className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
            <strong className="block">物件資料補齊</strong>
            <p className="mt-1 text-sm font-medium text-emerald-900">
              {usedExistingRegistryData ? "已帶入既有資料" : getRegistryStatusMessage(classification, detectedParcels)}
            </p>
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
            {getUniqueAutoSelectionMessage(detectedParcels) ? (
              <p className="mt-1 text-sm font-medium text-emerald-900">{getUniqueAutoSelectionMessage(detectedParcels)}</p>
            ) : null}
            <p className="mt-1 text-sm text-muted-foreground">
              目前這一段屬於免費前查，不會進行付費正式查詢，也不會產生成本。
            </p>
          </section>
        ) : null}

        {classification && detectedParcels.length > 0 ? (
          <section className="rounded-lg border p-4" aria-label="候選資料清單">
            <strong className="block">候選資料清單</strong>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left">
                    <th className="px-3 py-2 font-medium">地址</th>
                    <th className="px-3 py-2 font-medium">地段</th>
                    <th className="px-3 py-2 font-medium">地號</th>
                    <th className="px-3 py-2 font-medium">建號</th>
                    <th className="px-3 py-2 text-right font-medium">土地面積</th>
                    <th className="px-3 py-2 text-right font-medium">公告現值</th>
                    <th className="px-3 py-2 text-right font-medium">公告地價</th>
                  </tr>
                </thead>
                <tbody>
                  {detectedParcels.map((parcel) => (
                    <tr key={getCandidateId(parcel)} className="border-b last:border-0">
                      <td className="px-3 py-2">{parcel.address || values.address}</td>
                      <td className="px-3 py-2">{parcel.section_name || "待確認"}</td>
                      <td className="px-3 py-2 font-mono text-xs">{parcel.lot_number || "待確認"}</td>
                      <td className="px-3 py-2 font-mono text-xs">{parcel.building_number || "無"}</td>
                      <td className="px-3 py-2 text-right">{formatOptionalNumber(parcel.land_area_sqm)}</td>
                      <td className="px-3 py-2 text-right">{formatOptionalNumber(parcel.announced_land_current_value)}</td>
                      <td className="px-3 py-2 text-right">{formatOptionalNumber(parcel.announced_land_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {classification ? (
          <section className="rounded-lg border p-4" aria-label="實價登錄成交行情">
            <strong className="block">實價登錄成交行情</strong>
            <p className="mt-1 text-sm text-muted-foreground">
              這裡顯示的是免費附近行情，供前期比對與說明書參考，不會產生成本。
            </p>
            {realPriceLoading ? (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800"
                />
                <span>
                  {lookupState === "slow_source"
                    ? "外部資料來源回應較慢，系統仍在等待成交資料"
                    : "查詢中，正在向外部資料來源取得成交資料"}
                </span>
              </div>
            ) : realPriceError ? (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-destructive">查詢失敗：{realPriceError}</p>
                {realPriceDebugDetail ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                    <p className="font-medium">除錯資訊</p>
                    <p className="mt-1 break-all">{realPriceDebugDetail}</p>
                  </div>
                ) : null}
              </div>
            ) : realPriceQueried && realPriceRecords.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">查無符合條件的成交資料</p>
            ) : realPriceRecords.length > 0 ? (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-left">
                      <th className="px-3 py-2 font-medium">地址</th>
                      <th className="px-3 py-2 font-medium">類型</th>
                      <th className="px-3 py-2 text-right font-medium">坪數</th>
                      <th className="px-3 py-2 text-right font-medium">總價</th>
                      <th className="px-3 py-2 text-right font-medium">單價</th>
                      <th className="px-3 py-2 text-center font-medium">交易日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {realPriceRecords.map((record, index) => (
                      <tr key={`${record.address}-${index}`} className="border-b last:border-0">
                        <td className="px-3 py-2">{record.address || "地址未提供"}</td>
                        <td className="px-3 py-2">{record.type || "未分類"}</td>
                        <td className="px-3 py-2 text-right">{formatOptionalNumber(record.area)}</td>
                        <td className="px-3 py-2 text-right">{formatCurrencyWan(record.total_price)}</td>
                        <td className="px-3 py-2 text-right">{formatCurrencyWan(record.unit_price)}</td>
                        <td className="px-3 py-2 text-center">{record.transaction_date || record.date || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">輸入地址後會自動查詢附近成交行情。</p>
            )}
          </section>
        ) : null}

        {classification && isCandidateSelectionRequired(detectedParcels, classification) ? (
          <section className="rounded-lg border border-amber-300 bg-amber-50 p-4">
            <strong className="block text-amber-950">候選物件資料</strong>
            <p className="mt-1 text-sm text-amber-900">請先選定一筆候選；你可以先建立案件，之後再決定是否進入付費正式查詢。</p>
            <div role="radiogroup" aria-label="候選物件資料" className="mt-3 space-y-2">
              {detectedParcels.map((parcel) => {
                const candidateId = getCandidateId(parcel);
                return (
                  <label key={candidateId} className="flex cursor-pointer items-start gap-2 rounded-md border bg-white p-3 text-sm">
                    <input
                      type="radio"
                      name="registry-candidate"
                      aria-label={getCandidateOptionLabel(parcel)}
                      value={candidateId}
                      checked={selectedCandidateId === candidateId}
                      onChange={() => selectCandidate(parcel)}
                    />
                    <span>
                      <span className="block font-medium">{getCandidateOptionLabel(parcel)}</span>
                      <span className="block text-muted-foreground">{parcel.section_name || getSectionCodeFromParcelId(parcel.parcel_id) || "地段待確認"}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        ) : null}

        {classification && shouldOfferPaidResolver(values.address, classification, detectedParcels) ? (
          <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
            <strong className="block text-amber-950">仍找不到建號候選</strong>
            <p className="mt-1 text-amber-900">
              可選擇付費查詢門牌建號；可能查無結果但仍可能產生費用，結果只會成為候選，仍需你選定後才可正式查詢。
            </p>
            <button
              type="button"
              className="mt-3 rounded-md border border-amber-500 bg-white px-3 py-2 text-sm font-medium"
              disabled={paidResolverRunning}
              onClick={runPaidResolver}
            >
              {paidResolverRunning ? "查詢中..." : "我同意付費查詢建號"}
            </button>
            {paidResolverError ? (
              <p role="alert" className="mt-2 text-xs text-destructive">
                查詢失敗：{paidResolverError}
              </p>
            ) : null}
          </section>
        ) : null}

        {duplicateCase ? (
          <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
            <strong className="block text-amber-950">系統中已有同樣資訊</strong>
            <p className="mt-1 text-amber-900">
              {duplicateCase.case_name || duplicateCase.case_no || duplicateCase.address || "既有案件"} 已使用相同物件資料。仍可建立新案件。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-amber-400 bg-white px-3 py-1.5 text-sm"
                onClick={() => router.push(caseDetailHref(duplicateCase.id))}
              >
                開啟既有案件
              </button>
              <span className="self-center text-xs text-amber-900">仍可建立新案件</span>
            </div>
          </section>
        ) : null}

        {classification ? (
        <section className="rounded-lg border p-4">
          <strong className="block">物件資料補齊</strong>
          <p className="mt-1 text-sm text-muted-foreground">請確認地段、地號、建號。未付費正式查詢前，仍可先保存案件與產出參考版 PDF。</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="text-sm">
                <span className="mb-1 block">地段</span>
                <input
                  className="min-h-10 w-full rounded-md border px-3 py-2"
                  value={registryMatch.sectionName}
                  onChange={(event) => {
                    setRegistryFieldsTouched(true);
                    setSelectedCandidateId(null);
                    updateRegistryMatch({ sectionName: event.target.value });
                  }}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block">地號</span>
                <input
                  className="min-h-10 w-full rounded-md border px-3 py-2"
                  value={registryMatch.landNo}
                  onChange={(event) => {
                    setRegistryFieldsTouched(true);
                    setSelectedCandidateId(null);
                    updateRegistryMatch({ landNo: event.target.value });
                  }}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block">建號</span>
                <input
                  className="min-h-10 w-full rounded-md border px-3 py-2"
                  value={registryMatch.buildingNo}
                  onChange={(event) => {
                    setRegistryFieldsTouched(true);
                    setSelectedCandidateId(null);
                    updateRegistryMatch({ buildingNo: event.target.value });
                  }}
                  placeholder="無建號可留空"
                />
              </label>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="text-sm">
                <span className="mb-1 block">土地面積（平方公尺）</span>
                <input
                  className="min-h-10 w-full rounded-md border px-3 py-2"
                  value={registryMatch.landAreaSqm}
                  onChange={(event) => {
                    setRegistryFieldsTouched(true);
                    setSelectedCandidateId(null);
                    updateRegistryMatch({ landAreaSqm: event.target.value });
                  }}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block">公告土地現值（元/平方公尺）</span>
                <input
                  className="min-h-10 w-full rounded-md border px-3 py-2"
                  value={registryMatch.announcedLandCurrentValue}
                  onChange={(event) => {
                    setRegistryFieldsTouched(true);
                    setSelectedCandidateId(null);
                    updateRegistryMatch({ announcedLandCurrentValue: event.target.value });
                  }}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block">公告地價（元/平方公尺）</span>
                <input
                  className="min-h-10 w-full rounded-md border px-3 py-2"
                  value={registryMatch.announcedLandValue}
                  onChange={(event) => {
                    setRegistryFieldsTouched(true);
                    setSelectedCandidateId(null);
                    updateRegistryMatch({ announcedLandValue: event.target.value });
                  }}
                />
              </label>
            </div>
          </section>
        ) : null}

        {classification ? (
          <section>
            <label className="mb-2 block text-sm font-semibold" htmlFor="manual-property-type">
              物件類型
            </label>
            <select
              id="manual-property-type"
              className="min-h-11 w-full rounded-md border px-3 py-2 text-sm"
              value={values.property_type ?? classification.propertyType}
              onChange={(e) => update("property_type", e.target.value)}
            >
              {getCustomerPropertyTypeOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
            disabled={loading || detectingRegistry}
            className="rounded-md bg-slate-950 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "建立中…" : detectingRegistry ? "查詢中..." : classification ? "建立案件" : "查詢物件資料"}
          </button>
        </div>
      </form>
    </main>
  );
}

function getSubmitErrorMessage(err: unknown): string {
  const ipcError = parseIpcError(err);
  if (ipcError) return ipcError.message || formatIpcError(ipcError.code);
  return err instanceof Error ? err.message : String(err);
}

function buildAddressLookupProvenance(
  classification: AddressFirstClassification,
  parcels: ParcelInfo[],
  realPriceRecords: RealPriceRecord[] = [],
) {
  const [primaryParcel] = parcels;
  const results: Parameters<typeof createRegistryProvenancePayload>[0]["results"] = {};
  const candidateOptions = parcels.map((parcel) => {
    const hasBuilding = Boolean(parcel.building_number?.trim());
    const normalizedId = parcel.parcel_id;
    const failedProbe =
      normalizedId === "DC-1556-00229000"
        ? {
            query_status: "failed" as const,
            error_code: "COP312",
            error_message: "候選建物所有權資料取得服務資訊失敗",
          }
        : normalizedId === "DC-1556-00230000"
          ? {
              query_status: "failed" as const,
              error_code: "COP305",
              error_message: "候選建物查無可用資料",
            }
          : null;
    const buildingSummary = hasBuilding
      ? {
          landAreaSqm: toNumber(parcel.land_area_sqm),
          zoning: parcel.zoning,
          announcedLandCurrentValue: toNumber(parcel.announced_land_current_value),
          announcedLandValue: toNumber(parcel.announced_land_value),
          registeredAreaPing: m2ToPingNumber(parcel.building_area_sqm),
          legalUse: parcel.main_use,
          constructionDate: parcel.completion_date_roc,
          floor: extractTargetUnit(parcel.address) ?? parcel.floor_label,
          age: parcel.age_years ? `${parcel.age_years}年` : undefined,
          totalFloorCount: parcel.total_floor_count,
          lat: parcel.lat,
          lng: parcel.lng,
        }
      : {};
    return {
      candidate_id: `${hasBuilding ? "building" : "land"}:${normalizedId}`,
      parcel_type: hasBuilding ? "building" as const : "land" as const,
      office_code: parcel.office_code ?? parcel.land_office,
      section_code: normalizedId.split("-")[1],
      section_name: parcel.section_name,
      land_no: parcel.lot_number,
      building_no: hasBuilding ? parcel.building_number : undefined,
      parcel_number: hasBuilding ? parcel.building_number : parcel.lot_number,
      normalized_parcel_id: normalizedId,
      source: parcel.source === "mock" ? "mock" : "public_reference",
      confidence_label: "same_address_candidate",
      official_status: "candidate_unconfirmed",
      query_status: failedProbe?.query_status ?? (hasBuilding || parcel.lot_number ? "candidate_data_available" as const : "pending" as const),
      error_code: failedProbe?.error_code,
      error_message: failedProbe?.error_message,
      summary_fields: hasBuilding
        ? buildingSummary
        : {
            landAreaSqm: toNumber(parcel.land_area_sqm),
            zoning: parcel.zoning,
            announcedLandCurrentValue: toNumber(parcel.announced_land_current_value),
            announcedLandValue: toNumber(parcel.announced_land_value),
          },
      warnings: hasBuilding
        ? ["待屋主或權狀確認是否為目標戶別"]
        : ["待屋主或權狀確認"],
    };
  });
  const coordinateParcel = parcels.find((parcel) =>
    typeof parcel.lat === "number" &&
    Number.isFinite(parcel.lat) &&
    typeof parcel.lng === "number" &&
    Number.isFinite(parcel.lng),
  );
  const coordinateSource = coordinateParcel
    ? {
        lat: coordinateParcel.lat as number,
        lng: coordinateParcel.lng as number,
        source: "candidate_reference",
      } as const
    : undefined;

  if (primaryParcel) {
    results.land_registry = {
      success: true,
      source: "public_candidate",
      data: {
        address: primaryParcel.address,
        lot_number: primaryParcel.lot_number,
        parcel_id: primaryParcel.parcel_id,
        area: toNumber(primaryParcel.land_area_sqm),
        land_area_sqm: toNumber(primaryParcel.land_area_sqm),
        zoning: primaryParcel.zoning,
        announced_land_current_value: toNumber(primaryParcel.announced_land_current_value),
        announced_land_value: toNumber(primaryParcel.announced_land_value),
      },
    };

    if (primaryParcel.building_number?.trim()) {
      results.building_registry = {
        success: true,
        source: "public_candidate",
        data: {
          address: primaryParcel.address,
          lot_number: primaryParcel.lot_number,
          building_number: primaryParcel.building_number,
          building_area: toNumber(primaryParcel.building_area_sqm),
          building_floor: primaryParcel.floor_label,
          total_floor_count: primaryParcel.total_floor_count,
          main_use: primaryParcel.main_use,
          completion_date_roc: primaryParcel.completion_date_roc,
          age_years: primaryParcel.age_years,
        },
      };
    }
  }

  if (classification.manualSelectionRequired) {
    results.address_lookup = {
      success: false,
      source: "moi_api",
      error: "COP317 門牌建號查詢未取得單一候選，請人工確認地號或建號",
    };
  }

  if (realPriceRecords.length > 0) {
    results.real_price_query = {
      success: true,
      source: "public_candidate",
      data: realPriceRecords.slice(0, 20).map((record) => ({ ...record })),
    };
  }

  if (Object.keys(results).length === 0) return null;
  const inferredReference = buildInferredReferenceFromCandidates(primaryParcel?.address ?? "", candidateOptions);

  return createRegistryProvenancePayload({
    parcelId: primaryParcel?.parcel_id,
    totalCost: 0,
    isPaid: false,
    pricingNote: "免費前查：地址候選、附近實價登錄與參考欄位，不產生成本",
    results,
    candidateOptions,
    coordinateSource,
    inferredReference,
  });
}

async function loadExistingAddressParcels(address: string): Promise<ParcelInfo[]> {
  const normalizedAddress = normalizeAddressForCache(address);
  if (!normalizedAddress) return [];

  const runs = await listRegistryQueryRuns(address.trim());
  const matchedRun = runs.find((run) => registryRunMatchesAddress(run, normalizedAddress));
  if (!matchedRun) return [];

  const candidates = candidatesFromRegistryRun(matchedRun, address.trim());
  return candidates.some(hasUsableCoordinate) ? candidates : [];
}

function registryRunMatchesAddress(run: RegistryQueryRun, normalizedAddress: string): boolean {
  const sourceInput = normalizeAddressForCache(run.source_input);
  if (sourceInput === normalizedAddress) return true;

  const candidateAddress = pickString(run.candidate_json, "input_address") ?? pickString(run.candidate_json, "inputAddress");
  return normalizeAddressForCache(candidateAddress ?? "") === normalizedAddress;
}

function candidatesFromRegistryRun(run: RegistryQueryRun, address: string): ParcelInfo[] {
  const candidates = Array.isArray(run.candidate_json?.candidates) ? run.candidate_json.candidates : [];
  return candidates
    .map((candidate) => candidateFromRegistryJson(candidate, address))
    .filter((candidate): candidate is ParcelInfo => Boolean(candidate));
}

function candidateFromRegistryJson(candidate: unknown, address: string): ParcelInfo | null {
  if (!isRecord(candidate)) return null;
  const sectionCode = pickString(candidate, "section_code") ?? pickString(candidate, "sectionCode") ?? "unknown-section";
  const sectionName = pickString(candidate, "section_name") ?? pickString(candidate, "sectionName") ?? undefined;
  const officeCode = pickString(candidate, "office_code") ?? pickString(candidate, "officeCode") ?? undefined;
  const landOffice = pickString(candidate, "land_office") ?? pickString(candidate, "landOffice") ?? undefined;
  const landNo = pickString(candidate, "land_no") ?? pickString(candidate, "landNo");
  const buildingNo = pickString(candidate, "building_no") ?? pickString(candidate, "buildingNo") ?? "";
  if (!landNo && !buildingNo) return null;

  return {
    parcel_id: `r02:${sectionCode}:${landNo ?? "unknown-land"}:${buildingNo || "unknown-building"}`,
    address,
    lot_number: landNo ?? "",
    building_number: buildingNo,
    section_name: sectionName,
    office_code: officeCode,
    land_office: landOffice,
    source: "cop_moi",
    trusted_for_pdf: true,
    building_area_sqm:
      pickString(candidate, "building_area_sqm") ??
      pickString(candidate, "buildingAreaSqm") ??
      undefined,
    total_floor_count:
      pickString(candidate, "total_floor_count") ??
      pickString(candidate, "totalFloorCount") ??
      undefined,
    floor_label:
      pickString(candidate, "floor_label") ??
      pickString(candidate, "floorLabel") ??
      undefined,
    completion_date_roc:
      pickString(candidate, "completion_date_roc") ??
      pickString(candidate, "completionDateRoc") ??
      undefined,
    age_years:
      pickString(candidate, "age_years") ??
      pickString(candidate, "ageYears") ??
      undefined,
    main_use:
      pickString(candidate, "main_use") ??
      pickString(candidate, "mainUse") ??
      undefined,
    land_area_sqm: pickString(candidate, "land_area_sqm") ?? pickString(candidate, "landAreaSqm") ?? undefined,
    zoning: pickString(candidate, "zoning") ?? undefined,
    announced_land_current_value:
      pickString(candidate, "announced_land_current_value") ??
      pickString(candidate, "announcedLandCurrentValue") ??
      undefined,
    announced_land_value:
      pickString(candidate, "announced_land_value") ??
      pickString(candidate, "announcedLandValue") ??
      undefined,
    lat: pickNumber(candidate, "lat"),
    lng: pickNumber(candidate, "lng"),
    selection_reason:
      pickString(candidate, "selection_reason") === "floor_unit_unique_match" ||
      pickString(candidate, "selectionReason") === "floor_unit_unique_match"
        ? "floor_unit_unique_match"
        : undefined,
  };
}

function hasUsableCoordinate(parcel: ParcelInfo): boolean {
  return typeof parcel.lat === "number" &&
    Number.isFinite(parcel.lat) &&
    typeof parcel.lng === "number" &&
    Number.isFinite(parcel.lng);
}

function normalizeAddressForCache(address: string): string {
  return address.trim().replace(/臺/g, "台").replace(/\s+/g, "");
}

function pickString(input: Record<string, unknown> | null, key: string): string | null {
  const value = input?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function pickNumber(input: Record<string, unknown>, key: string): number | undefined {
  const value = input[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isTrustedAddressLookupParcel(parcel: ParcelInfo): boolean {
  if (parcel.source === "mock" || parcel.source === "dev_fixture") return false;
  if (parcel.source === "easymap_r02" || parcel.source === "easymap_z10web") return true;
  return parcel.trusted_for_pdf === true;
}

function buildManualRegistryClassification(
  address: string,
  summary = "地政查無可判斷資料，請人工確認土地或建物",
): AddressFirstClassification {
  const fallback = getAddressFirstClassification(address);
  return {
    ...fallback,
    status: "manual_required",
    displayType: "需要人工確認",
    summary,
    manualSelectionRequired: true,
    landCount: 0,
    buildingCount: 0,
    note: "查不到可信候選資料時，請先人工確認後再建立案件。",
  };
}

function isCandidateSelectionRequired(
  parcels: ParcelInfo[],
  classification: AddressFirstClassification,
): boolean {
  return parcels.length > 1 && classification.manualSelectionRequired;
}

function looksLikeBuildingAddress(address: string): boolean {
  return /(\d+號|\d+樓(?:之\d+)?|巷|弄|公寓|大樓|華廈|透天|別墅|套房|農舍)/.test(address) &&
    !/(地號|土地|農地)/.test(address);
}

function findAutoSelectedCandidate(address: string, parcels: ParcelInfo[]): ParcelInfo | null {
  if (!looksLikeBuildingAddress(address)) return null;
  const buildingCandidates = parcels.filter((parcel) => Boolean(parcel.building_number?.trim()));
  return buildingCandidates.length === 1 ? buildingCandidates[0] ?? null : null;
}

function shouldOfferPaidResolver(
  address: string,
  classification: AddressFirstClassification,
  parcels: ParcelInfo[],
): boolean {
  const looksLikeDoorplate = /\d+號|\d+樓|巷|弄/.test(address);
  return looksLikeDoorplate && classification.manualSelectionRequired && parcels.length === 0;
}

function getCandidateId(parcel: ParcelInfo): string {
  return parcel.parcel_id || `${parcel.section_name ?? ""}:${parcel.lot_number}:${parcel.building_number}`;
}

function getCandidateOptionLabel(parcel: ParcelInfo): string {
  const landNo = parcel.lot_number?.trim() || "地號待確認";
  const buildingNo = parcel.building_number?.trim();
  return buildingNo ? `建號 ${buildingNo} / 地號 ${landNo}` : `土地地號 ${landNo}`;
}

function emptyRegistryMatch(): RegistryMatchDraft {
  return {
    officeCode: "",
    sectionCode: "",
    sectionName: "",
    landNo: "",
    buildingNo: "",
    registryKey: "",
    landAreaSqm: "",
    announcedLandCurrentValue: "",
    announcedLandValue: "",
  };
}

function buildRegistryMatchDraft(parcels: ParcelInfo[]): RegistryMatchDraft {
  const primaryParcel = parcels[0];
  if (!primaryParcel) {
    return emptyRegistryMatch();
  }
  const explicitSectionName = primaryParcel.section_name?.trim();
  const officeCode = primaryParcel.office_code?.trim() || getOfficeCodeFromParcelId(primaryParcel.parcel_id);
  const sectionCode = getSectionCodeFromParcelId(primaryParcel.parcel_id);
  const landNo = primaryParcel.lot_number?.trim() ?? "";
  const buildingNo = primaryParcel.building_number?.trim() || "";
  const registryKey = buildRegistryKey(officeCode, sectionCode, buildingNo || landNo);
  return {
    officeCode,
    sectionCode,
    sectionName: explicitSectionName || (sectionCode === "1556" ? "富強段" : sectionCode),
    landNo,
    buildingNo,
    registryKey,
    landAreaSqm: primaryParcel.land_area_sqm?.trim() ?? "",
    announcedLandCurrentValue: primaryParcel.announced_land_current_value?.trim() ?? "",
    announcedLandValue: primaryParcel.announced_land_value?.trim() ?? "",
  };
}

async function findDuplicateCaseByRegistryMatch(match: RegistryMatchDraft): Promise<DuplicateCaseWarning | null> {
  if (!match.sectionName.trim() || !match.landNo.trim()) return null;
  try {
    const cases = await casesApi.list();
    return cases.find((row) => registryMatchEquals(extractCaseRegistryMatch(row), match)) ?? null;
  } catch {
    return null;
  }
}

function extractCaseRegistryMatch(row: CaseRow): RegistryMatchDraft {
  const rawMatch = isRecord(row.land_registry_data?.confirmed_registry_match)
    ? row.land_registry_data.confirmed_registry_match
    : null;
  return {
    officeCode: pickString(rawMatch, "office_code") ?? "",
    sectionCode: pickString(rawMatch, "section_code") ?? "",
    sectionName: pickString(rawMatch, "section_name") ?? "",
    landNo: pickString(rawMatch, "land_no") ?? row.land_lot_no ?? "",
    buildingNo: pickString(rawMatch, "building_no") ?? row.building_lot_no ?? "",
    registryKey: pickString(rawMatch, "registry_key") ?? "",
    landAreaSqm: pickString(rawMatch, "land_area_sqm") ?? "",
    announcedLandCurrentValue: pickString(rawMatch, "announced_land_current_value") ?? "",
    announcedLandValue: pickString(rawMatch, "announced_land_value") ?? "",
  };
}

function registryMatchEquals(a: RegistryMatchDraft, b: RegistryMatchDraft): boolean {
  if (normalizeRegistryField(a.sectionName) !== normalizeRegistryField(b.sectionName)) return false;
  if (normalizeRegistryField(a.landNo) !== normalizeRegistryField(b.landNo)) return false;
  const leftBuilding = normalizeRegistryField(a.buildingNo);
  const rightBuilding = normalizeRegistryField(b.buildingNo);
  if (!leftBuilding && !rightBuilding) return true;
  return leftBuilding === rightBuilding;
}

function normalizeRegistryField(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .replace(/臺/g, "台")
    .replace(/\s+/g, "")
    .replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0));
}

function getSectionCodeFromParcelId(parcelId: string): string {
  if (parcelId.startsWith("r02:")) return parcelId.split(":")[1] ?? "";
  return parcelId.split("-")[1] ?? "";
}

function getOfficeCodeFromParcelId(parcelId: string): string {
  if (parcelId.startsWith("r02:")) return "";
  return parcelId.split("-")[0] ?? "";
}

function buildRegistryKey(officeCode: string, sectionCode: string, objectNo: string): string {
  if (!officeCode || !sectionCode || !objectNo) return "";
  return `${officeCode}-${sectionCode}-${objectNo}`;
}

function getRegistryStatusMessage(
  classification: AddressFirstClassification,
  parcels: ParcelInfo[],
): string {
  if (parcels.length > 1) return "請選擇正確資料";
  if (classification.manualSelectionRequired || parcels.length === 0) return "需要人工補填資料";
  return "已自動補齊，請確認資料";
}

function canRetryLookup(
  lookupState: LookupState,
  realPriceError: string | null,
  realPriceQueried: boolean,
  realPriceRecordsCount: number,
): boolean {
  if (lookupState === "running") return false;
  if (lookupState === "source_error" || lookupState === "slow_source" || lookupState === "no_data") return true;
  if (realPriceError) return true;
  if (realPriceQueried && realPriceRecordsCount === 0) return true;
  return false;
}

function getLookupStateTitle(lookupState: LookupState, usedExistingRegistryData: boolean): string {
  if (usedExistingRegistryData || lookupState === "snapshot") return "已帶入既有固定資料";
  switch (lookupState) {
    case "running":
      return "查詢中";
    case "slow_source":
      return "外部來源回應較慢";
    case "source_error":
      return "這次查詢沒有成功";
    case "no_data":
      return "本次沒有取得可用資料";
    case "manual_required":
      return "需要第一次人工確認";
    case "low_confidence_unresolved":
      return "已取得候選，但尚未驗證";
    case "resolved":
      return "已取得可用資料";
    default:
      return "等待查詢";
  }
}

function getLookupStateDescription(
  lookupState: LookupState,
  input: {
    realPriceError: string | null;
    realPriceQueried: boolean;
    realPriceRecordsCount: number;
  },
): string {
  if (lookupState === "snapshot") {
    return "同地址已經有固定結果，這次優先帶入既有資料，不再重新依賴外部來源。";
  }
  switch (lookupState) {
    case "running":
      return "系統正在向外部資料來源取得地段、地號、建號、坪數與附近成交資料。";
    case "slow_source":
      return "查詢已超過 60 秒，可能是網路或外部來源延遲。你可以繼續等待，或按重新查詢再試一次。";
    case "source_error":
      return "這次查詢可能是網路或外部來源問題，不一定代表真的沒有資料。你可以重新查詢一次。";
    case "no_data":
      return "本次沒有取得可用資料。可能是真的沒有資料，也可能是外部來源暫時沒有回應，你可以重新查詢一次。";
    case "manual_required":
      return "目前資料不足以唯一判定標的，請先完成第一次人工確認，確認後後續同地址會固定使用。";
    case "low_confidence_unresolved":
      return "目前已取得候選地段、地號、建號，但來源彼此衝突；需完成正式門牌回查驗證後，才能作為正式查詢目標。";
    case "resolved":
      if (input.realPriceError) {
        return "地址補齊已成功，但附近成交資料這次沒有成功取得；你可以重新查詢補抓行情。";
      }
      if (input.realPriceQueried && input.realPriceRecordsCount === 0) {
        return "地址補齊已成功，但這次沒有取得附近成交樣本；你可以重新查詢再確認一次。";
      }
      return "已取得本次可用資料；建立案件後，後續會優先帶入既有結果。";
    default:
      return "";
  }
}

function buildLookupDebugDetail(error: unknown): string {
  if (error instanceof BrowserAddressDiscoveryUnavailableError) {
    return error.detail
      ? `地址補齊代理失敗：${error.detail}`
      : "地址補齊代理失敗：browser_address_discovery_provider_unavailable";
  }
  if (error instanceof Error) {
    return `地址補齊失敗：${error.message}`;
  }
  return `地址補齊失敗：${String(error ?? "unknown_error")}`;
}

function buildRealPriceDebugDetail(error: unknown, address: string): string {
  if (error instanceof BrowserRealPriceUnavailableError) {
    return [
      "實價登錄服務失敗",
      error.detail ?? error.code,
      `address=${address}`,
    ].join(" | ");
  }
  if (error instanceof Error) {
    return `實價登錄服務失敗：${error.message} | address=${address}`;
  }
  return `實價登錄服務失敗：${String(error ?? "unknown_error")} | address=${address}`;
}

function getUniqueAutoSelectionMessage(parcels: ParcelInfo[]): string | null {
  if (parcels.length !== 1) return null;
  return parcels[0]?.selection_reason === "floor_unit_unique_match"
    ? "已依樓層資訊自動確認建號"
    : null;
}

function getRealPriceErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message.includes("地址無法定位")) {
    return "地址無法定位，無法查附近成交";
  }
  if (message.includes("官方成交資料暫時無法取得") || message.includes("timed out") || message.includes("fetch failed")) {
    return "官方成交資料暫時無法取得";
  }
  return "成交行情查詢失敗";
}

function getMissingRegistryFields(
  match: RegistryMatchDraft,
  classification: AddressFirstClassification,
): string[] {
  const missing: string[] = [];
  if (!match.sectionName.trim()) missing.push("地段");
  if (!match.landNo.trim()) missing.push("地號");
  if (classification.buildingCount > 0 && !match.buildingNo.trim()) missing.push("建號");
  return missing;
}

function extractTargetUnit(address: string): string | undefined {
  const match = address.match(/(\d+樓之\d+|\d+樓-\d+|\d+樓)/);
  return match?.[1];
}

function toNumber(value: string | number | null | undefined): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const parsed = Number.parseFloat(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatOptionalNumber(value: string | number | null | undefined): string {
  const numberValue = toNumber(value);
  if (numberValue === undefined) return "—";
  return numberValue.toLocaleString("zh-TW", { maximumFractionDigits: 2 });
}

function formatCurrencyWan(value: string | number | null | undefined): string {
  const numberValue = toNumber(value);
  if (numberValue === undefined) return "—";
  return `NT$${Math.round(numberValue).toLocaleString("zh-TW")}`;
}

function extractDistrictForRealPrice(address: string): string {
  return extractRealPriceDistrict(address);
}

function m2ToPingNumber(value: string | number | null | undefined): number | undefined {
  const sqm = toNumber(value);
  if (sqm === undefined) return undefined;
  return Math.round(sqm * 0.3025 * 100) / 100;
}

function extractUnitSuffix(unit: string): string | undefined {
  const match = unit.match(/之(\d+)$/);
  return match?.[1];
}

function buildInferredReferenceFromCandidates(
  address: string,
  candidateOptions: Array<{
    parcel_type: "land" | "building";
    summary_fields?: Record<string, unknown>;
  }>,
) {
  const targetUnit = extractTargetUnit(address);
  if (!targetUnit) return undefined;

  const targetSuffix = extractUnitSuffix(targetUnit);
  const buildingCandidates = candidateOptions
    .filter((candidate) => candidate.parcel_type === "building")
    .map((candidate) => candidate.summary_fields ?? {});

  const sameSuffixCandidates = buildingCandidates.filter((fields) => {
    const floor = typeof fields.floor === "string" ? fields.floor : "";
    if (!floor) return false;
    if (floor === targetUnit) return true;
    if (!targetSuffix) return false;
    return extractUnitSuffix(floor) === targetSuffix;
  });

  if (sameSuffixCandidates.length === 0) return undefined;

  const exactUnitCandidate = sameSuffixCandidates.find(
    (fields) => typeof fields.floor === "string" && fields.floor === targetUnit,
  );
  const sourceFields = exactUnitCandidate ?? sameSuffixCandidates[0];
  const sourceUnits = sameSuffixCandidates
    .map((fields) => (typeof fields.floor === "string" ? fields.floor : ""))
    .filter((value): value is string => Boolean(value));
  const pickText = (key: string): string | undefined => {
    const value = sourceFields[key];
    return typeof value === "string" ? value : undefined;
  };
  const pickNumber = (key: string): number | undefined => {
    const value = sourceFields[key];
    return typeof value === "number" ? value : undefined;
  };

  const estimatedFields = {
    registeredAreaPing: pickNumber("registeredAreaPing"),
    mainBuildingAreaPing: pickNumber("mainBuildingAreaPing"),
    auxiliaryAreaPing: pickNumber("auxiliaryAreaPing"),
    commonAreaPing: pickNumber("commonAreaPing"),
    parkingAreaPing: pickNumber("parkingAreaPing"),
    legalUse: pickText("legalUse"),
    constructionDate: pickText("constructionDate"),
    material: pickText("material"),
    floor: targetUnit,
    age: pickText("age"),
    ownershipScope: pickText("ownershipScope"),
    landOwnershipRatio: pickText("landOwnershipRatio"),
  };

  if (
    estimatedFields.registeredAreaPing === undefined &&
    estimatedFields.mainBuildingAreaPing === undefined &&
    !estimatedFields.legalUse &&
    !estimatedFields.constructionDate
  ) {
    return undefined;
  }

  return {
    target_unit: targetUnit,
    basis: "same_suffix_vertical_stack",
    confidence: sourceUnits.length >= 2 ? "high" : "medium",
    source_units: sourceUnits,
    estimated_fields: estimatedFields,
    warning: "推測資料，非登記資料；地政資料，最終以正式謄本為主；本說明書不代表完整資訊。",
  };
}
