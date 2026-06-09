var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};

// src/lib/tauri-bridge.ts
var init_tauri_bridge = __esm({
  "src/lib/tauri-bridge.ts"() {
    "use strict";
  }
});

// src/lib/aire-saas-session.ts
var AIRE_ENTRY_BASE_URL, AIRE_ENTRY_LOGIN_URL;
var init_aire_saas_session = __esm({
  "src/lib/aire-saas-session.ts"() {
    "use strict";
    AIRE_ENTRY_BASE_URL = "https://aire.opcos.me";
    AIRE_ENTRY_LOGIN_URL = `${AIRE_ENTRY_BASE_URL}/login`;
  }
});

// src/lib/browser-gateway.ts
var init_browser_gateway = __esm({
  "src/lib/browser-gateway.ts"() {
    "use strict";
    init_aire_saas_session();
  }
});

// src/lib/property-type-registry.ts
var PROPERTY_TYPE_REGISTRY;
var init_property_type_registry = __esm({
  "src/lib/property-type-registry.ts"() {
    "use strict";
    PROPERTY_TYPE_REGISTRY = [
      {
        id: "farmland",
        displayName: "\u8FB2\u5730",
        category: "land",
        fieldSchemaRef: "landSchema",
        registryCoverageProfileRef: "coverage-farmland"
      },
      {
        id: "townhouse",
        displayName: "\u900F\u5929\u5225\u5885",
        category: "building",
        fieldSchemaRef: "residentialSchema",
        registryCoverageProfileRef: "coverage-townhouse"
      },
      {
        id: "apartment",
        displayName: "\u516C\u5BD3",
        category: "building",
        fieldSchemaRef: "residentialSchema",
        registryCoverageProfileRef: "coverage-apartment"
      },
      {
        id: "highrise",
        displayName: "\u5927\u6A13\u83EF\u5EC8",
        category: "building",
        fieldSchemaRef: "residentialSchema",
        registryCoverageProfileRef: "coverage-highrise"
      },
      {
        id: "residential-land",
        displayName: "\u5EFA\u5730/\u4F4F\u5B85\u5730",
        category: "land",
        fieldSchemaRef: "landSchema",
        registryCoverageProfileRef: "coverage-residential-land"
      },
      {
        id: "farmhouse",
        displayName: "\u8FB2\u820D",
        category: "building",
        fieldSchemaRef: "residentialSchema",
        registryCoverageProfileRef: "coverage-farmhouse"
      },
      {
        id: "studio",
        displayName: "\u5957\u623F",
        category: "building",
        fieldSchemaRef: "residentialSchema",
        registryCoverageProfileRef: "coverage-studio"
      },
      {
        id: "storefront",
        displayName: "\u5E97\u9762",
        category: "building",
        fieldSchemaRef: "residentialSchema",
        registryCoverageProfileRef: "coverage-storefront"
      },
      {
        id: "factory",
        displayName: "\u5EE0\u623F",
        category: "building",
        fieldSchemaRef: "residentialSchema",
        registryCoverageProfileRef: "coverage-factory"
      },
      {
        id: "industrial-land",
        displayName: "\u5DE5\u696D\u5730",
        category: "land",
        fieldSchemaRef: "landSchema",
        registryCoverageProfileRef: "coverage-industrial-land"
      },
      {
        id: "commercial-land",
        displayName: "\u5546\u696D\u5730",
        category: "land",
        fieldSchemaRef: "landSchema",
        registryCoverageProfileRef: "coverage-commercial-land"
      },
      {
        id: "village-land",
        displayName: "\u9109\u6751\u5340\u5EFA\u5730",
        category: "land",
        fieldSchemaRef: "landSchema",
        registryCoverageProfileRef: "coverage-village-land"
      },
      {
        id: "other-land",
        displayName: "\u5176\u4ED6\u571F\u5730",
        category: "land",
        fieldSchemaRef: "landSchema",
        registryCoverageProfileRef: "coverage-other-land"
      }
    ];
  }
});

// src/lib/device/browser-fingerprint.ts
var init_browser_fingerprint = __esm({
  "src/lib/device/browser-fingerprint.ts"() {
    "use strict";
  }
});

// src/lib/device/browser-device-id.ts
var init_browser_device_id = __esm({
  "src/lib/device/browser-device-id.ts"() {
    "use strict";
    init_browser_fingerprint();
  }
});

// src/lib/license/browser-license-api.ts
var init_browser_license_api = __esm({
  "src/lib/license/browser-license-api.ts"() {
    "use strict";
    init_browser_device_id();
    init_browser_gateway();
  }
});

// src/lib/license/browser-trial-mode.ts
var init_browser_trial_mode = __esm({
  "src/lib/license/browser-trial-mode.ts"() {
    "use strict";
    init_browser_gateway();
    init_aire_saas_session();
    init_browser_license_api();
  }
});

