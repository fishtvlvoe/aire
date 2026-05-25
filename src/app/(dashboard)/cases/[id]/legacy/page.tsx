"use client";

import { useParams, useSearchParams } from "next/navigation";
import { CaseWizard } from "@/components/case-wizard/CaseWizard";
import { resolveRuntimeCaseId } from "@/lib/case-routes";

export default function LegacyCaseWizardPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = resolveRuntimeCaseId(params?.id, searchParams);

  if (!id) {
    return (
      <main className="p-6">
        <p className="text-muted-foreground">載入中…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 lg:px-6">
      <header className="border-b pb-4">
        <h1 className="text-xl font-semibold tracking-normal">舊版案件流程</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          此頁保留給內部檢查與過渡使用，正式工作流程請使用說明書工作台。
        </p>
      </header>
      <CaseWizard caseId={id} />
    </main>
  );
}
