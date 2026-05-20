export const PAGE_CONTRACT_VERSION = 1 as const;

export type PrintableText = string | null | undefined;

export type ControlledTextMode = "default" | "manual" | "blank";

export type TaxAmountSource = "blank" | "manual" | "calculated";

export type SurveyAnswer = "yes" | "no" | "unknown" | "blank" | "custom";

export type MapSource = "auto_generated" | "manual_override" | "blank";

export type Editability = "admin_template_only" | "case_value_only";

export type PrintPolicy =
  | "print_default_clauses"
  | "print_even_when_values_blank"
  | "optional_appendix";

export interface SelectOption<TValue extends string = string> {
  value: TValue;
  label: string;
}

export interface HouseMvpTemplateMeta {
  pageContractVersion: typeof PAGE_CONTRACT_VERSION;
  contractKey: string;
  templateVersion: string;
  title: string;
}

export interface ControlledTextField {
  mode: ControlledTextMode;
  defaultText: string;
  manualText: string;
}

export interface BlankTaxAmount {
  source: "blank";
  displayValue: "";
}

export interface ManualTaxAmount {
  source: "manual";
  displayValue: string;
}

export interface CalculatedTaxAmount {
  source: "calculated";
  displayValue: string;
  formulaVersion: string;
  sourceSnapshotAt: string;
  warnings: string[];
}

export type TaxAmount = BlankTaxAmount | ManualTaxAmount | CalculatedTaxAmount;

export interface SurveyQuestionTemplate {
  questionNo: number;
  sectionKey: string;
  sectionTitle: string;
  pageKey: string;
  label: string;
  answerType: "yes_no_blank" | "amount";
}

export interface SurveyQuestionDraft extends SurveyQuestionTemplate {
  answer: SurveyAnswer;
  note: string;
  amount: string;
  attachments: string[];
}

export interface HouseConditionSurveyTemplate extends HouseMvpTemplateMeta {
  formVersion: string;
  propertyType: "大樓華廈";
  answerRenderMode: "empty_checkboxes_with_writable_space";
  questions: SurveyQuestionTemplate[];
}

export interface HouseConditionSurveyDraft {
  pageContractVersion: typeof PAGE_CONTRACT_VERSION;
  formVersion: string;
  propertyType: "大樓華廈";
  answerRenderMode: "empty_checkboxes_with_writable_space";
  questions: SurveyQuestionDraft[];
}

export interface LivingFacilityDraft {
  index: number;
  name: string;
  category: string;
  distanceM: string;
}

export interface HouseLivingFunctionTemplate extends HouseMvpTemplateMeta {
  map: {
    requiredGeneration: boolean;
    defaultSource: Extract<MapSource, "auto_generated">;
    failurePolicy: "warn_allow_manual_override";
    assetKinds: readonly ["location_map", "surrounding_map"];
  };
  facilityCategories: readonly string[];
}

export interface HouseLivingFunctionDraft {
  pageContractVersion: typeof PAGE_CONTRACT_VERSION;
  addressText: string;
  latitude: number | null;
  longitude: number | null;
  mapAssetId: string;
  mapSource: MapSource;
  generatedAt: string;
  facilities: LivingFacilityDraft[];
}

export interface OwnershipClauseTemplate {
  key: string;
  index: number;
  topic: string;
  text: string;
}

export interface HouseOwnershipNotesTemplate extends HouseMvpTemplateMeta {
  editability: Editability;
  printPolicy: Extract<PrintPolicy, "print_default_clauses">;
  clauses: OwnershipClauseTemplate[];
}

export interface TaxNoteTemplate {
  key: string;
  index: number;
  topic: string;
  text: string;
}

export interface HouseTaxNotesTemplate extends HouseMvpTemplateMeta {
  editability: Editability;
  printPolicy: Extract<PrintPolicy, "print_even_when_values_blank">;
  estimateCaveat: string;
  notes: TaxNoteTemplate[];
}

export interface LegalUpdateDisclosureField {
  key:
    | "solar_photovoltaic_equipment_status"
    | "solar_photovoltaic_equipment_location"
    | "building_energy_efficiency_condition"
    | "building_energy_efficiency_notes";
  label: string;
  defaultValue: "";
  source: "manual_or_registry";
  printPolicy: "blank_until_known";
}

