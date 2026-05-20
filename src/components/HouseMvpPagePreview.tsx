"use client";

import Image from "next/image";

import type {
  HouseConditionSurveyDraft,
  HouseLivingFunctionDraft,
  HouseOwnershipNotesTemplate,
  HouseTaxNotesTemplate,
  SurveyQuestionDraft,
} from "@/lib/page-contracts/house-mvp";

type HouseMvpPreviewPage =
  | "condition_survey_highrise"
  | "living_function"
  | "ownership_notes"
  | "tax_notes";

interface HouseMvpPagePreviewBaseProps {
  caseNo: string;
  caseName: string;
  companyName?: string;
  logoDataUrl?: string | null;
}

type HouseMvpPagePreviewProps =
  | (HouseMvpPagePreviewBaseProps & {
      page: Extract<HouseMvpPreviewPage, "condition_survey_highrise">;
      payload: HouseConditionSurveyDraft;
    })
  | (HouseMvpPagePreviewBaseProps & {
      page: Extract<HouseMvpPreviewPage, "living_function">;
      payload: HouseLivingFunctionDraft;
    })
  | (HouseMvpPagePreviewBaseProps & {
      page: Extract<HouseMvpPreviewPage, "ownership_notes">;
      payload: HouseOwnershipNotesTemplate;
    })
  | (HouseMvpPagePreviewBaseProps & {
      page: Extract<HouseMvpPreviewPage, "tax_notes">;
      payload: HouseTaxNotesTemplate;
    });

const paperClassName =
  "mx-auto min-h-[900px] w-full max-w-[794px] bg-white px-8 py-7 text-[13px] leading-relaxed text-slate-950 shadow-sm ring-1 ring-slate-200";

function pageTitle(props: HouseMvpPagePreviewProps) {
  if (props.page === "condition_survey_highrise") {
    return "肆、現況調查表";
  }

  if (props.page === "living_function") {
    return "位置圖與生活機能";
  }

  return props.payload.title;
}

function mapSourceLabel(source: HouseLivingFunctionDraft["mapSource"]): string {
  if (source === "auto_generated") {
    return "地圖來源：系統自動產生";
  }

  if (source === "manual_override") {
    return "地圖來源：手動上傳覆蓋";
  }

  return "地圖來源：";
}

function PreviewHeader({
  title,
  caseNo,
  caseName,
  companyName,
  logoDataUrl,
}: HouseMvpPagePreviewBaseProps & { title: string }) {
  return (
    <header className="mb-5 border-b border-slate-900 pb-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] text-slate-500">{companyName ?? ""}</p>
          <h1 className="mt-1 text-xl font-semibold tracking-normal">{title}</h1>
        </div>
        {logoDataUrl ? (
          <Image
            src={logoDataUrl}
            alt="公司 Logo"
            width={72}
            height={40}
            className="h-10 w-[72px] object-contain"
            unoptimized
          />
        ) : (
          <div aria-label="公司 Logo 空白區" className="h-10 w-[72px] border border-dashed border-slate-300" />
        )}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-[12px]">
        <div className="flex gap-2">
          <dt className="text-slate-500">案號</dt>
          <dd className="min-w-0 flex-1 border-b border-slate-300">{caseNo}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-slate-500">物件名稱</dt>
          <dd className="min-w-0 flex-1 border-b border-slate-300">{caseName}</dd>
        </div>
      </dl>
    </header>
  );
}

function EmptyCheckbox({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <span aria-label="空白勾選框" className="inline-block h-3 w-3 border border-slate-700" />
      <span>{label}</span>
    </span>
  );
}

function SurveyQuestionRow({ question }: { question: SurveyQuestionDraft }) {
  return (
    <tr data-testid="survey-question-row" className="break-inside-avoid border-b border-slate-300 align-top">
      <td className="w-10 px-2 py-2 text-center">{question.questionNo}</td>
      <td className="px-2 py-2">{question.label}</td>
      <td className="w-[150px] px-2 py-2">
        {question.answerType === "amount" ? (
          <div aria-label="可手寫空白欄" className="h-6 border-b border-slate-400" />
        ) : (
          <div className="flex items-center gap-4">
            <EmptyCheckbox label="是" />
            <EmptyCheckbox label="否" />
          </div>
        )}
      </td>
      <td className="w-[180px] px-2 py-2">
        <div aria-label="可手寫空白欄" className="h-6 border-b border-slate-400" />
      </td>
    </tr>
  );
}

