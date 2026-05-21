"use client";

import type { CaseRow } from "@/lib/cases-api";
import {
  getAddressFirstClassification,
  getDemoFieldReviewRows,
  getUsageLedgerRows,
} from "@/lib/product-ui-demo-alignment";

interface DemoAlignedWorkbenchProps {
  caseData: CaseRow;
}

const chapterLabels = ["基本資料", "土地標示", "建物權利", "限制風險", "現場確認", "稅費紀錄"];

export function DemoAlignedWorkbench({ caseData }: DemoAlignedWorkbenchProps) {
  const classification = getAddressFirstClassification(caseData.address);
  const fields = getDemoFieldReviewRows(caseData);
  const usageRows = getUsageLedgerRows();
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
        <div className="flex flex-wrap gap-2">
          <button className="rounded-md border px-3 py-2 text-sm" type="button">
            重新查詢
          </button>
          <button className="rounded-md border px-3 py-2 text-sm" type="button">
            產生補件清單
          </button>
          <button className="rounded-md bg-slate-950 px-3 py-2 text-sm text-white" type="button">
            預覽 PDF
          </button>
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
              {chapterLabels.map((label) => (
                <button
                  key={label}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    label === "建物權利" ? "border-emerald-300 bg-emerald-50 text-emerald-800" : ""
                  }`}
                  type="button"
                >
                  {label}
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
            {["欄位", "資料來源", "補件", "費用", "PDF 檢查"].map((label) => (
              <button
                key={label}
                className={`rounded-md px-3 py-2 text-sm ${label === "欄位" ? "bg-slate-950 text-white" : "border"}`}
                role="tab"
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

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

          <section className="mt-4 rounded-lg border p-4" aria-label="補件與現場確認">
            <h3 className="text-sm font-semibold">補件與現場確認</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              保留現場必問、正式補件與手動覆蓋能力，但不在工作台常駐顯示升級規則。
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <button className="rounded-md border px-3 py-2 text-sm" type="button">
                加入補件清單
              </button>
              <button className="rounded-md border px-3 py-2 text-sm" type="button">
                現場確認
              </button>
              <button className="rounded-md border px-3 py-2 text-sm" type="button">
                手動上傳覆蓋
              </button>
            </div>
          </section>
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
