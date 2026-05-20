import { safeInvoke } from "@/lib/tauri-bridge";

export const CASE_ASSET_KINDS = [
  "company_logo",
  "floor_plan",
  "exterior_photo",
  "location_map",
  "surrounding_map",
  "cadastral_map",
  "field_survey_photo",
  "other_site_photo",
] as const;

export type CaseAssetKind = (typeof CASE_ASSET_KINDS)[number];
export type CaseAssetSource = "manual_upload" | "legacy_floor_plan_photo" | "auto_generated" | "api_generated";
export type CaseAssetTrustTier = "assistant_uploaded" | "legacy_import" | "system_generated";
export type CaseAssetMimeType = "image/png" | "image/jpeg" | "image/webp";

export interface CaseAsset {
  id: string;
  case_id: string;
  kind: CaseAssetKind;
  source: CaseAssetSource;
  trust_tier: CaseAssetTrustTier;
  review_status: "approved";
  is_primary: boolean;
  file_name: string;
  mime_type: CaseAssetMimeType;
  size_bytes: number;
  storage_path: string;
  metadata_json: string;
  created_at: string;
  updated_at: string;
}

export interface ImportCaseAssetInput {
  caseId: string;
  kind: CaseAssetKind;
  fileName: string;
  mimeType: CaseAssetMimeType;
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
export const CASE_ASSET_MAX_BYTES = FLOOR_PLAN_MAX_BYTES;
export const CASE_ASSET_ACCEPTED_MIME = FLOOR_PLAN_ACCEPTED_MIME;

export function isAcceptedCaseAssetKind(value: string): value is CaseAssetKind {
  return (CASE_ASSET_KINDS as readonly string[]).includes(value);
}

export function isAcceptedCaseAssetMime(
  mime: string,
): mime is CaseAssetMimeType {
  return (CASE_ASSET_ACCEPTED_MIME as readonly string[]).includes(mime);
}

export function isAcceptedFloorPlanMime(
  mime: string,
): mime is CaseAssetMimeType {
  return isAcceptedCaseAssetMime(mime);
}

export async function importCaseAsset(input: ImportCaseAssetInput): Promise<CaseAsset> {
  return safeInvoke<CaseAsset>("import_case_asset", {
    payload: {
      case_id: input.caseId,
      kind: input.kind,
      source: input.source ?? "manual_upload",
      file_name: input.fileName,
      mime_type: input.mimeType,
      file_bytes: Array.from(input.fileBytes),
      metadata_json: JSON.stringify(input.metadata ?? {}),
    },
  });
}

export async function listCaseAssets(caseId: string, kind?: CaseAssetKind): Promise<CaseAsset[]> {
  return safeInvoke<CaseAsset[]>("list_case_assets", {
    case_id: caseId,
    kind,
  });
}

export async function importFloorPlanAsset(input: Omit<ImportCaseAssetInput, "kind">): Promise<CaseAsset> {
  return importCaseAsset({
    ...input,
    kind: "floor_plan",
  });
}

export async function listFloorPlanAssets(caseId: string): Promise<CaseAsset[]> {
  return listCaseAssets(caseId, "floor_plan");
}

export async function readCaseAssetBytes(assetId: string): Promise<CaseAssetBytes> {
  return safeInvoke<CaseAssetBytes>("read_case_asset_bytes", {
    asset_id: assetId,
  });
}
