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

  // 導入對應的 schema
  const schemaModule = (schemas as any)[`${propertyType.replace(/-/g, '')}Schema`];
  if (!schemaModule) return [];

  return schemaModule[layer] || [];
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
