"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CaseRow } from "@/lib/cases-api";
import { mockInvoke } from "@/lib/mock-backend";
import {
  getAddressFirstClassification,
  getDemoFieldReviewRows,
  getUsageLedgerRows,
} from "@/lib/product-ui-demo-alignment";
import { isRegistryProvenancePayload } from "@/lib/registry-provenance";

interface DemoAlignedWorkbenchProps {
  caseData: CaseRow;
  initialTab?: string | null;
}

type WorkbenchTab = "fields" | "sources" | "supplements" | "pdf";
type FieldVisitDraftByTopic = Record<string, { answer: string; status: string }>;

interface WorkbenchSupplementDraft {
  caseId: string;
  fieldVisitAnswers: Array<{
    topic: string;
    answer: string;
    status: string;
    updatedAt?: string;
  }>;
  uploads: Array<{
    slot: string;
    fileName: string;
    savedAt?: string;
  }>;
  supplementAdded: boolean;
  updatedAt: string | null;
}

function normalizeWorkbenchTab(value?: string | null): WorkbenchTab {
  if (value === "sources" || value === "supplements" || value === "pdf") return value;
  if (value === "fieldVisit" || value === "costs") return "supplements";
  return "fields";
}

const WORKBENCH_TABS: Array<{ id: WorkbenchTab; label: string }> = [
  { id: "fields", label: "欄位" },
  { id: "sources", label: "資料來源" },
  { id: "supplements", label: "補件/現場" },
  { id: "pdf", label: "PDF 檢查" },
];

const ASSET_UPLOAD_SLOTS = ["地籍圖", "空拍圖", "格局圖", "地標圖", "LINE 照片"];

const FIELD_VISIT_QUESTIONS = [
  {
    topic: "建物現況",
    question: "目前是否有漏水、壁癌、傾斜、增建或其他屋況瑕疵？",
    source: "電話詢問或現場確認",
  },
  {
    topic: "設備與瑕疵",
    question: "冷氣、熱水器、廚具、衛浴等設備是否正常，哪些會保留或移除？",
    source: "電話詢問或現場確認",
  },
  {
    topic: "周邊環境",
    question: "是否有噪音、嫌惡設施、停車、管理費或鄰里糾紛需要揭露？",
    source: "電話詢問或現場確認",
  },
  {
    topic: "照片資料",
    question: "是否已取得外觀、室內、格局、地籍或空拍等補充圖資？",
    source: "現場拍攝或檔案上傳",
  },
];

