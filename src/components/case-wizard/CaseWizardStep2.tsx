"use client";

import { PullParcelDataButton } from "@/components/PullParcelDataButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { casesApi } from "@/lib/cases-api";
import type { CaseRow } from "@/lib/cases-api";
import {
  buildRegistryPreviewSections,
  summarizeRegistryPreview,
  type RegistryPreviewSection,
} from "@/lib/registry-preview";
import { useMemo, useState } from "react";

// W3: 移除未使用的 draft prop
interface CaseWizardStep2Props {
  caseData: CaseRow;
}

// W3: function signature 已不含 draft（interface 移除後對齊）
export function CaseWizardStep2({ caseData }: CaseWizardStep2Props) {
  const [landLotNo, setLandLotNo] = useState(caseData.land_lot_no);
  const [buildingLotNo, setBuildingLotNo] = useState(caseData.building_lot_no ?? "");
  const [registryPayload, setRegistryPayload] = useState<Record<string, unknown> | null>(
    caseData.land_registry_data ?? null,
  );

  const parcelId = useMemo(() => landLotNo || "0001-0000", [landLotNo]);

  function readStringValue(value: unknown): string {
    return typeof value === "string" ? value : "";
  }

  async function handleSaved(data: Record<string, unknown>) {
    const payload =
      data.land_registry_data && typeof data.land_registry_data === "object"
        ? (data.land_registry_data as Record<string, unknown>)
        : data;
    const landRegistryEntry = payload.land_registry as Record<string, unknown> | undefined;
    const buildingRegistryEntry =
      payload.building_registry as Record<string, unknown> | undefined;
    const landRegistry =
      (landRegistryEntry?.data as Record<string, unknown> | undefined) ?? landRegistryEntry ?? {};
    const buildingRegistry =
      (buildingRegistryEntry?.data as Record<string, unknown> | undefined) ??
      buildingRegistryEntry ??
      {};

    const nextLand = readStringValue(
      data.land_lot_no ?? landRegistry.lot_number ?? landRegistry.lot ?? landLotNo,
    );
    const nextBuilding = readStringValue(
      data.building_lot_no ??
        buildingRegistry.building_number ??
        buildingRegistry.building_lot_no ??
        landRegistry.building_number ??
        landRegistry.building_lot_no ??
        buildingLotNo,
    );
    setLandLotNo(nextLand || landLotNo);
    setBuildingLotNo(nextBuilding || buildingLotNo);
    setRegistryPayload(payload);
    await casesApi.update(caseData.id, {
      land_lot_no: nextLand || landLotNo,
      building_lot_no: nextBuilding || buildingLotNo || null,
      land_registry_data: payload,
    });
  }

  const registryPreview = useMemo(
    () => buildRegistryPreviewSections(registryPayload),
    [registryPayload],
  );
  const registrySummary = useMemo(
    () => summarizeRegistryPreview(registryPreview),
    [registryPreview],
  );
  const detectionState = useMemo(
    () =>
      buildRegistryDetectionState({
        address: caseData.address,
        landLotNo,
        buildingLotNo,
        sections: registryPreview,
      }),
    [buildingLotNo, caseData.address, landLotNo, registryPreview],
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(300px,360px)_1fr]">
      <div className="min-w-0 space-y-4 rounded-lg border bg-slate-50 p-4">
        <AddressDetectionPanel state={detectionState} />
        <PullParcelDataButton
          caseId={caseData.id}
          parcelId={parcelId}
          apiIds={[
            "land_registry",
            "co_owners",
            "building_registry",
            "building_ownership",
            "mortgages",
            "building_other_rights",
          ]}
          onPreview={setRegistryPayload}
          onSaved={handleSaved}
        />
        <div className="space-y-1.5">
          <Label htmlFor="wizard-step2-land-lot-no">地號</Label>
          <Input id="wizard-step2-land-lot-no" value={landLotNo} readOnly />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wizard-step2-building-lot-no">建號</Label>
          <Input
            id="wizard-step2-building-lot-no"
            value={buildingLotNo}
            onChange={(e) => setBuildingLotNo(e.target.value)}
            onBlur={() => {
              casesApi
                .update(caseData.id, { building_lot_no: buildingLotNo || null })
                .catch(() => null);
            }}
          />
        </div>
      </div>

      <RegistryPreviewPanel sections={registryPreview} statusText={registrySummary.statusText} />
    </div>
  );
}

interface RegistryDetectionState {
  address: string;
  statusLabel: string;
  statusTone: "success" | "manual";
  compositionLabel: string;
  summary: string;
  showManualFallback: boolean;
}

