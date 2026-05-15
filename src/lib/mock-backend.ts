import type { CaseRow, CreateCaseInput, UpdateCaseInput } from "@/lib/cases-api";
import type { LogEntry, LogResult } from "@/lib/log";

type CommandArgs = Record<string, unknown> | undefined;

type LicenseStatus = "none" | "valid" | "expired";

interface LicenseState {
  status: LicenseStatus;
  serialKey: string | null;
}

interface ClauseData {
  law_id: string;
  title: string;
  content: string;
  version_date: string;
  fetched_at: string;
}

interface BrandSettings {
  company_name: string;
  contact_phone: string;
  contact_address: string;
}

interface LogoAsset {
  bytes: number[];
  mime: string;
}

interface MockSessionUser {
  email: string;
  role: "admin" | "user";
}

interface AppSettingsState {
  landApi: {
    clientId: string;
    secret: string;
  };
  premium: {
    subscribed: boolean;
    plan: string | null;
    expiresAt: string | null;
  };
  premiumUnlocked: boolean;
}

interface FeatureFlagState {
  id: string;
  name: string;
  enabled: boolean;
}

interface PersistedMockState {
  license?: LicenseState;
  sessionUser?: MockSessionUser | null;
  appSettings?: AppSettingsState;
  featureFlags?: FeatureFlagState[];
}

const MOCK_STORAGE_KEY = "aire-mock-store";

const TEST_ACCOUNTS = [
  {
    email: "admin@test.aire",
    password: "password",
    role: "admin" as const,
    status: "active" as const,
  },
  {
    email: "user@test.aire",
    password: "password",
    role: "user" as const,
    status: "active" as const,
  },
  {
    email: "expired@test.aire",
    password: "password",
    role: "user" as const,
    status: "expired" as const,
  },
];

const DEFAULT_APP_SETTINGS: AppSettingsState = {
  landApi: {
    clientId: "",
    secret: "",
  },
  premium: {
    subscribed: false,
    plan: null,
    expiresAt: null,
  },
  premiumUnlocked: false,
};

const DEFAULT_FEATURE_FLAGS: FeatureFlagState[] = [
  { id: "premium-unlock", name: "進階功能解鎖", enabled: false },
  { id: "mcp-hub", name: "MCP Hub", enabled: false },
  { id: "land-registry-api", name: "地政 API", enabled: true },
];

const DEFAULT_THEMES = [
  {
    id: "theme-a-minimal",
    label: "淡雅 Minimal",
    displayName: "淡雅 Minimal",
    description: "簡潔、專業、適合標準不動產說明書",
  },
  {
    id: "theme-c-tech-elegant",
    label: "科技優雅 Tech Elegant",
    displayName: "科技優雅 Tech Elegant",
    description: "深藍底色，粉漸層裝飾，金色邊框",
  },
];

const SEED_CASES: CaseRow[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    case_no: "AIRE-2026-001",
    property_type: "residential",
    land_lot_no: "大安段一小段 123-4",
    address: "台北市大安區和平東路一段 100 號",
    owner_name: "陳小美",
    status: "draft",
    created_at: 1763200000,
    updated_at: 1763200000,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    case_no: "AIRE-2026-002",
    property_type: "land",
    land_lot_no: "板橋段二小段 88-1",
    address: "新北市板橋區文化路一段 188 號",
    owner_name: "林大華",
    status: "completed",
    created_at: 1763203600,
    updated_at: 1763207200,
  },
];

