"use client";

import type { ReactNode } from "react";
import {
  HOUSE_OWNERSHIP_NOTES_TEMPLATE,
  HOUSE_TAX_NOTES_TEMPLATE,
  createHouseConditionSurveyDraft,
  createHouseLivingFunctionDraft,
  type HouseConditionSurveyDraft,
  type HouseLivingFunctionDraft,
  type MapSource,
} from "@/lib/page-contracts/house-mvp";
import {
  createHouseFieldSurveyDraft,
  getHouseFieldSurveyTemplate,
  type FieldSurveyFieldTemplate,
  type HouseFieldSurveyDraft,
  type HousePropertySurveyType,
} from "@/lib/page-contracts/house-field-survey";
import {
  HOUSE_SUPPLEMENT_COMMON_FIELDS,
  createHouseSupplementDraft,
  getHouseSupplementTypeFields,
  type HouseSupplementDraft,
} from "@/lib/page-contracts/house-supplement";
import {
  getAutomationControlState,
  getPlanEntitlements,
  type EntitlementFeature,
  type EntitlementPayload,
} from "@/lib/plan-entitlements";
import { HouseMvpPagePreview } from "@/components/HouseMvpPagePreview";

export type HouseMvpWorkbenchPage =
  | "condition_survey_highrise"
  | "living_function"
  | "ownership_notes"
  | "tax_notes";

export type HouseMvpWorkbenchMode = "field_survey" | "formal_supplement";

export interface HouseMvpWorkbenchState {
  selectedPage: HouseMvpWorkbenchPage;
  caseNo: string;
  caseName: string;
  companyName: string;
  fieldSurvey: HouseFieldSurveyDraft;
  supplement: HouseSupplementDraft;
  conditionSurvey: HouseConditionSurveyDraft;
  livingFunction: HouseLivingFunctionDraft;
}

interface HouseMvpWorkbenchProps {
  value: HouseMvpWorkbenchState;
  onChange: (nextValue: HouseMvpWorkbenchState) => void;
  onSave?: () => void | Promise<void>;
  imageUploadSlots?: Partial<Record<HouseMvpWorkbenchPage, ReactNode>>;
  mode?: HouseMvpWorkbenchMode;
  entitlement?: EntitlementPayload;
}

const pageOptions: Array<{ key: HouseMvpWorkbenchPage; label: string; description: string }> = [
  {
    key: "condition_survey_highrise",
    label: "現況調查表",
    description: "38 題空白勾選與手寫欄",
  },
  {
    key: "living_function",
    label: "位置圖與生活機能",
    description: "一頁地圖與周邊摘要",
  },
  {
    key: "ownership_notes",
    label: "產權注意事項",
    description: "固定法務模板",
  },
  {
    key: "tax_notes",
    label: "增值稅附註",
    description: "固定稅務附註",
  },
];

export function createDefaultHouseMvpWorkbenchState({
  caseNo = "",
  caseName = "",
  companyName = "",
}: Partial<Pick<HouseMvpWorkbenchState, "caseNo" | "caseName" | "companyName">> = {}): HouseMvpWorkbenchState {
  return {
    selectedPage: "condition_survey_highrise",
    caseNo,
    caseName,
    companyName,
    fieldSurvey: createHouseFieldSurveyDraft(),
    supplement: createHouseSupplementDraft(),
    conditionSurvey: createHouseConditionSurveyDraft(),
    livingFunction: createHouseLivingFunctionDraft(),
  };
}

export function isHouseMvpWorkbenchState(value: unknown): value is HouseMvpWorkbenchState {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<HouseMvpWorkbenchState>;
  return (
    typeof record.selectedPage === "string" &&
    typeof record.caseNo === "string" &&
    typeof record.caseName === "string" &&
    typeof record.companyName === "string" &&
    !!record.fieldSurvey &&
    !!record.supplement &&
    !!record.conditionSurvey &&
    !!record.livingFunction
  );
}

