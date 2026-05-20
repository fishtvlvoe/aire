"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import type { CaseRow } from "@/lib/cases-api";
import { loadDraft, useDraftAutosave } from "@/lib/use-draft-autosave";
import { DisclosureFormLand } from "@/components/disclosure-form-land";
import {
  HouseMvpWorkbench,
  normalizeHouseMvpWorkbenchState,
  type HouseMvpWorkbenchState,
} from "@/components/HouseMvpWorkbench";
import { storage } from "@/lib/storage";
import type { DisclosureData } from "@/lib/storage";
import {
  CASE_ASSET_MAX_BYTES,
  importCaseAsset,
  isAcceptedCaseAssetMime,
  listCaseAssets,
  type CaseAssetKind,
  readCaseAssetBytes,
} from "@/lib/floor-plan-assets";

interface CaseWizardStep3DisclosureProps {
  caseId: string;
  caseData: CaseRow;
  onNext: () => void;
  onPrev: () => void;
}

function toDisclosureData(p: Record<string, unknown>): DisclosureData {
  const tri = (v: unknown) => v === "true";
  return {
    conditionLeakage: tri(p.condition_leakage),
    conditionRenovation: tri(p.condition_renovation),
    conditionIllegalStructure: tri(p.condition_illegal_addition),
  };
}

function fromDisclosureData(d: DisclosureData): Record<string, string> {
  return {
    condition_leakage: d.conditionLeakage ? "true" : "false",
    condition_renovation: d.conditionRenovation ? "true" : "false",
    condition_illegal_addition: d.conditionIllegalStructure ? "true" : "false",
  };
}

const CONDITION_KEYS = ["condition_leakage", "condition_renovation", "condition_illegal_addition"];
function base64ToBytes(base64: string): Uint8Array {
  const binary =
    typeof atob === "function"
      ? atob(base64)
      : Buffer.from(base64, "base64").toString("binary");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return new Uint8Array(bytes).buffer as ArrayBuffer;
}

function getPersistedFloorPlanPhoto(
  data: CaseRow["land_registry_data"],
): { bytes: Uint8Array; mime: string } | null {
  const photo = data?.floor_plan_photo;
  if (!photo || typeof photo !== "object" || Array.isArray(photo)) return null;
  const record = photo as Record<string, unknown>;
  if (typeof record.base64 !== "string" || typeof record.mime !== "string") return null;
  try {
    return { bytes: base64ToBytes(record.base64), mime: record.mime };
  } catch {
    return null;
  }
}

function PhotoUploadBlock({
  caseId,
  caseData,
  kind,
  label,
  inputTestId,
  previewAlt,
}: {
  caseId: string;
  caseData: CaseRow;
  kind: CaseAssetKind;
  label: string;
  inputTestId: string;
  previewAlt: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;

    void (async () => {
      try {
        const [asset] = await listCaseAssets(caseId, kind);
        if (asset) {
          const result = await readCaseAssetBytes(asset.id);
          if (cancelled) return;
          const bytes = new Uint8Array(result.bytes);
          createdUrl = URL.createObjectURL(
            new Blob([bytesToArrayBuffer(bytes)], { type: result.mime }),
          );
          setPreviewUrl(createdUrl);
          return;
        }
      } catch {
        // 舊案件或瀏覽器 mock 不支援時，繼續走 legacy fallback。
      }

      const persisted = kind === "floor_plan" ? getPersistedFloorPlanPhoto(caseData.land_registry_data) : null;
      if (!persisted || cancelled) return;
      createdUrl = URL.createObjectURL(
        new Blob([bytesToArrayBuffer(persisted.bytes)], { type: persisted.mime }),
      );
      setPreviewUrl(createdUrl);
    })();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [caseId, caseData.land_registry_data, kind]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > CASE_ASSET_MAX_BYTES) {
      setError("圖片大小不超過 10MB");
      return;
    }
    if (!isAcceptedCaseAssetMime(file.type)) {
      setError("僅支援 JPG、PNG 或 WebP");
      return;
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    try {
      await importCaseAsset({
        caseId,
        kind,
        fileName: file.name,
        mimeType: file.type,
        fileBytes: bytes,
        metadata: {
          uploaded_from: "case_wizard_step_3",
        },
      });
    } catch {
      setError("圖片儲存失敗，請重新選擇圖片");
      return;
    }

    const url = URL.createObjectURL(new Blob([bytesToArrayBuffer(bytes)], { type: file.type }));
    setPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return url;
    });
  }

  return (
    <section className="rounded-md border border-slate-200 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-slate-900">{label}</h3>
          <p className="text-xs text-slate-500">JPG/PNG/WebP，10MB 以內</p>
        </div>
        <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 px-3 py-2 text-sm">
          選擇圖片
          <input
            data-testid={inputTestId}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
          />
        </label>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {previewUrl ? (
        <img
          data-testid={`${kind}-preview`}
          src={previewUrl}
          alt={previewAlt}
          className="h-32 max-w-full rounded border border-slate-200 object-contain"
        />
      ) : null}
    </section>
  );
}

