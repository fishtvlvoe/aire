"use client";

interface CaseWizardStep4Props {
  onExport: () => void;
}

export function CaseWizardStep4({ onExport }: CaseWizardStep4Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">請確認資料後匯出 PDF。</p>
      <button type="button" className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" onClick={onExport}>
        匯出
      </button>
    </div>
  );
}