function ConditionSurveyPreview({ payload }: { payload: HouseConditionSurveyDraft }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between text-[12px]">
        <span>類型：{payload.propertyType}</span>
        <span>表單版本：{payload.formVersion}</span>
      </div>
      <table className="w-full border-collapse border border-slate-900">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-900 px-2 py-2 text-center font-medium">項次</th>
            <th className="border border-slate-900 px-2 py-2 text-left font-medium">調查事項</th>
            <th className="border border-slate-900 px-2 py-2 text-left font-medium">勾選/金額</th>
            <th className="border border-slate-900 px-2 py-2 text-left font-medium">備註</th>
          </tr>
        </thead>
        <tbody>
          {payload.questions.map((question) => (
            <SurveyQuestionRow key={question.questionNo} question={question} />
          ))}
        </tbody>
      </table>
    </section>
  );
}

function LivingFunctionPreview({ payload }: { payload: HouseLivingFunctionDraft }) {
  const facilities =
    payload.facilities.length > 0
      ? payload.facilities
      : Array.from({ length: 6 }, (_, index) => ({
          index: index + 1,
          name: "",
          category: "",
          distanceM: "",
        }));

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-[1.4fr_1fr] gap-4">
        <div
          aria-label="位置圖空白區"
          className="flex min-h-[300px] items-center justify-center border border-slate-900 bg-slate-50"
        >
          {payload.mapAssetId ? <span>位置圖</span> : null}
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-[12px] text-slate-500">地址</p>
            <p className="min-h-7 border-b border-slate-400">{payload.addressText}</p>
          </div>
          <div>
            <p className="text-[12px] text-slate-500">座標</p>
            <p className="min-h-7 border-b border-slate-400">
              {payload.latitude === null || payload.longitude === null ? "" : `${payload.latitude}, ${payload.longitude}`}
            </p>
          </div>
          <p>{mapSourceLabel(payload.mapSource)}</p>
          <p className="text-[12px] text-slate-600">自動產生失敗時可手動上傳覆蓋</p>
        </div>
      </div>
      <table className="w-full border-collapse border border-slate-900">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-900 px-2 py-2 text-center font-medium">項次</th>
            <th className="border border-slate-900 px-2 py-2 text-left font-medium">類別</th>
            <th className="border border-slate-900 px-2 py-2 text-left font-medium">設施名稱</th>
            <th className="border border-slate-900 px-2 py-2 text-left font-medium">距離</th>
          </tr>
        </thead>
        <tbody>
          {facilities.map((facility) => (
            <tr key={facility.index} className="border-b border-slate-300">
              <td className="px-2 py-2 text-center">{facility.index}</td>
              <td className="px-2 py-2">{facility.category}</td>
              <td className="px-2 py-2">{facility.name}</td>
              <td className="px-2 py-2">{facility.distanceM}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function OwnershipNotesPreview({ payload }: { payload: HouseOwnershipNotesTemplate }) {
  return (
    <section>
      <ol className="space-y-2">
        {payload.clauses.map((clause) => (
          <li key={clause.key} data-testid="ownership-clause-row" className="grid grid-cols-[32px_1fr] gap-2">
            <span>{clause.index}.</span>
            <div>
              <p className="font-medium">{clause.topic}</p>
              <p>{clause.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function TaxNotesPreview({ payload }: { payload: HouseTaxNotesTemplate }) {
  return (
    <section className="space-y-3">
      <p className="border border-slate-900 p-2">{payload.estimateCaveat}</p>
      <ol className="space-y-2">
        {payload.notes.map((note) => (
          <li key={note.key} data-testid="tax-note-row" className="grid grid-cols-[32px_1fr] gap-2">
            <span>{note.index}.</span>
            <div>
              <p className="font-medium">{note.topic}</p>
              <p>{note.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function HouseMvpPagePreview(props: HouseMvpPagePreviewProps) {
  const title = pageTitle(props);

  return (
    <article data-testid="house-mvp-preview" className={paperClassName}>
      <PreviewHeader
        title={title}
        caseNo={props.caseNo}
        caseName={props.caseName}
        companyName={props.companyName}
        logoDataUrl={props.logoDataUrl}
      />
      {props.page === "condition_survey_highrise" ? <ConditionSurveyPreview payload={props.payload} /> : null}
      {props.page === "living_function" ? <LivingFunctionPreview payload={props.payload} /> : null}
      {props.page === "ownership_notes" ? <OwnershipNotesPreview payload={props.payload} /> : null}
      {props.page === "tax_notes" ? <TaxNotesPreview payload={props.payload} /> : null}
    </article>
  );
}

export default HouseMvpPagePreview;
