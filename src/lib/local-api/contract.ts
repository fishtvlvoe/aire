/**
 * Node local HTTP API 契約型別定義（單一來源，Wave 3 實作對接此檔）
 *
 * 設計依據：
 *   openspec/changes/browser-local-runtime-mvp/design.md
 *   Decision 3（session token）、Decision 4（本機資料目錄）、
 *   Decision 5（Rust IPC 能力搬 Node）、Decision 7（COP credential）、
 *   Decision 9（PDF 兩階段產出）
 *
 * 型別盡量複用現有前端介面，不重複定義。
 */

// ──────────────────────────────────────────────────────────────────────────────
// 基礎型別（複用現有前端定義）
// ──────────────────────────────────────────────────────────────────────────────

export type {
  CaseRow,
  CreateCaseInput,
  UpdateCaseInput,
  CasePropertyType,
} from "@/lib/cases-api";

export type {
  ParcelInfo,
  ApiResult,
} from "@/lib/land-registry-api";

export type { LocalFormalPullInput, LocalFormalPullResult } from "@/lib/server/local-formal-pull-proxy";
export type { AddressDiscoveryResult } from "@/lib/server/local-address-discovery-proxy";

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/health
// ──────────────────────────────────────────────────────────────────────────────

/** 開發環境專用 token；production 必須由 launcher 注入隨機 AIRE_LOCAL_TOKEN。 */
export const LOCAL_DEV_TOKEN = "aire-dev-local-token";

/** launcher 用 polling 判斷 server 已就緒的健康檢查端點 */
export interface HealthResponse {
  /** 固定為 'ok' */
  status: "ok";
  /** 來自 package.json version */
  version: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/local/address-discovery
// ──────────────────────────────────────────────────────────────────────────────

/** 前端呼叫形狀（對齊 land-registry-api.ts L215-L224） */
export interface AddressDiscoveryRequest {
  address: string;
  clientId?: string;
  secret?: string;
  allowMockFallback?: boolean;
}

// AddressDiscoveryResult 已從 local-address-discovery-proxy 重新匯出

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/local/formal-pull-data
// ──────────────────────────────────────────────────────────────────────────────

// LocalFormalPullInput / LocalFormalPullResult 已從 local-formal-pull-proxy 重新匯出

// ──────────────────────────────────────────────────────────────────────────────
// /api/local/cases（Case CRUD）
// ──────────────────────────────────────────────────────────────────────────────

/** GET /api/local/cases → CaseRow[] */
export interface ListCasesResponse {
  cases: import("@/lib/cases-api").CaseRow[];
}

/** POST /api/local/cases → CaseRow */
// body: CreateCaseInput（已重新匯出）

/** GET /api/local/cases/:id → CaseRow */
// 直接回傳 CaseRow

/** PATCH /api/local/cases/:id → CaseRow */
// body: UpdateCaseInput（已重新匯出）

/** DELETE /api/local/cases/:id → 204 No Content */
export interface DeleteCaseResponse {
  ok: true;
}

// ──────────────────────────────────────────────────────────────────────────────
// /api/local/cop-credential（COP 帳密管理）
// ──────────────────────────────────────────────────────────────────────────────

/** POST /api/local/cop-credential — 儲存帳密 */
export interface SaveCopCredentialRequest {
  clientId: string;
  secret: string;
}

/** GET /api/local/cop-credential — 讀取帳密（遮罩回傳，不吐明碼） */
export interface ReadCopCredentialResponse {
  /** client_id 遮罩，如 "cop_abc***" */
  clientIdMasked: string;
  /** 帳密是否存在（不吐明碼 secret） */
  hasSecret: boolean;
  /** 儲存時間（ISO 8601） */
  savedAt: string;
}

/** POST /api/local/cop-credential/test — 測試 COP 連線 */
export interface TestCopCredentialResponse {
  success: boolean;
  message: string;
  latencyMs?: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// /api/local/pdf — 兩階段 PDF 產出（Decision 9）
// ──────────────────────────────────────────────────────────────────────────────

/**
 * 草稿 PDF 請求：前端已渲染的 PDF bytes + 案件識別資訊。
 *
 * Decision 9 修正：Node 端不負責渲染，只負責原子寫檔。
 * 前端 pdf-lib（@react-pdf/renderer）渲染完後，將 bytes 以 base64 編碼傳入，
 * Node 解碼後原子寫到 pdf/draft/。
 */
export interface DraftPdfRequest {
  /** AIRE 案件 ID */
  caseId: string;
  /**
   * 前端已渲染的 PDF bytes（base64 編碼）。
   * 前端用 @react-pdf/renderer 渲染完成後，將 Blob/Uint8Array 轉為 base64 再傳入。
   */
  pdfBase64: string;
  /** 地政 API 資料快照（来自 formal pull 結果，用於版本管理與日誌，不在 Node 端渲染） */
  registrySnapshot: Record<string, import("@/lib/land-registry-api").ApiResult>;
  /** 屬性類型（residential / land） */
  propertyType: "residential" | "land";
  /** 公司品牌資訊 */
  branding?: {
    companyName?: string;
    agentName?: string;
    companyPhone?: string;
    companyAddress?: string;
  };
}

/**
 * 說明書 PDF 請求：草稿基礎＋補件嵌入＋客戶簽名頁。
 * 前面內容不變，補件以嵌入頁面（非 popup）方式並入。
 */
export interface OfficialPdfRequest extends DraftPdfRequest {
  /** 業務現場補件資料（嵌入頁面，非 popup） */
  supplements: Array<{
    /** 補件欄位名稱 */
    fieldName: string;
    /** 補件值（文字、圖片 base64 等） */
    value: string;
    /** 補件類型 */
    kind: "text" | "image" | "floor_plan";
  }>;
  /** 客戶簽名頁資料 */
  signaturePage: {
    /** 客戶姓名 */
    customerName: string;
    /** 簽約日期（ISO 8601） */
    signedAt: string;
    /** 客戶簽名圖（base64 PNG，可空） */
    signatureImageBase64?: string;
  };
}

/** POST /api/local/pdf/draft 與 POST /api/local/pdf/official 的回傳 */
export interface PdfWriteResponse {
  /** 寫入成功的本機絕對路徑（%LOCALAPPDATA%\AIRE\pdf\...） */
  outputPath: string;
  /** 檔案大小（bytes） */
  sizeBytes: number;
  /** 寫入時間（ISO 8601） */
  writtenAt: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// 通用錯誤形狀
// ──────────────────────────────────────────────────────────────────────────────

/** 所有 /api/local/* 錯誤回傳統一形狀 */
export interface LocalApiError {
  error: string;
  message: string;
  /** HTTP status code（方便前端判斷） */
  status?: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// 安全邊界：session token（Decision 3）
// ──────────────────────────────────────────────────────────────────────────────

/**
 * 所有 /api/local/* 端點必須帶此 header。
 * launcher 啟動時生成隨機 token → 注入首頁 <meta> → 前端讀取後放入每次請求。
 *
 * @example
 *   headers: { [LOCAL_TOKEN_HEADER]: token }
 */
export const LOCAL_TOKEN_HEADER = "X-Local-Token" as const;

/**
 * 缺 token 或 token 不符時，server middleware 回傳 401 並帶此 body。
 */
export interface UnauthorizedResponse {
  error: "unauthorized";
  message: string;
}