export const DEFAULT_GIFTED_EQUIPMENT_NOTE = "依標的物現況說明書賣方表達內容為準";
export const DEFAULT_PAYMENT_METHOD_NOTE = "依買賣契約為準";

export const HOUSE_TRANSACTION_TYPE_OPTIONS: ReadonlyArray<SelectOption> = [
  { value: "", label: "" },
  { value: "買賣", label: "買賣" },
  { value: "租賃", label: "租賃" },
  { value: "交換", label: "交換" },
  { value: "其他", label: "其他" },
];

export const HOUSE_PROPERTY_RIGHTS_DEFAULTS = {
  transactionTypeOptions: HOUSE_TRANSACTION_TYPE_OPTIONS,
  transactionTypeDefault: "",
  giftedEquipment: {
    mode: "default",
    defaultText: DEFAULT_GIFTED_EQUIPMENT_NOTE,
    manualText: "",
  } satisfies ControlledTextField,
  paymentMethod: {
    mode: "default",
    defaultText: DEFAULT_PAYMENT_METHOD_NOTE,
    manualText: "",
  } satisfies ControlledTextField,
} as const;

export const HOUSE_2026_LEGAL_UPDATE_FIELDS: ReadonlyArray<LegalUpdateDisclosureField> = [
  {
    key: "solar_photovoltaic_equipment_status",
    label: "太陽光電設備狀態",
    defaultValue: "",
    source: "manual_or_registry",
    printPolicy: "blank_until_known",
  },
  {
    key: "solar_photovoltaic_equipment_location",
    label: "太陽光電設備位置",
    defaultValue: "",
    source: "manual_or_registry",
    printPolicy: "blank_until_known",
  },
  {
    key: "building_energy_efficiency_condition",
    label: "建築能效狀況",
    defaultValue: "",
    source: "manual_or_registry",
    printPolicy: "blank_until_known",
  },
  {
    key: "building_energy_efficiency_notes",
    label: "建築能效備註",
    defaultValue: "",
    source: "manual_or_registry",
    printPolicy: "blank_until_known",
  },
];

const conditionSurveySections = {
  current_use: "使用現況與交易條件",
  utilities_rights: "公用設備與權利狀態",
  land_restrictions: "土地與開發限制",
  environmental_controls: "環境與管制事項",
  fee_estimates: "稅費與規費預估",
} as const;

const makeSurveyQuestion = (
  questionNo: number,
  sectionKey: keyof typeof conditionSurveySections,
  pageKey: string,
  label: string,
  answerType: SurveyQuestionTemplate["answerType"] = "yes_no_blank",
): SurveyQuestionTemplate => ({
  questionNo,
  sectionKey,
  sectionTitle: conditionSurveySections[sectionKey],
  pageKey,
  label,
  answerType,
});

