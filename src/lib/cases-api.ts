// AIRE — cases IPC 前端 wrapper
//
// 集中所有 invoke('xxx_case') 呼叫，避免在 component 內 import @tauri-apps/api/core 散落。
import { safeInvoke } from "@/lib/tauri-bridge";

export interface CaseRow {
  id: string;
  case_no: string | null;
  case_name?: string | null;
  property_type: "residential" | "land";
  land_lot_no: string;
  building_lot_no?: string | null;
  address: string;
  owner_name: string | null;
  land_registry_data?: Record<string, unknown> | null;
  current_step?: number;
  status: "draft" | "completed" | "exported";
  created_at: number;
  updated_at: number;
  asking_price?: number | null;
}

export interface CreateCaseInput {
  property_type: "residential" | "land";
  land_lot_no: string;
  address: string;
  owner_name?: string | null;
  case_no?: string | null;
  case_name?: string | null;
  land_registry_data?: Record<string, unknown> | null;
  current_step?: number;
  building_lot_no?: string | null;
  asking_price?: number | null;
}

export interface UpdateCaseInput {
  property_type?: "residential" | "land";
  land_lot_no?: string;
  building_lot_no?: string | null;
  address?: string;
  owner_name?: string | null;
  case_no?: string | null;
  case_name?: string | null;
  land_registry_data?: Record<string, unknown> | null;
  current_step?: number;
  status?: "draft" | "completed" | "exported";
  asking_price?: number | null;
}

async function invokeIpc<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  return safeInvoke<T>(cmd, args);
}

export const casesApi = {
  list: () => invokeIpc<CaseRow[]>("list_cases"),
  get: (id: string) => invokeIpc<CaseRow>("get_case", { id }),
  create: (input: CreateCaseInput) => invokeIpc<CaseRow>("create_case", { input }),
  update: (id: string, input: UpdateCaseInput) =>
    invokeIpc<CaseRow>("update_case", { id, input }),
  delete: (id: string) => invokeIpc<void>("delete_case", { id }),
  markCompleted: (caseId: string) => invokeIpc<CaseRow>("mark_completed", { caseId }),
};

const TPE_FMT = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Unix seconds → 台北時區字串 */
export function formatTpeDate(unixSecs: number): string {
  return TPE_FMT.format(new Date(unixSecs * 1000));
}

const PROPERTY_TYPE_LABEL: Record<CaseRow["property_type"], string> = {
  residential: "成屋",
  land: "土地",
};

const STATUS_LABEL: Record<CaseRow["status"], string> = {
  draft: "草稿",
  completed: "已完成",
  exported: "已匯出",
};

export function propertyTypeLabel(t: CaseRow["property_type"]): string {
  return PROPERTY_TYPE_LABEL[t];
}

export function statusLabel(s: CaseRow["status"]): string {
  return STATUS_LABEL[s];
}
