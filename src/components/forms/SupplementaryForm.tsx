'use client'

import { useMemo, useState } from 'react'

type SupplementaryFormProps = {
  onSubmit: (data: Record<string, unknown>) => void
  onGenerateDocuments: () => void
}

type SupplementaryState = {
  transcript_summary: string
  cadastral_map_ref: string
  land_use_zoning: string
  mortgage_lien_status: string
  additional_notes: string
}

const inputClassName =
  'mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'

const buildPayload = (form: SupplementaryState): Record<string, unknown> => ({
  transcript_summary: form.transcript_summary.trim(),
  cadastral_map_ref: form.cadastral_map_ref.trim(),
  land_use_zoning: form.land_use_zoning.trim(),
  mortgage_lien_status: form.mortgage_lien_status,
  additional_notes: form.additional_notes.trim(),
})

export default function SupplementaryForm({
  onSubmit,
  onGenerateDocuments,
}: SupplementaryFormProps) {
  const [form, setForm] = useState<SupplementaryState>({
    transcript_summary: '',
    cadastral_map_ref: '',
    land_use_zoning: '',
    mortgage_lien_status: '',
    additional_notes: '',
  })

  const isComplete = useMemo(
    () =>
      form.transcript_summary.trim() !== '' &&
      form.cadastral_map_ref.trim() !== '' &&
      form.land_use_zoning.trim() !== '' &&
      form.mortgage_lien_status.trim() !== '',
    [form]
  )

  const updateField = (field: keyof SupplementaryState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleGenerateDocuments = () => {
    if (!isComplete) {
      return
    }

    const payload = buildPayload(form)

    onSubmit(payload)

    onGenerateDocuments()
  }

  return (
    <section className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">補件表單</h2>

      <p className="mt-1 text-sm text-slate-600">請先補齊必要資料，再產出文件。</p>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700 lg:col-span-2">
          謄本摘要
          <textarea
            value={form.transcript_summary}
            onChange={(event) => updateField('transcript_summary', event.target.value)}
            className={`${inputClassName} min-h-32 resize-y`}
            placeholder="請輸入謄本重點摘要"
            required
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          地籍圖參考
          <input
            type="text"
            value={form.cadastral_map_ref}
            onChange={(event) => updateField('cadastral_map_ref', event.target.value)}
            className={inputClassName}
            placeholder="請輸入地籍圖參考資訊"
            required
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          使用分區
          <input
            type="text"
            value={form.land_use_zoning}
            onChange={(event) => updateField('land_use_zoning', event.target.value)}
            className={inputClassName}
            placeholder="請輸入使用分區"
            required
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          抵押/查封狀況
          <select
            value={form.mortgage_lien_status}
            onChange={(event) => updateField('mortgage_lien_status', event.target.value)}
            className={inputClassName}
            required
          >
            <option value="">請選擇狀況</option>
            <option value="無">無</option>
            <option value="有抵押">有抵押</option>
            <option value="有查封">有查封</option>
            <option value="有抵押及查封">有抵押及查封</option>
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700 lg:col-span-2">
          其他備註
          <textarea
            value={form.additional_notes}
            onChange={(event) => updateField('additional_notes', event.target.value)}
            className={`${inputClassName} min-h-28 resize-y`}
            placeholder="可選填"
          />
        </label>

        <div className="flex justify-end lg:col-span-2">
          <button
            type="button"
            disabled={!isComplete}
            onClick={handleGenerateDocuments}
            className={`rounded-lg px-5 py-3 text-sm font-medium text-white transition-colors ${
              isComplete ? 'bg-green-600 hover:bg-green-700' : 'cursor-not-allowed bg-slate-400'
            }`}
          >
            Generate Documents 產出文件
          </button>
        </div>
      </div>
    </section>
  )
}
