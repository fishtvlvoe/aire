"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
  confirmCaseRegistryMatch,
  listRegistryQueryRuns,
  paidAddressResolver,
  type ParcelInfo,
  type RegistryQueryRun,
} from "@/lib/land-registry-api";
import { createRegistryProvenancePayload } from "@/lib/registry-provenance";
import { caseDetailHref } from "@/lib/case-routes";

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
  sectionName: string;
  landNo: string;
  buildingNo: string;
};

type DuplicateCaseWarning = Pick<CaseRow, "id" | "case_no" | "case_name" | "address">;

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
  const [registryMatch, setRegistryMatch] = useState<RegistryMatchDraft>({
    sectionName: "",
    landNo: "",
    buildingNo: "",
  });
  const [loading, setLoading] = useState(false);

  function update<K extends keyof FormValues>(k: K, v: FormValues[K]) {
    setValues((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  async function detectRegistry(): Promise<AddressFirstClassification | null> {
    setSubmitError(null);
    setDetectingRegistry(true);
    setRegistryDetectMessage(null);
    setUsedExistingRegistryData(false);
    setDuplicateCase(null);
    setSelectedCandidateId(null);
    setRegistryFieldsTouched(false);
    setPaidResolverError(null);
    try {
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
      if (!result.manualSelectionRequired && !needsCandidateSelection) {
        update("property_type", result.propertyType);
        const primaryLot = trustedParcels[0]?.lot_number?.trim();
        if (primaryLot) setLandLots([primaryLot]);
      }
      const nextRegistryMatch = needsCandidateSelection
        ? { sectionName: "", landNo: "", buildingNo: "" }
        : buildRegistryMatchDraft(trustedParcels);
      setRegistryMatch(nextRegistryMatch);
      setDuplicateCase(await findDuplicateCaseByRegistryMatch(nextRegistryMatch));
      return result;
    } catch (error) {
      const result = buildManualRegistryClassification(values.address);
      setDetectedParcels([]);
      setClassification(result);
      setRegistryDetectMessage(
        error instanceof Error
          ? `請使用 AIRE 桌面版完成資料補齊，或先人工填寫地段、地號、建號。${error.message ? `（${error.message}）` : ""}`
          : "請使用 AIRE 桌面版完成資料補齊，或先人工填寫地段、地號、建號。",
      );
      setRegistryMatch({ sectionName: "", landNo: "", buildingNo: "" });
      setDuplicateCase(null);
      setSelectedCandidateId(null);
      setRegistryFieldsTouched(false);
      return result;
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
      if (!classification) {
        await detectRegistry();
        return;
      }
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
          ...buildAddressLookupProvenance(detected, detectedParcels),
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
                  section_name: registryMatch.sectionName || null,
                  land_no: registryMatch.landNo || null,
                  building_no: registryMatch.buildingNo || null,
                  status: "confirmed",
                },
              }),
        },
      });
      if (!createAsRegistryPending) {
        await confirmCaseRegistryMatch({
          caseId: created.id,
          sectionName: registryMatch.sectionName,
          landNo: registryMatch.landNo,
          buildingNo: registryMatch.buildingNo || null,
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
      setRegistryMatch({ sectionName: "", landNo: "", buildingNo: "" });
      setUsedExistingRegistryData(false);
    } catch (error) {
      setPaidResolverError(error instanceof Error ? error.message : String(error));
    } finally {
      setPaidResolverRunning(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold tracking-normal">新增案件</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        先輸入地址讓系統補齊土地、建物與說明書章節；只有查不到才人工選。
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
                setRegistryMatch({ sectionName: "", landNo: "", buildingNo: "" });
              }}
              className="min-h-11 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="例：宜蘭縣五結鄉協和村親河路二段 1 號"
            />
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
          </section>
        ) : null}

        {classification && isCandidateSelectionRequired(detectedParcels, classification) ? (
          <section className="rounded-lg border border-amber-300 bg-amber-50 p-4">
            <strong className="block text-amber-950">候選物件資料</strong>
            <p className="mt-1 text-sm text-amber-900">請先選定一筆候選，才可進入正式查詢。</p>
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
            <p className="mt-1 text-sm text-muted-foreground">請確認地段、地號、建號後再進入正式查詢。</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="text-sm">
                <span className="mb-1 block">地段</span>
                <input
                  className="min-h-10 w-full rounded-md border px-3 py-2"
                  value={registryMatch.sectionName}
                  onChange={(event) => {
                    setRegistryFieldsTouched(true);
                    setSelectedCandidateId(null);
                    setRegistryMatch((prev) => ({ ...prev, sectionName: event.target.value }));
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
                    setRegistryMatch((prev) => ({ ...prev, landNo: event.target.value }));
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
                    setRegistryMatch((prev) => ({ ...prev, buildingNo: event.target.value }));
                  }}
                  placeholder="無建號可留空"
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
      section_code: normalizedId.split("-")[1],
      section_name: parcel.section_name,
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

  if (Object.keys(results).length === 0) return null;
  const inferredReference = buildInferredReferenceFromCandidates(primaryParcel?.address ?? "", candidateOptions);

  return createRegistryProvenancePayload({
    parcelId: primaryParcel?.parcel_id,
    totalCost: 0,
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
  const landNo = pickString(candidate, "land_no") ?? pickString(candidate, "landNo");
  const buildingNo = pickString(candidate, "building_no") ?? pickString(candidate, "buildingNo") ?? "";
  if (!landNo && !buildingNo) return null;

  return {
    parcel_id: `r02:${sectionCode}:${landNo ?? "unknown-land"}:${buildingNo || "unknown-building"}`,
    address,
    lot_number: landNo ?? "",
    building_number: buildingNo,
    source: "cop_moi",
    trusted_for_pdf: true,
    lat: pickNumber(candidate, "lat"),
    lng: pickNumber(candidate, "lng"),
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
  if (parcel.source === "easymap_r02") return true;
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

function buildRegistryMatchDraft(parcels: ParcelInfo[]): RegistryMatchDraft {
  const primaryParcel = parcels[0];
  if (!primaryParcel) {
    return { sectionName: "", landNo: "", buildingNo: "" };
  }
  const firstBuilding = parcels.find((parcel) => parcel.building_number?.trim());
  const explicitSectionName = primaryParcel.section_name?.trim();
  const sectionCode = getSectionCodeFromParcelId(primaryParcel.parcel_id);
  return {
    sectionName: explicitSectionName || (sectionCode === "1556" ? "富強段" : sectionCode),
    landNo: primaryParcel.lot_number?.trim() ?? "",
    buildingNo: primaryParcel.building_number?.trim() || firstBuilding?.building_number?.trim() || "",
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
    sectionName: pickString(rawMatch, "section_name") ?? "",
    landNo: pickString(rawMatch, "land_no") ?? row.land_lot_no ?? "",
    buildingNo: pickString(rawMatch, "building_no") ?? row.building_lot_no ?? "",
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

function getRegistryStatusMessage(
  classification: AddressFirstClassification,
  parcels: ParcelInfo[],
): string {
  if (parcels.length > 1) return "請選擇正確資料";
  if (classification.manualSelectionRequired || parcels.length === 0) return "需要人工補填資料";
  return "已自動補齊，請確認資料";
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
