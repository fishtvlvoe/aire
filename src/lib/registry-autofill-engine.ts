import type { PropertyTypeId } from "@/lib/property-type-registry";
import type { ServiceCatalogEntry } from "@/lib/moi-service-catalog";
import {
  type AutomationState,
  type DisclosureFieldSourceMatrixRow,
  type FieldGapResolution,
} from "@/lib/disclosure-field-source-matrix";

export interface DisclosureDraftField {
  fieldKey: string;
  value?: unknown;
  manuallyEdited?: boolean;
}

export interface RegistryLookupResult {
  serviceCode: string;
  success: boolean;
  payload?: Record<string, unknown>;
  source?: "api" | "cache" | "manual" | "candidate";
  returnRows?: number;
  statusCode?: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface AutofillFieldResult {
  fieldKey: string;
  value: unknown;
  sourceKind: DisclosureFieldSourceMatrixRow["sourceKind"] | "manual_edit";
  automationState: AutomationState;
  confidence: "high" | "medium" | "low";
  serviceCodes: string[];
  sourceMetadata: {
    serviceCode?: string;
    payloadPath?: string;
    appliedFrom?: "registry" | "manual" | "candidate";
  };
  gapReason?: FieldGapResolution;
}

export interface AutofillEngineInput {
  propertyType: PropertyTypeId;
  draftFields: DisclosureDraftField[];
  matrixRows: DisclosureFieldSourceMatrixRow[];
  catalog: ServiceCatalogEntry[];
  lookupResults: RegistryLookupResult[];
}

export interface AutofillEngineOutput {
  propertyType: PropertyTypeId;
  fields: AutofillFieldResult[];
  appliedCount: number;
  gapCount: number;
}

const MANUAL_IDENTITY_FIELDS = new Set(["owner_name", "owner_id", "owner_birth_date", "owner_address"]);

export function autofillDisclosureDraft(input: AutofillEngineInput): AutofillEngineOutput {
  const lookupByServiceCode = new Map(input.lookupResults.map((result) => [result.serviceCode, result]));
  const fields = input.draftFields.map((draftField) => {
    const matrixRow = getInputMatrixRow(input.matrixRows, draftField.fieldKey, input.propertyType);
    if (!matrixRow) {
      const gapReason = buildGapResolution({
        fieldKey: draftField.fieldKey,
        automationState: "not_supported",
        serviceCodes: [],
        reason: "field is not supported by the current disclosure matrix",
      });
      return {
        fieldKey: draftField.fieldKey,
        value: draftField.value ?? "",
        sourceKind: "unsupported",
        automationState: gapReason.automationState,
        confidence: "low",
        serviceCodes: [],
        sourceMetadata: {},
        gapReason,
      } satisfies AutofillFieldResult;
    }

    if (draftField.manuallyEdited) {
      return {
        fieldKey: draftField.fieldKey,
        value: draftField.value ?? "",
        sourceKind: "manual_edit",
        automationState: "manual_required",
        confidence: "high",
        serviceCodes: matrixRow.serviceCodes,
        sourceMetadata: {
          appliedFrom: "manual",
        },
        gapReason: matrixRow.sourceKind === "manual_document" || matrixRow.sourceKind === "field_visit"
          ? buildGapResolution({
              fieldKey: draftField.fieldKey,
              automationState: "manual_required",
              serviceCodes: matrixRow.serviceCodes,
              reason: matrixRow.reviewNote,
            })
          : undefined,
      } satisfies AutofillFieldResult;
    }

    if (MANUAL_IDENTITY_FIELDS.has(draftField.fieldKey) && matrixRow.sourceKind === "manual_document") {
      return {
        fieldKey: draftField.fieldKey,
        value: draftField.value ?? "",
        sourceKind: "manual_document",
        automationState: "manual_required",
        confidence: "low",
        serviceCodes: matrixRow.serviceCodes,
        sourceMetadata: {},
        gapReason: buildGapResolution({
          fieldKey: draftField.fieldKey,
          automationState: "manual_required",
          serviceCodes: matrixRow.serviceCodes,
          reason: matrixRow.reviewNote,
        }),
      } satisfies AutofillFieldResult;
    }

    const lookup = firstLookupForRow(matrixRow, lookupByServiceCode);
    const serviceCode = lookup?.serviceCode ?? matrixRow.serviceCodes[0];
    const resolved = lookup ? resolveValueFromPayload(lookup.payload, matrixRow) : undefined;
    const resolvedValue = resolved?.value;
    const lookupStatus = lookup?.success
      ? resolvedValue === undefined || resolvedValue === null || `${resolvedValue}`.trim() === ""
        ? "empty_success"
        : "success"
      : "failure";
    const gapReason = resolveGapForRow({
      row: matrixRow,
      value: draftField.value ?? resolvedValue,
      lookupStatus,
      catalog: input.catalog,
      mappedSourceField: resolved?.payloadPath,
    });

    if (draftField.value !== undefined && draftField.value !== null && `${draftField.value}`.trim() !== "") {
      return {
        fieldKey: draftField.fieldKey,
        value: draftField.value,
        sourceKind: "manual_edit",
        automationState: "manual_required",
        confidence: "high",
        serviceCodes: matrixRow.serviceCodes,
        sourceMetadata: {
          serviceCode,
          payloadPath: resolved?.payloadPath ?? matrixRow.sourcePayloadPaths?.[0],
          appliedFrom: "manual",
        },
        gapReason,
      } satisfies AutofillFieldResult;
    }

    if (resolvedValue !== undefined && resolvedValue !== null && `${resolvedValue}`.trim() !== "") {
      return {
        fieldKey: draftField.fieldKey,
        value: resolvedValue,
        sourceKind: matrixRow.sourceKind,
        automationState: "filled_from_registry",
        confidence: "high",
        serviceCodes: matrixRow.serviceCodes,
        sourceMetadata: {
          serviceCode,
          payloadPath: resolved?.payloadPath,
          appliedFrom: lookup?.source === "candidate" ? "candidate" : "registry",
        },
      } satisfies AutofillFieldResult;
    }

    return {
      fieldKey: draftField.fieldKey,
      value: draftField.value ?? "",
      sourceKind: matrixRow.sourceKind,
      automationState: gapReason.automationState,
      confidence: "low",
      serviceCodes: matrixRow.serviceCodes,
      sourceMetadata: {
        serviceCode,
        payloadPath: matrixRow.sourcePayloadPaths?.[0],
      },
      gapReason,
    } satisfies AutofillFieldResult;
  });

  return {
    propertyType: input.propertyType,
    fields,
    appliedCount: fields.filter((field) => field.automationState === "filled_from_registry").length,
    gapCount: fields.filter((field) => field.automationState !== "filled_from_registry").length,
  };
}

function resolveValueFromPayload(
  payload: Record<string, unknown> | undefined,
  row: DisclosureFieldSourceMatrixRow,
): { value: unknown; payloadPath: string } | undefined {
  if (!payload) return undefined;
  const paths = row.sourcePayloadPaths ?? [];
  for (const path of paths) {
    const value = resolveJsonPath(payload, path);
    if (value !== undefined && value !== null && `${value}`.trim() !== "") {
      return { value, payloadPath: path };
    }
  }
  return undefined;
}

function resolveJsonPath(payload: Record<string, unknown>, path: string): unknown {
  const normalized = path.replace(/^\$\./, "");
  return normalized.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
    return (current as Record<string, unknown>)[segment];
  }, payload);
}

