'use client'

import { useEffect, useMemo, useState } from 'react'

type PropertyType = 'residential' | 'farmland'

type FieldVisitFormProps = {
  onSave: (formData: Record<string, unknown>, isComplete: boolean) => void
}

type FormState = {
  address: string
  asking_price: string
  floor_area: string
  building_age: string
  layout: string
  floor_number: string
  total_floors: string
  parking_space: string
  land_area: string
  land_category: string
  irrigation_access: string
  road_frontage: string
  site_notes: string
}

const inputClassName =
  'mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-base leading-6 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'

const toNumber = (value: string): number => Number(value)

const isValidNumberInput = (value: string): boolean => {
  if (value.trim() === '') {
    return false
  }

  return !Number.isNaN(Number(value))
}

const buildFormData = (type: PropertyType, form: FormState): Record<string, unknown> => {
  if (type === 'residential') {
    return {
      property_type: 'residential',
      address: form.address.trim(),
      asking_price: toNumber(form.asking_price),
      floor_area: toNumber(form.floor_area),
      building_age: toNumber(form.building_age),
      layout: form.layout.trim(),
      floor_number: toNumber(form.floor_number),
      total_floors: toNumber(form.total_floors),
      parking_space: form.parking_space,
      site_notes: form.site_notes.trim(),
    }
  }

  return {
    property_type: 'farmland',
    address: form.address.trim(),
    land_area: toNumber(form.land_area),
    land_category: form.land_category.trim(),
    irrigation_access: form.irrigation_access,
    road_frontage: form.road_frontage.trim(),
    site_notes: form.site_notes.trim(),
  }
}

export default function FieldVisitForm({ onSave }: FieldVisitFormProps) {
  const [propertyType, setPropertyType] = useState<PropertyType>('residential')
  const [form, setForm] = useState<FormState>({
    address: '',
    asking_price: '',
    floor_area: '',
    building_age: '',
    layout: '',
    floor_number: '',
    total_floors: '',
    parking_space: '',
    land_area: '',
    land_category: '',
    irrigation_access: '',
    road_frontage: '',
    site_notes: '',
  })

  const isComplete = useMemo(() => {
    if (propertyType === 'residential') {
      return (
        form.address.trim() !== '' &&
        isValidNumberInput(form.asking_price) &&
        isValidNumberInput(form.floor_area) &&
        isValidNumberInput(form.building_age) &&
        form.layout.trim() !== '' &&
        isValidNumberInput(form.floor_number) &&
        isValidNumberInput(form.total_floors) &&
        form.parking_space.trim() !== ''
      )
    }

    return (
      form.address.trim() !== '' &&
      isValidNumberInput(form.land_area) &&
      form.land_category.trim() !== '' &&
      form.irrigation_access.trim() !== '' &&
      form.road_frontage.trim() !== ''
    )
  }, [propertyType, form])

  useEffect(() => {
    const formData = buildFormData(propertyType, form)
    onSave(formData, isComplete)
  }, [propertyType, form, isComplete, onSave])

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">現勘表單</h2>

      <p className="mt-1 text-sm text-slate-600">請先選擇物件類型，再填寫對應欄位。</p>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-700">物件類型</p>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="cursor-pointer">
            <input
              type="radio"
              name="property_type"
              value="residential"
              checked={propertyType === 'residential'}
              onChange={() => setPropertyType('residential')}
              className="sr-only"
            />

            <span
              className={`flex min-h-12 items-center justify-center rounded-lg border px-3 py-3 text-base ${
                propertyType === 'residential'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              住宅
            </span>
          </label>

          <label className="cursor-pointer">
            <input
              type="radio"
              name="property_type"
              value="farmland"
              checked={propertyType === 'farmland'}
              onChange={() => setPropertyType('farmland')}
              className="sr-only"
            />

            <span
              className={`flex min-h-12 items-center justify-center rounded-lg border px-3 py-3 text-base ${
                propertyType === 'farmland'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              農地
            </span>
          </label>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          地址
          <input
            type="text"
            value={form.address}
            onChange={(event) => updateField('address', event.target.value)}
            className={inputClassName}
            placeholder="請輸入地址"
            required
          />
        </label>

        {propertyType === 'residential' ? (
          <>
            <label className="block text-sm font-medium text-slate-700">
              開價
              <input
                type="number"
                value={form.asking_price}
                onChange={(event) => updateField('asking_price', event.target.value)}
                className={inputClassName}
                placeholder="請輸入開價"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              坪數
              <input
                type="number"
                value={form.floor_area}
                onChange={(event) => updateField('floor_area', event.target.value)}
                className={inputClassName}
                placeholder="請輸入坪數"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              屋齡
              <input
                type="number"
                value={form.building_age}
                onChange={(event) => updateField('building_age', event.target.value)}
                className={inputClassName}
                placeholder="請輸入屋齡"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              格局
              <input
                type="text"
                value={form.layout}
                onChange={(event) => updateField('layout', event.target.value)}
                className={inputClassName}
                placeholder="例：3房2廳2衛"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              樓層
              <input
                type="number"
                value={form.floor_number}
                onChange={(event) => updateField('floor_number', event.target.value)}
                className={inputClassName}
                placeholder="請輸入樓層"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              總樓層
              <input
                type="number"
                value={form.total_floors}
                onChange={(event) => updateField('total_floors', event.target.value)}
                className={inputClassName}
                placeholder="請輸入總樓層"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              車位
              <select
                value={form.parking_space}
                onChange={(event) => updateField('parking_space', event.target.value)}
                className={inputClassName}
                required
              >
                <option value="">請選擇車位類型</option>
                <option value="無">無</option>
                <option value="坡道平面">坡道平面</option>
                <option value="坡道機械">坡道機械</option>
                <option value="塔式機械">塔式機械</option>
              </select>
            </label>
          </>
        ) : (
          <>
            <label className="block text-sm font-medium text-slate-700">
              地積
              <input
                type="number"
                value={form.land_area}
                onChange={(event) => updateField('land_area', event.target.value)}
                className={inputClassName}
                placeholder="請輸入地積"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              地目
              <input
                type="text"
                value={form.land_category}
                onChange={(event) => updateField('land_category', event.target.value)}
                className={inputClassName}
                placeholder="請輸入地目"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              水利設施
              <select
                value={form.irrigation_access}
                onChange={(event) => updateField('irrigation_access', event.target.value)}
                className={inputClassName}
                required
              >
                <option value="">請選擇是否有水利設施</option>
                <option value="有">有</option>
                <option value="無">無</option>
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              臨路狀況
              <input
                type="text"
                value={form.road_frontage}
                onChange={(event) => updateField('road_frontage', event.target.value)}
                className={inputClassName}
                placeholder="請輸入臨路狀況"
                required
              />
            </label>
          </>
        )}

        <label className="block text-sm font-medium text-slate-700">
          現場備註
          <textarea
            value={form.site_notes}
            onChange={(event) => updateField('site_notes', event.target.value)}
            className={`${inputClassName} min-h-28 resize-y`}
            placeholder="可選填現場觀察重點"
          />
        </label>
      </div>
    </section>
  )
}
