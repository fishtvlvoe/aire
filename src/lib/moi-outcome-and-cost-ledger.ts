import type { ServiceCatalogEntry, ServicePricePolicy } from "@/lib/moi-service-catalog";

export type MoiOutcome =
  | "transport_failure"
  | "moi_success"
  | "empty_success"
  | "domain_failure"
  | "restricted_failure"
  | "parse_failure";

export interface OutcomeInput {
  httpStatus?: number | null;
  transportError?: boolean;
  moiStatus?: number | string | null;
  moiCode?: string | null;
  moiMessage?: string | null;
  returnRows?: number | null;
  parseOk?: boolean;
  allowEmptySuccess?: boolean;
  restricted?: boolean;
}

export interface CostInput {
  catalogEntry: ServiceCatalogEntry;
  outcome: MoiOutcome;
  returnRows?: number | null;
  locationCount?: number | null;
  durationUnits?: number | null;
  explicitBillableOverride?: boolean;
}

export interface UsageLedgerRecord {
  serviceCode: string;
  transactionId: string | null;
  requestFingerprint: string;
  startedAt: string;
  finishedAt: string;
  httpStatus: number | null;
  moiStatus: string | null;
  moiCode: string | null;
  moiMessage: string | null;
  returnRows: number | null;
  outcome: MoiOutcome;
  pricePolicy: ServicePricePolicy;
  billableAmount: number;
  caseReference: string | null;
  localUserReference: string | null;
  pricingResolved: boolean;
  note?: string;
}

export interface UsageLedgerSummary {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalReturnRows: number;
  unpaidAmount: number;
}

export function classifyMoiOutcome(input: OutcomeInput): MoiOutcome {
  if (input.transportError) return "transport_failure";
  if (input.restricted) return "restricted_failure";
  if (input.parseOk === false) return "parse_failure";
  if (input.httpStatus !== undefined && input.httpStatus !== null && input.httpStatus >= 400) {
    return "transport_failure";
  }

  const code = `${input.moiCode ?? ""}`.trim().toUpperCase();
  const status = `${input.moiStatus ?? ""}`.trim();
  const returnRows = Number(input.returnRows ?? 0);

  if (code === "COP309") return "domain_failure";
  if (status === "0" && code && /COP3\d+/.test(code)) return "domain_failure";
  if (returnRows === 0 && input.allowEmptySuccess) return "empty_success";
  if (returnRows === 0 && status === "1") return "empty_success";
  if (status === "1" || status === "OK") return "moi_success";
  if (returnRows > 0) return "moi_success";
  return "domain_failure";
}

export function calculateBillableAmount(input: CostInput): number {
  if (input.explicitBillableOverride === false) return 0;

  if (
    input.outcome === "transport_failure" ||
    input.outcome === "restricted_failure" ||
    input.outcome === "parse_failure" ||
    input.outcome === "domain_failure"
  ) {
    return 0;
  }

  const policy = input.catalogEntry.pricePolicy;
  const unitPrice = input.catalogEntry.unitPrice ?? 0;
  const rows = Number(input.returnRows ?? 0);
  const locations = Number(input.locationCount ?? 0);
  const duration = Number(input.durationUnits ?? 0);

  switch (policy) {
    case "free":
    case "auth_free":
    case "restricted":
      return 0;
    case "price_by_row":
      return Math.max(rows, 0) * unitPrice;
    case "price_by_location":
      return Math.max(locations, 0) * unitPrice;
    case "price_by_duration":
      return Math.max(duration, 0) * unitPrice;
    case "unknown":
      return 0;
    default:
      return 0;
  }
}

export function createUsageLedgerRecord(input: {
  serviceCode: string;
  transactionId?: string | null;
  requestFingerprint: string;
  startedAt: string;
  finishedAt: string;
  httpStatus?: number | null;
  moiStatus?: string | number | null;
  moiCode?: string | null;
  moiMessage?: string | null;
  returnRows?: number | null;
  outcome: MoiOutcome;
  pricePolicy: ServicePricePolicy;
  billableAmount: number;
  caseReference?: string | null;
  localUserReference?: string | null;
  pricingResolved?: boolean;
  note?: string;
}): UsageLedgerRecord {
  return {
    serviceCode: input.serviceCode,
    transactionId: input.transactionId ?? null,
    requestFingerprint: input.requestFingerprint,
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
    httpStatus: input.httpStatus ?? null,
    moiStatus: input.moiStatus === undefined || input.moiStatus === null ? null : String(input.moiStatus),
    moiCode: input.moiCode ?? null,
    moiMessage: input.moiMessage ?? null,
    returnRows: input.returnRows ?? null,
    outcome: input.outcome,
    pricePolicy: input.pricePolicy,
    billableAmount: input.billableAmount,
    caseReference: input.caseReference ?? null,
    localUserReference: input.localUserReference ?? null,
    pricingResolved: input.pricingResolved ?? input.pricePolicy !== "unknown",
    note: input.note,
  };
}

export function summarizeUsageLedger(records: UsageLedgerRecord[]): UsageLedgerSummary {
  return records.reduce<UsageLedgerSummary>(
    (summary, record) => {
      summary.totalCalls += 1;
      if (record.outcome === "moi_success" || record.outcome === "empty_success") {
        summary.successfulCalls += 1;
      } else {
        summary.failedCalls += 1;
      }
      summary.totalReturnRows += Number(record.returnRows ?? 0);
      summary.unpaidAmount += Number(record.billableAmount ?? 0);
      return summary;
    },
    {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      totalReturnRows: 0,
      unpaidAmount: 0,
    },
  );
}

export function buildUsageLedgerRecordFromOutcome(input: {
  catalogEntry: ServiceCatalogEntry;
  serviceCode: string;
  requestFingerprint: string;
  startedAt: string;
  finishedAt: string;
  outcome: MoiOutcome;
  transactionId?: string | null;
  httpStatus?: number | null;
  moiStatus?: string | number | null;
  moiCode?: string | null;
  moiMessage?: string | null;
  returnRows?: number | null;
  caseReference?: string | null;
  localUserReference?: string | null;
  locationCount?: number | null;
  durationUnits?: number | null;
  note?: string;
}): UsageLedgerRecord {
  const billableAmount = calculateBillableAmount({
    catalogEntry: input.catalogEntry,
    outcome: input.outcome,
    returnRows: input.returnRows,
    locationCount: input.locationCount,
    durationUnits: input.durationUnits,
  });
  return createUsageLedgerRecord({
    serviceCode: input.serviceCode,
    transactionId: input.transactionId,
    requestFingerprint: input.requestFingerprint,
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
    httpStatus: input.httpStatus,
    moiStatus: input.moiStatus,
    moiCode: input.moiCode,
    moiMessage: input.moiMessage,
    returnRows: input.returnRows,
    outcome: input.outcome,
    pricePolicy: input.catalogEntry.pricePolicy,
    billableAmount,
    caseReference: input.caseReference,
    localUserReference: input.localUserReference,
    pricingResolved: input.catalogEntry.pricePolicy !== "unknown",
    note: input.note,
  });
}