export const HOUSE_CONDITION_SURVEY_QUESTIONS: SurveyQuestionTemplate[] = [
  makeSurveyQuestion(1, "current_use", "survey_page_1", "是否有依慣例使用之現況？"),
  makeSurveyQuestion(2, "current_use", "survey_page_1", "是否已取得共有人或相關權利人同意？"),
  makeSurveyQuestion(3, "current_use", "survey_page_1", "是否有占用、被占用或使用爭議？"),
  makeSurveyQuestion(4, "current_use", "survey_page_1", "是否涉及私設道路或通行權使用？"),
  makeSurveyQuestion(5, "current_use", "survey_page_1", "是否有影響交易的重要事項？"),
  makeSurveyQuestion(6, "current_use", "survey_page_1", "是否有違約、罰則或交易條件需特別約定？"),
  makeSurveyQuestion(7, "current_use", "survey_page_1", "電力設備與供電情形是否正常？"),
  makeSurveyQuestion(8, "current_use", "survey_page_1", "自來水或用水情形是否正常？"),
  makeSurveyQuestion(9, "current_use", "survey_page_1", "管理費、水電瓦斯或其他費用是否有待結清事項？"),
  makeSurveyQuestion(10, "current_use", "survey_page_1", "建物現況是否與登記或約定用途一致？"),
  makeSurveyQuestion(11, "current_use", "survey_page_1", "其他現況使用事項是否需補充說明？"),
  makeSurveyQuestion(12, "utilities_rights", "survey_page_2", "瓦斯或相關能源設備情形是否正常？"),
  makeSurveyQuestion(13, "utilities_rights", "survey_page_2", "排水、污水或管線情形是否正常？"),
  makeSurveyQuestion(14, "utilities_rights", "survey_page_2", "周邊是否有重要環境設施需揭露？"),
  makeSurveyQuestion(15, "utilities_rights", "survey_page_2", "土地所有權或持分情形是否有需說明事項？"),
  makeSurveyQuestion(16, "utilities_rights", "survey_page_2", "是否有他項權利、限制登記或用益權利？"),
  makeSurveyQuestion(17, "utilities_rights", "survey_page_2", "是否有信託登記或其他登記限制？"),
  makeSurveyQuestion(18, "land_restrictions", "survey_page_3", "是否有查封、假扣押、假處分或其他限制？"),
  makeSurveyQuestion(19, "land_restrictions", "survey_page_3", "是否有民法第826-1條相關登記事項？"),
  makeSurveyQuestion(20, "land_restrictions", "survey_page_3", "建蔽率資料是否需揭露或補充？"),
  makeSurveyQuestion(21, "land_restrictions", "survey_page_3", "容積率資料是否需揭露或補充？"),
  makeSurveyQuestion(22, "land_restrictions", "survey_page_3", "是否有開發、建築或使用限制？"),
  makeSurveyQuestion(23, "land_restrictions", "survey_page_3", "是否位於山坡地或相關限制範圍？"),
  makeSurveyQuestion(24, "land_restrictions", "survey_page_3", "是否涉及水土保持或相關管制？"),
  makeSurveyQuestion(25, "land_restrictions", "survey_page_3", "其他土地限制事項是否需補充說明？"),
  makeSurveyQuestion(26, "environmental_controls", "survey_page_4", "是否涉及河川、排水或水利用地限制？"),
  makeSurveyQuestion(27, "environmental_controls", "survey_page_4", "是否位於國家公園或保護區範圍？"),
  makeSurveyQuestion(28, "environmental_controls", "survey_page_4", "是否位於飲用水水源或水質保護區？"),
  makeSurveyQuestion(29, "environmental_controls", "survey_page_4", "是否涉及污染場址或環境污染公告？"),
  makeSurveyQuestion(30, "environmental_controls", "survey_page_4", "是否曾辦理地籍圖重測或面積變更？"),
  makeSurveyQuestion(31, "environmental_controls", "survey_page_4", "是否有界址、越界或占用爭議？"),
  makeSurveyQuestion(32, "environmental_controls", "survey_page_4", "是否涉及徵收、徵用或公共工程影響？"),
  makeSurveyQuestion(33, "environmental_controls", "survey_page_4", "使用分區或使用地類別是否需補充說明？"),
  makeSurveyQuestion(34, "environmental_controls", "survey_page_4", "是否有其他環境管制或公告事項？"),
  makeSurveyQuestion(35, "environmental_controls", "survey_page_4", "其他現場調查事項是否需補充說明？"),
  makeSurveyQuestion(36, "fee_estimates", "survey_page_5", "土地增值稅或相關稅項預估", "amount"),
  makeSurveyQuestion(37, "fee_estimates", "survey_page_5", "登記規費或官方費用預估", "amount"),
  makeSurveyQuestion(38, "fee_estimates", "survey_page_5", "其他費用預估", "amount"),
];

export const HOUSE_CONDITION_SURVEY_HIGHRISE_TEMPLATE: HouseConditionSurveyTemplate = {
  pageContractVersion: PAGE_CONTRACT_VERSION,
  contractKey: "house.condition_survey_highrise",
  templateVersion: "house-condition-survey-highrise-38q-2026-05-20",
  formVersion: "house-condition-survey-highrise-38q-2026-05-20",
  title: "肆、現況調查表",
  propertyType: "大樓華廈",
  answerRenderMode: "empty_checkboxes_with_writable_space",
  questions: HOUSE_CONDITION_SURVEY_QUESTIONS,
};