export function CaseWizardStep3Disclosure({
  caseId,
  caseData,
  onNext,
  onPrev,
}: CaseWizardStep3DisclosureProps) {
  const [payload, setPayload] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const prevConditionRef = useRef<string>("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [draft, disclosures] = await Promise.all([
        loadDraft(caseId),
        storage.getCaseDisclosures(caseId),
      ]);
      if (cancelled) return;
      const base = draft ?? {};
      const merged = disclosures
        ? { ...base, ...fromDisclosureData(disclosures) }
        : base;
      setPayload(merged);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  // Persist condition fields whenever they change
  useEffect(() => {
    if (loading) return;
    const hasCondition = CONDITION_KEYS.some((k) => k in payload);
    if (!hasCondition) return;
    const data = toDisclosureData(payload);
    const key = JSON.stringify(data);
    if (key === prevConditionRef.current) return;
    prevConditionRef.current = key;
    void storage.saveCaseDisclosures(caseId, data);
  }, [payload, caseId, loading]);

  const { flush } = useDraftAutosave({ caseId, payload, enabled: !loading });

  function renderForm() {
    if (loading) return <p>載入中…</p>;
    if (caseData.property_type === "residential") {
      const workbenchState = normalizeHouseMvpWorkbenchState(payload, {
        caseNo: caseData.case_no ?? caseId,
        caseName: caseData.case_name ?? caseData.address ?? "",
      });
      return (
        <HouseMvpWorkbench
          value={workbenchState}
          onChange={(nextValue: HouseMvpWorkbenchState) => setPayload(nextValue as unknown as Record<string, unknown>)}
          imageUploadSlots={{
            condition_survey_highrise: (
              <div className="grid gap-3 lg:grid-cols-3">
                <PhotoUploadBlock
                  caseId={caseId}
                  caseData={caseData}
                  kind="field_survey_photo"
                  label="現場調查照片上傳"
                  inputTestId="field-survey-photo-file-input"
                  previewAlt="現場調查照片預覽"
                />
                <PhotoUploadBlock
                  caseId={caseId}
                  caseData={caseData}
                  kind="floor_plan"
                  label="格局圖上傳"
                  inputTestId="floor-plan-file-input"
                  previewAlt="格局圖預覽"
                />
                <PhotoUploadBlock
                  caseId={caseId}
                  caseData={caseData}
                  kind="exterior_photo"
                  label="建物外觀照片上傳"
                  inputTestId="exterior-photo-file-input"
                  previewAlt="建物外觀照片預覽"
                />
              </div>
            ),
            living_function: (
              <div className="grid gap-3 lg:grid-cols-2">
                <PhotoUploadBlock
                  caseId={caseId}
                  caseData={caseData}
                  kind="location_map"
                  label="位置圖上傳"
                  inputTestId="location-map-file-input"
                  previewAlt="位置圖預覽"
                />
                <PhotoUploadBlock
                  caseId={caseId}
                  caseData={caseData}
                  kind="surrounding_map"
                  label="周邊圖上傳"
                  inputTestId="surrounding-map-file-input"
                  previewAlt="周邊圖預覽"
                />
              </div>
            ),
          }}
        />
      );
    }
    if (caseData.property_type === "land") {
      return (
        <DisclosureFormLand caseId={caseId} initialPayload={payload} onChange={setPayload} />
      );
    }
    return null;
  }

  return (
    <div className="space-y-6">
      {renderForm()}

      {caseData.property_type === "land" ? (
        <PhotoUploadBlock
          caseId={caseId}
          caseData={caseData}
          kind="floor_plan"
          label="土地規劃圖上傳"
          inputTestId="planning-map-file-input"
          previewAlt="土地規劃圖預覽"
        />
      ) : null}

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={async () => {
            await flush();
            onPrev();
          }}
        >
          上一步
        </Button>
        <Button
          onClick={async () => {
            await flush();
            onNext();
          }}
        >
          下一步
        </Button>
      </div>
    </div>
  );
}
