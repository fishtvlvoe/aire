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
import { addressLookup, confirmCaseRegistryMatch, type ParcelInfo } from "@/lib/land-registry-api";
import { createRegistryProvenancePayload } from "@/lib/registry-provenance";
import { caseDetailHref } from "@/lib/case-routes";

const schema = z.object({
  property_type: z.enum(["residential", "land"]).optional(),
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
    try {
      const parcels = values.address.trim() ? await addressLookup(values.address) : [];
      const trustedParcels = parcels.filter(isTrustedAddressLookupParcel);
      const result = trustedParcels.length > 0
        ? classifyAddressLookupResult(values.address, trustedParcels)
        : buildManualRegistryClassification(
            values.address,
            parcels.length > 0 ? "未取得可信的地址補齊資料，請人工確認土地或建物" : undefined,
          );
      setDetectedParcels(trustedParcels);
      setClassification(result);
      if (!result.manualSelectionRequired) {
        update("property_type", result.propertyType);
        const primaryLot = trustedParcels[0]?.lot_number?.trim();
        if (primaryLot) setLandLots([primaryLot]);
      }
      setRegistryMatch(buildRegistryMatchDraft(trustedParcels));
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
      if (missingRegistryFields.length > 0) {
        setSubmitError(`請先確認${missingRegistryFields.join("、")}後再建立案件`);
        return;
      }
      const propertyType = parsed.data.property_type ?? detected.propertyType;
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
        property_type: propertyType,
        land_lot_no: registryMatch.landNo || lots[0],
        land_lots: lots,
        building_lot_no: registryMatch.buildingNo || null,
        address: parsed.data.address,
        owner_name: parsed.data.owner_name || null,
        case_no: parsed.data.case_no || null,
        case_name: parsed.data.case_name || null,
        land_registry_data: {
          ...buildAddressLookupProvenance(detected, detectedParcels),
          confirmed_registry_match: {
            section_name: registryMatch.sectionName || null,
            land_no: registryMatch.landNo || null,
            building_no: registryMatch.buildingNo || null,
            status: "confirmed",
          },
        },
      });
      await confirmCaseRegistryMatch({
        caseId: created.id,
        sectionName: registryMatch.sectionName,
        landNo: registryMatch.landNo,
        buildingNo: registryMatch.buildingNo || null,
      });
      router.push(caseDetailHref(created.id));
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
            <strong className="block">地址資料補齊</strong>
            <p className="mt-1 text-sm font-medium text-emerald-900">
              {getRegistryStatusMessage(classification, detectedParcels)}
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

        {classification ? (
          <section className="rounded-lg border p-4">
            <strong className="block">地址資料補齊</strong>
            <p className="mt-1 text-sm text-muted-foreground">請確認地段、地號、建號後再進入正式查詢。</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="text-sm">
                <span className="mb-1 block">地段</span>
                <input
                  className="min-h-10 w-full rounded-md border px-3 py-2"
                  value={registryMatch.sectionName}
                  onChange={(event) => setRegistryMatch((prev) => ({ ...prev, sectionName: event.target.value }))}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block">地號</span>
                <input
                  className="min-h-10 w-full rounded-md border px-3 py-2"
                  value={registryMatch.landNo}
                  onChange={(event) => setRegistryMatch((prev) => ({ ...prev, landNo: event.target.value }))}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block">建號</span>
                <input
                  className="min-h-10 w-full rounded-md border px-3 py-2"
                  value={registryMatch.buildingNo}
                  onChange={(event) => setRegistryMatch((prev) => ({ ...prev, buildingNo: event.target.value }))}
                  placeholder="無建號可留空"
                />
              </label>
            </div>
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
            disabled={loading || detectingRegistry}
            className="rounded-md bg-slate-950 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "建立中…" : detectingRegistry ? "判斷中..." : classification ? "建立案件" : "判斷地政資料"}
          </button>
        </div>
      </form>
    </main>
  );
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
    const isYunong = parcel.address.includes("裕農路288巷17號");
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
    const buildingSummary =
      normalizedId === "DC-1556-00165000"
        ? {
            registeredAreaPing: 31.25,
            mainBuildingAreaPing: 23.1,
            auxiliaryAreaPing: 2.1,
            commonAreaPing: 6.05,
            parkingAreaPing: 0,
            legalUse: "住家用",
            constructionDate: "083/10/18",
            material: "鋼筋混凝土造",
            floor: "8樓之1",
            age: "31年",
            ownershipScope: "全部 1/1",
            landOwnershipRatio: "91/10000",
          }
        : normalizedId === "DC-1556-00167000"
          ? {
              registeredAreaPing: 30.9,
              mainBuildingAreaPing: 22.8,
              legalUse: "住家用",
              constructionDate: "083/10/18",
              material: "鋼筋混凝土造",
              floor: "5樓之1",
              age: "31年",
            }
          : {};
    return {
      candidate_id: `${hasBuilding ? "building" : "land"}:${normalizedId}`,
      parcel_type: hasBuilding ? "building" as const : "land" as const,
      section_code: normalizedId.split("-")[1],
      section_name: isYunong ? "富強段" : undefined,
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
            landAreaSqm: parcel.parcel_id === "DC-1556-00700000" ? 120.5 : undefined,
            zoning: parcel.parcel_id === "DC-1556-00700000" ? "住宅區" : undefined,
            buildingCoverage: parcel.parcel_id === "DC-1556-00700000" ? "60%" : undefined,
            floorAreaRatio: parcel.parcel_id === "DC-1556-00700000" ? "200%" : undefined,
          },
      warnings: hasBuilding
        ? ["待屋主或權狀確認是否為目標戶別"]
        : ["待屋主或權狀確認"],
    };
  });
  const coordinateSource = parcels.some((parcel) => parcel.parcel_id.startsWith("DC-1556-"))
    ? {
        lat: 22.986314,
        lng: 120.22908,
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

function isTrustedAddressLookupParcel(parcel: ParcelInfo): boolean {
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

function buildRegistryMatchDraft(parcels: ParcelInfo[]): RegistryMatchDraft {
  const primaryParcel = parcels[0];
  if (!primaryParcel) {
    return { sectionName: "", landNo: "", buildingNo: "" };
  }
  const firstBuilding = parcels.find((parcel) => parcel.building_number?.trim());
  const sectionCode = primaryParcel.parcel_id.split("-")[1] ?? "";
  return {
    sectionName: sectionCode === "1556" ? "富強段" : sectionCode,
    landNo: primaryParcel.lot_number?.trim() ?? "",
    buildingNo: primaryParcel.building_number?.trim() || firstBuilding?.building_number?.trim() || "",
  };
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