export const HOUSE_LIVING_FUNCTION_TEMPLATE: HouseLivingFunctionTemplate = {
  pageContractVersion: PAGE_CONTRACT_VERSION,
  contractKey: "house.living_function",
  templateVersion: "house-living-function-2026-05-20",
  title: "位置圖與生活機能",
  map: {
    requiredGeneration: true,
    defaultSource: "auto_generated",
    failurePolicy: "warn_allow_manual_override",
    assetKinds: ["location_map", "surrounding_map"],
  },
  facilityCategories: ["學校", "醫療", "公園", "捷運/交通", "市場/超市"],
};

export const HOUSE_OWNERSHIP_NOTES_TEMPLATE: HouseOwnershipNotesTemplate = {
  pageContractVersion: PAGE_CONTRACT_VERSION,
  contractKey: "house.ownership_notes",
  templateVersion: "house-ownership-notes-2026-05-20",
  title: "三、【產權相關注意事項】",
  editability: "admin_template_only",
  printPolicy: "print_default_clauses",
  clauses: [
    {
      key: "real_price_registration",
      index: 1,
      topic: "平均地權條例第47條 / 實價登錄申報",
      text: "權利人及義務人應依平均地權條例及相關規定申報登錄土地及建物成交案件實際資訊。",
    },
    {
      key: "property_income_tax",
      index: 2,
      topic: "財產交易所得稅 / 房地合一稅",
      text: "不動產交易所得稅及房地合一所得稅應由納稅義務人自行依稅法規定申報。",
    },
    {
      key: "preferential_loan",
      index: 3,
      topic: "優惠性貸款資格與額度",
      text: "優惠貸款資格、額度與核貸條件應以金融機構實際審核結果為準。",
    },
    {
      key: "business_use_check",
      index: 4,
      topic: "營業用途與主管機關審查",
      text: "如作營業或特定用途使用，應由買受人自行確認主管機關規定、使用分區及相關許可。",
    },
    {
      key: "addition_no_ownership",
      index: 5,
      topic: "增建部分無所有權與拆除風險",
      text: "增建、未保存登記或無權狀部分，不具所有權登記效力，並可能有拆除或使用限制風險。",
    },
    {
      key: "roof_yard_addition",
      index: 6,
      topic: "頂樓/一樓前後院空地增建承受",
      text: "頂樓、一樓前後院、空地或其他共有部分使用現況，應依現況、規約及權利狀態承受。",
    },
    {
      key: "parking_shared_space",
      index: 7,
      topic: "未承購停車位時共有地下室/停車空間使用",
      text: "未承購停車位者，其共有地下室或停車空間使用權利應依權狀、規約及管理規定確認。",
    },
    {
      key: "land_value_tax_refund",
      index: 8,
      topic: "增值稅重購退稅資格自行確認",
      text: "土地增值稅重購退稅資格及申請條件，應由當事人自行向稅捐機關確認。",
    },
    {
      key: "repurchase_tax_obligations",
      index: 9,
      topic: "土地增值稅及所得稅重購退稅義務",
      text: "申請重購退稅後之持有、設籍、用途及移轉限制，應依稅法規定辦理。",
    },
    {
      key: "use_compliance",
      index: 10,
      topic: "現況使用與登記用途/使用執照/使用分區/住戶規約一致",
      text: "建物現況使用應符合登記用途、使用執照、土地使用分區及住戶規約等相關規定。",
    },
    {
      key: "breach_termination_fee",
      index: 11,
      topic: "違約/解約罰則與仲介服務費",
      text: "違約、解約、罰則及仲介服務費負擔，應依買賣契約及服務報酬約定辦理。",
    },
  ],
};

