import { PropertyType, PROPERTY_TYPES } from '../property-types';
import * as schemas from '../property-types/schemas';

export type FieldLayer = 'common' | 'building_common' | 'land_common' | 'type_specific';

export type SourceType = 'field-visit' | 'secretary' | 'computed';
export type DisplayMode = 'fixed' | 'estimate' | 'blank';

export interface FieldSchema {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  sourceType?: SourceType;
  displayMode?: DisplayMode;
}

export function getFieldsForLayer(
  propertyType: PropertyType,
  layer: FieldLayer
): FieldSchema[] {
  const typeInfo = PROPERTY_TYPES[propertyType];
  if (!typeInfo) return [];

  // 'commercial-land' → 'commercialLandSchema'
  const camelKey = propertyType.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  const schemaModule = (schemas as unknown as Record<string, unknown>)[`${camelKey}Schema`];
  if (!schemaModule || typeof schemaModule !== 'object') return [];

  const layerValue = (schemaModule as Record<string, unknown>)[layer];
  return Array.isArray(layerValue) ? (layerValue as FieldSchema[]) : [];
}

export function getAllFieldsForVisit(propertyType: PropertyType): {
  common: FieldSchema[];
  categoryCommon: FieldSchema[];
  typeSpecific: FieldSchema[];
} {
  const typeInfo = PROPERTY_TYPES[propertyType];
  if (!typeInfo) return { common: [], categoryCommon: [], typeSpecific: [] };

  const common = getFieldsForLayer(propertyType, 'common');
  const categoryLayer = typeInfo.category === 'building' ? 'building_common' : 'land_common';
  const categoryCommon = getFieldsForLayer(propertyType, categoryLayer as FieldLayer);
  const typeSpecific = getFieldsForLayer(propertyType, 'type_specific');

  return { common, categoryCommon, typeSpecific };
}
