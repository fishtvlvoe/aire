import type { PropertyTypeId } from "@/lib/property-type-registry";
import type { ServiceCatalogEntry } from "@/lib/moi-service-catalog";
import {
  getDisclosureFieldSourceRow,
  getFieldGapResolution,
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
    const matrixRow = getDisclosureFieldSourceRow(draftField.fieldKey, input.propertyType);
    if (!matrixRow) {
      const gapReason: FieldGapResolution = getFieldGapResolution({
        fieldKey: draftField.fieldKey,
        propertyType: input.propertyType,
        value: draftField.value,
        lookupStatus: "not_run",
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
          ? getFieldGapResolution({
              fieldKey: draftField.fieldKey,
              propertyType: input.propertyType,
              value: draftField.value,
              lookupStatus: "not_run",
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
        gapReason: getFieldGapResolution({
          fieldKey: draftField.fieldKey,
          propertyType: input.propertyType,
          value: draftField.value,
          lookupStatus: "not_run",
        }),
      } satisfies AutofillFieldResult;
    }

    const serviceCode = matrixRow.serviceCodes[0];
    const lookup = serviceCode ? lookupByServiceCode.get(serviceCode) : undefined;
    const resolvedValue = lookup ? resolveValueFromPayload(lookup.payload, matrixRow) : undefined;
    const lookupStatus = lookup?.success
      ? resolvedValue === undefined || resolvedValue === null || `${resolvedValue}`.trim() === ""
        ? "empty_success"
        : "success"
      : "failure";
    const gapReason = getFieldGapResolution({
      fieldKey: draftField.fieldKey,
      propertyType: input.propertyType,
      value: draftField.value ?? resolvedValue,
      lookupStatus,
      sourcePayloadPath: matrixRow.sourcePayloadPaths?.[0],
      mappedSourceField: matrixRow.sourcePayloadPaths?.[0],
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
          payloadPath: matrixRow.sourcePayloadPaths?.[0],
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
          payloadPath: matrixRow.sourcePayloadPaths?.[0],
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
): unknown {
  if (!payload) return undefined;
  const paths = row.sourcePayloadPaths ?? [];
  for (const path of paths) {
    const value = resolveJsonPath(payload, path);
    if (value !== undefined && value !== null && `${value}`.trim() !== "") {
      return value;
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
