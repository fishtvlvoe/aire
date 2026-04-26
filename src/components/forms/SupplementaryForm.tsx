'use client'

import { useMemo, useState } from 'react'
import type { PropertyType } from '@/lib/property-types'
import { formatLabelWithUnit } from '@/lib/property-types/units'
import ProvenanceBadge from '@/components/ui/ProvenanceBadge'
import type { FieldWithProvenance } from '@/lib/ocr'
import {
  apartmentSchema,
  commercialLandSchema,
  factorySchema,
  farmhouseSchema,
  farmlandSchema,
  highriseSchema,
  industrialLandSchema,
  otherLandSchema,
  residentialLandSchema,
  ruralLandSchema,
  shopSchema,
  suiteSchema,
  townhouseSchema,
} from '@/lib/property-types/schemas'

type SchemaField = {
  key: string
  label: string
  type: string
  required: boolean
  sourceType?: string
  displayMode?: string
  options?: string[]
}

type PropertySchema = {
  common: SchemaField[]
  building_common?: SchemaField[]
  land_common?: SchemaField[]
  type_specific: SchemaField[]
  supplementary_specific?: SchemaField[]
}

const SCHEMA_MAP: Record<PropertyType, PropertySchema> = {
  apartment: apartmentSchema,
  highrise: highriseSchema,
  townhouse: townhouseSchema,
  suite: suiteSchema,
  shop: shopSchema,
  factory: factorySchema,
  farmhouse: farmhouseSchema,
  farmland: farmlandSchema,
  'residential-land': residentialLandSchema,
  'industrial-land': industrialLandSchema,
  'commercial-land': commercialLandSchema,
  'rural-land': ruralLandSchema,
  'other-land': otherLandSchema,
}

// Return all secretary/supplementary fields from a schema
// Priority: sourceType === 'secretary' → supplementary_specific → fallback keys
const SECRETARY_FALLBACK_KEYS = new Set([
  'management_fee',
  'insurance_notes',
  'notes',
  'pros_cons',
  'additional_notes',
  'usage',
  'seller_notes',
  'zoning_regulations',
  'building_restrictions',
  'additional_documents',
  'security_system',
  'amenities',
])

const getSecretaryFields = (schema: PropertySchema): SchemaField[] => {
  const allFields: SchemaField[] = [
    ...schema.common,
    ...(schema.building_common ?? []),
    ...(schema.land_common ?? []),
    ...schema.type_specific,
  ]

  // Check if any field has explicit sourceType annotation
  const hasSourceTypeAnnotations = allFields.some((f) => f.sourceType !== undefined)

  if (hasSourceTypeAnnotations) {
    const fromMain = allFields.filter((f) => f.sourceType === 'secretary')
    const fromSupplementary = (schema.supplementary_specific ?? []).filter(
      (f) => f.sourceType === 'secretary' || f.sourceType === undefined
    )
    return [...fromMain, ...fromSupplementary]
  }

  // Fallback: use supplementary_specific + known secretary keys
  const fromSupplementary = schema.supplementary_specific ?? []
  const fromFallbackKeys = allFields.filter((f) => SECRETARY_FALLBACK_KEYS.has(f.key))
  const seen = new Set<string>()
  const merged: SchemaField[] = []
  for (const f of [...fromSupplementary, ...fromFallbackKeys]) {
    if (!seen.has(f.key)) {
      seen.add(f.key)
      merged.push(f)
    }
  }
  return merged
}

export type SupplementaryFormProps = {
  onSubmit: (data: Record<string, unknown>) => void
  onGenerateDocuments: () => void
  /** When provided, fields are loaded from the matching schema */
  propertyType?: PropertyType
  /** Read-only data fetched before commission */
  preCommissionData?: Record<string, unknown> | null
  /**
   * Task 4.4: OCR 合併欄位資料（含 provenance），用於顯示來源徽章
   * key 對應 field.key
   */
  mergedFields?: Record<string, FieldWithProvenance>
}

const inputClassName =
  'mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'

const PRECOMMISSION_PRIORITY_KEYS = ['owner_name', 'owner_phone', 'address', 'parcel_number'] as const

