import type { PropertyType } from '@/lib/property-types'
import { PROPERTY_TYPES } from '@/lib/property-types'

export type SourceType = 'field-visit' | 'secretary' | 'computed'

export type DisplayMode = 'fixed' | 'estimate' | 'blank'

export type FieldSchema = {
  key: string
  label: string
  type: string
  required: boolean
  options?: string[]
  sourceType?: string
  displayMode?: string
}

export type FullSchema = {
  common: FieldSchema[]
  building_common?: FieldSchema[]
  land_common?: FieldSchema[]
  type_specific: FieldSchema[]
  supplementary_specific?: FieldSchema[]
}

export type ChapterId =
  | 'basic'
  | 'property'
  | 'status'
  | 'facilities'
  | 'legal'
  | 'tax'
  | 'media'
  | 'supplementary'
  | 'notes'

export type Chapter = {
  id: ChapterId
  title: string
  fields: FieldSchema[]
}

type LayerName = 'common' | 'building_common' | 'land_common' | 'type_specific' | 'supplementary_specific'

const LEGAL_KEYWORDS = ['抵押', '查封', '地役', '權利', '法律']

const TAX_KEYWORDS = ['稅', '費', '管理費', '規費']

const FACILITY_KEYWORDS = ['停車', '電梯', '設備', '公設', '保全', '灌溉']

const STATUS_KEYWORDS = ['現況', '使用']

const MEDIA_KEYWORDS = ['照片', '相片', '文件', '上傳', '附件']

const NOTE_KEYWORDS = ['備註', '優缺點', '說明']

const BASIC_KEYS = new Set(['total_price', 'address', 'usage'])

const PROPERTY_KEYS = new Set([
  'building_area',
  'floor_count',
  'year_built',
  'structure',
  'land_number',
  'land_area',
  'land_shape',
  'road_width',
])

const LEGAL_KEYS = new Set([
  'mortgage_lien_status',
  'mortgage_status',
  'seizure_status',
  'easement_status',
  'rights_registration',
])

const TAX_KEYS = new Set([
  'land_tax',
  'house_tax',
  'management_fee',
  'maintenance_fee',
])

const FACILITY_KEYS = new Set([
  'parking_spaces',
  'elevator_count',
  'amenities',
  'security_system',
  'irrigation_status',
  'additional_facilities',
])

const STATUS_KEYS = new Set(['current_status', 'occupancy_status', 'usage_status'])

const MEDIA_KEYS = new Set([
  'photos',
  'photo_uploads',
  'attachments',
  'additional_documents',
  'documents',
  'files',
])

const NOTE_KEYS = new Set(['pros_cons', 'notes', 'additional_notes', 'seller_notes'])

const containsAnyKeyword = (text: string, keywords: readonly string[]): boolean =>
  keywords.some((keyword) => text.includes(keyword))

const resolveChapterId = (
  field: FieldSchema,
  layer: LayerName,
  propertyCategory: 'building' | 'land'
): ChapterId => {
  const label = field.label
  const key = field.key

  if (layer === 'supplementary_specific') {
    return 'supplementary'
  }

  if (NOTE_KEYS.has(key) || containsAnyKeyword(label, NOTE_KEYWORDS)) {
    return 'notes'
  }

  if (field.type === 'file' || MEDIA_KEYS.has(key) || containsAnyKeyword(label, MEDIA_KEYWORDS)) {
    return 'media'
  }

  if (LEGAL_KEYS.has(key) || containsAnyKeyword(label, LEGAL_KEYWORDS)) {
    return 'legal'
  }

  if (TAX_KEYS.has(key) || containsAnyKeyword(label, TAX_KEYWORDS)) {
    return 'tax'
  }

  if (FACILITY_KEYS.has(key) || containsAnyKeyword(label, FACILITY_KEYWORDS)) {
    return 'facilities'
  }

  // C1 fix: key-based checks before keyword-based STATUS check
  // prevents 'usage' (BASIC_KEYS) from being intercepted by '使用' keyword
  if (BASIC_KEYS.has(key)) {
    return 'basic'
  }

  if (PROPERTY_KEYS.has(key)) {
    return 'property'
  }

  if (STATUS_KEYS.has(key) || containsAnyKeyword(label, STATUS_KEYWORDS)) {
    return 'status'
  }

  if (layer === 'building_common' || layer === 'land_common') {
    return 'property'
  }

  if (layer === 'common') {
    return propertyCategory === 'building' ? 'basic' : 'property'
  }

  // C2 fix: type_specific fields that don't match any Set/keyword belong to
  // 'property', not 'facilities' (e.g. farmland water source, office rent fields)
  if (layer === 'type_specific') {
    return 'property'
  }

  return 'facilities'
}

const buildChapterSkeleton = (propertyType: PropertyType): Chapter[] => {
  const isBuilding = PROPERTY_TYPES[propertyType]?.category === 'building'
  const propertyChapterTitle = isBuilding ? '建物資訊' : '土地資訊'

  return [
    { id: 'basic', title: '基本資訊', fields: [] },
    { id: 'property', title: propertyChapterTitle, fields: [] },
    { id: 'status', title: '現況調查', fields: [] },
    { id: 'facilities', title: '設備設施', fields: [] },
    { id: 'legal', title: '法律狀態', fields: [] },
    { id: 'tax', title: '稅費資訊', fields: [] },
    { id: 'media', title: '照片/文件', fields: [] },
    { id: 'supplementary', title: '秘書後補', fields: [] },
    { id: 'notes', title: '備註', fields: [] },
  ]
}

export function groupFieldsByChapter(schema: FullSchema, propertyType: PropertyType): Chapter[] {
  const propertyCategory = PROPERTY_TYPES[propertyType]?.category ?? 'building'
  const chapters = buildChapterSkeleton(propertyType)
  const chapterMap = new Map<ChapterId, Chapter>(chapters.map((chapter) => [chapter.id, chapter]))
  const seenKeys = new Set<string>()

  const pushLayer = (fields: FieldSchema[] | undefined, layer: LayerName) => {
    if (!fields || fields.length === 0) {
      return
    }

    for (const field of fields) {
      if (seenKeys.has(field.key)) {
        continue
      }

      seenKeys.add(field.key)
      const chapterId = resolveChapterId(field, layer, propertyCategory)
      const chapter = chapterMap.get(chapterId)
      if (!chapter) {
        continue
      }

      chapter.fields.push(field)
    }
  }

  pushLayer(schema.common, 'common')
  pushLayer(schema.building_common, 'building_common')
  pushLayer(schema.land_common, 'land_common')
  pushLayer(schema.type_specific, 'type_specific')
  pushLayer(schema.supplementary_specific, 'supplementary_specific')

  return chapters
}