export function normalizeHouseMvpWorkbenchState(
  value: unknown,
  fallback?: Partial<Pick<HouseMvpWorkbenchState, "caseNo" | "caseName" | "companyName">>,
): HouseMvpWorkbenchState {
  if (isHouseMvpWorkbenchState(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as Partial<HouseMvpWorkbenchState>;
    if (
      typeof record.selectedPage === "string" &&
      typeof record.caseNo === "string" &&
      typeof record.caseName === "string" &&
      typeof record.companyName === "string" &&
      !!record.conditionSurvey &&
      !!record.livingFunction
    ) {
      return {
        ...record,
        selectedPage: record.selectedPage as HouseMvpWorkbenchPage,
        caseNo: record.caseNo,
        caseName: record.caseName,
        companyName: record.companyName,
        fieldSurvey: record.fieldSurvey ?? createHouseFieldSurveyDraft(),
        supplement: record.supplement ?? createHouseSupplementDraft(),
        conditionSurvey: record.conditionSurvey,
        livingFunction: record.livingFunction,
      };
    }
  }

  return createDefaultHouseMvpWorkbenchState(fallback);
}

function updateFieldSurveyValue(
  state: HouseMvpWorkbenchState,
  key: string,
  value: string,
): HouseMvpWorkbenchState {
  return {
    ...state,
    fieldSurvey: {
      ...state.fieldSurvey,
      values: {
        ...state.fieldSurvey.values,
        [key]: value,
      },
    },
  };
}

function updateSupplementValue(
  state: HouseMvpWorkbenchState,
  key: string,
  value: string,
): HouseMvpWorkbenchState {
  return {
    ...state,
    supplement: {
      ...state.supplement,
      values: {
        ...state.supplement.values,
        [key]: value,
      },
    },
  };
}

function updateFieldSurveyType(
  state: HouseMvpWorkbenchState,
  propertyType: HousePropertySurveyType,
): HouseMvpWorkbenchState {
  return {
    ...state,
    fieldSurvey: {
      ...state.fieldSurvey,
      propertyType,
    },
  };
}

function updateSurveyQuestion(
  state: HouseMvpWorkbenchState,
  questionNo: number,
  patch: Partial<HouseConditionSurveyDraft["questions"][number]>,
): HouseMvpWorkbenchState {
  return {
    ...state,
    conditionSurvey: {
      ...state.conditionSurvey,
      questions: state.conditionSurvey.questions.map((question) =>
        question.questionNo === questionNo ? { ...question, ...patch } : question,
      ),
    },
  };
}

function updateLivingFunction(
  state: HouseMvpWorkbenchState,
  patch: Partial<HouseLivingFunctionDraft>,
): HouseMvpWorkbenchState {
  return {
    ...state,
    livingFunction: {
      ...state.livingFunction,
      ...patch,
    },
  };
}

function PageList({
  selectedPage,
  onSelect,
}: {
  selectedPage: HouseMvpWorkbenchPage;
  onSelect: (page: HouseMvpWorkbenchPage) => void;
}) {
  return (
    <nav aria-label="不動產說明書頁面" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {pageOptions.map((page) => {
        const active = selectedPage === page.key;
        return (
          <button
            key={page.key}
            type="button"
            aria-label={page.label}
            onClick={() => onSelect(page.key)}
            className={`min-h-[72px] w-full rounded-md border px-3 py-2 text-left ${
              active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <span className="block text-sm font-medium">{page.label}</span>
            <span className={`block text-xs ${active ? "text-slate-200" : "text-slate-500"}`}>{page.description}</span>
          </button>
        );
      })}
    </nav>
  );
}

const automationFeatures: Array<{ feature: EntitlementFeature; label: string }> = [
  { feature: "real_price", label: "自動抓取實價登錄" },
  { feature: "nearby_market", label: "自動抓取周邊行情" },
  { feature: "location_map", label: "自動產生位置圖 / 周邊圖" },
  { feature: "cadastral_map", label: "自動產生地籍圖" },
  { feature: "aerial_photo", label: "自動產生空拍圖" },
  { feature: "street_view_reference", label: "自動產生街景 / 外觀參考" },
  { feature: "floor_plan_processing", label: "自動處理格局圖" },
];

const planLabels: Record<EntitlementPayload["plan"], string> = {
  basic: "基本方案",
  pro: "進階方案",
  advanced: "進階方案",
};

function AutomationEntitlementPanel({ entitlement }: { entitlement: EntitlementPayload }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-950">自動化功能</h2>
        <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500">
          {planLabels[entitlement.plan]}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {automationFeatures.map(({ feature, label }) => {
          const state = getAutomationControlState(entitlement, feature);
          return (
            <button
              key={feature}
              type="button"
              disabled={!state.enabled}
              className={`min-h-10 rounded-md border px-3 py-2 text-left text-sm ${
                state.enabled
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-slate-50 text-slate-400"
              }`}
            >
              <span className="block">{label}</span>
              {!state.enabled && state.upgradeRequired ? (
                <span className="block text-xs">需升級至{planLabels[state.upgradeRequired]}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CaseMetaFields({
  value,
  onChange,
}: {
  value: HouseMvpWorkbenchState;
  onChange: (nextValue: HouseMvpWorkbenchState) => void;
}) {
  return (
    <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 sm:grid-cols-2">
      <label className="space-y-1 text-sm">
        <span className="text-slate-600">案號</span>
        <input
          className="w-full rounded-md border border-slate-300 px-2 py-1.5"
          value={value.caseNo}
          onChange={(event) => onChange({ ...value, caseNo: event.target.value })}
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-slate-600">物件名稱</span>
        <input
          className="w-full rounded-md border border-slate-300 px-2 py-1.5"
          value={value.caseName}
          onChange={(event) => onChange({ ...value, caseName: event.target.value })}
        />
      </label>
    </section>
  );
}

function ConditionSurveyFields({
  value,
  onChange,
}: {
  value: HouseMvpWorkbenchState;
  onChange: (nextValue: HouseMvpWorkbenchState) => void;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold">現況調查表</h2>
        <p className="text-sm text-slate-500">MVP 使用照片中的 38 題版本，預覽維持空白勾選框與手寫欄。</p>
      </div>
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 text-left text-xs text-slate-600">
            <tr>
              <th className="w-12 px-3 py-2 font-medium">項次</th>
              <th className="px-3 py-2 font-medium">調查事項</th>
              <th className="w-28 px-3 py-2 font-medium">回答</th>
              <th className="w-[32%] px-3 py-2 font-medium">備註</th>
            </tr>
          </thead>
          <tbody>
            {value.conditionSurvey.questions.map((question) => (
              <tr key={question.questionNo} className="border-t border-slate-200 align-top">
                <td className="px-3 py-2 text-center text-slate-500">{question.questionNo}</td>
                <td className="px-3 py-2 font-medium leading-6 text-slate-900">{question.label}</td>
                <td className="px-3 py-2">
                  <select
                    aria-label={`第 ${question.questionNo} 題回答`}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-2"
                    value={question.answer}
                    onChange={(event) =>
                      onChange(
                        updateSurveyQuestion(value, question.questionNo, {
                          answer: event.target.value as HouseConditionSurveyDraft["questions"][number]["answer"],
                        }),
                      )
                    }
                  >
                    <option value="blank">空白</option>
                    <option value="yes">是</option>
                    <option value="no">否</option>
                    <option value="unknown">不確定</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    aria-label={`第 ${question.questionNo} 題備註`}
                    className="h-9 w-full rounded-md border border-slate-300 px-2"
                    value={question.note}
                    onChange={(event) =>
                      onChange(updateSurveyQuestion(value, question.questionNo, { note: event.target.value }))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SurveyFieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldSurveyFieldTemplate;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.kind === "textarea") {
    return (
      <label className="space-y-1 text-sm">
        <span className="text-slate-600">{field.label}</span>
        <textarea
          aria-label={field.label}
          className="min-h-16 w-full resize-y rounded-md border border-slate-300 px-2 py-1.5"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }

  if (field.kind === "choice") {
    return (
      <label className="space-y-1 text-sm">
        <span className="text-slate-600">{field.label}</span>
        <select
          aria-label={field.label}
          className="w-full rounded-md border border-slate-300 px-2 py-1.5"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value=""></option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="space-y-1 text-sm">
      <span className="text-slate-600">{field.label}</span>
      <input
        aria-label={field.label}
        className="w-full rounded-md border border-slate-300 px-2 py-1.5"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SurveyFieldGrid({
  fields,
  value,
  onChange,
}: {
  fields: readonly FieldSurveyFieldTemplate[];
  value: HouseMvpWorkbenchState;
  onChange: (nextValue: HouseMvpWorkbenchState) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        <SurveyFieldInput
          key={field.key}
          field={field}
          value={value.fieldSurvey.values[field.key] ?? ""}
          onChange={(nextValue) => onChange(updateFieldSurveyValue(value, field.key, nextValue))}
        />
      ))}
    </div>
  );
}

function FieldSurveyFields({
  value,
  onChange,
}: {
  value: HouseMvpWorkbenchState;
  onChange: (nextValue: HouseMvpWorkbenchState) => void;
}) {
  const template = getHouseFieldSurveyTemplate(value.fieldSurvey.propertyType);
  const propertyTypes: HousePropertySurveyType[] = [
    "大樓華廈",
    "公寓",
    "透天別墅",
    "店面",
    "套房",
    "農舍",
    "廠房",
  ];

  return (
    <section className="space-y-4 rounded-md border border-slate-200 bg-white p-4">
      <div>
        <h2 className="text-base font-semibold">現場必問</h2>
        <p className="text-sm text-slate-500">依房屋類型顯示現場詢問、優缺點與照片清單。</p>
      </div>
      <label className="space-y-1 text-sm">
        <span className="text-slate-600">房屋類型</span>
        <select
          aria-label="房屋類型"
          className="w-full rounded-md border border-slate-300 px-2 py-1.5"
          value={value.fieldSurvey.propertyType}
          onChange={(event) => onChange(updateFieldSurveyType(value, event.target.value as HousePropertySurveyType))}
        >
          {propertyTypes.map((propertyType) => (
            <option key={propertyType} value={propertyType}>
              {propertyType}
            </option>
          ))}
        </select>
      </label>
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-900">共通欄位</h3>
        <SurveyFieldGrid fields={template.commonFields} value={value} onChange={onChange} />
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-900">{template.propertyType}欄位</h3>
        <SurveyFieldGrid fields={template.typeFields} value={value} onChange={onChange} />
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-900">優點與缺點</h3>
        <SurveyFieldGrid fields={template.strengthWeaknessFields} value={value} onChange={onChange} />
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-900">照片清單</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {template.photoFields.map((field) => (
            <div key={field.key} className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
              {field.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SupplementFields({
  value,
  onChange,
}: {
  value: HouseMvpWorkbenchState;
  onChange: (nextValue: HouseMvpWorkbenchState) => void;
}) {
  const typeFields = getHouseSupplementTypeFields(value.fieldSurvey.propertyType);

  return (
    <section className="space-y-4 rounded-md border border-slate-200 bg-white p-4">
      <div>
        <h2 className="text-base font-semibold">秘書後補</h2>
        <p className="text-sm text-slate-500">簽委託後補回合約、謄本核對、圖資與照片整理。</p>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-900">共通後補</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {HOUSE_SUPPLEMENT_COMMON_FIELDS.map((field) => (
            <SurveyFieldInput
              key={field.key}
              field={field}
              value={value.supplement.values[field.key] ?? ""}
              onChange={(nextValue) => onChange(updateSupplementValue(value, field.key, nextValue))}
            />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-900">{value.fieldSurvey.propertyType}後補</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {typeFields.map((field) => (
            <SurveyFieldInput
              key={field.key}
              field={field}
              value={value.supplement.values[field.key] ?? ""}
              onChange={(nextValue) => onChange(updateSupplementValue(value, field.key, nextValue))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function LivingFunctionFields({
  value,
  onChange,
}: {
  value: HouseMvpWorkbenchState;
  onChange: (nextValue: HouseMvpWorkbenchState) => void;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">生活機能</h2>
        <p className="text-sm text-slate-500">第一版要求系統自動產生地圖；失敗時仍可手動上傳覆蓋，不阻擋輸出。</p>
      </div>
      <label className="space-y-1 text-sm">
        <span className="text-slate-600">地址</span>
        <input
          aria-label="地址"
          className="w-full rounded-md border border-slate-300 px-2 py-1.5"
          value={value.livingFunction.addressText}
          onChange={(event) => onChange(updateLivingFunction(value, { addressText: event.target.value }))}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-sm">
          <span className="text-slate-600">緯度</span>
          <input
            className="w-full rounded-md border border-slate-300 px-2 py-1.5"
            value={value.livingFunction.latitude ?? ""}
            onChange={(event) =>
              onChange(updateLivingFunction(value, { latitude: event.target.value ? Number(event.target.value) : null }))
            }
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-600">經度</span>
          <input
            className="w-full rounded-md border border-slate-300 px-2 py-1.5"
            value={value.livingFunction.longitude ?? ""}
            onChange={(event) =>
              onChange(updateLivingFunction(value, { longitude: event.target.value ? Number(event.target.value) : null }))
            }
          />
        </label>
      </div>
      <label className="space-y-1 text-sm">
        <span className="text-slate-600">地圖來源</span>
        <select
          className="w-full rounded-md border border-slate-300 px-2 py-1.5"
          value={value.livingFunction.mapSource}
          onChange={(event) => onChange(updateLivingFunction(value, { mapSource: event.target.value as MapSource }))}
        >
          <option value="auto_generated">系統自動產生</option>
          <option value="manual_override">手動上傳覆蓋</option>
          <option value="blank">空白</option>
        </select>
      </label>
    </section>
  );
}

function ControlledTemplateFields({ type }: { type: "ownership" | "tax" }) {
  return (
    <section className="rounded-md border border-slate-200 p-4">
      <h2 className="text-base font-semibold">{type === "ownership" ? "產權注意事項" : "增值稅附註"}</h2>
      <p className="mt-2 text-sm text-slate-500">此頁使用固定模板。一般使用者只能補案件資料，不能直接改法務/稅務固定文字。</p>
    </section>
  );
}

function WorkbenchFields({
  value,
  onChange,
  imageUploadSlot,
  mode,
}: {
  value: HouseMvpWorkbenchState;
  onChange: (nextValue: HouseMvpWorkbenchState) => void;
  imageUploadSlot?: ReactNode;
  mode: HouseMvpWorkbenchMode;
}) {
  const imageSlot = imageUploadSlot ? <div className="pt-2">{imageUploadSlot}</div> : null;

  if (value.selectedPage === "condition_survey_highrise") {
    return (
      <>
        {mode === "formal_supplement" ? (
          <SupplementFields value={value} onChange={onChange} />
        ) : (
          <FieldSurveyFields value={value} onChange={onChange} />
        )}
        <ConditionSurveyFields value={value} onChange={onChange} />
        {imageSlot}
      </>
    );
  }

  if (value.selectedPage === "living_function") {
    return (
      <>
        <LivingFunctionFields value={value} onChange={onChange} />
        {imageSlot}
      </>
    );
  }

  if (value.selectedPage === "ownership_notes") {
    return <ControlledTemplateFields type="ownership" />;
  }

  return <ControlledTemplateFields type="tax" />;
}

function Preview({ value }: { value: HouseMvpWorkbenchState }) {
  if (value.selectedPage === "condition_survey_highrise") {
    return (
      <HouseMvpPagePreview
        page="condition_survey_highrise"
        payload={value.conditionSurvey}
        caseNo={value.caseNo}
        caseName={value.caseName}
        companyName={value.companyName}
      />
    );
  }

  if (value.selectedPage === "living_function") {
    return (
      <HouseMvpPagePreview
        page="living_function"
        payload={value.livingFunction}
        caseNo={value.caseNo}
        caseName={value.caseName}
        companyName={value.companyName}
      />
    );
  }

  if (value.selectedPage === "ownership_notes") {
    return (
      <HouseMvpPagePreview
        page="ownership_notes"
        payload={HOUSE_OWNERSHIP_NOTES_TEMPLATE}
        caseNo={value.caseNo}
        caseName={value.caseName}
        companyName={value.companyName}
      />
    );
  }

  return (
    <HouseMvpPagePreview
      page="tax_notes"
      payload={HOUSE_TAX_NOTES_TEMPLATE}
      caseNo={value.caseNo}
      caseName={value.caseName}
      companyName={value.companyName}
    />
  );
}

const workbenchModeCopy: Record<HouseMvpWorkbenchMode, { title: string; description: string }> = {
  field_survey: {
    title: "現場必問工作台",
    description: "給業務現場詢問、手寫與拍照；不混入案件建立流程。",
  },
  formal_supplement: {
    title: "秘書後補工作台",
    description: "簽委託後補回合約、謄本核對、照片整理與正式輸出資料；沿用同一份 Page Contract。",
  },
};

export function HouseMvpWorkbench({
  value,
  onChange,
  onSave,
  imageUploadSlots,
  mode = "field_survey",
  entitlement = getPlanEntitlements("basic"),
}: HouseMvpWorkbenchProps) {
  const modeCopy = workbenchModeCopy[mode];

  return (
    <section
      aria-label={modeCopy.title}
      data-mode={mode}
      data-testid="house-mvp-workbench"
      className="min-h-[calc(100vh-10rem)]"
    >
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-slate-950">{modeCopy.title}</h1>
        <p className="text-sm text-slate-500">{modeCopy.description}</p>
      </div>
      <div className="grid gap-5 2xl:grid-cols-[minmax(560px,0.9fr)_minmax(720px,1fr)]">
        <div data-testid="keyin-left-panel" className="min-w-0 space-y-4 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-4">
          <PageList
            selectedPage={value.selectedPage}
            onSelect={(selectedPage) => onChange({ ...value, selectedPage })}
          />
          <CaseMetaFields value={value} onChange={onChange} />
          <AutomationEntitlementPanel entitlement={entitlement} />
          <WorkbenchFields
            value={value}
            onChange={onChange}
            mode={mode}
            imageUploadSlot={imageUploadSlots?.[value.selectedPage]}
          />
          {onSave ? (
            <button
              type="button"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
              onClick={() => void onSave()}
            >
              儲存
            </button>
          ) : null}
        </div>
        <div data-testid="keyin-right-panel" className="min-w-0 overflow-y-auto rounded-md bg-slate-100 p-4">
          <div className="sticky top-4">
            <Preview value={value} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HouseMvpWorkbench;
