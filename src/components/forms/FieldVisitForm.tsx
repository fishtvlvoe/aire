'use client'

import { useEffect, useMemo, useState } from 'react'
import type { PropertyType } from '@/lib/property-types'
import { PROPERTY_TYPES } from '@/lib/property-types'
import {
  type ChapterId,
  type FieldSchema,
  type FullSchema,
  groupFieldsByChapter,
} from '@/lib/form-renderer/chapter-grouper'
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

const SCHEMA_MAP: Record<PropertyType, FullSchema> = {
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

export type FieldVisitFormProps = {
  onSave: (formData: Record<string, unknown>, isComplete: boolean) => void
  /** When provided, the property-type selector is hidden and this value is used */
  propertyType?: PropertyType
}

const inputClassName =
  'mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-base leading-6 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'

const getDisplayModeClassName = (field: FieldSchema): string => {
  if (field.displayMode === 'estimate') {
    return 'border-amber-300 bg-amber-50'
  }

  if (field.displayMode === 'blank') {
    return 'border-slate-300 bg-slate-100'
  }

  return 'bg-white'
}

const getDisplayModeHelper = (field: FieldSchema): string | null => {
  if (field.displayMode === 'estimate') {
    return '估算值'
  }

  return null
}

const getChapterBadgeClassName = (filled: number, total: number): string => {
  if (total === 0 || filled === 0) {
    return 'bg-slate-100 text-slate-600'
  }

  if (filled === total) {
    return 'bg-emerald-100 text-emerald-700'
  }

  return 'bg-amber-100 text-amber-700'
}

export default function FieldVisitForm({ onSave, propertyType: propPropertyType }: FieldVisitFormProps) {
  const [internalType, setInternalType] = useState<PropertyType>('apartment')
  const activeType: PropertyType = propPropertyType ?? internalType

  const [form, setForm] = useState<Record<string, string>>({})
  const [activeChapterId, setActiveChapterId] = useState<ChapterId>('basic')

  const schema = SCHEMA_MAP[activeType]
  const chapters = useMemo(() => groupFieldsByChapter(schema, activeType), [activeType, schema])
  const allFields = useMemo(() => chapters.flatMap((chapter) => chapter.fields), [chapters])
  const activeChapter = useMemo(
    () => chapters.find((chapter) => chapter.id === activeChapterId) ?? chapters[0],
    [activeChapterId, chapters]
  )
  const chapterCompletion = useMemo(
    () =>
      chapters.map((chapter) => {
        const requiredFields = chapter.fields.filter((field) => field.required)
        const totalRequired = requiredFields.length
        const filledRequired = requiredFields.filter((field) => (form[field.key] ?? '').trim() !== '').length
        return { chapterId: chapter.id, totalRequired, filledRequired }
      }),
    [chapters, form]
  )

  // Reset form values and tab when property type changes
  useEffect(() => {
    setForm({})
    setActiveChapterId('basic')
  }, [activeType])

  const isComplete = useMemo(() => {
    const required = allFields.filter((f) => f.required)
    return required.every((f) => {
      const val = form[f.key] ?? ''
      return val.trim() !== ''
    })
  }, [allFields, form])

  useEffect(() => {
    const formData: Record<string, unknown> = { property_type: activeType }
    for (const field of allFields) {
      const raw = form[field.key] ?? ''
      if (field.type === 'number') {
        formData[field.key] = raw === '' ? null : Number(raw)
      } else {
        formData[field.key] = raw.trim()
      }
    }
    onSave(formData, isComplete)
  }, [activeType, allFields, form, isComplete, onSave])

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const renderField = (field: FieldSchema) => {
    const value = form[field.key] ?? ''
    const labelText = `${field.label}${field.required ? ' *' : ''}`
    const modeClassName = getDisplayModeClassName(field)
    const helperText = getDisplayModeHelper(field)
    const placeholder = field.displayMode === 'blank' ? '秘書後補' : `請輸入${field.label}`

    if (field.type === 'select' && field.options) {
      return (
        <label key={field.key} className="block text-sm font-medium text-slate-700">
          {labelText}
          <select
            value={value}
            onChange={(e) => updateField(field.key, e.target.value)}
            className={`${inputClassName} ${modeClassName}`}
            required={field.required}
          >
            <option value="">{field.displayMode === 'blank' ? '秘書後補' : '請選擇'}</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {helperText ? <p className="mt-1 text-xs text-amber-700">{helperText}</p> : null}
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
            className={`${inputClassName} min-h-28 resize-y ${modeClassName}`}
            placeholder={placeholder}
            required={field.required}
          />
          {helperText ? <p className="mt-1 text-xs text-amber-700">{helperText}</p> : null}
        </label>
      )
    }

    if (field.type === 'file') {
      return (
        <label key={field.key} className="block text-sm font-medium text-slate-700">
          {labelText}
          <input
            type="file"
            onChange={(e) => {
              const files = e.target.files ? Array.from(e.target.files).map((file) => file.name) : []
              updateField(field.key, files.join(', '))
            }}
            className={`${inputClassName} ${modeClassName}`}
            required={field.required}
          />
          {helperText ? <p className="mt-1 text-xs text-amber-700">{helperText}</p> : null}
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
          className={`${inputClassName} ${modeClassName}`}
          placeholder={placeholder}
          required={field.required}
        />
        {helperText ? <p className="mt-1 text-xs text-amber-700">{helperText}</p> : null}
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

      <div className="mt-6">
        <p className="text-sm font-medium text-slate-700">章節導覽</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {chapters.map((chapter) => {
            const progress = chapterCompletion.find((item) => item.chapterId === chapter.id)
            const filledRequired = progress?.filledRequired ?? 0
            const totalRequired = progress?.totalRequired ?? 0
            const isActive = activeChapter?.id === chapter.id
            return (
              <button
                key={chapter.id}
                type="button"
                onClick={() => setActiveChapterId(chapter.id)}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{chapter.title}</span>
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${getChapterBadgeClassName(
                    filledRequired,
                    totalRequired
                  )}`}
                >
                  {filledRequired}/{totalRequired}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <h3 className="text-base font-semibold text-slate-900">{activeChapter?.title}</h3>
        {(activeChapter?.fields.length ?? 0) === 0 ? (
          <p className="text-sm text-slate-500">此章節目前沒有欄位。</p>
        ) : (
          activeChapter.fields.map(renderField)
        )}
      </div>
    </section>
  )
}