const SEED_LOGS: LogEntry[] = [
  {
    id: 5,
    ts: 1763221200,
    action: "setting_change",
    payload: JSON.stringify({ key: "theme", value: "theme-a-minimal" }),
    result: "ok",
  },
  {
    id: 4,
    ts: 1763217600,
    action: "pdf_export",
    payload: JSON.stringify({ case_id: "11111111-1111-4111-8111-111111111111" }),
    result: "ok",
  },
  {
    id: 3,
    ts: 1763214000,
    action: "case_update",
    payload: JSON.stringify({ case_id: "11111111-1111-4111-8111-111111111111" }),
    result: "ok",
  },
  {
    id: 2,
    ts: 1763210400,
    action: "case_create",
    payload: JSON.stringify({ case_id: "11111111-1111-4111-8111-111111111111" }),
    result: "ok",
  },
  {
    id: 1,
    ts: 1763206800,
    action: "license_activate",
    payload: JSON.stringify({ serial_key: "DEMO-KEY-001" }),
    result: "ok",
  },
];

const SEED_CLAUSES: ClauseData[] = [
  {
    law_id: "clause-1",
    title: "不動產經紀業管理條例第 1 條",
    content: "本條例依不動產經紀業管理需要制定之。",
    version_date: "2025-01-01",
    fetched_at: "2026-05-15T08:00:00.000Z",
  },
  {
    law_id: "clause-2",
    title: "不動產經紀業管理條例第 2 條",
    content: "本條例用詞，定義如下。",
    version_date: "2025-01-01",
    fetched_at: "2026-05-15T08:00:00.000Z",
  },
  {
    law_id: "clause-3",
    title: "不動產經紀業管理條例第 3 條",
    content: "經紀業應遵循誠信原則執行業務。",
    version_date: "2025-01-01",
    fetched_at: "2026-05-15T08:00:00.000Z",
  },
];

const SEED_BRAND_SETTINGS: BrandSettings = {
  company_name: "測試不動產",
  contact_phone: "02-1234-5678",
  contact_address: "台北市信義區測試路 1 號",
};

function unixNow(): number {
  return Math.floor(Date.now() / 1000);
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function pickString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const picked = readString(record[key]);
    if (picked) {
      return picked;
    }
  }
  return null;
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return {};
}

function makeUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getBrowserLocalStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export class MockStore {
  private license: LicenseState = {
    status: "none",
    serialKey: null,
  };

  private cases = new Map<string, CaseRow>();
  private drafts = new Map<string, unknown>();
  private logs: LogEntry[] = [];
  private brandSettings: BrandSettings = { ...SEED_BRAND_SETTINGS };
  private logo: LogoAsset | null = null;
  private themeId = "theme-a-minimal";
  private clauses = new Map<string, ClauseData>();
  private sessionUser: MockSessionUser | null = null;
  private appSettings: AppSettingsState = {
    landApi: {
      clientId: DEFAULT_APP_SETTINGS.landApi.clientId,
      secret: DEFAULT_APP_SETTINGS.landApi.secret,
    },
    premium: {
      subscribed: DEFAULT_APP_SETTINGS.premium.subscribed,
      plan: DEFAULT_APP_SETTINGS.premium.plan,
      expiresAt: DEFAULT_APP_SETTINGS.premium.expiresAt,
    },
    premiumUnlocked: DEFAULT_APP_SETTINGS.premiumUnlocked,
  };
  private featureFlags: FeatureFlagState[] = DEFAULT_FEATURE_FLAGS.map((flag) => ({
    ...flag,
  }));
  private consentedCases = new Set<string>();

  constructor() {
    this.reset();
    this.restorePersistedState();
  }

  reset(): void {
    this.license = {
      status: "none",
      serialKey: null,
    };

    this.cases = new Map(SEED_CASES.map((row) => [row.id, { ...row }]));
    this.drafts = new Map<string, unknown>();
    this.logs = SEED_LOGS.map((entry) => ({ ...entry }));
    this.brandSettings = { ...SEED_BRAND_SETTINGS };
    this.logo = null;
    this.themeId = "theme-a-minimal";
    this.clauses = new Map(SEED_CLAUSES.map((clause) => [clause.law_id, { ...clause }]));
    this.sessionUser = null;
    this.appSettings = {
      landApi: {
        clientId: DEFAULT_APP_SETTINGS.landApi.clientId,
        secret: DEFAULT_APP_SETTINGS.landApi.secret,
      },
      premium: {
        subscribed: DEFAULT_APP_SETTINGS.premium.subscribed,
        plan: DEFAULT_APP_SETTINGS.premium.plan,
        expiresAt: DEFAULT_APP_SETTINGS.premium.expiresAt,
      },
      premiumUnlocked: DEFAULT_APP_SETTINGS.premiumUnlocked,
    };
    this.featureFlags = DEFAULT_FEATURE_FLAGS.map((flag) => ({ ...flag }));
  }

  async invoke<T>(cmd: string, args?: CommandArgs): Promise<T> {
    try {
      switch (cmd) {
        case "get_license_status":
          return this.getLicenseStatus() as T;
        case "activate_license":
          return this.activateLicense(args) as T;
        case "deactivate_license":
          return this.deactivateLicense() as T;
        case "check_license":
          return this.checkLicense() as T;

        case "login":
          return this.login(args) as T;
        case "logout":
          return this.logout() as T;
        case "get_session":
          return this.getSession() as T;
        case "get_app_settings":
          return this.getAppSettings() as T;
        case "save_app_settings":
          return this.saveAppSettings(args) as T;
        case "get_land_api_settings":
          return this.getLandApiSettings() as T;
        case "save_land_api_settings":
          return this.saveLandApiSettings(args) as T;
        case "test_land_api_connection":
          return (await this.testLandApiConnection()) as T;
        case "get_premium_status":
          return this.getPremiumStatus() as T;
        case "subscribe_premium":
          return this.subscribePremium() as T;
        case "get_feature_flags":
          return this.getFeatureFlags() as T;
        case "toggle_feature_flag":
          return this.toggleFeatureFlag(args) as T;

        case "list_cases":
          return this.listCases() as T;
        case "get_case":
          return this.getCase(args) as T;
        case "create_case":
          return this.createCase(args) as T;
        case "update_case":
          return this.updateCase(args) as T;
        case "delete_case":
          return this.deleteCase(args) as T;
        case "mark_completed":
          return this.markCompleted(args) as T;

        case "export_pdf":
          return this.exportPdf(args) as T;

        case "save_draft":
          return this.saveDraft(args) as T;
        case "load_draft":
          return this.loadDraft(args) as T;

        case "write_log":
          return this.writeLog(args) as T;
        case "list_recent_logs":
          return this.listRecentLogs(args) as T;

        case "get_brand_settings":
          return this.getBrandSettings() as T;
        case "save_brand_settings":
          return this.saveBrandSettings(args) as T;

        case "upload_logo":
        case "save_logo":
          return this.uploadLogo(args) as T;
        case "delete_logo":
          return this.deleteLogo() as T;
        case "load_logo":
        case "get_logo":
          return this.getLogo() as T;
        case "set_theme":
          return this.setTheme(args) as T;
        case "get_theme":
          return this.getTheme() as T;
        case "list_themes":
          return this.listThemes() as T;

        case "get_clause":
        case "get_legal_clause":
          return this.getClause(args) as T;
        case "list_clauses":
        case "list_legal_clauses":
          return this.listClauses() as T;
        case "sync_clauses":
        case "sync_legal_clauses":
          return this.syncClauses() as T;

        case "land_registry_address_lookup":
          return this.landRegistryAddressLookup(args) as T;
        case "land_registry_pull_data":
          return this.landRegistryPullData(args) as T;
        case "land_registry_set_api_key":
          return this.landRegistrySetApiKey(args) as T;
        case "land_registry_get_api_key":
          return this.landRegistryGetApiKey() as T;
        case "land_registry_test_connection":
          return (await this.landRegistryTestConnection()) as T;
        case "land_registry_get_balance":
          return this.landRegistryGetBalance() as T;
        case "land_registry_record_consent":
          return this.landRegistryRecordConsent(args) as T;

        default:
          throw new Error(`Mock not implemented: ${cmd}`);
      }
    } finally {
      this.persistState();
    }
  }

  private getLicenseStatus(): { status: LicenseStatus; serial_key: string | null } {
    return {
      status: this.license.status,
      serial_key: this.license.serialKey,
    };
  }

  private activateLicense(args?: CommandArgs): { success: true } {
    const payload = toRecord(args);
    const serialKey = pickString(payload, ["serial_key", "key"]);
    if (!serialKey) {
      throw new Error("activate_license requires non-empty serial_key");
    }

    const MOCK_RESPONSES: Record<string, string> = {
      "AIRE-TEST-EXPIRED-001": "EXPIRED_KEY",
      "AIRE-TEST-USED-001": "ALREADY_ACTIVATED_OTHER_DEVICE",
      "AIRE-TEST-QUOTA-001": "QUOTA_EXHAUSTED",
      "AIRE-TEST-NETFAIL-001": "NETWORK_FAILED",
      "AIRE-TEST-DOWN-001": "OPCOS_UNAVAILABLE",
    };

    const errorCode = MOCK_RESPONSES[serialKey];
    if (errorCode) {
      throw new Error(errorCode);
    }

    if (!serialKey.startsWith("AIRE-")) {
      throw new Error("INVALID_KEY");
    }

    this.license = {
      status: "valid",
      serialKey,
    };

    return { success: true };
  }

  private deactivateLicense(): { success: true } {
    this.license = {
      status: "none",
      serialKey: null,
    };

    return { success: true };
  }

  private login(args?: CommandArgs): { success: true; user: MockSessionUser } {
    const payload = toRecord(args);
    const email = pickString(payload, ["email"]);
    const password = pickString(payload, ["password"]);

    if (!email || !password) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const account = TEST_ACCOUNTS.find(
      (candidate) => candidate.email === email && candidate.password === password,
    );
    if (!account) {
      throw new Error("INVALID_CREDENTIALS");
    }

    if (account.status === "expired") {
      throw new Error("ACCOUNT_EXPIRED");
    }

    this.sessionUser = {
      email: account.email,
      role: account.role,
    };
    return {
      success: true,
      user: { ...this.sessionUser },
    };
  }

  private logout(): { success: true } {
    this.sessionUser = null;
    return { success: true };
  }

  private getSession():
    | { authenticated: false }
    | { authenticated: true; user: MockSessionUser } {
    if (!this.sessionUser) {
      return { authenticated: false };
    }

    return {
      authenticated: true,
      user: { ...this.sessionUser },
    };
  }

  private getAppSettings(): {
    license: { status: LicenseStatus; serialKey: string | null };
    landApi: { clientId: string; secret: string };
    premiumUnlocked: boolean;
  } {
    return {
      license: {
        status: this.license.status,
        serialKey: this.license.serialKey,
      },
      landApi: {
        clientId: this.appSettings.landApi.clientId,
        secret: this.appSettings.landApi.secret,
      },
      premiumUnlocked: this.appSettings.premiumUnlocked,
    };
  }

  private saveAppSettings(args?: CommandArgs): { success: true } {
    const payload = toRecord(args);
    const landApi = toRecord(payload.landApi);
    const premiumUnlocked = payload.premiumUnlocked;

    const clientId = readString(landApi.clientId);
    const secret = readString(landApi.secret);

    this.appSettings = {
      ...this.appSettings,
      landApi: {
        clientId: clientId ?? this.appSettings.landApi.clientId,
        secret: secret ?? this.appSettings.landApi.secret,
      },
      premiumUnlocked:
        typeof premiumUnlocked === "boolean"
          ? premiumUnlocked
          : this.appSettings.premiumUnlocked,
    };

    return { success: true };
  }

  private getLandApiSettings(): { clientId: string; secret: string } {
    return {
      clientId: this.appSettings.landApi.clientId,
      secret: this.appSettings.landApi.secret,
    };
  }

  private saveLandApiSettings(args?: CommandArgs): { success: true } {
    const payload = toRecord(args);
    const clientIdRaw = payload.clientId ?? payload.client_id;
    const secretRaw = payload.secret;

    if (typeof clientIdRaw === "string") {
      this.appSettings.landApi.clientId = clientIdRaw;
    }

    if (typeof secretRaw === "string") {
      this.appSettings.landApi.secret = secretRaw;
    }

    return { success: true };
  }

  private async testLandApiConnection(): Promise<{
    success: true;
    latency_ms: number;
  }> {
    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });

    return {
      success: true,
      latency_ms: Math.floor(Math.random() * 401) + 100,
    };
  }

  private getPremiumStatus(): {
    subscribed: boolean;
    plan: string | null;
    expires_at: string | null;
  } {
    return {
      subscribed: this.appSettings.premium.subscribed,
      plan: this.appSettings.premium.plan,
      expires_at: this.appSettings.premium.expiresAt,
    };
  }

  private subscribePremium(): { redirect_url: string } {
    return { redirect_url: "https://opcos.tw/checkout/mcp-hub" };
  }

  private getFeatureFlags(): FeatureFlagState[] {
    return this.featureFlags.map((flag) => ({ ...flag }));
  }

  private toggleFeatureFlag(args?: CommandArgs): { success: true; enabled: boolean } {
    const payload = toRecord(args);
    const id = pickString(payload, ["id"]);

    if (!id) {
      throw new Error("toggle_feature_flag requires id");
    }

    const target = this.featureFlags.find((flag) => flag.id === id);
    if (!target) {
      throw new Error(`Feature flag not found: ${id}`);
    }

    target.enabled = !target.enabled;
    return { success: true, enabled: target.enabled };
  }

  private checkLicense(): { status: LicenseStatus; is_valid: boolean } {
    return {
      status: this.license.status,
      is_valid: this.license.status === "valid",
    };
  }

  private listCases(): CaseRow[] {
    return [...this.cases.values()].map((row) => ({ ...row }));
  }

  private getCase(args?: CommandArgs): CaseRow {
    const payload = toRecord(args);
    const id = pickString(payload, ["id"]);

    if (!id) {
      throw new Error("get_case requires id");
    }

    const row = this.cases.get(id);
    if (!row) {
      throw new Error(`Case not found: ${id}`);
    }

    return { ...row };
  }

  private createCase(args?: CommandArgs): CaseRow {
    const payload = toRecord(args);
    const input = toRecord(payload.input);

    const propertyType = pickString(input, ["property_type"]);
    const address = pickString(input, ["address"]);
    const landLotNo = pickString(input, ["land_lot_no"]);

    if (!propertyType || (propertyType !== "residential" && propertyType !== "land")) {
      throw new Error("create_case requires valid property_type");
    }
    if (!address) {
      throw new Error("create_case requires address");
    }
    if (!landLotNo) {
      throw new Error("create_case requires land_lot_no");
    }

    const now = unixNow();
    const id = makeUuid();

    const row: CaseRow = {
      id,
      case_no: pickString(input, ["case_no"]),
      property_type: propertyType,
      land_lot_no: landLotNo,
      address,
      owner_name: pickString(input, ["owner_name"]),
      status: "draft",
      created_at: now,
      updated_at: now,
    };

    this.cases.set(id, row);
    return { ...row };
  }

  private updateCase(args?: CommandArgs): CaseRow {
    const payload = toRecord(args);
    const id = pickString(payload, ["id"]);
    const input = toRecord(payload.input);

    if (!id) {
      throw new Error("update_case requires id");
    }

    const existing = this.cases.get(id);
    if (!existing) {
      throw new Error(`Case not found: ${id}`);
    }

    const next: CaseRow = {
      ...existing,
      property_type:
        (pickString(input, ["property_type"]) as UpdateCaseInput["property_type"]) ??
        existing.property_type,
      land_lot_no: pickString(input, ["land_lot_no"]) ?? existing.land_lot_no,
      address: pickString(input, ["address"]) ?? existing.address,
      owner_name: pickString(input, ["owner_name"]) ?? existing.owner_name,
      case_no: pickString(input, ["case_no"]) ?? existing.case_no,
      status:
        (pickString(input, ["status"]) as UpdateCaseInput["status"]) ?? existing.status,
      updated_at: unixNow(),
    };

    this.cases.set(id, next);
    return { ...next };
  }

  private deleteCase(args?: CommandArgs): void {
    const payload = toRecord(args);
    const id = pickString(payload, ["id"]);

    if (!id) {
      throw new Error("delete_case requires id");
    }

    this.cases.delete(id);
  }

  private markCompleted(args?: CommandArgs): CaseRow {
    const payload = toRecord(args);
    const caseId = pickString(payload, ["caseId", "case_id", "id"]);

    if (!caseId) {
      throw new Error("mark_completed requires caseId");
    }

    const existing = this.cases.get(caseId);
    if (!existing) {
      throw new Error(`Case not found: ${caseId}`);
    }

    const updated: CaseRow = {
      ...existing,
      status: "completed",
      updated_at: unixNow(),
    };

    this.cases.set(caseId, updated);
    return { ...updated };
  }

  private exportPdf(args?: CommandArgs): string {
    const payload = toRecord(args);
    const nestedArgs = toRecord(payload.args);

    const caseId =
      pickString(payload, ["caseId", "case_id"]) ??
      pickString(nestedArgs, ["caseId", "case_id"]) ??
      "mock-case";

    return `/mock/exports/${caseId}-${Date.now()}.pdf`;
  }

  private saveDraft(args?: CommandArgs): { success: true } {
    const payload = toRecord(args);
    const caseId = pickString(payload, ["caseId", "case_id", "id"]);

    if (!caseId) {
      throw new Error("save_draft requires caseId");
    }

    const data = payload.data ?? payload.draft ?? payload.payload;
    this.drafts.set(caseId, data ?? null);
    return { success: true };
  }

  private loadDraft(args?: CommandArgs): unknown {
    const payload = toRecord(args);
    const caseId = pickString(payload, ["caseId", "case_id", "id"]);

    if (!caseId) {
      throw new Error("load_draft requires caseId");
    }

    return this.drafts.get(caseId) ?? null;
  }

  private writeLog(args?: CommandArgs): { success: true } {
    const payload = toRecord(args);
    const id = this.logs.length > 0 ? this.logs[0].id + 1 : 1;
    const result = pickString(payload, ["result"]) === "error" ? "error" : "ok";

    const next: LogEntry = {
      id,
      ts: unixNow(),
      action: pickString(payload, ["action"]) ?? "mock_action",
      payload: payload.payload ? JSON.stringify(payload.payload) : null,
      result: result as LogResult,
    };

    this.logs = [next, ...this.logs];
    return { success: true };
  }

  private listRecentLogs(args?: CommandArgs): LogEntry[] {
    const payload = toRecord(args);
    const rawLimit = payload.limit;
    const limit =
      typeof rawLimit === "number" && Number.isFinite(rawLimit) && rawLimit >= 0
        ? Math.floor(rawLimit)
        : 100;

    return this.logs.slice(0, limit).map((entry) => ({ ...entry }));
  }

  private getBrandSettings(): BrandSettings {
    return { ...this.brandSettings };
  }

  private saveBrandSettings(args?: CommandArgs): { success: true } {
    const payload = toRecord(args);
    const settings = toRecord(payload.settings ?? payload.input ?? payload);

    this.brandSettings = {
      ...this.brandSettings,
      ...settings,
    } as BrandSettings;

    return { success: true };
  }

  private uploadLogo(args?: CommandArgs): { success: true } {
    const payload = toRecord(args);

    const bytesRaw = payload.bytes;
    const bytes = Array.isArray(bytesRaw)
      ? bytesRaw.filter((value): value is number => typeof value === "number")
      : [];

    this.logo = {
      bytes,
      mime: pickString(payload, ["mime", "mimeType"]) ?? "image/png",
    };

    return { success: true };
  }

  private getLogo(): LogoAsset | null {
    return this.logo ? { ...this.logo } : null;
  }

  private deleteLogo(): { success: true } {
    this.logo = null;
    return { success: true };
  }

  private setTheme(args?: CommandArgs): { success: true; theme_id: string } {
    const payload = toRecord(args);
    const next =
      pickString(payload, ["theme_id", "themeId"]) ?? "theme-a-minimal";
    this.themeId = next;
    return { success: true, theme_id: this.themeId };
  }

  private getTheme(): string {
    return this.themeId;
  }

  private listThemes(): Array<Record<string, string>> {
    return DEFAULT_THEMES.map((theme) => ({ ...theme }));
  }

  private getClause(args?: CommandArgs): ClauseData {
    const payload = toRecord(args);
    const lawId = pickString(payload, ["law_id", "id", "clause_id"]);

    if (!lawId) {
      throw new Error("get_clause requires law_id");
    }

    const clause = this.clauses.get(lawId);
    if (!clause) {
      throw new Error(`Clause not found: ${lawId}`);
    }

    return { ...clause };
  }

  private listClauses(): ClauseData[] {
    return [...this.clauses.values()].map((clause) => ({ ...clause }));
  }

  private syncClauses(): { success: true; count: number; synced_at: string } {
    const syncedAt = new Date().toISOString();
    for (const [key, clause] of this.clauses.entries()) {
      this.clauses.set(key, {
        ...clause,
        fetched_at: syncedAt,
      });
    }

    return {
      success: true,
      count: this.clauses.size,
      synced_at: syncedAt,
    };
  }

  private landRegistryAddressLookup(
    args?: CommandArgs,
  ): Array<{ parcel_id: string; address: string; lot_number: string; building_number: string }> {
    const addr = (args?.address as string) || "未知地址";
    return [
      { parcel_id: "0001-0000", address: addr, lot_number: "0001", building_number: "0000" },
      { parcel_id: "0001-0001", address: addr, lot_number: "0001", building_number: "0001" },
    ];
  }

  private landRegistryPullData(
    args?: CommandArgs,
  ): { results: Record<string, unknown>; total_cost: number } {
    const apiIds = (args?.apiIds || []) as string[];
    const results: Record<string, unknown> = {};
    let totalCost = 0;
    for (const apiId of apiIds) {
      results[apiId] = { success: true, data: { source_api: apiId }, source: "api" };
      totalCost += 10;
    }
    return { results, total_cost: totalCost };
  }

  private landRegistrySetApiKey(args?: CommandArgs): undefined {
    const payload = toRecord(args);
    const clientId = payload.clientId ?? payload.client_id;
    const clientSecret = payload.clientSecret ?? payload.client_secret ?? payload.secret;

    if (typeof clientId === "string") {
      this.appSettings.landApi.clientId = clientId;
    }
    if (typeof clientSecret === "string") {
      this.appSettings.landApi.secret = clientSecret;
    }

    return undefined;
  }

  private landRegistryGetApiKey():
    | { client_id_masked: string; has_secret: boolean }
    | null {
    const { clientId, secret } = this.appSettings.landApi;
    return {
      client_id_masked: "****" + (clientId?.slice(-4) || ""),
      has_secret: secret !== "",
    };
  }

  private async landRegistryTestConnection(): Promise<{ success: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { success: true, message: "連線成功" };
  }

  private landRegistryGetBalance(): {
    month_total_cost: number;
    month_query_count: number;
    low_balance_warning: boolean;
  } {
    return { month_total_cost: 500, month_query_count: 50, low_balance_warning: false };
  }

  private landRegistryRecordConsent(args?: CommandArgs): undefined {
    const payload = toRecord(args);
    const caseId = pickString(payload, ["caseId", "case_id"]);
    if (caseId) {
      this.consentedCases.add(caseId);
    }
    return undefined;
  }

  private restorePersistedState(): void {
    const storage = getBrowserLocalStorage();
    if (!storage) {
      return;
    }

    try {
      const raw = storage.getItem(MOCK_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as PersistedMockState;
      const persistedLicense = parsed.license;
      const persistedSession = parsed.sessionUser;
      const persistedSettings = parsed.appSettings;

      if (
        persistedLicense &&
        (persistedLicense.status === "none" ||
          persistedLicense.status === "valid" ||
          persistedLicense.status === "expired")
      ) {
        this.license = {
          status: persistedLicense.status,
          serialKey:
            typeof persistedLicense.serialKey === "string"
              ? persistedLicense.serialKey
              : null,
        };
      }

      if (
        persistedSession &&
        typeof persistedSession.email === "string" &&
        (persistedSession.role === "admin" || persistedSession.role === "user")
      ) {
        this.sessionUser = {
          email: persistedSession.email,
          role: persistedSession.role,
        };
      }

      if (persistedSettings) {
        const landApi = toRecord(persistedSettings.landApi);
        this.appSettings = {
          landApi: {
            clientId: readString(landApi.clientId) ?? "",
            secret: readString(landApi.secret) ?? "",
          },
          premium: {
            subscribed: Boolean(toRecord(persistedSettings.premium).subscribed),
            plan: readString(toRecord(persistedSettings.premium).plan),
            expiresAt:
              readString(toRecord(persistedSettings.premium).expiresAt) ??
              readString(toRecord(persistedSettings.premium).expires_at),
          },
          premiumUnlocked: Boolean(persistedSettings.premiumUnlocked),
        };
      }

      if (Array.isArray(parsed.featureFlags)) {
        this.featureFlags = parsed.featureFlags
          .filter(
            (flag): flag is FeatureFlagState =>
              Boolean(flag) &&
              typeof flag.id === "string" &&
              typeof flag.name === "string" &&
              typeof flag.enabled === "boolean",
          )
          .map((flag) => ({ ...flag }));
      }
    } catch {
      // Ignore invalid/blocked localStorage in private mode.
    }
  }

  private persistState(): void {
    const storage = getBrowserLocalStorage();
    if (!storage) {
      return;
    }

    const snapshot: PersistedMockState = {
      license: { ...this.license },
      sessionUser: this.sessionUser ? { ...this.sessionUser } : null,
      appSettings: {
        landApi: {
          clientId: this.appSettings.landApi.clientId,
          secret: this.appSettings.landApi.secret,
        },
        premium: {
          subscribed: this.appSettings.premium.subscribed,
          plan: this.appSettings.premium.plan,
          expiresAt: this.appSettings.premium.expiresAt,
        },
        premiumUnlocked: this.appSettings.premiumUnlocked,
      },
      featureFlags: this.featureFlags.map((flag) => ({ ...flag })),
    };

    try {
      storage.setItem(MOCK_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Ignore private-mode localStorage failures and stay memory-only.
    }
  }
}

let defaultStore = new MockStore();

export async function mockInvoke<T>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<T> {
  return defaultStore.invoke<T>(cmd, args);
}

export function __resetMockStoreForTests(): void {
  const storage = getBrowserLocalStorage();
  if (storage) {
    try {
      storage.removeItem(MOCK_STORAGE_KEY);
    } catch {
      // noop
    }
  }
  defaultStore = new MockStore();
}
