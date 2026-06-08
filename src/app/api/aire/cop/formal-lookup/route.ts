import { NextResponse } from "next/server";
import { buildCustomerCopLineItems, sanitizeCustomerCopPayload } from "@/lib/customer-cop-formal-supplement";
import { resolveAireRequestContext } from "@/lib/server/aire-request-context";
import { readRawAireCopCredential } from "@/lib/server/aire-cop-credential-store";
import { writeAireCopQueryLedgerRecord } from "@/lib/server/aire-cop-query-ledger";
import { pullFormalRegistryLocally } from "@/lib/server/local-formal-pull-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface FormalLookupBody {
  caseId?: unknown;
  caseLocalId?: unknown;
  registryKey?: {
    office?: unknown;
    section?: unknown;
    landNo?: unknown;
    buildingNo?: unknown;
  } | unknown;
  address?: unknown;
  apiIds?: unknown;
  ownerAuthorizationId?: unknown;
  paidConsentId?: unknown;
  consentId?: unknown;
}

export async function POST(request: Request) {
  const auth = resolveAireRequestContext(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: FormalLookupBody;
  try {
    body = (await request.json()) as FormalLookupBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const caseId = stringField(body.caseId) ?? stringField(body.caseLocalId);
  const apiIds = Array.isArray(body.apiIds) ? body.apiIds.filter(isString) : ["land_registry"];
  const parsedRegistryKey = parseRegistryKey(body.registryKey);
  const office = parsedRegistryKey.office;
  const section = parsedRegistryKey.section;
  const landNo = parsedRegistryKey.landNo;
  const buildingNo = parsedRegistryKey.buildingNo;
  const paidConsentId = stringField(body.paidConsentId) ?? stringField(body.consentId);
  const runId = createAireCopRunId();

  if (!office || !section || !landNo) {
    return NextResponse.json(
      {
        error: "confirmed_registry_key_required",
        required: ["office", "section", "landNo"],
      },
      { status: 422 },
    );
  }

  if (apiIds.some(isBuildingApi) && !buildingNo) {
    return NextResponse.json({ error: "building_no_required" }, { status: 422 });
  }

  const lineItems = buildCustomerCopLineItems(apiIds);
  const estimatedCost = lineItems.reduce((sum, item) => sum + item.estimatedCost, 0);
  const ledgerBase = {
    runId,
    workspaceId: auth.context.workspaceId,
    caseId: caseId || "unknown-case",
    registryKey: buildLedgerRegistryKey({ office, section, landNo, buildingNo }),
    apiCodes: apiIds,
    lineItems,
    estimatedCost,
    requestJson: sanitizeCustomerCopPayload({ ...body, registryKey: { office, section, landNo, buildingNo } }),
  };
  const credential = await readRawAireCopCredential(auth.context.workspaceId);
  if (!credential) {
    const responseJson = { blocker: "missing_cop_credential", runId };
    await writeAireCopQueryLedgerRecord({
      ...ledgerBase,
      status: "blocked",
      blockerCode: "missing_cop_credential",
      responseJson,
    });
    return NextResponse.json(responseJson, { status: 409 });
  }

  if (!paidConsentId) {
    const responseJson = { blocker: "missing_paid_consent", runId };
    await writeAireCopQueryLedgerRecord({
      ...ledgerBase,
      status: "blocked",
      blockerCode: "missing_paid_consent",
      responseJson,
      rawSecretMarkers: [credential.clientSecret],
    });
    return NextResponse.json(responseJson, { status: 409 });
  }

  if (!stringField(body.ownerAuthorizationId)) {
    const responseJson = { blocker: "missing_owner_authorization", runId };
    await writeAireCopQueryLedgerRecord({
      ...ledgerBase,
      status: "blocked",
      blockerCode: "missing_owner_authorization",
      responseJson,
      rawSecretMarkers: [credential.clientSecret],
    });
    return NextResponse.json(responseJson, { status: 409 });
  }

  const formalResult = await pullFormalRegistryLocally({
    caseId: caseId || "unknown-case",
    apiIds,
    address: stringField(body.address),
    clientId: credential.clientId,
    secret: credential.clientSecret,
    target: {
      office_code: office,
      section_code: section,
      section_name: section,
      land_no: landNo,
      building_no: buildingNo,
    },
  });
  const responseJson = {
    status: "success",
    runId,
    results: sanitizeCustomerCopPayload(formalResult.results),
    lineItems,
    costSummary: {
      estimatedCost,
      actualCost: formalResult.total_cost,
      credentialOwner: auth.context.workspaceId,
    },
    provenance: {
      source: "正式 COP",
      sourceRunId: runId,
      apiCodes: apiIds,
    },
    cacheHit: formalResult.cache_hit,
    sourceRunId: formalResult.source_run_id,
  };
  await writeAireCopQueryLedgerRecord({
    ...ledgerBase,
    status: "success",
    actualCost: formalResult.cache_hit ? 0 : formalResult.total_cost,
    cacheHit: formalResult.cache_hit,
    sourceRunId: formalResult.source_run_id,
    responseJson,
    rawSecretMarkers: [credential.clientSecret],
  });

  return NextResponse.json(responseJson);
}

function parseRegistryKey(input: unknown): {
  office: string | null;
  section: string | null;
  landNo: string | null;
  buildingNo: string | null;
} {
  if (typeof input === "string" && input.trim()) {
    const parts = input.trim().split("-");
    const office = parts[0];
    const section = parts[1];
    const remainder = parts.slice(2);
    const landNo = remainder.length >= 2 ? remainder.slice(0, 2).join("-") : remainder[0];
    const buildingNo = remainder.length > 2 ? remainder.slice(2).join("-") : null;
    return {
      office: office?.trim() || null,
      section: section?.trim() || null,
      landNo: landNo?.trim() || null,
      buildingNo: buildingNo?.trim() || null,
    };
  }
  const record = input && typeof input === "object" && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
  return {
    office: stringField(record.office),
    section: stringField(record.section),
    landNo: stringField(record.landNo),
    buildingNo: stringField(record.buildingNo),
  };
}

function stringField(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function isBuildingApi(apiId: string): boolean {
  return apiId.startsWith("building_");
}

function buildLedgerRegistryKey(input: {
  office: string;
  section: string;
  landNo: string;
  buildingNo: string | null;
}): string {
  return [input.office, input.section, input.landNo, input.buildingNo].filter(Boolean).join("-");
}

function createAireCopRunId(): string {
  return `aire-cop-${new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