function buildRegistryDetectionState({
  address,
  landLotNo,
  buildingLotNo,
  sections,
}: {
  address: string | null;
  landLotNo: string | null;
  buildingLotNo: string | null;
  sections: RegistryPreviewSection[];
}): RegistryDetectionState {
  const hasLand =
    Boolean(landLotNo?.trim()) ||
    sections.some((section) => section.id === "land_registry" && section.fields.length > 0);
  const hasBuilding =
    Boolean(buildingLotNo?.trim()) ||
    sections.some((section) => section.id === "building_registry" && section.fields.length > 0);

  if (hasLand && hasBuilding) {
    return {
      address: address ?? "",
      statusLabel: "地政自動判斷",
      statusTone: "success",
      compositionLabel: "土地 + 建物",
      summary: "已依地址與謄本資料判斷為含建物案件，系統會帶到土地與建物章節審核。",
      showManualFallback: false,
    };
  }

  if (hasLand) {
    return {
      address: address ?? "",
      statusLabel: "地政自動判斷",
      statusTone: "success",
      compositionLabel: "土地",
      summary: "目前讀到土地資料，建物資料若後續查到會自動加入審核章節。",
      showManualFallback: false,
    };
  }

  return {
    address: address ?? "",
    statusLabel: "需人工確認",
    statusTone: "manual",
    compositionLabel: "尚未判斷",
    summary: "系統還沒有從地址讀到明確的地號或建號。",
    showManualFallback: true,
  };
}

function AddressDetectionPanel({ state }: { state: RegistryDetectionState }) {
  return (
    <section
      className="space-y-3 rounded-md border bg-background p-3"
      aria-labelledby="address-detection-heading"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id="address-detection-heading" className="text-sm font-semibold">
            地址資料補齊
          </h3>
          <p className="mt-1 break-words text-xs text-muted-foreground">
            {state.address || "尚未輸入地址"}
          </p>
        </div>
        <span
          className={
            state.statusTone === "success"
              ? "shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700"
              : "shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
          }
        >
          {state.statusLabel}
        </span>
      </div>
      <div className="rounded-md border px-3 py-2">
        <p className="text-xs text-muted-foreground">判斷結果</p>
        <p className="mt-1 text-sm font-semibold">{state.compositionLabel}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{state.summary}</p>
      </div>
      {state.showManualFallback ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          請先補上地號或建號；若地址回傳多筆候選，後續會在這裡顯示候選清單讓你選。
        </p>
      ) : null}
    </section>
  );
}

function RegistryPreviewPanel({
  sections,
  statusText,
}: {
  sections: RegistryPreviewSection[];
  statusText: string;
}) {
  return (
    <section className="min-w-0 rounded-lg border bg-background p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">謄本資料預覽</h3>
          <p className="text-sm text-muted-foreground">
            拉完謄本後，這裡會顯示可帶入不動產說明書的欄位。
          </p>
        </div>
        <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
          {statusText}
        </span>
      </div>

      {sections.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          尚未讀到謄本資料。請先正式查詢；若資料查不到，後續欄位會保留空白讓業務手寫。
        </div>
      ) : (
        <div className="grid gap-4 2xl:grid-cols-2">
          {sections.map((section) => (
            <div key={section.id} className="min-w-0 overflow-hidden rounded-md border">
              <div className="border-b bg-muted/30 px-3 py-2">
                <p className="text-sm font-medium">{section.title}</p>
                <p className="text-xs text-muted-foreground">{section.source}</p>
              </div>
              {section.fields.length > 0 ? (
                <div className="divide-y text-sm">
                  {section.fields.map((item) => (
                    <div
                      key={`${section.id}-${item.label}-${item.target}`}
                      className="grid gap-1 px-3 py-2 md:grid-cols-[7rem_minmax(0,1fr)_9rem]"
                    >
                      <div className="text-muted-foreground">{item.label}</div>
                      <div className="min-w-0 break-words font-medium">{item.value}</div>
                      <div className="min-w-0 break-words text-xs text-muted-foreground">
                        {item.target}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-3 py-4 text-sm text-muted-foreground">
                  這一部沒有讀到可用欄位。
                </p>
              )}
              {section.missing.length > 0 ? (
                <p className="border-t px-3 py-2 text-xs leading-relaxed text-amber-700">
                  目前空白：{section.missing.slice(0, 10).join("、")}
                  {section.missing.length > 10 ? "…" : ""}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