const formatReadonlyValue = (value: unknown): string => {
  if (value === null) return 'null'
  if (value === undefined) return ''
  if (typeof value === 'string') return value === '' ? '(空白)' : value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export default function SupplementaryForm({
  onSubmit,
  onGenerateDocuments,
  propertyType,
  preCommissionData,
  mergedFields,
}: SupplementaryFormProps) {
  const [form, setForm] = useState<Record<string, string>>({})
  const [isExpanded, setIsExpanded] = useState(true)

  // Dynamic fields based on schema; fall back to built-in static fields
  const dynamicFields = useMemo<SchemaField[] | null>(() => {
    if (!propertyType) return null
    const schema = SCHEMA_MAP[propertyType]
    if (!schema) return null
    return getSecretaryFields(schema)
  }, [propertyType])

  // Static fields used when no propertyType is provided (legacy behaviour)
  const staticFields: SchemaField[] = [
    { key: 'transcript_summary', label: '謄本摘要', type: 'textarea', required: false },
    { key: 'cadastral_map_ref', label: '地籍圖參考', type: 'text', required: false },
    { key: 'land_use_zoning', label: '使用分區', type: 'text', required: false },
    {
      key: 'mortgage_lien_status',
      label: '抵押/查封狀況',
      type: 'select',
      required: false,
      options: ['無', '有抵押', '有查封', '有抵押及查封'],
    },
    { key: 'additional_notes', label: '其他備註', type: 'textarea', required: false },
  ]

  const activeFields = dynamicFields ?? staticFields

  const preCommissionEntries = useMemo(() => {
    if (!preCommissionData || typeof preCommissionData !== 'object') return []

    const entries = Object.entries(preCommissionData).filter(([, value]) => value !== undefined)
    const priorityEntries = PRECOMMISSION_PRIORITY_KEYS
      .map((key) => entries.find(([entryKey]) => entryKey === key))
      .filter((entry): entry is [string, unknown] => entry !== undefined)
    const priorityKeySet = new Set(priorityEntries.map(([key]) => key))
    const otherEntries = entries.filter(([key]) => !priorityKeySet.has(key))

    return [...priorityEntries, ...otherEntries]
  }, [preCommissionData])


  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleGenerateDocuments = () => {
    const payload: Record<string, unknown> = {}
    if (propertyType) {
      payload.property_type = propertyType
    }

    for (const field of activeFields) {
      const raw = form[field.key] ?? ''
      if (raw.trim() === '') continue // 空值省略

      if (field.type === 'number') {
        payload[field.key] = Number(raw)
      } else {
        payload[field.key] = raw.trim()
      }
    }

    onSubmit(payload)
    onGenerateDocuments()
  }

  const renderField = (field: SchemaField) => {
    const value = form[field.key] ?? ''
    const labelWithUnit = formatLabelWithUnit(field.label, field.key)
    const labelText = `${labelWithUnit}${field.required ? ' *' : ''}`
    const isWide = field.type === 'textarea'

    // Task 4.4: 取得此欄位的 provenance 資料
    const fieldProvenance = mergedFields?.[field.key]
    const provenanceBadge = fieldProvenance ? (
      <ProvenanceBadge
        provenance={fieldProvenance.provenance}
        confidence={fieldProvenance.confidence}
      />
    ) : null

    // 欄位標籤列（label 文字 + provenance 徽章）
    const labelRow = (
      <span className="flex items-center gap-1.5">
        <span>{labelText}</span>
        {provenanceBadge}
      </span>
    )

    if (field.type === 'select' && field.options) {
      return (
        <label
          key={field.key}
          className="block text-sm font-medium text-slate-700"
        >
          {labelRow}
          <select
            value={value}
            onChange={(e) => updateField(field.key, e.target.value)}
            className={inputClassName}
          >
            <option value="">請選擇${field.label}</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      )
    }

    if (field.type === 'textarea') {
      return (
        <label
          key={field.key}
          className={`block text-sm font-medium text-slate-700 ${isWide ? 'lg:col-span-2' : ''}`}
        >
          {labelRow}
          <textarea
            value={value}
            onChange={(e) => updateField(field.key, e.target.value)}
            className={`${inputClassName} min-h-28 resize-y`}
            placeholder={`請輸入${field.label}`}
          />
        </label>
      )
    }

    return (
      <label key={field.key} className="block text-sm font-medium text-slate-700">
        {labelRow}
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(e) => updateField(field.key, e.target.value)}
          className={inputClassName}
          placeholder={`請輸入${field.label}`}
        />
      </label>
    )
  }

  return (
    <section className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">補件表單</h2>
      <p className="mt-1 text-sm text-slate-600">請先補齊必要資料，再產出文件。</p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="w-full text-left text-sm font-medium text-slate-800"
        >
          {isExpanded ? '▼' : '▶'} 委託前已查資料
        </button>

        {isExpanded && (
          <div className="mt-3">
            {preCommissionEntries.length === 0 ? (
              <p className="text-sm text-slate-500">無委託前資料</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-100">
                <table className="min-w-full text-sm text-slate-700">
                  <tbody>
                    {preCommissionEntries.map(([key, value]) => (
                      <tr key={key} className="border-b border-slate-200 last:border-b-0">
                        <th className="w-1/3 px-3 py-2 text-left font-medium text-slate-600">{key}</th>
                        <td className="px-3 py-2 break-all">{formatReadonlyValue(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {activeFields.length === 0 ? (
          <p className="text-sm text-slate-500 lg:col-span-2">此物件類型尚無補件欄位。</p>
        ) : (
          activeFields.map(renderField)
        )}

        <div className="flex justify-end lg:col-span-2">
          <button
            type="button"
            onClick={handleGenerateDocuments}
            className="rounded-lg bg-green-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            產出文件
          </button>
        </div>
      </div>
    </section>
  )
}