export function DemoAlignedWorkbench({ caseData, initialTab }: DemoAlignedWorkbenchProps) {
  const [activeTab, setActiveTab] = useState<WorkbenchTab>(() => normalizeWorkbenchTab(initialTab));
  const [supplementAdded, setSupplementAdded] = useState(false);
  const [assetUploads, setAssetUploads] = useState<Record<string, string>>({});
  const [fieldVisitDrafts, setFieldVisitDrafts] = useState<FieldVisitDraftByTopic>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const classification = getAddressFirstClassification(caseData.address);
  const fields = getDemoFieldReviewRows(caseData);
  const usageRows = getUsageLedgerRows();
  const lookupCost =
    isRegistryProvenancePayload(caseData.land_registry_data) &&
    typeof caseData.land_registry_data.totalCost === "number"
      ? caseData.land_registry_data.totalCost
      : 27;
  const lookupCostNote =
    lookupCost === 0
      ? "本次只取得候選或待確認資料；查詢失敗與帳務同步不計費。"
      : "已完成建物所有權資料調閱；查詢失敗與帳務同步不計費。";
  const importedCount = fields.filter((field) => field.statusLabel === "地政已帶入").length + 40;
  const supplementCount = fields.filter((field) => field.statusLabel.includes("人工")).length + 12;
  const activeTabIndex = WORKBENCH_TABS.findIndex((tab) => tab.id === activeTab);
  const nextTab = WORKBENCH_TABS[activeTabIndex + 1];
  const registrySnapshot = {
    caseNo: caseData.case_no,
    address: caseData.address,
    registrySummary: {
      propertyType: classification.displayType,
      landCount: classification.landCount,
      buildingCount: classification.buildingCount,
    },
    importedFields: fields.map((field) => ({
      fieldName: field.fieldName,
      value: field.value,
      source: field.serviceName,
      status: field.statusLabel,
    })),
    usageRows: usageRows.map((row) => ({
      serviceName: row.serviceName,
      outcome: row.outcomeLabel,
      amount: row.amountLabel,
      reason: row.reason,
    })),
  };
  const registryJson = JSON.stringify(registrySnapshot, null, 2);
  const registryJsonHref = `data:application/json;charset=utf-8,${encodeURIComponent(registryJson)}`;
  const uploadedAssetCount = Object.values(assetUploads).filter(Boolean).length;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const draft = await mockInvoke<WorkbenchSupplementDraft>("get_workbench_supplement", {
          caseId: caseData.id,
        });
        if (cancelled) return;
        if (draft.fieldVisitAnswers.length > 0) {
          setFieldVisitDrafts(
            Object.fromEntries(
              draft.fieldVisitAnswers.map((row) => [
                row.topic,
                { answer: row.answer, status: row.status },
              ]),
            ),
          );
        }
        if (draft.uploads.length > 0) {
          setAssetUploads(
            Object.fromEntries(draft.uploads.map((row) => [row.slot, row.fileName])),
          );
        }
        if (draft.supplementAdded) {
          setSupplementAdded(true);
        }
      } catch {
        // Mock persistence is a browser-dev convenience; the workbench remains usable in memory-only mode.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [caseData.id]);

  function persistSupplementDraft({
    drafts = fieldVisitDrafts,
    uploads = assetUploads,
    added = supplementAdded,
  }: {
    drafts?: FieldVisitDraftByTopic;
    uploads?: Record<string, string>;
    added?: boolean;
  } = {}) {
    void mockInvoke("save_workbench_supplement", {
      caseId: caseData.id,
      fieldVisitAnswers: Object.entries(drafts).map(([topic, draft]) => ({
        topic,
        answer: draft.answer,
        status: draft.status,
      })),
      uploads: Object.entries(uploads)
        .filter(([, fileName]) => Boolean(fileName))
        .map(([slot, fileName]) => ({ slot, fileName })),
      supplementAdded: added,
    }).catch(() => {
      // Keep local UI usable if browser storage is blocked.
    });
  }

  function updateFieldVisitDraft(
    topic: string,
    patch: Partial<{ answer: string; status: string }>,
  ) {
    const nextDrafts = {
      ...fieldVisitDrafts,
      [topic]: {
        answer: fieldVisitDrafts[topic]?.answer ?? "",
        status: fieldVisitDrafts[topic]?.status ?? "待確認",
        ...patch,
      },
    };
    setFieldVisitDrafts(nextDrafts);
    persistSupplementDraft({ drafts: nextDrafts });
  }

  return (
    <section
      data-testid="demo-aligned-workbench"
      className="space-y-6 text-foreground"
      aria-label="物件審核"
    >
      <header className="flex flex-col gap-3 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">物件審核</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            案號 {caseData.case_no ?? "未編號"} · {classification.displayType} · 基本方案 ·
            地政查詢費由客戶的地政帳號負擔
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm" aria-label="審核操作">
          <Link className="rounded-md bg-slate-950 px-3 py-2 text-sm text-white" href={`/cases/${caseData.id}/preview`}>
            預覽 PDF
          </Link>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside
          aria-label="物件摘要"
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          role="region"
        >
          <div className="mb-4">
            <h2 className="text-base font-semibold">物件摘要</h2>
            <p className="text-sm text-muted-foreground">地政帶入與待手填項目</p>
          </div>

          <article className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
            <strong className="block">{caseData.case_name ?? "宜蘭五結農舍"}</strong>
            <span className="mt-1 block text-sm text-muted-foreground">
              {caseData.address}
            </span>
            <dl className="mt-3 grid gap-2 text-sm">
              <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-md bg-white/80 px-3 py-2">
                <dt className="text-muted-foreground">地政</dt>
                <dd className="text-right font-medium leading-snug">
                  <span className="block">土地 {classification.landCount} 筆</span>
                  <span className="block">建物 {classification.buildingCount} 筆</span>
                </dd>
              </div>
              <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-md bg-white/80 px-3 py-2">
                <dt className="text-muted-foreground">需確認</dt>
                <dd className="text-right font-medium leading-snug">門牌、屋主姓名</dd>
              </div>
            </dl>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md bg-white p-2">
                <span className="block text-muted-foreground">已帶入</span>
                <strong>{importedCount} 件</strong>
              </div>
              <div className="rounded-md bg-white p-2">
                <span className="block text-muted-foreground">需補件</span>
                <strong>{supplementCount} 件</strong>
              </div>
              <div className="rounded-md bg-white p-2">
                <span className="block text-muted-foreground">待補資料</span>
                <strong>8 件</strong>
              </div>
              <div className="rounded-md bg-white p-2">
                <span className="block text-muted-foreground">本次費用</span>
                <strong>{lookupCost.toLocaleString("zh-TW")} 元</strong>
              </div>
            </div>
          </article>
        </aside>

        <section
          aria-label="欄位審核"
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          role="region"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-base font-semibold">欄位審核</h2>
              <p className="text-sm text-muted-foreground">確認資料是否已帶入，缺資料就加入補件</p>
            </div>
            <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              23 欄待確認
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="工作分頁">
            {WORKBENCH_TABS.map((tab) => (
              <button
                key={tab.id}
                aria-selected={activeTab === tab.id}
                className={`rounded-md px-3 py-2 text-sm ${activeTab === tab.id ? "bg-slate-950 text-white" : "border"}`}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "fields" ? (
            <>
              <section className="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 p-4" aria-label="本次調閱費用">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">本次調閱費用：{lookupCost.toLocaleString("zh-TW")} 元</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {lookupCostNote}
                    </p>
                  </div>
                  <button className="w-fit rounded-md border bg-white px-3 py-2 text-sm" type="button" onClick={() => setActiveTab("sources")}>
                    查看資料來源
                  </button>
                </div>
              </section>

              <div className="mt-4 overflow-hidden rounded-lg border" aria-label="欄位審核表">
                {fields.map((field) => (
                  <article
                    key={field.fieldName}
                    className="grid border-b text-sm last:border-b-0 lg:grid-cols-[minmax(170px,1fr)_minmax(260px,1.35fr)_120px_76px]"
                  >
                    <div className="p-4">
                      <strong>{field.fieldName}</strong>
                      <span className="mt-1 block text-sm text-muted-foreground">{field.helper}</span>
                    </div>
                    <div className="border-t p-4 lg:border-l lg:border-t-0">
                      {editingField === field.fieldName ? (
                        <input
                          aria-label={`${field.fieldName}修改值`}
                          className="min-h-10 w-full rounded-md border px-3 py-2"
                          defaultValue={field.value}
                        />
                      ) : (
                        <span className="block">{field.value}</span>
                      )}
                      <span className="mt-1 block text-muted-foreground">{field.serviceName}</span>
                    </div>
                    <div className="flex items-start border-t p-4 lg:items-center lg:justify-center lg:border-l lg:border-t-0">
                      <span className="w-fit whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                        {field.statusLabel}
                      </span>
                    </div>
                    <div className="flex items-start border-t p-4 lg:items-center lg:justify-center lg:border-l lg:border-t-0">
                      <button
                        className="w-fit rounded-md border px-3 py-2 text-sm"
                        type="button"
                        onClick={() => setEditingField((current) => (current === field.fieldName ? null : field.fieldName))}
                      >
                        {editingField === field.fieldName ? "完成" : "修改"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : null}

          {activeTab === "sources" ? (
            <section className="mt-4 rounded-lg border p-4" aria-label="欄位資料來源">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-sm font-semibold">地政匯入資料</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    這裡核對已帶入、待補件與查詢失敗的來源資料；可下載 JSON 留存或交給工程端排查。
                  </p>
                </div>
                <a
                  className="w-fit rounded-md border px-3 py-2 text-sm"
                  download={`${caseData.case_no ?? caseData.id}-registry-source.json`}
                  href={registryJsonHref}
                >
                  下載 JSON
                </a>
              </div>
              <table className="mt-3 w-full table-fixed overflow-hidden rounded-md border text-sm">
                <colgroup>
                  <col className="w-[40%]" />
                  <col className="w-[40%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead className="sr-only">
                  <tr>
                    <th scope="col">欄位</th>
                    <th scope="col">資料來源</th>
                    <th scope="col">狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => (
                    <tr key={field.fieldName} className="border-b last:border-b-0">
                      <th className="px-3 py-3 text-left font-medium" scope="row">
                        {field.fieldName}
                      </th>
                      <td className="px-3 py-3 text-muted-foreground">{field.serviceName}</td>
                      <td className="px-3 py-3 text-right font-medium">{field.statusLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <details className="mt-4 rounded-lg border bg-slate-50 p-3">
                <summary className="cursor-pointer text-sm font-medium">JSON 預覽</summary>
                <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-white p-3 text-xs">
                  {registryJson}
                </pre>
              </details>
            </section>
          ) : null}

          {activeTab === "supplements" ? (
            <section className="mt-4 rounded-lg border p-4" aria-label="補件與現場確認">
              <h3 className="text-sm font-semibold">補件與現場確認</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                客戶來電、現場看屋或 LINE 傳照片時，都在這裡直接填寫與上傳；答不出來的項目再留在補件清單。
              </p>
              <div className="mt-3 overflow-hidden rounded-lg border" aria-label="現場必問表單">
                {FIELD_VISIT_QUESTIONS.map((item) => (
                  <article key={item.topic} className="grid gap-3 border-b p-3 last:border-b-0 md:grid-cols-[150px_minmax(0,1fr)_180px]">
                    <div>
                      <strong className="block text-sm">{item.topic}</strong>
                      <span className="mt-1 block text-xs text-muted-foreground">{item.source}</span>
                    </div>
                    <label className="text-sm">
                      <span className="font-medium">{item.question}</span>
                      <textarea
                        aria-label={`${item.topic}回答`}
                        className="mt-2 min-h-20 w-full rounded-md border px-3 py-2"
                        placeholder="輸入客戶回覆、現場狀況或待補原因"
                        value={fieldVisitDrafts[item.topic]?.answer ?? ""}
                        onChange={(event) => updateFieldVisitDraft(item.topic, { answer: event.target.value })}
                      />
                    </label>
                    <label className="text-sm">
                      <span className="font-medium">狀態</span>
                      <select
                        aria-label={`${item.topic}狀態`}
                        className="mt-2 min-h-10 w-full rounded-md border px-3 py-2"
                        value={fieldVisitDrafts[item.topic]?.status ?? "待確認"}
                        onChange={(event) => updateFieldVisitDraft(item.topic, { status: event.target.value })}
                      >
                        <option>待確認</option>
                        <option>已確認</option>
                        <option>加入補件</option>
                      </select>
                    </label>
                  </article>
                ))}
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {ASSET_UPLOAD_SLOTS.map((slot) => (
                  <label key={slot} className="rounded-md border p-3 text-sm">
                    <span className="font-medium">{slot}上傳</span>
                    <input
                      className="mt-2 block w-full text-xs"
                      type="file"
                      accept="image/*,.pdf"
                      aria-label={`${slot}上傳`}
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];
                        if (file) {
                          const nextUploads = { ...assetUploads, [slot]: file.name };
                          setAssetUploads(nextUploads);
                          persistSupplementDraft({ uploads: nextUploads });
                        }
                      }}
                    />
                    <span className="mt-2 block text-xs text-muted-foreground">
                      {assetUploads[slot] ? `已選擇：${assetUploads[slot]}` : "尚未上傳"}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <button
                  className="rounded-md border px-3 py-2 text-sm"
                  type="button"
                  onClick={() => {
                    setSupplementAdded(true);
                    persistSupplementDraft({ added: true });
                  }}
                >
                  加入補件清單
                </button>
              </div>
              {supplementAdded ? <p className="mt-3 text-sm font-medium text-emerald-700">已加入補件清單</p> : null}
            </section>
          ) : null}

          {activeTab === "pdf" ? (
            <section className="mt-4 rounded-lg border p-4" aria-label="PDF 檢查內容">
              <h3 className="text-sm font-semibold">PDF 檢查</h3>
              <p className="mt-1 text-sm text-muted-foreground">預覽前先確認欄位與圖資是否已補齊。</p>
              <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                <div className="rounded-md bg-slate-50 p-3">待確認欄位：23 欄</div>
                <div className="rounded-md bg-slate-50 p-3">已上傳圖資：{uploadedAssetCount} 項</div>
              </div>
              <Link className="mt-3 inline-flex rounded-md bg-slate-950 px-3 py-2 text-sm text-white" href={`/cases/${caseData.id}/preview`}>
                開啟 PDF 預覽
              </Link>
            </section>
          ) : null}

          <footer className="mt-5 flex justify-end border-t pt-4">
            {nextTab ? (
              <button
                className="rounded-md bg-slate-950 px-4 py-2 text-sm text-white"
                type="button"
                onClick={() => setActiveTab(nextTab.id)}
              >
                下一步：{nextTab.label}
              </button>
            ) : (
              <Link className="rounded-md bg-slate-950 px-4 py-2 text-sm text-white" href={`/cases/${caseData.id}/preview`}>
                完成並預覽 PDF
              </Link>
            )}
          </footer>
        </section>
      </div>
    </section>
  );
}