function getInputMatrixRow(
  rows: DisclosureFieldSourceMatrixRow[],
  fieldKey: string,
  propertyType: PropertyTypeId,
): DisclosureFieldSourceMatrixRow | undefined {
  return rows.find((row) => row.fieldKey === fieldKey && row.propertyTypes.includes(propertyType));
}

function firstLookupForRow(
  row: DisclosureFieldSourceMatrixRow,
  lookupByServiceCode: Map<string, RegistryLookupResult>,
): RegistryLookupResult | undefined {
  for (const serviceCode of row.serviceCodes) {
    const lookup = lookupByServiceCode.get(serviceCode);
    if (lookup) return lookup;
  }
  return undefined;
}

function resolveGapForRow(input: {
  row: DisclosureFieldSourceMatrixRow;
  value: unknown;
  lookupStatus: "success" | "empty_success" | "failure" | "not_run";
  catalog: ServiceCatalogEntry[];
  mappedSourceField?: string;
}): FieldGapResolution {
  const row = input.row;
  if (input.value !== undefined && input.value !== null && `${input.value}`.trim() !== "") {
    return buildGapResolution({
      fieldKey: row.fieldKey,
      automationState: "filled_from_registry",
      serviceCodes: row.serviceCodes,
      reason: "field already has a value",
      gapDetail: "filled",
    });
  }

  if (row.sourceKind === "manual_document" || row.sourceKind === "field_visit") {
    return buildGapResolution({
      fieldKey: row.fieldKey,
      automationState: "manual_required",
      serviceCodes: row.serviceCodes,
      reason: row.reviewNote,
      gapDetail: "manual_confirmation",
    });
  }

  if (row.sourceKind === "unsupported") {
    return buildGapResolution({
      fieldKey: row.fieldKey,
      automationState: "not_supported",
      serviceCodes: row.serviceCodes,
      reason: row.reviewNote,
      gapDetail: "unsupported_source",
    });
  }

  const knownServiceCodes = new Set(input.catalog.map((entry) => entry.serviceCode));
  const missingServiceCode = row.serviceCodes.find((serviceCode) => !knownServiceCodes.has(serviceCode));
  if (missingServiceCode) {
    return buildGapResolution({
      fieldKey: row.fieldKey,
      automationState: "integration_gap",
      serviceCodes: row.serviceCodes,
      reason: `service code not found in local catalog: ${missingServiceCode}`,
      gapDetail: "missing_client",
    });
  }

  if (input.lookupStatus === "empty_success") {
    return buildGapResolution({
      fieldKey: row.fieldKey,
      automationState: "mapping_gap",
      serviceCodes: row.serviceCodes,
      reason: `successful lookup returned no data for ${row.fieldKey}`,
      gapDetail: "empty_success",
    });
  }

  if (!input.mappedSourceField) {
    return buildGapResolution({
      fieldKey: row.fieldKey,
      automationState: "mapping_gap",
      serviceCodes: row.serviceCodes,
      reason: `registry payload exists but ${row.fieldKey} is not mapped`,
      gapDetail: "unmapped",
    });
  }

  return buildGapResolution({
    fieldKey: row.fieldKey,
    automationState: row.automationState,
    serviceCodes: row.serviceCodes,
    reason: row.reviewNote,
    gapDetail: "unmapped",
  });
}

function buildGapResolution(input: {
  fieldKey: string;
  automationState: AutomationState;
  serviceCodes: string[];
  reason: string;
  gapDetail?: FieldGapResolution["gapDetail"];
}): FieldGapResolution {
  return {
    fieldKey: input.fieldKey,
    automationState: input.automationState,
    gapDetail: input.gapDetail ?? "unsupported_source",
    reason: input.reason,
    serviceCodes: input.serviceCodes,
  };
}
