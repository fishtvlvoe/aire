export type FieldPage = 'cover' | 'content';

export interface FieldPosition {
  fieldKey: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  page: FieldPage;
}

export const DEFAULT_COVER_FIELDS: FieldPosition[] = [];

export const DEFAULT_CONTENT_FIELDS: FieldPosition[] = [
  { fieldKey: 'object-id', label: '物件編號', x: 24, y: 21.5, width: 58, height: 2.8, fontSize: 13, textAlign: 'left', page: 'cover' },
  { fieldKey: 'object-name', label: '物件名稱', x: 22, y: 27, width: 60, height: 2.8, fontSize: 13, textAlign: 'left', page: 'cover' },
  { fieldKey: 'agent-name', label: '承辦人', x: 14, y: 71, width: 16, height: 3, fontSize: 12, textAlign: 'center', page: 'cover' },
  { fieldKey: 'store-name', label: '店長', x: 30, y: 71, width: 16, height: 3, fontSize: 12, textAlign: 'center', page: 'cover' },
  { fieldKey: 'broker-name', label: '經紀人', x: 46, y: 71, width: 16, height: 3, fontSize: 12, textAlign: 'center', page: 'cover' },
  { fieldKey: 'broker-cert', label: '經紀人證書', x: 62, y: 71, width: 22, height: 3, fontSize: 12, textAlign: 'center', page: 'cover' },
  { fieldKey: 'company-name', label: '公司名稱', x: 24, y: 77, width: 58, height: 2.8, fontSize: 12, textAlign: 'left', page: 'cover' },
  { fieldKey: 'company-address', label: '地址', x: 24, y: 81, width: 58, height: 2.8, fontSize: 12, textAlign: 'left', page: 'cover' },
  { fieldKey: 'company-phone', label: '電話', x: 24, y: 85, width: 35, height: 2.8, fontSize: 12, textAlign: 'left', page: 'cover' },
  { fieldKey: 'document-date', label: '日期', x: 24, y: 89, width: 40, height: 2.8, fontSize: 12, textAlign: 'left', page: 'cover' },
];
