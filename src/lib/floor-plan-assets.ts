import { safeInvoke } from "@/lib/tauri-bridge";

export type CaseAssetKind = "floor_plan";
export type CaseAssetSource = "manual_upload" | "legacy_floor_plan_photo";
export type CaseAssetTrustTier = "assistant_uploaded" | "legacy_import";

export interface CaseAsset {
  id: string;
  case_id: string;
  kind: CaseAssetKind;
  source: CaseAssetSource;
  trust_tier: CaseAssetTrustTier;
  review_status: "approved";
  is_primary: boolean;
  file_name: string;
  mime_type: "image/png" | "image/jpeg" | "image/webp";
  size_bytes: number;
  storage_path: string;
  metadata_json: string;
  created_at: string;
  updated_at: string;
}

export interface ImportCaseAssetInput {
  caseId: string;
  fileName: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  fileBytes: Uint8Array;
  source?: CaseAssetSource;
  metadata?: Record<string, unknown>;
}

export interface CaseAssetBytes {
  bytes: number[];
  mime: string;
}

export const FLOOR_PLAN_MAX_BYTES = 10 * 1024 * 1024;
export const FLOOR_PLAN_ACCEPTED_MIME = ["image/png", "image/jpeg", "image/webp"] as const;

export function isAcceptedFloorPlanMime(
  mime: string,
): mime is ImportCaseAssetInput["mimeType"] {
  return (FLOOR_PLAN_ACCEPTED_MIME as readonly string[]).includes(mime);
}

export async function importFloorPlanAsset(input: ImportCaseAssetInput): Promise<CaseAsset> {
  return safeInvoke<CaseAsset>("import_case_asset", {
    payload: {
      case_id: input.caseId,
      kind: "floor_plan",
      source: input.source ?? "manual_upload",
      file_name: input.fileName,
      mime_type: input.mimeType,
      file_bytes: Array.from(input.fileBytes),
      metadata_json: JSON.stringify(input.metadata ?? {}),
    },
  });
}

export async function listFloorPlanAssets(caseId: string): Promise<CaseAsset[]> {
  return safeInvoke<CaseAsset[]>("list_case_assets", {
    case_id: caseId,
    kind: "floor_plan",
  });
}

export async function readCaseAssetBytes(assetId: string): Promise<CaseAssetBytes> {
  return safeInvoke<CaseAssetBytes>("read_case_asset_bytes", {
    asset_id: assetId,
  });
}
