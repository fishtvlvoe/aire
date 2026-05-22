"use client";

import Link from "next/link";
import { useState } from "react";
import type { CaseRow } from "@/lib/cases-api";
import {
  getAddressFirstClassification,
  getDemoFieldReviewRows,
  getUsageLedgerRows,
} from "@/lib/product-ui-demo-alignment";
import { getCaseWorkbenchNavigation } from "@/lib/product-navigation-ia";

interface DemoAlignedWorkbenchProps {
  caseData: CaseRow;
  initialTab?: string | null;
}

type WorkbenchTab = "fields" | "sources" | "supplements" | "costs" | "pdf";

function normalizeWorkbenchTab(value?: string | null): WorkbenchTab {
  if (value === "sources" || value === "supplements" || value === "costs" || value === "pdf") return value;
  return "fields";
}

const WORKBENCH_TABS: Array<{ id: WorkbenchTab; label: string }> = [
  { id: "fields", label: "欄位" },
  { id: "sources", label: "資料來源" },
  { id: "supplements", label: "補件" },
  { id: "costs", label: "費用" },
  { id: "pdf", label: "PDF 檢查" },
];

const ASSET_UPLOAD_SLOTS = ["地籍圖", "空拍圖", "格局圖", "地標圖"];

export function DemoAlignedWorkbench({ caseData, initialTab }: DemoAlignedWorkbenchProps) {
  const [activeTab, setActiveTab] = useState<WorkbenchTab>(() => normalizeWorkbenchTab(initialTab));
  const [supplementAdded, setSupplementAdded] = useState(false);
  const [assetUploads, setAssetUploads] = useState<Record<string, string>>({});
  const classification = getAddressFirstClassification(caseData.address);
  const fields = getDemoFieldReviewRows(caseData);
  const usageRows = getUsageLedgerRows();
  const caseTasks = getCaseWorkbenchNavigation();
  const importedCount = fields.filter((field) => field.statusLabel === "地政已帶入").length + 40;
  const supplementCount = fields.filter((field) => field.statusLabel.includes("人工")).length + 12;

  return (
    <section
      data-testid="demo-aligned-workbench"
      className="space-y-6 text-foreground"
      aria-label="說明書工作台"
    >
      <header className="flex flex-col gap-3 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">說明書工作台</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            案號 {caseData.case_no ?? "未編號"} · {classification.displayType} · 基本方案 ·
            地政查詢費由客戶的地政帳號負擔
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm" aria-label="工作台狀態">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-muted-foreground">
            地政重查：後端串接中
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-muted-foreground">
            自動補件：後端串接中
          </span>
          <Link className="rounded-md bg-slate-950 px-3 py-2 text-sm text-white" href={`/cases/${caseData.id}/preview`}>
            預覽 PDF
          </Link>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside
          aria-label="案件與章節"
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          role="region"
        >
          <div className="mb-4">
            <h2 className="text-base font-semibold">案件與章節</h2>
            <p className="text-sm text-muted-foreground">先用地址判斷，再審說明書欄位</p>
          </div>

          <article className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
            <strong className="block">{caseData.case_name ?? "宜蘭五結農舍"}</strong>
            <span className="mt-1 block text-sm text-muted-foreground">
              土地 {classification.landCount} 筆 · 建物 {classification.buildingCount} 筆 ·
              門牌需人工確認
            </span>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md bg-white p-2">
                <span className="block text-muted-foreground">已帶入</span>
                <strong>{importedCount}</strong>
              </div>
              <div className="rounded-md bg-white p-2">
                <span className="block text-muted-foreground">需補件</span>
                <strong>{supplementCount}</strong>
              </div>
              <div className="rounded-md bg-white p-2">
                <span className="block text-muted-foreground">待補資料</span>
                <strong>8</strong>
              </div>
              <div className="rounded-md bg-white p-2">
                <span className="block text-muted-foreground">本次費用</span>
                <strong>27</strong>
              </div>
            </div>
          </article>

          <article className="mt-4 rounded-lg border p-4">
            <strong className="block">地址與地政判斷</strong>
            <span className="text-sm text-muted-foreground">先由地址自動判斷土地與建物資料</span>
            <p className="mt-3 text-sm">{caseData.address}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">判斷結果</dt>
                <dd className="font-medium">{classification.displayType}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">地政結果</dt>
                <dd className="text-right">{classification.summary}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">人工選擇</dt>
                <dd className="text-right">{classification.note}</dd>
              </div>
            </dl>
          </article>

          <article className="mt-4 rounded-lg border p-4">
            <strong className="block">說明書章節</strong>
            <span className="text-sm text-muted-foreground">依地政判斷自動切到需要審核的章節</span>
            <div className="mt-3 flex flex-wrap gap-2">
              {caseTasks.map((item) => (
                <button
                  key={item.label}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    item.label === "地政資料" ? "border-emerald-300 bg-emerald-50 text-emerald-800" : ""
                  }`}
                  type="button"
                  onClick={() => {
                    if (item.label === "補件") setActiveTab("supplements");
                    if (item.label === "PDF 檢查") setActiveTab("pdf");
                    if (item.label === "地政資料") setActiveTab("sources");
                  }}
                >
                  {item.label}
                </button>
              ))}
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
              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                <Metric label="地政已帶入" value="42" />
                <Metric label="屋主提供" value="3" />
                <Metric label="查詢未成功" value="2" />
                <Metric label="累計費用" value="27 元" />
              </div>

              <div className="mt-4 divide-y rounded-lg border">
                {fields.map((field) => (
                  <article key={field.fieldName} className="grid gap-3 p-4 md:grid-cols-[1.3fr_1fr_auto] md:items-center">
                    <div>
                      <strong>{field.fieldName}</strong>
                      <span className="mt-1 block text-sm text-muted-foreground">{field.helper}</span>
                    </div>
                    <div className="text-sm">
                      <span className="block">{field.value}</span>
                      <span className="mt-1 block text-muted-foreground">{field.serviceName}</span>
                    </div>
                    <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                      {field.statusLabel}
                    </span>
                  </article>
                ))}
              </div>
            </>
          ) : null}

          {activeTab === "sources" ? (
            <section className="mt-4 rounded-lg border p-4" aria-label="欄位資料來源">
              <h3 className="text-sm font-semibold">欄位資料來源</h3>
              <div className="mt-3 divide-y rounded-md border">
                {fields.map((field) => (
                  <div key={field.fieldName} className="grid gap-2 p-3 text-sm md:grid-cols-[1fr_1fr_auto]">
                    <span>{field.fieldName}</span>
                    <span className="text-muted-foreground">{field.serviceName}</span>
                    <span>{field.statusLabel}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === "costs" ? (
            <section className="mt-4 rounded-lg border bg-slate-50 p-4" aria-label="費用摘要">
              <h3 className="text-sm font-semibold">費用成功與失敗紀錄</h3>
              <div className="mt-3 grid gap-2">
                {usageRows.map((row) => (
                  <div key={`${row.serviceName}-${row.outcomeLabel}`} className="grid gap-2 rounded-md bg-white p-3 text-sm md:grid-cols-[1fr_auto_auto]">
                    <span>{row.serviceName}</span>
                    <span>{row.outcomeLabel} · {row.returnRowsLabel}</span>
                    <strong>{row.amountLabel}</strong>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === "supplements" ? (
            <section className="mt-4 rounded-lg border p-4" aria-label="補件與現場確認">
              <h3 className="text-sm font-semibold">補件與現場確認</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                保留現場必問、正式補件與手動覆蓋能力；基本款可手動上傳 PDF 圖資，進階款才自動取得或 AI 整理。
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
                        if (file) setAssetUploads((prev) => ({ ...prev, [slot]: file.name }));
                      }}
                    />
                    <span className="mt-2 block text-xs text-muted-foreground">
                      {assetUploads[slot] ? `已選擇：${assetUploads[slot]}` : "尚未上傳"}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <button className="rounded-md border px-3 py-2 text-sm" type="button" onClick={() => setSupplementAdded(true)}>
                  加入補件清單
                </button>
                <button className="rounded-md border px-3 py-2 text-sm" type="button" onClick={() => setSupplementAdded(true)}>
                  現場必問
                </button>
                <button className="rounded-md border px-3 py-2 text-sm" type="button" onClick={() => setSupplementAdded(true)}>
                  手動上傳覆蓋
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
                <div className="rounded-md bg-slate-50 p-3">已上傳圖資：{Object.keys(assetUploads).length} 項</div>
              </div>
              <Link className="mt-3 inline-flex rounded-md bg-slate-950 px-3 py-2 text-sm text-white" href={`/cases/${caseData.id}/preview`}>
                開啟 PDF 預覽
              </Link>
            </section>
          ) : null}
        </section>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-slate-50 p-3">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <strong className="mt-1 block text-lg">{value}</strong>
    </div>
  );
}
