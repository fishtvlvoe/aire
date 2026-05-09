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

export const DEFAULT_COVER_FIELDS: FieldPosition[] = [
  { fieldKey: 'object-id', label: '物件編號', x: 28, y: 24, width: 40, height: 3, fontSize: 14, textAlign: 'left', page: 'cover' },
  { fieldKey: 'object-name', label: '物件名稱', x: 28, y: 28, width: 55, height: 3, fontSize: 14, textAlign: 'left', page: 'cover' },
  { fieldKey: 'agent-name', label: '委託人', x: 15, y: 65, width: 18, height: 3, fontSize: 13, textAlign: 'center', page: 'cover' },
  { fieldKey: 'store-name', label: '店名', x: 33, y: 65, width: 18, height: 3, fontSize: 13, textAlign: 'center', page: 'cover' },
  { fieldKey: 'broker-name', label: '經紀人', x: 51, y: 65, width: 18, height: 3, fontSize: 13, textAlign: 'center', page: 'cover' },
  { fieldKey: 'broker-cert', label: '經紀人證書', x: 69, y: 65, width: 18, height: 3, fontSize: 13, textAlign: 'center', page: 'cover' },
  { fieldKey: 'company-name', label: '公司名稱', x: 28, y: 78, width: 55, height: 3, fontSize: 13, textAlign: 'left', page: 'cover' },
  { fieldKey: 'company-address', label: '地址', x: 28, y: 82, width: 55, height: 3, fontSize: 13, textAlign: 'left', page: 'cover' },
  { fieldKey: 'company-phone', label: '電話', x: 28, y: 86, width: 30, height: 3, fontSize: 13, textAlign: 'left', page: 'cover' },
  { fieldKey: 'document-date', label: '日期', x: 28, y: 90, width: 30, height: 3, fontSize: 13, textAlign: 'left', page: 'cover' },
];

export const DEFAULT_CONTENT_FIELDS: FieldPosition[] = [];
