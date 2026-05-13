export type PropertyCategory = 'building' | 'land';

export type PropertyType =
  | 'farmland'
  | 'townhouse'
  | 'apartment'
  | 'highrise'
  | 'residential-land'
  | 'farmhouse'
  | 'suite'
  | 'shop'
  | 'factory'
  | 'industrial-land'
  | 'commercial-land'
  | 'rural-land'
  | 'other-land';

export type PropertyTypeInfo = {
  id: PropertyType;
  displayName: string;
  category: PropertyCategory;
  available: boolean;
};

export const PROPERTY_TYPES: Record<PropertyType, PropertyTypeInfo> = {
  farmland: {
    id: 'farmland',
    displayName: '農地',
    category: 'land',
    available: true,
  },
  townhouse: {
    id: 'townhouse',
    displayName: '透天',
    category: 'building',
    available: true,
  },
  apartment: {
    id: 'apartment',
    displayName: '公寓',
    category: 'building',
    available: true,
  },
  highrise: {
    id: 'highrise',
    displayName: '大樓',
    category: 'building',
    available: true,
  },
  'residential-land': {
    id: 'residential-land',
    displayName: '住宅用地',
    category: 'land',
    available: true,
  },
  farmhouse: {
    id: 'farmhouse',
    displayName: '農舍',
    category: 'building',
    available: true,
  },
  suite: {
    id: 'suite',
    displayName: '套房',
    category: 'building',
    available: true,
  },
  shop: {
    id: 'shop',
    displayName: '店面',
    category: 'building',
    available: true,
  },
  factory: {
    id: 'factory',
    displayName: '工廠',
    category: 'building',
    available: true,
  },
  'industrial-land': {
    id: 'industrial-land',
    displayName: '工業用地',
    category: 'land',
    available: true,
  },
  'commercial-land': {
    id: 'commercial-land',
    displayName: '商業用地',
    category: 'land',
    available: true,
  },
  'rural-land': {
    id: 'rural-land',
    displayName: '鄉村用地',
    category: 'land',
    available: true,
  },
  'other-land': {
    id: 'other-land',
    displayName: '其他用地',
    category: 'land',
    available: true,
  },
};

export const getPropertyType = (type: string): PropertyTypeInfo | undefined => {
  if (Object.prototype.hasOwnProperty.call(PROPERTY_TYPES, type)) {
    return PROPERTY_TYPES[type as PropertyType];
  }
  return undefined;
};
