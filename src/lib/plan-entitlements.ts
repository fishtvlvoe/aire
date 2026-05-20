export type SubscriptionPlan = "basic" | "pro" | "advanced";

export type EntitlementFeature =
  | "registry_pull"
  | "manual_completion"
  | "manual_image_upload"
  | "draft_pdf_export"
  | "real_price"
  | "nearby_market"
  | "location_map"
  | "cadastral_map"
  | "aerial_photo"
  | "street_view_reference"
  | "floor_plan_processing"
  | "marketing_modules";

export type PlanFeatureMap = Record<EntitlementFeature, boolean>;

export interface EntitlementPayload {
  plan: SubscriptionPlan;
  features: PlanFeatureMap;
}

export interface AutomationControlState {
  feature: EntitlementFeature;
  visible: boolean;
  enabled: boolean;
  upgradeRequired: SubscriptionPlan | null;
}

const BASIC_FEATURES: PlanFeatureMap = {
  registry_pull: true,
  manual_completion: true,
  manual_image_upload: true,
  draft_pdf_export: true,
  real_price: false,
  nearby_market: false,
  location_map: false,
  cadastral_map: false,
  aerial_photo: false,
  street_view_reference: false,
  floor_plan_processing: false,
  marketing_modules: false,
};

const PRO_FEATURES: PlanFeatureMap = {
  ...BASIC_FEATURES,
  real_price: true,
  nearby_market: true,
  location_map: true,
  cadastral_map: true,
};

const ADVANCED_FEATURES: PlanFeatureMap = {
  ...PRO_FEATURES,
  aerial_photo: true,
  street_view_reference: true,
  floor_plan_processing: true,
  marketing_modules: true,
};

export function getPlanEntitlements(plan: SubscriptionPlan): EntitlementPayload {
  if (plan === "advanced") {
    return { plan, features: { ...ADVANCED_FEATURES } };
  }

  if (plan === "pro") {
    return { plan, features: { ...PRO_FEATURES } };
  }

  return { plan: "basic", features: { ...BASIC_FEATURES } };
}

export function getRequiredPlanForFeature(feature: EntitlementFeature): SubscriptionPlan | null {
  if (BASIC_FEATURES[feature]) return null;

  if (PRO_FEATURES[feature]) return "pro";

  if (ADVANCED_FEATURES[feature]) return "advanced";

  return null;
}

export function getAutomationControlState(
  entitlement: EntitlementPayload,
  feature: EntitlementFeature,
): AutomationControlState {
  const enabled = entitlement.features[feature] === true;
  return {
    feature,
    visible: true,
    enabled,
    upgradeRequired: enabled ? null : getRequiredPlanForFeature(feature),
  };
}