export const HOUSE_TAX_NOTES_TEMPLATE: HouseTaxNotesTemplate = {
  pageContractVersion: PAGE_CONTRACT_VERSION,
  contractKey: "house.tax_notes",
  templateVersion: "house-tax-notes-2026-05-20",
  title: "增值稅附註",
  editability: "admin_template_only",
  printPolicy: "print_even_when_values_blank",
  estimateCaveat: "本表所列稅額均為概算，正確應納稅額以稅捐機關核發稅單金額為準。",
  notes: [
    {
      key: "price_index_basis",
      index: 1,
      topic: "物價指數基準與資料日期",
      text: "物價指數及相關資料日期應依主管機關公布資料及實際查得資料為準。",
    },
    {
      key: "restricted_transfer_types",
      index: 2,
      topic: "國宅、公家配售、拍賣、主管機關核准移轉",
      text: "國宅、公家配售、拍賣或需主管機關核准移轉案件，應另依主管機關及稅捐機關規定辦理。",
    },
    {
      key: "cadastral_resurvey_change",
      index: 3,
      topic: "地籍圖重測、面積或權利變動",
      text: "如有地籍圖重測、面積變更或權利範圍變動，估算結果可能受影響。",
    },
    {
      key: "public_facility_land",
      index: 4,
      topic: "公共設施用地可能免徵",
      text: "公共設施用地或其他免徵情形，應以稅捐機關審查結果為準。",
    },
    {
      key: "self_use_area_limit",
      index: 5,
      topic: "自用優惠面積限制",
      text: "都市土地及非都市土地適用自用優惠稅率之面積上限，應依土地稅法相關規定確認。",
    },
    {
      key: "self_use_disqualification",
      index: 6,
      topic: "自用優惠排除事由",
      text: "出售前一年內如有營業使用、出租或供他人設籍等情形，可能不適用自用優惠稅率。",
    },
    {
      key: "tax_authority_review",
      index: 7,
      topic: "自用優惠以稅捐機關審查為準",
      text: "自用優惠稅率能否適用，仍應以稅捐稽徵機關審查結果為準。",
    },
  ],
};

export function createHouseConditionSurveyDraft(): HouseConditionSurveyDraft {
  return {
    pageContractVersion: PAGE_CONTRACT_VERSION,
    formVersion: HOUSE_CONDITION_SURVEY_HIGHRISE_TEMPLATE.formVersion,
    propertyType: HOUSE_CONDITION_SURVEY_HIGHRISE_TEMPLATE.propertyType,
    answerRenderMode: HOUSE_CONDITION_SURVEY_HIGHRISE_TEMPLATE.answerRenderMode,
    questions: HOUSE_CONDITION_SURVEY_HIGHRISE_TEMPLATE.questions.map((question) => ({
      ...question,
      answer: "blank",
      note: "",
      amount: "",
      attachments: [],
    })),
  };
}

export function createHouseLivingFunctionDraft(): HouseLivingFunctionDraft {
  return {
    pageContractVersion: PAGE_CONTRACT_VERSION,
    addressText: "",
    latitude: null,
    longitude: null,
    mapAssetId: "",
    mapSource: HOUSE_LIVING_FUNCTION_TEMPLATE.map.defaultSource,
    generatedAt: "",
    facilities: [],
  };
}

export function createBlankTaxAmount(): BlankTaxAmount {
  return {
    source: "blank",
    displayValue: "",
  };
}

export function createManualTaxAmount(displayValue: string): ManualTaxAmount {
  return {
    source: "manual",
    displayValue,
  };
}

export function createCalculatedTaxAmount(
  displayValue: string,
  metadata: Pick<CalculatedTaxAmount, "formulaVersion" | "sourceSnapshotAt" | "warnings">,
): CalculatedTaxAmount {
  if (metadata.formulaVersion.trim() === "") {
    throw new Error("Calculated tax amount requires a formulaVersion.");
  }

  if (metadata.sourceSnapshotAt.trim() === "") {
    throw new Error("Calculated tax amount requires a sourceSnapshotAt timestamp.");
  }

  return {
    source: "calculated",
    displayValue,
    formulaVersion: metadata.formulaVersion,
    sourceSnapshotAt: metadata.sourceSnapshotAt,
    warnings: [...metadata.warnings],
  };
}

export function getPrintableText(value: PrintableText): string {
  return value ?? "";
}

export function hasForbiddenPrintablePlaceholder(value: unknown): boolean {
  return JSON.stringify(value).includes("待補");
}
