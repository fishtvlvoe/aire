'use client'

import { useEffect, useMemo, useState } from 'react'
import type { PropertyType } from '@/lib/property-types'
import { PROPERTY_TYPES } from '@/lib/property-types'
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

// Schema field definition — sourceType may be absent in older schemas (treat as field-visit)
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

// Return all field-visit fields from a schema (common + building/land_common + type_specific)
const getFieldVisitFields = (schema: PropertySchema): SchemaField[] => {
  const isFieldVisit = (f: SchemaField) =>
    f.sourceType === 'field-visit' || f.sourceType === undefined

  const common = schema.common.filter(isFieldVisit)
  const middle = (schema.building_common ?? schema.land_common ?? []).filter(isFieldVisit)
  const specific = schema.type_specific.filter(isFieldVisit)

  return [...common, ...middle, ...specific]
}

export type FieldVisitFormProps = {
  onSave: (formData: Record<string, unknown>, isComplete: boolean) => void
  /** When provided, the property-type selector is hidden and this value is used */
  propertyType?: PropertyType
}

const inputClassName =
  'mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-base leading-6 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'

export default function FieldVisitForm({ onSave, propertyType: propPropertyType }: FieldVisitFormProps) {
  const [internalType, setInternalType] = useState<PropertyType>('apartment')
  const activeType: PropertyType = propPropertyType ?? internalType

  const [form, setForm] = useState<Record<string, string>>({})

  const schema = SCHEMA_MAP[activeType]
  const fields = useMemo(() => getFieldVisitFields(schema), [schema])

  // Reset form values when property type changes
  useEffect(() => {
    setForm({})
  }, [activeType])

  const isComplete = useMemo(() => {
    const required = fields.filter((f) => f.required)
    return required.every((f) => {
      const val = form[f.key] ?? ''
      return val.trim() !== ''
    })
  }, [fields, form])

  useEffect(() => {
    const formData: Record<string, unknown> = { property_type: activeType }
    for (const field of fields) {
      const raw = form[field.key] ?? ''
      if (field.type === 'number') {
        formData[field.key] = raw === '' ? null : Number(raw)
      } else {
        formData[field.key] = raw.trim()
      }
    }
    onSave(formData, isComplete)
  }, [activeType, fields, form, isComplete, onSave])

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const renderField = (field: SchemaField) => {
    const value = form[field.key] ?? ''
    const labelText = `${field.label}${field.required ? ' *' : ''}`

    if (field.type === 'select' && field.options) {
      return (
        <label key={field.key} className="block text-sm font-medium text-slate-700">
          {labelText}
          <select
            value={value}
            onChange={(e) => updateField(field.key, e.target.value)}
            className={inputClassName}
            required={field.required}
          >
            <option value="">請選擇</option>
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
        <label key={field.key} className="block text-sm font-medium text-slate-700">
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
    <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">現勘表單</h2>
      <p className="mt-1 text-sm text-slate-600">請先選擇物件類型，再填寫對應欄位。</p>

      {/* Property type selector — only shown when not controlled externally */}
      {propPropertyType === undefined && (
        <div className="mt-5">
          <p className="text-sm font-medium text-slate-700">物件類型</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(Object.keys(PROPERTY_TYPES) as PropertyType[]).map((type) => {
              const info = PROPERTY_TYPES[type]
              return (
                <label key={type} className="cursor-pointer">
                  <input
                    type="radio"
                    name="field_visit_property_type"
                    value={type}
                    checked={internalType === type}
                    onChange={() => setInternalType(type)}
                    className="sr-only"
                  />
                  <span
                    className={`flex min-h-12 items-center justify-center rounded-lg border px-2 py-2 text-sm ${
                      internalType === type
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    {info.displayName}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {fields.length === 0 ? (
          <p className="text-sm text-slate-500">此物件類型尚無現勘欄位。</p>
        ) : (
          fields.map(renderField)
        )}
      </div>
    </section>
  )
}
