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

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(300px,360px)_1fr]">
      <div className="min-w-0 space-y-4 rounded-lg border bg-slate-50 p-4">
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
          尚未讀到謄本資料。請先拉謄本；若 API 查不到，後續欄位會保留空白讓業務手寫。
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
