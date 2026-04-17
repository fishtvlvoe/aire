'use client'

import { useMemo, useState } from 'react'
import type { PropertyType } from '@/lib/property-types'
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
}

const inputClassName =
  'mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'

export default function SupplementaryForm({
  onSubmit,
  onGenerateDocuments,
  propertyType,
}: SupplementaryFormProps) {
  const [form, setForm] = useState<Record<string, string>>({})

  // Dynamic fields based on schema; fall back to built-in static fields
  const dynamicFields = useMemo<SchemaField[] | null>(() => {
    if (!propertyType) return null
    const schema = SCHEMA_MAP[propertyType]
    if (!schema) return null
    return getSecretaryFields(schema)
  }, [propertyType])

  // Static fields used when no propertyType is provided (legacy behaviour)
  const staticFields: SchemaField[] = [
    { key: 'transcript_summary', label: '謄本摘要', type: 'textarea', required: true },
    { key: 'cadastral_map_ref', label: '地籍圖參考', type: 'text', required: true },
    { key: 'land_use_zoning', label: '使用分區', type: 'text', required: true },
    {
      key: 'mortgage_lien_status',
      label: '抵押/查封狀況',
      type: 'select',
      required: true,
      options: ['無', '有抵押', '有查封', '有抵押及查封'],
    },
    { key: 'additional_notes', label: '其他備註', type: 'textarea', required: false },
  ]

  const activeFields = dynamicFields ?? staticFields

  const isComplete = useMemo(() => {
    const required = activeFields.filter((f) => f.required)
    return required.every((f) => (form[f.key] ?? '').trim() !== '')
  }, [activeFields, form])

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleGenerateDocuments = () => {
    if (!isComplete) return

    const payload: Record<string, unknown> = {}
    if (propertyType) {
      payload.property_type = propertyType
    }
    for (const field of activeFields) {
      const raw = form[field.key] ?? ''
      if (field.type === 'number') {
        payload[field.key] = raw === '' ? null : Number(raw)
      } else {
        payload[field.key] = raw.trim()
      }
    }

    onSubmit(payload)
    onGenerateDocuments()
  }

  const renderField = (field: SchemaField) => {
    const value = form[field.key] ?? ''
    const labelText = `${field.label}${field.required ? ' *' : ''}`
    const isWide = field.type === 'textarea'

    if (field.type === 'select' && field.options) {
      return (
        <label
          key={field.key}
          className="block text-sm font-medium text-slate-700"
        >
          {labelText}
          <select
            value={value}
            onChange={(e) => updateField(field.key, e.target.value)}
            className={inputClassName}
            required={field.required}
          >
            <option value="">請選擇狀況</option>
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
          {labelText}
          <textarea
            value={value}
            onChange={(e) => updateField(field.key, e.target.value)}
            className={`${inputClassName} min-h-28 resize-y`}
            required={field.required}
          />
        </label>
      )
    }

    return (
      <label key={field.key} className="block text-sm font-medium text-slate-700">
        {labelText}
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(e) => updateField(field.key, e.target.value)}
          className={inputClassName}
          placeholder={`請輸入${field.label}`}
          required={field.required}
        />
      </label>
    )
  }

  return (
    <section className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">補件表單</h2>
      <p className="mt-1 text-sm text-slate-600">請先補齊必要資料，再產出文件。</p>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {activeFields.length === 0 ? (
          <p className="text-sm text-slate-500 lg:col-span-2">此物件類型尚無補件欄位。</p>
        ) : (
          activeFields.map(renderField)
        )}

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