// src/lib/cases-api.ts
function isCasePropertyType(value) {
  return value in PROPERTY_TYPE_LABEL;
}
var TPE_FMT, PROPERTY_TYPE_LABEL;
var init_cases_api = __esm({
  "src/lib/cases-api.ts"() {
    "use strict";
    init_tauri_bridge();
    init_browser_gateway();
    init_property_type_registry();
    init_browser_trial_mode();
    TPE_FMT = new Intl.DateTimeFormat("zh-TW", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    PROPERTY_TYPE_LABEL = {
      residential: "\u6210\u5C4B",
      land: "\u571F\u5730",
      other: "\u5176\u4ED6",
      ...Object.fromEntries(
        PROPERTY_TYPE_REGISTRY.map((definition) => [definition.id, definition.displayName])
      )
    };
  }
});

// src/lib/mock-backend.ts
function isBuildingFormalApi(apiId) {
  return [
    "building_registry",
    "building_ownership",
    "building_other_rights",
    "building_anchor",
    "building_parking"
  ].includes(apiId);
}
function unixNow() {
  return Math.floor(Date.now() / 1e3);
}
function readString(value) {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}
function pickString(record, keys) {
  for (const key of keys) {
    const picked = readString(record[key]);
    if (picked) {
      return picked;
    }
  }
  return null;
}
function normalizeR02Text(input) {
  return input.replace(/<[^>]+>/g, "\n").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).join("\n");
}
function extractR02Label(text, label) {
  const labels = [
    "\u884C\u653F\u5340",
    "\u5730\u653F\u4E8B\u52D9\u6240",
    "\u5730\u6BB5",
    "\u5730\u865F",
    "\u5EFA\u865F",
    "\u5EFA\u7269\u9762\u7A4D",
    "\u6A13\u5C64\u6578",
    "\u6A13\u5C64\u5225",
    "\u5EFA\u7269\u5B8C\u6210\u65E5\u671F",
    "\u4E3B\u8981\u7528\u9014"
  ];
  const lines = text.split(/\r?\n/);
  for (const [index, rawLine] of lines.entries()) {
    const line = rawLine.replace(/：/g, ":").trim();
    if (line === label) {
      return lines[index + 1]?.trim() || null;
    }
    if (line.startsWith(label)) {
      const value = line.slice(label.length).replace(/^:/, "").trim();
      if (value) return value.replace(/\s+/g, " ");
    }
    const labelIndex = line.indexOf(label);
    if (labelIndex >= 0) {
      const after = line.slice(labelIndex + label.length).replace(/^:/, "").trim();
      if (!after) continue;
      const nextLabelIndex = labels.filter((candidate) => candidate !== label).map((candidate) => after.indexOf(candidate)).filter((position) => position >= 0).sort((a, b) => a - b)[0];
      return after.slice(0, nextLabelIndex ?? after.length).trim().replace(/\s+/g, " ");
    }
  }
  return null;
}
function toRecord(value) {
  if (value && typeof value === "object") {
    return value;
  }
  return {};
}
function readNullableJson(value) {
  if (value === null) {
    return null;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }
  return void 0;
}
function makeUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
function getBrowserLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function readPersistedBrandTextSettings() {
  const storage = getBrowserLocalStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem("aire-mock-store");
    if (!raw) return {};
    const parsed = toRecord(JSON.parse(raw));
    const branding = toRecord(parsed.branding);
    return {
      agent_name: pickString(branding, ["agent_name", "agentName"]) ?? void 0,
      realtor_name: pickString(branding, ["realtor_name", "realtorName"]) ?? void 0,
      agent_cert_no: pickString(branding, ["agent_cert_no", "agentCertNo"]) ?? void 0,
      company_name: pickString(branding, ["company_name", "companyName"]) ?? void 0,
      company_license_no: pickString(branding, ["company_license_no", "companyLicenseNo"]) ?? void 0,
      company_address: pickString(branding, ["company_address", "companyAddress"]) ?? void 0,
      company_phone: pickString(branding, ["company_phone", "companyPhone"]) ?? void 0
    };
  } catch {
    return {};
  }
}
function persistBrandTextSettings(settings) {
  const storage = getBrowserLocalStorage();
  if (!storage) return;
  try {
    const raw = storage.getItem("aire-mock-store");
    const parsed = raw ? toRecord(JSON.parse(raw)) : {};
    const branding = toRecord(parsed.branding);
    parsed.branding = {
      ...branding,
      agentName: pickString(settings, ["agent_name"]) ?? branding.agentName,
      realtorName: pickString(settings, ["realtor_name"]) ?? branding.realtorName,
      agentCertNo: pickString(settings, ["agent_cert_no"]) ?? branding.agentCertNo,
      companyName: pickString(settings, ["company_name"]) ?? branding.companyName,
      companyLicenseNo: pickString(settings, ["company_license_no"]) ?? branding.companyLicenseNo,
      companyAddress: pickString(settings, ["company_address"]) ?? branding.companyAddress,
      companyPhone: pickString(settings, ["company_phone"]) ?? branding.companyPhone
    };
    storage.setItem("aire-mock-store", JSON.stringify(parsed));
  } catch {
  }
}
async function mockInvoke(cmd, args) {
  return defaultStore.invoke(cmd, args);
}
function inferBillingObjectType(run, serviceCode) {
  const haystack = [
    serviceCode,
    run.source_input,
    JSON.stringify(run.candidate_json ?? {}),
    JSON.stringify(run.cop_response_json ?? {})
  ].join(" ");
  if (/paid_address_resolver|MOI_API_037|門牌|address/i.test(haystack)) return "address";
  if (/building|建物|建號|building_registry|building_ownership/i.test(haystack)) return "building";
  if (/land|土地|地號|land_registry|地籍/i.test(haystack)) return "land";
  return "unknown";
}
function formatBillingObjectType(type) {
  if (type === "building") return "\u6236\u5EFA";
  if (type === "land") return "\u571F\u5730";
  if (type === "address") return "\u9580\u724C";
  return "\u5176\u4ED6";
}
var CASE_ASSET_KINDS, CASE_ASSET_SOURCES, MOCK_STORAGE_KEY, TEST_ACCOUNTS, ONE_TIME_DESKTOP_CODES, DEFAULT_APP_SETTINGS, DEFAULT_FEATURE_FLAGS, DEFAULT_PROFILE_SETTINGS, DEFAULT_TRIAL_STATE, DEFAULT_THEMES, SEED_CASES, SEED_LOGS, SEED_CLAUSES, SEED_BRAND_SETTINGS, MockStore, defaultStore;
var init_mock_backend = __esm({
  "src/lib/mock-backend.ts"() {
    "use strict";
    init_cases_api();
    CASE_ASSET_KINDS = [
      "company_logo",
      "floor_plan",
      "exterior_photo",
      "location_map",
      "surrounding_map",
      "cadastral_map",
      "field_survey_photo",
      "other_site_photo"
    ];
    CASE_ASSET_SOURCES = [
      "manual_upload",
      "legacy_floor_plan_photo",
      "auto_generated",
      "api_generated"
    ];
    MOCK_STORAGE_KEY = "aire-mock-store";
    TEST_ACCOUNTS = [
      {
        email: "admin@test.aire",
        password: "password",
        role: "admin",
        status: "active"
      },
      {
        email: "user@test.aire",
        password: "password",
        role: "user",
        status: "active"
      },
      {
        email: "expired@test.aire",
        password: "password",
        role: "user",
        status: "expired"
      }
    ];
    ONE_TIME_DESKTOP_CODES = {
      "admin@test.aire": { code: "OTC-ADMIN-2026", entitlement: true },
      "user@test.aire": { code: "OTC-USER-2026", entitlement: true },
      "buyer-no-entitlement@test.aire": { code: "OTC-NO-ENTITLE-2026", entitlement: false },
      "expired-code@test.aire": { code: "OTC-EXPIRED-2026", entitlement: true, expired: true }
    };
    DEFAULT_APP_SETTINGS = {
      landApi: {
        clientId: "",
        secret: ""
      },
      premium: {
        subscribed: false,
        plan: null,
        expiresAt: null
      },
      premiumUnlocked: false
    };
    DEFAULT_FEATURE_FLAGS = [
      { id: "google-map", name: "Google \u5730\u5716", enabled: false },
      { id: "aerial-photo", name: "\u7A7A\u62CD\u5716", enabled: false },
      { id: "street-view-reference", name: "\u8857\u666F\u53C3\u8003", enabled: false },
      { id: "ai-floor-plan", name: "AI \u683C\u5C40\u5716\u6574\u7406", enabled: false },
      { id: "cadastral-map", name: "\u5730\u7C4D\u5716\u6574\u7406", enabled: false },
      { id: "premium_real_price_enabled", name: "\u5BE6\u50F9\u767B\u9304", enabled: false }
    ];
    DEFAULT_PROFILE_SETTINGS = {
      name: "\u4F59\u555F\u5F70",
      email: "fish.myfb@gmail.com",
      brandColor: "#174d36",
      logoName: "",
      passwordUpdatedAt: null
    };
    DEFAULT_TRIAL_STATE = {
      plan: "trial",
      status: "active",
      startedAt: "2026-05-25T00:00:00.000Z",
      endsAt: "2026-06-24T23:59:59.000Z"
    };
    DEFAULT_THEMES = [
      {
        id: "theme-a-minimal",
        label: "\u6DE1\u96C5 Minimal",
        displayName: "\u6DE1\u96C5 Minimal",
        description: "\u7C21\u6F54\u3001\u5C08\u696D\u3001\u9069\u5408\u6A19\u6E96\u4E0D\u52D5\u7522\u8AAA\u660E\u66F8"
      },
      {
        id: "theme-b-professional",
        label: "\u5C08\u696D\u6C89\u7A69 Professional",
        displayName: "\u5C08\u696D\u6C89\u7A69 Professional",
        description: "\u6DF1\u85CD\u7070\u4E3B\u8272\uFF0C\u5546\u52D9\u611F\u8207\u5C08\u696D\u611F\u517C\u5177"
      },
      {
        id: "theme-c-tech-elegant",
        label: "\u79D1\u6280\u512A\u96C5 Tech Elegant",
        displayName: "\u79D1\u6280\u512A\u96C5 Tech Elegant",
        description: "\u6DF1\u85CD\u5E95\u8272\uFF0C\u7C89\u6F38\u5C64\u88DD\u98FE\uFF0C\u91D1\u8272\u908A\u6846"
      },
      {
        id: "theme-d-fresh",
        label: "\u6E05\u65B0\u81EA\u7136 Fresh",
        displayName: "\u6E05\u65B0\u81EA\u7136 Fresh",
        description: "\u7DA0\u8272\u7CFB\u4E3B\u8272\uFF0C\u6E05\u65B0\u81EA\u7136\u98A8\u683C"
      },
      {
        id: "theme-e-warm",
        label: "\u6EAB\u6696\u89AA\u5207 Warm",
        displayName: "\u6EAB\u6696\u89AA\u5207 Warm",
        description: "\u6A58\u8272\u7CFB\u4E3B\u8272\uFF0C\u6EAB\u6696\u89AA\u548C\u98A8\u683C"
      }
    ];
    SEED_CASES = [
      {
        id: "11111111-1111-4111-8111-111111111111",
        case_no: "AIRE-2026-001",
        case_name: "\u548C\u5E73\u6771\u8DEF\u6848",
        property_type: "residential",
        land_lot_no: "\u5927\u5B89\u6BB5\u4E00\u5C0F\u6BB5 123-4",
        land_lots: ["\u5927\u5B89\u6BB5\u4E00\u5C0F\u6BB5 123-4"],
        building_lot_no: "\u5EFA\u865F 556-1",
        address: "\u53F0\u5317\u5E02\u5927\u5B89\u5340\u548C\u5E73\u6771\u8DEF\u4E00\u6BB5 100 \u865F",
        owner_name: "\u9673\u5C0F\u7F8E",
        land_registry_data: null,
        current_step: 1,
        status: "draft",
        asking_price: null,
        created_at: 17632e5,
        updated_at: 17632e5
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        case_no: "AIRE-2026-002",
        case_name: "\u6587\u5316\u8DEF\u571F\u5730\u6848",
        property_type: "land",
        land_lot_no: "\u677F\u6A4B\u6BB5\u4E8C\u5C0F\u6BB5 88-1",
        land_lots: ["\u677F\u6A4B\u6BB5\u4E8C\u5C0F\u6BB5 88-1"],
        building_lot_no: null,
        address: "\u65B0\u5317\u5E02\u677F\u6A4B\u5340\u6587\u5316\u8DEF\u4E00\u6BB5 188 \u865F",
        owner_name: "\u6797\u5927\u83EF",
        land_registry_data: {
          land_registry: { data: { area: 268.34, purpose: "\u5EFA" } },
          zoning: { data: { zoning_type: "\u4F4F\u5B85\u5340", usage_category: "\u4E59\u7A2E\u4F4F\u5B85\u7528\u5730" } },
          land_value: { data: { announced_value: 236e3, assessed_value: 188e3 } },
          mortgages: { data: [{ creditor: "\u53F0\u7063\u9280\u884C", amount: 12e6 }] },
          dossier_preview: {
            data: {
              restriction_registration: "\u7121\u9650\u5236\u767B\u8A18",
              trust_registration: "\u7121\u4FE1\u8A17\u767B\u8A18",
              caution_registration: "\u7121\u9810\u544A\u767B\u8A18",
              other_rights_detail: "\u7121\u5176\u4ED6\u6B0A\u5229\u767B\u8A18\u4E8B\u9805",
              current_rental_status: "\u90E8\u5206\u51FA\u79DF\uFF08\u6708\u79DF NT$28,000\uFF09",
              current_occupation: "\u73FE\u6CC1\u81EA\u7528",
              shared_management: "\u4F9D\u5206\u7BA1\u5354\u8B70",
              existing_road: "\u81E8 8 \u7C73\u8A08\u756B\u9053\u8DEF",
              other_usage_status: "\u7A7A\u5730\uFF0F\u505C\u8ECA\u4F7F\u7528",
              urban_plan_zone: "\u4F4F\u5B85\u5340",
              non_urban_land_category: "\u4E59\u7A2E\u4F4F\u5B85\u7528\u5730",
              floor_area_ratio: "225%",
              building_coverage_ratio: "60%",
              special_designated_area: "\u7121",
              transaction_total_price: "NT$ 38,000,000",
              payment_method: "\u7C3D\u7D04 10%\u3001\u904E\u6236 90%",
              tax_burden_agreement: "\u4F9D\u5951\u7D04\u7D04\u5B9A\u5206\u64D4",
              penalty_clause: "\u903E\u671F\u6BCF\u65E5\u5343\u5206\u4E4B\u4E00\u9055\u7D04\u91D1",
              environmental_impact: "\u7121\u660E\u986F\u6C61\u67D3\u6E90",
              major_incident: "\u7121\u91CD\u5927\u4E8B\u6545\u7D00\u9304",
              nearby_public_facilities: "\u6377\u904B\u7AD9\u7D04 600m\u3001\u516C\u5712\u7D04 200m",
              surrounding_transaction_price: "\u8FD1\u534A\u5E74\u6210\u4EA4\u5747\u50F9\u7D04 NT$ 46 \u842C/\u576A"
            }
          }
        },
        current_step: 1,
        status: "completed",
        asking_price: null,
        created_at: 1763203600,
        updated_at: 1763207200
      }
    ];
    SEED_LOGS = [
      {
        id: 5,
        ts: 1763221200,
        action: "setting_change",
        payload: JSON.stringify({ key: "theme", value: "theme-a-minimal" }),
        result: "ok"
      },
      {
        id: 4,
        ts: 1763217600,
        action: "pdf_export",
        payload: JSON.stringify({ case_id: "11111111-1111-4111-8111-111111111111" }),
        result: "ok"
      },
      {
        id: 3,
        ts: 1763214e3,
        action: "case_update",
        payload: JSON.stringify({ case_id: "11111111-1111-4111-8111-111111111111" }),
        result: "ok"
      },
      {
        id: 2,
        ts: 1763210400,
        action: "case_create",
        payload: JSON.stringify({ case_id: "11111111-1111-4111-8111-111111111111" }),
        result: "ok"
      },
      {
        id: 1,
        ts: 1763206800,
        action: "license_activate",
        payload: JSON.stringify({ serial_key: "DEMO-KEY-001" }),
        result: "ok"
      }
    ];
    SEED_CLAUSES = [
      {
        law_id: "clause-1",
        title: "\u4E0D\u52D5\u7522\u7D93\u7D00\u696D\u7BA1\u7406\u689D\u4F8B\u7B2C 1 \u689D",
        content: "\u672C\u689D\u4F8B\u4F9D\u4E0D\u52D5\u7522\u7D93\u7D00\u696D\u7BA1\u7406\u9700\u8981\u5236\u5B9A\u4E4B\u3002",
        version_date: "2025-01-01",
        fetched_at: "2026-05-15T08:00:00.000Z"
      },
      {
        law_id: "clause-2",
        title: "\u4E0D\u52D5\u7522\u7D93\u7D00\u696D\u7BA1\u7406\u689D\u4F8B\u7B2C 2 \u689D",
        content: "\u672C\u689D\u4F8B\u7528\u8A5E\uFF0C\u5B9A\u7FA9\u5982\u4E0B\u3002",
        version_date: "2025-01-01",
        fetched_at: "2026-05-15T08:00:00.000Z"
      },
      {
        law_id: "clause-3",
        title: "\u4E0D\u52D5\u7522\u7D93\u7D00\u696D\u7BA1\u7406\u689D\u4F8B\u7B2C 3 \u689D",
        content: "\u7D93\u7D00\u696D\u61C9\u9075\u5FAA\u8AA0\u4FE1\u539F\u5247\u57F7\u884C\u696D\u52D9\u3002",
        version_date: "2025-01-01",
        fetched_at: "2026-05-15T08:00:00.000Z"
      }
    ];
    SEED_BRAND_SETTINGS = {
      company_name: "\u6E2C\u8A66\u4E0D\u52D5\u7522",
      contact_phone: "02-1234-5678",
      contact_address: "\u53F0\u5317\u5E02\u4FE1\u7FA9\u5340\u6E2C\u8A66\u8DEF 1 \u865F"
    };
    MockStore = class {
      license = {
        status: "none",
        serialKey: null
      };
      cases = /* @__PURE__ */ new Map();
      drafts = /* @__PURE__ */ new Map();
      logs = [];
      operationLogs = [];
      brandSettings = { ...SEED_BRAND_SETTINGS };
      brandTextSettings = {};
      logo = null;
      themeId = "theme-a-minimal";
      clauses = /* @__PURE__ */ new Map();
      sessionUser = null;
      deviceSession = {
        status: "missing",
        email: null,
        persistedAt: null
      };
      appSettings = {
        landApi: {
          clientId: DEFAULT_APP_SETTINGS.landApi.clientId,
          secret: DEFAULT_APP_SETTINGS.landApi.secret
        },
        premium: {
          subscribed: DEFAULT_APP_SETTINGS.premium.subscribed,
          plan: DEFAULT_APP_SETTINGS.premium.plan,
          expiresAt: DEFAULT_APP_SETTINGS.premium.expiresAt
        },
        premiumUnlocked: DEFAULT_APP_SETTINGS.premiumUnlocked
      };
      featureFlags = DEFAULT_FEATURE_FLAGS.map((flag) => ({
        ...flag
      }));
      profileSettings = { ...DEFAULT_PROFILE_SETTINGS };
      workbenchSupplements = /* @__PURE__ */ new Map();
      consentedCases = /* @__PURE__ */ new Set();
      floorPlanSketches = [];
      floorPlanConversions = [];
      caseAssets = [];
      caseAssetBytes = /* @__PURE__ */ new Map();
      organizationId = "org-demo-001";
      trialState = { ...DEFAULT_TRIAL_STATE };
      registryQueryRuns = [];
      registryQueryCache = /* @__PURE__ */ new Map();
      registryMatchByCase = /* @__PURE__ */ new Map();
      constructor() {
        this.reset();
        this.floorPlanSketches = [];
        this.floorPlanConversions = [];
        this.caseAssets = [];
        this.caseAssetBytes = /* @__PURE__ */ new Map();
        this.trialState = { ...DEFAULT_TRIAL_STATE };
        this.registryQueryRuns = [];
        this.registryQueryCache = /* @__PURE__ */ new Map();
        this.registryMatchByCase = /* @__PURE__ */ new Map();
        this.restorePersistedState();
      }
      reset() {
        this.license = {
          status: "none",
          serialKey: null
        };
        this.cases = new Map(SEED_CASES.map((row) => [row.id, { ...row }]));
        this.drafts = /* @__PURE__ */ new Map();
        this.logs = SEED_LOGS.map((entry) => ({ ...entry }));
        this.operationLogs = [];
        this.brandSettings = { ...SEED_BRAND_SETTINGS };
        this.brandTextSettings = {};
        this.logo = null;
        this.themeId = "theme-a-minimal";
        this.clauses = new Map(SEED_CLAUSES.map((clause) => [clause.law_id, { ...clause }]));
        this.sessionUser = null;
        this.appSettings = {
          landApi: {
            clientId: DEFAULT_APP_SETTINGS.landApi.clientId,
            secret: DEFAULT_APP_SETTINGS.landApi.secret
          },
          premium: {
            subscribed: DEFAULT_APP_SETTINGS.premium.subscribed,
            plan: DEFAULT_APP_SETTINGS.premium.plan,
            expiresAt: DEFAULT_APP_SETTINGS.premium.expiresAt
          },
          premiumUnlocked: DEFAULT_APP_SETTINGS.premiumUnlocked
        };
        this.featureFlags = DEFAULT_FEATURE_FLAGS.map((flag) => ({ ...flag }));
        this.profileSettings = { ...DEFAULT_PROFILE_SETTINGS };
        this.workbenchSupplements = /* @__PURE__ */ new Map();
        this.floorPlanSketches = [];
        this.floorPlanConversions = [];
        this.trialState = { ...DEFAULT_TRIAL_STATE };
        this.registryQueryRuns = [];
        this.registryQueryCache = /* @__PURE__ */ new Map();
        this.registryMatchByCase = /* @__PURE__ */ new Map();
      }
      async invoke(cmd, args) {
        try {
          switch (cmd) {
            case "get_license_status":
              return this.getLicenseStatus();
            case "activate_license":
              return this.activateLicense(args);
            case "deactivate_license":
              return this.deactivateLicense();
            case "check_license":
              return this.checkLicense();
            case "login":
              return this.login(args);
            case "exchange_desktop_bootstrap_code":
              return this.exchangeDesktopBootstrapCode(args);
            case "logout":
              return this.logout();
            case "get_session":
              return this.getSession();
            case "get_device_session_status":
              return this.getDeviceSessionStatus();
            case "get_app_settings":
              return this.getAppSettings();
            case "save_app_settings":
              return this.saveAppSettings(args);
            case "get_land_api_settings":
              return this.getLandApiSettings();
            case "save_land_api_settings":
              return this.saveLandApiSettings(args);
            case "test_land_api_connection":
              return await this.testLandApiConnection();
            case "get_premium_status":
              return this.getPremiumStatus();
            case "subscribe_premium":
              return this.subscribePremium();
            case "get_feature_flags":
              return this.getFeatureFlags();
            case "toggle_feature_flag":
              return this.toggleFeatureFlag(args);
            case "get_profile_settings":
              return this.getProfileSettings();
            case "save_profile_settings":
              return this.saveProfileSettings(args);
            case "update_profile_password":
              return this.updateProfilePassword(args);
            case "list_cases":
              return this.listCases();
            case "get_case":
              return this.getCase(args);
            case "create_case":
              return this.createCase(args);
            case "update_case":
              return this.updateCase(args);
            case "delete_case":
              return this.deleteCase(args);
            case "mark_completed":
              return this.markCompleted(args);
            case "get_workbench_supplement":
              return this.getWorkbenchSupplement(args);
            case "save_workbench_supplement":
              return this.saveWorkbenchSupplement(args);
            case "export_pdf":
              return this.exportPdf(args);
            case "save_draft":
              return this.saveDraft(args);
            case "get_draft":
            case "load_draft":
              return this.loadDraft(args);
            case "write_log":
              return this.writeLog(args);
            case "list_recent_logs":
              return this.listRecentLogs(args);
            case "list_logs":
              return this.listLogs();
            case "get_brand_settings":
              return this.getBrandSettings();
            case "save_brand_settings":
              return this.saveBrandSettings(args);
            case "get_brand_text_settings":
              return this.getBrandTextSettings();
            case "save_brand_text_settings":
              return this.saveBrandTextSettings(args);
            case "upload_logo":
            case "save_logo":
              return this.uploadLogo(args);
            case "delete_logo":
              return this.deleteLogo();
            case "load_logo":
            case "get_logo":
              return this.getLogo();
            case "set_theme":
              return this.setTheme(args);
            case "get_theme":
              return this.getTheme();
            case "list_themes":
              return this.listThemes();
            case "get_clause":
            case "get_legal_clause":
              return this.getClause(args);
            case "list_clauses":
            case "list_legal_clauses":
              return this.listClauses();
            case "sync_clauses":
            case "sync_legal_clauses":
              return this.syncClauses();
            case "land_registry_address_lookup":
              return this.landRegistryAddressLookup(args);
            case "record_local_address_discovery":
              return this.recordLocalAddressDiscovery(args);
            case "land_registry_parse_r02_result_text":
              return this.landRegistryParseR02ResultText(args);
            case "land_registry_record_r02_result_text":
              return this.landRegistryRecordR02ResultText(args);
            case "land_registry_pull_data":
              return this.landRegistryPullData(args);
            case "land_registry_formal_pull_data":
              return this.landRegistryFormalPullData(args);
            case "land_registry_paid_address_resolver":
              return this.landRegistryPaidAddressResolver(args);
            case "query_real_price":
              return this.queryRealPrice(args);
            case "land_registry_set_api_key":
              return this.landRegistrySetApiKey(args);
            case "land_registry_get_api_key":
              return this.landRegistryGetApiKey();
            case "land_registry_test_connection":
              return await this.landRegistryTestConnection();
            case "land_registry_get_balance":
              return this.landRegistryGetBalance();
            case "land_registry_list_billing_entries":
              return this.landRegistryListBillingEntries();
            case "land_registry_record_consent":
              return this.landRegistryRecordConsent(args);
            case "list_registry_query_runs":
              return this.listRegistryQueryRuns(args);
            case "get_registry_query_run_detail":
              return this.getRegistryQueryRunDetail(args);
            case "land_registry_sync_query_run_to_saas":
              return this.syncRegistryQueryRunToSaas(args);
            case "confirm_case_registry_match":
              return this.confirmCaseRegistryMatch(args);
            case "get_trial_status":
              return this.getTrialStatus();
            case "set_trial_status":
              return this.setTrialStatus(args);
            case "import_case_asset":
              return this.importCaseAsset(args);
            case "list_case_assets":
              return this.listCaseAssets(args);
            case "read_case_asset_bytes":
              return this.readCaseAssetBytes(args);
            case "delete_case_asset":
              return this.deleteCaseAsset(args);
            case "upload_floor_plan_sketch":
              return this.uploadFloorPlanSketch(args);
            case "list_floor_plan_conversion_history":
              return this.listFloorPlanConversionHistory(args);
            case "extract_floor_plan_sketch": {
              const sketchId = String(args?.sketch_id ?? "");
              const sketch = this.floorPlanSketches.find((s) => s.id === sketchId);
              const iso = (/* @__PURE__ */ new Date()).toISOString();
              const convId = `conv-${Date.now()}`;
              const extracted = JSON.stringify({
                rooms: [
                  { label: "\u5BA2\u5EF3", area_sqm: 20, dimensions_text: "4m\xD75m" },
                  { label: "\u4E3B\u81E5", area_sqm: 12, dimensions_text: "3m\xD74m" },
                  { label: "\u5EDA\u623F", area_sqm: 8, dimensions_text: "2m\xD74m" }
                ],
                openings: [{ type: "door", between: ["\u5BA2\u5EF3", "\u4E3B\u81E5"] }],
                adjacency: [{ room_a: "\u5BA2\u5EF3", room_b: "\u4E3B\u81E5" }],
                uncertainty: []
              });
              const conv = {
                id: convId,
                sketch_id: sketchId,
                case_id: sketch?.case_id ?? "",
                status: "draft",
                extracted_json: extracted,
                manual_edits_json: "{}",
                uncertainty_json: "[]",
                renderer_version: null,
                rendered_asset_id: null,
                approval_checklist_json: "{}",
                approved_by: null,
                approved_at: null,
                model_provider: "openai",
                model_id: "gpt-4o-mock",
                prompt_template_version: null,
                response_fingerprint: null,
                created_at: iso,
                updated_at: iso
              };
              this.floorPlanConversions = [...this.floorPlanConversions ?? [], conv];
              return conv;
            }
            case "render_floor_plan_conversion":
              return "<svg><!--mock--></svg>";
            case "approve_floor_plan_conversion":
              return {
                id: args?.conversion_id,
                status: "approved",
                ...args?.checklist ?? {}
              };
            case "revoke_floor_plan_conversion":
              return {
                id: args?.conversion_id,
                status: "revoked"
              };
            default:
              throw new Error(`Mock not implemented: ${cmd}`);
          }
        } finally {
          this.persistState();
        }
      }
      getLicenseStatus() {
        return {
          status: this.license.status,
          serial_key: this.license.serialKey
        };
      }
      activateLicense(args) {
        const payload = toRecord(args);
        const serialKey = pickString(payload, ["serial_key", "key"]);
        if (!serialKey) {
          throw new Error("activate_license requires non-empty serial_key");
        }
        const MOCK_RESPONSES = {
          "AIRE-TEST-EXPIRED-001": "EXPIRED_KEY",
          "AIRE-TEST-USED-001": "ALREADY_ACTIVATED_OTHER_DEVICE",
          "AIRE-TEST-QUOTA-001": "QUOTA_EXHAUSTED",
          "AIRE-TEST-NETFAIL-001": "NETWORK_FAILED",
          "AIRE-TEST-DOWN-001": "OPCOS_UNAVAILABLE"
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
          serialKey
        };
        return { success: true };
      }
      deactivateLicense() {
        this.license = {
          status: "none",
          serialKey: null
        };
        return { success: true };
      }
      login(args) {
        const payload = toRecord(args);
        const email = pickString(payload, ["email"]);
        const password = pickString(payload, ["password"]);
        if (!email || !password) {
          throw new Error("INVALID_CREDENTIALS");
        }
        const account = TEST_ACCOUNTS.find(
          (candidate) => candidate.email === email && candidate.password === password
        );
        if (!account) {
          throw new Error("INVALID_CREDENTIALS");
        }
        if (account.status === "expired") {
          throw new Error("ACCOUNT_EXPIRED");
        }
        this.sessionUser = {
          email: account.email,
          role: account.role
        };
        this.deviceSession = {
          status: "active",
          email: account.email,
          persistedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        return {
          success: true,
          user: { ...this.sessionUser }
        };
      }
      exchangeDesktopBootstrapCode(args) {
        const payload = toRecord(args);
        const email = pickString(payload, ["email"]);
        const code = pickString(payload, ["code"]);
        if (!email || !code) {
          throw new Error("INVALID_CREDENTIALS");
        }
        const expected = ONE_TIME_DESKTOP_CODES[email];
        if (!expected || expected.code !== code) {
          throw new Error("INVALID_CREDENTIALS");
        }
        if (expected.expired) {
          throw new Error("BOOTSTRAP_CODE_EXPIRED");
        }
        if (!expected.entitlement) {
          throw new Error("ENTITLEMENT_REQUIRED");
        }
        const account = TEST_ACCOUNTS.find((candidate) => candidate.email === email);
        const role = account?.role ?? "user";
        this.sessionUser = { email, role };
        this.deviceSession = {
          status: "active",
          email,
          persistedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        return {
          success: true,
          user: { ...this.sessionUser },
          bootstrapOnly: true
        };
      }
      logout() {
        this.sessionUser = null;
        this.deviceSession = {
          status: "missing",
          email: null,
          persistedAt: null
        };
        return { success: true };
      }
      getSession() {
        if (!this.sessionUser) {
          return { authenticated: false };
        }
        return {
          authenticated: true,
          user: { ...this.sessionUser }
        };
      }
      getDeviceSessionStatus() {
        return { ...this.deviceSession };
      }
      getAppSettings() {
        return {
          license: {
            status: this.license.status,
            serialKey: this.license.serialKey
          },
          landApi: {
            clientId: this.appSettings.landApi.clientId,
            secret: this.appSettings.landApi.secret
          },
          premiumUnlocked: this.appSettings.premiumUnlocked
        };
      }
      saveAppSettings(args) {
        const payload = toRecord(args);
        const landApi = toRecord(payload.landApi);
        const premiumUnlocked = payload.premiumUnlocked;
        const clientId = readString(landApi.clientId);
        const secret = readString(landApi.secret);
        this.appSettings = {
          ...this.appSettings,
          landApi: {
            clientId: clientId ?? this.appSettings.landApi.clientId,
            secret: secret ?? this.appSettings.landApi.secret
          },
          premiumUnlocked: typeof premiumUnlocked === "boolean" ? premiumUnlocked : this.appSettings.premiumUnlocked
        };
        return { success: true };
      }
      getLandApiSettings() {
        return {
          clientId: this.appSettings.landApi.clientId,
          secret: this.appSettings.landApi.secret
        };
      }
      saveLandApiSettings(args) {
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
      async testLandApiConnection() {
        await new Promise((resolve) => {
          setTimeout(resolve, 500);
        });
        return {
          success: true,
          latency_ms: Math.floor(Math.random() * 401) + 100
        };
      }
      getPremiumStatus() {
        return {
          subscribed: this.appSettings.premium.subscribed,
          plan: this.appSettings.premium.plan,
          expires_at: this.appSettings.premium.expiresAt
        };
      }
      subscribePremium() {
        return { redirect_url: "https://opcos.me/products/aire?intent=request-access" };
      }
      getFeatureFlags() {
        return this.featureFlags.map((flag) => ({ ...flag }));
      }
      toggleFeatureFlag(args) {
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
      getProfileSettings() {
        return { ...this.profileSettings };
      }
      saveProfileSettings(args) {
        const payload = toRecord(args);
        this.profileSettings = {
          ...this.profileSettings,
          name: typeof payload.name === "string" ? payload.name : this.profileSettings.name,
          email: typeof payload.email === "string" ? payload.email : this.profileSettings.email,
          brandColor: typeof payload.brandColor === "string" ? payload.brandColor : typeof payload.brand_color === "string" ? payload.brand_color : this.profileSettings.brandColor,
          logoName: typeof payload.logoName === "string" ? payload.logoName : typeof payload.logo_name === "string" ? payload.logo_name : this.profileSettings.logoName
        };
        return { success: true };
      }
      updateProfilePassword(args) {
        const payload = toRecord(args);
        const currentPassword = readString(payload.currentPassword ?? payload.current_password);
        const newPassword = readString(payload.newPassword ?? payload.new_password);
        if (!currentPassword || !newPassword) {
          throw new Error("update_profile_password requires currentPassword and newPassword");
        }
        const passwordUpdatedAt = (/* @__PURE__ */ new Date()).toISOString();
        this.profileSettings = {
          ...this.profileSettings,
          passwordUpdatedAt
        };
        return { success: true, passwordUpdatedAt };
      }
      checkLicense() {
        return {
          status: this.license.status,
          is_valid: this.license.status === "valid"
        };
      }
      listCases() {
        return [...this.cases.values()].map((row) => ({ ...row }));
      }
      getCase(args) {
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
      createCase(args) {
        const payload = toRecord(args);
        const input = toRecord(payload.input);
        const propertyType = pickString(input, ["property_type"]);
        const address = pickString(input, ["address"]);
        if (!propertyType || !isCasePropertyType(propertyType)) {
          throw new Error("create_case requires valid property_type");
        }
        if (!address) {
          throw new Error("create_case requires address");
        }
        const now = unixNow();
        const id = makeUuid();
        const row = {
          id,
          case_no: pickString(input, ["case_no"]),
          case_name: pickString(input, ["case_name"]),
          property_type: propertyType,
          land_lot_no: pickString(input, ["land_lot_no"]) ?? "",
          land_lots: Array.isArray(input.land_lots) && input.land_lots.length > 0 ? input.land_lots : [pickString(input, ["land_lot_no"]) ?? ""].filter(Boolean),
          building_lot_no: pickString(input, ["building_lot_no"]),
          address,
          owner_name: pickString(input, ["owner_name"]),
          land_registry_data: readNullableJson(input["land_registry_data"]) ?? null,
          current_step: typeof input.current_step === "number" && Number.isFinite(input.current_step) ? Math.max(1, Math.floor(input.current_step)) : 1,
          asking_price: typeof input.asking_price === "number" && Number.isFinite(input.asking_price) ? input.asking_price : null,
          status: "draft",
          created_at: now,
          updated_at: now
        };
        this.cases.set(id, row);
        this.addLog("\u5EFA\u7ACB\u6848\u4EF6", `\u5EFA\u7ACB\u6848\u4EF6\uFF1A${row.address}`);
        this.persistState();
        return { ...row };
      }
      updateCase(args) {
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
        const propertyType = pickString(input, ["property_type"]);
        let nextPropertyType = existing.property_type;
        if (propertyType) {
          if (!isCasePropertyType(propertyType)) {
            throw new Error("update_case requires valid property_type");
          }
          nextPropertyType = propertyType;
        }
        const next = {
          ...existing,
          property_type: nextPropertyType,
          land_lot_no: pickString(input, ["land_lot_no"]) ?? existing.land_lot_no,
          land_lots: Array.isArray(input.land_lots) && input.land_lots.length > 0 ? input.land_lots.filter((lot) => typeof lot === "string" && lot.trim()) : existing.land_lots,
          address: pickString(input, ["address"]) ?? existing.address,
          owner_name: pickString(input, ["owner_name"]) ?? existing.owner_name,
          case_no: pickString(input, ["case_no"]) ?? existing.case_no,
          case_name: pickString(input, ["case_name"]) ?? existing.case_name ?? null,
          building_lot_no: pickString(input, ["building_lot_no"]) ?? existing.building_lot_no ?? null,
          land_registry_data: readNullableJson(input["land_registry_data"]) ?? existing.land_registry_data ?? null,
          current_step: typeof input.current_step === "number" && Number.isFinite(input.current_step) ? Math.max(1, Math.floor(input.current_step)) : existing.current_step ?? 1,
          status: pickString(input, ["status"]) ?? existing.status,
          asking_price: typeof input.asking_price === "number" && Number.isFinite(input.asking_price) ? input.asking_price : input.asking_price === null ? null : existing.asking_price ?? null,
          updated_at: unixNow()
        };
        this.cases.set(id, next);
        this.addLog("\u66F4\u65B0\u6848\u4EF6", `\u66F4\u65B0\u6848\u4EF6\uFF1A${id}`);
        return { ...next };
      }
      deleteCase(args) {
        const payload = toRecord(args);
        const id = pickString(payload, ["id"]);
        if (!id) {
          throw new Error("delete_case requires id");
        }
        this.cases.delete(id);
        this.drafts.delete(id);
        this.workbenchSupplements.delete(id);
        this.consentedCases.delete(id);
        this.registryMatchByCase.delete(id);
        this.floorPlanSketches = this.floorPlanSketches.filter((item) => item.case_id !== id);
        this.floorPlanConversions = this.floorPlanConversions.filter(
          (item) => String(item.case_id ?? "") !== id
        );
        const removedAssetIds = this.caseAssets.filter((asset) => asset.case_id === id).map((asset) => asset.id);
        this.caseAssets = this.caseAssets.filter((asset) => asset.case_id !== id);
        removedAssetIds.forEach((assetId) => this.caseAssetBytes.delete(assetId));
        const removedRunIds = new Set(
          this.registryQueryRuns.filter((run) => run.case_id === id).map((run) => run.id)
        );
        this.registryQueryRuns = this.registryQueryRuns.filter((run) => run.case_id !== id);
        this.registryQueryCache.forEach((runId, key) => {
          if (removedRunIds.has(runId)) {
            this.registryQueryCache.delete(key);
          }
        });
        this.persistState();
        this.addLog("\u522A\u9664\u6848\u4EF6", `\u522A\u9664\u6848\u4EF6\uFF1A${id}`);
      }
      markCompleted(args) {
        const payload = toRecord(args);
        const caseId = pickString(payload, ["caseId", "case_id", "id"]);
        if (!caseId) {
          throw new Error("mark_completed requires caseId");
        }
        const existing = this.cases.get(caseId);
        if (!existing) {
          throw new Error(`Case not found: ${caseId}`);
        }
        const updated = {
          ...existing,
          status: "completed",
          updated_at: unixNow()
        };
        this.cases.set(caseId, updated);
        return { ...updated };
      }
      getWorkbenchSupplement(args) {
        const payload = toRecord(args);
        const caseId = pickString(payload, ["caseId", "case_id", "id"]);
        if (!caseId) {
          throw new Error("get_workbench_supplement requires caseId");
        }
        return this.cloneWorkbenchSupplement(
          this.workbenchSupplements.get(caseId) ?? this.makeEmptyWorkbenchSupplement(caseId)
        );
      }
      saveWorkbenchSupplement(args) {
        const payload = toRecord(args);
        const caseId = pickString(payload, ["caseId", "case_id", "id"]);
        if (!caseId) {
          throw new Error("save_workbench_supplement requires caseId");
        }
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const existing = this.workbenchSupplements.get(caseId) ?? this.makeEmptyWorkbenchSupplement(caseId);
        const registrySupplements = Array.isArray(payload.registrySupplements) ? payload.registrySupplements.map((raw) => {
          const row = toRecord(raw);
          const fieldName = readString(row.fieldName) ?? readString(row.field_name);
          if (!fieldName) return null;
          return {
            fieldName,
            value: typeof row.value === "string" ? row.value : "",
            source: typeof row.source === "string" ? row.source : "\u5C4B\u4E3B\u63D0\u4F9B",
            status: typeof row.status === "string" ? row.status : "\u5F85\u78BA\u8A8D",
            updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : now
          };
        }).filter((row) => Boolean(row)) : existing.registrySupplements;
        const fieldVisitAnswers = Array.isArray(payload.fieldVisitAnswers) ? payload.fieldVisitAnswers.map((raw) => {
          const row = toRecord(raw);
          const topic = readString(row.topic);
          if (!topic) return null;
          return {
            topic,
            answer: typeof row.answer === "string" ? row.answer : "",
            status: typeof row.status === "string" ? row.status : "\u5F85\u78BA\u8A8D",
            updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : now
          };
        }).filter((row) => Boolean(row)) : existing.fieldVisitAnswers;
        const uploads = Array.isArray(payload.uploads) ? payload.uploads.map((raw) => {
          const row = toRecord(raw);
          const slot = readString(row.slot);
          if (!slot) return null;
          const fileName = typeof row.fileName === "string" ? row.fileName : typeof row.file_name === "string" ? row.file_name : "";
          return {
            slot,
            fileName,
            savedAt: typeof row.savedAt === "string" ? row.savedAt : now
          };
        }).filter((row) => Boolean(row)) : existing.uploads;
        this.workbenchSupplements.set(caseId, {
          caseId,
          registrySupplements,
          fieldVisitAnswers,
          uploads,
          supplementAdded: typeof payload.supplementAdded === "boolean" ? payload.supplementAdded : typeof payload.supplement_added === "boolean" ? payload.supplement_added : existing.supplementAdded,
          updatedAt: now
        });
        return { success: true };
      }
      makeEmptyWorkbenchSupplement(caseId) {
        return {
          caseId,
          registrySupplements: [],
          fieldVisitAnswers: [],
          uploads: [],
          supplementAdded: false,
          updatedAt: null
        };
      }
      cloneWorkbenchSupplement(draft) {
        return {
          caseId: draft.caseId,
          registrySupplements: draft.registrySupplements.map((row) => ({ ...row })),
          fieldVisitAnswers: draft.fieldVisitAnswers.map((row) => ({ ...row })),
          uploads: draft.uploads.map((row) => ({ ...row })),
          supplementAdded: draft.supplementAdded,
          updatedAt: draft.updatedAt
        };
      }
      exportPdf(args) {
        const payload = toRecord(args);
        const nestedArgs = toRecord(payload.args);
        const caseId = pickString(payload, ["caseId", "case_id"]) ?? pickString(nestedArgs, ["caseId", "case_id"]) ?? "mock-case";
        const path3 = `/mock/exports/${caseId}-${Date.now()}.pdf`;
        this.addLog("\u532F\u51FA PDF", `\u532F\u51FA PDF\uFF1A${caseId}`);
        return path3;
      }
      saveDraft(args) {
        const payload = toRecord(args);
        const caseId = pickString(payload, ["caseId", "case_id", "id"]);
        if (!caseId) {
          throw new Error("save_draft requires caseId");
        }
        const data = payload.data ?? payload.draft ?? payload.payload;
        this.drafts.set(caseId, data ?? null);
        return { success: true };
      }
      loadDraft(args) {
        const payload = toRecord(args);
        const caseId = pickString(payload, ["caseId", "case_id", "id"]);
        if (!caseId) {
          throw new Error("load_draft requires caseId");
        }
        const data = this.drafts.get(caseId);
        if (data === void 0 || data === null) return null;
        return {
          case_id: caseId,
          payload_json: typeof data === "string" ? data : JSON.stringify(data),
          schema_version: 1,
          saved_at: Math.floor(Date.now() / 1e3)
        };
      }
      writeLog(args) {
        const payload = toRecord(args);
        const id = this.logs.length > 0 ? this.logs[0].id + 1 : 1;
        const result = pickString(payload, ["result"]) === "error" ? "error" : "ok";
        const next = {
          id,
          ts: unixNow(),
          action: pickString(payload, ["action"]) ?? "mock_action",
          payload: payload.payload ? JSON.stringify(payload.payload) : null,
          result
        };
        this.logs = [next, ...this.logs];
        return { success: true };
      }
      listRecentLogs(args) {
        const payload = toRecord(args);
        const rawLimit = payload.limit;
        const limit = typeof rawLimit === "number" && Number.isFinite(rawLimit) && rawLimit >= 0 ? Math.floor(rawLimit) : 100;
        return this.logs.slice(0, limit).map((entry) => ({ ...entry }));
      }
      addLog(action, detail) {
        this.operationLogs = [
          {
            id: makeUuid(),
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            action,
            detail,
            user_email: this.sessionUser?.email ?? "system@local"
          },
          ...this.operationLogs
        ];
      }
      listLogs() {
        return this.operationLogs.map((entry) => ({ ...entry }));
      }
      getBrandSettings() {
        return { ...this.brandSettings };
      }
      saveBrandSettings(args) {
        const payload = toRecord(args);
        const settings = toRecord(payload.settings ?? payload.input ?? payload);
        this.brandSettings = {
          ...this.brandSettings,
          ...settings
        };
        return { success: true };
      }
      getBrandTextSettings() {
        return { ...readPersistedBrandTextSettings(), ...this.brandTextSettings };
      }
      saveBrandTextSettings(args) {
        const payload = toRecord(args);
        const settings = toRecord(payload.settings ?? payload.input ?? payload);
        this.brandTextSettings = { ...this.brandTextSettings, ...settings };
        persistBrandTextSettings(this.brandTextSettings);
      }
      uploadLogo(args) {
        const payload = toRecord(args);
        const bytesRaw = payload.bytes;
        const bytes = Array.isArray(bytesRaw) ? bytesRaw.filter((value) => typeof value === "number") : [];
        this.logo = {
          bytes,
          mime: pickString(payload, ["mime", "mimeType"]) ?? "image/png",
          filename: pickString(payload, ["filename", "fileName"]) ?? "brand-logo",
          uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        this.persistState();
        return { success: true };
      }
      getLogo() {
        return this.logo ? { ...this.logo } : null;
      }
      deleteLogo() {
        this.logo = null;
        this.persistState();
        return { success: true };
      }
      setTheme(args) {
        const payload = toRecord(args);
        const next = pickString(payload, ["theme_id", "themeId"]) ?? "theme-a-minimal";
        this.themeId = next;
        return { success: true, theme_id: this.themeId };
      }
      getTheme() {
        return this.themeId;
      }
      listThemes() {
        return DEFAULT_THEMES.map((theme) => ({ ...theme }));
      }
      getClause(args) {
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
      listClauses() {
        return [...this.clauses.values()].map((clause) => ({ ...clause }));
      }
      syncClauses() {
        const syncedAt = (/* @__PURE__ */ new Date()).toISOString();
        for (const [key, clause] of this.clauses.entries()) {
          this.clauses.set(key, {
            ...clause,
            fetched_at: syncedAt
          });
        }
        return {
          success: true,
          count: this.clauses.size,
          synced_at: syncedAt
        };
      }
      landRegistryAddressLookup(args) {
        const addr = args?.address || "\u672A\u77E5\u5730\u5740";
        let candidates = [];
        let errorCode;
        let errorMessage;
        let discoveryStatus = "candidate_found";
        if (!addr.trim() || /查無|不存在/.test(addr)) {
          candidates = [];
          discoveryStatus = "manual_required";
          errorCode = "address_no_match";
          errorMessage = "\u5730\u5740\u67E5\u7121\u53EF\u7528\u5019\u9078\uFF0C\u8ACB\u4EBA\u5DE5\u78BA\u8A8D\u5730\u6BB5\u3001\u5730\u865F\u3001\u5EFA\u865F";
        } else if (/勝利街58巷4號/.test(addr)) {
          candidates = [];
          discoveryStatus = "manual_required";
          errorCode = "address_discovery_unavailable";
          errorMessage = "\u672C\u6A5F\u6E2C\u8A66\u74B0\u5883\u672A\u53D6\u5F97\u52DD\u5229\u8857\u5730\u5740\u7684\u53EF\u4FE1\u5730\u653F\u5019\u9078\uFF0C\u8ACB\u4EBA\u5DE5\u78BA\u8A8D\u5730\u6BB5\u3001\u5730\u865F\u3001\u5EFA\u865F";
        } else if (/裕農路288巷17號/.test(addr)) {
          candidates = [
            { parcel_id: "DC-1556-00700000", address: addr, lot_number: "00700000", building_number: "", source: "dev_fixture", trusted_for_pdf: false },
            { parcel_id: "DC-1556-00165000", address: addr, lot_number: "00700000", building_number: "00165000", source: "dev_fixture", trusted_for_pdf: false },
            { parcel_id: "DC-1556-00167000", address: addr, lot_number: "00700000", building_number: "00167000", source: "dev_fixture", trusted_for_pdf: false },
            { parcel_id: "DC-1556-00229000", address: addr, lot_number: "00700000", building_number: "00229000", source: "dev_fixture", trusted_for_pdf: false },
            { parcel_id: "DC-1556-00230000", address: addr, lot_number: "00700000", building_number: "00230000", source: "dev_fixture", trusted_for_pdf: false }
          ];
        } else if (/候選|多筆|結果不明確/.test(addr)) {
          candidates = [
            { parcel_id: "0001-0000", address: addr, lot_number: "0001", building_number: "0000", source: "mock", trusted_for_pdf: false },
            { parcel_id: "0001-0001", address: addr, lot_number: "0001", building_number: "0001", source: "mock", trusted_for_pdf: false }
          ];
          discoveryStatus = "manual_required";
          errorCode = "mock_placeholder_untrusted";
          errorMessage = "\u672C\u6A5F mock placeholder \u4E0D\u53EF\u8996\u70BA\u53EF\u4FE1\u5730\u653F\u5019\u9078";
        } else if (/農地|土地|地號/.test(addr)) {
          candidates = [{ parcel_id: "0001-0000", address: addr, lot_number: "0001", building_number: "", source: "mock", trusted_for_pdf: false }];
          discoveryStatus = "manual_required";
          errorCode = "mock_placeholder_untrusted";
          errorMessage = "\u672C\u6A5F mock placeholder \u4E0D\u53EF\u8996\u70BA\u53EF\u4FE1\u5730\u653F\u5019\u9078";
        } else {
          candidates = [
            { parcel_id: "0001-0001", address: addr, lot_number: "0001", building_number: "0001", source: "mock", trusted_for_pdf: false }
          ];
          discoveryStatus = "manual_required";
          errorCode = "mock_placeholder_untrusted";
          errorMessage = "\u672C\u6A5F mock placeholder \u4E0D\u53EF\u8996\u70BA\u53EF\u4FE1\u5730\u653F\u5019\u9078";
        }
        this.registryQueryRuns.unshift(this.makeQueryRun({
          inputType: "address",
          sourceInput: addr,
          matchStatus: "candidate",
          candidateJson: {
            status: discoveryStatus,
            total_cost_cents: 0,
            candidates,
            errors: errorCode ? [{ source: "local_dev_discovery", code: errorCode, message: errorMessage }] : []
          },
          totalCostCents: 0,
          errorCode,
          errorMessage
        }));
        this.persistState();
        return candidates;
      }
      recordLocalAddressDiscovery(args) {
        const payload = toRecord(args);
        const address = pickString(payload, ["address"]) ?? "";
        const result = toRecord(payload.result);
        const status = pickString(result, ["status"]) ?? "manual_required";
        const candidates = Array.isArray(result.candidates) ? result.candidates : [];
        const errors = Array.isArray(result.errors) ? result.errors : [];
        const firstError = toRecord(errors[0]);
        const errorCode = pickString(firstError, ["code"]);
        const errorMessage = pickString(firstError, ["message"]);
        const run = this.makeQueryRun({
          inputType: "address",
          sourceInput: address,
          matchStatus: candidates.length > 0 ? "candidate" : "rejected",
          candidateJson: {
            ...result,
            status,
            candidates,
            errors,
            input_address: address,
            normalizedAddress: pickString(result, ["normalizedAddress"]) ?? address,
            total_cost_cents: 0
          },
          rawResponseJson: result,
          totalCostCents: 0,
          cacheHit: Boolean(result.cacheHit),
          sourceRunId: pickString(result, ["sourceRunId"]) ?? void 0,
          errorCode: errorCode ?? void 0,
          errorMessage: errorMessage ?? void 0
        });
        this.registryQueryRuns.unshift(run);
        this.persistState();
        return { success: true, run_id: run.id };
      }
      landRegistryParseR02ResultText(args) {
        const payload = toRecord(args);
        const inputAddress = pickString(payload, ["inputAddress", "input_address"]) ?? "";
        const text = normalizeR02Text(pickString(payload, ["textOrHtml", "text_or_html", "text"]) ?? "");
        const candidate = {
          administrative_district: extractR02Label(text, "\u884C\u653F\u5340"),
          land_office: extractR02Label(text, "\u5730\u653F\u4E8B\u52D9\u6240"),
          section_code: extractR02Label(text, "\u5730\u6BB5")?.split(/\s+/)[0] ?? null,
          section_name: extractR02Label(text, "\u5730\u6BB5")?.split(/\s+/).slice(1).join(" ") || null,
          land_no: extractR02Label(text, "\u5730\u865F"),
          building_no: extractR02Label(text, "\u5EFA\u865F")?.replace(/\D/g, "") || null,
          building_area_sqm: extractR02Label(text, "\u5EFA\u7269\u9762\u7A4D")?.replace("\u5E73\u65B9\u516C\u5C3A", "").trim() ?? null,
          total_floor_count: extractR02Label(text, "\u6A13\u5C64\u6578"),
          floor_label: extractR02Label(text, "\u6A13\u5C64\u5225"),
          completion_date_roc: extractR02Label(text, "\u5EFA\u7269\u5B8C\u6210\u65E5\u671F")?.split(/\s+/)[0] ?? null,
          age_years: extractR02Label(text, "\u5EFA\u7269\u5B8C\u6210\u65E5\u671F")?.match(/屋齡[^)）]*/)?.[0] ?? null,
          main_use: extractR02Label(text, "\u4E3B\u8981\u7528\u9014")
        };
        const missingFields = [
          candidate.section_code ? null : "section_code",
          candidate.section_name ? null : "section_name",
          candidate.building_no ? null : "building_no"
        ].filter((field) => Boolean(field));
        if (missingFields.length > 0) {
          throw new Error(`r02_required_fields_missing:${missingFields.join(",")}`);
        }
        return {
          adapter: "easymap_r02_desktop",
          parser_version: "r02-text-v1",
          input_address: inputAddress,
          status: "candidate_unconfirmed",
          total_cost_cents: 0,
          candidates: [candidate],
          raw_summary: text.slice(0, 1200),
          missing_fields: [],
          error_code: null,
          next_action: null
        };
      }
      landRegistryRecordR02ResultText(args) {
        const payload = toRecord(args);
        const caseId = pickString(payload, ["caseId", "case_id"]);
        const inputAddress = pickString(payload, ["inputAddress", "input_address"]) ?? "";
        try {
          const discovery = this.landRegistryParseR02ResultText(args);
          const candidate = discovery.candidates[0];
          const run = this.makeQueryRun({
            inputType: "address",
            sourceInput: inputAddress,
            matchStatus: "candidate",
            candidateJson: discovery,
            rawResponseJson: discovery,
            totalCostCents: 0,
            caseId
          });
          this.registryQueryRuns.unshift(run);
          this.persistState();
          return { run_id: run.id, ok: true, discovery, error: null };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const missingFields = message.startsWith("r02_required_fields_missing:") ? message.split(":")[1]?.split(",").filter(Boolean) ?? [] : [];
          const errorSummary = {
            adapter: "easymap_r02_desktop",
            parserVersion: "r02-text-v1",
            errorCode: "r02_required_fields_missing",
            missingFields,
            nextAction: "manual_registry_key_required"
          };
          const run = this.makeQueryRun({
            inputType: "address",
            sourceInput: inputAddress,
            matchStatus: "candidate",
            totalCostCents: 0,
            caseId,
            errorCode: "r02_required_fields_missing",
            errorMessage: message,
            rawResponseJson: errorSummary
          });
          this.registryQueryRuns.unshift(run);
          this.persistState();
          return { run_id: run.id, ok: false, discovery: null, error: errorSummary };
        }
      }
      landRegistryPullData(args) {
        const payload = toRecord(args);
        const apiIds = args?.apiIds || [];
        const caseId = pickString(payload, ["caseId", "case_id"]);
        const confirmed = caseId ? this.registryMatchByCase.get(caseId) : null;
        const caseRow = caseId ? this.cases.get(caseId) : void 0;
        const confirmedBuildingNo = confirmed?.building_no ?? pickString(payload, ["buildingNo", "building_no"]);
        const results = {};
        const mockDataMap = {
          land_registry: { area: 125.8, purpose: "\u7530", lot_number: "0456-0000" },
          co_owners: {
            owner_name: "",
            registration_date: "2015-08-20",
            registration_reason: "\u8CB7\u8CE3",
            denominator: 1,
            numerator: 1
          },
          zoning: { zoning_type: "\u4F4F\u5B85\u5340", usage_category: "\u7532\u7A2E\u5EFA\u7BC9\u7528\u5730" },
          land_value: { announced_value: 58e3, assessed_value: 42e3 },
          mortgages: [{ creditor: "\u53F0\u7063\u9280\u884C", amount: 3e6 }],
          building_other_rights: {
            rights: [
              {
                creditor: "\u53F0\u7063\u9280\u884C",
                amount: 3e6,
                right_type: "\u62B5\u62BC\u6B0A",
                collateral_building_numbers: ["\u5927\u5B89\u6BB5\u4E00\u5C0F\u6BB5-778-2"]
              }
            ],
            raw_rows: []
          },
          building_registry: {
            area: 85.5,
            building_area: 85.5,
            purpose: "\u4F4F\u5BB6\u7528",
            building_purpose: "\u4F4F\u5BB6\u7528",
            construction_date: "2015-06-15",
            building_number: "\u5EFA\u865F 778-2",
            building_floor: "013\u5C64",
            main_building_area: 62.4,
            auxiliary_area: 8.1,
            common_area: 15,
            parking_area: 0,
            material: "\u92FC\u7B4B\u6DF7\u51DD\u571F\u9020",
            address: "\u53F0\u5317\u5E02\u5927\u5B89\u5340\u548C\u5E73\u6771\u8DEF\u4E00\u6BB5 100 \u865F\u4E94\u6A13\u4E4B\u4E09"
          },
          building_ownership: {
            owner_name: "",
            certificate_no: "\u5317\u677E\u5B57\u7B2C012345\u865F",
            ownership_date: "2015-08-20",
            registration_reason: "\u8CB7\u8CE3",
            denominator: 1,
            numerator: 1
          }
        };
        if (confirmedBuildingNo === "00204000") {
          mockDataMap.building_registry = {
            area: 83.61,
            building_area: 83.61,
            purpose: "\u4F4F\u5BB6\u7528",
            building_purpose: "\u4F4F\u5BB6\u7528",
            construction_date: "0800829",
            building_number: "00204000",
            building_floor: "\u516B\u5C64",
            total_floor_count: "012",
            address: caseRow?.address ?? "\u53F0\u5357\u5E02\u6771\u5340\u88D5\u8FB2\u8DEF288\u5DF717\u865F8\u6A13\u4E4B1"
          };
          mockDataMap.building_ownership = {
            owner_name: caseRow?.owner_name ?? "",
            certificate_no: "",
            ownership_date: "",
            registration_reason: "",
            denominator: 1,
            numerator: 1
          };
        }
        if (confirmedBuildingNo === "00084000" || confirmedBuildingNo === "03045000") {
          mockDataMap.building_registry = {
            area: 128.2,
            building_area: 128.2,
            purpose: "\u4F4F\u5546\u7528",
            building_purpose: "\u4F4F\u5546\u7528",
            construction_date: "0710804",
            building_number: confirmedBuildingNo,
            building_floor: "\u4E00\u5C64\uFF0C\u4E8C\u5C64\uFF0C\u4E09\u5C64\uFF0C\u9A0E\u6A13\uFF0C\u96FB\u68AF\u6A13\u68AF\u9593",
            total_floor_count: "003",
            address: caseRow?.address ?? "\u53F0\u5357\u5E02\u6771\u5340\u6771\u548C\u8DEF47\u865F3\u6A13"
          };
          mockDataMap.building_ownership = {
            owner_name: caseRow?.owner_name ?? "",
            certificate_no: "",
            ownership_date: "",
            registration_reason: "",
            denominator: 1,
            numerator: 1
          };
        }
        let totalCost = 0;
        for (const apiId of apiIds) {
          results[apiId] = {
            success: true,
            data: mockDataMap[apiId] ?? { source_api: apiId },
            source: "mock"
          };
          totalCost += 10;
        }
        return { results, total_cost: totalCost };
      }
      landRegistryFormalPullData(args) {
        const payload = toRecord(args);
        const caseId = pickString(payload, ["caseId", "case_id"]);
        const confirmed = caseId ? this.registryMatchByCase.get(caseId) : null;
        if (!caseId || !confirmed) {
          throw new Error("registry_match_required");
        }
        const confirmedCaseId = caseId;
        const apiIds = Array.isArray(payload.apiIds) ? payload.apiIds : [];
        if (this.trialState.status !== "active") {
          throw new Error("trial_expired");
        }
        const cacheKey = `${this.organizationId}:${confirmed.section_name}:${confirmed.land_no}:${confirmed.building_no ?? "land-only"}:${apiIds.join(",")}`;
        if (!this.appSettings.landApi.clientId.trim() || !this.appSettings.landApi.secret.trim()) {
          const run2 = this.makeQueryRun({
            inputType: "registry_key",
            sourceInput: cacheKey,
            matchStatus: "confirmed",
            candidateJson: { selected_api_set: apiIds },
            totalCostCents: 0,
            caseId,
            errorCode: "cop_credential_required",
            errorMessage: "\u8ACB\u5148\u5728\u8A2D\u5B9A\u9801\u5B8C\u6210\u5730\u653F\u67E5\u8A62\u5E33\u865F\u8A2D\u5B9A"
          });
          this.registryQueryRuns.unshift(run2);
          this.persistState();
          throw new Error("cop_credential_required");
        }
        if (!confirmed.building_no && apiIds.some(isBuildingFormalApi)) {
          throw new Error("registry_match_required");
        }
        const cachedRunId = this.registryQueryCache.get(cacheKey);
        if (cachedRunId) {
          const run2 = this.makeQueryRun({
            inputType: "registry_key",
            sourceInput: cacheKey,
            matchStatus: "confirmed",
            candidateJson: { cache: "hit" },
            totalCostCents: 0,
            cacheHit: true,
            sourceRunId: cachedRunId,
            caseId
          });
          this.registryQueryRuns.unshift(run2);
          this.persistState();
          return { run_id: run2.id, results: {}, total_cost: 0, cache_hit: true, source_run_id: cachedRunId };
        }
        const pulled = this.landRegistryPullData({ ...payload, apiIds });
        const formalResults = Object.fromEntries(
          Object.entries(pulled.results).map(([apiId, result]) => {
            const row = toRecord(result);
            return [
              apiId,
              {
                ...row,
                source: row.success === false ? row.source ?? "api" : "api"
              }
            ];
          })
        );
        const nowIso = (/* @__PURE__ */ new Date()).toISOString();
        const apiCalls = apiIds.map((apiId, index) => ({
          id: makeUuid(),
          service_code: apiId,
          transaction_id: `tx-${Date.now()}-${index + 1}`,
          http_status: 200,
          moi_code: null,
          moi_message: "OK",
          return_rows: 1,
          cost_cents: 1e3,
          started_at: nowIso,
          finished_at: nowIso
        }));
        const run = this.makeQueryRun({
          inputType: "registry_key",
          sourceInput: cacheKey,
          matchStatus: "confirmed",
          copResponseJson: formalResults,
          rawResponseJson: formalResults,
          totalCostCents: pulled.total_cost * 100,
          caseId: confirmedCaseId,
          apiCalls
        });
        this.registryQueryRuns.unshift(run);
        this.registryQueryCache.set(cacheKey, run.id);
        const existing = this.cases.get(confirmedCaseId);
        if (existing) {
          const next = {
            ...existing,
            land_registry_data: {
              ...existing.land_registry_data ?? {},
              formal_registry_run_id: run.id,
              formal_registry_json: formalResults,
              confirmed_registry_match: {
                office_code: confirmed.office_code,
                section_code: confirmed.section_code,
                section_name: confirmed.section_name,
                land_no: confirmed.land_no,
                building_no: confirmed.building_no,
                registry_key: confirmed.registry_key,
                status: "confirmed"
              }
            },
            updated_at: unixNow()
          };
          this.cases.set(confirmedCaseId, next);
        }
        this.persistState();
        return { run_id: run.id, results: formalResults, total_cost: pulled.total_cost, cache_hit: false, source_run_id: null };
      }
      landRegistryPaidAddressResolver(args) {
        const address = pickString(toRecord(args), ["address"]) ?? "";
        if (!address.trim()) throw new Error("resolver_address_required");
        if (!this.appSettings.landApi.clientId.trim() || !this.appSettings.landApi.secret.trim()) {
          throw new Error("cop_credential_required");
        }
        const candidates = [
          {
            parcel_id: "resolver:1556:00700000:00165000",
            address,
            lot_number: "00700000",
            building_number: "00165000",
            section_name: "\u5BCC\u5F37\u6BB5",
            section_code: "1556",
            source: "cop_moi",
            trusted_for_pdf: false,
            discovery_confidence: "needs_selection",
            confirmation_state: "unconfirmed"
          },
          {
            parcel_id: "resolver:1556:00700000:00167000",
            address,
            lot_number: "00700000",
            building_number: "00167000",
            section_name: "\u5BCC\u5F37\u6BB5",
            section_code: "1556",
            source: "cop_moi",
            trusted_for_pdf: false,
            discovery_confidence: "needs_selection",
            confirmation_state: "unconfirmed"
          }
        ];
        const nowIso = (/* @__PURE__ */ new Date()).toISOString();
        const apiCall = {
          id: makeUuid(),
          service_code: "MOI_API_037",
          transaction_id: `tx-resolver-${Date.now()}`,
          http_status: 200,
          moi_code: null,
          moi_message: "OK",
          return_rows: candidates.length,
          cost_cents: 3e3,
          started_at: nowIso,
          finished_at: nowIso
        };
        const run = this.makeQueryRun({
          inputType: "address",
          sourceInput: address,
          matchStatus: "candidate",
          candidateJson: {
            run_type: "paid_address_resolver",
            status: "candidate_unconfirmed",
            candidates,
            total_cost_cents: 3e3
          },
          rawResponseJson: {
            run_type: "paid_address_resolver",
            candidates
          },
          totalCostCents: 3e3,
          apiCalls: [apiCall]
        });
        this.registryQueryRuns.unshift(run);
        this.persistState();
        return {
          run_id: run.id,
          candidates,
          total_cost: 30,
          total_cost_cents: 3e3,
          cache_hit: false,
          source_run_id: null
        };
      }
      queryRealPrice(args) {
        const district = String(args?.district ?? "");
        const keyword = String(args?.keyword ?? "");
        const normalizedQuery = `${district} ${keyword}`.replace(/台/g, "\u81FA");
        if (normalizedQuery.includes("\u81FA\u5317") || normalizedQuery.includes("\u5927\u5B89")) {
          return [
            {
              address: "\u81FA\u5317\u5E02\u5927\u5B89\u5340\u548C\u5E73\u6771\u8DEF\u4E00\u6BB5 88 \u865F",
              total_price: 428e5,
              area: 36.2,
              unit_price: 1182320,
              date: "2025-10-12",
              type: "\u5927\u6A13"
            },
            {
              address: "\u81FA\u5317\u5E02\u5927\u5B89\u5340\u548C\u5E73\u6771\u8DEF\u4E8C\u6BB5 66 \u865F",
              total_price: 516e5,
              area: 42.8,
              unit_price: 1205607,
              date: "2025-12-08",
              type: "\u5927\u6A13"
            },
            {
              address: "\u81FA\u5317\u5E02\u5927\u5B89\u5340\u65B0\u751F\u5357\u8DEF\u4E8C\u6BB5 15 \u865F",
              total_price: 398e5,
              area: 33.5,
              unit_price: 1188060,
              date: "2026-01-22",
              type: "\u5927\u6A13"
            }
          ];
        }
        if (!normalizedQuery.includes("\u81FA\u5357") && !normalizedQuery.includes("\u88D5\u8FB2")) {
          return [];
        }
        if (normalizedQuery.includes("\u6C38\u5EB7") || normalizedQuery.includes("\u52DD\u5229")) {
          return [
            {
              address: "\u53F0\u5357\u5E02\u6C38\u5EB7\u5340\u52DD\u5229\u885758\u5DF76\u865F",
              total_price: 118e5,
              area: 30.2,
              unit_price: 390728,
              date: "2024-02-18",
              type: "\u83EF\u5EC8"
            },
            {
              address: "\u53F0\u5357\u5E02\u6C38\u5EB7\u5340\u52DD\u5229\u885776\u5DF712\u865F4\u6A13",
              total_price: 93e5,
              area: 25.1,
              unit_price: 370518,
              date: "2023-12-06",
              type: "\u516C\u5BD3"
            },
            {
              address: "\u53F0\u5357\u5E02\u6C38\u5EB7\u5340\u4E2D\u83EF\u4E00\u8DEF39\u5DF78\u865F",
              total_price: 146e5,
              area: 39.6,
              unit_price: 368687,
              date: "2024-04-11",
              type: "\u5927\u6A13"
            }
          ];
        }
        return [
          {
            address: "\u53F0\u5357\u5E02\u6771\u5340\u88D5\u8FB2\u8DEF123\u865F",
            total_price: 128e5,
            area: 32.5,
            unit_price: 393846,
            date: "2024-01-15",
            type: "\u5927\u6A13"
          },
          {
            address: "\u53F0\u5357\u5E02\u6771\u5340\u88D5\u8FB2\u8DEF456\u865F5\u6A13",
            total_price: 95e5,
            area: 24.8,
            unit_price: 383065,
            date: "2023-11-20",
            type: "\u5927\u6A13"
          },
          {
            address: "\u53F0\u5357\u5E02\u6771\u5340\u88D5\u8FB2\u8DEF789\u865F3\u6A13\u4E4B2",
            total_price: 152e5,
            area: 42.1,
            unit_price: 361045,
            date: "2024-03-08",
            type: "\u5927\u6A13"
          }
        ];
      }
      landRegistrySetApiKey(args) {
        const payload = toRecord(args);
        const clientId = payload.clientId ?? payload.client_id;
        const clientSecret = payload.clientSecret ?? payload.client_secret ?? payload.secret;
        if (typeof clientId === "string") {
          this.appSettings.landApi.clientId = clientId;
        }
        if (typeof clientSecret === "string") {
          this.appSettings.landApi.secret = clientSecret;
        }
        return void 0;
      }
      landRegistryGetApiKey() {
        const { clientId, secret } = this.appSettings.landApi;
        return {
          client_id_masked: "****" + (clientId?.slice(-4) || ""),
          has_secret: secret !== ""
        };
      }
      async landRegistryTestConnection() {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { success: true, message: "\u9023\u7DDA\u6210\u529F" };
      }
      landRegistryGetBalance() {
        const entries = this.landRegistryListBillingEntries();
        return {
          month_total_cost: entries.reduce((sum, entry) => sum + entry.cost, 0),
          month_query_count: entries.length,
          low_balance_warning: false
        };
      }
      landRegistryListBillingEntries() {
        const fromRuns = this.registryQueryRuns.flatMap(
          (run) => run.api_calls.map((call) => ({
            run_id: run.id,
            object_type: inferBillingObjectType(run, call.service_code),
            object_type_label: formatBillingObjectType(inferBillingObjectType(run, call.service_code)),
            service_name: call.service_code,
            target: run.case_id ? `${run.case_id} / ${run.source_input}` : run.source_input,
            status_label: call.http_status >= 400 ? "\u67E5\u8A62\u5931\u6557" : "\u67E5\u8A62\u6210\u529F",
            transaction_id: call.transaction_id ?? "N/A",
            cost: Math.round(call.cost_cents / 100),
            charged_at: call.finished_at
          }))
        );
        if (fromRuns.length > 0) return fromRuns;
        return [
          {
            run_id: "demo-building-run",
            object_type: "building",
            object_type_label: "\u6236\u5EFA",
            service_name: "\u5EFA\u7269\u6240\u6709\u6B0A\u8CC7\u6599",
            target: "AIRE-2026-001 / \u5EFA\u865F 88-1",
            status_label: "\u67E5\u8A62\u6210\u529F",
            transaction_id: "08d28190-1640-4673-9371-f8691d48c5bb",
            cost: 27,
            charged_at: "2026-05-18T22:52:20+08:00"
          },
          {
            run_id: "demo-address-run",
            object_type: "address",
            object_type_label: "\u9580\u724C",
            service_name: "\u9580\u724C\u5EFA\u865F\u67E5\u8A62",
            target: "AIRE-2026-001 / \u53F0\u5357\u5E02\u6C38\u5EB7\u5340\u52DD\u5229\u885758\u5DF74\u865F1\u6A13",
            status_label: "\u67E5\u8A62\u5931\u6557",
            transaction_id: "COP309",
            cost: 0,
            charged_at: "2026-05-18T22:52:20+08:00"
          },
          {
            run_id: "demo-billing-run",
            object_type: "unknown",
            object_type_label: "\u5E33\u52D9",
            service_name: "\u5E33\u52D9\u67E5\u8A62",
            target: "\u5730\u653F\u5E33\u865F",
            status_label: "\u514D\u8CBB",
            transaction_id: "BALANCE-SYNC",
            cost: 0,
            charged_at: "2026-05-18T22:52:20+08:00"
          }
        ];
      }
      landRegistryRecordConsent(args) {
        const payload = toRecord(args);
        const caseId = pickString(payload, ["caseId", "case_id"]);
        if (caseId) {
          this.consentedCases.add(caseId);
        }
        return void 0;
      }
      listRegistryQueryRuns(args) {
        const payload = toRecord(args);
        const keyword = pickString(payload, ["keyword"])?.toLowerCase() ?? "";
        return this.registryQueryRuns.filter((run) => run.organization_id === this.organizationId).filter((run) => keyword ? JSON.stringify(run).toLowerCase().includes(keyword) : true).map((run) => ({ ...run, api_calls: run.api_calls.map((call) => ({ ...call })) }));
      }
      getRegistryQueryRunDetail(args) {
        const payload = toRecord(args);
        const runId = pickString(payload, ["runId", "run_id", "id"]);
        if (!runId) throw new Error("run_id_required");
        const run = this.registryQueryRuns.find(
          (item) => item.id === runId && item.organization_id === this.organizationId
        );
        if (!run) throw new Error("run_not_found");
        return { ...run, api_calls: run.api_calls.map((call) => ({ ...call })) };
      }
      syncRegistryQueryRunToSaas(args) {
        const payload = toRecord(args);
        const runId = pickString(payload, ["runId", "run_id", "id"]);
        if (!runId) throw new Error("run_id_required");
        const run = this.registryQueryRuns.find((item) => item.id === runId);
        if (!run) throw new Error("run_not_found");
        return { synced: true, remote_run_id: `mock-remote-${run.id}` };
      }
      confirmCaseRegistryMatch(args) {
        const payload = toRecord(args);
        const caseId = pickString(payload, ["caseId", "case_id"]);
        const officeCode = pickString(payload, ["officeCode", "office_code"]);
        const sectionCode = pickString(payload, ["sectionCode", "section_code"]);
        const sectionName = pickString(payload, ["sectionName", "section_name"]);
        const landNo = pickString(payload, ["landNo", "land_no"]);
        const buildingNo = pickString(payload, ["buildingNo", "building_no"]);
        const registryKey = pickString(payload, ["registryKey", "registry_key"]);
        if (!caseId || !sectionName || !landNo) throw new Error("registry_match_required");
        const match = {
          case_id: caseId,
          office_code: officeCode,
          section_code: sectionCode,
          section_name: sectionName,
          land_no: landNo,
          building_no: buildingNo,
          registry_key: registryKey,
          confirmed_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        this.registryMatchByCase.set(caseId, match);
        const existing = this.cases.get(caseId);
        if (existing) {
          this.cases.set(caseId, {
            ...existing,
            land_registry_data: {
              ...existing.land_registry_data ?? {},
              confirmed_registry_match: {
                office_code: officeCode,
                section_code: sectionCode,
                section_name: sectionName,
                land_no: landNo,
                building_no: buildingNo ?? null,
                registry_key: registryKey,
                status: "confirmed"
              }
            },
            updated_at: unixNow()
          });
        }
        this.persistState();
        return { success: true, match };
      }
      getTrialStatus() {
        return { ...this.trialState };
      }
      setTrialStatus(args) {
        const payload = toRecord(args);
        const status = pickString(payload, ["status"]);
        const plan = pickString(payload, ["plan"]);
        if (status && (status === "active" || status === "expired" || status === "disabled")) {
          this.trialState.status = status;
        }
        if (plan && (plan === "trial" || plan === "basic" || plan === "pro" || plan === "vip")) {
          this.trialState.plan = plan;
        }
        const startedAt = pickString(payload, ["startedAt", "started_at"]);
        const endsAt = pickString(payload, ["endsAt", "ends_at"]);
        if (startedAt !== null) this.trialState.startedAt = startedAt;
        if (endsAt !== null) this.trialState.endsAt = endsAt;
        return { success: true, trial: { ...this.trialState } };
      }
      makeQueryRun(input) {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        return {
          id: makeUuid(),
          organization_id: this.organizationId,
          case_id: input.caseId ?? null,
          input_type: input.inputType,
          source_input: input.sourceInput,
          match_status: input.matchStatus,
          candidate_json: input.candidateJson ?? null,
          cop_response_json: input.copResponseJson ?? null,
          raw_response_json: input.rawResponseJson ?? null,
          total_cost_cents: input.totalCostCents,
          cache_hit: input.cacheHit ?? false,
          source_run_id: input.sourceRunId ?? null,
          error_code: input.errorCode ?? null,
          error_message: input.errorMessage ?? null,
          api_calls: input.apiCalls ?? [],
          created_at: now,
          updated_at: now
        };
      }
      uploadFloorPlanSketch(args) {
        const caseId = String(args?.case_id ?? "");
        const existingCount = this.floorPlanSketches.filter((s) => s.case_id === caseId).length;
        const version = existingCount + 1;
        const now = Date.now();
        const iso = (/* @__PURE__ */ new Date()).toISOString();
        const sketch = {
          id: `sketch-${now}`,
          case_id: caseId,
          original_asset_id: `asset-${now}`,
          original_sha256: "mock-sha256",
          source_type: "field_sketch",
          version,
          uploaded_at: iso,
          uploaded_by: null,
          upload_note: null,
          created_at: iso,
          updated_at: iso
        };
        this.floorPlanSketches.push(sketch);
        return sketch;
      }
      importCaseAsset(args) {
        const payload = toRecord(toRecord(args).payload);
        const caseId = pickString(payload, ["case_id"]) ?? "";
        const kind = pickString(payload, ["kind"]) ?? "floor_plan";
        const source = pickString(payload, ["source"]) ?? "manual_upload";
        const mime = pickString(payload, ["mime_type"]) ?? "";
        const fileBytes = Array.isArray(payload.file_bytes) ? payload.file_bytes.filter((n) => typeof n === "number") : [];
        if (!CASE_ASSET_KINDS.includes(kind)) throw new Error("unsupported_kind");
        if (!CASE_ASSET_SOURCES.includes(source)) throw new Error("unsupported_source");
        if (mime !== "image/png" && mime !== "image/jpeg" && mime !== "image/webp") {
          throw new Error("unsupported_mime");
        }
        if (fileBytes.length === 0) throw new Error("empty_file");
        if (fileBytes.length > 10 * 1024 * 1024) throw new Error("file_too_large");
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const id = `case-asset-${Date.now()}`;
        this.caseAssets = this.caseAssets.map(
          (asset2) => asset2.case_id === caseId && asset2.kind === kind ? { ...asset2, is_primary: false, updated_at: now } : asset2
        );
        const normalizedSource = source;
        const asset = {
          id,
          case_id: caseId,
          kind,
          source: normalizedSource,
          trust_tier: normalizedSource === "legacy_floor_plan_photo" ? "legacy_import" : normalizedSource === "auto_generated" || normalizedSource === "api_generated" ? "system_generated" : "assistant_uploaded",
          review_status: "approved",
          is_primary: true,
          file_name: pickString(payload, ["file_name"]) ?? "floor-plan.png",
          mime_type: mime,
          size_bytes: fileBytes.length,
          storage_path: `/mock/case-assets/${caseId}/${id}`,
          metadata_json: pickString(payload, ["metadata_json"]) ?? "{}",
          created_at: now,
          updated_at: now
        };
        this.caseAssets.push(asset);
        this.caseAssetBytes.set(id, fileBytes);
        return { ...asset };
      }
      listCaseAssets(args) {
        const payload = toRecord(args);
        const caseId = pickString(payload, ["case_id"]) ?? "";
        const kind = pickString(payload, ["kind"]);
        return this.caseAssets.filter((asset) => asset.case_id === caseId && (!kind || asset.kind === kind)).sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || b.updated_at.localeCompare(a.updated_at)).map((asset) => ({ ...asset }));
      }
      readCaseAssetBytes(args) {
        const assetId = pickString(toRecord(args), ["asset_id"]) ?? "";
        const asset = this.caseAssets.find((item) => item.id === assetId);
        const bytes = this.caseAssetBytes.get(assetId);
        if (!asset || !bytes) throw new Error("asset_file_missing");
        return { bytes: [...bytes], mime: asset.mime_type };
      }
      deleteCaseAsset(args) {
        const assetId = pickString(toRecord(args), ["asset_id"]) ?? "";
        this.caseAssets = this.caseAssets.filter((asset) => asset.id !== assetId);
        this.caseAssetBytes.delete(assetId);
        return { ok: true };
      }
      listFloorPlanConversionHistory(args) {
        const caseId = String(args?.case_id ?? "");
        return {
          sketches: this.floorPlanSketches.filter((s) => s.case_id === caseId),
          conversions: this.floorPlanConversions.filter((c) => c.case_id === caseId)
        };
      }
      restorePersistedState() {
        const storage = getBrowserLocalStorage();
        if (!storage) {
          return;
        }
        try {
          const raw = storage.getItem(MOCK_STORAGE_KEY);
          if (!raw) {
            return;
          }
          const parsed = JSON.parse(raw);
          const persistedLicense = parsed.license;
          const persistedSession = parsed.sessionUser;
          const persistedSettings = parsed.appSettings;
          const persistedCases = parsed.cases;
          const persistedTrial = parsed.trialState;
          if (persistedLicense && (persistedLicense.status === "none" || persistedLicense.status === "valid" || persistedLicense.status === "expired")) {
            this.license = {
              status: persistedLicense.status,
              serialKey: typeof persistedLicense.serialKey === "string" ? persistedLicense.serialKey : null
            };
          }
          if (persistedSession && typeof persistedSession.email === "string" && (persistedSession.role === "admin" || persistedSession.role === "user")) {
            this.sessionUser = {
              email: persistedSession.email,
              role: persistedSession.role
            };
          }
          if (parsed.deviceSession && typeof parsed.deviceSession === "object") {
            const ds = toRecord(parsed.deviceSession);
            const status = pickString(ds, ["status"]);
            this.deviceSession = {
              status: status === "active" ? "active" : "missing",
              email: pickString(ds, ["email"]),
              persistedAt: pickString(ds, ["persistedAt", "persisted_at"])
            };
          }
          if (persistedSettings) {
            const landApi = toRecord(persistedSettings.landApi);
            this.appSettings = {
              landApi: {
                clientId: readString(landApi.clientId) ?? "",
                secret: readString(landApi.secret) ?? ""
              },
              premium: {
                subscribed: Boolean(toRecord(persistedSettings.premium).subscribed),
                plan: readString(toRecord(persistedSettings.premium).plan),
                expiresAt: readString(toRecord(persistedSettings.premium).expiresAt) ?? readString(toRecord(persistedSettings.premium).expires_at)
              },
              premiumUnlocked: Boolean(persistedSettings.premiumUnlocked)
            };
          }
          if (Array.isArray(parsed.featureFlags)) {
            const persistedFeatureFlags = parsed.featureFlags.filter(
              (flag) => Boolean(flag) && typeof flag.id === "string" && typeof flag.name === "string" && typeof flag.enabled === "boolean"
            ).map((flag) => ({ ...flag }));
            const persistedById = new Map(persistedFeatureFlags.map((flag) => [flag.id, flag]));
            this.featureFlags = DEFAULT_FEATURE_FLAGS.map((defaultFlag) => ({
              ...defaultFlag,
              enabled: persistedById.get(defaultFlag.id)?.enabled ?? defaultFlag.enabled
            }));
          }
          if (parsed.profileSettings && typeof parsed.profileSettings === "object") {
            const profile = toRecord(parsed.profileSettings);
            this.profileSettings = {
              ...DEFAULT_PROFILE_SETTINGS,
              name: typeof profile.name === "string" ? profile.name : DEFAULT_PROFILE_SETTINGS.name,
              email: typeof profile.email === "string" ? profile.email : DEFAULT_PROFILE_SETTINGS.email,
              brandColor: typeof profile.brandColor === "string" ? profile.brandColor : DEFAULT_PROFILE_SETTINGS.brandColor,
              logoName: typeof profile.logoName === "string" ? profile.logoName : DEFAULT_PROFILE_SETTINGS.logoName,
              passwordUpdatedAt: typeof profile.passwordUpdatedAt === "string" ? profile.passwordUpdatedAt : null
            };
          }
          if (parsed.logo && typeof parsed.logo === "object") {
            const logo = toRecord(parsed.logo);
            const bytesRaw = logo.bytes;
            const bytes = Array.isArray(bytesRaw) ? bytesRaw.filter((value) => typeof value === "number") : [];
            const mime = pickString(logo, ["mime"]);
            if (bytes.length > 0 && mime) {
              this.logo = {
                bytes,
                mime,
                filename: pickString(logo, ["filename", "fileName"]) ?? void 0,
                uploadedAt: pickString(logo, ["uploadedAt", "uploaded_at"]) ?? void 0
              };
            }
          }
          if (parsed.workbenchSupplements && typeof parsed.workbenchSupplements === "object") {
            this.workbenchSupplements = new Map(
              Object.entries(parsed.workbenchSupplements).map(([caseId, raw2]) => {
                const row = toRecord(raw2);
                if (typeof caseId !== "string" || !caseId) return null;
                const fieldVisitAnswers = Array.isArray(row.fieldVisitAnswers) ? row.fieldVisitAnswers.map((answerRaw) => {
                  const answer = toRecord(answerRaw);
                  const topic = readString(answer.topic);
                  if (!topic) return null;
                  return {
                    topic,
                    answer: typeof answer.answer === "string" ? answer.answer : "",
                    status: typeof answer.status === "string" ? answer.status : "\u5F85\u78BA\u8A8D",
                    updatedAt: typeof answer.updatedAt === "string" ? answer.updatedAt : (/* @__PURE__ */ new Date()).toISOString()
                  };
                }).filter((answer) => Boolean(answer)) : [];
                const uploads = Array.isArray(row.uploads) ? row.uploads.map((uploadRaw) => {
                  const upload = toRecord(uploadRaw);
                  const slot = readString(upload.slot);
                  if (!slot) return null;
                  return {
                    slot,
                    fileName: typeof upload.fileName === "string" ? upload.fileName : "",
                    savedAt: typeof upload.savedAt === "string" ? upload.savedAt : (/* @__PURE__ */ new Date()).toISOString()
                  };
                }).filter((upload) => Boolean(upload)) : [];
                const registrySupplements = Array.isArray(row.registrySupplements) ? row.registrySupplements.map((supplementRaw) => {
                  const supplement = toRecord(supplementRaw);
                  const fieldName = readString(supplement.fieldName) ?? readString(supplement.field_name);
                  if (!fieldName) return null;
                  return {
                    fieldName,
                    value: typeof supplement.value === "string" ? supplement.value : "",
                    source: typeof supplement.source === "string" ? supplement.source : "\u5C4B\u4E3B\u63D0\u4F9B",
                    status: typeof supplement.status === "string" ? supplement.status : "\u5F85\u78BA\u8A8D",
                    updatedAt: typeof supplement.updatedAt === "string" ? supplement.updatedAt : (/* @__PURE__ */ new Date()).toISOString()
                  };
                }).filter(
                  (supplement) => Boolean(supplement)
                ) : [];
                return [
                  caseId,
                  {
                    caseId,
                    registrySupplements,
                    fieldVisitAnswers,
                    uploads,
                    supplementAdded: Boolean(row.supplementAdded),
                    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : null
                  }
                ];
              }).filter((entry) => Boolean(entry))
            );
          }
          if (Array.isArray(persistedCases)) {
            this.cases = new Map(
              persistedCases.filter((row) => Boolean(row) && typeof row.id === "string").map((row) => [row.id, { ...row }])
            );
          }
          if (persistedTrial && (persistedTrial.plan === "trial" || persistedTrial.plan === "basic" || persistedTrial.plan === "pro" || persistedTrial.plan === "vip") && (persistedTrial.status === "active" || persistedTrial.status === "expired" || persistedTrial.status === "disabled")) {
            this.trialState = { ...persistedTrial };
          }
          if (Array.isArray(parsed.registryQueryRuns)) {
            this.registryQueryRuns = parsed.registryQueryRuns.map((run) => ({
              ...run,
              api_calls: Array.isArray(run.api_calls) ? run.api_calls.map((call) => ({ ...call })) : []
            }));
          }
          if (parsed.registryQueryCache && typeof parsed.registryQueryCache === "object") {
            this.registryQueryCache = new Map(
              Object.entries(parsed.registryQueryCache).filter(
                (entry) => typeof entry[0] === "string" && typeof entry[1] === "string"
              )
            );
          }
          if (parsed.registryMatchByCase && typeof parsed.registryMatchByCase === "object") {
            this.registryMatchByCase = new Map(
              Object.entries(parsed.registryMatchByCase).filter(
                (entry) => typeof entry[0] === "string" && typeof entry[1] === "object" && entry[1] !== null
              )
            );
          }
          if (Array.isArray(parsed.caseAssets)) {
            this.caseAssets = parsed.caseAssets.filter((asset) => Boolean(asset) && typeof asset.id === "string").map((asset) => ({ ...asset }));
          }
          if (parsed.caseAssetBytes && typeof parsed.caseAssetBytes === "object") {
            this.caseAssetBytes = new Map(
              Object.entries(parsed.caseAssetBytes).filter(
                (entry) => typeof entry[0] === "string" && Array.isArray(entry[1])
              )
            );
          }
        } catch {
          this.cases = new Map(SEED_CASES.map((row) => [row.id, { ...row }]));
          getBrowserLocalStorage()?.removeItem(MOCK_STORAGE_KEY);
          console.warn("[mock-backend] localStorage parse error, cleared and using SEED_CASES");
        }
      }
      persistState() {
        const storage = getBrowserLocalStorage();
        if (!storage) {
          return;
        }
        let existingExtra = {};
        try {
          const existing = storage.getItem(MOCK_STORAGE_KEY);
          if (existing) {
            const parsed = JSON.parse(existing);
            const { disclosures, keyin_data, branding } = parsed;
            if (disclosures !== void 0) existingExtra.disclosures = disclosures;
            if (keyin_data !== void 0) existingExtra.keyin_data = keyin_data;
            if (branding !== void 0) existingExtra.branding = branding;
          }
        } catch {
        }
        const snapshot = {
          license: { ...this.license },
          sessionUser: this.sessionUser ? { ...this.sessionUser } : null,
          deviceSession: { ...this.deviceSession },
          appSettings: {
            landApi: {
              clientId: this.appSettings.landApi.clientId,
              secret: this.appSettings.landApi.secret
            },
            premium: {
              subscribed: this.appSettings.premium.subscribed,
              plan: this.appSettings.premium.plan,
              expiresAt: this.appSettings.premium.expiresAt
            },
            premiumUnlocked: this.appSettings.premiumUnlocked
          },
          featureFlags: this.featureFlags.map((flag) => ({ ...flag })),
          profileSettings: { ...this.profileSettings },
          logo: this.logo ? { ...this.logo } : null,
          workbenchSupplements: Object.fromEntries(
            [...this.workbenchSupplements.entries()].map(([caseId, draft]) => [
              caseId,
              this.cloneWorkbenchSupplement(draft)
            ])
          ),
          cases: [...this.cases.values()].map((row) => ({ ...row })),
          caseAssets: this.caseAssets.map((asset) => ({ ...asset })),
          caseAssetBytes: Object.fromEntries(this.caseAssetBytes.entries()),
          trialState: { ...this.trialState },
          registryQueryRuns: this.registryQueryRuns.map((run) => ({
            ...run,
            api_calls: run.api_calls.map((call) => ({ ...call }))
          })),
          registryQueryCache: Object.fromEntries(this.registryQueryCache.entries()),
          registryMatchByCase: Object.fromEntries(this.registryMatchByCase.entries())
        };
        try {
          storage.setItem(MOCK_STORAGE_KEY, JSON.stringify({ ...existingExtra, ...snapshot }));
        } catch {
        }
      }
    };
    defaultStore = new MockStore();
  }
});

// src/lib/server/local-address-discovery-proxy.ts
init_mock_backend();
import * as https from "node:https";

// src/lib/registry-discovery-contract.ts
function classifyDiscoveryInput(input) {
  const normalized = normalizeInput(input);
  const base = emptyParsedInput();
  const administrative = normalized.match(/^(?<city>[^縣市]+[縣市])(?<district>[^區鄉鎮市]+[區鄉鎮市])(?<rest>.*)$/);
  if (!administrative?.groups) {
    const sectionOnly = normalized.match(/(?<section>[^縣市區鄉鎮市]+段)/)?.groups?.section ?? null;
    return {
      inputKind: "incomplete",
      intendedObjectType: sectionOnly ? "land" : "unknown",
      parsedInput: { ...base, sectionName: sectionOnly, landNumber: null }
    };
  }
  const cityName = administrative.groups.city;
  const districtName = administrative.groups.district;
  const rest = administrative.groups.rest;
  const land = parseLandDescriptor(rest);
  if (land) {
    return {
      inputKind: "land_descriptor",
      intendedObjectType: "land",
      parsedInput: {
        ...base,
        cityName,
        districtName,
        sectionName: land.sectionName,
        landNumber: land.landNumber
      }
    };
  }
  const doorplate = parseDoorplate(rest);
  if (doorplate) {
    return {
      inputKind: "doorplate",
      intendedObjectType: "building",
      parsedInput: {
        ...base,
        cityName,
        districtName,
        roadName: doorplate.roadName,
        laneName: doorplate.laneName,
        alleyName: doorplate.alleyName,
        doorNumber: doorplate.doorNumber
      }
    };
  }
  return {
    inputKind: "incomplete",
    intendedObjectType: "unknown",
    parsedInput: {
      ...base,
      cityName,
      districtName,
      sectionName: rest.match(/(?<section>[^縣市區鄉鎮市]+段)/)?.groups?.section ?? null
    }
  };
}
function suggestDiscoveryCorrections(input) {
  const normalized = normalizeInput(input);
  if (normalized.includes("\u9AD8\u96C4\u5E02\u82D3\u96C5\u5340\u82D3\u96C5\u8DEF\u4E8C\u6BB5") || normalized.includes("\u9AD8\u96C4\u5E02\u82D3\u96C5\u5340\u82D3\u96C5\u8DEF2\u6BB5")) {
    return [
      {
        from: "\u82D3\u96C5\u8DEF\u4E8C\u6BB5",
        to: "\u82D3\u96C5\u4E8C\u8DEF",
        reason: "suspected_kaohsiung_road_order_typo"
      }
    ];
  }
  return [];
}
function normalizeInput(input) {
  return convertChineseAddressNumerals((input ?? "").trim().replace(/\s+/g, "").replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 65248)));
}
function convertChineseAddressNumerals(value) {
  return value.replace(/([零一二兩三四五六七八九十百]+)(?=[段巷弄號樓])/g, (match) => {
    const parsed = parseChineseInteger(match);
    return parsed === null ? match : String(parsed);
  }).replace(/之([零一二兩三四五六七八九十百]+)/g, (_match, digits) => {
    const parsed = parseChineseInteger(digits);
    return parsed === null ? `\u4E4B${digits}` : `\u4E4B${parsed}`;
  });
}
function parseChineseInteger(value) {
  const digitMap = {
    \u96F6: 0,
    \u4E00: 1,
    \u4E8C: 2,
    \u5169: 2,
    \u4E09: 3,
    \u56DB: 4,
    \u4E94: 5,
    \u516D: 6,
    \u4E03: 7,
    \u516B: 8,
    \u4E5D: 9
  };
  if (value in digitMap) return digitMap[value];
  const tenIndex = value.indexOf("\u5341");
  if (tenIndex >= 0) {
    const before = value.slice(0, tenIndex);
    const after = value.slice(tenIndex + 1);
    const tens = before ? digitMap[before] : 1;
    const ones = after ? digitMap[after] : 0;
    if (typeof tens === "number" && typeof ones === "number") {
      return tens * 10 + ones;
    }
  }
  return null;
}
function emptyParsedInput() {
  return {
    cityName: null,
    districtName: null,
    roadName: null,
    laneName: null,
    alleyName: null,
    doorNumber: null,
    sectionName: null,
    landNumber: null
  };
}
function parseLandDescriptor(rest) {
  const match = rest.match(/(?<section>[^縣市區鄉鎮市路街巷弄號]+段)(?<land>\d{1,4}(?:[-之]\d{1,4})?)(?:地號)?$/);
  if (!match?.groups) return null;
  return {
    sectionName: match.groups.section,
    landNumber: match.groups.land.replace("\u4E4B", "-")
  };
}
function parseDoorplate(rest) {
  const doorMatch = rest.match(/(?<door>\d+(?:-\d+)?)號/);
  if (!doorMatch?.groups || doorMatch.index === void 0) return null;
  const beforeDoor = rest.slice(0, doorMatch.index);
  const alleyMatch = beforeDoor.match(/(?<alley>\d+)弄$/);
  const beforeAlley = alleyMatch?.groups ? beforeDoor.slice(0, alleyMatch.index) : beforeDoor;
  const laneMatch = beforeAlley.match(/(?<lane>\d+)巷$/);
  const roadName = laneMatch?.groups ? beforeAlley.slice(0, laneMatch.index) : beforeAlley;
  if (!roadName) return null;
  return {
    roadName,
    laneName: laneMatch?.groups?.lane ?? null,
    alleyName: alleyMatch?.groups?.alley ?? null,
    doorNumber: doorMatch.groups.door
  };
}

// src/lib/server/free-presurvey-cache.ts
import fs2 from "node:fs";
import path2 from "node:path";
import { createHash } from "node:crypto";

// src/lib/local-api/data-dir.ts
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function getDataDir() {
  if (process.env.AIRE_DATA_DIR) {
    const override = path.resolve(
      /* turbopackIgnore: true */
      process.env.AIRE_DATA_DIR
    );
    ensureDir(override);
    return override;
  }
  const platform = process.platform;
  let base;
  if (platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local");
    base = path.join(
      /* turbopackIgnore: true */
      localAppData,
      "AIRE"
    );
  } else if (platform === "darwin") {
    base = path.join(
      /* turbopackIgnore: true */
      os.homedir(),
      "Library",
      "Application Support",
      "AIRE"
    );
  } else {
    const xdgDataHome = process.env.XDG_DATA_HOME ?? path.join(os.homedir(), ".local", "share");
    base = path.join(
      /* turbopackIgnore: true */
      xdgDataHome,
      "AIRE"
    );
  }
  ensureDir(base);
  return base;
}
async function atomicWriteFile(targetPath, data) {
  const tmpPath = `${targetPath}.tmp`;
  try {
    ensureDir(path.dirname(
      /* turbopackIgnore: true */
      targetPath
    ));
    await fs.promises.writeFile(tmpPath, data);
    await fs.promises.rename(tmpPath, targetPath);
  } catch (err) {
    try {
      await fs.promises.unlink(tmpPath);
    } catch {
    }
    throw err;
  }
}
function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

// src/lib/server/free-presurvey-cache.ts
function cacheFilePath(kind, address) {
  const key = createHash("sha1").update(address.trim()).digest("hex");
  return path2.join(
    /* turbopackIgnore: true */
    getDataDir(),
    "cache",
    kind,
    `${key}.json`
  );
}
async function readCache(filePath) {
  try {
    const raw = await fs2.promises.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed?.payload ?? null;
  } catch {
    return null;
  }
}
async function writeCache(filePath, payload) {
  const body = {
    savedAt: (/* @__PURE__ */ new Date()).toISOString(),
    payload
  };
  await atomicWriteFile(filePath, Buffer.from(`${JSON.stringify(body, null, 2)}
`, "utf8"));
}
async function readAddressDiscoveryCache(address) {
  return readCache(cacheFilePath("address-discovery", address));
}
async function writeAddressDiscoveryCache(address, payload) {
  await writeCache(cacheFilePath("address-discovery", address), payload);
}

// src/lib/server/local-address-discovery-proxy.ts
var EASYMAP_R02_BASE_URL = "https://easymap.moi.gov.tw/R02";
var EASYMAP_Z10WEB_BASE_URL = "https://easymap.moi.gov.tw/Z10Web";
var EasyMapUpstreamError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "EasyMapUpstreamError";
  }
  code;
};
var EasyMapClient = class {
  // R02 和 Z10Web 各自維護 cookie（同 session 不相容）
  r02Cookies = /* @__PURE__ */ new Map();
  z10Cookies = /* @__PURE__ */ new Map();
  async discover(address) {
    const classification = classifyDiscoveryInput(address);
    if (classification.inputKind === "land_descriptor") {
      return this.discoverLandDescriptor(address, classification.parsedInput);
    }
    if (classification.inputKind !== "doorplate") {
      throw new Error("address_parse_failed");
    }
    return this.discoverDoorplate(address);
  }
  async discoverDoorplate(address) {
    const parts = parseTaiwanAddress(address);
    const prefersR02BuildingCandidate = Boolean(parts?.floorNumber);
    if (prefersR02BuildingCandidate) {
      const r02Primary = await this.tryDiscoverDoorplateViaR02(address);
      let z10Verification = { candidates: [], errors: [] };
      try {
        z10Verification = await this.discoverDoorplateViaZ10Web(address);
      } catch (error) {
        z10Verification = {
          candidates: [],
          errors: [normalizeEasyMapUpstreamError(error, "easymap_z10web")]
        };
      }
      if (r02Primary.candidates.length > 0) {
        const candidates = selectDoorplateCandidates(address, z10Verification.candidates, r02Primary);
        return {
          candidates,
          errors: [
            ...z10Verification.errors,
            ...buildR02CrossCheckDiagnostics(z10Verification.candidates, r02Primary)
          ]
        };
      }
      if (z10Verification.candidates.length > 0) {
        const candidates = filterZ10CandidatesWithR02UnitMatch(address, z10Verification.candidates, r02Primary);
        return {
          candidates,
          errors: [
            ...z10Verification.errors,
            ...r02Primary.errors
          ]
        };
      }
      return {
        candidates: [],
        errors: [
          ...z10Verification.errors,
          ...r02Primary.errors
        ]
      };
    }
    let z10Result = null;
    try {
      z10Result = await this.discoverDoorplateViaZ10Web(address);
      if (z10Result.candidates.length > 0) {
        const r02Verification = await this.tryDiscoverDoorplateViaR02(address);
        const candidates = filterZ10CandidatesWithR02UnitMatch(address, z10Result.candidates, r02Verification);
        return {
          candidates,
          errors: [
            ...z10Result.errors,
            ...buildR02CrossCheckDiagnostics(candidates, r02Verification)
          ]
        };
      }
    } catch (error) {
      z10Result = {
        candidates: [],
        errors: [normalizeEasyMapUpstreamError(error, "easymap_z10web")]
      };
    }
    const r02Fallback = await this.tryDiscoverDoorplateViaR02(address);
    if (r02Fallback.candidates.length > 0) {
      return {
        candidates: r02Fallback.candidates,
        errors: [
          ...z10Result.errors,
          {
            source: "easymap_z10web",
            code: "easymap_z10web_fallback_to_r02",
            message: "Z10Web \u672A\u53D6\u5F97\u5019\u9078\uFF0C\u5DF2\u6539\u7528 R02 \u4FBF\u6C11\u7CFB\u7D71\u7D50\u679C"
          },
          ...r02Fallback.errors
        ]
      };
    }
    return {
      candidates: [],
      errors: [
        ...z10Result.errors,
        ...r02Fallback.errors
      ]
    };
  }
  /**
   * Z10Web 門牌→地號查詢序列（作為土地鏈或建物輔助證據）
   * 1. GET /Z10Web/Normal → 建立 session cookie
   * 2. POST layout/setToken.jsp → token
   * 3. POST HouseholdDoorPlate_ajax_list → 門牌候選 HTML (data-road 屬性)
   * 4. POST HouseholdDoorPlate_json_detail → {x, y} WGS84 坐標
   * 5. POST Land_json_getMapImageLayersByCoord → cityCode/townCode/office/sectNo/sectName/landNo
   * 6. POST LandDesc_ajax_detail → HTML 詳情（面積/公告現值/公告地價/建號）
   */
  async discoverDoorplateViaZ10Web(address) {
    const parts = parseTaiwanAddress(address);
    if (!parts) {
      throw new Error("address_parse_failed");
    }
    await this.z10RequestText("/Normal", { method: "GET", withToken: false });
    let doorplateCandidates = [];
    for (const roadName of buildRoadNameQueryVariants(parts.roadName)) {
      const token = await this.z10LoadToken();
      const listHtml = await this.z10RequestText("/HouseholdDoorPlate_ajax_list", {
        method: "POST",
        token,
        body: {
          cityCode: parts.cityCode,
          cityName: parts.cityName,
          townName: parts.townName,
          roadName,
          laneName: parts.laneName,
          alleyName: parts.alleyName,
          no: parts.no
        }
      });
      doorplateCandidates = parseZ10WebDoorplateListHtml(listHtml);
      if (doorplateCandidates.length > 0) {
        break;
      }
    }
    if (doorplateCandidates.length === 0) {
      return { candidates: [], errors: [] };
    }
    const bestDoorplate = pickBestZ10WebDoorplate(doorplateCandidates, address);
    if (!bestDoorplate) {
      return { candidates: [], errors: [] };
    }
    const coordToken = await this.z10LoadToken();
    const coordJson = await this.z10RequestJson("/HouseholdDoorPlate_json_detail", {
      method: "POST",
      token: coordToken,
      body: {
        cityCode: parts.cityCode,
        cityName: parts.cityName,
        townName: parts.townName,
        doorPlate: bestDoorplate
      }
    });
    const wgs84x = coordJson.x;
    const wgs84y = coordJson.y;
    if (!wgs84x || !wgs84y) {
      return { candidates: [], errors: [] };
    }
    const layerToken = await this.z10LoadToken();
    const layerJson = await this.z10RequestJson("/Land_json_getMapImageLayersByCoord", {
      method: "POST",
      token: layerToken,
      body: {
        wgs84x: String(wgs84x),
        wgs84y: String(wgs84y)
      }
    });
    const landCandidate = parseZ10WebMapLayerPayload(layerJson);
    if (!landCandidate) {
      return { candidates: [], errors: [] };
    }
    const descResult = await this.z10LoadLandDescription(landCandidate);
    const buildingDescriptions = await this.z10LoadBuildingDescriptions(landCandidate, descResult.description.buildingNumbers);
    return {
      candidates: buildZ10WebLandParcels(
        address,
        landCandidate,
        descResult.description,
        {
          lat: wgs84y,
          lng: wgs84x
        },
        buildingDescriptions.descriptions
      ),
      errors: [...descResult.errors, ...buildingDescriptions.errors]
    };
  }
  async tryDiscoverDoorplateViaR02(address) {
    try {
      return await this.discoverDoorplateViaR02(address);
    } catch (error) {
      return {
        candidates: [],
        errors: [normalizeEasyMapUpstreamError(error)]
      };
    }
  }
  async discoverDoorplateViaR02(address) {
    const parts = parseTaiwanAddress(address);
    if (!parts) {
      throw new Error("address_parse_failed");
    }
    await this.r02RequestText("/Index", { method: "GET", withToken: false });
    const townCode = await this.resolveTownCode(parts.cityCode, parts.townName);
    const road = await this.resolveR02Road(parts.cityCode, townCode, parts.roadName);
    for (const roadValue of buildR02DoorQueryRoadValues(parts.roadName, road)) {
      const listPayload = await this.r02RequestText("/Door_json_getDoorList", {
        method: "POST",
        token: await this.r02LoadToken(),
        body: {
          city: parts.cityCode,
          area: townCode,
          road: roadValue,
          doorPlate: roadValue,
          doorPlateType: "A",
          lane: parts.laneName,
          alley: parts.alleyName,
          no: formatR02DoorNumber(parts)
        }
      });
      const doorCandidates = parseEasyMapDoorCandidateListPayload(listPayload);
      const selectedCandidates = selectDoorCandidatesForAddress(doorCandidates, address);
      if (selectedCandidates.length > 0) {
        const parcels = await Promise.all(selectedCandidates.map(async (selected) => {
          const buildingDescription = await this.enrichDoorCandidateBuildingDescription(
            parts,
            townCode,
            selected
          );
          return buildDoorParcel(address, selected, buildingDescription);
        }));
        return {
          candidates: normalizeParcelCandidateMetadata(parcels),
          errors: []
        };
      }
    }
    return {
      candidates: [],
      errors: [{
        source: "easymap_r02",
        code: "easymap_r02_no_candidate",
        message: "R02 \u4FBF\u6C11\u7CFB\u7D71\u672A\u56DE\u50B3\u7B26\u5408\u9580\u724C\u7684\u5730\u865F/\u5EFA\u865F\u5019\u9078"
      }]
    };
  }
  async enrichDoorCandidateBuildingDescription(parts, resolvedTownCode, candidate) {
    if (!candidate.buildingNo) return emptyBuildingDescription();
    const normalizedLandNo = normalizeLandNo(candidate.landNo) ?? candidate.landNo;
    if (!normalizedLandNo) return emptyBuildingDescription();
    try {
      const landCandidate = {
        cityName: parts.cityName.replace(/^台/, "\u81FA"),
        townName: parts.townName,
        cityCode: candidate.cityCode || parts.cityCode,
        townCode: candidate.townCode || resolvedTownCode,
        office: candidate.office,
        sectionCode: candidate.buildingSectionCode || candidate.sectionCode,
        sectionName: candidate.sectionName || "",
        landNo: normalizedLandNo
      };
      const details = await this.z10LoadBuildingDescriptions(landCandidate, [candidate.buildingNo]);
      return details.descriptions[candidate.buildingNo] ?? emptyBuildingDescription();
    } catch {
      return emptyBuildingDescription();
    }
  }
  async resolveR02Road(cityCode, townCode, roadName) {
    for (const variant of buildRoadNameQueryVariants(roadName)) {
      try {
        const payload = await this.r02RequestText("/City_json_getRoadList", {
          method: "POST",
          token: await this.r02LoadToken(),
          body: {
            cityCode,
            area: townCode,
            roadName: variant,
            doorPlateType: "A"
          }
        });
        const matched = pickBestR02Road(parseEasyMapRoadListPayload(payload), variant);
        if (matched) return matched;
      } catch {
      }
    }
    return null;
  }
  async z10LoadLandDescription(landCandidate) {
    try {
      const token = await this.z10LoadToken();
      const html = await this.z10RequestText("/LandDesc_ajax_detail", {
        method: "POST",
        token,
        body: {
          cityCode: landCandidate.cityCode,
          townCode: landCandidate.townCode,
          office: landCandidate.office,
          sectNo: landCandidate.sectionCode,
          landNo: formatEasyMapLandNoForDetail(landCandidate.landNo)
        }
      });
      return {
        description: parseEasyMapLandDescriptionHtml(html),
        errors: []
      };
    } catch (error) {
      return {
        description: emptyLandDescription(),
        errors: [normalizeEasyMapUpstreamError(error)]
      };
    }
  }
  async z10LoadBuildingDescriptions(landCandidate, buildingNumbers) {
    const descriptions = {};
    const errors = [];
    for (const buildingNumber of buildingNumbers) {
      try {
        const html = await this.z10RequestText("/BuildDesc_ajax_detail", {
          method: "POST",
          token: await this.z10LoadToken(),
          body: {
            cityCode: landCandidate.cityCode,
            townCode: landCandidate.townCode,
            office: landCandidate.office,
            sectNo: landCandidate.sectionCode,
            buildNo: buildingNumber
          }
        });
        descriptions[buildingNumber] = parseEasyMapBuildingDescriptionHtml(html);
      } catch (error) {
        errors.push({
          source: "easymap_z10web",
          code: "easymap_z10web_build_detail_unavailable",
          message: `\u5EFA\u865F ${buildingNumber} \u660E\u7D30\u66AB\u6642\u7121\u6CD5\u53D6\u5F97\uFF1A${error instanceof Error ? error.message : "unknown_error"}`
        });
      }
    }
    return { descriptions, errors };
  }
  async z10LoadToken() {
    const html = await this.z10RequestText("/layout/setToken.jsp", { method: "POST", withToken: false });
    const token = html.match(/name=["']token["']\s+value=["']([^"']+)["']/)?.[1];
    if (!token) {
      throw new Error("easymap_z10web_token_missing");
    }
    return token;
  }
  async z10RequestJson(path3, options) {
    const text = await this.z10RequestText(path3, options);
    return JSON.parse(text);
  }
  async z10RequestText(path3, options) {
    const body = new URLSearchParams();
    for (const [key, value] of Object.entries(options.body ?? {})) {
      body.set(key, value);
    }
    if (options.token) {
      body.set("struts.token.name", "token");
      body.set("token", options.token);
    }
    if (process.env.NODE_ENV !== "test") {
      return this.z10RequestTextWithNodeHttps(path3, options, body);
    }
    const response = await fetch(`${EASYMAP_Z10WEB_BASE_URL}${path3}`, {
      method: options.method,
      headers: {
        accept: options.method === "POST" ? "application/json, text/javascript, text/html, */*; q=0.01" : "text/html,*/*",
        referer: `${EASYMAP_Z10WEB_BASE_URL}/Normal`,
        "user-agent": "Mozilla/5.0 AIRE-local-discovery",
        ...options.method === "POST" ? { "x-requested-with": "XMLHttpRequest" } : {},
        ...options.method === "POST" ? { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" } : {},
        ...this.z10CookieHeader() ? { cookie: this.z10CookieHeader() } : {}
      },
      body: options.method === "POST" ? body : void 0,
      redirect: "follow",
      signal: AbortSignal.timeout(8e3)
    });
    this.z10StoreCookies(response.headers);
    const text = await response.text();
    if (!response.ok) {
      throw new EasyMapUpstreamError(
        `easymap_z10web_http_${response.status}`,
        `EasyMap Z10Web ${path3} returned http_status=${response.status}`
      );
    }
    return text;
  }
  async z10RequestTextWithNodeHttps(path3, options, body) {
    const url = new URL(`${EASYMAP_Z10WEB_BASE_URL}${path3}`);
    const bodyText = body.toString();
    const headers = {
      accept: options.method === "POST" ? "application/json, text/javascript, text/html, */*; q=0.01" : "text/html,*/*",
      referer: `${EASYMAP_Z10WEB_BASE_URL}/Normal`,
      "user-agent": "Mozilla/5.0 AIRE-local-discovery",
      ...this.z10CookieHeader() ? { cookie: this.z10CookieHeader() } : {}
    };
    if (options.method === "POST") {
      headers["content-type"] = "application/x-www-form-urlencoded;charset=UTF-8";
      headers["content-length"] = Buffer.byteLength(bodyText);
      headers["x-requested-with"] = "XMLHttpRequest";
    }
    return await withEasyMapRetry(async () => await new Promise((resolve, reject) => {
      const request2 = https.request(
        url,
        {
          method: options.method,
          headers,
          timeout: 8e3
        },
        (response) => {
          for (const value of response.headers["set-cookie"] ?? []) {
            this.z10StoreCookieValue(value);
          }
          const chunks = [];
          response.on("data", (chunk) => chunks.push(chunk));
          response.on("end", () => {
            const text = Buffer.concat(chunks).toString("utf8");
            if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
              reject(new EasyMapUpstreamError(
                `easymap_z10web_http_${response.statusCode ?? 0}`,
                `EasyMap Z10Web ${path3} returned http_status=${response.statusCode ?? 0}: ${summarizeUpstreamText(text)}`
              ));
              return;
            }
            resolve(text);
          });
        }
      );
      request2.on("timeout", () => {
        request2.destroy(new Error(`EasyMap Z10Web ${path3} timed out`));
      });
      request2.on("error", reject);
      if (options.method === "POST") {
        request2.write(bodyText);
      }
      request2.end();
    }));
  }
  z10CookieHeader() {
    return Array.from(this.z10Cookies.entries()).map(([key, value]) => `${key}=${value}`).join("; ");
  }
  z10StoreCookies(headers) {
    const getSetCookie = headers.getSetCookie;
    const values = getSetCookie ? getSetCookie.call(headers) : splitSetCookieHeader(headers.get("set-cookie"));
    for (const value of values) {
      const [pair] = value.split(";");
      const index = pair.indexOf("=");
      if (index <= 0) continue;
      this.z10Cookies.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
    }
  }
  z10StoreCookieValue(value) {
    const [pair] = value.split(";");
    const index = pair.indexOf("=");
    if (index <= 0) return;
    this.z10Cookies.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
  }
  async loadLandDescription(landCandidate) {
    try {
      const landDescriptionHtml = await this.r02RequestText("/LandDesc_ajax_detail", {
        method: "POST",
        token: await this.r02LoadToken(),
        body: {
          cityCode: landCandidate.cityCode,
          townCode: landCandidate.townCode,
          office: landCandidate.office,
          sectNo: landCandidate.sectionCode,
          landNo: formatEasyMapLandNoForDetail(landCandidate.landNo)
        }
      });
      return {
        description: parseEasyMapLandDescriptionHtml(landDescriptionHtml),
        errors: []
      };
    } catch (error) {
      return {
        description: emptyLandDescription(),
        errors: [normalizeEasyMapUpstreamError(error)]
      };
    }
  }
  async discoverLandDescriptor(address, parsedInput) {
    let z10Result = null;
    try {
      z10Result = await this.discoverLandDescriptorViaZ10Web(address, parsedInput);
      if (z10Result.candidates.length > 0) {
        if (z10Result.candidates.some((candidate) => candidate.land_area_sqm === void 0)) {
          try {
            const r02Detail = await this.discoverLandDescriptorViaR02(address, parsedInput);
            if (r02Detail.candidates.length > 0) {
              const detailByLand = new Map(
                r02Detail.candidates.map((candidate) => [
                  `${candidate.section_name ?? ""}:${candidate.lot_number ?? ""}`,
                  candidate
                ])
              );
              return {
                candidates: z10Result.candidates.map((candidate) => ({
                  ...candidate,
                  ...(() => {
                    const detail = detailByLand.get(`${candidate.section_name ?? ""}:${candidate.lot_number ?? ""}`);
                    return detail ? {
                      land_area_sqm: candidate.land_area_sqm ?? detail.land_area_sqm,
                      zoning: candidate.zoning ?? detail.zoning,
                      announced_land_current_value: candidate.announced_land_current_value ?? detail.announced_land_current_value,
                      announced_land_value: candidate.announced_land_value ?? detail.announced_land_value
                    } : {};
                  })()
                })),
                errors: [...z10Result.errors, ...r02Detail.errors]
              };
            }
          } catch {
          }
        }
        return z10Result;
      }
    } catch (error) {
      z10Result = {
        candidates: [],
        errors: [normalizeEasyMapUpstreamError(error, "easymap_z10web")]
      };
    }
    const r02Fallback = await this.discoverLandDescriptorViaR02(address, parsedInput);
    if (r02Fallback.candidates.length > 0) {
      return {
        candidates: r02Fallback.candidates,
        errors: [
          ...z10Result.errors,
          {
            source: "easymap_z10web",
            code: "easymap_z10web_fallback_to_r02",
            message: "Z10Web \u672A\u53D6\u5F97\u571F\u5730\u5019\u9078\uFF0C\u5DF2\u6539\u7528 R02 \u4FBF\u6C11\u7CFB\u7D71\u7D50\u679C"
          },
          ...r02Fallback.errors
        ]
      };
    }
    return {
      candidates: [],
      errors: [
        ...z10Result.errors,
        ...r02Fallback.errors
      ]
    };
  }
  async discoverLandDescriptorViaZ10Web(address, parsedInput) {
    const cityName = parsedInput.cityName?.replace(/^台/, "\u81FA") ?? "";
    const townName = parsedInput.districtName ?? "";
    const sectionName = parsedInput.sectionName ?? "";
    const landNo = normalizeLandNo(parsedInput.landNumber);
    const cityCode = CITY_CODE_BY_NAME[cityName] ?? CITY_CODE_BY_NAME[cityName.replace(/^臺/, "\u53F0")];
    if (!cityName || !townName || !sectionName || !landNo || !cityCode) {
      throw new Error("land_descriptor_parse_failed");
    }
    await this.z10RequestText("/Normal", { method: "GET", withToken: false });
    const townCode = await this.resolveZ10TownCode(cityCode, cityName, townName);
    const sectionPayload = await this.z10RequestText("/City_json_getSectionList", {
      method: "POST",
      token: await this.z10LoadToken(),
      body: {
        cityCode,
        townCode
      }
    });
    const section = parseEasyMapSectionListPayload(sectionPayload, sectionName, {
      cityName,
      townName,
      cityCode,
      townCode
    });
    if (!section) {
      return { candidates: [], errors: [] };
    }
    let locatedLand = { ...section, landNo };
    let locatedCoordinate = null;
    try {
      const locatePayload = await this.z10RequestText("/Land_json_locate", {
        method: "POST",
        token: await this.z10LoadToken(),
        body: {
          sectNo: section.sectionCode,
          office: section.office,
          landNo: formatEasyMapLandNoForDetail(landNo)
        }
      });
      locatedLand = parseEasyMapLandByCoordinatePayload(locatePayload) ?? locatedLand;
      locatedCoordinate = parseEasyMapCoordinatePayload(locatePayload);
    } catch {
    }
    const landDescription = await this.z10LoadLandDescription(locatedLand);
    return {
      candidates: buildZ10WebLandParcels(address, locatedLand, landDescription.description, locatedCoordinate),
      errors: landDescription.errors
    };
  }
  async discoverLandDescriptorViaR02(address, parsedInput) {
    const cityName = parsedInput.cityName?.replace(/^台/, "\u81FA") ?? "";
    const townName = parsedInput.districtName ?? "";
    const sectionName = parsedInput.sectionName ?? "";
    const landNo = normalizeLandNo(parsedInput.landNumber);
    const cityCode = CITY_CODE_BY_NAME[cityName] ?? CITY_CODE_BY_NAME[cityName.replace(/^臺/, "\u53F0")];
    if (!cityName || !townName || !sectionName || !landNo || !cityCode) {
      throw new Error("land_descriptor_parse_failed");
    }
    await this.r02RequestText("/Index", { method: "GET", withToken: false });
    const townCode = await this.resolveTownCode(cityCode, townName);
    const sectionPayload = await this.r02RequestText("/City_json_getSectionList", {
      method: "POST",
      token: await this.r02LoadToken(),
      body: {
        cityCode,
        area: townCode
      }
    });
    const section = parseEasyMapSectionListPayload(sectionPayload, sectionName, {
      cityName,
      townName,
      cityCode,
      townCode
    });
    if (!section) {
      return { candidates: [], errors: [] };
    }
    let locatedLand = { ...section, landNo };
    let locatedCoordinate = null;
    try {
      const locatePayload = await this.r02RequestText("/Land_json_locate", {
        method: "POST",
        token: await this.r02LoadToken(),
        body: {
          cityName: section.cityName || cityName,
          townName: section.townName || townName,
          cityCode: section.cityCode || cityCode,
          townCode: section.townCode,
          office: section.office,
          sectNo: section.sectionCode,
          landNo: formatEasyMapLandNoForDetail(landNo)
        }
      });
      locatedLand = parseEasyMapLandByCoordinatePayload(locatePayload) ?? locatedLand;
      locatedCoordinate = parseEasyMapCoordinatePayload(locatePayload);
    } catch {
    }
    const landDescription = await this.loadLandDescription(locatedLand);
    return {
      candidates: buildEasyMapLandParcels(address, locatedLand, landDescription.description, locatedCoordinate),
      errors: landDescription.errors
    };
  }
  async resolveZ10TownCode(cityCode, cityName, townName) {
    const fallbackCode = lookupKnownTownCode(cityCode, townName);
    const payload = await this.z10RequestText("/City_json_getTownList", {
      method: "POST",
      token: await this.z10LoadToken(),
      body: {
        cityCode,
        cityName
      }
    });
    const towns = parseEasyMapTownListPayload(payload);
    const normalizedTarget = normalizeAdministrativeName(townName);
    const town = towns.find((item) => normalizeAdministrativeName(item.name) === normalizedTarget);
    if (town) {
      return town.id;
    }
    if (towns.length === 1) {
      return towns[0].id;
    }
    if (fallbackCode) return fallbackCode;
    throw new Error("easymap_z10web_town_not_found");
  }
  async resolveTownCode(cityCode, townName) {
    const fallbackCode = lookupKnownTownCode(cityCode, townName);
    const cityName = Object.entries(CITY_CODE_BY_NAME).find(([, code]) => code === cityCode)?.[0] ?? "";
    try {
      const payload = await this.r02RequestText("/City_json_getTownList", {
        method: "POST",
        token: await this.r02LoadToken(),
        body: {
          cityCode,
          cityName,
          doorPlateType: "A"
          // A = 地政門牌（預設）
        }
      });
      const towns = parseEasyMapTownListPayload(payload);
      const normalizedTarget = normalizeAdministrativeName(townName);
      const town = towns.find((item) => normalizeAdministrativeName(item.name) === normalizedTarget);
      if (town) {
        return town.id;
      }
      if (towns.length === 1) {
        return towns[0].id;
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "test") {
        console.error("[resolveTownCode] getTownList failed:", err);
      }
    }
    if (fallbackCode) return fallbackCode;
    throw new Error("easymap_town_not_found");
  }
  async r02LoadToken() {
    const html = await this.r02RequestText("/pages/setToken.jsp", { method: "POST", withToken: false });
    const token = html.match(/name=["']token["']\s+value=["']([^"']+)["']/)?.[1];
    if (!token) {
      throw new Error("easymap_token_missing");
    }
    return token;
  }
  async r02RequestJson(path3, options) {
    const text = await this.r02RequestText(path3, options);
    return JSON.parse(text);
  }
  async r02RequestText(path3, options) {
    const body = new URLSearchParams();
    for (const [key, value] of Object.entries(options.body ?? {})) {
      body.set(key, value);
    }
    if (options.token) {
      body.set("struts.token.name", "token");
      body.set("token", options.token);
    }
    if (process.env.NODE_ENV !== "test") {
      return this.r02RequestTextWithNodeHttps(path3, options, body);
    }
    const response = await fetch(`${EASYMAP_R02_BASE_URL}${path3}`, {
      method: options.method,
      headers: {
        accept: options.method === "POST" ? "application/json, text/javascript, text/html, */*; q=0.01" : "text/html,*/*",
        referer: `${EASYMAP_R02_BASE_URL}/Index`,
        "user-agent": "Mozilla/5.0 AIRE-local-discovery",
        ...options.method === "POST" ? { "x-requested-with": "XMLHttpRequest" } : {},
        ...options.method === "POST" ? { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" } : {},
        ...this.r02CookieHeader() ? { cookie: this.r02CookieHeader() } : {}
      },
      body: options.method === "POST" ? body : void 0,
      redirect: "follow",
      signal: AbortSignal.timeout(8e3)
    });
    this.r02StoreCookies(response.headers);
    const text = await response.text();
    if (text.trim().toUpperCase() === "PERMISSION DENIED") {
      throw new EasyMapUpstreamError(
        "easymap_permission_denied",
        `EasyMap R02 denied ${path3} with http_status=${response.status}`
      );
    }
    if (!response.ok) {
      throw new EasyMapUpstreamError(
        `easymap_http_${response.status}`,
        `EasyMap R02 ${path3} returned http_status=${response.status}`
      );
    }
    return text;
  }
  async r02RequestTextWithNodeHttps(path3, options, body) {
    const url = new URL(`${EASYMAP_R02_BASE_URL}${path3}`);
    const bodyText = body.toString();
    const headers = {
      accept: options.method === "POST" ? "application/json, text/javascript, text/html, */*; q=0.01" : "text/html,*/*",
      referer: `${EASYMAP_R02_BASE_URL}/Index`,
      "user-agent": "Mozilla/5.0 AIRE-local-discovery",
      ...this.r02CookieHeader() ? { cookie: this.r02CookieHeader() } : {}
    };
    if (options.method === "POST") {
      headers["content-type"] = "application/x-www-form-urlencoded;charset=UTF-8";
      headers["content-length"] = Buffer.byteLength(bodyText);
      headers["x-requested-with"] = "XMLHttpRequest";
    }
    return await withEasyMapRetry(async () => await new Promise((resolve, reject) => {
      const request2 = https.request(
        url,
        {
          method: options.method,
          headers,
          timeout: 8e3
        },
        (response) => {
          for (const value of response.headers["set-cookie"] ?? []) {
            this.r02StoreCookieValue(value);
          }
          const chunks = [];
          response.on("data", (chunk) => chunks.push(chunk));
          response.on("end", () => {
            const text = Buffer.concat(chunks).toString("utf8");
            if (text.trim().toUpperCase() === "PERMISSION DENIED") {
              reject(new EasyMapUpstreamError(
                "easymap_permission_denied",
                `EasyMap R02 denied ${path3} with http_status=${response.statusCode ?? 0}`
              ));
              return;
            }
            if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
              reject(new EasyMapUpstreamError(
                `easymap_http_${response.statusCode ?? 0}`,
                `EasyMap R02 ${path3} returned http_status=${response.statusCode ?? 0}: ${summarizeUpstreamText(text)}`
              ));
              return;
            }
            resolve(text);
          });
        }
      );
      request2.on("timeout", () => {
        request2.destroy(new Error(`EasyMap R02 ${path3} timed out`));
      });
      request2.on("error", reject);
      if (options.method === "POST") {
        request2.write(bodyText);
      }
      request2.end();
    }));
  }
  r02CookieHeader() {
    return Array.from(this.r02Cookies.entries()).map(([key, value]) => `${key}=${value}`).join("; ");
  }
  r02StoreCookies(headers) {
    const getSetCookie = headers.getSetCookie;
    const values = getSetCookie ? getSetCookie.call(headers) : splitSetCookieHeader(headers.get("set-cookie"));
    for (const value of values) {
      const [pair] = value.split(";");
      const index = pair.indexOf("=");
      if (index <= 0) continue;
      this.r02Cookies.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
    }
  }
  r02StoreCookieValue(value) {
    const [pair] = value.split(";");
    const index = pair.indexOf("=");
    if (index <= 0) return;
    this.r02Cookies.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
  }
};
function normalizeAddress(value) {
  return (value ?? "").trim();
}
function normalizeAddressForMatch(value) {
  return normalizeDiscoveryAddressText(value).replace(/臺/g, "\u53F0").replace(/[里鄰\s]/g, "").trim();
}
function fallbackManualResult(address, error) {
  const normalized = normalizeAddress(address);
  const classification = classifyDiscoveryInput(normalized);
  const message = normalized ? "\u672C\u6A5F\u74B0\u5883\u7121\u6CD5\u53D6\u5F97\u53EF\u76F4\u63A5\u88DC\u9F4A\u7684\u5730\u5740\u5019\u9078\uFF0C\u8ACB\u5148\u4EBA\u5DE5\u78BA\u8A8D\u5730\u6BB5\u3001\u5730\u865F\u3001\u5EFA\u865F" : "\u8ACB\u5148\u8F38\u5165\u5B8C\u6574\u5730\u5740";
  return {
    status: "manual_required",
    source: "local_discovery",
    normalizedAddress: normalized,
    candidates: [],
    errors: [
      error ?? {
        source: "local_discovery",
        code: "local_proxy_manual_required",
        message
      }
    ],
    trustedForPdf: false,
    totalCostCents: 0,
    total_cost_cents: 0,
    cacheHit: false,
    sourceRunId: null,
    inputKind: classification.inputKind,
    intendedObjectType: classification.intendedObjectType,
    parsedInput: classification.parsedInput,
    requiresCandidateSelection: false,
    candidateSelection: {
      state: "not_required",
      selectedRegistryKey: null
    },
    suggestedCorrections: suggestDiscoveryCorrections(normalized)
  };
}
function normalizeEasyMapUpstreamError(error, source = "easymap_r02") {
  if (error instanceof EasyMapUpstreamError) {
    return {
      source,
      code: error.code,
      message: error.message
    };
  }
  return {
    source,
    code: source === "easymap_z10web" ? "easymap_z10web_unavailable" : "easymap_r02_unavailable",
    message: error instanceof Error ? error.message : "\u5730\u5740\u8CC7\u6599\u9700\u8981\u4EBA\u5DE5\u78BA\u8A8D"
  };
}
function shouldRetryEasyMapRequest(error) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /timed out|timeout|ECONNRESET|socket hang up|http_status=50\d|http_50\d/i.test(message);
}
async function withEasyMapRetry(work, attempts = 2) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !shouldRetryEasyMapRequest(error)) {
        throw error;
      }
    }
  }
  throw lastError;
}
function buildR02CrossCheckDiagnostics(z10Candidates, r02Result) {
  if (r02Result.candidates.length === 0) {
    return r02Result.errors;
  }
  if (z10Candidates.length === 0) {
    return r02Result.errors;
  }
  const z10Keys = new Set(z10Candidates.map(registryCandidateKey).filter(Boolean));
  const r02Keys = r02Result.candidates.map(registryCandidateKey).filter(Boolean);
  const matched = r02Keys.some((key) => z10Keys.has(key));
  if (matched) {
    return r02Result.errors;
  }
  return [
    {
      source: "easymap_r02",
      code: "easymap_r02_z10web_mismatch",
      message: `R02 \u820A\u4FBF\u6C11\u7CFB\u7D71\u8207 Z10Web \u5019\u9078\u4E0D\u4E00\u81F4\uFF1AZ10Web=${formatCandidateKeys(z10Candidates)}\uFF1BR02=${formatCandidateKeys(r02Result.candidates)}\u3002\u8ACB\u4EBA\u5DE5\u78BA\u8A8D\u5730\u6BB5\u3001\u5730\u865F\u3001\u5EFA\u865F\u5F8C\u518D\u4ED8\u8CBB\u532F\u5165\u3002`
    },
    ...r02Result.errors
  ];
}
function selectDoorplateCandidates(address, z10Candidates, r02Result) {
  const exactMerged = mergeR02CandidatesWithExactZ10Support(z10Candidates, r02Result.candidates);
  if (exactMerged.length === r02Result.candidates.length && exactMerged.length > 0) {
    return normalizeParcelCandidateMetadata(exactMerged);
  }
  if (r02Result.candidates.length > 0) {
    const filtered = filterZ10CandidatesWithR02UnitMatch(address, z10Candidates, r02Result);
    if (filtered.length === 1 && filtered[0]?.source === "easymap_r02") {
      return filtered;
    }
  }
  if (r02Result.candidates.length > 0 && z10Candidates.length === 0) {
    return normalizeParcelCandidateMetadata(r02Result.candidates);
  }
  if (r02Result.candidates.length > 0) {
    return normalizeParcelCandidateMetadata(
      r02Result.candidates.map((candidate) => ({
        ...candidate,
        discovery_confidence: "low",
        confirmation_state: "unconfirmed"
      }))
    );
  }
  return z10Candidates;
}
function mergeR02CandidatesWithExactZ10Support(z10Candidates, r02Candidates) {
  if (r02Candidates.length === 0 || z10Candidates.length === 0) return [];
  const z10ByKey = new Map(
    z10Candidates.map((candidate) => [registryCandidateKey(candidate), candidate]).filter(([key]) => Boolean(key))
  );
  const merged = [];
  for (const r02Candidate of r02Candidates) {
    const key = registryCandidateKey(r02Candidate);
    if (!key) return [];
    const supporting = z10ByKey.get(key);
    if (!supporting) return [];
    merged.push(mergeDoorplateCandidateEvidence(r02Candidate, supporting));
  }
  return merged;
}
function mergeDoorplateCandidateEvidence(primary, supporting) {
  return {
    ...supporting,
    ...primary,
    source: "easymap_r02",
    lot_number: primary.lot_number || supporting.lot_number,
    section_code: primary.section_code || supporting.section_code,
    section_name: primary.section_name || supporting.section_name,
    land_office: primary.land_office || supporting.land_office,
    building_number: primary.building_number || supporting.building_number,
    building_area_sqm: primary.building_area_sqm || supporting.building_area_sqm,
    total_floor_count: primary.total_floor_count || supporting.total_floor_count,
    floor_label: primary.floor_label || supporting.floor_label,
    completion_date_roc: primary.completion_date_roc || supporting.completion_date_roc,
    age_years: primary.age_years || supporting.age_years,
    main_use: primary.main_use || supporting.main_use,
    lat: primary.lat ?? supporting.lat,
    lng: primary.lng ?? supporting.lng,
    discovery_confidence: primary.discovery_confidence ?? supporting.discovery_confidence,
    confirmation_state: primary.confirmation_state ?? supporting.confirmation_state
  };
}
function filterZ10CandidatesWithR02UnitMatch(address, z10Candidates, r02Result) {
  const parts = parseTaiwanAddress(address);
  if (!parts?.floorNumber) {
    return z10Candidates;
  }
  const matchedByR02 = filterCandidatesByR02Keys(z10Candidates, r02Result.candidates);
  const uniqueR02Match = maybeMarkUniqueFloorUnitMatch(matchedByR02);
  if (uniqueR02Match) {
    return uniqueR02Match;
  }
  const matchedByBuildingNo = filterCandidatesByR02BuildingNo(z10Candidates, r02Result.candidates);
  if (matchedByBuildingNo.length === 1 && r02Result.candidates.length === 1 && z10Candidates.every((candidate) => candidate.source === "easymap_z10web")) {
    return normalizeParcelCandidateMetadata([{
      ...r02Result.candidates[0],
      discovery_confidence: "low",
      confirmation_state: "unconfirmed"
    }]);
  }
  const floorLabelCandidates = matchedByR02.length > 0 ? matchedByR02 : z10Candidates;
  const matchedByFloorLabel = filterCandidatesByFloorLabel(address, floorLabelCandidates);
  const uniqueFloorLabelMatch = maybeMarkUniqueFloorUnitMatch(matchedByFloorLabel);
  if (uniqueFloorLabelMatch) {
    return uniqueFloorLabelMatch;
  }
  return matchedByR02.length > 1 ? normalizeParcelCandidateMetadata(matchedByR02) : z10Candidates;
}
function filterCandidatesByR02Keys(z10Candidates, r02Candidates) {
  if (r02Candidates.length === 0) return [];
  const r02Keys = new Set(r02Candidates.map(registryCandidateKey).filter(Boolean));
  return z10Candidates.filter((candidate) => r02Keys.has(registryCandidateKey(candidate)));
}
function filterCandidatesByR02BuildingNo(z10Candidates, r02Candidates) {
  const r02BuildingNumbers = new Set(
    r02Candidates.map((candidate) => String(candidate.building_number ?? "").trim()).filter(Boolean)
  );
  if (r02BuildingNumbers.size === 0) return [];
  return z10Candidates.filter((candidate) => r02BuildingNumbers.has(String(candidate.building_number ?? "").trim()));
}
function filterCandidatesByFloorLabel(address, candidates) {
  const targetFloorKey = extractFloorKey(address);
  if (!targetFloorKey) return candidates;
  const matched = candidates.filter((candidate) => extractFloorLabelKey(candidate.floor_label) === targetFloorKey);
  return matched.length > 0 ? matched : candidates;
}
function maybeMarkUniqueFloorUnitMatch(candidates) {
  if (candidates.length !== 1) return null;
  return normalizeParcelCandidateMetadata([
    {
      ...candidates[0],
      selection_reason: "floor_unit_unique_match"
    }
  ]);
}
function registryCandidateKey(candidate) {
  const office = String(candidate.land_office ?? "").trim();
  const section = String(candidate.section_code ?? "").trim();
  const land = normalizeLandNo(String(candidate.lot_number ?? "")) ?? String(candidate.lot_number ?? "").trim();
  const building = String(candidate.building_number ?? "").trim();
  return [office, section, land, building].join("/");
}
function formatCandidateKeys(candidates) {
  const keys = candidates.map(registryCandidateKey).filter(Boolean);
  return keys.length > 0 ? keys.join(", ") : "\u7121\u5019\u9078";
}
function requiresCandidateSelectionForCandidates(candidates) {
  if (candidates.length > 1) return true;
  if (candidates.length !== 1) return false;
  const [candidate] = candidates;
  return candidate.discovery_confidence === "low";
}
function formatR02DoorNumber(parts) {
  if (!parts.floorNumber) {
    return parts.no;
  }
  const unit = parts.floorUnit ? `\u4E4B${parts.floorUnit}` : "";
  return `${parts.no}\u865F${parts.floorNumber}\u6A13${unit}`;
}
function parseZ10WebDoorplateListHtml(html) {
  const matches = Array.from(html.matchAll(/data-road="([^"]+)"/g));
  return matches.map((m) => m[1]).filter(Boolean);
}
function pickBestZ10WebDoorplate(candidates, inputAddress) {
  if (candidates.length === 0) return null;
  const targetParts = parseTaiwanAddress(inputAddress);
  if (targetParts) {
    const exact = candidates.find((candidate) => {
      const candidateParts = parseTaiwanAddress(candidate);
      return candidateParts ? hasSameDoorplateCore(candidateParts, targetParts) : false;
    });
    if (exact) return exact;
  }
  const target = normalizeAddressForMatch(inputAddress);
  return candidates.find((c) => normalizeAddressForMatch(c) === target) ?? candidates.find((c) => target.endsWith(normalizeAddressForMatch(c).replace(/^\S+?[縣市]\S+?[區鄉鎮市]/, ""))) ?? null;
}
function hasSameDoorplateCore(candidateParts, targetParts) {
  return candidateParts.cityCode === targetParts.cityCode && candidateParts.townName === targetParts.townName && normalizeRoadName(candidateParts.roadName) === normalizeRoadName(targetParts.roadName) && candidateParts.laneName === targetParts.laneName && candidateParts.alleyName === targetParts.alleyName && candidateParts.no === targetParts.no;
}
function parseZ10WebMapLayerPayload(json) {
  const cityName = pickString2(json, "cityName");
  const townName = pickString2(json, "townName");
  const cityCode = pickString2(json, "cityCode");
  const townCode = pickString2(json, "townCode");
  const office = pickString2(json, "office");
  const sectionCode = pickString2(json, "sectNo");
  const sectionName = pickString2(json, "sectName");
  const landNoRaw = pickString2(json, "landNo");
  const landNo = landNoRaw ? normalizeLandNo(landNoRaw) : null;
  if (!cityCode || !townCode || !office || !sectionCode || !sectionName || !landNo) {
    return null;
  }
  return {
    cityName: cityName ?? "",
    townName: townName ?? "",
    cityCode,
    townCode,
    office,
    sectionCode,
    sectionName,
    landNo
  };
}
function buildZ10WebLandParcels(inputAddress, land, description, coordinate = null, buildingDescriptions = {}) {
  const base = {
    address: inputAddress,
    lot_number: land.landNo,
    section_name: land.sectionName,
    section_code: land.sectionCode,
    land_office: land.office,
    source: "easymap_z10web",
    trusted_for_pdf: false,
    land_area_sqm: description.landAreaSqm ?? void 0,
    zoning: description.zoning ?? void 0,
    announced_land_current_value: description.announcedLandCurrentValue ?? void 0,
    announced_land_value: description.announcedLandValue ?? void 0,
    lat: coordinate?.lat,
    lng: coordinate?.lng
  };
  if (description.buildingNumbers.length === 0) {
    return normalizeParcelCandidateMetadata([{
      ...base,
      parcel_id: `${land.office}-${land.sectionCode}-${land.landNo}`,
      building_number: ""
    }]);
  }
  return normalizeParcelCandidateMetadata(
    description.buildingNumbers.map((buildingNumber) => {
      const buildingDescription = buildingDescriptions[buildingNumber] ?? emptyBuildingDescription();
      return {
        ...base,
        parcel_id: `${land.office}-${land.sectionCode}-${buildingNumber}`,
        building_number: buildingDescription.buildingNo ?? buildingNumber,
        building_area_sqm: buildingDescription.buildingAreaSqm ?? void 0,
        total_floor_count: buildingDescription.totalFloorCount ?? void 0,
        floor_label: buildingDescription.floorLabel ?? void 0,
        completion_date_roc: buildingDescription.completionDateRoc ?? void 0,
        age_years: buildingDescription.ageYears ?? void 0,
        main_use: buildingDescription.mainUse ?? void 0
      };
    })
  );
}
async function getLatestDiscoveryRun(address) {
  const normalized = normalizeAddress(address);
  const runs = await mockInvoke("list_registry_query_runs", {});
  if (!Array.isArray(runs)) return null;
  return runs.find((run) => normalizeAddress(String(run.source_input ?? "")) === normalized) ?? runs[0] ?? null;
}
async function discoverAddressLocally(address, options = {}) {
  const normalized = normalizeAddress(address);
  if (!normalized) {
    return fallbackManualResult(normalized);
  }
  const useCache = options.cache !== false;
  const cachedResult = useCache ? await readAddressDiscoveryCache(normalized) : null;
  try {
    const discovery = await new EasyMapClient().discover(normalized);
    const candidates = discovery.candidates;
    if (candidates.length > 0) {
      const classification = classifyDiscoveryInput(normalized);
      const requiresCandidateSelection = requiresCandidateSelectionForCandidates(candidates);
      const hasLowConfidenceCandidate = candidates.some((candidate) => candidate.discovery_confidence === "low");
      const result = {
        status: hasLowConfidenceCandidate || requiresCandidateSelection ? "low_confidence_unresolved" : "candidate_found",
        source: "local_discovery",
        normalizedAddress: normalized,
        candidates,
        errors: discovery.errors,
        trustedForPdf: false,
        totalCostCents: 0,
        total_cost_cents: 0,
        cacheHit: false,
        sourceRunId: null,
        inputKind: classification.inputKind,
        intendedObjectType: classification.intendedObjectType,
        parsedInput: classification.parsedInput,
        requiresCandidateSelection,
        candidateSelection: {
          state: requiresCandidateSelection ? "required" : "not_required",
          selectedRegistryKey: null
        },
        suggestedCorrections: suggestDiscoveryCorrections(normalized)
      };
      if (useCache) {
        await writeAddressDiscoveryCache(normalized, result);
      }
      return result;
    }
  } catch (error) {
    if (cachedResult?.candidates?.length) {
      return {
        ...cachedResult,
        normalizedAddress: normalized,
        cacheHit: true,
        errors: [
          {
            source: "local_discovery_cache",
            code: "local_discovery_cache_reused_after_upstream_error",
            message: `\u4FBF\u6C11\u7CFB\u7D71\u66AB\u6642\u7570\u5E38\uFF0C\u5DF2\u6539\u7528\u524D\u6B21\u6210\u529F\u7D50\u679C\uFF1A${error instanceof Error ? error.message : "\u5730\u5740\u8CC7\u6599\u9700\u8981\u4EBA\u5DE5\u78BA\u8A8D"}`
          },
          ...cachedResult.errors
        ]
      };
    }
    const fallbackRun = await getLatestDiscoveryRun(normalized);
    const runError = fallbackRun?.candidate_json?.errors?.[0];
    return fallbackManualResult(normalized, runError ?? {
      source: "easymap_r02",
      code: "easymap_r02_unavailable",
      message: error instanceof Error ? error.message : "\u5730\u5740\u8CC7\u6599\u9700\u8981\u4EBA\u5DE5\u78BA\u8A8D"
    });
  }
  if (cachedResult?.candidates?.length) {
    return {
      ...cachedResult,
      normalizedAddress: normalized,
      cacheHit: true,
      errors: [
        {
          source: "local_discovery_cache",
          code: "local_discovery_cache_reused_after_empty_result",
          message: "\u672C\u6B21\u4FBF\u6C11\u7CFB\u7D71\u672A\u56DE\u5019\u9078\uFF0C\u5DF2\u6539\u7528\u524D\u6B21\u6210\u529F\u7D50\u679C"
        },
        ...cachedResult.errors
      ]
    };
  }
  const run = await getLatestDiscoveryRun(normalized);
  const runErrors = run?.candidate_json?.errors ?? [];
  const statusError = runErrors[0] ?? {
    source: "easymap_r02",
    code: "easymap_r02_no_candidate",
    message: "\u67E5\u4E0D\u5230\u53EF\u76F4\u63A5\u88DC\u9F4A\u7684\u5730\u5740\u5019\u9078\uFF0C\u8ACB\u4EBA\u5DE5\u78BA\u8A8D\u5730\u6BB5\u3001\u5730\u865F\u3001\u5EFA\u865F"
  };
  return fallbackManualResult(normalized, statusError);
}
function parseEasyMapLandByCoordinatePayload(payload) {
  let json;
  try {
    json = JSON.parse(payload);
  } catch {
    return null;
  }
  if (String(json.exec ?? "").toLowerCase() !== "true") return null;
  const cityName = pickString2(json, "cityName");
  const townName = pickString2(json, "townName");
  const cityCode = pickString2(json, "cityCode");
  const townCode = pickString2(json, "townCode");
  const office = pickString2(json, "office");
  const sectionCode = pickString2(json, "sectNo");
  const sectionName = pickString2(json, "sectName");
  const landNo = normalizeLandNo(pickString2(json, "landNo"));
  if (!cityName || !townName || !cityCode || !townCode || !office || !sectionCode || !sectionName || !landNo) {
    return null;
  }
  const coordinate = parseEasyMapCoordinatePayload(payload);
  return { cityName, townName, cityCode, townCode, office, sectionCode, sectionName, landNo, ...coordinate };
}
function parseEasyMapCoordinatePayload(payload) {
  let json;
  try {
    json = JSON.parse(payload);
  } catch {
    return null;
  }
  const lng = pickNumber(json, ["X", "x", "lng", "lon", "longitude"]);
  const lat = pickNumber(json, ["Y", "y", "lat", "latitude"]);
  if (lng === void 0 || lat === void 0) {
    return null;
  }
  return { lat, lng };
}
function parseEasyMapSectionListPayload(payload, targetSectionName, context) {
  let json;
  try {
    json = JSON.parse(payload);
  } catch {
    return null;
  }
  const target = normalizeSectionName(targetSectionName);
  const candidates = collectSectionCandidates(json, context);
  const matched = candidates.find((candidate) => normalizeSectionName(candidate.sectionName) === target) ?? candidates.find((candidate) => normalizeSectionName(candidate.sectionName).includes(target) || target.includes(normalizeSectionName(candidate.sectionName))) ?? candidates[0] ?? null;
  if (!matched) return null;
  return { ...matched, landNo: "" };
}
function parseEasyMapTownListPayload(payload) {
  let json;
  try {
    json = JSON.parse(payload);
  } catch {
    return [];
  }
  if (!Array.isArray(json)) return [];
  return json.map((item) => {
    if (!item || typeof item !== "object") return null;
    const record = item;
    const id = pickString2(record, "id");
    const name = pickString2(record, "name");
    return id && name ? { id, name } : null;
  }).filter((item) => item !== null);
}
function parseEasyMapRoadListPayload(payload) {
  let json;
  try {
    json = JSON.parse(payload);
  } catch {
    return [];
  }
  if (!Array.isArray(json)) return [];
  return json.map((item) => {
    if (!item || typeof item !== "object") return null;
    const record = item;
    const srcName = pickString2(record, "srcName");
    const name = pickString2(record, "name");
    return srcName && name ? { srcName, name } : null;
  }).filter((item) => item !== null);
}
function pickBestR02Road(roads, roadName) {
  if (roads.length === 0) return null;
  const target = normalizeRoadName(roadName);
  return roads.find((road) => normalizeRoadName(road.name) === target) ?? roads.find((road) => normalizeRoadName(road.srcName) === target) ?? roads.find((road) => normalizeRoadName(road.name).endsWith(target)) ?? roads.find((road) => normalizeRoadName(road.srcName).endsWith(target)) ?? null;
}
function buildR02DoorQueryRoadValues(roadName, road) {
  return Array.from(new Set([
    road?.srcName,
    road?.name,
    ...buildRoadNameQueryVariants(roadName)
  ].filter((value) => Boolean(value))));
}
function parseEasyMapLandDescriptionHtml(html) {
  const buildingNumbers = Array.from(html.matchAll(/getBuildDetail\('[^']*','[^']*','(\d{8})'/g)).map((match) => match[1]).filter((value, index, values) => value && values.indexOf(value) === index);
  const rows = parseHtmlTableRows(html);
  const valueByKeyMatch = (pattern) => {
    const matched = Object.entries(rows).find(([key]) => pattern.test(key));
    return matched?.[1];
  };
  return {
    buildingNumbers,
    landAreaSqm: firstNumericText(rows["\u9762\u7A4D"] ?? valueByKeyMatch(/面積/)),
    zoning: rows["\u4F7F\u7528\u5206\u5340"] ?? valueByKeyMatch(/使用分區|都市計畫|非都市土地使用分區/) ?? null,
    announcedLandCurrentValue: firstNumericText(rows["\u516C\u544A\u571F\u5730\u73FE\u503C"] ?? rows["\u516C\u544A\u73FE\u503C"] ?? valueByKeyMatch(/公告.*現值/)),
    announcedLandValue: firstNumericText(rows["\u516C\u544A\u571F\u5730\u5730\u50F9"] ?? rows["\u516C\u544A\u5730\u50F9"] ?? valueByKeyMatch(/公告.*地價/))
  };
}
function parseEasyMapBuildingDescriptionHtml(html) {
  const rows = parseHtmlTableRows(html);
  const section = splitSection(rows["\u5730\u6BB5"]);
  const completion = rows["\u5EFA\u7269\u5B8C\u6210\u65E5\u671F"] ?? null;
  return {
    administrativeDistrict: rows["\u884C\u653F\u5340"] ?? null,
    landOffice: rows["\u5730\u653F\u4E8B\u52D9\u6240"] ?? null,
    sectionCode: section.code,
    sectionName: section.name,
    buildingNo: firstDigits(rows["\u5EFA\u865F"]),
    buildingAreaSqm: firstNumericText(rows["\u5EFA\u7269\u9762\u7A4D"]),
    totalFloorCount: firstDigits(rows["\u6A13\u5C64\u6578"]),
    floorLabel: rows["\u6A13\u5C64\u5225"] ?? null,
    completionDateRoc: firstRocDateText(completion),
    ageYears: completion?.match(/屋齡[:：]?約?\s*(\d+)年/)?.[1] ?? null,
    mainUse: rows["\u4E3B\u8981\u7528\u9014"] ?? null
  };
}
function firstRocDateText(value) {
  if (!value) return null;
  return value.match(/\d{2,3}\/\d{1,2}\/\d{1,2}/)?.[0] ?? value.match(/\d{7}/)?.[0] ?? firstDigits(value);
}
function emptyBuildingDescription() {
  return {
    administrativeDistrict: null,
    landOffice: null,
    sectionCode: null,
    sectionName: null,
    buildingNo: null,
    buildingAreaSqm: null,
    totalFloorCount: null,
    floorLabel: null,
    completionDateRoc: null,
    ageYears: null,
    mainUse: null
  };
}
function emptyLandDescription() {
  return {
    buildingNumbers: [],
    landAreaSqm: null,
    zoning: null,
    announcedLandCurrentValue: null,
    announcedLandValue: null
  };
}
function parseHtmlTableRows(html) {
  const rows = {};
  for (const row of html.match(/<tr[\s\S]*?<\/tr>/g) ?? []) {
    const cells = Array.from(row.matchAll(/<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/g)).map((match) => decodeHtml(stripHtml(match[1]))).filter(Boolean);
    if (cells.length >= 2) {
      rows[cells[0]] = cells[1];
    }
  }
  return rows;
}
function parseEasyMapDoorCandidateListPayload(payload) {
  let json;
  try {
    json = JSON.parse(payload);
  } catch {
    return [];
  }
  const results = Array.isArray(json?.results) ? json.results : [];
  return results.map(parseEasyMapDoorCandidate).filter((candidate) => candidate !== null);
}
function parseEasyMapDoorCandidate(input) {
  if (!input || typeof input !== "object") return null;
  const record = input;
  const doorplate = pickString2(record, "Road") ?? pickString2(record, "road") ?? "";
  const sourceDoorplate = pickString2(record, "srcRoad") ?? doorplate;
  const office = pickString2(record, "office") ?? "";
  const sectionCode = firstListValue(pickString2(record, "sectno") ?? "");
  const sectionName = pickString2(record, "sectName") ?? "";
  const landNo = firstListValue(pickString2(record, "landno") ?? "");
  const buildingNo = pickString2(record, "buildno") ?? "";
  if (!doorplate || !office || !sectionCode) return null;
  return {
    doorplate,
    sourceDoorplate,
    cityCode: pickString2(record, "City") ?? "",
    townCode: pickString2(record, "towncode") ?? "",
    office,
    sectionCode,
    sectionName,
    landNo,
    buildingSectionCode: pickString2(record, "buildsectno") ?? sectionCode,
    buildingNo,
    mergeSameDoorCount: Number(record.mergeSameDoorCount ?? 0) || 0
  };
}
function collectSectionCandidates(input, context) {
  if (Array.isArray(input)) {
    return input.flatMap((item) => collectSectionCandidates(item, context));
  }
  if (!input || typeof input !== "object") {
    return [];
  }
  const record = input;
  const sectionCode = pickString2(record, "sectNo") ?? pickString2(record, "sectionCode") ?? pickString2(record, "id");
  const sectionName = pickString2(record, "sectName") ?? pickString2(record, "sectionName") ?? pickString2(record, "name");
  const cityName = pickString2(record, "cityName") ?? context?.cityName ?? null;
  const townName = pickString2(record, "townName") ?? context?.townName ?? null;
  const cityCode = pickString2(record, "cityCode") ?? context?.cityCode ?? null;
  const townCode = pickString2(record, "townCode") ?? context?.townCode ?? null;
  const office = pickString2(record, "office") ?? pickString2(record, "officeCode");
  const current = cityName && townName && cityCode && townCode && office && sectionCode && sectionName ? [{ cityName, townName, cityCode, townCode, office, sectionCode, sectionName, landNo: "" }] : [];
  return [
    ...current,
    ...Object.values(record).flatMap((value) => collectSectionCandidates(value, context))
  ];
}
function normalizeSectionName(value) {
  return value.trim().replace(/\s+/g, "").replace(/^臺/, "\u53F0").replace(/墘/g, "\u524D");
}
function normalizeRoadName(value) {
  return convertChineseAddressNumerals2(toHalfWidthDigits(value).trim().replace(/\s+/g, "").replace(/^臺/, "\u53F0"));
}
function normalizeAdministrativeName(value) {
  const normalized = value.trim().replace(/\s+/g, "").replace(/^臺/, "\u53F0").replace(/[區鄉鎮]$/, "");
  if (normalized.endsWith("\u5E02") && normalized.length > 2) {
    return normalized.slice(0, -1);
  }
  return normalized;
}
function lookupKnownTownCode(cityCode, townName) {
  const key = `${cityCode}:${normalizeAdministrativeName(townName)}`;
  return KNOWN_R02_TOWN_CODES[key] ?? null;
}
function selectDoorCandidatesForAddress(candidates, address) {
  if (candidates.length <= 1) return candidates;
  const normalizedTarget = normalizeDoorCandidateMatch(address);
  const exactDoorMatches = candidates.filter((candidate) => normalizeDoorCandidateMatch(candidate.doorplate) === normalizedTarget);
  const narrowedByDoorplate = exactDoorMatches.length > 0 ? exactDoorMatches : candidates;
  const floorKey = extractFloorKey(address);
  if (!floorKey) return narrowedByDoorplate;
  const matched = narrowedByDoorplate.filter((candidate) => extractFloorKey(candidate.doorplate) === floorKey);
  return matched.length > 0 ? matched : narrowedByDoorplate;
}
function buildDoorParcel(inputAddress, candidate, description, coordinate = null) {
  const sectionCode = description.sectionCode ?? candidate.buildingSectionCode ?? candidate.sectionCode;
  const sectionName = description.sectionName ?? candidate.sectionName;
  const buildingNumber = description.buildingNo ?? candidate.buildingNo;
  const landNo = normalizeLandNo(candidate.landNo) ?? candidate.landNo;
  return {
    address: candidate.doorplate || inputAddress,
    lot_number: landNo,
    section_name: sectionName,
    section_code: sectionCode,
    land_office: candidate.office,
    source: "easymap_r02",
    trusted_for_pdf: false,
    parcel_id: `${candidate.office}-${sectionCode}-${buildingNumber || landNo}`,
    building_number: buildingNumber ?? "",
    building_area_sqm: description.buildingAreaSqm ?? void 0,
    total_floor_count: description.totalFloorCount ?? void 0,
    floor_label: description.floorLabel ?? void 0,
    completion_date_roc: description.completionDateRoc ?? void 0,
    age_years: description.ageYears ?? void 0,
    main_use: description.mainUse ?? void 0,
    lat: coordinate?.lat,
    lng: coordinate?.lng
  };
}
function buildEasyMapLandParcels(inputAddress, land, description, coordinate = null) {
  const base = {
    address: inputAddress,
    lot_number: land.landNo,
    section_name: land.sectionName,
    section_code: land.sectionCode,
    land_office: land.office,
    source: "easymap_r02",
    trusted_for_pdf: false,
    land_area_sqm: description.landAreaSqm ?? void 0,
    zoning: description.zoning ?? void 0,
    announced_land_current_value: description.announcedLandCurrentValue ?? void 0,
    announced_land_value: description.announcedLandValue ?? void 0,
    lat: coordinate?.lat ?? land.lat,
    lng: coordinate?.lng ?? land.lng
  };
  return normalizeParcelCandidateMetadata([{
    ...base,
    parcel_id: `${land.office}-${land.sectionCode}-${land.landNo}`,
    building_number: ""
  }]);
}
function pickNumber(input, keys) {
  for (const key of keys) {
    const value = input[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return void 0;
}
function normalizeParcelCandidateMetadata(candidates) {
  const confidence = candidates.length > 1 ? "needs_selection" : "high";
  return candidates.map((candidate) => ({
    ...candidate,
    discovery_confidence: candidate.discovery_confidence ?? confidence,
    object_type: candidate.building_number ? "building" : "land",
    confirmation_state: candidate.confirmation_state ?? "unconfirmed"
  }));
}
function parseTaiwanAddress(address) {
  const normalized = normalizeDiscoveryAddressText(address);
  const match = normalized.match(/^(?<city>[^縣市]+[縣市])(?<town>[^區鄉鎮市]+[區鄉鎮市])(?<rest>.+)$/);
  if (!match?.groups) return null;
  const cityName = match.groups.city.replace(/^台/, "\u81FA");
  const cityCode = CITY_CODE_BY_NAME[cityName] ?? CITY_CODE_BY_NAME[cityName.replace(/^臺/, "\u53F0")];
  if (!cityCode) return null;
  const rest = match.groups.rest.replace(/^\S+?里\d*鄰/, "").replace(/^\S+?里/, "");
  const noMatch = rest.match(/(?<no>\d+(?:-\d+)?)號/);
  if (!noMatch?.groups) return null;
  const afterNo = rest.slice((noMatch.index ?? 0) + noMatch[0].length);
  const floor = parseFloorSuffix(afterNo);
  const beforeNo = rest.slice(0, noMatch.index);
  const alleyMatch = beforeNo.match(/(\d+)弄$/);
  const beforeAlley = alleyMatch ? beforeNo.slice(0, alleyMatch.index) : beforeNo;
  const laneMatch = beforeAlley.match(/(\d+)巷$/);
  const roadName = laneMatch ? beforeAlley.slice(0, laneMatch.index) : beforeAlley;
  const laneName = laneMatch?.[1] ?? "";
  const alleyName = alleyMatch?.[1] ?? "";
  if (!roadName) return null;
  return {
    cityName,
    cityCode,
    townName: match.groups.town,
    roadName,
    laneName,
    alleyName,
    no: noMatch.groups.no,
    floorNumber: floor.floorNumber,
    floorUnit: floor.floorUnit
  };
}
function normalizeLandNo(value) {
  if (!value) return null;
  const normalized = toHalfWidthDigits(value).trim();
  const branchMatch = normalized.match(/(\d{1,4})\s*(?:-|之)\s*(\d{1,4})/);
  if (branchMatch) {
    return `${branchMatch[1].padStart(4, "0")}${branchMatch[2].padStart(4, "0")}`;
  }
  const digits = normalized.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length <= 4) {
    return `${digits.padStart(4, "0")}0000`;
  }
  return digits.padStart(8, "0").slice(-8);
}
function formatEasyMapLandNoForDetail(value) {
  const digits = toHalfWidthDigits(value).replace(/\D/g, "");
  if (!digits) return "0";
  if (digits.length === 8) {
    const main = digits.slice(0, 4).replace(/^0+/, "") || "0";
    const sub = digits.slice(4).replace(/^0+/, "");
    return sub ? `${main}-${sub}` : main;
  }
  return digits.replace(/^0+/, "") || "0";
}
function toHalfWidthDigits(value) {
  return value.replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 65248));
}
function normalizeDiscoveryAddressText(value) {
  return convertChineseAddressNumerals2(toHalfWidthDigits(value).replace(/\s+/g, ""));
}
function convertChineseAddressNumerals2(value) {
  return value.replace(/([零一二兩三四五六七八九十百]+)(?=[段巷弄號樓])/g, (match) => {
    const parsed = parseChineseInteger2(match);
    return parsed === null ? match : String(parsed);
  }).replace(/之([零一二兩三四五六七八九十百]+)/g, (_match, digits) => {
    const parsed = parseChineseInteger2(digits);
    return parsed === null ? `\u4E4B${digits}` : `\u4E4B${parsed}`;
  });
}
function buildRoadNameQueryVariants(roadName) {
  const variants = [
    roadName,
    roadName.replace(/(\d+)(?=段)/g, (match) => integerToChineseNumber(Number(match))),
    roadName.replace(/([零一二兩三四五六七八九十百]+)(?=段)/g, (match) => {
      const parsed = parseChineseInteger2(match);
      return parsed === null ? match : String(parsed);
    })
  ];
  return Array.from(new Set(variants.filter(Boolean)));
}
function integerToChineseNumber(value) {
  const digits = ["\u96F6", "\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u4E03", "\u516B", "\u4E5D"];
  if (!Number.isInteger(value) || value < 0 || value >= 100) return String(value);
  if (value < 10) return digits[value];
  const tens = Math.floor(value / 10);
  const ones = value % 10;
  const tenPart = tens === 1 ? "\u5341" : `${digits[tens]}\u5341`;
  return ones === 0 ? tenPart : `${tenPart}${digits[ones]}`;
}
function stripHtml(value) {
  return value.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function summarizeUpstreamText(value) {
  return stripHtml(value).slice(0, 180);
}
function firstNumericText(value) {
  return value?.match(/\d[\d,]*(?:\.\d+)?/)?.[0] ?? null;
}
function firstDigits(value) {
  return value?.match(/\d+/)?.[0] ?? null;
}
function splitSection(value) {
  if (!value) return { code: null, name: null };
  const match = value.match(/(?<code>\d{4})\s*(?<name>.+段)/);
  if (!match?.groups) {
    return { code: firstDigits(value), name: value.replace(/^\d{4}\s*/, "").trim() || null };
  }
  return {
    code: match.groups.code,
    name: match.groups.name.trim()
  };
}
function firstListValue(value) {
  return value.split(",").map((item) => item.trim()).find(Boolean) ?? "";
}
function normalizeDoorCandidateMatch(value) {
  return normalizeDiscoveryAddressText(value).replace(/臺/g, "\u53F0").replace(/[里鄰\s]/g, "").trim();
}
function parseFloorSuffix(value) {
  const normalized = normalizeDiscoveryAddressText(value);
  const match = normalized.match(/^(?<floor>\d+|[一二三四五六七八九十百]+)樓(?:之(?<unit>\d+|[一二三四五六七八九十]+))?/);
  if (!match?.groups) {
    return { floorNumber: "", floorUnit: "" };
  }
  return {
    floorNumber: normalizeChineseNumber(match.groups.floor),
    floorUnit: normalizeChineseNumber(match.groups.unit ?? "")
  };
}
function extractFloorKey(value) {
  const normalized = normalizeDiscoveryAddressText(value);
  const match = normalized.match(/號(?<floor>\d+|[一二三四五六七八九十百]+)樓(?:之(?<unit>\d+|[一二三四五六七八九十]+))?/);
  if (!match?.groups) return null;
  const floor = normalizeChineseNumber(match.groups.floor);
  const unit = normalizeChineseNumber(match.groups.unit ?? "");
  return floor ? `${floor}:${unit}` : null;
}
function extractFloorLabelKey(value) {
  if (!value) return null;
  const normalized = normalizeDiscoveryAddressText(value);
  const match = normalized.match(/(?<floor>\d+|[一二三四五六七八九十百]+)樓(?:之(?<unit>\d+|[一二三四五六七八九十]+))?/);
  if (!match?.groups) return null;
  const floor = normalizeChineseNumber(match.groups.floor);
  const unit = normalizeChineseNumber(match.groups.unit ?? "");
  return floor ? `${floor}:${unit}` : null;
}
function normalizeChineseNumber(value) {
  if (!value) return "";
  const half = toHalfWidthDigits(value);
  if (/^\d+$/.test(half)) return String(Number(half));
  const parsed = parseChineseInteger2(half);
  return parsed === null ? half : String(parsed);
}
function parseChineseInteger2(value) {
  const digitMap = {
    \u96F6: 0,
    \u4E00: 1,
    \u4E8C: 2,
    \u5169: 2,
    \u4E09: 3,
    \u56DB: 4,
    \u4E94: 5,
    \u516D: 6,
    \u4E03: 7,
    \u516B: 8,
    \u4E5D: 9
  };
  if (value in digitMap) return digitMap[value];
  const tenIndex = value.indexOf("\u5341");
  if (tenIndex >= 0) {
    const before = value.slice(0, tenIndex);
    const after = value.slice(tenIndex + 1);
    const tens = before ? digitMap[before] : 1;
    const ones = after ? digitMap[after] : 0;
    if (typeof tens === "number" && typeof ones === "number") {
      return tens * 10 + ones;
    }
  }
  return null;
}
function splitSetCookieHeader(value) {
  if (!value) return [];
  return value.split(/,(?=[^;,]+=)/g);
}
function decodeHtml(value) {
  return value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}
function pickString2(input, key) {
  const value = input[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
var CITY_CODE_BY_NAME = {
  \u57FA\u9686\u5E02: "C",
  \u81FA\u5317\u5E02: "A",
  \u53F0\u5317\u5E02: "A",
  \u65B0\u5317\u5E02: "F",
  \u6843\u5712\u5E02: "H",
  \u65B0\u7AF9\u5E02: "O",
  \u65B0\u7AF9\u7E23: "J",
  \u82D7\u6817\u7E23: "K",
  \u81FA\u4E2D\u5E02: "B",
  \u53F0\u4E2D\u5E02: "B",
  \u5357\u6295\u7E23: "M",
  \u5F70\u5316\u7E23: "N",
  \u96F2\u6797\u7E23: "P",
  \u5609\u7FA9\u5E02: "I",
  \u5609\u7FA9\u7E23: "Q",
  \u81FA\u5357\u5E02: "D",
  \u53F0\u5357\u5E02: "D",
  \u9AD8\u96C4\u5E02: "E",
  \u5C4F\u6771\u7E23: "T",
  \u5B9C\u862D\u7E23: "G",
  \u82B1\u84EE\u7E23: "U",
  \u81FA\u6771\u7E23: "V",
  \u53F0\u6771\u7E23: "V",
  \u6F8E\u6E56\u7E23: "X",
  \u91D1\u9580\u7E23: "W",
  \u9023\u6C5F\u7E23: "Z"
};
var KNOWN_R02_TOWN_CODES = {
  "D:\u6771\u5340": "01",
  "D:\u6C38\u5EB7\u5340": "39",
  "E:\u82D3\u96C5\u5340": "08",
  "O:\u5317\u5340": "01",
  "O:\u65B0\u7AF9\u5E02": "01"
};
export {
  discoverAddressLocally,
  formatEasyMapLandNoForDetail,
  parseEasyMapBuildingDescriptionHtml,
  parseEasyMapLandByCoordinatePayload,
  parseEasyMapLandDescriptionHtml,
  parseEasyMapSectionListPayload,
  parseEasyMapTownListPayload
};
